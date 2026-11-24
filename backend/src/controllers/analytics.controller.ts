import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Application } from '../models/Application';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningProgress } from '../models/LearningProgress';
import { LearningResource } from '../models/LearningResource';
import { Portfolio } from '../models/Portfolio';
import { Resume } from '../models/Resume';
import { UploadedResumeFile } from '../models/UploadedResumeFile';
import { ProgressSnapshot } from '../models/ProgressSnapshot';
import {
  CORE_SKILL_CATEGORIES,
  classifyIntoCoreSkillCategory,
  computeOverallCareerProgress,
  parseDurationToHours
} from '../services/progressSnapshot.service';
import { calculateProfileCompletion } from '../utils/userSerializer';
import { sendSuccess, sendError } from '../utils/response';

type TimeRangeKey = 'weekly' | 'monthly' | 'yearly' | '7d' | '30d' | '3m' | '6m' | '12m';

const normalizeRange = (raw: string): { key: TimeRangeKey; viewMode: 'weekly' | 'monthly' | 'yearly'; days: number } => {
  switch (raw) {
    case 'weekly':
    case '7d':
      return { key: raw === '7d' ? '7d' : 'weekly', viewMode: 'weekly', days: 7 };
    case 'yearly':
    case '12m':
      return { key: raw === '12m' ? '12m' : 'yearly', viewMode: 'yearly', days: 365 };
    case '3m':
      return { key: '3m', viewMode: 'monthly', days: 90 };
    case '6m':
      return { key: '6m', viewMode: 'yearly', days: 180 };
    case 'monthly':
    case '30d':
    default:
      return { key: raw === '30d' ? '30d' : 'monthly', viewMode: 'monthly', days: 30 };
  }
};

const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const getWeekStartKey = (date: Date): string => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  return formatDateKey(d);
};

export const getSeekerProgressAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { key: range, viewMode, days } = normalizeRange(String(req.query.range || 'monthly'));
    const now = new Date();
    const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevRangeStart = new Date(rangeStart.getTime() - days * 24 * 60 * 60 * 1000);

    const userId = req.user._id;

    const [
      attempts,
      learningProgressDocs,
      totalCatalogResources,
      portfolioProjects,
      builtResumes,
      uploadedResumes,
      applications,
      persistedSnapshots
    ] = await Promise.all([
      AssessmentResult.find({ userId })
        .populate('assessmentId', 'title domain category passingScore')
        .sort({ completedAt: 1 }),
      LearningProgress.find({ userId })
        .populate('resourceId', 'title type category skillTag duration')
        .sort({ updatedAt: 1 }),
      LearningResource.countDocuments(),
      Portfolio.find({ userId }).sort({ createdAt: 1 }),
      Resume.find({ userId }).select('versionName createdAt updatedAt'),
      UploadedResumeFile.find({ userId }).select('originalFilename versionNumber confirmedByUser createdAt'),
      Application.find({ seekerId: userId })
        .populate('opportunityId', 'title organisationName workMode')
        .sort({ createdAt: 1 }),
      Promise.resolve(ProgressSnapshot.find({ userId }).sort({ dateKey: 1 })).catch(() => [])
    ]);

    const profilePct = calculateProfileCompletion(req.user);
    const sp = req.user.seekerProfile || {};
    const savedOppsCount = Array.isArray(req.user.savedOpportunities)
      ? req.user.savedOpportunities.length
      : 0;
    const resumesCount = builtResumes.length + uploadedResumes.length;

    // ------------------------------------------------------------
    // 1. LEARNING ANALYTICS (Real MongoDB records + real hours + weekly activity)
    // ------------------------------------------------------------
    const completedLearning = learningProgressDocs.filter((p) => p.status === 'completed');
    const inProgressLearning = learningProgressDocs.filter(
      (p) => p.status === 'started' || p.status === 'in_progress'
    );
    const completedAssignments = completedLearning.filter(
      (p: any) => p.resourceId?.type === 'practical_assignment'
    );
    const enrolledTotal = learningProgressDocs.length;
    const notStartedCatalog = Math.max(0, totalCatalogResources - enrolledTotal);
    const learningCompletionPct =
      enrolledTotal > 0 ? Math.round((completedLearning.length / enrolledTotal) * 100) : 0;

    const completedHours = completedLearning.reduce(
      (sum, p: any) => sum + parseDurationToHours(p.resourceId?.duration),
      0
    );
    const inProgressHours = inProgressLearning.reduce(
      (sum, p: any) => sum + parseDurationToHours(p.resourceId?.duration) * 0.35,
      0
    );
    const totalLearningHours = Math.round((completedHours + inProgressHours) * 10) / 10;

    // Weekly Learning Activity (grouped by week Monday date from real learning timestamps)
    const weeklyLearningMap = new Map<string, { week: string; completedCount: number; hours: number }>();
    completedLearning.forEach((l: any) => {
      const dt = new Date(l.completedAt || l.updatedAt || l.createdAt);
      if (Number.isNaN(dt.getTime())) return;
      const wKey = getWeekStartKey(dt);
      const entry = weeklyLearningMap.get(wKey) || { week: wKey, completedCount: 0, hours: 0 };
      entry.completedCount += 1;
      entry.hours = Math.round((entry.hours + parseDurationToHours(l.resourceId?.duration)) * 10) / 10;
      weeklyLearningMap.set(wKey, entry);
    });
    const weeklyLearningActivity = Array.from(weeklyLearningMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8);

    // ------------------------------------------------------------
    // 2. ASSESSMENT PERFORMANCE & 6-CATEGORY SKILL DEVELOPMENT
    // ------------------------------------------------------------
    const prevScoreByAssessment = new Map<string, number>();
    const assessmentPerformance = attempts.map((att: any) => {
      const key = String(att.assessmentId?._id || att.assessmentId || att.domain);
      const prev = prevScoreByAssessment.has(key) ? prevScoreByAssessment.get(key)! : null;
      const improvement = prev !== null ? att.percentage - prev : null;
      prevScoreByAssessment.set(key, att.percentage);

      return {
        id: String(att._id),
        assessmentName: att.assessmentId?.title || att.assessmentTitle || `${att.domain} Assessment`,
        domain: att.domain,
        category: att.assessmentId?.category || att.category || 'General',
        date: att.completedAt || att.createdAt,
        score: att.score,
        maxScore: att.maxScore,
        percentage: att.percentage,
        passed: att.passed,
        improvement
      };
    });

    // Individual assessed skills (preserving existing chart compatibility)
    const skillAttemptsMap = new Map<string, Array<{ percentage: number; date: Date; passed: boolean }>>();
    attempts.forEach((att: any) => {
      const label = att.domain || att.assessmentTitle || 'General';
      const arr = skillAttemptsMap.get(label) || [];
      arr.push({
        percentage: att.percentage,
        date: new Date(att.completedAt || att.createdAt),
        passed: Boolean(att.passed)
      });
      skillAttemptsMap.set(label, arr);
    });

    const assessedSkills = Array.from(skillAttemptsMap.entries()).map(([skill, list]) => {
      const current = list[list.length - 1];
      const previous = list.length >= 2 ? list[list.length - 2] : null;
      return {
        skill,
        currentProficiency: current.percentage,
        previousProficiency: previous ? previous.percentage : null,
        improvement: previous ? current.percentage - previous.percentage : null,
        attemptsCount: list.length,
        verified: list.some((x) => x.passed)
      };
    });

    // Section B: 6 Core Skill Categories calculated strictly from real assessments + completed learning
    const categoryBuckets = new Map<
      string,
      { assessmentScores: number[]; learningCount: number }
    >();
    CORE_SKILL_CATEGORIES.forEach((cat) =>
      categoryBuckets.set(cat, { assessmentScores: [], learningCount: 0 })
    );

    attempts.forEach((att: any) => {
      const cat = classifyIntoCoreSkillCategory(
        att.assessmentId?.category || att.category,
        att.domain,
        att.assessmentId?.title || att.assessmentTitle
      );
      categoryBuckets.get(cat)!.assessmentScores.push(att.percentage);
    });

    completedLearning.forEach((lp: any) => {
      const cat = classifyIntoCoreSkillCategory(
        lp.resourceId?.category,
        lp.resourceId?.skillTag,
        lp.resourceId?.title
      );
      categoryBuckets.get(cat)!.learningCount += 1;
    });

    const coreSkillCategories = CORE_SKILL_CATEGORIES.map((category) => {
      const bucket = categoryBuckets.get(category)!;
      const assessCount = bucket.assessmentScores.length;
      const learnCount = bucket.learningCount;
      const hasActivity = assessCount > 0 || learnCount > 0;

      // Never assign fake scores: 0 when no activity exists in this category!
      let score = 0;
      if (assessCount > 0 && learnCount > 0) {
        const avgA =
          bucket.assessmentScores.reduce((s, v) => s + v, 0) / assessCount;
        const learnBonus = Math.min(15, learnCount * 5);
        score = Math.min(100, Math.round(avgA * 0.85 + learnBonus));
      } else if (assessCount > 0) {
        score = Math.round(
          bucket.assessmentScores.reduce((s, v) => s + v, 0) / assessCount
        );
      } else if (learnCount > 0) {
        // Real completed learning activities without an assessment yet (capped at 60 until verified by assessment)
        score = Math.min(60, learnCount * 20);
      }

      const delta =
        assessCount >= 2
          ? bucket.assessmentScores[assessCount - 1] - bucket.assessmentScores[assessCount - 2]
          : null;

      let status: 'improving' | 'strong' | 'needs_attention' | 'not_started' = 'not_started';
      if (!hasActivity) {
        status = 'not_started';
      } else if (delta !== null && delta > 0) {
        status = 'improving';
      } else if (score >= 70) {
        status = 'strong';
      } else {
        status = 'needs_attention';
      }

      return {
        category,
        score,
        hasActivity,
        assessmentsCount: assessCount,
        completedLearningCount: learnCount,
        delta,
        status
      };
    });

    const assessedSkillLower = new Set(assessedSkills.map((s) => s.skill.toLowerCase()));
    const selfReportedSkills = (
      Array.isArray(sp.detailedSkills) && sp.detailedSkills.length > 0
        ? sp.detailedSkills.map((s) => ({
            name: s.name,
            proficiency: s.proficiency || 'Intermediate',
            verified: Boolean(s.verified || s.source === 'assessment_verified')
          }))
        : (Array.isArray(sp.skills) ? sp.skills : []).map((name) => ({
            name,
            proficiency: 'Intermediate',
            verified: false
          }))
    ).filter((s) => !assessedSkillLower.has(s.name.toLowerCase()));

    const sortedAssessed = [...assessedSkills].sort(
      (a, b) => b.currentProficiency - a.currentProficiency
    );
    const strongestSkill = sortedAssessed.length > 0 ? sortedAssessed[0] : null;
    const weakestSkill =
      sortedAssessed.length > 1 ? sortedAssessed[sortedAssessed.length - 1] : null;

    // ------------------------------------------------------------
    // 3. JOB APPLICATION ANALYTICS (6-Stage Funnel + Applications Over Time)
    // ------------------------------------------------------------
    const statusCounts: Record<string, number> = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      'Interview Completed': 0,
      'Offer Sent': 0,
      Hired: 0,
      Selected: 0,
      Rejected: 0,
      Withdrawn: 0
    };
    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    const totalApps = applications.length;
    const hiredCount = statusCounts.Hired + statusCounts.Selected;
    const offersCount = statusCounts['Offer Sent'] + hiredCount;
    const interviewsCount =
      statusCounts['Interview Scheduled'] + statusCounts['Interview Completed'] + offersCount;
    const shortlistedCount = statusCounts.Shortlisted + interviewsCount;
    const reviewedCount = statusCounts['Under Review'] + shortlistedCount;

    const applicationFunnel = [
      { stage: 'Applications Submitted', count: totalApps, rate: totalApps > 0 ? 100 : 0 },
      {
        stage: 'Applications Reviewed',
        count: reviewedCount,
        rate: totalApps > 0 ? Math.round((reviewedCount / totalApps) * 100) : 0
      },
      {
        stage: 'Shortlisted',
        count: shortlistedCount,
        rate: totalApps > 0 ? Math.round((shortlistedCount / totalApps) * 100) : 0
      },
      {
        stage: 'Interviews',
        count: interviewsCount,
        rate: totalApps > 0 ? Math.round((interviewsCount / totalApps) * 100) : 0
      },
      {
        stage: 'Offers Received',
        count: offersCount,
        rate: totalApps > 0 ? Math.round((offersCount / totalApps) * 100) : 0
      },
      {
        stage: 'Hired',
        count: hiredCount,
        rate: totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0
      }
    ];

    // Applications Submitted Over Time
    const appTimeMap = new Map<string, number>();
    applications.forEach((a) => {
      const dt = new Date(a.createdAt);
      if (Number.isNaN(dt.getTime()) || dt < rangeStart) return;
      const bucketKey =
        viewMode === 'yearly'
          ? dt.toISOString().slice(0, 7)
          : viewMode === 'monthly'
          ? formatDateKey(dt)
          : formatDateKey(dt);
      appTimeMap.set(bucketKey, (appTimeMap.get(bucketKey) || 0) + 1);
    });
    const applicationsOverTime = Array.from(appTimeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // ------------------------------------------------------------
    // 4. INTERACTIVE 7-STAGE SETU CAREER JOURNEY (with per-stage %)
    // ------------------------------------------------------------
    const hasEducation = Array.isArray(sp.education) && sp.education.length > 0;
    const hasSkills =
      (Array.isArray(sp.detailedSkills) && sp.detailedSkills.length > 0) ||
      (Array.isArray(sp.skills) && sp.skills.length > 0);
    const hasLocation = Boolean(sp.location?.city && sp.location?.state);
    const stage1Complete = profilePct >= 60 && hasSkills;
    const stage2Complete = attempts.length > 0;
    const stage3Complete = completedLearning.length > 0;
    const stage4Complete = completedAssignments.length > 0;
    const stage5Complete = portfolioProjects.length > 0;
    const stage6Complete = applications.length > 0 || savedOppsCount > 0;
    const stage7Complete = interviewsCount > 0 || offersCount > 0 || hiredCount > 0;

    const journeyStages = [
      {
        id: 'discover',
        label: 'Discover',
        completed: stage1Complete,
        completionPct: Math.min(100, profilePct),
        description: 'Build your career profile, education, skills & goals',
        completedActivities: [
          ...(hasLocation ? [`Added location (${sp.location?.city}, ${sp.location?.state})`] : []),
          ...(hasEducation ? [`Added ${sp.education!.length} educational qualification(s)`] : []),
          ...(hasSkills ? ['Added your skills & career preferences'] : [])
        ],
        pendingActivities: [
          ...(!hasLocation ? ['Add your city and state'] : []),
          ...(!hasEducation ? ['Add your educational qualifications & percentage/CGPA'] : []),
          ...(!hasSkills ? ['Add at least one skill to your profile'] : []),
          ...(profilePct < 60
            ? [`Reach at least 60% profile completion (currently ${profilePct}%)`]
            : [])
        ],
        requirements: 'Reach at least 60% profile completion with skills added.',
        nextAction: { label: 'Update My Profile', route: '/profile' }
      },
      {
        id: 'assess',
        label: 'Assess',
        completed: stage2Complete,
        completionPct: attempts.length === 0 ? 0 : attempts.some((a) => a.passed) ? 100 : 75,
        description: 'Complete server-scored skill assessments',
        completedActivities:
          attempts.length > 0
            ? [
                `Completed ${attempts.length} assessment attempt(s)`,
                `Passed ${attempts.filter((a) => a.passed).length} assessment(s)`
              ]
            : [],
        pendingActivities:
          attempts.length === 0
            ? ['Complete your first skill assessment to discover strengths and gaps']
            : [],
        requirements: 'Submit at least 1 skill assessment on SETU.',
        nextAction: { label: 'Take Skill Assessment', route: '/assess' }
      },
      {
        id: 'learn',
        label: 'Learn',
        completed: stage3Complete,
        completionPct:
          completedLearning.length > 0
            ? Math.min(100, Math.max(learningCompletionPct, completedLearning.length * 34))
            : inProgressLearning.length > 0
            ? 35
            : 0,
        description: 'Complete guided tutorials & learning paths',
        completedActivities:
          completedLearning.length > 0
            ? [`Completed ${completedLearning.length} course(s) (${totalLearningHours} hrs)`]
            : inProgressLearning.length > 0
            ? [`Started ${inProgressLearning.length} learning resource(s)`]
            : [],
        pendingActivities:
          completedLearning.length === 0
            ? ['Complete at least 1 tutorial or learning path module']
            : [],
        requirements: 'Mark at least 1 learning module as completed.',
        nextAction: { label: 'Open Learn & Practice', route: '/learn' }
      },
      {
        id: 'practice',
        label: 'Practice',
        completed: stage4Complete,
        completionPct: completedAssignments.length > 0 ? 100 : 0,
        description: 'Submit hands-on practical assignments',
        completedActivities:
          completedAssignments.length > 0
            ? [`Submitted ${completedAssignments.length} practical assignment(s)`]
            : [],
        pendingActivities:
          completedAssignments.length === 0
            ? ['Complete and submit at least 1 practical assignment']
            : [],
        requirements: 'Submit at least 1 practical assignment in Learn & Practice.',
        nextAction: { label: 'Try a Practice Assignment', route: '/learn' }
      },
      {
        id: 'portfolio',
        label: 'Build Portfolio',
        completed: stage5Complete,
        completionPct:
          portfolioProjects.length > 0 && resumesCount > 0
            ? 100
            : portfolioProjects.length > 0 || resumesCount > 0
            ? 60
            : 0,
        description: 'Showcase projects & professional resume',
        completedActivities: [
          ...(portfolioProjects.length > 0
            ? [`Added ${portfolioProjects.length} project(s) to your portfolio`]
            : []),
          ...(resumesCount > 0 ? [`Saved ${resumesCount} resume version(s)`] : [])
        ],
        pendingActivities: [
          ...(portfolioProjects.length === 0 ? ['Add at least 1 project to your Portfolio'] : []),
          ...(resumesCount === 0 ? ['Build or upload your resume in Portfolio'] : [])
        ],
        requirements: 'Publish at least 1 portfolio project on SETU.',
        nextAction: { label: 'Open Portfolio & Resume', route: '/portfolio' }
      },
      {
        id: 'opportunities',
        label: 'Find Opportunities',
        completed: stage6Complete,
        completionPct: applications.length > 0 ? 100 : savedOppsCount > 0 ? 60 : 0,
        description: 'Bookmark or apply to matched opportunities',
        completedActivities: [
          ...(savedOppsCount > 0 ? [`Saved ${savedOppsCount} opportunity bookmark(s)`] : []),
          ...(applications.length > 0 ? [`Submitted ${applications.length} job application(s)`] : [])
        ],
        pendingActivities: !stage6Complete
          ? ['Save a matched opportunity or submit your first job application']
          : [],
        requirements: 'Save at least 1 opportunity or submit an application.',
        nextAction: { label: 'Explore Opportunities', route: '/opportunities' }
      },
      {
        id: 'earn',
        label: 'Earn',
        completed: stage7Complete,
        completionPct: hiredCount > 0 ? 100 : offersCount > 0 ? 85 : interviewsCount > 0 ? 65 : 0,
        description: 'Reach interview, offer, or hired milestones',
        completedActivities: [
          ...(interviewsCount > 0 ? [`${interviewsCount} interview milestone(s) reached`] : []),
          ...(offersCount > 0 ? [`${offersCount} offer(s) received`] : []),
          ...(hiredCount > 0 ? [`${hiredCount} confirmed hire(s)`] : [])
        ],
        pendingActivities: !stage7Complete
          ? ['Apply to matched jobs and practice interviews with CANE AI to unlock interviews and offers']
          : [],
        requirements: 'Reach Interview, Offer Sent, or Hired stage on an application.',
        nextAction: { label: 'Track My Applications', route: '/applications' }
      }
    ];

    const completedStagesCount = journeyStages.filter((s) => s.completed).length;
    const journeyPercentage = Math.round((completedStagesCount / 7) * 100);
    const avgAssessmentScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
        : 0;

    // Transparent 0-100% Overall Career Progress score
    const overallProgressBreakdown = computeOverallCareerProgress({
      profilePct,
      assessmentsCount: attempts.length,
      avgAssessmentPct: avgAssessmentScore,
      completedLearningCount: completedLearning.length,
      completedAssignmentsCount: completedAssignments.length,
      portfolioCount: portfolioProjects.length,
      resumesCount,
      applicationsCount: applications.length,
      shortlistedCount,
      interviewsCount,
      offersOrHiredCount: offersCount
    });

    // ------------------------------------------------------------
    // 5. CHRONOLOGICAL "MY CAREER GROWTH" TIMELINE (Weekly / Monthly / Yearly)
    // ------------------------------------------------------------
    const eventDatesMap = new Map<
      string,
      {
        assessmentScores: number[];
        learningCompleted: number;
        assignmentsCompleted: number;
        portfolioAdded: number;
        resumesAdded: number;
        appsSubmitted: number;
        milestones: string[];
      }
    >();

    const touchDate = (dt: Date | string | undefined) => {
      if (!dt) return null;
      const d = new Date(dt);
      if (Number.isNaN(d.getTime())) return null;
      const key = formatDateKey(d);
      if (!eventDatesMap.has(key)) {
        eventDatesMap.set(key, {
          assessmentScores: [],
          learningCompleted: 0,
          assignmentsCompleted: 0,
          portfolioAdded: 0,
          resumesAdded: 0,
          appsSubmitted: 0,
          milestones: []
        });
      }
      return key;
    };

    attempts.forEach((a: any, idx: number) => {
      const k = touchDate(a.completedAt || a.createdAt);
      if (k) {
        eventDatesMap.get(k)!.assessmentScores.push(a.percentage);
        if (idx === 0) eventDatesMap.get(k)!.milestones.push('First Skill Assessment');
        if (a.passed) eventDatesMap.get(k)!.milestones.push(`Passed ${a.domain}`);
      }
    });
    completedLearning.forEach((l: any, idx: number) => {
      const k = touchDate(l.completedAt || l.updatedAt || l.createdAt);
      if (k) {
        eventDatesMap.get(k)!.learningCompleted += 1;
        if (idx === 0) eventDatesMap.get(k)!.milestones.push('First Course Completed');
        if (l.resourceId?.type === 'practical_assignment') {
          eventDatesMap.get(k)!.assignmentsCompleted += 1;
          eventDatesMap.get(k)!.milestones.push('Practical Assignment Submitted');
        }
      }
    });
    portfolioProjects.forEach((p: any, idx: number) => {
      const k = touchDate(p.createdAt);
      if (k) {
        eventDatesMap.get(k)!.portfolioAdded += 1;
        if (idx === 0) eventDatesMap.get(k)!.milestones.push('First Portfolio Project');
      }
    });
    [...builtResumes, ...uploadedResumes].forEach((r: any, idx: number) => {
      const k = touchDate(r.createdAt);
      if (k) {
        eventDatesMap.get(k)!.resumesAdded += 1;
        if (idx === 0) eventDatesMap.get(k)!.milestones.push('Resume Saved');
      }
    });
    applications.forEach((app: any, idx: number) => {
      const k = touchDate(app.createdAt);
      if (k) {
        eventDatesMap.get(k)!.appsSubmitted += 1;
        if (idx === 0) eventDatesMap.get(k)!.milestones.push('First Job Application');
        if (['Interview Scheduled', 'Interview Completed'].includes(app.status)) {
          eventDatesMap.get(k)!.milestones.push('Interview Invitation');
        }
        if (['Offer Sent', 'Hired', 'Selected'].includes(app.status)) {
          eventDatesMap.get(k)!.milestones.push('Offer / Hired Milestone');
        }
      }
    });

    // Include any persisted snapshot dates that may exist from earlier days
    persistedSnapshots.forEach((snap) => {
      if (snap.dateKey && !eventDatesMap.has(snap.dateKey)) {
        eventDatesMap.set(snap.dateKey, {
          assessmentScores: [],
          learningCompleted: 0,
          assignmentsCompleted: 0,
          portfolioAdded: 0,
          resumesAdded: 0,
          appsSubmitted: 0,
          milestones: Array.isArray(snap.milestones) ? snap.milestones : []
        });
      }
    });

    const sortedAllKeys = Array.from(eventDatesMap.keys()).sort();
    let cumAssessScores: number[] = [];
    let cumLearning = 0;
    let cumAssignments = 0;
    let cumPortfolio = 0;
    let cumResumes = 0;
    let cumApps = 0;

    const fullDailyTimeline: Array<{
      date: string;
      overallCareerProgressPct: number;
      overallJourneyPct: number;
      assessmentAvgPct: number;
      learningPct: number;
      assignmentsCount: number;
      portfolioCount: number;
      applicationsCount: number;
      milestones: string[];
    }> = [];

    for (const dateKey of sortedAllKeys) {
      const ev = eventDatesMap.get(dateKey)!;
      cumAssessScores = [...cumAssessScores, ...ev.assessmentScores];
      cumLearning += ev.learningCompleted;
      cumAssignments += ev.assignmentsCompleted;
      cumPortfolio += ev.portfolioAdded;
      cumResumes += ev.resumesAdded;
      cumApps += ev.appsSubmitted;

      const avgAss =
        cumAssessScores.length > 0
          ? Math.round(cumAssessScores.reduce((sum, v) => sum + v, 0) / cumAssessScores.length)
          : 0;
      const learnPct =
        enrolledTotal > 0 ? Math.min(100, Math.round((cumLearning / enrolledTotal) * 100)) : 0;

      const ptProgress = computeOverallCareerProgress({
        profilePct,
        assessmentsCount: cumAssessScores.length,
        avgAssessmentPct: avgAss,
        completedLearningCount: cumLearning,
        completedAssignmentsCount: cumAssignments,
        portfolioCount: cumPortfolio,
        resumesCount: cumResumes,
        applicationsCount: cumApps,
        shortlistedCount: cumApps > 0 ? shortlistedCount : 0,
        interviewsCount: cumApps > 0 ? interviewsCount : 0,
        offersOrHiredCount: cumApps > 0 ? offersCount : 0
      });

      fullDailyTimeline.push({
        date: dateKey,
        overallCareerProgressPct: ptProgress.overallCareerProgressPct,
        overallJourneyPct: ptProgress.overallCareerProgressPct,
        assessmentAvgPct: avgAss,
        learningPct: learnPct,
        assignmentsCount: cumAssignments,
        portfolioCount: cumPortfolio,
        applicationsCount: cumApps,
        milestones: Array.from(new Set(ev.milestones)).slice(0, 3)
      });
    }

    const rangeStartKey = formatDateKey(rangeStart);
    const prevRangeStartKey = formatDateKey(prevRangeStart);

    const pointsInRange = fullDailyTimeline.filter((pt) => pt.date >= rangeStartKey);
    const pointsInPrevRange = fullDailyTimeline.filter(
      (pt) => pt.date >= prevRangeStartKey && pt.date < rangeStartKey
    );

    // Aggregate into yearly months if yearly view has many days, otherwise keep chronological points
    let growthTimeline = pointsInRange;
    if (viewMode === 'yearly' && pointsInRange.length > 0) {
      const monthBuckets = new Map<string, typeof pointsInRange[number]>();
      pointsInRange.forEach((pt) => {
        const mKey = pt.date.slice(0, 7);
        const existing = monthBuckets.get(mKey);
        monthBuckets.set(mKey, {
          ...pt,
          date: mKey,
          milestones: Array.from(new Set([...(existing?.milestones || []), ...pt.milestones])).slice(0, 3)
        });
      });
      growthTimeline = Array.from(monthBuckets.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    // Period-over-period improvement calculation (strictly from real recorded points!)
    const latestInRangePct =
      growthTimeline.length > 0
        ? growthTimeline[growthTimeline.length - 1].overallCareerProgressPct
        : overallProgressBreakdown.overallCareerProgressPct;
    const prevPeriodPct =
      pointsInPrevRange.length > 0
        ? pointsInPrevRange[pointsInPrevRange.length - 1].overallCareerProgressPct
        : growthTimeline.length >= 2
        ? growthTimeline[0].overallCareerProgressPct
        : null;
    const periodImprovementDelta =
      prevPeriodPct !== null ? latestInRangePct - prevPeriodPct : null;

    // Persist today's snapshot when user has any real activity (non-blocking)
    const todayKey = formatDateKey(now);
    const hasAnyActivity =
      attempts.length > 0 ||
      learningProgressDocs.length > 0 ||
      portfolioProjects.length > 0 ||
      resumesCount > 0 ||
      applications.length > 0;

    if (hasAnyActivity) {
      ProgressSnapshot.findOneAndUpdate(
        { userId, dateKey: todayKey },
        {
          $set: {
            overallCareerProgressPct: overallProgressBreakdown.overallCareerProgressPct,
            overallJourneyPct: journeyPercentage,
            assessmentAvgPct: avgAssessmentScore,
            learningCompletionPct,
            learningHours: totalLearningHours,
            assignmentsCompleted: completedAssignments.length,
            portfolioCount: portfolioProjects.length,
            resumesCount,
            applicationsCount: applications.length,
            interviewsCount,
            offersCount,
            hiredCount
          }
        },
        { upsert: true }
      ).catch(() => {});
    }

    // ------------------------------------------------------------
    // 6. SECTION F: PERSONAL ACHIEVEMENTS (100% Real MongoDB Data)
    // ------------------------------------------------------------
    const passedAssessments = attempts.filter((a) => a.passed);
    const profileCertsCount = (Array.isArray(sp.qualifications) ? sp.qualifications : []).filter(
      (q: any) => /certif/i.test(q.institute || '') || /certif/i.test(q.title || '')
    ).length;
    const earnedCertificatesCount = passedAssessments.length + profileCertsCount;

    const achievements = [
      {
        id: 'assessments',
        title: 'Completed Assessments',
        count: attempts.length,
        subtitle:
          attempts.length > 0
            ? `${passedAssessments.length} passed • Avg ${avgAssessmentScore}%`
            : 'Take your first skill test',
        unlocked: attempts.length > 0,
        route: '/assess',
        items: attempts.slice(-4).reverse().map((a: any) => `${a.domain}: ${a.percentage}%`)
      },
      {
        id: 'certificates',
        title: 'Earned Certificates & Badges',
        count: earnedCertificatesCount,
        subtitle:
          earnedCertificatesCount > 0
            ? `${passedAssessments.length} verified skill badge(s) + ${profileCertsCount} cert(s)`
            : 'Pass an assessment to earn your first verified badge',
        unlocked: earnedCertificatesCount > 0,
        route: '/assess',
        items: passedAssessments.slice(0, 4).map((a: any) => `Verified: ${a.domain}`)
      },
      {
        id: 'projects',
        title: 'Completed Projects',
        count: portfolioProjects.length,
        subtitle:
          portfolioProjects.length > 0
            ? `${portfolioProjects.length} portfolio project(s) • ${completedAssignments.length} assignment(s)`
            : 'Publish your first project in Portfolio',
        unlocked: portfolioProjects.length > 0,
        route: '/portfolio',
        items: portfolioProjects.slice(0, 4).map((p: any) => p.title)
      },
      {
        id: 'resume',
        title: 'Resume Completion',
        count: resumesCount,
        subtitle:
          resumesCount > 0
            ? `${builtResumes.length} SETU built • ${uploadedResumes.length} uploaded`
            : 'Create or upload your resume',
        unlocked: resumesCount > 0,
        route: '/portfolio',
        items: [
          ...builtResumes.slice(0, 2).map((r: any) => r.versionName || 'SETU Resume'),
          ...uploadedResumes.slice(0, 2).map((u: any) => u.originalFilename)
        ]
      },
      {
        id: 'learning',
        title: 'Learning Milestones',
        count: completedLearning.length,
        subtitle:
          completedLearning.length > 0
            ? `${completedLearning.length} course(s) completed • ${totalLearningHours} hrs`
            : 'Complete your first tutorial in Learn & Practice',
        unlocked: completedLearning.length > 0,
        route: '/learn',
        items: completedLearning
          .slice(-4)
          .reverse()
          .map((l: any) => l.resourceId?.title || 'Completed Module')
      },
      {
        id: 'applications',
        title: 'Job Application Milestones',
        count: applications.length,
        subtitle:
          applications.length > 0
            ? `${interviewsCount} interview(s) • ${offersCount} offer(s) • ${hiredCount} hired`
            : 'Apply to your first matched opportunity',
        unlocked: applications.length > 0,
        route: '/applications',
        items: applications
          .slice(-4)
          .reverse()
          .map((a: any) => `${a.opportunityId?.title || 'Role'} (${a.status})`)
      }
    ];

    // ------------------------------------------------------------
    // 7. DATA-BACKED INSIGHTS
    // ------------------------------------------------------------
    const insights: Array<{ type: 'positive' | 'action' | 'info'; message: string; route?: string }> =
      [];

    const improvedSkill = assessedSkills.find(
      (s) => typeof s.improvement === 'number' && s.improvement > 0
    );
    if (improvedSkill) {
      insights.push({
        type: 'positive',
        message: `Your ${improvedSkill.skill} assessment improved by +${improvedSkill.improvement}% (now ${improvedSkill.currentProficiency}%).`,
        route: '/assess'
      });
    }
    if (completedLearning.length > 0) {
      insights.push({
        type: 'positive',
        message: `You have logged ${totalLearningHours} learning hours across ${completedLearning.length} completed module(s).`,
        route: '/learn'
      });
    }
    if (attempts.length === 0) {
      insights.push({
        type: 'action',
        message:
          'Complete your first skill assessment to unlock verified scores in your Skill Development chart.',
        route: '/assess'
      });
    } else if (weakestSkill && weakestSkill.currentProficiency < 75) {
      insights.push({
        type: 'action',
        message: `${weakestSkill.skill} (${weakestSkill.currentProficiency}%) needs attention. Complete matching tutorials in Learn & Practice to improve it.`,
        route: `/learn?skill=${encodeURIComponent(weakestSkill.skill)}`
      });
    }
    if (resumesCount === 0 || portfolioProjects.length === 0) {
      insights.push({
        type: 'action',
        message:
          'Add a project and save or upload your resume in Portfolio to earn up to +20% on your Career Growth score.',
        route: '/portfolio'
      });
    }
    if (interviewsCount > 0) {
      insights.push({
        type: 'positive',
        message: `You have reached ${interviewsCount} interview stage(s)! Practice role-specific mock interviews with CANE AI.`,
        route: '/cane'
      });
    }

    const isFreshAccount = !hasAnyActivity;

    sendSuccess(res, 'Progress analytics computed from recorded activity', {
      range,
      viewMode,
      isFreshAccount,
      summary: {
        overallCareerProgressPct: overallProgressBreakdown.overallCareerProgressPct,
        progressFormula: overallProgressBreakdown,
        periodImprovementDelta,
        journeyPercentage,
        completedStagesCount,
        profileCompletionPercentage: profilePct,
        totalAssessments: attempts.length,
        passedAssessments: passedAssessments.length,
        averageAssessmentScore: avgAssessmentScore,
        completedLearningCount: completedLearning.length,
        inProgressLearningCount: inProgressLearning.length,
        totalLearningHours,
        completedAssignmentsCount: completedAssignments.length,
        portfolioProjectsCount: portfolioProjects.length,
        resumesCount,
        applicationsCount: applications.length,
        interviewsCount,
        offersCount,
        hiredCount
      },
      growthTimeline,
      hasTimelineData: growthTimeline.length > 0,
      skillDevelopment: {
        coreCategories: coreSkillCategories,
        assessedSkills,
        selfReportedSkills,
        strongestSkill,
        weakestSkill
      },
      assessmentPerformance,
      learningDonut: {
        completed: completedLearning.length,
        inProgress: inProgressLearning.length,
        notStarted: notStartedCatalog,
        enrolledTotal,
        catalogTotal: totalCatalogResources,
        completionPercentage: learningCompletionPct,
        totalLearningHours,
        weeklyActivity: weeklyLearningActivity
      },
      applications: {
        total: totalApps,
        statusCounts,
        funnel: applicationFunnel,
        overTime: applicationsOverTime
      },
      journeyStages,
      journeyPercentage,
      achievements,
      insights
    });
  } catch (error: any) {
    console.error('[Analytics] Error computing progress:', error?.message || '');
    sendError(res, 'Failed to compute progress analytics right now. Please try again.', 500);
  }
};
