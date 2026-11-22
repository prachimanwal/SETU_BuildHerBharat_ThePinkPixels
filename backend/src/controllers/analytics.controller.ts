import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Application } from '../models/Application';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningProgress } from '../models/LearningProgress';
import { LearningResource } from '../models/LearningResource';
import { Portfolio } from '../models/Portfolio';
import { ProgressSnapshot } from '../models/ProgressSnapshot';
import { calculateProfileCompletion } from '../utils/userSerializer';
import { sendSuccess, sendError } from '../utils/response';

type TimeRangeKey = '7d' | '30d' | '3m' | '6m' | '12m';

const getRangeStartDate = (range: TimeRangeKey): Date => {
  const now = new Date();
  const d = new Date(now);
  switch (range) {
    case '7d':
      d.setDate(d.getDate() - 7);
      return d;
    case '30d':
      d.setDate(d.getDate() - 30);
      return d;
    case '3m':
      d.setMonth(d.getMonth() - 3);
      return d;
    case '6m':
      d.setMonth(d.getMonth() - 6);
      return d;
    case '12m':
      d.setFullYear(d.getFullYear() - 1);
      return d;
    default:
      d.setDate(d.getDate() - 30);
      return d;
  }
};

const formatDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
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

    const rawRange = String(req.query.range || '30d') as TimeRangeKey;
    const validRanges: TimeRangeKey[] = ['7d', '30d', '3m', '6m', '12m'];
    const range: TimeRangeKey = validRanges.includes(rawRange) ? rawRange : '30d';
    const rangeStart = getRangeStartDate(range);

    const userId = req.user._id;

    const [
      attempts,
      learningProgressDocs,
      totalCatalogResources,
      portfolioProjects,
      applications
    ] = await Promise.all([
      AssessmentResult.find({ userId })
        .populate('assessmentId', 'title domain category passingScore')
        .sort({ completedAt: 1 }),
      LearningProgress.find({ userId })
        .populate('resourceId', 'title type category skillTag duration')
        .sort({ updatedAt: 1 }),
      LearningResource.countDocuments(),
      Portfolio.find({ userId }).sort({ createdAt: 1 }),
      Application.find({ seekerId: userId })
        .populate('opportunityId', 'title organisationName workMode')
        .sort({ createdAt: 1 })
    ]);

    const profilePct = calculateProfileCompletion(req.user);
    const sp = req.user.seekerProfile || {};
    const savedOppsCount = Array.isArray(req.user.savedOpportunities)
      ? req.user.savedOpportunities.length
      : 0;

    // 1. Learning Progress Donut Metrics (real records only)
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

    // 2. Assessment Performance + Improvement per attempt
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

    // 3. Skill Development Bar Graph (strictly from real assessments; self-reported kept separate)
    const skillAttemptsMap = new Map<
      string,
      Array<{ percentage: number; date: Date; passed: boolean }>
    >();

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

    // 4. Job Application Analytics & Funnel
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

    const totalApps = applications.length;
    const underReviewOrFurther =
      statusCounts['Under Review'] +
      statusCounts.Shortlisted +
      statusCounts['Interview Scheduled'] +
      statusCounts.Selected;
    const shortlistedOrFurther =
      statusCounts.Shortlisted +
      statusCounts['Interview Scheduled'] +
      statusCounts.Selected;
    const interviewsOrFurther = statusCounts['Interview Scheduled'] + statusCounts.Selected;

    const applicationFunnel = [
      { stage: 'Submitted', count: totalApps, rate: totalApps > 0 ? 100 : 0 },
      {
        stage: 'Under Review',
        count: underReviewOrFurther,
        rate: totalApps > 0 ? Math.round((underReviewOrFurther / totalApps) * 100) : 0
      },
      {
        stage: 'Shortlisted',
        count: shortlistedOrFurther,
        rate: totalApps > 0 ? Math.round((shortlistedOrFurther / totalApps) * 100) : 0
      },
      {
        stage: 'Interview',
        count: interviewsOrFurther,
        rate: totalApps > 0 ? Math.round((interviewsOrFurther / totalApps) * 100) : 0
      },
      {
        stage: 'Offers',
        count: statusCounts.Selected,
        rate: totalApps > 0 ? Math.round((statusCounts.Selected / totalApps) * 100) : 0
      }
    ];

    // 5. Interactive 7-Stage SETU Journey (strictly real activity!)
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
    // Merely visiting Opportunities does NOT complete Stage 6 — requires real bookmark or application
    const stage6Complete = applications.length > 0 || savedOppsCount > 0;
    const stage7Complete = applications.some(
      (a) => a.status === 'Interview Scheduled' || a.status === 'Selected'
    );

    const journeyStages = [
      {
        id: 'discover',
        label: 'Discover',
        completed: stage1Complete,
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
          ...(profilePct < 60 ? [`Reach at least 60% profile completion (currently ${profilePct}%)`] : [])
        ],
        requirements: 'Reach at least 60% profile completion with skills added.',
        nextAction: { label: 'Update My Profile', route: '/profile' }
      },
      {
        id: 'assess',
        label: 'Assess',
        completed: stage2Complete,
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
        description: 'Complete guided tutorials & learning paths',
        completedActivities:
          completedLearning.length > 0
            ? [`Completed ${completedLearning.length} learning resource(s)`]
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
        description: 'Showcase projects & professional resume',
        completedActivities:
          portfolioProjects.length > 0
            ? [`Added ${portfolioProjects.length} project(s) to your portfolio`]
            : [],
        pendingActivities:
          portfolioProjects.length === 0
            ? ['Add a project or build your professional resume in Portfolio']
            : [],
        requirements: 'Publish at least 1 portfolio project on SETU.',
        nextAction: { label: 'Open Portfolio & Resume', route: '/portfolio' }
      },
      {
        id: 'opportunities',
        label: 'Find Opportunities',
        completed: stage6Complete,
        description: 'Bookmark or apply to matched opportunities',
        completedActivities: [
          ...(savedOppsCount > 0 ? [`Saved ${savedOppsCount} opportunity bookmark(s)`] : []),
          ...(applications.length > 0 ? [`Submitted ${applications.length} job application(s)`] : [])
        ],
        pendingActivities: !stage6Complete
          ? ['Save a matched opportunity or submit your first job application']
          : [],
        requirements: 'Save at least 1 opportunity or submit an application (simply visiting the page does not count).',
        nextAction: { label: 'Explore Opportunities', route: '/opportunities' }
      },
      {
        id: 'earn',
        label: 'Earn',
        completed: stage7Complete,
        description: 'Reach interview or job offer milestones',
        completedActivities: [
          ...(statusCounts['Interview Scheduled'] > 0
            ? [`${statusCounts['Interview Scheduled']} interview(s) scheduled`]
            : []),
          ...(statusCounts.Selected > 0 ? [`${statusCounts.Selected} offer(s) received`] : [])
        ],
        pendingActivities: !stage7Complete
          ? ['Continue applying and preparing with CANE mock interviews to earn interviews and offers']
          : [],
        requirements: 'Reach Interview Scheduled or Selected status on an application.',
        nextAction: { label: 'Track My Applications', route: '/applications' }
      }
    ];

    const completedStagesCount = journeyStages.filter((s) => s.completed).length;
    const journeyPercentage = Math.round((completedStagesCount / 7) * 100);

    // 6. Real Chronological Timeline ("My Career Growth Journey") within selected range
    // Build cumulative progress points ONLY on dates where real user events occurred
    const eventDatesMap = new Map<
      string,
      {
        assessmentScores: number[];
        learningCompleted: number;
        assignmentsCompleted: number;
        portfolioAdded: number;
        appsSubmitted: number;
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
          appsSubmitted: 0
        });
      }
      return key;
    };

    attempts.forEach((a: any) => {
      const k = touchDate(a.completedAt || a.createdAt);
      if (k) eventDatesMap.get(k)!.assessmentScores.push(a.percentage);
    });
    completedLearning.forEach((l: any) => {
      const k = touchDate(l.completedAt || l.updatedAt || l.createdAt);
      if (k) {
        eventDatesMap.get(k)!.learningCompleted += 1;
        if (l.resourceId?.type === 'practical_assignment') {
          eventDatesMap.get(k)!.assignmentsCompleted += 1;
        }
      }
    });
    portfolioProjects.forEach((p: any) => {
      const k = touchDate(p.createdAt);
      if (k) eventDatesMap.get(k)!.portfolioAdded += 1;
    });
    applications.forEach((app: any) => {
      const k = touchDate(app.createdAt);
      if (k) eventDatesMap.get(k)!.appsSubmitted += 1;
    });

    const sortedAllKeys = Array.from(eventDatesMap.keys()).sort();
    let cumAssessScores: number[] = [];
    let cumLearning = 0;
    let cumAssignments = 0;
    let cumPortfolio = 0;
    let cumApps = 0;

    const fullTimeline: Array<{
      date: string;
      overallJourneyPct: number;
      assessmentAvgPct: number;
      learningPct: number;
      assignmentsCount: number;
      portfolioCount: number;
      applicationsCount: number;
    }> = [];

    for (const dateKey of sortedAllKeys) {
      const ev = eventDatesMap.get(dateKey)!;
      cumAssessScores = [...cumAssessScores, ...ev.assessmentScores];
      cumLearning += ev.learningCompleted;
      cumAssignments += ev.assignmentsCompleted;
      cumPortfolio += ev.portfolioAdded;
      cumApps += ev.appsSubmitted;

      const avgAss =
        cumAssessScores.length > 0
          ? Math.round(
              cumAssessScores.reduce((sum, v) => sum + v, 0) / cumAssessScores.length
            )
          : 0;
      const learnPct =
        enrolledTotal > 0 ? Math.min(100, Math.round((cumLearning / enrolledTotal) * 100)) : 0;

      // Real stage count at that point in time
      let stagesAtDate = stage1Complete ? 1 : 0;
      if (cumAssessScores.length > 0) stagesAtDate++;
      if (cumLearning > 0) stagesAtDate++;
      if (cumAssignments > 0) stagesAtDate++;
      if (cumPortfolio > 0) stagesAtDate++;
      if (cumApps > 0 || savedOppsCount > 0) stagesAtDate++;
      if (stage7Complete) stagesAtDate++;

      fullTimeline.push({
        date: dateKey,
        overallJourneyPct: Math.round((stagesAtDate / 7) * 100),
        assessmentAvgPct: avgAss,
        learningPct: learnPct,
        assignmentsCount: cumAssignments,
        portfolioCount: cumPortfolio,
        applicationsCount: cumApps
      });
    }

    const rangeStartKey = formatDateKey(rangeStart);
    const growthTimeline = fullTimeline.filter((pt) => pt.date >= rangeStartKey);

    // Record today's real snapshot silently if user has real activity (non-blocking)
    const todayKey = formatDateKey(new Date());
    const avgAssessmentScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
        : 0;

    if (
      attempts.length > 0 ||
      completedLearning.length > 0 ||
      portfolioProjects.length > 0 ||
      applications.length > 0
    ) {
      ProgressSnapshot.findOneAndUpdate(
        { userId, dateKey: todayKey },
        {
          $set: {
            overallJourneyPct: journeyPercentage,
            assessmentAvgPct: avgAssessmentScore,
            learningCompletionPct,
            assignmentsCompleted: completedAssignments.length,
            portfolioCount: portfolioProjects.length,
            applicationsCount: applications.length
          }
        },
        { upsert: true }
      ).catch(() => {});
    }

    // 7. Data-Backed Personalized Insights (strictly real numbers!)
    const insights: Array<{ type: 'positive' | 'action' | 'info'; message: string; route?: string }> = [];

    const improvedSkill = assessedSkills.find(
      (s) => typeof s.improvement === 'number' && s.improvement > 0
    );
    if (improvedSkill) {
      insights.push({
        type: 'positive',
        message: `Your ${improvedSkill.skill} assessment performance improved by ${improvedSkill.improvement} percentage points (now ${improvedSkill.currentProficiency}%).`,
        route: '/assess'
      });
    }

    const thirtyDaysAgo = getRangeStartDate('30d');
    const recentCompletedLearning = completedLearning.filter(
      (l: any) => new Date(l.completedAt || l.updatedAt || l.createdAt) >= thirtyDaysAgo
    ).length;
    if (recentCompletedLearning > 0) {
      insights.push({
        type: 'positive',
        message: `You completed ${recentCompletedLearning} learning module${recentCompletedLearning === 1 ? '' : 's'} in the last 30 days.`,
        route: '/learn'
      });
    }

    if (attempts.length === 0) {
      insights.push({
        type: 'action',
        message: 'Complete your first skill assessment to discover your verified strengths and pinpoint focus areas.',
        route: '/assess'
      });
    } else if (weakestSkill && weakestSkill.currentProficiency < 75) {
      insights.push({
        type: 'action',
        message: `Your lowest assessed score so far is ${weakestSkill.skill} (${weakestSkill.currentProficiency}%). Review matching tutorials in Learn & Practice to boost it.`,
        route: `/learn?skill=${encodeURIComponent(weakestSkill.skill)}`
      });
    }

    if (completedAssignments.length === 0) {
      insights.push({
        type: 'action',
        message: "You haven't completed any practical assignments yet — submitting one automatically strengthens your Portfolio.",
        route: '/learn'
      });
    }

    if (portfolioProjects.length === 0) {
      insights.push({
        type: 'action',
        message: 'Add a project or create your ATS-ready resume in Portfolio to stand out to employers.',
        route: '/portfolio'
      });
    }

    if (applications.length > 0 && statusCounts['Interview Scheduled'] > 0) {
      insights.push({
        type: 'positive',
        message: `You have ${statusCounts['Interview Scheduled']} interview invitation(s) scheduled! Practice mock interviews with CANE before your call.`,
        route: '/applications'
      });
    }

    const isFreshAccount =
      attempts.length === 0 &&
      learningProgressDocs.length === 0 &&
      portfolioProjects.length === 0 &&
      applications.length === 0;

    sendSuccess(res, 'Progress analytics computed from recorded activity', {
      range,
      isFreshAccount,
      summary: {
        journeyPercentage,
        completedStagesCount,
        profileCompletionPercentage: profilePct,
        totalAssessments: attempts.length,
        passedAssessments: attempts.filter((a) => a.passed).length,
        averageAssessmentScore: avgAssessmentScore,
        completedLearningCount: completedLearning.length,
        inProgressLearningCount: inProgressLearning.length,
        completedAssignmentsCount: completedAssignments.length,
        portfolioProjectsCount: portfolioProjects.length,
        applicationsCount: applications.length
      },
      growthTimeline,
      hasTimelineData: growthTimeline.length > 0,
      skillDevelopment: {
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
        completionPercentage: learningCompletionPct
      },
      applications: {
        total: totalApps,
        statusCounts,
        funnel: applicationFunnel
      },
      journeyStages,
      journeyPercentage,
      insights
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to compute progress analytics', 500);
  }
};
