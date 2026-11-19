"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchedOpportunities = exports.deleteOpportunity = exports.updateOpportunity = exports.createOpportunity = exports.getOpportunityById = exports.getOpportunities = void 0;
const Opportunity_1 = require("../models/Opportunity");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const getOpportunities = async (req, res) => {
    try {
        const { query, location, workMode, opportunityType, isCareerRestart, limit = '50', page = '1' } = req.query;
        const filter = {
            status: 'published',
            moderationStatus: 'clean'
        };
        if (query && typeof query === 'string') {
            const qRegex = new RegExp(query.trim(), 'i');
            filter.$or = [
                { title: qRegex },
                { organisationName: qRegex },
                { description: qRegex },
                { requiredSkills: { $in: [qRegex] } }
            ];
        }
        if (location && typeof location === 'string') {
            const locRegex = new RegExp(location.trim(), 'i');
            filter.$or = filter.$or || [];
            filter.$or.push({ 'location.city': locRegex }, { 'location.state': locRegex });
        }
        if (workMode && workMode !== 'all') {
            filter.workMode = workMode;
        }
        if (opportunityType && opportunityType !== 'all') {
            filter.opportunityType = opportunityType;
        }
        if (String(isCareerRestart) === 'true') {
            filter.isCareerRestart = true;
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [total, results] = await Promise.all([
            Opportunity_1.Opportunity.countDocuments(filter),
            Opportunity_1.Opportunity.find(filter)
                .populate('employerId', 'name avatar employerProfile.companyName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
        ]);
        // Transparent skill matching for seekers
        const userSkills = (req.user?.seekerProfile?.skills || []).map((s) => s.toLowerCase());
        const enrichedResults = results.map((opp) => {
            const oppObj = opp.toObject();
            const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
            const matchingSkills = (opp.requiredSkills || []).filter((s) => userSkills.includes(s.toLowerCase()));
            const missingSkills = (opp.requiredSkills || []).filter((s) => !userSkills.includes(s.toLowerCase()));
            const matchScore = oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;
            return {
                ...oppObj,
                matchScore,
                matchingSkills,
                missingSkills,
                matchExplanation: matchingSkills.length > 0
                    ? `Matches ${matchingSkills.length} of your skills (${matchingSkills.join(', ')})`
                    : 'Explore this opportunity to learn required skills'
            };
        });
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
        const opp = await Opportunity_1.Opportunity.findById(id).populate('employerId', 'name avatar employerProfile.companyName employerProfile.website');
        if (!opp) {
            (0, response_1.sendError)(res, 'Opportunity listing not found', 404);
            return;
        }
        const userSkills = (req.user?.seekerProfile?.skills || []).map((s) => s.toLowerCase());
        const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
        const matchingSkills = (opp.requiredSkills || []).filter((s) => userSkills.includes(s.toLowerCase()));
        const missingSkills = (opp.requiredSkills || []).filter((s) => !userSkills.includes(s.toLowerCase()));
        const matchScore = oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;
        const data = {
            ...opp.toObject(),
            matchScore,
            matchingSkills,
            missingSkills
        };
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
        // Ownership check: Only owner employer or admin can update
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
        const userSkills = (req.user.seekerProfile?.skills || []).map((s) => s.toLowerCase());
        const opportunities = await Opportunity_1.Opportunity.find({
            status: 'published',
            moderationStatus: 'clean'
        })
            .sort({ createdAt: -1 })
            .limit(30);
        const scored = opportunities
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
            .slice(0, 10);
        (0, response_1.sendSuccess)(res, 'Matched opportunities retrieved', scored);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to calculate matched opportunities', 500);
    }
};
exports.getMatchedOpportunities = getMatchedOpportunities;
