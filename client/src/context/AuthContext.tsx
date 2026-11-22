import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  avatar?: string;
  profilePicture?: string;
  emailVerified?: boolean;
  profileCompletion?: number;
  lastLogin?: string;
  createdAt?: string;
  seekerProfile?: {
    headline?: string;
    phone?: string;
    location?: {
      city?: string;
      state?: string;
      isRural?: boolean;
    };
    languages?: string[];
    educationLevel?: string;
    qualifications?: Array<{
      title: string;
      institute?: string;
      year?: string;
    }>;
    skills?: string[];
    experienceLevel?: string;
    careerGoals?: string;
    interests?: string[];
    preferredWorkMode?: 'remote' | 'hybrid' | 'onsite' | 'any';
    resumeUrl?: string;
    isCareerRestart?: boolean;
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
  clearSuccessNotice: () => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_MARKER_KEY = 'setu_had_session';

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

  const fetchCurrentUser = async () => {
    const hadPriorSession =
      Boolean(localStorage.getItem('setu_auth_token')) ||
      sessionStorage.getItem(SESSION_MARKER_KEY) === '1';

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

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setSessionNotice('');
      setSuccessNotice('');
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
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

      setSuccessNotice('Account created successfully! Welcome to SETU.');
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
      const res = await apiFetch('/api/users/profile', {
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
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionNotice,
        clearSessionNotice,
        successNotice,
        clearSuccessNotice,
        login,
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
