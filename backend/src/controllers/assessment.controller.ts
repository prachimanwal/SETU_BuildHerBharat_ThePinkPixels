import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Assessment } from '../models/Assessment';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningResource } from '../models/LearningResource';
import { sendSuccess, sendError } from '../utils/response';

export const getAssessments = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assessments = await Assessment.find().select('-questions.correctAnswerIndex');
    sendSuccess(res, 'Assessments catalog retrieved', assessments);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch assessments', 500);
  }
};

export const getAssessmentById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id).select('-questions.correctAnswerIndex');

    if (!assessment) {
      sendError(res, 'Assessment not found', 404);
      return;
    }

    sendSuccess(res, 'Assessment details retrieved', assessment);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch assessment', 500);
  }
};

export const submitAssessment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const { answers } = req.body; // Map of questionId -> selectedOptionIndex

    if (!answers || typeof answers !== 'object') {
      sendError(res, 'Answers object is required', 400);
      return;
    }

    // Fetch assessment including the hidden correctAnswerIndex
    const assessment = await Assessment.findById(id).select('+questions.correctAnswerIndex');
    if (!assessment) {
      sendError(res, 'Assessment not found', 404);
      return;
    }

    let score = 0;
    const maxScore = assessment.questions.length;
    const strengths: string[] = [];
    const gaps: string[] = [];

    assessment.questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (userAnswer !== undefined && userAnswer === q.correctAnswerIndex) {
        score++;
        strengths.push(q.skillTested);
      } else {
        gaps.push(q.skillTested);
      }
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= assessment.passingScore;

    const result = new AssessmentResult({
      userId: req.user._id,
      assessmentId: assessment._id,
      domain: assessment.domain,
      score,
      maxScore,
      percentage,
      passed,
      strengths: Array.from(new Set(strengths)),
      gaps: Array.from(new Set(gaps)),
      answers
    });

    await result.save();

    // If passed, auto-add domain to seeker's skills if not already present
    if (passed && req.user.seekerProfile) {
      const currentSkills = req.user.seekerProfile.skills || [];
      const domainLabel = assessment.title.replace(' Practical Skill Assessment', '');
      if (!currentSkills.some((s) => s.toLowerCase() === domainLabel.toLowerCase())) {
        req.user.seekerProfile.skills = [...currentSkills, domainLabel];
        await req.user.save();
      }
    }

    // Fetch learning recommendations for identified skill gaps
    const recommendations = await LearningResource.find({
      skillTag: { $in: gaps }
    }).limit(3);

    sendSuccess(res, 'Assessment evaluated successfully on server', {
      resultId: result._id,
      score,
      maxScore,
      percentage,
      passed,
      passingScore: assessment.passingScore,
      strengths: result.strengths,
      gaps: result.gaps,
      recommendations
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit assessment', 500);
  }
};
