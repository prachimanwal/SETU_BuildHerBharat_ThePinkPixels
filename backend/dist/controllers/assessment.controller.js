"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAssessment = exports.getAssessmentById = exports.getAssessments = void 0;
const Assessment_1 = require("../models/Assessment");
const AssessmentResult_1 = require("../models/AssessmentResult");
const LearningResource_1 = require("../models/LearningResource");
const response_1 = require("../utils/response");
const getAssessments = async (_req, res) => {
    try {
        const assessments = await Assessment_1.Assessment.find().select('-questions.correctAnswerIndex');
        (0, response_1.sendSuccess)(res, 'Assessments catalog retrieved', assessments);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch assessments', 500);
    }
};
exports.getAssessments = getAssessments;
const getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await Assessment_1.Assessment.findById(id).select('-questions.correctAnswerIndex');
        if (!assessment) {
            (0, response_1.sendError)(res, 'Assessment not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, 'Assessment details retrieved', assessment);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch assessment', 500);
    }
};
exports.getAssessmentById = getAssessmentById;
const submitAssessment = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const { answers } = req.body; // Map of questionId -> selectedOptionIndex
        if (!answers || typeof answers !== 'object') {
            (0, response_1.sendError)(res, 'Answers object is required', 400);
            return;
        }
        // Fetch assessment including the hidden correctAnswerIndex
        const assessment = await Assessment_1.Assessment.findById(id).select('+questions.correctAnswerIndex');
        if (!assessment) {
            (0, response_1.sendError)(res, 'Assessment not found', 404);
            return;
        }
        let score = 0;
        const maxScore = assessment.questions.length;
        const strengths = [];
        const gaps = [];
        assessment.questions.forEach((q) => {
            const userAnswer = answers[q.id];
            if (userAnswer !== undefined && userAnswer === q.correctAnswerIndex) {
                score++;
                strengths.push(q.skillTested);
            }
            else {
                gaps.push(q.skillTested);
            }
        });
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const passed = percentage >= assessment.passingScore;
        const result = new AssessmentResult_1.AssessmentResult({
            userId: req.user._id,
            assessmentId: assessment._id,
            domain: assessment.domain,
            score,
            maxScore,
            percentage,
            passed,
            strengths: Array.from(new Set(strengths)),
            gaps: Array.from(new Set(gaps)),
            answers
        });
        await result.save();
        // If passed, auto-add domain to seeker's skills if not already present
        if (passed && req.user.seekerProfile) {
            const currentSkills = req.user.seekerProfile.skills || [];
            const domainLabel = assessment.title.replace(' Practical Skill Assessment', '');
            if (!currentSkills.some((s) => s.toLowerCase() === domainLabel.toLowerCase())) {
                req.user.seekerProfile.skills = [...currentSkills, domainLabel];
                await req.user.save();
            }
        }
        // Fetch learning recommendations for identified skill gaps
        const recommendations = await LearningResource_1.LearningResource.find({
            skillTag: { $in: gaps }
        }).limit(3);
        (0, response_1.sendSuccess)(res, 'Assessment evaluated successfully on server', {
            resultId: result._id,
            score,
            maxScore,
            percentage,
            passed,
            passingScore: assessment.passingScore,
            strengths: result.strengths,
            gaps: result.gaps,
            recommendations
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to submit assessment', 500);
    }
};
exports.submitAssessment = submitAssessment;
