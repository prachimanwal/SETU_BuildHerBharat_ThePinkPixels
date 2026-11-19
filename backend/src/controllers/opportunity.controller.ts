import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Opportunity } from '../models/Opportunity';
import { sendSuccess, sendError } from '../utils/response';
import { opportunitySchema } from '../utils/validators';

export const getOpportunities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      query,
      location,
      workMode,
      opportunityType,
      isCareerRestart,
      limit = '50',
      page = '1'
    } = req.query;

    const filter: any = {
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

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, results] = await Promise.all([
      Opportunity.countDocuments(filter),
      Opportunity.find(filter)
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
      const matchingSkills = (opp.requiredSkills || []).filter((s) =>
        userSkills.includes(s.toLowerCase())
      );
      const missingSkills = (opp.requiredSkills || []).filter(
        (s) => !userSkills.includes(s.toLowerCase())
      );

      const matchScore =
        oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;

      return {
        ...oppObj,
        matchScore,
        matchingSkills,
        missingSkills,
        matchExplanation:
          matchingSkills.length > 0
            ? `Matches ${matchingSkills.length} of your skills (${matchingSkills.join(', ')})`
            : 'Explore this opportunity to learn required skills'
      };
    });

    sendSuccess(res, 'Opportunities fetched successfully', {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      results: enrichedResults
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch opportunities', 500);
  }
};

export const getOpportunityById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const opp = await Opportunity.findById(id).populate(
      'employerId',
      'name avatar employerProfile.companyName employerProfile.website'
    );

    if (!opp) {
      sendError(res, 'Opportunity listing not found', 404);
      return;
    }

    const userSkills = (req.user?.seekerProfile?.skills || []).map((s) => s.toLowerCase());
    const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
    const matchingSkills = (opp.requiredSkills || []).filter((s) =>
      userSkills.includes(s.toLowerCase())
    );
    const missingSkills = (opp.requiredSkills || []).filter(
      (s) => !userSkills.includes(s.toLowerCase())
    );
    const matchScore =
      oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;

    const data = {
      ...opp.toObject(),
      matchScore,
      matchingSkills,
      missingSkills
    };

    sendSuccess(res, 'Opportunity details fetched successfully', data);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve opportunity', 500);
  }
};

export const createOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parseResult = opportunitySchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Validation error', 400);
      return;
    }

    const payload = parseResult.data;
    const organisationName =
      payload.organisationName ||
      req.user.employerProfile?.companyName ||
      req.user.name;

    const newOpp = new Opportunity({
      ...payload,
      employerId: req.user._id,
      organisationName,
      status: 'published',
      moderationStatus: 'clean'
    });

    await newOpp.save();

    sendSuccess(res, 'Opportunity listing published successfully', newOpp, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create opportunity', 500);
  }
};

export const updateOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const opp = await Opportunity.findById(id);

    if (!opp) {
      sendError(res, 'Opportunity not found', 404);
      return;
    }

    // Ownership check: Only owner employer or admin can update
    const isOwner = opp.employerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      sendError(res, 'Access denied. You can only edit opportunities you created.', 403);
      return;
    }

    const parseResult = opportunitySchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, parseResult.error.errors[0]?.message || 'Invalid fields', 400);
      return;
    }

    Object.assign(opp, parseResult.data);
    await opp.save();

    sendSuccess(res, 'Opportunity updated successfully', opp);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update opportunity', 500);
  }
};

export const deleteOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const opp = await Opportunity.findById(id);

    if (!opp) {
      sendError(res, 'Opportunity not found', 404);
      return;
    }

    const isOwner = opp.employerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      sendError(res, 'Access denied. You cannot delete this opportunity.', 403);
      return;
    }

    await Opportunity.findByIdAndDelete(id);

    sendSuccess(res, 'Opportunity listing removed successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete opportunity', 500);
  }
};

export const getMatchedOpportunities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const userSkills = (req.user.seekerProfile?.skills || []).map((s) => s.toLowerCase());

    const opportunities = await Opportunity.find({
      status: 'published',
      moderationStatus: 'clean'
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const scored = opportunities
      .map((opp) => {
        const oppSkills = (opp.requiredSkills || []).map((s) => s.toLowerCase());
        const matchingSkills = opp.requiredSkills.filter((s) =>
          userSkills.includes(s.toLowerCase())
        );
        const matchScore =
          oppSkills.length > 0 ? Math.round((matchingSkills.length / oppSkills.length) * 100) : 50;

        return {
          ...opp.toObject(),
          matchScore,
          matchingSkills
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    sendSuccess(res, 'Matched opportunities retrieved', scored);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to calculate matched opportunities', 500);
  }
};
