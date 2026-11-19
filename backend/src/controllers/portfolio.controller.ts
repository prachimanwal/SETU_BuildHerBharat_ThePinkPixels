import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Portfolio } from '../models/Portfolio';
import { sendSuccess, sendError } from '../utils/response';
import { portfolioSchema } from '../utils/validators';

export const getPortfolio = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const projects = await Portfolio.find({ userId: req.user._id }).sort({ createdAt: -1 });
    sendSuccess(res, 'Portfolio projects retrieved', projects);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch portfolio', 500);
  }
};

export const createPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parseResult = portfolioSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
      return;
    }

    const newProject = new Portfolio({
      ...parseResult.data,
      userId: req.user._id
    });

    await newProject.save();

    sendSuccess(res, 'Portfolio project created successfully', newProject, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to add portfolio project', 500);
  }
};

export const updatePortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const project = await Portfolio.findById(id);

    if (!project) {
      sendError(res, 'Portfolio project not found', 404);
      return;
    }

    if (project.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only modify your own portfolio projects.', 403);
      return;
    }

    const parseResult = portfolioSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Invalid fields', 400);
      return;
    }

    Object.assign(project, parseResult.data);
    await project.save();

    sendSuccess(res, 'Portfolio project updated successfully', project);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update portfolio project', 500);
  }
};

export const deletePortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const project = await Portfolio.findById(id);

    if (!project) {
      sendError(res, 'Portfolio project not found', 404);
      return;
    }

    if (project.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied. You can only delete your own portfolio projects.', 403);
      return;
    }

    await Portfolio.findByIdAndDelete(id);

    sendSuccess(res, 'Portfolio project deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete portfolio project', 500);
  }
};
