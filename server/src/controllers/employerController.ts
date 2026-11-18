import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Opportunity } from '../models/Opportunity';
import { Application, ApplicationStatus } from '../models/Application';
import { User } from '../models/User';

// --- Opportunities Management ---

export const getMyOpportunities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const opportunities = await Opportunity.find({ employerId: req.user!._id }).sort({
      createdAt: -1
    });

    // Attach applicant counts for each opportunity
    const oppIds = opportunities.map((o) => o._id);
    const appCounts = await Application.aggregate([
      { $match: { opportunityId: { $in: oppIds } } },
      { $group: { _id: '$opportunityId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(appCounts.map((c) => [c._id.toString(), c.count]));

    const result = opportunities.map((opp) => ({
      ...opp.toObject(),
      applicantCount: countMap.get(opp._id.toString()) || 0
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employer opportunities' });
  }
};

export const createOpportunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employer = req.user!;
    const isApproved = employer.employerProfile?.verificationStatus === 'approved';

    const {
      title,
      opportunityType,
      workMode,
      location,
      salaryOrStipend,
      requiredSkills,
      experienceRequired,
      educationRequired,
      isCareerRestart,
      description,
      status,
      isExternal,
      externalApplyUrl
    } = req.body;

    if (!title || !description || !location) {
      res.status(400).json({ error: 'Title, description, and location are required' });
      return;
    }

    // Unverified/Pending employers can ONLY save drafts
    let finalStatus = status || 'draft';
    if (!isApproved && finalStatus === 'published') {
      res.status(403).json({
        error:
          'Your organisation verification is still pending. Only approved employers can publish opportunities. You may save this as a draft.',
        allowedStatus: 'draft'
      });
      return;
    }

    const opportunity = new Opportunity({
      employerId: employer._id,
      title,
      organisationName: employer.employerProfile?.companyName || employer.name,
      opportunityType: opportunityType || 'job',
      workMode: workMode || 'remote',
      location,
      salaryOrStipend: salaryOrStipend || 'Competitive',
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : (requiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      experienceRequired: experienceRequired || 'Fresher friendly',
      educationRequired: educationRequired || 'No formal requirement',
      isCareerRestart: !!isCareerRestart,
      description,
      status: finalStatus,
      isExternal: !!isExternal,
      externalApplyUrl: externalApplyUrl || '',
      isDemoData: false
    });

    await opportunity.save();
    res.status(201).json({ message: 'Opportunity created successfully', opportunity });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create opportunity' });
  }
};

export const updateOpportunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employer = req.user!;
    const isApproved = employer.employerProfile?.verificationStatus === 'approved';

    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      employerId: employer._id
    });

    if (!opportunity) {
      res.status(404).json({ error: 'Opportunity not found or access denied' });
      return;
    }

    const {
      title,
      opportunityType,
      workMode,
      location,
      salaryOrStipend,
      requiredSkills,
      experienceRequired,
      educationRequired,
      isCareerRestart,
      description,
      status,
      isExternal,
      externalApplyUrl
    } = req.body;

    if (status === 'published' && !isApproved) {
      res.status(403).json({
        error: 'Cannot publish opportunity until your organisation verification is approved by administrator.'
      });
      return;
    }

    if (title) opportunity.title = title;
    if (opportunityType) opportunity.opportunityType = opportunityType;
    if (workMode) opportunity.workMode = workMode;
    if (location) opportunity.location = location;
    if (salaryOrStipend !== undefined) opportunity.salaryOrStipend = salaryOrStipend;
    if (requiredSkills !== undefined) {
      opportunity.requiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (experienceRequired !== undefined) opportunity.experienceRequired = experienceRequired;
    if (educationRequired !== undefined) opportunity.educationRequired = educationRequired;
    if (isCareerRestart !== undefined) opportunity.isCareerRestart = isCareerRestart;
    if (description) opportunity.description = description;
    if (status) opportunity.status = status;
    if (isExternal !== undefined) opportunity.isExternal = isExternal;
    if (externalApplyUrl !== undefined) opportunity.externalApplyUrl = externalApplyUrl;

    await opportunity.save();
    res.json({ message: 'Opportunity updated successfully', opportunity });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update opportunity' });
  }
};

export const deleteOpportunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await Opportunity.findOneAndDelete({
      _id: req.params.id,
      employerId: req.user!._id
    });

    if (!result) {
      res.status(404).json({ error: 'Opportunity not found or access denied' });
      return;
    }

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete opportunity' });
  }
};

// --- Applicants Management ---

export const getApplicants = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employerId = req.user!._id;
    const { opportunityId, status } = req.query;

    const filter: any = { employerId };
    if (opportunityId) filter.opportunityId = opportunityId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('opportunityId', 'title opportunityType workMode location')
      .populate('seekerId', 'name email seekerProfile')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch applicants' });
  }
};

export const updateApplicantStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employerId = req.user!._id;
    const { id } = req.params;
    const { status, note, interviewDetails } = req.body;

    const validStatuses: ApplicationStatus[] = [
      'Applied',
      'Under Review',
      'Shortlisted',
      'Interview Scheduled',
      'Selected',
      'Rejected'
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const application = await Application.findOne({ _id: id, employerId });
    if (!application) {
      res.status(404).json({ error: 'Application not found or you are not authorized to manage it' });
      return;
    }

    application.status = status;
    application.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: employerId
    });

    if (status === 'Interview Scheduled' && interviewDetails) {
      application.interviewDetails = {
        date: interviewDetails.date || '',
        time: interviewDetails.time || '',
        instructions: interviewDetails.instructions || '',
        meetLinkOrLocation: interviewDetails.meetLinkOrLocation || ''
      };
    }

    await application.save();

    res.json({
      message: `Applicant status updated to ${status}`,
      application
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update applicant status' });
  }
};

// --- Submit Verification Documents ---

export const submitVerificationDocs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employer = req.user!;
    const { docType, docNumber, notes, companyName, industry, website, companySize, description } =
      req.body;

    if (!docNumber) {
      res.status(400).json({ error: 'Document identification number (GSTIN, PAN, Udyam, etc.) is required' });
      return;
    }

    if (!employer.employerProfile) {
      employer.employerProfile = {
        verificationStatus: 'pending'
      };
    }

    if (companyName) employer.employerProfile.companyName = companyName;
    if (industry) employer.employerProfile.industry = industry;
    if (website) employer.employerProfile.website = website;
    if (companySize) employer.employerProfile.companySize = companySize;
    if (description) employer.employerProfile.description = description;

    employer.employerProfile.verificationDocs = {
      docType: docType || 'GSTIN / Registration',
      docNumber,
      notes: notes || '',
      submittedAt: new Date()
    };
    employer.employerProfile.verificationStatus = 'pending';

    await employer.save();

    res.json({
      message: 'Verification details submitted for administrator review',
      employerProfile: employer.employerProfile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit verification' });
  }
};
