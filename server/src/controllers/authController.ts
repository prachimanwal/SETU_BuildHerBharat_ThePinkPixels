import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token';

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, ...profileData } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Strictly disallow public registration as admin
    if (role === 'admin') {
      res.status(403).json({ error: 'Public administrator registration is forbidden' });
      return;
    }

    const assignedRole: UserRole = role === 'employer' ? 'employer' : 'seeker';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      seekerProfile:
        assignedRole === 'seeker'
          ? {
              headline: profileData.headline || '',
              phone: profileData.phone || '',
              location: profileData.location || { city: '', state: '', isRural: false },
              languages: profileData.languages || ['Hindi', 'English'],
              educationLevel: profileData.educationLevel || 'No formal degree',
              qualifications: profileData.qualifications || [],
              skills: profileData.skills || [],
              experienceLevel: profileData.experienceLevel || 'No previous experience / Fresher',
              careerGoals: profileData.careerGoals || '',
              interests: profileData.interests || [],
              preferredWorkMode: profileData.preferredWorkMode || 'any',
              resumeUrl: profileData.resumeUrl || '',
              isCareerRestart: !!profileData.isCareerRestart
            }
          : undefined,
      employerProfile:
        assignedRole === 'employer'
          ? {
              companyName: profileData.companyName || name,
              industry: profileData.industry || 'General',
              website: profileData.website || '',
              companySize: profileData.companySize || '1-10',
              description: profileData.description || '',
              verificationStatus: 'pending',
              verificationDocs: profileData.verificationDocs || {
                docType: 'GSTIN / Registration',
                docNumber: '',
                notes: '',
                submittedAt: new Date()
              }
            }
          : undefined
    });

    await newUser.save();

    const token = generateToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        seekerProfile: newUser.seekerProfile,
        employerProfile: newUser.employerProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        seekerProfile: user.seekerProfile,
        employerProfile: user.employerProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
};

export const logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      seekerProfile: req.user.seekerProfile,
      employerProfile: req.user.employerProfile
    }
  });
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = req.user;
    const { name, avatar, seekerProfile, employerProfile } = req.body;

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    if (user.role === 'seeker' && seekerProfile) {
      user.seekerProfile = {
        ...user.seekerProfile,
        ...seekerProfile
      };
    } else if (user.role === 'employer' && employerProfile) {
      user.employerProfile = {
        ...user.employerProfile,
        ...employerProfile,
        // Preserve verification status - only admins can alter verificationStatus directly
        verificationStatus: user.employerProfile?.verificationStatus || 'pending'
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        seekerProfile: user.seekerProfile,
        employerProfile: user.employerProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};
