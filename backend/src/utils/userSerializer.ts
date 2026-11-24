import { IUser } from '../models/User';

export interface ProfileCompletionDetails {
  completionPercentage: number;
  completedSections: string[];
  missingSections: string[];
}

export const getProfileCompletionDetails = (user: any): ProfileCompletionDetails => {
  if (!user) {
    return {
      completionPercentage: 0,
      completedSections: [],
      missingSections: ['Personal Information']
    };
  }

  if (user.role === 'employer') {
    const emp = user.employerProfile || {};
    const completedSections: string[] = [];
    const missingSections: string[] = [];
    let score = 0;

    if (user.name?.trim()) {
      score += 20;
      completedSections.push('Account Name');
    } else {
      missingSections.push('Account Name');
    }

    if (emp.companyName?.trim()) {
      score += 20;
      completedSections.push('Company Name');
    } else {
      missingSections.push('Company Name');
    }

    if (emp.industry?.trim() && emp.industry !== 'General') {
      score += 15;
      completedSections.push('Industry');
    } else {
      missingSections.push('Industry');
    }

    if (emp.description?.trim()) {
      score += 20;
      completedSections.push('Organization Description');
    } else {
      missingSections.push('Organization Description');
    }

    if (emp.website?.trim()) {
      score += 10;
      completedSections.push('Website');
    } else {
      missingSections.push('Website');
    }

    if (emp.verificationDocs?.docNumber?.trim()) {
      score += 15;
      completedSections.push('Verification Documents');
    } else {
      missingSections.push('Verification Documents');
    }

    return {
      completionPercentage: Math.min(100, Math.max(0, score)),
      completedSections,
      missingSections
    };
  }

  const profile = user.seekerProfile || {};
  const completedSections: string[] = [];
  const missingSections: string[] = [];
  let score = 0;

  // 1. Personal Info (20%)
  const hasName = Boolean(user.name && user.name.trim().length > 0);
  const hasLocation = Boolean(
    profile.location?.city?.trim() && profile.location?.state?.trim()
  );
  const hasBioOrHeadline = Boolean(
    (profile.bio && profile.bio.trim().length > 0) ||
      (profile.headline && profile.headline.trim().length > 0)
  );

  if (hasName) score += 8;
  if (hasLocation) score += 7;
  if (hasBioOrHeadline) score += 5;

  if (hasName && hasLocation && hasBioOrHeadline) {
    completedSections.push('Personal Information');
  } else {
    missingSections.push('Personal Information (city, state & short intro)');
  }

  // 2. Educational Background (20%)
  const hasEducation =
    (Array.isArray(profile.education) && profile.education.length > 0) ||
    Boolean(
      profile.educationLevel &&
        profile.educationLevel.trim().length > 0 &&
        profile.educationLevel !== 'No formal degree'
    );
  if (hasEducation) {
    score += 20;
    completedSections.push('Educational Background');
  } else {
    missingSections.push('Educational Background');
  }

  // 3. Skills (20%)
  const hasSkills =
    (Array.isArray(profile.detailedSkills) && profile.detailedSkills.length > 0) ||
    (Array.isArray(profile.skills) && profile.skills.length > 0);
  if (hasSkills) {
    score += 20;
    completedSections.push('Skills');
  } else {
    missingSections.push('Skills');
  }

  // 4. Career Interests & Goals (15%)
  const hasInterests = Array.isArray(profile.interests) && profile.interests.length > 0;
  const hasGoals =
    (Array.isArray(profile.careerGoalsList) && profile.careerGoalsList.length > 0) ||
    Boolean(profile.careerGoals && profile.careerGoals.trim().length > 0);
  if (hasInterests) score += 8;
  if (hasGoals) score += 7;

  if (hasInterests && hasGoals) {
    completedSections.push('Career Interests & Goals');
  } else {
    missingSections.push('Career Interests & Goals');
  }

  // 5. Employment Preferences (15%)
  const prefs = profile.employmentPreferences || {};
  const hasJobTypes = Array.isArray(prefs.jobTypes) && prefs.jobTypes.length > 0;
  const hasWorkModes =
    (Array.isArray(prefs.workModes) && prefs.workModes.length > 0) ||
    Boolean(profile.preferredWorkMode && profile.preferredWorkMode !== 'any');
  const hasPrefLocations =
    Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0;

  if (hasJobTypes) score += 6;
  if (hasWorkModes) score += 5;
  if (hasPrefLocations || prefs.expectedSalary?.trim() || prefs.availability?.trim()) {
    score += 4;
  }

  if (hasJobTypes && hasWorkModes) {
    completedSections.push('Employment Preferences');
  } else {
    missingSections.push('Employment Preferences');
  }

  // 6. Experience / Fresher Confirmation (10%)
  const hasExperienceInfo =
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    Boolean(profile.experienceLevel && profile.experienceLevel.trim().length > 0) ||
    Boolean(profile.onboardingCompleted);

  if (hasExperienceInfo) {
    score += 10;
    completedSections.push('Professional Experience');
  } else {
    missingSections.push('Professional Experience (or fresher status)');
  }

  return {
    completionPercentage: Math.min(100, Math.max(0, score)),
    completedSections,
    missingSections
  };
};

export const calculateProfileCompletion = (user: any): number => {
  return getProfileCompletionDetails(user).completionPercentage;
};

export const serializeUser = (user: IUser) => {
  const picture = user.profilePicture || user.avatar || '';
  const completionDetails = getProfileCompletionDetails(user);

  return {
    id: user._id,
    name: user.name,
    fullName: user.fullName || user.name,
    email: user.email,
    role: user.role,
    avatar: picture,
    profilePicture: picture,
    emailVerified: Boolean(user.emailVerified),
    profileCompletion: completionDetails.completionPercentage,
    completedSections: completionDetails.completedSections,
    missingSections: completionDetails.missingSections,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    themePreference: user.themePreference || 'system',
    googleLinked: Boolean(user.googleId),
    notificationPreferences: {
      jobApplicationUpdates: user.notificationPreferences?.jobApplicationUpdates ?? true,
      interviewNotifications: user.notificationPreferences?.interviewNotifications ?? true,
      learningReminders: user.notificationPreferences?.learningReminders ?? true,
      accountSecurityAlerts: user.notificationPreferences?.accountSecurityAlerts ?? true
    },
    seekerProfile: user.seekerProfile,
    employerProfile: user.employerProfile
  };
};
