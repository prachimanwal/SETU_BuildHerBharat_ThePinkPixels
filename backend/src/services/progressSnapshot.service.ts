import mongoose from 'mongoose';
import { User } from '../models/User';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { Resume } from '../models/Resume';
import { UploadedResumeFile } from '../models/UploadedResumeFile';
import { Application } from '../models/Application';
import { ProgressSnapshot } from '../models/ProgressSnapshot';
import { calculateProfileCompletion } from '../utils/userSerializer';

export const CORE_SKILL_CATEGORIES = [
  'Technical skills',
  'Communication skills',
  'Problem-solving',
  'Leadership',
  'Interview preparation',
  'Industry-specific skills'
] as const;

export type CoreSkillCategory = (typeof CORE_SKILL_CATEGORIES)[number];

/**
 * Parses a LearningResource.duration string (e.g., "45 mins", "2 hours", "1.5 hrs", "3 weeks")
 * into conservative numeric learning hours. Returns 0.5h fallback ONLY for completed resources
 * with unparseable duration labels so totals remain honest and grounded.
 */
export function parseDurationToHours(durationStr?: string): number {
  const raw = String(durationStr || '').trim().toLowerCase();
  if (!raw) return 0.5;

  const numMatch = raw.match(/(\d+(?:\.\d+)?)/);
  const val = numMatch ? parseFloat(numMatch[1]) : NaN;
  if (!Number.isFinite(val) || val <= 0) return 0.5;

  if (/min/.test(raw)) return Math.round((val / 60) * 100) / 100;
  if (/hour|hr/.test(raw)) return Math.round(val * 100) / 100;
  if (/day/.test(raw)) return Math.round(val * 2 * 100) / 100;
  if (/week/.test(raw)) return Math.round(val * 4 * 100) / 100;
  return Math.round(val * 100) / 100;
}

/**
 * Maps any SETU AssessmentResult or LearningResource metadata into one of the
 * 6 core skill development categories transparently.
 */
export function classifyIntoCoreSkillCategory(
  category?: string,
  domainOrTag?: string,
  title?: string
): CoreSkillCategory {
  const hay = `${category || ''} ${domainOrTag || ''} ${title || ''}`.toLowerCase();

  if (/interview|resume|placement|job readiness|career|mock|ats|portfolio|hr round/.test(hay)) {
    return 'Interview preparation';
  }
  if (/leader|management|team|agile|scrum|project management|entrepreneur|negotiation|decision/.test(hay)) {
    return 'Leadership';
  }
  if (/communicat|english|writing|copywriting|presentation|speaking|email|soft skill|hindi typing|grammar/.test(hay)) {
    return 'Communication skills';
  }
  if (/aptitude|logic|reason|problem|algorithm|dsa|math|quantitative|critical thinking|analytical|puzzle/.test(hay)) {
    return 'Problem-solving';
  }
  if (
    /marketing|seo|finance|accounting|tally|sales|customer|design|canva|figma|ui\/ux|healthcare|retail|banking|business|operations|hr|social media|video|graphic/.test(
      hay
    )
  ) {
    return 'Industry-specific skills';
  }
  return 'Technical skills';
}

export interface CareerProgressComponents {
  overallCareerProgressPct: number;
  profilePoints: number; // max 15
  assessmentPoints: number; // max 20
  learningPoints: number; // max 20
  portfolioResumePoints: number; // max 20
  applicationPoints: number; // max 25
}

/**
 * Transparent, consistent 0-100% Overall Career Progress calculation:
 * - Profile completion:         up to 15 pts
 * - Skill assessments:          up to 20 pts (volume + score quality)
 * - Learning & practice:        up to 20 pts (completed courses + assignments)
 * - Portfolio & Resume:         up to 20 pts (projects + built/uploaded resume)
 * - Job applications & stages:  up to 25 pts (applied, shortlisted, interview, offer/hired)
 *
 * A brand-new user with no activity starts honestly based only on actual profile fields filled
 * (and 0 on all activity components).
 */
export function computeOverallCareerProgress(inputs: {
  profilePct: number;
  assessmentsCount: number;
  avgAssessmentPct: number;
  completedLearningCount: number;
  completedAssignmentsCount: number;
  portfolioCount: number;
  resumesCount: number;
  applicationsCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  offersOrHiredCount: number;
}): CareerProgressComponents {
  // 1. Profile (15 pts)
  const profilePoints = Math.min(15, Math.round((Math.max(0, inputs.profilePct) / 100) * 15));

  // 2. Assessments (20 pts: up to 10 pts for completing >= 2 assessments + up to 10 pts for score quality)
  const assessVolume = Math.min(10, inputs.assessmentsCount * 5);
  const assessQuality =
    inputs.assessmentsCount > 0 ? Math.min(10, Math.round((inputs.avgAssessmentPct / 100) * 10)) : 0;
  const assessmentPoints = Math.min(20, assessVolume + assessQuality);

  // 3. Learning & Practice (20 pts: up to 12 pts for up to 3 completed modules + up to 8 pts for >= 1 assignment)
  const coursePts = Math.min(12, inputs.completedLearningCount * 4);
  const assignmentPts = Math.min(8, inputs.completedAssignmentsCount * 8);
  const learningPoints = Math.min(20, coursePts + assignmentPts);

  // 4. Portfolio & Resume (20 pts: up to 12 pts for up to 2 projects + 8 pts for having a resume)
  const projectPts = Math.min(12, inputs.portfolioCount * 6);
  const resumePts = inputs.resumesCount > 0 ? 8 : 0;
  const portfolioResumePoints = Math.min(20, projectPts + resumePts);

  // 5. Job Applications & Milestones (25 pts)
  let applicationPoints = 0;
  if (inputs.applicationsCount > 0) applicationPoints += Math.min(10, 5 + inputs.applicationsCount * 2);
  if (inputs.shortlistedCount > 0) applicationPoints += 5;
  if (inputs.interviewsCount > 0) applicationPoints += 5;
  if (inputs.offersOrHiredCount > 0) applicationPoints += 5;
  applicationPoints = Math.min(25, applicationPoints);

  const total = Math.min(
    100,
    profilePoints + assessmentPoints + learningPoints + portfolioResumePoints + applicationPoints
  );

  return {
    overallCareerProgressPct: total,
    profilePoints,
    assessmentPoints,
    learningPoints,
    portfolioResumePoints,
    applicationPoints
  };
}

/**
 * Non-blocking helper that persists today's timestamped ProgressSnapshot in MongoDB
 * whenever a user completes an assessment, course, project, resume, or job application.
 */
export async function recordUserProgressSnapshot(
  userId: mongoose.Types.ObjectId | string
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const uid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const [user, attempts, learningDocs, portfolioCount, builtResumes, uploadedResumes, applications] =
      await Promise.all([
        User.findById(uid).select('-passwordHash'),
        AssessmentResult.find({ userId: uid }).select('percentage passed'),
        LearningProgress.find({ userId: uid }).populate('resourceId', 'type duration'),
        Portfolio.countDocuments({ userId: uid }),
        Resume.countDocuments({ userId: uid }),
        UploadedResumeFile.countDocuments({ userId: uid }),
        Application.find({ seekerId: uid }).select('status')
      ]);

    if (!user || user.role !== 'seeker') return;

    const profilePct = calculateProfileCompletion(user);
    const completedLearning = learningDocs.filter((l) => l.status === 'completed');
    const completedAssignments = completedLearning.filter(
      (l: any) => l.resourceId?.type === 'practical_assignment'
    );
    const learningHours = Math.round(
      completedLearning.reduce((acc, l: any) => acc + parseDurationToHours(l.resourceId?.duration), 0) * 10
    ) / 10;

    const avgAssessmentPct =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0;

    const learningCompletionPct =
      learningDocs.length > 0
        ? Math.round((completedLearning.length / learningDocs.length) * 100)
        : 0;

    const resumesCount = builtResumes + uploadedResumes;
    const shortlistedCount = applications.filter((a) =>
      ['Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Sent', 'Hired', 'Selected'].includes(
        a.status
      )
    ).length;
    const interviewsCount = applications.filter((a) =>
      ['Interview Scheduled', 'Interview Completed', 'Offer Sent', 'Hired', 'Selected'].includes(a.status)
    ).length;
    const offersCount = applications.filter((a) =>
      ['Offer Sent', 'Hired', 'Selected'].includes(a.status)
    ).length;
    const hiredCount = applications.filter((a) => ['Hired', 'Selected'].includes(a.status)).length;

    const progress = computeOverallCareerProgress({
      profilePct,
      assessmentsCount: attempts.length,
      avgAssessmentPct,
      completedLearningCount: completedLearning.length,
      completedAssignmentsCount: completedAssignments.length,
      portfolioCount,
      resumesCount,
      applicationsCount: applications.length,
      shortlistedCount,
      interviewsCount,
      offersOrHiredCount: offersCount
    });

    const milestones: string[] = [];
    if (profilePct >= 60) milestones.push('Profile Ready');
    if (attempts.length > 0) milestones.push('Skill Assessed');
    if (completedLearning.length > 0) milestones.push('Course Completed');
    if (portfolioCount > 0) milestones.push('Portfolio Published');
    if (resumesCount > 0) milestones.push('Resume Ready');
    if (applications.length > 0) milestones.push('Applied for Jobs');
    if (interviewsCount > 0) milestones.push('Interview Stage');
    if (hiredCount > 0) milestones.push('Hired');

    const dateKey = new Date().toISOString().slice(0, 10);
    await ProgressSnapshot.findOneAndUpdate(
      { userId: uid, dateKey },
      {
        $set: {
          overallCareerProgressPct: progress.overallCareerProgressPct,
          overallJourneyPct: progress.overallCareerProgressPct,
          assessmentAvgPct: avgAssessmentPct,
          learningCompletionPct,
          learningHours,
          assignmentsCompleted: completedAssignments.length,
          portfolioCount,
          resumesCount,
          applicationsCount: applications.length,
          interviewsCount,
          offersCount,
          hiredCount,
          milestones
        }
      },
      { upsert: true }
    );
  } catch {
    // Non-blocking snapshot write
  }
}
