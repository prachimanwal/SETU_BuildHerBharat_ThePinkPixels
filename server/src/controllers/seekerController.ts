import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Assessment, IAssessment } from '../models/Assessment';
import { AssessmentAttempt } from '../models/AssessmentAttempt';
import { LearningResource } from '../models/LearningResource';
import { UserLearningProgress } from '../models/UserLearningProgress';
import { PortfolioProject } from '../models/PortfolioProject';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { SavedOpportunity } from '../models/SavedOpportunity';
import { Report } from '../models/Report';
import { SupportTicket } from '../models/SupportTicket';

// --- Skill Assessments ---

export const getAssessments = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assessments = await Assessment.find().select('-questions.correctOptionIndex -questions.explanation');
    res.json(assessments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch assessments' });
  }
};

export const getAssessmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findById(req.params.id).select(
      '-questions.correctOptionIndex -questions.explanation'
    );
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    res.json(assessment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch assessment' });
  }
};

export const submitAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { assessmentId, answers } = req.body; // answers: { [questionId: string]: number }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    let score = 0;
    const maxScore = assessment.questions.length;
    const scoredAnswers: any[] = [];
    const strengths: string[] = [];
    const gapsSet = new Set<string>();

    assessment.questions.forEach((q) => {
      const selectedIndex = answers ? answers[q.id] : -1;
      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) {
        score += 1;
        if (!strengths.includes(q.skillTag)) {
          strengths.push(q.skillTag);
        }
      } else {
        gapsSet.add(q.skillTag);
      }

      scoredAnswers.push({
        questionId: q.id,
        selectedOptionIndex: selectedIndex,
        isCorrect,
        skillTag: q.skillTag
      });
    });

    const percentage = Math.round((score / maxScore) * 100);
    const passed = percentage >= assessment.passingScore;

    // Link gaps to relevant learning resources
    const gapSkillTags = Array.from(gapsSet);
    const matchedResources = await LearningResource.find({
      skillTag: { $in: gapSkillTags }
    });

    const gapsWithResources = gapSkillTags.map((tag) => {
      const matched = matchedResources.find((r) => r.skillTag.toLowerCase() === tag.toLowerCase());
      return {
        skillTag: tag,
        linkedResourceId: matched ? matched._id : undefined,
        resourceTitle: matched ? matched.title : `Learn ${tag}`
      };
    });

    const attempt = new AssessmentAttempt({
      userId,
      assessmentId,
      domain: assessment.domain,
      answers: scoredAnswers,
      score,
      maxScore,
      percentage,
      passed,
      strengths,
      gaps: gapsWithResources,
      completedAt: new Date()
    });

    await attempt.save();

    // Auto update seeker's skills profile with proven strengths
    if (strengths.length > 0 && req.user?.seekerProfile) {
      const currentSkills = new Set(req.user.seekerProfile.skills || []);
      strengths.forEach((s) => currentSkills.add(s));
      req.user.seekerProfile.skills = Array.from(currentSkills);
      await req.user.save();
    }

    res.status(201).json({
      message: 'Assessment evaluated successfully',
      attempt: {
        id: attempt._id,
        assessmentTitle: assessment.title,
        domain: attempt.domain,
        score,
        maxScore,
        percentage,
        passed,
        strengths,
        gaps: gapsWithResources,
        completedAt: attempt.completedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit assessment' });
  }
};

export const getMyAssessmentAttempts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const attempts = await AssessmentAttempt.find({ userId: req.user!._id })
      .populate('assessmentId', 'title domain passingScore')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch assessment attempts' });
  }
};

// --- Learning & Practice ---

export const getLearningResources = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { domain, type, skillTag } = req.query;
    const filter: any = {};
    if (domain) filter.domain = domain;
    if (type) filter.type = type;
    if (skillTag) filter.skillTag = skillTag;

    const resources = await LearningResource.find(filter).sort({ durationMinutes: 1 });
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch learning resources' });
  }
};

export const getMyLearningProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const progress = await UserLearningProgress.find({ userId: req.user!._id })
      .populate('resourceId')
      .sort({ updatedAt: -1 });

    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch learning progress' });
  }
};

export const updateLearningProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { resourceId, status, submittedWork, addToPortfolio } = req.body;

    const resource = await LearningResource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Learning resource not found' });
      return;
    }

    let progress = await UserLearningProgress.findOne({ userId, resourceId });
    if (!progress) {
      progress = new UserLearningProgress({
        userId,
        resourceId,
        status: status || 'started'
      });
    } else {
      if (status) progress.status = status;
    }

    if (submittedWork) {
      progress.submittedWork = submittedWork;
    }

    if (status === 'completed' && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    if (addToPortfolio && status === 'completed') {
      progress.addedToPortfolio = true;

      // Automatically add to PortfolioProjects
      const portfolioProject = new PortfolioProject({
        userId,
        title: submittedWork?.title || `${resource.title} - Practice Deliverable`,
        description:
          submittedWork?.notes ||
          `Hands-on practical assignment completed as part of ${resource.title}. Demonstrated competence in ${resource.skillTag}.`,
        skills: [resource.skillTag],
        workSampleUrl: submittedWork?.link || '',
        source: 'practice_assignment',
        associatedResourceId: resource._id,
        featured: false
      });
      await portfolioProject.save();
    }

    await progress.save();

    res.json({
      message: 'Learning progress recorded',
      progress
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update learning progress' });
  }
};

// --- Portfolio Projects ---

export const getMyPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const projects = await PortfolioProject.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch portfolio' });
  }
};

export const createPortfolioProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { title, description, skills, workSampleUrl, featured } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' });
      return;
    }

    const project = new PortfolioProject({
      userId,
      title,
      description,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      workSampleUrl: workSampleUrl || '',
      source: 'self_created',
      featured: !!featured
    });

    await project.save();
    res.status(201).json({ message: 'Portfolio project added', project });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create portfolio project' });
  }
};

export const updatePortfolioProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const project = await PortfolioProject.findOne({
      _id: req.params.id,
      userId: req.user!._id
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { title, description, skills, workSampleUrl, featured } = req.body;
    if (title) project.title = title;
    if (description) project.description = description;
    if (skills) {
      project.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (workSampleUrl !== undefined) project.workSampleUrl = workSampleUrl;
    if (featured !== undefined) project.featured = featured;

    await project.save();
    res.json({ message: 'Project updated', project });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update portfolio project' });
  }
};

export const deletePortfolioProject = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await PortfolioProject.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    });

    if (!result) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ message: 'Portfolio project removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete portfolio project' });
  }
};

// --- Saved Opportunities ---

export const getSavedOpportunities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const saved = await SavedOpportunity.find({ userId: req.user!._id })
      .populate('opportunityId')
      .sort({ createdAt: -1 });

    const opportunities = saved
      .filter((s) => s.opportunityId != null)
      .map((s) => s.opportunityId);

    res.json(opportunities);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch saved opportunities' });
  }
};

export const toggleSaveOpportunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { opportunityId } = req.body;

    const existing = await SavedOpportunity.findOne({ userId, opportunityId });
    if (existing) {
      await SavedOpportunity.deleteOne({ _id: existing._id });
      res.json({ saved: false, message: 'Opportunity removed from bookmarks' });
    } else {
      await SavedOpportunity.create({ userId, opportunityId });
      res.json({ saved: true, message: 'Opportunity bookmarked' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle save opportunity' });
  }
};

// --- Applications ---

export const applyDirect = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const seekerId = req.user!._id;
    const { opportunityId, coverNote } = req.body;

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }

    if (opportunity.isExternal) {
      res.status(400).json({
        error: 'This opportunity requires external application on official portal'
      });
      return;
    }

    if (opportunity.status !== 'published') {
      res.status(400).json({ error: 'This opportunity is not currently accepting applications' });
      return;
    }

    // Check duplicate application
    const existing = await Application.findOne({ opportunityId, seekerId });
    if (existing) {
      res.status(400).json({
        error: 'You have already submitted an application for this opportunity'
      });
      return;
    }

    // Snapshot seeker's current portfolio projects
    const portfolioProjects = await PortfolioProject.find({ userId: seekerId }).limit(5);
    const portfolioSnapshot = portfolioProjects.map((p) => ({
      title: p.title,
      workSampleUrl: p.workSampleUrl,
      skills: p.skills
    }));

    const application = new Application({
      opportunityId,
      seekerId,
      employerId: opportunity.employerId,
      status: 'Applied',
      timeline: [
        {
          status: 'Applied',
          timestamp: new Date(),
          note: 'Application submitted on SETU platform',
          updatedBy: seekerId
        }
      ],
      portfolioProjectsSnapshot: portfolioSnapshot,
      coverNote: coverNote || ''
    });

    await application.save();

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit application' });
  }
};

export const getMyApplications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const applications = await Application.find({ seekerId: req.user!._id })
      .populate('opportunityId')
      .populate('employerId', 'name employerProfile.companyName')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
};

// --- Reporting & Build Her Support ---

export const reportListing = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const reporterId = req.user!._id;
    const { opportunityId, reason, description } = req.body;

    if (!opportunityId || !reason || !description) {
      res.status(400).json({ error: 'Opportunity, reason, and description are required' });
      return;
    }

    const report = new Report({
      reporterId,
      opportunityId,
      reason,
      description,
      status: 'pending'
    });

    await report.save();
    res.status(201).json({
      message: 'Report submitted. Our moderation team will investigate promptly.',
      reportId: report._id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit report' });
  }
};

export const submitSupportTicket = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, contactEmailOrPhone, category, subject, message, isConfidential } = req.body;

    if (!name || !contactEmailOrPhone || !subject || !message) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const ticket = new SupportTicket({
      userId: req.user?._id,
      name,
      contactEmailOrPhone,
      category: category || 'general_support',
      subject,
      message,
      isConfidential: isConfidential !== undefined ? isConfidential : true,
      status: 'open'
    });

    await ticket.save();

    res.status(201).json({
      message:
        'Your message has been securely submitted to the administration team. We prioritize your privacy and will reach out promptly.',
      ticketId: ticket._id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit support ticket' });
  }
};
