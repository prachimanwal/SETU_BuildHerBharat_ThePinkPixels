"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScheme = exports.updateScheme = exports.createScheme = exports.getSchemeById = exports.getSchemes = void 0;
const GovernmentScheme_1 = require("../models/GovernmentScheme");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const getSchemes = async (req, res) => {
    try {
        const { category, audience, query } = req.query;
        const filter = {};
        if (category && category !== 'all') {
            filter.category = category;
        }
        if (audience && audience !== 'all') {
            filter.targetAudience = new RegExp(audience, 'i');
        }
        if (query && typeof query === 'string') {
            const qRegex = new RegExp(query.trim(), 'i');
            filter.$or = [
                { title: qRegex },
                { ministry: qRegex },
                { benefitsSummary: qRegex },
                { eligibilitySummary: qRegex }
            ];
        }
        const schemes = await GovernmentScheme_1.GovernmentScheme.find(filter).sort({ createdAt: 1 });
        (0, response_1.sendSuccess)(res, 'Government schemes retrieved successfully', schemes);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch government schemes', 500);
    }
};
exports.getSchemes = getSchemes;
const getSchemeById = async (req, res) => {
    try {
        const { id } = req.params;
        const scheme = await GovernmentScheme_1.GovernmentScheme.findById(id);
        if (!scheme) {
            (0, response_1.sendError)(res, 'Government scheme not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, 'Scheme details retrieved', scheme);
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
