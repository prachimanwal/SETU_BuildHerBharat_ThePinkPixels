import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { Assessment } from '../models/Assessment';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { Opportunity } from '../models/Opportunity';
import { LearningResource } from '../models/LearningResource';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { scoreOpportunityForUser } from './opportunity.controller';
import { evaluateSchemeForUser } from './scheme.controller';
import { sendSuccess, sendError } from '../utils/response';
import { profileUpdateSchema } from '../utils/validators';
import {
  calculateProfileCompletion,
  getProfileCompletionDetails,
  serializeUser
} from '../utils/userSerializer';

export { calculateProfileCompletion };

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const completion = getProfileCompletionDetails(req.user);

  sendSuccess(res, 'User profile fetched successfully', {
    user: serializeUser(req.user),
    profileCompletionPercentage: completion.completionPercentage,
    completedSections: completion.completedSections,
    missingSections: completion.missingSections
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parseResult = profileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Invalid profile fields', 400);
      return;
    }

    const { name, fullName, avatar, profilePicture, seekerProfile, employerProfile } =
      parseResult.data;
    const user = req.user;

    const resolvedName = name || fullName;
    if (resolvedName) {
      user.name = resolvedName;
      user.fullName = resolvedName;
    }

    const resolvedAvatar = profilePicture !== undefined ? profilePicture : avatar;
    if (resolvedAvatar !== undefined) {
      user.avatar = resolvedAvatar;
      user.profilePicture = resolvedAvatar;
    }

    if (user.role === 'seeker' && seekerProfile) {
      const existing = (user.seekerProfile || {}) as any;

      // Preserve server-verified skill status: never trust client-submitted verified flags
      const existingVerifiedMap = new Set<string>(
        (Array.isArray(existing.detailedSkills) ? existing.detailedSkills : [])
          .filter((s: any) => s?.verified || s?.source === 'assessment_verified')
          .map((s: any) => String(s.name || '').toLowerCase())
      );

      let mergedDetailedSkills = existing.detailedSkills || [];
      let mergedSkills = existing.skills || [];

      if (Array.isArray(seekerProfile.detailedSkills)) {
        const seen = new Set<string>();
        mergedDetailedSkills = seekerProfile.detailedSkills
          .filter((s) => {
            const key = s.name.trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((s) => {
            const isVerified = existingVerifiedMap.has(s.name.trim().toLowerCase());
            return {
              name: s.name.trim(),
              category: s.category || 'General',
              proficiency: s.proficiency || 'Beginner',
              verified: isVerified,
              source: isVerified ? 'assessment_verified' : 'self_reported',
              supportingTitle: s.supportingTitle || '',
              supportingUrl: s.supportingUrl || ''
            };
          });
        mergedSkills = mergedDetailedSkills.map((s: any) => s.name);
      } else if (Array.isArray(seekerProfile.skills)) {
        mergedSkills = seekerProfile.skills.map((s) => s.trim()).filter(Boolean);
        // Keep detailedSkills synchronized if only flat skills were submitted
        const existingMap = new Map<string, any>(
          (Array.isArray(existing.detailedSkills) ? existing.detailedSkills : []).map((s: any) => [
            String(s.name || '').toLowerCase(),
            s
          ])
        );
        mergedDetailedSkills = mergedSkills.map((sk: string) => {
          const prev = existingMap.get(sk.toLowerCase());
          const isVerified = existingVerifiedMap.has(sk.toLowerCase());
          return {
            name: sk,
            category: prev?.category || 'General',
            proficiency: prev?.proficiency || 'Intermediate',
            verified: isVerified,
            source: isVerified ? 'assessment_verified' : 'self_reported',
            supportingTitle: prev?.supportingTitle || '',
            supportingUrl: prev?.supportingUrl || ''
          };
        });
      }

      // Sync primary educationLevel from structured education array if provided
      let derivedEducationLevel = seekerProfile.educationLevel ?? existing.educationLevel ?? '';
      if (Array.isArray(seekerProfile.education) && seekerProfile.education.length > 0) {
        derivedEducationLevel = seekerProfile.education[0].level || derivedEducationLevel;
      }

      // Sync careerGoals text from careerGoalsList if provided
      let derivedCareerGoals = seekerProfile.careerGoals ?? existing.careerGoals ?? '';
      if (
        Array.isArray(seekerProfile.careerGoalsList) &&
        seekerProfile.careerGoalsList.length > 0 &&
        !seekerProfile.careerGoals
      ) {
        derivedCareerGoals = seekerProfile.careerGoalsList.join(', ');
      }

      // Sync preferredWorkMode from employmentPreferences.workModes if provided
      let derivedWorkMode = seekerProfile.preferredWorkMode ?? existing.preferredWorkMode ?? 'any';
      const workModes = seekerProfile.employmentPreferences?.workModes;
      if (Array.isArray(workModes) && workModes.length === 1) {
        const lower = workModes[0].toLowerCase();
        if (lower.includes('remote')) derivedWorkMode = 'remote';
        else if (lower.includes('hybrid')) derivedWorkMode = 'hybrid';
        else if (lower.includes('on-site') || lower.includes('onsite')) derivedWorkMode = 'onsite';
      } else if (Array.isArray(workModes) && workModes.length > 1) {
        derivedWorkMode = 'any';
      }

      // Sync experienceLevel from hasExperience / experience array
      let derivedExperienceLevel =
        seekerProfile.experienceLevel ?? existing.experienceLevel ?? '';
      if (seekerProfile.hasExperience === false) {
        derivedExperienceLevel = 'No previous experience / Fresher';
      } else if (
        Array.isArray(seekerProfile.experience) &&
        seekerProfile.experience.length > 0 &&
        !seekerProfile.experienceLevel
      ) {
        derivedExperienceLevel =
          seekerProfile.employmentPreferences?.yearsOfExperience || 'Experienced';
      }

      user.seekerProfile = {
        ...existing,
        ...seekerProfile,
        location: {
          city: seekerProfile.location?.city ?? existing.location?.city ?? '',
          state: seekerProfile.location?.state ?? existing.location?.state ?? '',
          country: seekerProfile.location?.country ?? existing.location?.country ?? 'India',
          isRural: seekerProfile.location?.isRural ?? existing.location?.isRural ?? false
        },
        employmentPreferences: {
          ...(existing.employmentPreferences || {}),
          ...(seekerProfile.employmentPreferences || {})
        },
        skills: mergedSkills,
        detailedSkills: mergedDetailedSkills,
        educationLevel: derivedEducationLevel,
        careerGoals: derivedCareerGoals,
        preferredWorkMode: derivedWorkMode,
        experienceLevel: derivedExperienceLevel
      } as any;
    } else if (user.role === 'employer' && employerProfile) {
      user.employerProfile = {
        ...user.employerProfile,
        ...employerProfile,
        // Preserve administrative verification status
        verificationStatus: user.employerProfile?.verificationStatus || 'pending'
      } as any;
    }

    const completion = getProfileCompletionDetails(user);
    user.profileCompletion = completion.completionPercentage;
    await user.save();

    sendSuccess(res, 'Profile updated successfully', {
      user: serializeUser(user),
      profileCompletionPercentage: completion.completionPercentage,
      completedSections: completion.completedSections,
      missingSections: completion.missingSections
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update profile', 500);
  }
};

export const getProfileCompletion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const completion = getProfileCompletionDetails(req.user);
  sendSuccess(res, 'Profile completion calculated', {
    completionPercentage: completion.completionPercentage,
    completedSections: completion.completedSections,
    missingSections: completion.missingSections,
    message:
      completion.completionPercentage === 100
        ? 'Your career profile is 100% complete!'
        : `Your profile is ${completion.completionPercentage}% complete. Complete the remaining sections for even better recommendations.`
  });
};

export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userId = req.user._id;

    // 1. Applications & Pipeline
    const applications = await Application.find({ seekerId: userId })
      .populate('opportunityId', 'title organisationName workMode stipendOrSalary location')
      .sort({ updatedAt: -1 });

    const statusCounts: Record<string, number> = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      Selected: 0,
      Rejected: 0
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    const interviewUpdates = applications
      .filter((app) => app.status === 'Interview Scheduled' && app.interviewDetails?.date)
      .map((app) => ({
        applicationId: app._id,
        opportunityTitle: (app.opportunityId as any)?.title || 'Job Opening',
        organisationName: (app.opportunityId as any)?.organisationName || '',
        interviewDetails: app.interviewDetails
      }));

    // 2. Assessment results & verified skills
    const attempts = await AssessmentResult.find({ userId })
      .populate('assessmentId', 'title domain')
      .sort({ completedAt: -1 });

    const passedAttempts = attempts.filter((att) => att.passed);
    const passedDomains = Array.from(new Set(passedAttempts.map((att) => att.domain)));
    const skillsVerifiedCount = passedDomains.length;

    // 3. Learning progress
    const learningProgress = await LearningProgress.find({ userId }).populate(
      'resourceId',
      'title type skillTag duration'
    );

    const completedLearning = learningProgress.filter((p) => p.status === 'completed');
    const startedLearning = learningProgress.filter((p) => p.status === 'started');

    // 4. Portfolio projects
    const portfolioProjects = await Portfolio.find({ userId }).sort({ createdAt: -1 });

    // 5. Recommended opportunities using profile-weighted matching
    const savedOppSet = new Set<string>(
      (req.user.savedOpportunities || []).map((id) => id.toString())
    );
    const appliedOppSet = new Set<string>(
      applications.map((app) => String((app.opportunityId as any)?._id || app.opportunityId))
    );
    const allPublishedOpps = await Opportunity.find({
      status: 'published',
      moderationStatus: 'clean'
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const recommendedOpportunities = allPublishedOpps
      .map((opp) => scoreOpportunityForUser(opp, req.user, savedOppSet, appliedOppSet))
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 3);

    // 6. Recommended learning resources prioritizing assessment gaps & interests
    const allResources = await LearningResource.find().limit(20);
    const completedResourceIds = new Set(
      completedLearning.map((p) => String((p.resourceId as any)?._id || p.resourceId))
    );
    const recentGaps = Array.from(
      new Set(attempts.slice(0, 4).flatMap((att) => (Array.isArray(att.gaps) ? att.gaps : [])))
    ).map((g) => g.toLowerCase());

    const recommendedLearning = allResources
      .filter((r) => !completedResourceIds.has(r._id.toString()))
      .map((r) => {
        const text = `${r.title} ${r.skillTag} ${(r.skillsGained || []).join(' ')} ${r.category}`.toLowerCase();
        const gapMatch = recentGaps.find((g) => g.length >= 2 && text.includes(g));
        return {
          ...r.toObject(),
          recommendationReason: gapMatch
            ? `Strengthens your gap in ${gapMatch}`
            : `Builds practical ${r.category || r.skillTag} skills`,
          _rank: gapMatch ? 100 : 20
        };
      })
      .sort((a, b) => b._rank - a._rank)
      .slice(0, 3);

    // 6b. Recommended government schemes based on user profile
    const savedSchemeSet = new Set<string>(
      (req.user.savedSchemes || []).map((id) => id.toString())
    );
    const allSchemes = await GovernmentScheme.find().limit(15);
    const recommendedSchemes = allSchemes
      .map((s) => evaluateSchemeForUser(s, req.user, savedSchemeSet))
      .filter((s) => s.eligibilityStatus !== 'Not Eligible Based on Available Information')
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 3);

    // 6c. Recommended skill assessments prioritizing unverified skills
    const passedAssessmentIds = new Set(passedAttempts.map((a) => String((a.assessmentId as any)?._id || a.assessmentId)));
    const unverifiedSkillNames = (req.user.seekerProfile?.detailedSkills || [])
      .filter((s) => !s.verified && s.source !== 'assessment_verified')
      .map((s) => s.name.toLowerCase());
    const allAssessments = await Assessment.find()
      .select('title category domain difficulty durationMinutes passingScore skillsEvaluated')
      .limit(35);

    const recommendedAssessments = allAssessments
      .filter((a) => !passedAssessmentIds.has(a._id.toString()))
      .map((a) => {
        const hay = `${a.title} ${a.domain} ${(a.skillsEvaluated || []).join(' ')}`.toLowerCase();
        const matchedSkill = unverifiedSkillNames.find((sk) => sk.length >= 2 && hay.includes(sk));
        return {
          ...a.toObject(),
          recommendationReason: matchedSkill
            ? `Verify your "${matchedSkill}" skill`
            : `Build verified ${a.category} credentials`,
          _rank: matchedSkill ? 100 : a.category === 'Aptitude' ? 35 : 20
        };
      })
      .sort((a, b) => b._rank - a._rank)
      .slice(0, 3);

    // 7. Recent activity chronological feed
    const recentActivityList: Array<{
      id: string;
      type: 'assessment' | 'learning' | 'portfolio' | 'application';
      title: string;
      subtitle: string;
      timestamp: Date;
      badgeText?: string;
      badgeColor?: string;
    }> = [];

    applications.forEach((app: any) => {
      recentActivityList.push({
        id: `app-${app._id}`,
        type: 'application',
        title: `Applied to ${app.opportunityId?.title || 'Job Opening'}`,
        subtitle: `${app.opportunityId?.organisationName || 'Employer'} • Status: ${app.status}`,
        timestamp: app.updatedAt || app.createdAt,
        badgeText: app.status,
        badgeColor:
          app.status === 'Selected'
            ? 'emerald'
            : app.status === 'Interview Scheduled'
            ? 'purple'
            : 'blue'
      });
    });

    attempts.forEach((att: any) => {
      recentActivityList.push({
        id: `att-${att._id}`,
        type: 'assessment',
        title: `Completed ${att.domain} Assessment`,
        subtitle: `Scored ${att.percentage}% (${att.score}/${att.maxScore}) • ${
          att.passed ? 'Verified' : 'Needs Practice'
        }`,
        timestamp: att.completedAt,
        badgeText: att.passed ? 'Passed' : 'Completed',
        badgeColor: att.passed ? 'emerald' : 'amber'
      });
    });

    completedLearning.forEach((p: any) => {
      recentActivityList.push({
        id: `learn-${p._id}`,
        type: 'learning',
        title: `Completed ${p.resourceId?.title || 'Learning Activity'}`,
        subtitle: `Skill: ${p.resourceId?.skillTag || 'Competency Building'}`,
        timestamp: p.updatedAt || p.createdAt,
        badgeText: 'Completed',
        badgeColor: 'blue'
      });
    });

    portfolioProjects.forEach((proj: any) => {
      recentActivityList.push({
        id: `proj-${proj._id}`,
        type: 'portfolio',
        title: `Added Portfolio Project "${proj.title}"`,
        subtitle: `${proj.category || 'Portfolio'} • ${proj.skills?.slice(0, 3).join(', ') || ''}`,
        timestamp: proj.createdAt,
        badgeText: 'Portfolio',
        badgeColor: 'indigo'
      });
    });

    const recentActivity = recentActivityList
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    const completionDetails = getProfileCompletionDetails(req.user);
    const profileCompletionPercentage = completionDetails.completionPercentage;

    // Explainable Career Readiness Guidance Score (transparent breakdown)
    const verifiedDetailedCount = (req.user.seekerProfile?.detailedSkills || []).filter(
      (s) => s.verified || s.source === 'assessment_verified'
    ).length;
    const effectiveVerifiedCount = Math.max(skillsVerifiedCount, verifiedDetailedCount);
    const readinessScore = Math.min(
      100,
      Math.round(
        profileCompletionPercentage * 0.35 +
          Math.min(25, effectiveVerifiedCount * 10) +
          Math.min(20, completedLearning.length * 7) +
          Math.min(20, portfolioProjects.length * 10)
      )
    );
    const careerReadiness = {
      score: readinessScore,
      label:
        readinessScore >= 80
          ? 'Strong Readiness'
          : readinessScore >= 50
          ? 'Building Momentum'
          : 'Getting Started',
      note: 'Guidance indicator combining your profile completeness (35%), verified skills (25%), completed learning (20%), and portfolio work (20%).'
    };

    // 7-Stage Journey calculation
    const profile = req.user.seekerProfile;
    const stage1_discover = !!(profile?.skills?.length && profile?.location?.city);
    const stage2_assess = attempts.length > 0;
    const stage3_learn = learningProgress.length > 0;
    const stage4_practice = completedLearning.some(
      (p: any) => p.resourceId?.type === 'practical_assignment'
    );
    const stage5_portfolio = portfolioProjects.length > 0;
    const stage6_opportunities = applications.length > 0 || (profile?.skills?.length ?? 0) > 0;
    const stage7_earn = applications.some(
      (a) => a.status === 'Interview Scheduled' || a.status === 'Selected'
    );

    const journeyStages = [
      { id: 'discover', label: 'Discover', completed: stage1_discover, description: 'Profile & skills discovered' },
      { id: 'assess', label: 'Assess', completed: stage2_assess, description: 'Completed a skill assessment' },
      { id: 'learn', label: 'Learn', completed: stage3_learn, description: 'Engaged with learning resources' },
      { id: 'practice', label: 'Practice', completed: stage4_practice, description: 'Completed a hands-on assignment' },
      { id: 'portfolio', label: 'Build Portfolio', completed: stage5_portfolio, description: 'Created portfolio project' },
      { id: 'opportunities', label: 'Find Opportunities', completed: stage6_opportunities, description: 'Explored matched roles' },
      { id: 'earn', label: 'Earn', completed: stage7_earn, description: 'Interview scheduled or selected' }
    ];

    const completedStagesCount = journeyStages.filter((s) => s.completed).length;
    const journeyPercentage = Math.round((completedStagesCount / 7) * 100);

    const dashboardData = {
      user: serializeUser(req.user),
      profileCompletionPercentage,
      missingSections: completionDetails.missingSections,
      careerReadiness,
      savedSkills: req.user.seekerProfile?.skills || [],
      skillsVerifiedCount: effectiveVerifiedCount,
      verifiedSkills: passedDomains,
      learningCompletedCount: completedLearning.length,
      portfolioProjectsCount: portfolioProjects.length,
      activeApplicationsCount: applications.length,
      savedOpportunitiesCount: savedOppSet.size,
      savedSchemesCount: savedSchemeSet.size,
      applications: {
        total: applications.length,
        statusCounts,
        recent: applications.slice(0, 5)
      },
      recommendedOpportunities,
      recommendedSchemes,
      recommendedAssessments,
      recommendedLearning,
      recentActivity,
      interviewUpdates,
      journeyStages,
      journeyPercentage,
      learning: {
        startedCount: startedLearning.length,
        completedCount: completedLearning.length,
        items: learningProgress.slice(0, 6)
      },
      portfolio: {
        totalCount: portfolioProjects.length,
        recent: portfolioProjects.slice(0, 4)
      },
      assessments: {
        totalAttempts: attempts.length,
        skillsVerifiedCount: effectiveVerifiedCount
      }
    };

    sendSuccess(res, 'Dashboard data retrieved successfully', dashboardData);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve dashboard data', 500);
  }
};
