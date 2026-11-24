import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ENV } from '../config/env';
import { CaneConversation, CaneLanguage, CaneMode } from '../models/CaneConversation';
import { CaneMessage } from '../models/CaneMessage';
import { CaneRoadmap } from '../models/CaneRoadmap';
import { Opportunity } from '../models/Opportunity';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { Assessment } from '../models/Assessment';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningResource } from '../models/LearningResource';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { Application } from '../models/Application';
import { generateCaneCompletion, getActiveAIProvider } from '../services/caneAI.service';
import { sendSuccess, sendError } from '../utils/response';

// Per-user sliding-window rate limiter (25 messages per 10 minutes)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 25;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const prev = (rateBuckets.get(userId) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX_REQUESTS) {
    const oldest = prev[0];
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000))
    };
  }
  prev.push(now);
  rateBuckets.set(userId, prev);
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Builds a compact, privacy-respecting SETU career context snapshot for CANE.
 * Never includes phone numbers, raw resumes, passwords, or sensitive PII.
 */
async function buildGroundedSetuContext(
  user: any,
  userMessage: string,
  useProfileContext: boolean
): Promise<{
  contextText: string;
  suggestedLinks: Array<{ label: string; route: string; type: string }>;
}> {
  const sections: string[] = [];
  const suggestedLinks: Array<{ label: string; route: string; type: string }> = [];
  const lowerMsg = userMessage.toLowerCase();

  // 1. User's consented profile & real activity (compact summary only)
  if (useProfileContext && user) {
    const sp = user.seekerProfile || {};
    const [attempts, learningDocs, portfolioDocs, appDocs] = await Promise.all([
      AssessmentResult.find({ userId: user._id })
        .sort({ completedAt: -1 })
        .limit(6)
        .select('domain percentage passed strengths gaps'),
      LearningProgress.find({ userId: user._id })
        .populate('resourceId', 'title skillTag type')
        .limit(8),
      Portfolio.find({ userId: user._id }).limit(5).select('title skills'),
      Application.find({ seekerId: user._id })
        .populate('opportunityId', 'title organisationName')
        .limit(5)
        .select('status opportunityId')
    ]);

    const eduSummary = (sp.education || [])
      .slice(0, 3)
      .map((e: any) =>
        [e.level, e.degree, e.specialization, e.status].filter(Boolean).join(' ')
      )
      .join('; ');

    const verifiedSkills = (sp.detailedSkills || [])
      .filter((s: any) => s.verified || s.source === 'assessment_verified')
      .map((s: any) => s.name);
    const selfSkills = (sp.detailedSkills || [])
      .filter((s: any) => !s.verified && s.source !== 'assessment_verified')
      .map((s: any) => s.name);

    const profileBlock = [
      `User Name: ${user.name || 'Learner'}`,
      `Location: ${[sp.location?.city, sp.location?.state].filter(Boolean).join(', ') || 'Not specified'}`,
      `Education: ${eduSummary || sp.educationLevel || 'Not specified'}`,
      `Assessment-Verified Skills: ${verifiedSkills.join(', ') || 'None yet'}`,
      `Self-Reported Skills: ${(selfSkills.length ? selfSkills : sp.skills || []).join(', ') || 'None yet'}`,
      `Career Interests: ${(sp.interests || []).join(', ') || 'Not specified'}`,
      `Career Goals: ${(sp.careerGoalsList || []).join(', ') || sp.careerGoals || 'Not specified'}`,
      `Preferred Job Types/Modes: ${(sp.employmentPreferences?.jobTypes || []).join(', ') || 'Any'} / ${(sp.employmentPreferences?.workModes || []).join(', ') || 'Flexible'}`,
      `Recent Assessments: ${
        attempts.length > 0
          ? attempts
              .map((a) => `${a.domain}: ${a.percentage}% (${a.passed ? 'Passed' : 'Practice'})`)
              .join('; ')
          : 'None taken yet'
      }`,
      `Completed Learning Modules: ${learningDocs.filter((l) => l.status === 'completed').length}`,
      `Portfolio Projects: ${portfolioDocs.map((p) => p.title).join('; ') || 'None yet'}`,
      `Active Applications: ${
        appDocs.length > 0
          ? appDocs
              .map((a: any) => `${a.opportunityId?.title || 'Role'} (${a.status})`)
              .join('; ')
          : 'None yet'
      }`
    ].join('\n');

    sections.push(`USER SETU CAREER PROFILE (CONSENTED):\n${profileBlock}`);
  } else {
    sections.push('USER SETU CAREER PROFILE: User chose to chat without sharing profile context.');
  }

  // 2. Ground Opportunities when asking about jobs/internships/roles
  if (/job|intern|opportunit|vacanc|hiring|work|freelanc|apprentice|role|salary/i.test(lowerMsg)) {
    const oppFilter: any = { status: 'published', moderationStatus: 'clean' };
    if (ENV.NODE_ENV === 'production') {
      oppFilter.isSampleExample = { $ne: true };
    }
    const opps = await Opportunity.find(oppFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title organisationName location workMode opportunityType requiredSkills stipendOrSalary isSampleExample');

    if (opps.length > 0) {
      sections.push(
        `LIVE SETU OPPORTUNITIES IN DATABASE (NEVER invent any outside this list):\n${opps
          .map(
            (o) =>
              `- ${o.title} at ${o.organisationName} (${o.location?.city}, ${o.location?.state} | ${o.workMode} | ${o.opportunityType} | Skills: ${(o.requiredSkills || []).join(', ')})`
          )
          .join('\n')}`
      );
    } else {
      sections.push(
        'LIVE SETU OPPORTUNITIES IN DATABASE: 0 live employer listings currently posted. Tell the user honestly that no live SETU employer vacancies match right now and point them to official Indian portals (NCS ncs.gov.in, NATS, Apprenticeship India, PM Internship) on /opportunities.'
      );
    }
    suggestedLinks.push({ label: 'Explore SETU Opportunities', route: '/opportunities', type: 'internal' });
  }

  // 3. Ground Government Schemes when asking about schemes/loans/subsidies/govt
  if (/scheme|govt|government|pmkvy|naps|nats|mudra|vishwakarma|startup india|stand-?up|loan|stipend|scholarship|yojana/i.test(lowerMsg)) {
    const schemes = await GovernmentScheme.find()
      .limit(15)
      .select('title ministry category benefitsSummary eligibilitySummary officialUrl verificationStatus');

    if (schemes.length > 0) {
      sections.push(
        `SETU GOVERNMENT SCHEMES DATABASE (never guarantee eligibility; include official portal URL):\n${schemes
          .map(
            (s) =>
              `- ${s.title} (${s.ministry}) [${s.verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}]: ${s.benefitsSummary} | Official: ${s.officialUrl}`
          )
          .join('\n')}`
      );
    }
    suggestedLinks.push({ label: 'Browse Government Schemes', route: '/schemes', type: 'internal' });
  }

  // 4. Ground Assessments & Learning Catalog when asking about skills, roadmaps, courses, gaps
  if (/skill|learn|course|tutorial|roadmap|assess|test|gap|practice|certif|prepare|study|project/i.test(lowerMsg)) {
    const [assessments, resources] = await Promise.all([
      Assessment.find().limit(20).select('title category domain difficulty'),
      LearningResource.find().limit(25).select('title type category skillTag difficulty duration')
    ]);

    if (assessments.length > 0) {
      sections.push(
        `AVAILABLE SETU ASSESSMENTS:\n${assessments
          .map((a) => `- ${a.title} (${a.category}, ${a.difficulty})`)
          .join('\n')}`
      );
      suggestedLinks.push({ label: 'Take Skill Assessments', route: '/assess', type: 'internal' });
    }
    if (resources.length > 0) {
      sections.push(
        `AVAILABLE SETU LEARNING RESOURCES:\n${resources
          .map((r) => `- ${r.title} [${r.type}, ${r.category}, ${r.duration}]`)
          .join('\n')}`
      );
      suggestedLinks.push({ label: 'Open Learn & Practice', route: '/learn', type: 'internal' });
    }
  }

  if (/resume|cv|portfolio|cover letter/i.test(lowerMsg)) {
    suggestedLinks.push({ label: 'Open Portfolio & Resume Builder', route: '/portfolio', type: 'internal' });
  }
  if (/progress|analytics|chart|journey/i.test(lowerMsg)) {
    suggestedLinks.push({ label: 'View My Progress Analytics', route: '/progress', type: 'internal' });
  }

  return {
    contextText: sections.join('\n\n'),
    suggestedLinks: suggestedLinks.slice(0, 3)
  };
}

function buildCaneSystemPrompt(
  language: CaneLanguage,
  mode: CaneMode,
  groundedContext: string
): string {
  const languageDirective =
    language === 'Hindi'
      ? 'Respond naturally in warm, clear Hindi (Devanagari script), keeping technical terms understandable.'
      : language === 'Hinglish'
      ? 'Respond in friendly, natural Hinglish (conversational Hindi + English in Latin script) that feels approachable to Indian users.'
      : 'Respond in clear, encouraging, practical English.';

  const modeDirective: Record<string, string> = {
    general: 'Provide warm, practical, actionable career guidance and ask 1 helpful follow-up question when useful.',
    career_discovery:
      'Help the user explore diverse, realistic career paths suited to their interests, education, and strengths. Never assume every engineering student wants coding; explore non-coding, business, creative, operations, and vocational options equally.',
    job_search:
      'Only cite opportunities present in the LIVE SETU OPPORTUNITIES list. Never invent job openings or companies. Explain clearly if none match right now.',
    skill_gap:
      'Compare the user’s real skills against their target role, clearly separate verified vs self-reported skills, highlight concrete skill gaps, and recommend actual SETU assessments and learning resources.',
    roadmap:
      'Build a realistic, week-by-week or month-by-month learning roadmap with skills, SETU courses/assignments, portfolio project ideas, and concrete milestones.',
    resume:
      'Help craft truthful, ATS-friendly summaries, project bullets, and cover letters using ONLY real user-provided details. Never fabricate experience, degrees, or metrics.',
    interview:
      'Act as a supportive mock interviewer. Ask ONE focused interview question at a time, wait for the user’s reply, evaluate their answer with constructive feedback + improved example, then ask the next follow-up question.',
    schemes:
      'Explain relevant Indian government schemes from SETU’s catalog with official portal links, highlight any missing profile info needed for eligibility, and NEVER guarantee eligibility or loan approval.'
  };

  return [
    'You are CANE (Career Assistance & Navigation Engine), the personal AI career companion inside SETU (Bridging Skills, Opportunities & Employment for Bharat).',
    'PERSONALITY: Friendly, encouraging, practical, respectful, inclusive, and honest. Never judge users by degree, marks, career gap, gender, or background.',
    'STRICT INTEGRITY RULES:',
    '1. Never invent job vacancies, fake employers, fake salaries, or guaranteed hiring/admission/scheme outcomes.',
    '2. Never fabricate education, experience, or accomplishments for resumes.',
    '3. Acknowledge uncertainty honestly and encourage verifying official scheme details on .gov.in portals.',
    '4. Never claim you automatically applied to jobs or edited the user’s profile—tell the user which SETU page to open.',
    `LANGUAGE: ${languageDirective}`,
    `ACTIVE FOCUS MODE (${mode}): ${modeDirective[mode] || modeDirective.general}`,
    groundedContext ? `\n--- GROUNDED SETU DATA ---\n${groundedContext}` : ''
  ].join('\n');
}

export const getCaneStatus = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const active = getActiveAIProvider();
  sendSuccess(res, 'CANE AI status retrieved', {
    configured: active.configured,
    provider: active.provider,
    model: active.model,
    fallbackModel: active.fallbackModel || null,
    supportedLanguages: ['English', 'Hindi', 'Hinglish'],
    configurationHint: active.configured
      ? 'Live conversational AI model active.'
      : 'Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env (and Render Environment Variables) to activate live CANE AI conversations.'
  });
};

export const listConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const conversations = await CaneConversation.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(30);
    sendSuccess(res, 'CANE conversations retrieved', conversations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch conversations', 500);
  }
};

export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const language: CaneLanguage = ['English', 'Hindi', 'Hinglish'].includes(req.body?.language)
      ? req.body.language
      : 'English';
    const mode: CaneMode = req.body?.mode || 'general';
    const useProfileContext = req.body?.useProfileContext !== false;
    const title = String(req.body?.title || 'New Career Chat').trim().slice(0, 80);

    const conv = await CaneConversation.create({
      userId: req.user._id,
      title,
      language,
      mode,
      useProfileContext,
      lastMessageAt: new Date()
    });

    sendSuccess(res, 'Conversation created', conv, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create conversation', 500);
  }
};

export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const conv = await CaneConversation.findById(req.params.id);
    if (!conv) {
      sendError(res, 'Conversation not found', 404);
      return;
    }
    if (conv.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const messages = await CaneMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .limit(100);

    sendSuccess(res, 'Conversation messages retrieved', {
      conversation: conv,
      messages
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to load messages', 500);
  }
};

export const sendCaneMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const rl = checkRateLimit(req.user._id.toString());
    if (!rl.allowed) {
      sendError(
        res,
        `Rate limit reached. Please wait ${rl.retryAfterSec} seconds before sending another message to CANE.`,
        429
      );
      return;
    }

    const conv = await CaneConversation.findById(req.params.id);
    if (!conv) {
      sendError(res, 'Conversation not found', 404);
      return;
    }
    if (conv.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Access denied.', 403);
      return;
    }

    const content = String(req.body?.content || '').trim();
    if (!content) {
      sendError(res, 'Message content is required', 400);
      return;
    }

    // Allow switching language, mode, or profile context mid-conversation
    if (['English', 'Hindi', 'Hinglish'].includes(req.body?.language)) {
      conv.language = req.body.language;
    }
    if (req.body?.mode) {
      conv.mode = req.body.mode;
    }
    if (typeof req.body?.useProfileContext === 'boolean') {
      conv.useProfileContext = req.body.useProfileContext;
    }

    // Persist user message
    const userMsg = await CaneMessage.create({
      conversationId: conv._id,
      userId: req.user._id,
      role: 'user',
      content
    });

    // Update conversation title from first user message
    if (conv.title === 'New Career Chat') {
      conv.title = content.slice(0, 56) + (content.length > 56 ? '…' : '');
    }

    // Fetch recent turn history for multi-turn context
    const recentHistory = await CaneMessage.find({ conversationId: conv._id })
      .sort({ createdAt: -1 })
      .limit(12);
    const orderedHistory = recentHistory.reverse().map((m) => ({
      role: m.role,
      content: m.content
    }));

    const { contextText, suggestedLinks } = await buildGroundedSetuContext(
      req.user,
      content,
      conv.useProfileContext
    );

    const systemPrompt = buildCaneSystemPrompt(conv.language, conv.mode, contextText);
    const completion = await generateCaneCompletion(systemPrompt, orderedHistory);

    if (!completion.configured) {
      conv.lastMessageAt = new Date();
      await conv.save();
      sendError(
        res,
        completion.error ||
          'CANE live AI provider is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY in backend environment variables.',
        503,
        {
          aiNotConfigured: true,
          userMessage: userMsg,
          suggestedLinks
        }
      );
      return;
    }

    if (completion.error || !completion.content) {
      conv.lastMessageAt = new Date();
      await conv.save();
      if (completion.retryAfterSeconds) {
        res.setHeader('Retry-After', String(completion.retryAfterSeconds));
      }
      sendError(
        res,
        completion.error || 'CANE could not generate a response right now. Please try again.',
        completion.statusCode || 502
      );
      return;
    }

    const assistantMsg = await CaneMessage.create({
      conversationId: conv._id,
      userId: req.user._id,
      role: 'assistant',
      content: completion.content,
      provider: `${completion.provider}:${completion.model}`,
      links: suggestedLinks
    });

    conv.lastMessageAt = new Date();
    await conv.save();

    sendSuccess(res, 'CANE response generated', {
      conversation: conv,
      userMessage: userMsg,
      assistantMessage: assistantMsg
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to process CANE message', 500);
  }
};

export const regenerateLastResponse = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const conv = await CaneConversation.findById(req.params.id);
    if (!conv || conv.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    const messages = await CaneMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 });
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      sendError(res, 'No user message to regenerate from.', 400);
      return;
    }

    // Remove the trailing assistant message if present
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      await CaneMessage.findByIdAndDelete(lastMsg._id);
      messages.pop();
    }

    const { contextText, suggestedLinks } = await buildGroundedSetuContext(
      req.user,
      lastUserMsg.content,
      conv.useProfileContext
    );
    const systemPrompt = buildCaneSystemPrompt(conv.language, conv.mode, contextText);
    const completion = await generateCaneCompletion(
      systemPrompt,
      messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      { temperature: 0.75 }
    );

    if (!completion.configured || completion.error || !completion.content) {
      if (completion.retryAfterSeconds) {
        res.setHeader('Retry-After', String(completion.retryAfterSeconds));
      }
      sendError(
        res,
        completion.error || 'CANE AI provider unavailable right now.',
        completion.configured ? completion.statusCode || 502 : 503,
        !completion.configured ? { aiNotConfigured: true } : undefined
      );
      return;
    }

    const assistantMsg = await CaneMessage.create({
      conversationId: conv._id,
      userId: req.user._id,
      role: 'assistant',
      content: completion.content,
      provider: `${completion.provider}:${completion.model}`,
      links: suggestedLinks
    });

    conv.lastMessageAt = new Date();
    await conv.save();

    sendSuccess(res, 'Response regenerated', { assistantMessage: assistantMsg });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to regenerate response', 500);
  }
};

export const submitMessageFeedback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const msg = await CaneMessage.findById(req.params.messageId);
    if (!msg || msg.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Message not found', 404);
      return;
    }
    const fb = req.body?.feedback;
    msg.feedback = fb === 'up' || fb === 'down' ? fb : null;
    await msg.save();
    sendSuccess(res, 'Feedback saved', { messageId: msg._id, feedback: msg.feedback });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to save feedback', 500);
  }
};

export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const conv = await CaneConversation.findById(req.params.id);
    if (!conv || conv.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Conversation not found', 404);
      return;
    }
    await Promise.all([
      CaneMessage.deleteMany({ conversationId: conv._id }),
      CaneConversation.findByIdAndDelete(conv._id)
    ]);
    sendSuccess(res, 'Conversation cleared and deleted');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete conversation', 500);
  }
};

// ==================== CANE ROADMAPS ====================

export const getCaneRoadmaps = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const roadmaps = await CaneRoadmap.find({ userId: req.user._id }).sort({ createdAt: -1 });
    sendSuccess(res, 'Saved career roadmaps retrieved', roadmaps);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to load roadmaps', 500);
  }
};

export const saveCaneRoadmap = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const { title, targetRole, durationLabel, content, milestones } = req.body || {};
    if (!title || !content) {
      sendError(res, 'Roadmap title and content are required', 400);
      return;
    }

    const parsedMilestones = Array.isArray(milestones)
      ? milestones
      : String(content)
          .split('\n')
          .filter((line) => /^(week|month|stage|phase|\d+\.|[-*])/i.test(line.trim()))
          .slice(0, 8)
          .map((line) => ({ label: line.replace(/^[-*•\s]+/, '').slice(0, 140), completed: false }));

    const roadmap = await CaneRoadmap.create({
      userId: req.user._id,
      title: String(title).trim().slice(0, 120),
      targetRole: String(targetRole || title).trim().slice(0, 100),
      durationLabel: String(durationLabel || '3 Months').trim(),
      content: String(content).trim(),
      milestones: parsedMilestones
    });

    sendSuccess(res, 'Career roadmap saved to your SETU dashboard', roadmap, 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to save roadmap', 500);
  }
};

export const toggleRoadmapMilestone = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const roadmap = await CaneRoadmap.findById(req.params.id);
    if (!roadmap || roadmap.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Roadmap not found', 404);
      return;
    }
    const idx = Number(req.body?.milestoneIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= roadmap.milestones.length) {
      sendError(res, 'Invalid milestone index', 400);
      return;
    }
    roadmap.milestones[idx].completed = !roadmap.milestones[idx].completed;
    await roadmap.save();
    sendSuccess(res, 'Milestone updated', roadmap);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update milestone', 500);
  }
};

export const deleteCaneRoadmap = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const roadmap = await CaneRoadmap.findById(req.params.id);
    if (!roadmap || roadmap.userId.toString() !== req.user._id.toString()) {
      sendError(res, 'Roadmap not found', 404);
      return;
    }
    await CaneRoadmap.findByIdAndDelete(roadmap._id);
    sendSuccess(res, 'Roadmap deleted');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete roadmap', 500);
  }
};
