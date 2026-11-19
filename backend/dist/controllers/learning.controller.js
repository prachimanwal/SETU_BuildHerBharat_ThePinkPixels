"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeLearning = exports.getRecommendedLearning = exports.getLearningResources = void 0;
const LearningResource_1 = require("../models/LearningResource");
const LearningProgress_1 = require("../models/LearningProgress");
const Portfolio_1 = require("../models/Portfolio");
const AssessmentResult_1 = require("../models/AssessmentResult");
const response_1 = require("../utils/response");
const getLearningResources = async (req, res) => {
    try {
        const { type, skillTag } = req.query;
        const filter = {};
        if (type && type !== 'all')
            filter.type = type;
        if (skillTag && skillTag !== 'all')
            filter.skillTag = skillTag;
        const resources = await LearningResource_1.LearningResource.find(filter).sort({ createdAt: 1 });
        let userProgressMap = {};
        if (req.user) {
            const progressDocs = await LearningProgress_1.LearningProgress.find({ userId: req.user._id });
            progressDocs.forEach((p) => {
                userProgressMap[p.resourceId.toString()] = p.status;
            });
        }
        const enriched = resources.map((r) => ({
            ...r.toObject(),
            progressStatus: userProgressMap[r._id.toString()] || 'not_started'
        }));
        (0, response_1.sendSuccess)(res, 'Learning resources retrieved', enriched);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch learning resources', 500);
    }
};
exports.getLearningResources = getLearningResources;
const getRecommendedLearning = async (req, res) => {
    try {
        let skillGaps = [];
        if (req.user) {
            const recentAttempts = await AssessmentResult_1.AssessmentResult.find({ userId: req.user._id })
                .sort({ completedAt: -1 })
                .limit(3);
            recentAttempts.forEach((att) => {
                skillGaps.push(...att.gaps);
            });
        }
        let recommendations;
        if (skillGaps.length > 0) {
            recommendations = await LearningResource_1.LearningResource.find({
                skillTag: { $in: skillGaps }
            }).limit(4);
        }
        if (!recommendations || recommendations.length === 0) {
            recommendations = await LearningResource_1.LearningResource.find().limit(4);
        }
        (0, response_1.sendSuccess)(res, 'Recommended learning activities retrieved', recommendations);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch recommendations', 500);
    }
};
exports.getRecommendedLearning = getRecommendedLearning;
const completeLearning = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const { submissionUrl, notes } = req.body;
        const resource = await LearningResource_1.LearningResource.findById(id);
        if (!resource) {
            (0, response_1.sendError)(res, 'Learning resource not found', 404);
            return;
        }
        let progress = await LearningProgress_1.LearningProgress.findOne({
            userId: req.user._id,
            resourceId: resource._id
        });
        if (!progress) {
            progress = new LearningProgress_1.LearningProgress({
                userId: req.user._id,
                resourceId: resource._id,
                status: 'completed',
                submissionDetails: submissionUrl || notes || 'Completed on platform'
            });
        }
        else {
            progress.status = 'completed';
            if (submissionUrl || notes) {
                progress.submissionDetails = submissionUrl || notes;
            }
        }
        await progress.save();
        let createdPortfolioProject = null;
        // If practical assignment, auto-create a portfolio deliverable
        if (resource.type === 'practical_assignment') {
            const existingProject = await Portfolio_1.Portfolio.findOne({
                userId: req.user._id,
                title: resource.title
            });
            if (!existingProject) {
                createdPortfolioProject = new Portfolio_1.Portfolio({
                    userId: req.user._id,
                    title: resource.title,
                    description: `Practical work deliverable completed via SETU learning path: ${resource.description}`,
                    skills: [resource.skillTag],
                    workSampleUrl: submissionUrl || resource.contentUrl || 'https://setu.demo/deliverables',
                    category: 'Practical Assignment Deliverable',
                    source: 'practice_assignment',
                    featured: true
                });
                await createdPortfolioProject.save();
            }
        }
        (0, response_1.sendSuccess)(res, 'Learning activity marked as completed', {
            progress,
            portfolioProject: createdPortfolioProject
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to complete learning activity', 500);
    }
};
exports.completeLearning = completeLearning;
