import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  avatar?: string;
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (data: { credential?: string; email?: string; name?: string; avatar?: string; role?: string }) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok && res.data) {
        const u = extractUser(res.data);
        setUser(u);
      } else {
        setUser(null);
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

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Login failed' };
      }

      const userData = extractUser(res.data);
      const token = extractToken(res.data);
      if (token) {
        localStorage.setItem('setu_auth_token', token);
      }

      setUser(userData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const loginWithGoogle = async (data: { credential?: string; email?: string; name?: string; avatar?: string; role?: string }) => {
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Google sign-in failed' };
      }

      const userData = extractUser(res.data);
      const token = extractToken(res.data);
      if (token) {
        localStorage.setItem('setu_auth_token', token);
      }

      setUser(userData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        return { success: false, error: res.error || 'Registration failed' };
      }

      const userData = extractUser(res.data);
      const token = extractToken(res.data);
      if (token) {
        localStorage.setItem('setu_auth_token', token);
      }

      setUser(userData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('setu_auth_token');
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
      value={{ user, loading, login, loginWithGoogle, register, logout, updateProfile, refreshUser }}
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
