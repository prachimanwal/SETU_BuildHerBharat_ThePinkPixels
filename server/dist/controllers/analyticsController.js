"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.getEmployerStats = exports.getSeekerProgress = void 0;
const Application_1 = require("../models/Application");
const AssessmentAttempt_1 = require("../models/AssessmentAttempt");
const UserLearningProgress_1 = require("../models/UserLearningProgress");
const PortfolioProject_1 = require("../models/PortfolioProject");
const Opportunity_1 = require("../models/Opportunity");
const User_1 = require("../models/User");
const Report_1 = require("../models/Report");
const SupportTicket_1 = require("../models/SupportTicket");
const getSeekerProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        // 1. Applications by status
        const applications = await Application_1.Application.find({ seekerId: userId })
            .populate('opportunityId', 'title organisationName workMode')
            .sort({ createdAt: 1 });
        const statusCounts = {
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
        const attempts = await AssessmentAttempt_1.AssessmentAttempt.find({ userId })
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
        const learningProgress = await UserLearningProgress_1.UserLearningProgress.find({ userId }).populate('resourceId', 'title type skillTag');
        const completedLearning = learningProgress.filter((p) => p.status === 'completed');
        const startedLearning = learningProgress.filter((p) => p.status === 'started');
        const practicalAssignmentsCompleted = completedLearning.filter((p) => p.resourceId?.type === 'practical_assignment');
        // 4. Portfolio projects
        const portfolioProjects = await PortfolioProject_1.PortfolioProject.find({ userId }).sort({ createdAt: -1 });
        // 5. 7-Stage Journey calculation
        const profile = req.user?.seekerProfile;
        const stage1_discover = !!(profile?.skills?.length && profile?.location?.city);
        const stage2_assess = attempts.length > 0;
        const stage3_learn = learningProgress.length > 0;
        const stage4_practice = practicalAssignmentsCompleted.length > 0;
        const stage5_portfolio = portfolioProjects.length > 0;
        const stage6_opportunities = applications.length > 0 || (profile?.skills?.length ?? 0) > 0;
        const stage7_earn = applications.some((a) => a.status === 'Interview Scheduled' || a.status === 'Selected');
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
        const isFreshAccount = attempts.length === 0 &&
            learningProgress.length === 0 &&
            portfolioProjects.length === 0 &&
            applications.length === 0;
        res.json({
            isFreshAccount,
            journeyStages,
            journeyPercentage,
            applications: {
                total: applications.length,
                statusCounts,
                recent: applications.slice(-5).reverse()
            },
            assessments: {
                totalAttempts: attempts.length,
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch seeker progress' });
    }
};
exports.getSeekerProgress = getSeekerProgress;
const getEmployerStats = async (req, res) => {
    try {
        const employerId = req.user._id;
        const opportunities = await Opportunity_1.Opportunity.find({ employerId });
        const publishedCount = opportunities.filter((o) => o.status === 'published').length;
        const draftCount = opportunities.filter((o) => o.status === 'draft').length;
        const applications = await Application_1.Application.find({ employerId });
        const statusCounts = {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch employer stats' });
    }
};
exports.getEmployerStats = getEmployerStats;
const getAdminStats = async (_req, res) => {
    try {
        const totalSeekers = await User_1.User.countDocuments({ role: 'seeker' });
        const pendingEmployers = await User_1.User.countDocuments({
            role: 'employer',
            'employerProfile.verificationStatus': 'pending'
        });
        const approvedEmployers = await User_1.User.countDocuments({
            role: 'employer',
            'employerProfile.verificationStatus': 'approved'
        });
        const totalOpportunities = await Opportunity_1.Opportunity.countDocuments();
        const publishedOpportunities = await Opportunity_1.Opportunity.countDocuments({ status: 'published' });
        const pendingReports = await Report_1.Report.countDocuments({ status: 'pending' });
        const openSafetyTickets = await SupportTicket_1.SupportTicket.countDocuments({ status: 'open' });
        res.json({
            totalSeekers,
            pendingEmployers,
            approvedEmployers,
            totalOpportunities,
            publishedOpportunities,
            pendingReports,
            openSafetyTickets
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
    }
};
exports.getAdminStats = getAdminStats;
