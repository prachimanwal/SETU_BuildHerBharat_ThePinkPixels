import { Request, Response } from 'express';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { sendSuccess, sendError } from '../utils/response';
import { schemeSchema } from '../utils/validators';

export const getSchemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, audience, query } = req.query;
    const filter: any = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (audience && audience !== 'all') {
      filter.targetAudience = new RegExp(audience as string, 'i');
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

    const schemes = await GovernmentScheme.find(filter).sort({ createdAt: 1 });
    sendSuccess(res, 'Government schemes retrieved successfully', schemes);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch government schemes', 500);
  }
};

export const getSchemeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await GovernmentScheme.findById(id);

    if (!scheme) {
      sendError(res, 'Government scheme not found', 404);
      return;
    }

    sendSuccess(res, 'Scheme details retrieved', scheme);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve scheme', 500);
  }
};

export const createScheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = schemeSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
      return;
    }

    const newScheme = new GovernmentScheme(parseResult.data);
    await newScheme.save();

    sendSuccess(res, 'Government scheme created successfully', newScheme, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create government scheme', 500);
  }
};

export const updateScheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await GovernmentScheme.findById(id);

    if (!scheme) {
      sendError(res, 'Government scheme not found', 404);
      return;
    }

    const parseResult = schemeSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
      return;
    }

    Object.assign(scheme, parseResult.data);
    await scheme.save();

    sendSuccess(res, 'Government scheme updated successfully', scheme);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update government scheme', 500);
  }
};

export const deleteScheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const scheme = await GovernmentScheme.findByIdAndDelete(id);

    if (!scheme) {
      sendError(res, 'Government scheme not found', 404);
      return;
    }

    sendSuccess(res, 'Government scheme deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete government scheme', 500);
  }
};
