import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Application } from '../models/Application';
import { AssessmentAttempt } from '../models/AssessmentAttempt';
import { UserLearningProgress } from '../models/UserLearningProgress';
import { PortfolioProject } from '../models/PortfolioProject';
import { Opportunity } from '../models/Opportunity';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { SupportTicket } from '../models/SupportTicket';

export const getSeekerProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;

    // 1. Applications by status
    const applications = await Application.find({ seekerId: userId })
      .populate('opportunityId', 'title organisationName workMode')
      .sort({ createdAt: 1 });

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

    // 2. Assessment attempts & scores
    const attempts = await AssessmentAttempt.find({ userId })
      .populate('assessmentId', 'title domain')
      .sort({ completedAt: 1 });

    const assessmentChartData = attempts.map((att) => ({
      domain: att.domain,
      score: att.score,
      maxScore: att.maxScore,
      percentage: att.percentage,
      passed: att.passed,
      date: att.completedAt.toISOString().split('T')[0]
    }));

    // 3. Learning and practical assignments
    const learningProgress = await UserLearningProgress.find({ userId }).populate(
      'resourceId',
      'title type skillTag'
    );

    const completedLearning = learningProgress.filter((p) => p.status === 'completed');
    const startedLearning = learningProgress.filter((p) => p.status === 'started');
    const practicalAssignmentsCompleted = completedLearning.filter(
      (p: any) => p.resourceId?.type === 'practical_assignment'
    );

    // 4. Portfolio projects
    const portfolioProjects = await PortfolioProject.find({ userId }).sort({ createdAt: -1 });

    // 5. 7-Stage Journey calculation
    const profile = req.user?.seekerProfile;
    const stage1_discover = !!(profile?.skills?.length && profile?.location?.city);
    const stage2_assess = attempts.length > 0;
    const stage3_learn = learningProgress.length > 0;
    const stage4_practice = practicalAssignmentsCompleted.length > 0;
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

    // Dynamic Profile Completion Percentage calculation
    let profileScore = 0;
    if (req.user?.name) profileScore += 10;
    if (profile?.headline && profile.headline.trim()) profileScore += 15;
    if (profile?.location?.city && profile.location.city.trim()) profileScore += 15;
    if (profile?.skills && profile.skills.length > 0) profileScore += 15;
    if (profile?.educationLevel && profile.educationLevel !== 'No formal degree') profileScore += 15;
    if (profile?.phone && profile.phone.trim()) profileScore += 10;
    if (profile?.experienceLevel) profileScore += 10;
    if (profile?.resumeUrl && profile.resumeUrl.trim()) profileScore += 10;
    const profileCompletionPercentage = Math.min(100, Math.max(15, profileScore));

    // Verified skills count
    const passedAttempts = attempts.filter((att) => att.passed);
    const passedDomains = new Set(passedAttempts.map((att) => att.domain));
    const skillsVerifiedCount = passedDomains.size;

    // Recent activity list
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
        badgeColor: app.status === 'Selected' ? 'emerald' : app.status === 'Interview Scheduled' ? 'purple' : 'blue'
      });
    });

    attempts.forEach((att: any) => {
      recentActivityList.push({
        id: `att-${att._id}`,
        type: 'assessment',
        title: `Completed ${att.domain} Assessment`,
        subtitle: `Scored ${att.percentage}% (${att.score}/${att.maxScore}) • ${att.passed ? 'Verified' : 'Needs Practice'}`,
        timestamp: att.completedAt,
        badgeText: att.passed ? 'Passed' : 'Completed',
        badgeColor: att.passed ? 'emerald' : 'amber'
      });
    });

    learningProgress.forEach((p: any) => {
      if (p.status === 'completed') {
        recentActivityList.push({
          id: `learn-${p._id}`,
          type: 'learning',
          title: `Completed ${p.resourceId?.title || 'Learning Module'}`,
          subtitle: `Skill: ${p.resourceId?.skillTag || 'Skill Development'}`,
          timestamp: p.updatedAt || p.createdAt,
          badgeText: 'Completed',
          badgeColor: 'blue'
        });
      }
    });

    portfolioProjects.forEach((proj: any) => {
      recentActivityList.push({
        id: `proj-${proj._id}`,
        type: 'portfolio',
        title: `Added Portfolio Project "${proj.title}"`,
        subtitle: `${proj.category || 'Portfolio'} • ${proj.tags?.slice(0, 3).join(', ') || ''}`,
        timestamp: proj.createdAt,
        badgeText: 'Portfolio',
        badgeColor: 'indigo'
      });
    });

    const recentActivity = recentActivityList
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    const isFreshAccount =
      attempts.length === 0 &&
      learningProgress.length === 0 &&
      portfolioProjects.length === 0 &&
      applications.length === 0;

    res.json({
      isFreshAccount,
      journeyStages,
      journeyPercentage,
      profileCompletionPercentage,
      skillsVerifiedCount,
      recentActivity,
      applications: {
        total: applications.length,
        statusCounts,
        recent: applications.slice(-5).reverse()
      },
      assessments: {
        totalAttempts: attempts.length,
        skillsVerifiedCount,
        history: assessmentChartData
      },
      learning: {
        startedCount: startedLearning.length,
        completedCount: completedLearning.length,
        practicalAssignmentsCount: practicalAssignmentsCompleted.length
      },
      portfolio: {
        totalCount: portfolioProjects.length,
        fromPractice: portfolioProjects.filter((p) => p.source === 'practice_assignment').length,
        selfCreated: portfolioProjects.filter((p) => p.source === 'self_created').length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch seeker progress' });
  }
};

export const getEmployerStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employerId = req.user!._id;

    const opportunities = await Opportunity.find({ employerId });
    const publishedCount = opportunities.filter((o) => o.status === 'published').length;
    const draftCount = opportunities.filter((o) => o.status === 'draft').length;

    const applications = await Application.find({ employerId });
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

    res.json({
      verificationStatus: req.user?.employerProfile?.verificationStatus || 'pending',
      totalOpportunities: opportunities.length,
      publishedCount,
      draftCount,
      totalApplicants: applications.length,
      applicantStatusCounts: statusCounts,
      interviewsScheduled: statusCounts['Interview Scheduled']
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employer stats' });
  }
};

export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const totalSeekers = await User.countDocuments({ role: 'seeker' });
    const pendingEmployers = await User.countDocuments({
      role: 'employer',
      'employerProfile.verificationStatus': 'pending'
    });
    const approvedEmployers = await User.countDocuments({
      role: 'employer',
      'employerProfile.verificationStatus': 'approved'
    });
    const totalOpportunities = await Opportunity.countDocuments();
    const publishedOpportunities = await Opportunity.countDocuments({ status: 'published' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const openSafetyTickets = await SupportTicket.countDocuments({ status: 'open' });

    res.json({
      totalSeekers,
      pendingEmployers,
      approvedEmployers,
      totalOpportunities,
      publishedOpportunities,
      pendingReports,
      openSafetyTickets
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
  }
};
