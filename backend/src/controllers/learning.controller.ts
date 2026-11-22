import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { LearningResource } from '../models/LearningResource';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { AssessmentResult } from '../models/AssessmentResult';
import { sendSuccess, sendError } from '../utils/response';

export const getLearningResources = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { type, skillTag } = req.query;
    const filter: any = {};

    if (type && type !== 'all') filter.type = type;
    if (skillTag && skillTag !== 'all') filter.skillTag = skillTag;

    const resources = await LearningResource.find(filter).sort({ createdAt: 1 });

    let userProgressMap: Record<string, string> = {};
    if (req.user) {
      const progressDocs = await LearningProgress.find({ userId: req.user._id });
      progressDocs.forEach((p) => {
        userProgressMap[p.resourceId.toString()] = p.status;
      });
    }

    const enriched = resources.map((r) => ({
      ...r.toObject(),
      progressStatus: userProgressMap[r._id.toString()] || 'not_started'
    }));

    sendSuccess(res, 'Learning resources retrieved', enriched);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch learning resources', 500);
  }
};

export const getRecommendedLearning = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    let skillGaps: string[] = [];

    if (req.user) {
      const recentAttempts = await AssessmentResult.find({ userId: req.user._id })
        .sort({ completedAt: -1 })
        .limit(3);

      recentAttempts.forEach((att) => {
        skillGaps.push(...att.gaps);
      });
    }

    let recommendations;
    if (skillGaps.length > 0) {
      recommendations = await LearningResource.find({
        skillTag: { $in: skillGaps }
      }).limit(4);
    }

    if (!recommendations || recommendations.length === 0) {
      recommendations = await LearningResource.find().limit(4);
    }

    sendSuccess(res, 'Recommended learning activities retrieved', recommendations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch recommendations', 500);
  }
};

export const completeLearning = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const { submissionUrl, notes } = req.body;

    const resource = await LearningResource.findById(id);
    if (!resource) {
      sendError(res, 'Learning resource not found', 404);
      return;
    }

    let progress = await LearningProgress.findOne({
      userId: req.user._id,
      resourceId: resource._id
    });

    if (!progress) {
      progress = new LearningProgress({
        userId: req.user._id,
        resourceId: resource._id,
        status: 'completed',
        submissionDetails: submissionUrl || notes || 'Completed on platform'
      });
    } else {
      progress.status = 'completed';
      if (submissionUrl || notes) {
        progress.submissionDetails = submissionUrl || notes;
      }
    }

    await progress.save();

    let createdPortfolioProject = null;

    // If practical assignment, auto-create a portfolio deliverable
    if (resource.type === 'practical_assignment') {
      const existingProject = await Portfolio.findOne({
        userId: req.user._id,
        title: resource.title
      });

      if (!existingProject) {
        createdPortfolioProject = new Portfolio({
          userId: req.user._id,
          title: resource.title,
          description: `Practical work deliverable completed via SETU learning path: ${resource.description}`,
          skills: [resource.skillTag],
          workSampleUrl: submissionUrl || resource.contentUrl || 'https://oursetu.netlify.app/portfolio',
          category: 'Practical Assignment Deliverable',
          source: 'practice_assignment',
          featured: true
        });

        await createdPortfolioProject.save();
      }
    }

    sendSuccess(res, 'Learning activity marked as completed', {
      progress,
      portfolioProject: createdPortfolioProject
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to complete learning activity', 500);
  }
};
