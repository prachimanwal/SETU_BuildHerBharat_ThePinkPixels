import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Application } from '../models/Application';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { Opportunity } from '../models/Opportunity';
import { LearningResource } from '../models/LearningResource';
import { sendSuccess, sendError } from '../utils/response';
import { profileUpdateSchema } from '../utils/validators';
import { calculateProfileCompletion, serializeUser } from '../utils/userSerializer';

export { calculateProfileCompletion };

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  sendSuccess(res, 'User profile fetched successfully', {
    user: serializeUser(req.user)
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

    const { name, avatar, seekerProfile, employerProfile } = parseResult.data;
    const user = req.user;

    if (name) {
      user.name = name;
      user.fullName = name;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
      user.profilePicture = avatar;
    }

    if (user.role === 'seeker' && seekerProfile) {
      user.seekerProfile = {
        ...user.seekerProfile,
        ...seekerProfile
      } as any;
    } else if (user.role === 'employer' && employerProfile) {
      user.employerProfile = {
        ...user.employerProfile,
        ...employerProfile,
        // Preserve administrative verification status
        verificationStatus: user.employerProfile?.verificationStatus || 'pending'
      } as any;
    }

    const completionPercentage = calculateProfileCompletion(user);
    user.profileCompletion = completionPercentage;
    await user.save();

    sendSuccess(res, 'Profile updated successfully', {
      user: serializeUser(user),
      profileCompletionPercentage: completionPercentage
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

  const completionPercentage = calculateProfileCompletion(req.user);
  sendSuccess(res, 'Profile completion calculated', {
    completionPercentage,
    message: `Your profile is ${completionPercentage}% complete. Complete your profile to receive better opportunity matches.`
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

    // 5. Recommended opportunities based on user skills
    const userSkills = (req.user.seekerProfile?.skills || []).map((s) => s.toLowerCase());
    const allPublishedOpps = await Opportunity.find({
      status: 'published',
      moderationStatus: 'clean'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const recommendedOpportunities = allPublishedOpps
      .map((opp) => {
        const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
        const matchingSkills = opp.requiredSkills.filter((s) =>
          userSkills.includes(s.toLowerCase())
        );
        const matchScore =
          oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;

        return {
          ...opp.toObject(),
          matchScore,
          matchingSkills
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    // 6. Recommended learning resources
    const allResources = await LearningResource.find().limit(6);
    const completedResourceIds = new Set(
      completedLearning.map((p) => p.resourceId?.toString())
    );
    const recommendedLearning = allResources
      .filter((r) => !completedResourceIds.has(r._id.toString()))
      .slice(0, 2);

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

    const profileCompletionPercentage = calculateProfileCompletion(req.user);

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
      savedSkills: req.user.seekerProfile?.skills || [],
      skillsVerifiedCount,
      verifiedSkills: passedDomains,
      learningCompletedCount: completedLearning.length,
      portfolioProjectsCount: portfolioProjects.length,
      activeApplicationsCount: applications.length,
      applications: {
        total: applications.length,
        statusCounts,
        recent: applications.slice(0, 5)
      },
      recommendedOpportunities,
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
        skillsVerifiedCount
      }
    };

    sendSuccess(res, 'Dashboard data retrieved successfully', dashboardData);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve dashboard data', 500);
  }
};
