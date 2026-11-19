"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePortfolio = exports.updatePortfolio = exports.createPortfolio = exports.getPortfolio = void 0;
const Portfolio_1 = require("../models/Portfolio");
const response_1 = require("../utils/response");
const validators_1 = require("../utils/validators");
const getPortfolio = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const projects = await Portfolio_1.Portfolio.find({ userId: req.user._id }).sort({ createdAt: -1 });
        (0, response_1.sendSuccess)(res, 'Portfolio projects retrieved', projects);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to fetch portfolio', 500);
    }
};
exports.getPortfolio = getPortfolio;
const createPortfolio = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const parseResult = validators_1.portfolioSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
            return;
        }
        const newProject = new Portfolio_1.Portfolio({
            ...parseResult.data,
            userId: req.user._id
        });
        await newProject.save();
        (0, response_1.sendSuccess)(res, 'Portfolio project created successfully', newProject, 201);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to add portfolio project', 500);
    }
};
exports.createPortfolio = createPortfolio;
const updatePortfolio = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const project = await Portfolio_1.Portfolio.findById(id);
        if (!project) {
            (0, response_1.sendError)(res, 'Portfolio project not found', 404);
            return;
        }
        if (project.userId.toString() !== req.user._id.toString()) {
            (0, response_1.sendError)(res, 'Access denied. You can only modify your own portfolio projects.', 403);
            return;
        }
        const parseResult = validators_1.portfolioSchema.partial().safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, parseResult.error.errors[0]?.message || 'Invalid fields', 400);
            return;
        }
        Object.assign(project, parseResult.data);
        await project.save();
        (0, response_1.sendSuccess)(res, 'Portfolio project updated successfully', project);
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to update portfolio project', 500);
    }
};
exports.updatePortfolio = updatePortfolio;
const deletePortfolio = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        const project = await Portfolio_1.Portfolio.findById(id);
        if (!project) {
            (0, response_1.sendError)(res, 'Portfolio project not found', 404);
            return;
        }
        if (project.userId.toString() !== req.user._id.toString()) {
            (0, response_1.sendError)(res, 'Access denied. You can only delete your own portfolio projects.', 403);
            return;
        }
        await Portfolio_1.Portfolio.findByIdAndDelete(id);
        (0, response_1.sendSuccess)(res, 'Portfolio project deleted successfully');
    }
    catch (error) {
        (0, response_1.sendError)(res, error.message || 'Failed to delete portfolio project', 500);
    }
};
exports.deletePortfolio = deletePortfolio;
