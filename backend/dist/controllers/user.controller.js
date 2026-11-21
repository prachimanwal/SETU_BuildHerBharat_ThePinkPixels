"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.getProfileCompletion = exports.updateProfile = exports.getProfile = exports.calculateProfileCompletion = void 0;
const Application_1 = require("../models/Application");
const AssessmentResult_1 = require("../models/AssessmentResult");
const LearningProgress_1 = require("../models/LearningProgress");
const Portfolio_1 = require("../models/Portfolio");
const Opportunity_1 = require("../models/Opportunity");
const LearningResource_1 = require("../models/LearningResource");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const userSerializer_1 = require("../utils/userSerializer");
Object.defineProperty(exports, "calculateProfileCompletion", { enumerable: true, get: function () { return userSerializer_1.calculateProfileCompletion; } });
const getProfile = async (req, res) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required', 401);
        return;
    }
    (0, response_1.sendSuccess)(res, 'User profile fetched successfully', {
        user: (0, userSerializer_1.serializeUser)(req.user)
    });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parseResult = validators_1.profileUpdateSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Invalid profile fields', 400);
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
            };
        }
        else if (user.role === 'employer' && employerProfile) {
            user.employerProfile = {
                ...user.employerProfile,
                ...employerProfile,
                // Preserve administrative verification status
                verificationStatus: user.employerProfile?.verificationStatus || 'pending'
            };
        }
        const completionPercentage = (0, userSerializer_1.calculateProfileCompletion)(user);
        user.profileCompletion = completionPercentage;
        await user.save();
        (0, response_1.sendSuccess)(res, 'Profile updated successfully', {
            user: (0, userSerializer_1.serializeUser)(user),
            profileCompletionPercentage: completionPercentage
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update profile', 500);
    }
};
exports.updateProfile = updateProfile;
const getProfileCompletion = async (req, res) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Authentication required', 401);
        return;
    }
    const completionPercentage = (0, userSerializer_1.calculateProfileCompletion)(req.user);
    (0, response_1.sendSuccess)(res, 'Profile completion calculated', {
        completionPercentage,
        message: `Your profile is ${completionPercentage}% complete. Complete your profile to receive better opportunity matches.`
    });
};
exports.getProfileCompletion = getProfileCompletion;
const getDashboard = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const userId = req.user._id;
        // 1. Applications & Pipeline
        const applications = await Application_1.Application.find({ seekerId: userId })
            .populate('opportunityId', 'title organisationName workMode stipendOrSalary location')
            .sort({ updatedAt: -1 });
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
        const interviewUpdates = applications
            .filter((app) => app.status === 'Interview Scheduled' && app.interviewDetails?.date)
            .map((app) => ({
            applicationId: app._id,
            opportunityTitle: app.opportunityId?.title || 'Job Opening',
            organisationName: app.opportunityId?.organisationName || '',
            interviewDetails: app.interviewDetails
        }));
        // 2. Assessment results & verified skills
        const attempts = await AssessmentResult_1.AssessmentResult.find({ userId })
            .populate('assessmentId', 'title domain')
            .sort({ completedAt: -1 });
        const passedAttempts = attempts.filter((att) => att.passed);
        const passedDomains = Array.from(new Set(passedAttempts.map((att) => att.domain)));
        const skillsVerifiedCount = passedDomains.length;
        // 3. Learning progress
        const learningProgress = await LearningProgress_1.LearningProgress.find({ userId }).populate('resourceId', 'title type skillTag duration');
        const completedLearning = learningProgress.filter((p) => p.status === 'completed');
        const startedLearning = learningProgress.filter((p) => p.status === 'started');
        // 4. Portfolio projects
        const portfolioProjects = await Portfolio_1.Portfolio.find({ userId }).sort({ createdAt: -1 });
        // 5. Recommended opportunities based on user skills
        const userSkills = (req.user.seekerProfile?.skills || []).map((s) => s.toLowerCase());
        const allPublishedOpps = await Opportunity_1.Opportunity.find({
            status: 'published',
            moderationStatus: 'clean'
        })
            .sort({ createdAt: -1 })
            .limit(10);
        const recommendedOpportunities = allPublishedOpps
            .map((opp) => {
            const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
            const matchingSkills = opp.requiredSkills.filter((s) => userSkills.includes(s.toLowerCase()));
            const matchScore = oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;
            return {
                ...opp.toObject(),
                matchScore,
                matchingSkills
            };
        })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3);
        // 6. Recommended learning resources
        const allResources = await LearningResource_1.LearningResource.find().limit(6);
        const completedResourceIds = new Set(completedLearning.map((p) => p.resourceId?.toString()));
        const recommendedLearning = allResources
            .filter((r) => !completedResourceIds.has(r._id.toString()))
            .slice(0, 2);
        // 7. Recent activity chronological feed
        const recentActivityList = [];
        applications.forEach((app) => {
            recentActivityList.push({
                id: `app-${app._id}`,
                type: 'application',
                title: `Applied to ${app.opportunityId?.title || 'Job Opening'}`,
                subtitle: `${app.opportunityId?.organisationName || 'Employer'} • Status: ${app.status}`,
                timestamp: app.updatedAt || app.createdAt,
                badgeText: app.status,
                badgeColor: app.status === 'Selected'
                    ? 'emerald'
                    : app.status === 'Interview Scheduled'
                        ? 'purple'
                        : 'blue'
            });
        });
        attempts.forEach((att) => {
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
        completedLearning.forEach((p) => {
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
        portfolioProjects.forEach((proj) => {
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
        const profileCompletionPercentage = (0, userSerializer_1.calculateProfileCompletion)(req.user);
        // 7-Stage Journey calculation
        const profile = req.user.seekerProfile;
        const stage1_discover = !!(profile?.skills?.length && profile?.location?.city);
        const stage2_assess = attempts.length > 0;
        const stage3_learn = learningProgress.length > 0;
        const stage4_practice = completedLearning.some((p) => p.resourceId?.type === 'practical_assignment');
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
        const dashboardData = {
            user: (0, userSerializer_1.serializeUser)(req.user),
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
        (0, response_1.sendSuccess)(res, 'Dashboard data retrieved successfully', dashboardData);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to retrieve dashboard data', 500);
    }
};
exports.getDashboard = getDashboard;
