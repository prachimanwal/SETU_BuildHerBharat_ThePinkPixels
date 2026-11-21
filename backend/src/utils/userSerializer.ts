import { IUser } from '../models/User';

const DEMO_ADMIN_EMAIL = 'admin@setu.gov.in';

export const isDemoEmail = (email?: string): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return lower.endsWith('@setu.demo') || lower === DEMO_ADMIN_EMAIL;
};

export const isDemoUser = (user?: Partial<IUser> | null): boolean => {
  if (!user) return false;
  return Boolean(user.isDemoAccount || user.authProvider === 'demo' || isDemoEmail(user.email));
};

export const calculateProfileCompletion = (user: any): number => {
  if (!user) return 0;

  if (user.role === 'employer') {
    const emp = user.employerProfile || {};
    let score = 0;
    if (user.name?.trim()) score += 20;
    if (emp.companyName?.trim()) score += 20;
    if (emp.industry?.trim() && emp.industry !== 'General') score += 15;
    if (emp.description?.trim()) score += 20;
    if (emp.website?.trim()) score += 10;
    if (emp.verificationDocs?.docNumber?.trim()) score += 15;
    return Math.min(100, Math.max(15, score));
  }

  const profile = user.seekerProfile || {};
  let score = 0;

  if (user.name && user.name.trim().length > 0) score += 10;
  if ((user.profilePicture || user.avatar || '').trim().length > 0) score += 5;
  if (profile.headline && profile.headline.trim().length > 0) score += 15;
  if (profile.location?.city && profile.location.city.trim().length > 0) score += 15;
  if (
    profile.educationLevel &&
    profile.educationLevel.trim().length > 0 &&
    profile.educationLevel !== 'No formal degree'
  ) {
    score += 15;
  }
  if (Array.isArray(profile.skills) && profile.skills.length > 0) score += 15;
  if (profile.experienceLevel && profile.experienceLevel.trim().length > 0) score += 10;
  if (Array.isArray(profile.languages) && profile.languages.length > 0) score += 5;
  if (
    (profile.resumeUrl && profile.resumeUrl.trim().length > 0) ||
    (profile.phone && profile.phone.trim().length > 0)
  ) {
    score += 10;
  }

  return Math.min(100, Math.max(10, score));
};

export const serializeUser = (user: IUser) => {
  const picture = user.profilePicture || user.avatar || '';
  const profileCompletion = calculateProfileCompletion(user);

  return {
    id: user._id,
    name: user.name,
    fullName: user.fullName || user.name,
    email: user.email,
    role: user.role,
    avatar: picture,
    profilePicture: picture,
    authProvider: user.authProvider || (isDemoUser(user) ? 'demo' : 'local'),
    emailVerified: Boolean(user.emailVerified),
    isDemoAccount: isDemoUser(user),
    profileCompletion,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    seekerProfile: user.seekerProfile,
    employerProfile: user.employerProfile
  };
};
