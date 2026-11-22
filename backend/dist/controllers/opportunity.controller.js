"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSaveOpportunity = exports.getSavedOpportunities = exports.getMatchedOpportunities = exports.deleteOpportunity = exports.updateOpportunity = exports.createOpportunity = exports.getOpportunityById = exports.getOpportunities = exports.scoreOpportunityForUser = void 0;
const Opportunity_1 = require("../models/Opportunity");
const Application_1 = require("../models/Application");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const scoreOpportunityForUser = (opp, user, savedSet, appliedSet) => {
    const oppObj = typeof opp.toObject === 'function' ? opp.toObject() : { ...opp };
    const idStr = String(oppObj._id);
    const isSaved = savedSet.has(idStr);
    const hasApplied = appliedSet.has(idStr);
    const reqSkills = Array.isArray(oppObj.requiredSkills) ? oppObj.requiredSkills : [];
    if (!user || !user.seekerProfile) {
        return {
            ...oppObj,
            isSaved,
            hasApplied,
            matchScore: null,
            matchingSkills: [],
            missingSkills: reqSkills,
            matchReasons: ['Sign in and complete your SETU profile to see personalized match reasons'],
            matchExplanation: 'Complete your SETU profile to unlock transparent skill matching'
        };
    }
    const sp = user.seekerProfile;
    const detailedSkills = Array.isArray(sp.detailedSkills) ? sp.detailedSkills : [];
    const flatSkills = Array.isArray(sp.skills) ? sp.skills : [];
    const allUserSkillLower = new Set([
        ...flatSkills.map((s) => s.toLowerCase().trim()),
        ...detailedSkills.map((s) => String(s.name || '').toLowerCase().trim())
    ].filter(Boolean));
    const verifiedSkillLower = new Set(detailedSkills
        .filter((s) => s.verified || s.source === 'assessment_verified')
        .map((s) => String(s.name || '').toLowerCase().trim()));
    const matchingSkills = reqSkills.filter((sk) => allUserSkillLower.has(sk.toLowerCase().trim()));
    const verifiedMatches = matchingSkills.filter((sk) => verifiedSkillLower.has(sk.toLowerCase().trim()));
    const missingSkills = reqSkills.filter((sk) => !allUserSkillLower.has(sk.toLowerCase().trim()));
    let weightedScore = 0;
    const matchReasons = [];
    // 1. Skills (45 pts)
    if (reqSkills.length > 0) {
        const skillRatio = matchingSkills.length / reqSkills.length;
        weightedScore += Math.round(skillRatio * 45);
        if (matchingSkills.length > 0) {
            matchReasons.push(`Matches ${matchingSkills.length}/${reqSkills.length} required skills (${matchingSkills.join(', ')})`);
        }
        if (verifiedMatches.length > 0) {
            weightedScore += Math.min(5, verifiedMatches.length * 3);
            matchReasons.push(`Includes verified skill badge(s): ${verifiedMatches.join(', ')}`);
        }
    }
    else {
        weightedScore += 25;
    }
    // 2. Work Mode & Employment Type Preferences (20 pts)
    const prefs = sp.employmentPreferences || {};
    const prefModes = Array.isArray(prefs.workModes)
        ? prefs.workModes.map((m) => m.toLowerCase())
        : [];
    const prefTypes = Array.isArray(prefs.jobTypes)
        ? prefs.jobTypes.map((t) => t.toLowerCase())
        : [];
    const oppMode = String(oppObj.workMode || '').toLowerCase();
    const oppType = String(oppObj.opportunityType || '').toLowerCase();
    if (prefModes.length === 0 ||
        prefModes.some((m) => m.includes(oppMode) || (oppMode === 'onsite' && m.includes('on-site')))) {
        weightedScore += 10;
        if (prefModes.length > 0) {
            matchReasons.push(`Fits your preferred ${oppObj.workMode} work mode`);
        }
    }
    if (prefTypes.length === 0 ||
        prefTypes.some((t) => t.includes(oppType) ||
            (oppType === 'job' && (t.includes('full-time') || t.includes('part-time'))))) {
        weightedScore += 10;
        if (prefTypes.length > 0) {
            matchReasons.push(`Matches your preferred ${oppObj.opportunityType} opportunity type`);
        }
    }
    // 3. Location / Relocation / Remote (15 pts)
    const userCity = String(sp.location?.city || '').toLowerCase().trim();
    const userState = String(sp.location?.state || '').toLowerCase().trim();
    const prefLocs = Array.isArray(prefs.preferredLocations)
        ? prefs.preferredLocations.map((l) => l.toLowerCase().trim())
        : [];
    const oppCity = String(oppObj.location?.city || '').toLowerCase().trim();
    const oppState = String(oppObj.location?.state || '').toLowerCase().trim();
    if (oppMode === 'remote') {
        weightedScore += 15;
        matchReasons.push('Remote-friendly — accessible from anywhere');
    }
    else if ((userCity && oppCity && oppCity.includes(userCity)) ||
        prefLocs.some((loc) => oppCity.includes(loc) || oppState.includes(loc))) {
        weightedScore += 15;
        matchReasons.push(`Located in your preferred area (${oppObj.location?.city})`);
    }
    else if (userState && oppState && oppState.includes(userState)) {
        weightedScore += 10;
        matchReasons.push(`Located in your state (${oppObj.location?.state})`);
    }
    else if (prefs.willingToRelocate) {
        weightedScore += 8;
        matchReasons.push('Matches your willingness to relocate');
    }
    // 4. Career Interests, Goals & Career-Restart alignment (20 pts)
    const interests = Array.isArray(sp.interests) ? sp.interests : [];
    const oppText = `${oppObj.title} ${oppObj.description} ${reqSkills.join(' ')}`.toLowerCase();
    const matchedInterest = interests.find((interest) => interest
        .toLowerCase()
        .split(/[\s/&,-]+/)
        .some((tok) => tok.length >= 4 && oppText.includes(tok)));
    if (matchedInterest) {
        weightedScore += 15;
        matchReasons.push(`Aligned with your career interest in ${matchedInterest}`);
    }
    else {
        weightedScore += 5;
    }
    if (oppObj.isCareerRestart && sp.isCareerRestart) {
        weightedScore += 5;
        matchReasons.push('Career-restart friendly workplace');
    }
    // 5. Academic Score Check — ONLY when the employer explicitly specifies a minimum threshold!
    let academicEligibilityNote = '';
    const hasMinPct = typeof oppObj.minAcademicPercentage === 'number' && oppObj.minAcademicPercentage > 0;
    const hasMinCgpa = typeof oppObj.minCgpa === 'number' && oppObj.minCgpa > 0;
    if (hasMinPct || hasMinCgpa) {
        const eduList = Array.isArray(sp.education) ? sp.education : [];
        const pctScores = eduList
            .filter((e) => e.scoreType === 'Percentage' && typeof e.percentage === 'number')
            .map((e) => e.percentage);
        const cgpaEntries = eduList.filter((e) => e.scoreType === 'CGPA' && typeof e.cgpa === 'number');
        if (hasMinPct && pctScores.length > 0) {
            const highestPct = Math.max(...pctScores);
            if (highestPct >= oppObj.minAcademicPercentage) {
                matchReasons.push(`Meets employer minimum percentage (${oppObj.minAcademicPercentage}%)`);
            }
            else {
                weightedScore = Math.max(10, weightedScore - 15);
                academicEligibilityNote = `Employer specifies minimum ${oppObj.minAcademicPercentage}% academic score.`;
            }
        }
        else if (hasMinCgpa && cgpaEntries.length > 0) {
            const targetScale = oppObj.minCgpaScale || 10;
            const sameScale = cgpaEntries.filter((e) => (e.cgpaScale || 10) === targetScale);
            if (sameScale.length > 0) {
                const bestCgpa = Math.max(...sameScale.map((e) => e.cgpa));
                if (bestCgpa >= oppObj.minCgpa) {
                    matchReasons.push(`Meets employer minimum CGPA (${oppObj.minCgpa}/${targetScale})`);
                }
                else {
                    weightedScore = Math.max(10, weightedScore - 15);
                    academicEligibilityNote = `Employer specifies minimum ${oppObj.minCgpa}/${targetScale} CGPA.`;
                }
            }
            else {
                academicEligibilityNote = `Employer specifies ${oppObj.minCgpa}/${targetScale} CGPA — verify equivalent criteria when applying.`;
            }
        }
        else {
            academicEligibilityNote =
                'Employer specifies an academic cutoff — add your percentage or CGPA in My Profile to check eligibility.';
        }
    }
    const finalScore = Math.min(100, Math.max(0, weightedScore));
    return {
        ...oppObj,
        isSaved,
        hasApplied,
        matchScore: finalScore,
        matchingSkills,
        missingSkills,
        academicEligibilityNote,
        matchReasons: matchReasons.length > 0
            ? matchReasons
            : ['Explore this verified opportunity and build the required skills via SETU Learn'],
        matchExplanation: matchReasons[0] || 'Explore this opportunity to build matching skills'
    };
};
exports.scoreOpportunityForUser = scoreOpportunityForUser;
const getUserSavedAndAppliedSets = async (user) => {
    const savedSet = new Set((user?.savedOpportunities || []).map((id) => id.toString()));
    const appliedSet = new Set();
    if (user) {
        const apps = await Application_1.Application.find({ seekerId: user._id }).select('opportunityId');
        apps.forEach((a) => appliedSet.add(a.opportunityId.toString()));
    }
    return { savedSet, appliedSet };
};
const getOpportunities = async (req, res) => {
    try {
        const { query, search, location, workMode, opportunityType, isCareerRestart, limit = '50', page = '1' } = req.query;
        const filter = {
            status: 'published',
            moderationStatus: 'clean'
        };
        const qText = String(query || search || '').trim();
        if (qText) {
            const qRegex = new RegExp(qText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$and = [
                ...(filter.$and || []),
                {
                    $or: [
                        { title: qRegex },
                        { organisationName: qRegex },
                        { description: qRegex },
                        { requiredSkills: { $in: [qRegex] } }
                    ]
                }
            ];
        }
        if (location && String(location).trim()) {
            const locRegex = new RegExp(String(location).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$and = [
                ...(filter.$and || []),
                {
                    $or: [{ 'location.city': locRegex }, { 'location.state': locRegex }]
                }
            ];
        }
        if (workMode && workMode !== 'all') {
            filter.workMode = String(workMode);
        }
        if (opportunityType && opportunityType !== 'all') {
            filter.opportunityType = String(opportunityType);
        }
        if (String(isCareerRestart) === 'true') {
            filter.isCareerRestart = true;
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, results, sets] = await Promise.all([
            Opportunity_1.Opportunity.countDocuments(filter),
            Opportunity_1.Opportunity.find(filter)
                .populate('employerId', 'name avatar employerProfile.companyName employerProfile.verificationStatus')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            getUserSavedAndAppliedSets(req.user)
        ]);
        const enrichedResults = results.map((opp) => (0, exports.scoreOpportunityForUser)(opp, req.user, sets.savedSet, sets.appliedSet));
        (0, response_1.sendSuccess)(res, 'Opportunities fetched successfully', {
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            results: enrichedResults
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch opportunities', 500);
    }
};
exports.getOpportunities = getOpportunities;
const getOpportunityById = async (req, res) => {
    try {
        const { id } = req.params;
        const opp = await Opportunity_1.Opportunity.findById(id).populate('employerId', 'name avatar employerProfile.companyName employerProfile.website employerProfile.verificationStatus');
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity listing not found', 404);
            return;
        }
        const sets = await getUserSavedAndAppliedSets(req.user);
        const data = (0, exports.scoreOpportunityForUser)(opp, req.user, sets.savedSet, sets.appliedSet);
        (0, response_1.sendSuccess)(res, 'Opportunity details fetched successfully', data);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to retrieve opportunity', 500);
    }
};
exports.getOpportunityById = getOpportunityById;
const createOpportunity = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parseResult = validators_1.opportunitySchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
            return;
        }
        const payload = parseResult.data;
        const organisationName = payload.organisationName ||
            req.user.employerProfile?.companyName ||
            req.user.name;
        const newOpp = new Opportunity_1.Opportunity({
            ...payload,
            minEducationLevel: req.body?.minEducationLevel || '',
            minAcademicPercentage: typeof req.body?.minAcademicPercentage === 'number'
                ? req.body.minAcademicPercentage
                : null,
            minCgpa: typeof req.body?.minCgpa === 'number' ? req.body.minCgpa : null,
            minCgpaScale: typeof req.body?.minCgpaScale === 'number' ? req.body.minCgpaScale : 10,
            experienceRequired: req.body?.experienceRequired || 'Fresher / Entry-Level Welcome',
            applicationDeadline: req.body?.applicationDeadline || '',
            externalApplyUrl: req.body?.externalApplyUrl || '',
            employerId: req.user._id,
            organisationName,
            status: 'published',
            moderationStatus: 'clean'
        });
        await newOpp.save();
        (0, response_1.sendSuccess)(res, 'Opportunity listing published successfully', newOpp, 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to create opportunity', 500);
    }
};
exports.createOpportunity = createOpportunity;
const updateOpportunity = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const opp = await Opportunity_1.Opportunity.findById(id);
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity not found', 404);
            return;
        }
        const isOwner = opp.employerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            (0, response_1.sendError)(res, 'Access denied. You can only edit opportunities you created.', 403);
            return;
        }
        const parseResult = validators_1.opportunitySchema.partial().safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Invalid fields', 400);
            return;
        }
        Object.assign(opp, parseResult.data);
        await opp.save();
        (0, response_1.sendSuccess)(res, 'Opportunity updated successfully', opp);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update opportunity', 500);
    }
};
exports.updateOpportunity = updateOpportunity;
const deleteOpportunity = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const opp = await Opportunity_1.Opportunity.findById(id);
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity not found', 404);
            return;
        }
        const isOwner = opp.employerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            (0, response_1.sendError)(res, 'Access denied. You cannot delete this opportunity.', 403);
            return;
        }
        await Opportunity_1.Opportunity.findByIdAndDelete(id);
        (0, response_1.sendSuccess)(res, 'Opportunity listing removed successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to delete opportunity', 500);
    }
};
exports.deleteOpportunity = deleteOpportunity;
const getMatchedOpportunities = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const [opportunities, sets] = await Promise.all([
            Opportunity_1.Opportunity.find({
                status: 'published',
                moderationStatus: 'clean'
            }).populate('employerId', 'name avatar employerProfile.companyName'),
            getUserSavedAndAppliedSets(req.user)
        ]);
        const ranked = opportunities
            .map((opp) => (0, exports.scoreOpportunityForUser)(opp, req.user, sets.savedSet, sets.appliedSet))
            .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
        (0, response_1.sendSuccess)(res, 'Matched opportunities retrieved successfully', ranked);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to compute matched opportunities', 500);
    }
};
exports.getMatchedOpportunities = getMatchedOpportunities;
const getSavedOpportunities = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const savedIds = Array.isArray(req.user.savedOpportunities)
            ? req.user.savedOpportunities
            : [];
        if (savedIds.length === 0) {
            (0, response_1.sendSuccess)(res, 'Saved opportunities retrieved', []);
            return;
        }
        const [opps, sets] = await Promise.all([
            Opportunity_1.Opportunity.find({ _id: { $in: savedIds }, status: 'published' }).populate('employerId', 'name avatar employerProfile.companyName'),
            getUserSavedAndAppliedSets(req.user)
        ]);
        const enriched = opps.map((opp) => (0, exports.scoreOpportunityForUser)(opp, req.user, sets.savedSet, sets.appliedSet));
        (0, response_1.sendSuccess)(res, 'Saved opportunities retrieved', enriched);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch saved opportunities', 500);
    }
};
exports.getSavedOpportunities = getSavedOpportunities;
const toggleSaveOpportunity = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const oppId = req.params.id || req.body?.opportunityId;
        if (!oppId) {
            (0, response_1.sendError)(res, 'Opportunity ID is required', 400);
            return;
        }
        const opp = await Opportunity_1.Opportunity.findById(oppId);
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity not found', 404);
            return;
        }
        const existing = Array.isArray(req.user.savedOpportunities)
            ? req.user.savedOpportunities
            : [];
        const idx = existing.findIndex((id) => id.toString() === opp._id.toString());
        let saved = false;
        if (idx >= 0) {
            existing.splice(idx, 1);
            saved = false;
        }
        else {
            existing.push(opp._id);
            saved = true;
        }
        req.user.savedOpportunities = existing;
        await req.user.save();
        (0, response_1.sendSuccess)(res, saved ? 'Opportunity saved to bookmarks' : 'Opportunity removed from bookmarks', {
            opportunityId: opp._id,
            saved,
            savedCount: existing.length
        });
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to toggle saved opportunity', 500);
    }
};
exports.toggleSaveOpportunity = toggleSaveOpportunity;
