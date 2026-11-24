import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface EducationEntry {
  level: string;
  degree?: string;
  specialization?: string;
  institution?: string;
  schoolName?: string;
  board?: string;
  duration?: string;
  currentYear?: string;
  currentSemester?: string;
  currentYearOrSemester?: string;
  expectedGraduationYear?: string;
  graduationYear?: string;
  classCompleted?: string;
  stream?: string;
  status?: string;
  scoreType?: 'Percentage' | 'CGPA' | 'Grade' | '';
  percentage?: number | null;
  cgpa?: number | null;
  cgpaScale?: number | null;
  grade?: string;
  gradingSystem?: string;
}

export interface DetailedSkill {
  name: string;
  category?: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  verified?: boolean;
  source: 'self_reported' | 'assessment_verified';
  supportingTitle?: string;
  supportingUrl?: string;
}

export interface ExperienceEntry {
  jobTitle: string;
  organization: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
  achievements?: string;
}

export interface EmploymentPreferences {
  jobTypes?: string[];
  workModes?: string[];
  preferredLocations?: string[];
  expectedSalary?: string;
  availableHours?: string;
  yearsOfExperience?: string;
  availability?: string;
  willingToRelocate?: boolean;
}

export interface NotificationPreferences {
  jobApplicationUpdates: boolean;
  interviewNotifications: boolean;
  learningReminders: boolean;
  accountSecurityAlerts: boolean;
}

export type GenderOption =
  | 'Female'
  | 'Male'
  | 'Non-binary'
  | 'Other'
  | 'Prefer not to say'
  | '';

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  gender?: GenderOption;
  buildHerEligible?: boolean;
  avatar?: string;
  profilePicture?: string;
  emailVerified?: boolean;
  themePreference?: 'light' | 'dark' | 'system';
  googleLinked?: boolean;
  notificationPreferences?: NotificationPreferences;
  profileCompletion?: number;
  completedSections?: string[];
  missingSections?: string[];
  lastLogin?: string;
  createdAt?: string;
  seekerProfile?: {
    headline?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: string;
    accessibilityPreferences?: string;
    preferredLanguage?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      isRural?: boolean;
    };
    languages?: string[];
    educationLevel?: string;
    education?: EducationEntry[];
    qualifications?: Array<{
      title: string;
      institute?: string;
      year?: string;
    }>;
    skills?: string[];
    detailedSkills?: DetailedSkill[];
    experienceLevel?: string;
    hasExperience?: boolean;
    experience?: ExperienceEntry[];
    careerGoals?: string;
    careerGoalsList?: string[];
    interests?: string[];
    preferredWorkMode?: 'remote' | 'hybrid' | 'onsite' | 'any';
    employmentPreferences?: EmploymentPreferences;
    resumeUrl?: string;
    isCareerRestart?: boolean;
    onboardingCompleted?: boolean;
    onboardingSkipped?: boolean;
  };
  employerProfile?: {
    companyName?: string;
    industry?: string;
    website?: string;
    companySize?: string;
    description?: string;
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
    verificationDocs?: {
      docType?: string;
      docNumber?: string;
      notes?: string;
      submittedAt?: string;
    };
    adminReviewNotes?: string;
    verifiedAt?: string;
  };
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionNotice: string;
  clearSessionNotice: () => void;
  successNotice: string;
  setSuccessNotice: (msg: string) => void;
  clearSuccessNotice: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  loginWithSession: (userData: User, token?: string) => void;
  register: (data: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_MARKER_KEY = 'setu_had_session';

export const isBuildHerEligible = (user?: User | null): boolean =>
  Boolean(
    user &&
      user.role === 'seeker' &&
      String(user.gender || '').trim().toLowerCase() === 'female'
  );

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionNotice, setSessionNotice] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  const extractUser = (resData: any): User | null => {
    if (!resData) return null;
    if (resData.data && resData.data.user) return resData.data.user;
    if (resData.user) return resData.user;
    return null;
  };

  const extractToken = (resData: any): string | null => {
    if (!resData) return null;
    if (resData.data && resData.data.token) return resData.data.token;
    if (resData.token) return resData.token;
    return null;
  };

  const fetchCurrentUser = async (forceCheck = false) => {
    const storedToken = localStorage.getItem('setu_auth_token');
    const hadPriorSession =
      Boolean(storedToken) || sessionStorage.getItem(SESSION_MARKER_KEY) === '1';

    if (!forceCheck && !hadPriorSession) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok && res.data) {
        const u = extractUser(res.data);
        setUser(u);
        if (u) {
          sessionStorage.setItem(SESSION_MARKER_KEY, '1');
        }
      } else {
        setUser(null);
        if (res.status === 401) {
          localStorage.removeItem('setu_auth_token');
          sessionStorage.removeItem(SESSION_MARKER_KEY);
          if (hadPriorSession) {
            setSessionNotice(
              res.error || 'Your authentication session has expired. Please sign in again.'
            );
          }
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const clearSessionNotice = () => setSessionNotice('');
  const clearSuccessNotice = () => setSuccessNotice('');

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<AuthResult> => {
    try {
      setSessionNotice('');
      setSuccessNotice('');
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe })
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Invalid email or password. Please try again.' };
      }

      const userData = extractUser(res.data);
      const token = extractToken(res.data);
      if (token) {
        localStorage.setItem('setu_auth_token', token);
      }
      sessionStorage.setItem(SESSION_MARKER_KEY, '1');

      setUser(userData);
      return { success: true, user: userData || undefined };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network connection failed. Please try again.'
      };
    }
  };

  const loginWithSession = (userData: User, token?: string) => {
    setSessionNotice('');
    setSuccessNotice('');
    if (token) {
      localStorage.setItem('setu_auth_token', token);
    }
    sessionStorage.setItem(SESSION_MARKER_KEY, '1');
    setUser(userData);
  };

  const register = async (data: any): Promise<AuthResult> => {
    try {
      setSessionNotice('');
      setSuccessNotice('');
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Registration failed. Please try again.' };
      }

      const userData = extractUser(res.data);
      const token = extractToken(res.data);
      if (token) {
        localStorage.setItem('setu_auth_token', token);
      }
      sessionStorage.setItem(SESSION_MARKER_KEY, '1');

      setSuccessNotice('Account created successfully! Welcome to SETU 🩵');
      setUser(userData);
      return { success: true, user: userData || undefined };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network connection failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('setu_auth_token');
      sessionStorage.removeItem(SESSION_MARKER_KEY);
      setSessionNotice('');
      setSuccessNotice('');
      setUser(null);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Profile update failed' };
      }

      const userData = extractUser(res.data);
      if (userData) {
        setUser(userData);
      }
      return { success: true, user: userData || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionNotice,
        clearSessionNotice,
        successNotice,
        setSuccessNotice,
        clearSuccessNotice,
        login,
        loginWithSession,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
