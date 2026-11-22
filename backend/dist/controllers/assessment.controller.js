"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAssessment = exports.getAssessmentById = exports.getAssessmentHistory = exports.getRecommendedAssessments = exports.getAssessments = void 0;
const Assessment_1 = require("../models/Assessment");
const AssessmentResult_1 = require("../models/AssessmentResult");
const LearningResource_1 = require("../models/LearningResource");
const response_1 = require("../utils/response");
const sanitizeAssessment = (doc) => {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    const questions = Array.isArray(obj.questions)
        ? obj.questions.map((q) => ({
            id: q.id,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            skillTested: q.skillTested
        }))
        : [];
    return {
        ...obj,
        category: obj.category || 'Technical',
        skillsEvaluated: Array.isArray(obj.skillsEvaluated) && obj.skillsEvaluated.length > 0
            ? obj.skillsEvaluated
            : [obj.domain].filter(Boolean),
        timed: obj.timed !== false,
        estimatedMinutes: obj.durationMinutes || 15,
        questionCount: questions.length,
        questions
    };
};
const normalizeToken = (value) => value.toLowerCase().trim();
const scoreAssessmentForUser = (assessment, user, passedAssessmentIds) => {
    const sp = user?.seekerProfile || {};
    const detailedSkills = Array.isArray(sp.detailedSkills)
        ? sp.detailedSkills
        : [];
    const flatSkills = Array.isArray(sp.skills) ? sp.skills : [];
    const interests = Array.isArray(sp.interests) ? sp.interests : [];
    const goals = Array.isArray(sp.careerGoalsList) ? sp.careerGoalsList : [];
    const educationText = Array.isArray(sp.education)
        ? sp.education
            .map((e) => `${e.level || ''} ${e.degree || ''} ${e.specialization || ''} ${e.stream || ''}`)
            .join(' ')
            .toLowerCase()
        : '';
    const assessmentTokens = [
        assessment.title || '',
        assessment.domain || '',
        assessment.category || '',
        ...(Array.isArray(assessment.skillsEvaluated) ? assessment.skillsEvaluated : [])
    ]
        .join(' ')
        .toLowerCase();
    let score = 10;
    const reasons = [];
    // Match unverified self-reported skills first so user can earn verified badges
    for (const sk of detailedSkills) {
        const token = normalizeToken(sk.name || '');
        if (!token || token.length < 2)
            continue;
        if (assessmentTokens.includes(token)) {
            const isVerified = Boolean(sk.verified || sk.source === 'assessment_verified');
            score += isVerified ? 10 : 35;
            if (!isVerified) {
                reasons.push(`Verify your "${sk.name}" skill`);
            }
        }
    }
    for (const sk of flatSkills) {
        const token = normalizeToken(sk || '');
        if (!token || token.length < 2)
            continue;
        if (assessmentTokens.includes(token) && reasons.length === 0) {
            score += 22;
            reasons.push(`Matches your skill "${sk}"`);
        }
    }
    // Match interests
    for (const interest of interests) {
        const lower = normalizeToken(interest);
        if ((lower.includes('software') || lower.includes('web') || lower.includes('coding')) &&
            ['python', 'javascript', 'react', 'html', 'sql', 'java', 'c++', 'data structures'].some((k) => assessmentTokens.includes(k))) {
            score += 18;
            if (reasons.length < 2)
                reasons.push(`Aligned with ${interest}`);
        }
        else if ((lower.includes('data') || lower.includes('ai') || lower.includes('analytics')) &&
            ['python', 'sql', 'data', 'machine learning', 'excel'].some((k) => assessmentTokens.includes(k))) {
            score += 18;
            if (reasons.length < 2)
                reasons.push(`Aligned with ${interest}`);
        }
        else if ((lower.includes('design') || lower.includes('creative') || lower.includes('media') || lower.includes('marketing')) &&
            assessment.category === 'Creative') {
            score += 18;
            if (reasons.length < 2)
                reasons.push(`Aligned with ${interest}`);
        }
        else if ((lower.includes('business') || lower.includes('management') || lower.includes('operations') || lower.includes('hr')) &&
            assessment.category === 'Professional') {
            score += 16;
            if (reasons.length < 2)
                reasons.push(`Aligned with ${interest}`);
        }
    }
    // Match goals (e.g. fresher / campus placement / aptitude)
    const goalsText = goals.join(' ').toLowerCase();
    if ((goalsText.includes('first job') || goalsText.includes('internship') || goalsText.includes('placement')) &&
        assessment.category === 'Aptitude') {
        score += 15;
        if (reasons.length < 2)
            reasons.push('Great preparation for placement & internship screening');
    }
    // Education field hints
    if ((educationText.includes('computer') || educationText.includes('b.tech') || educationText.includes('bca') || educationText.includes('mca')) &&
        assessment.category === 'Technical') {
        score += 10;
    }
    else if ((educationText.includes('commerce') || educationText.includes('bba') || educationText.includes('mba')) &&
        (assessmentTokens.includes('excel') || assessment.category === 'Professional')) {
        score += 10;
    }
    // Slight downrank if already passed so new assessments surface first
    if (passedAssessmentIds.has(String(assessment._id))) {
        score -= 15;
    }
    return {
        score,
        reason: reasons[0] ||
            (assessment.category === 'Aptitude'
                ? 'Strengthens interview & placement readiness'
                : `Builds verified ${assessment.category.toLowerCase()} capability`)
    };
};
const getAssessments = async (req, res) => {
    try {
        const { category, difficulty, search } = req.query;
        const filter = {};
        if (category && category !== 'All') {
            filter.category = String(category);
        }
        if (difficulty && difficulty !== 'All') {
            filter.difficulty = String(difficulty);
        }
        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { title: regex },
                { domain: regex },
                { description: regex },
                { skillsEvaluated: regex }
            ];
        }
        const assessments = await Assessment_1.Assessment.find(filter)
            .select('-questions.correctAnswerIndex -questions.explanation')
            .sort({ category: 1, difficulty: 1, title: 1 });
        (0, response_1.sendSuccess)(res, 'Assessments catalog retrieved', assessments.map((a) => sanitizeAssessment(a)));
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch assessments', 500);
    }
};
exports.getAssessments = getAssessments;
const getRecommendedAssessments = async (req, res) => {
    try {
        const allAssessments = await Assessment_1.Assessment.find().select('-questions.correctAnswerIndex -questions.explanation');
        const passedIds = new Set();
        if (req.user) {
            const attempts = await AssessmentResult_1.AssessmentResult.find({ userId: req.user._id, passed: true }).select('assessmentId');
            attempts.forEach((att) => passedIds.add(String(att.assessmentId)));
        }
        const ranked = allAssessments
            .map((a) => {
            const clean = sanitizeAssessment(a);
            const { score, reason } = scoreAssessmentForUser(clean, req.user, passedIds);
            return {
                ...clean,
                recommendationScore: score,
                recommendationReason: reason
            };
        })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 8);
        (0, response_1.sendSuccess)(res, 'Recommended assessments retrieved', ranked);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to compute recommended assessments', 500);
    }
};
exports.getRecommendedAssessments = getRecommendedAssessments;
const getAssessmentHistory = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const attempts = await AssessmentResult_1.AssessmentResult.find({ userId: req.user._id })
            .populate('assessmentId', 'title domain category difficulty passingScore durationMinutes')
            .sort({ completedAt: -1 });
        (0, response_1.sendSuccess)(res, 'Assessment history retrieved', attempts);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch assessment history', 500);
    }
};
exports.getAssessmentHistory = getAssessmentHistory;
const getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await Assessment_1.Assessment.findById(id).select('-questions.correctAnswerIndex -questions.explanation');
        if (!assessment) {
            (0, response_1.sendError)(res, 'Assessment not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, 'Assessment details retrieved', sanitizeAssessment(assessment));
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
        const id = req.params.id || req.body?.assessmentId;
        const { answers } = req.body; // Map of questionId -> selectedOptionIndex
        if (!id) {
            (0, response_1.sendError)(res, 'Assessment ID is required', 400);
            return;
        }
        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
            (0, response_1.sendError)(res, 'Answers object is required', 400);
            return;
        }
        // Fetch assessment including the hidden correctAnswerIndex
        const assessment = (await Assessment_1.Assessment.findById(id).select('+questions.correctAnswerIndex'));
        if (!assessment) {
            (0, response_1.sendError)(res, 'Assessment not found', 404);
            return;
        }
        let correctCount = 0;
        const totalQuestions = assessment.questions.length;
        const strengths = [];
        const gaps = [];
        const questionReview = [];
        assessment.questions.forEach((q) => {
            const rawAns = answers[q.id];
            const userAnswer = typeof rawAns === 'number' && Number.isInteger(rawAns) ? rawAns : null;
            const isCorrect = userAnswer !== null && userAnswer === q.correctAnswerIndex;
            if (isCorrect) {
                correctCount++;
                strengths.push(q.skillTested);
            }
            else {
                gaps.push(q.skillTested);
            }
            questionReview.push({
                id: q.id,
                question: q.question,
                options: q.options,
                selectedOptionIndex: userAnswer,
                correctAnswerIndex: q.correctAnswerIndex,
                isCorrect,
                explanation: q.explanation,
                skillTested: q.skillTested
            });
        });
        const incorrectCount = totalQuestions - correctCount;
        const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = percentage >= assessment.passingScore;
        const uniqueStrengths = Array.from(new Set(strengths));
        const uniqueGaps = Array.from(new Set(gaps));
        const skillsToVerify = Array.isArray(assessment.skillsEvaluated) && assessment.skillsEvaluated.length > 0
            ? assessment.skillsEvaluated
            : [assessment.domain];
        // Award verified skill badges ONLY when passing criteria are met
        const verifiedSkillsAwarded = [];
        if (passed && req.user.seekerProfile) {
            const existingDetailed = Array.isArray(req.user.seekerProfile.detailedSkills)
                ? [...req.user.seekerProfile.detailedSkills]
                : [];
            const existingFlat = Array.isArray(req.user.seekerProfile.skills)
                ? [...req.user.seekerProfile.skills]
                : [];
            const proficiencyFromScore = percentage >= 90 ? 'Advanced' : percentage >= 75 ? 'Intermediate' : 'Beginner';
            for (const skillName of skillsToVerify) {
                const cleanSkill = String(skillName || '').trim();
                if (!cleanSkill)
                    continue;
                verifiedSkillsAwarded.push(cleanSkill);
                const idx = existingDetailed.findIndex((s) => s.name.toLowerCase() === cleanSkill.toLowerCase());
                if (idx >= 0) {
                    existingDetailed[idx].verified = true;
                    existingDetailed[idx].source = 'assessment_verified';
                    if (percentage >= 90)
                        existingDetailed[idx].proficiency = 'Advanced';
                }
                else {
                    existingDetailed.push({
                        name: cleanSkill,
                        category: assessment.category || 'Technical',
                        proficiency: proficiencyFromScore,
                        verified: true,
                        source: 'assessment_verified'
                    });
                }
                if (!existingFlat.some((s) => s.toLowerCase() === cleanSkill.toLowerCase())) {
                    existingFlat.push(cleanSkill);
                }
            }
            req.user.seekerProfile.detailedSkills = existingDetailed;
            req.user.seekerProfile.skills = existingFlat;
            await req.user.save();
        }
        const result = new AssessmentResult_1.AssessmentResult({
            userId: req.user._id,
            assessmentId: assessment._id,
            assessmentTitle: assessment.title,
            category: assessment.category || 'Technical',
            domain: assessment.domain,
            score: correctCount,
            correctCount,
            incorrectCount,
            totalQuestions,
            maxScore: totalQuestions,
            percentage,
            passed,
            badgeAwarded: passed && verifiedSkillsAwarded.length > 0,
            verifiedSkillsAwarded,
            strengths: uniqueStrengths,
            gaps: uniqueGaps,
            answers
        });
        await result.save();
        // Fetch learning recommendations matching identified skill gaps or domain
        const gapTerms = Array.from(new Set([...uniqueGaps, assessment.domain, ...skillsToVerify].filter(Boolean)));
        const gapRegexes = gapTerms.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        const recommendations = await LearningResource_1.LearningResource.find({
            $or: [
                { skillTag: { $in: gapRegexes } },
                { skillsGained: { $in: gapRegexes } },
                { title: { $in: gapRegexes } }
            ]
        }).limit(4);
        // Suggest next assessment in the same category (excluding current)
        const nextAssessmentDoc = await Assessment_1.Assessment.findOne({
            _id: { $ne: assessment._id },
            category: assessment.category || 'Technical'
        })
            .select('title domain category difficulty durationMinutes passingScore')
            .lean();
        (0, response_1.sendSuccess)(res, 'Assessment evaluated successfully', {
            resultId: result._id,
            assessmentId: assessment._id,
            assessmentTitle: assessment.title,
            category: assessment.category || 'Technical',
            domain: assessment.domain,
            score: correctCount,
            correctCount,
            incorrectCount,
            totalQuestions,
            maxScore: totalQuestions,
            percentage,
            passed,
            passingScore: assessment.passingScore,
            badgeAwarded: passed && verifiedSkillsAwarded.length > 0,
            verifiedSkillsAwarded,
            strengths: uniqueStrengths,
            gaps: uniqueGaps,
            recommendations,
            nextAssessment: nextAssessmentDoc || null,
            questionReview
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to submit assessment', 500);
    }
};
exports.submitAssessment = submitAssessment;
