"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScheme = exports.updateScheme = exports.createScheme = exports.getSchemeById = exports.toggleSaveScheme = exports.getRecommendedSchemes = exports.getSchemes = exports.evaluateSchemeForUser = void 0;
const GovernmentScheme_1 = require("../models/GovernmentScheme");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const calculateAgeFromDob = (dob) => {
    if (!dob || !dob.trim())
        return null;
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime()))
        return null;
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
        age--;
    }
    return age >= 0 && age <= 110 ? age : null;
};
const evaluateSchemeForUser = (scheme, user, savedSet) => {
    const obj = typeof scheme.toObject === 'function' ? scheme.toObject() : { ...scheme };
    const isSaved = savedSet.has(String(obj._id));
    if (!user || !user.seekerProfile) {
        return {
            ...obj,
            isSaved,
            eligibilityStatus: 'Eligibility Not Assessed',
            eligibilityExplanation: 'Sign in and complete your SETU profile to see a personalized eligibility hint. Always confirm final criteria on the official portal.',
            recommendationScore: 10
        };
    }
    const sp = user.seekerProfile;
    const rules = obj.eligibilityRules || {};
    const age = calculateAgeFromDob(sp.dateOfBirth);
    const eduEntries = Array.isArray(sp.education) ? sp.education : [];
    const eduString = [
        sp.educationLevel || '',
        ...eduEntries.map((e) => `${e.level || ''} ${e.degree || ''} ${e.status || ''}`)
    ]
        .join(' ')
        .toLowerCase();
    const interests = Array.isArray(sp.interests) ? sp.interests : [];
    const goals = Array.isArray(sp.careerGoalsList) ? sp.careerGoalsList : [];
    const profileContext = [...interests, ...goals, sp.careerGoals || '', sp.bio || '']
        .join(' ')
        .toLowerCase();
    let status = 'Likely Eligible';
    let score = 30;
    const reasons = [];
    const missingInfo = [];
    // 1. Check strict age bounds if provided
    if (typeof rules.minAge === 'number' || typeof rules.maxAge === 'number') {
        if (age === null) {
            missingInfo.push('Date of birth not added (optional) to verify age limits');
        }
        else {
            if (typeof rules.minAge === 'number' && age < rules.minAge) {
                status = 'Not Eligible Based on Available Information';
                score -= 40;
                reasons.push(`Minimum age guideline is ${rules.minAge} years (profile indicates age ${age})`);
            }
            else if (typeof rules.maxAge === 'number' && age > rules.maxAge) {
                status = 'Not Eligible Based on Available Information';
                score -= 40;
                reasons.push(`Upper age guideline is ${rules.maxAge} years (profile indicates age ${age})`);
            }
            else {
                score += 15;
                reasons.push(`Age (${age}) fits the stated age window`);
            }
        }
    }
    // 2. Check education alignment
    const requiredEdu = Array.isArray(rules.educationLevels) ? rules.educationLevels : [];
    if (requiredEdu.length > 0) {
        if (!eduString.trim()) {
            missingInfo.push('Add your educational qualifications to check qualification fit');
        }
        else {
            const eduMatched = requiredEdu.some((lvl) => eduString.includes(lvl.toLowerCase()));
            if (eduMatched) {
                score += 20;
                reasons.push('Matches your educational qualification level');
            }
            else if (obj.slug === 'nats-apprenticeship' &&
                (eduString.includes('class 10') || eduString.includes('class 12')) &&
                !eduString.includes('diploma') &&
                !eduString.includes('graduate')) {
                status = 'Not Eligible Based on Available Information';
                score -= 25;
                reasons.push('NATS requires a completed Diploma or Degree qualification');
            }
            else {
                missingInfo.push('Confirm whether your specific qualification matches scheme guidelines');
            }
        }
    }
    // 3. Domain / Goal / Rural / Women / Entrepreneurship alignment
    if (rules.entrepreneurshipFocused) {
        if (profileContext.includes('business') ||
            profileContext.includes('entrepreneur') ||
            profileContext.includes('startup') ||
            profileContext.includes('freelance') ||
            profileContext.includes('self')) {
            score += 25;
            reasons.push('Aligned with your entrepreneurship or business goals');
        }
        else {
            missingInfo.push('Intended for entrepreneurs or self-employment ventures');
        }
    }
    if (rules.studentFriendly) {
        const jobTypes = sp.employmentPreferences?.jobTypes || [];
        const wantsInternship = jobTypes.some((t) => t.toLowerCase().includes('intern') || t.toLowerCase().includes('apprentice')) ||
            eduString.includes('student') ||
            eduString.includes('pursuing') ||
            profileContext.includes('first job') ||
            profileContext.includes('skill');
        if (wantsInternship) {
            score += 22;
            reasons.push('Strong fit for students, freshers, or skill-building goals');
        }
    }
    if (rules.ruralFocused && sp.location?.isRural) {
        score += 20;
        reasons.push('Relevant to rural employment & livelihood profiles');
    }
    if (rules.womenFocused) {
        missingInfo.push('Includes women-focused or category-specific eligibility criteria — verify on official portal');
    }
    if (obj.slug === 'pm-internship-scheme') {
        missingInfo.push('Official income and full-time employment exclusions must be verified on pminternship.mca.gov.in');
    }
    // Final status resolution
    if (status !== 'Not Eligible Based on Available Information') {
        if (eduEntries.length === 0 && interests.length === 0 && goals.length === 0) {
            status = 'Eligibility Not Assessed';
        }
        else if (missingInfo.length > 0 && reasons.length === 0) {
            status = 'More Information Required';
        }
        else if (missingInfo.length > 0 && (rules.womenFocused || obj.slug === 'pm-internship-scheme')) {
            status = 'More Information Required';
        }
        else {
            status = 'Likely Eligible';
        }
    }
    const explanationParts = [...reasons, ...missingInfo].slice(0, 2);
    return {
        ...obj,
        isSaved,
        eligibilityStatus: status,
        eligibilityExplanation: explanationParts.length > 0
            ? `${explanationParts.join('. ')}. Please verify final terms on the official portal.`
            : 'Matches general citizen eligibility guidelines. Confirm details on the official portal.',
        recommendationScore: Math.max(0, score)
    };
};
exports.evaluateSchemeForUser = evaluateSchemeForUser;
const getSchemes = async (req, res) => {
    try {
        const { category, audience, query, search } = req.query;
        const filter = {};
        if (category && category !== 'all' && category !== 'All') {
            filter.category = String(category);
        }
        if (audience && audience !== 'all') {
            filter.targetAudience = new RegExp(String(audience).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }
        const qText = String(query || search || '').trim();
        if (qText) {
            const qRegex = new RegExp(qText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { title: qRegex },
                { hindiTitle: qRegex },
                { ministry: qRegex },
                { description: qRegex },
                { benefitsSummary: qRegex },
                { eligibilitySummary: qRegex },
                { targetAudience: qRegex }
            ];
        }
        const schemes = await GovernmentScheme_1.GovernmentScheme.find(filter).sort({ createdAt: 1 });
        const savedSet = new Set((req.user?.savedSchemes || []).map((id) => id.toString()));
        const enriched = schemes.map((s) => (0, exports.evaluateSchemeForUser)(s, req.user, savedSet));
        (0, response_1.sendSuccess)(res, 'Government schemes retrieved successfully', enriched);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch government schemes', 500);
    }
};
exports.getSchemes = getSchemes;
const getRecommendedSchemes = async (req, res) => {
    try {
        const schemes = await GovernmentScheme_1.GovernmentScheme.find();
        const savedSet = new Set((req.user?.savedSchemes || []).map((id) => id.toString()));
        const ranked = schemes
            .map((s) => (0, exports.evaluateSchemeForUser)(s, req.user, savedSet))
            .filter((s) => s.eligibilityStatus !== 'Not Eligible Based on Available Information')
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 6);
        (0, response_1.sendSuccess)(res, 'Recommended government schemes retrieved', ranked);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to compute scheme recommendations', 500);
    }
};
exports.getRecommendedSchemes = getRecommendedSchemes;
const toggleSaveScheme = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const scheme = await GovernmentScheme_1.GovernmentScheme.findById(id);
        if (!scheme) {
            (0, response_1.sendError)(res, 'Government scheme not found', 404);
            return;
        }
        const existing = Array.isArray(req.user.savedSchemes) ? req.user.savedSchemes : [];
        const idx = existing.findIndex((sId) => sId.toString() === scheme._id.toString());
        let saved = false;
        if (idx >= 0) {
            existing.splice(idx, 1);
            saved = false;
        }
        else {
            existing.push(scheme._id);
            saved = true;
        }
        req.user.savedSchemes = existing;
        await req.user.save();
        (0, response_1.sendSuccess)(res, saved ? 'Scheme saved to your bookmarks' : 'Scheme removed from bookmarks', {
            schemeId: scheme._id,
            saved,
            savedCount: existing.length
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update saved scheme', 500);
    }
};
exports.toggleSaveScheme = toggleSaveScheme;
const getSchemeById = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await GovernmentScheme_1.GovernmentScheme.findById(id);
        if (!scheme) {
            (0, response_1.sendError)(res, 'Government scheme not found', 404);
            return;
        }
        const savedSet = new Set((req.user?.savedSchemes || []).map((sid) => sid.toString()));
        (0, response_1.sendSuccess)(res, 'Scheme details retrieved', (0, exports.evaluateSchemeForUser)(scheme, req.user, savedSet));
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to retrieve scheme', 500);
    }
};
exports.getSchemeById = getSchemeById;
const createScheme = async (req, res) => {
    try {
        const parseResult = validators_1.schemeSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
            return;
        }
        const newScheme = new GovernmentScheme_1.GovernmentScheme(parseResult.data);
        await newScheme.save();
        (0, response_1.sendSuccess)(res, 'Government scheme created successfully', newScheme, 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to create government scheme', 500);
    }
};
exports.createScheme = createScheme;
const updateScheme = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await GovernmentScheme_1.GovernmentScheme.findById(id);
        if (!scheme) {
            (0, response_1.sendError)(res, 'Government scheme not found', 404);
            return;
        }
        const parseResult = validators_1.schemeSchema.partial().safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
            return;
        }
        Object.assign(scheme, parseResult.data);
        await scheme.save();
        (0, response_1.sendSuccess)(res, 'Government scheme updated successfully', scheme);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update government scheme', 500);
    }
};
exports.updateScheme = updateScheme;
const deleteScheme = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await GovernmentScheme_1.GovernmentScheme.findByIdAndDelete(id);
        if (!scheme) {
            (0, response_1.sendError)(res, 'Government scheme not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, 'Government scheme deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to delete government scheme', 500);
    }
};
exports.deleteScheme = deleteScheme;
