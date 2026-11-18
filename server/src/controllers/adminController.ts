import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Opportunity } from '../models/Opportunity';
import { Report } from '../models/Report';
import { SupportTicket } from '../models/SupportTicket';
import { GovernmentScheme } from '../models/GovernmentScheme';

// --- Employer Verification ---

export const getEmployers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { role: 'employer' };
    if (status) {
      filter['employerProfile.verificationStatus'] = status;
    }

    const employers = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    res.json(employers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employers' });
  }
};

export const updateEmployerVerification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminReviewNotes } = req.body;

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      res.status(400).json({ error: 'Invalid verification status' });
      return;
    }

    const employer = await User.findOne({ _id: id, role: 'employer' });
    if (!employer) {
      res.status(404).json({ error: 'Employer not found' });
      return;
    }

    if (!employer.employerProfile) {
      employer.employerProfile = { verificationStatus: status };
    } else {
      employer.employerProfile.verificationStatus = status;
    }

    if (adminReviewNotes !== undefined) {
      employer.employerProfile.adminReviewNotes = adminReviewNotes;
    }

    if (status === 'approved') {
      employer.employerProfile.verifiedAt = new Date();
    }

    // If suspended or rejected, auto-hide all their active listings
    if (status === 'suspended' || status === 'rejected') {
      await Opportunity.updateMany(
        { employerId: employer._id, status: 'published' },
        { status: 'hidden_by_admin' }
      );
    }

    await employer.save();

    res.json({
      message: `Employer verification status updated to ${status}`,
      employer: {
        id: employer._id,
        name: employer.name,
        email: employer.email,
        employerProfile: employer.employerProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update employer verification' });
  }
};

// --- Opportunities Moderation ---

export const getAllOpportunitiesAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const opportunities = await Opportunity.find(filter)
      .populate('employerId', 'name email employerProfile')
      .sort({ createdAt: -1 });

    res.json(opportunities);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch opportunities for admin' });
  }
};

export const toggleOpportunityModeration = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, action } = req.body; // status: 'hidden_by_admin' | 'published'

    const opp = await Opportunity.findById(id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }

    if (status) {
      opp.status = status;
    } else if (action === 'hide') {
      opp.status = 'hidden_by_admin';
    } else if (action === 'unhide') {
      opp.status = 'published';
    }

    await opp.save();
    res.json({ message: `Opportunity status changed to ${opp.status}`, opportunity: opp });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to moderate opportunity' });
  }
};

// --- Reports Moderation ---

export const getReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporterId', 'name email')
      .populate('opportunityId')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
};

export const resolveReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes, actionTaken } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    report.status = status || 'action_taken';
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    if (actionTaken !== undefined) report.actionTaken = actionTaken;
    report.resolvedBy = req.user!._id;
    report.resolvedAt = new Date();

    // If action taken is listing_hidden, hide the listing
    if (actionTaken === 'listing_hidden') {
      await Opportunity.findByIdAndUpdate(report.opportunityId, { status: 'hidden_by_admin' });
    }

    await report.save();
    res.json({ message: 'Report resolved successfully', report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resolve report' });
  }
};

// --- Support & Safety Tickets ---

export const getSupportTickets = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch support tickets' });
  }
};

export const updateSupportTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    if (status) ticket.status = status;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    if (status === 'resolved') ticket.resolvedAt = new Date();

    await ticket.save();
    res.json({ message: 'Support ticket updated', ticket });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update ticket' });
  }
};

// --- Government Schemes Management ---

export const createScheme = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const scheme = new GovernmentScheme(req.body);
    await scheme.save();
    res.status(201).json({ message: 'Government scheme added', scheme });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create scheme' });
  }
};

export const updateScheme = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const scheme = await GovernmentScheme.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scheme) {
      res.status(404).json({ error: 'Scheme not found' });
      return;
    }
    res.json({ message: 'Scheme updated', scheme });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update scheme' });
  }
};

export const deleteScheme = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await GovernmentScheme.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Scheme not found' });
      return;
    }
    res.json({ message: 'Scheme deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete scheme' });
  }
};
