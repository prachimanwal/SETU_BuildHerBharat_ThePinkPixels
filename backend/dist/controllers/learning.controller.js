"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeLearning = exports.updateLearningProgress = exports.getRecommendedLearning = exports.getLearningResourceById = exports.getLearningResources = void 0;
const LearningResource_1 = require("../models/LearningResource");
const LearningProgress_1 = require("../models/LearningProgress");
const Portfolio_1 = require("../models/Portfolio");
const AssessmentResult_1 = require("../models/AssessmentResult");
const response_1 = require("../utils/response");
const progressSnapshot_service_1 = require("../services/progressSnapshot.service");
const isValidHttpUrl = (value) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
};
const attachProgress = (resource, progressDoc) => {
    const obj = typeof resource.toObject === 'function' ? resource.toObject() : { ...resource };
    return {
        ...obj,
        progressStatus: progressDoc?.status || 'not_started',
        completedSteps: Array.isArray(progressDoc?.completedSteps) ? progressDoc.completedSteps : [],
        submissionText: progressDoc?.submissionText || '',
        submissionUrl: progressDoc?.submissionUrl || '',
        submissionDetails: progressDoc?.submissionDetails || '',
        completedAt: progressDoc?.completedAt || null,
        updatedProgressAt: progressDoc?.updatedAt || null
    };
};
const getLearningResources = async (req, res) => {
    try {
        const { type, category, difficulty, skillTag, skill, search } = req.query;
        const filter = {};
        if (type && type !== 'all')
            filter.type = String(type);
        if (category && category !== 'all' && category !== 'All')
            filter.category = String(category);
        if (difficulty && difficulty !== 'all' && difficulty !== 'All') {
            filter.difficulty = String(difficulty);
        }
        const skillQuery = String(skill || skillTag || '').trim();
        if (skillQuery && skillQuery.toLowerCase() !== 'all') {
            const regex = new RegExp(skillQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ skillTag: regex }, { skillsGained: regex }, { title: regex }];
        }
        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$and = [
                ...(filter.$and || []),
                {
                    $or: [
                        { title: regex },
                        { description: regex },
                        { skillTag: regex },
                        { skillsGained: regex },
                        { category: regex }
                    ]
                }
            ];
        }
        const resources = await LearningResource_1.LearningResource.find(filter).sort({ type: 1, category: 1, title: 1 });
        const progressMap = new Map();
        if (req.user) {
            const progressDocs = await LearningProgress_1.LearningProgress.find({ userId: req.user._id });
            progressDocs.forEach((p) => {
                progressMap.set(p.resourceId.toString(), p);
            });
        }
        const enriched = resources.map((r) => attachProgress(r, progressMap.get(r._id.toString())));
        (0, response_1.sendSuccess)(res, 'Learning resources retrieved', enriched);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch learning resources', 500);
    }
};
exports.getLearningResources = getLearningResources;
const getLearningResourceById = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await LearningResource_1.LearningResource.findById(id);
        if (!resource) {
            (0, response_1.sendError)(res, 'Learning resource not found', 404);
            return;
        }
        let progressDoc = null;
        if (req.user) {
            progressDoc = await LearningProgress_1.LearningProgress.findOne({
                userId: req.user._id,
                resourceId: resource._id
            });
        }
        (0, response_1.sendSuccess)(res, 'Learning resource retrieved', attachProgress(resource, progressDoc));
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch learning resource', 500);
    }
};
exports.getLearningResourceById = getLearningResourceById;
const getRecommendedLearning = async (req, res) => {
    try {
        const allResources = await LearningResource_1.LearningResource.find();
        const skillGaps = [];
        const progressMap = new Map();
        if (req.user) {
            const [recentAttempts, progressDocs] = await Promise.all([
                AssessmentResult_1.AssessmentResult.find({ userId: req.user._id }).sort({ completedAt: -1 }).limit(5),
                LearningProgress_1.LearningProgress.find({ userId: req.user._id })
            ]);
            recentAttempts.forEach((att) => {
                if (Array.isArray(att.gaps)) {
                    skillGaps.push(...att.gaps);
                }
                if (!att.passed && att.domain) {
                    skillGaps.push(att.domain);
                }
            });
            progressDocs.forEach((p) => progressMap.set(p.resourceId.toString(), p));
        }
        const sp = req.user?.seekerProfile || {};
        const profileSkills = [
            ...(Array.isArray(sp.skills) ? sp.skills : []),
            ...(Array.isArray(sp.detailedSkills) ? sp.detailedSkills.map((s) => s.name) : [])
        ].filter(Boolean);
        const interests = Array.isArray(sp.interests) ? sp.interests : [];
        const goals = Array.isArray(sp.careerGoalsList) ? sp.careerGoalsList : [];
        const scored = allResources
            .map((resDoc) => {
            const enriched = attachProgress(resDoc, progressMap.get(resDoc._id.toString()));
            const haystack = [
                enriched.title,
                enriched.category,
                enriched.skillTag,
                ...(Array.isArray(enriched.skillsGained) ? enriched.skillsGained : []),
                enriched.description
            ]
                .join(' ')
                .toLowerCase();
            let score = 10;
            const reasons = [];
            // 1. Direct Assessment Gaps (highest priority)
            for (const gap of skillGaps) {
                const clean = String(gap || '').trim().toLowerCase();
                if (clean.length >= 2 && haystack.includes(clean)) {
                    score += 40;
                    reasons.push(`Closes your assessment gap in ${gap}`);
                    break;
                }
            }
            // 2. Career Interests match
            for (const interest of interests) {
                const lower = interest.toLowerCase();
                if ((lower.includes('software') || lower.includes('web') || lower.includes('coding')) &&
                    enriched.category === 'Programming') {
                    score += 22;
                    reasons.push(`Matches your interest in ${interest}`);
                    break;
                }
                if ((lower.includes('data') || lower.includes('ai') || lower.includes('analytics')) &&
                    enriched.category === 'Data and AI') {
                    score += 22;
                    reasons.push(`Matches your interest in ${interest}`);
                    break;
                }
                if ((lower.includes('design') || lower.includes('creative') || lower.includes('marketing') || lower.includes('media')) &&
                    enriched.category === 'Creative') {
                    score += 22;
                    reasons.push(`Matches your interest in ${interest}`);
                    break;
                }
                if ((lower.includes('business') || lower.includes('management') || lower.includes('finance') || lower.includes('operations')) &&
                    enriched.category === 'Business') {
                    score += 22;
                    reasons.push(`Matches your interest in ${interest}`);
                    break;
                }
            }
            // 3. Profile skills reinforcement
            for (const sk of profileSkills) {
                const clean = sk.toLowerCase();
                if (clean.length >= 2 && haystack.includes(clean)) {
                    score += 15;
                    if (reasons.length === 0)
                        reasons.push(`Strengthens your ${sk} skill`);
                    break;
                }
            }
            // 4. Career goals match
            const goalsText = goals.join(' ').toLowerCase();
            if ((goalsText.includes('first job') || goalsText.includes('restart') || goalsText.includes('interview')) &&
                enriched.category === 'Professional Development') {
                score += 18;
                if (reasons.length === 0)
                    reasons.push('Supports your job-readiness goals');
            }
            // Prioritize in-progress resources, deprioritize already completed
            if (enriched.progressStatus === 'started' || enriched.progressStatus === 'in_progress') {
                score += 12;
            }
            else if (enriched.progressStatus === 'completed') {
                score -= 25;
            }
            return {
                ...enriched,
                recommendationScore: score,
                recommendationReason: reasons[0] || `Builds practical ${enriched.category} capability`
            };
        })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 8);
        (0, response_1.sendSuccess)(res, 'Recommended learning activities retrieved', scored);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch recommendations', 500);
    }
};
exports.getRecommendedLearning = getRecommendedLearning;
const updateLearningProgress = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const id = req.params.id || req.body?.resourceId;
        if (!id) {
            (0, response_1.sendError)(res, 'Learning resource ID is required', 400);
            return;
        }
        const resource = await LearningResource_1.LearningResource.findById(id);
        if (!resource) {
            (0, response_1.sendError)(res, 'Learning resource not found', 404);
            return;
        }
        const rawStatus = req.body?.status;
        const allowedStatuses = ['started', 'in_progress', 'completed'];
        const status = allowedStatuses.includes(rawStatus) ? rawStatus : 'completed';
        const submissionUrl = String(req.body?.submissionUrl || '').trim();
        const submissionText = String(req.body?.submissionText || req.body?.notes || '').trim();
        if (submissionUrl && !isValidHttpUrl(submissionUrl)) {
            (0, response_1.sendError)(res, 'Submission URL must be a valid http:// or https:// web link (e.g., GitHub, Drive, or live site).', 400);
            return;
        }
        const completedSteps = Array.isArray(req.body?.completedSteps)
            ? req.body.completedSteps
                .map((n) => Number(n))
                .filter((n) => Number.isInteger(n) && n >= 0)
            : [];
        let progress = await LearningProgress_1.LearningProgress.findOne({
            userId: req.user._id,
            resourceId: resource._id
        });
        if (!progress) {
            progress = new LearningProgress_1.LearningProgress({
                userId: req.user._id,
                resourceId: resource._id,
                status,
                completedSteps,
                submissionText,
                submissionUrl,
                submissionDetails: submissionUrl || submissionText || (status === 'completed' ? 'Completed on SETU' : ''),
                completedAt: status === 'completed' ? new Date() : undefined
            });
        }
        else {
            progress.status = status;
            if (Array.isArray(req.body?.completedSteps)) {
                progress.completedSteps = completedSteps;
            }
            if (submissionText)
                progress.submissionText = submissionText;
            if (submissionUrl)
                progress.submissionUrl = submissionUrl;
            if (submissionUrl || submissionText) {
                progress.submissionDetails = submissionUrl || submissionText;
            }
            if (status === 'completed' && !progress.completedAt) {
                progress.completedAt = new Date();
            }
        }
        await progress.save();
        void (0, progressSnapshot_service_1.recordUserProgressSnapshot)(req.user._id);
        // If practical assignment is completed, add/update Portfolio deliverable (never auto-verifies skill badge)
        let createdPortfolioProject = null;
        if (status === 'completed' && resource.type === 'practical_assignment') {
            const existingProject = await Portfolio_1.Portfolio.findOne({
                userId: req.user._id,
                title: resource.title
            });
            if (!existingProject) {
                createdPortfolioProject = new Portfolio_1.Portfolio({
                    userId: req.user._id,
                    title: resource.title,
                    description: submissionText ||
                        `Practical assignment completed on SETU: ${resource.description}`,
                    skills: Array.from(new Set([resource.skillTag, ...(resource.skillsGained || [])].filter(Boolean))).slice(0, 5),
                    workSampleUrl: submissionUrl || resource.contentUrl || 'https://oursetu.netlify.app/portfolio',
                    category: 'Practical Assignment Deliverable',
                    source: 'practice_assignment',
                    featured: true
                });
                await createdPortfolioProject.save();
            }
            else if (submissionUrl) {
                existingProject.workSampleUrl = submissionUrl;
                if (submissionText)
                    existingProject.description = submissionText;
                await existingProject.save();
                createdPortfolioProject = existingProject;
            }
        }
        (0, response_1.sendSuccess)(res, 'Learning progress updated successfully', {
            progress,
            portfolioProject: createdPortfolioProject
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update learning progress', 500);
    }
};
exports.updateLearningProgress = updateLearningProgress;
exports.completeLearning = exports.updateLearningProgress;
