import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'seeker' | 'employer' | 'admin';
export type AuthProvider = 'local' | 'google' | 'demo';

export interface ISeekerProfile {
  headline?: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    isRural: boolean;
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
}

export interface IEmployerProfile {
  companyName: string;
  industry: string;
  website?: string;
  companySize?: string;
  description?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  verificationDocs?: {
    docType: string;
    docNumber: string;
    notes?: string;
    submittedAt: Date;
  };
  adminReviewNotes?: string;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  fullName?: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  avatar?: string;
  profilePicture?: string;
  googleId?: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
  isDemoAccount: boolean;
  profileCompletion: number;
  lastLogin?: Date;
  seekerProfile?: ISeekerProfile;
  employerProfile?: IEmployerProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: false },
    role: {
      type: String,
      enum: ['seeker', 'employer', 'admin'],
      default: 'seeker',
      required: true
    },
    avatar: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    googleId: { type: String, unique: true, sparse: true, index: true },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'demo'],
      default: 'local'
    },
    emailVerified: { type: Boolean, default: false },
    isDemoAccount: { type: Boolean, default: false },
    profileCompletion: { type: Number, default: 15, min: 0, max: 100 },
    lastLogin: { type: Date },
    seekerProfile: {
      headline: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        isRural: { type: Boolean, default: false }
      },
      languages: { type: [String], default: [] },
      educationLevel: { type: String, default: '' },
      qualifications: [
        {
          title: { type: String, required: true },
          institute: { type: String, default: '' },
          year: { type: String, default: '' }
        }
      ],
      skills: { type: [String], default: [] },
      experienceLevel: {
        type: String,
        default: ''
      },
      careerGoals: { type: String, default: '' },
      interests: { type: [String], default: [] },
      preferredWorkMode: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite', 'any'],
        default: 'any'
      },
      resumeUrl: { type: String, default: '' },
      isCareerRestart: { type: Boolean, default: false }
    },
    employerProfile: {
      companyName: { type: String, default: '' },
      industry: { type: String, default: 'General' },
      website: { type: String, default: '' },
      companySize: { type: String, default: '1-10' },
      description: { type: String, default: '' },
      verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
      },
      verificationDocs: {
        docType: { type: String, default: '' },
        docNumber: { type: String, default: '' },
        notes: { type: String, default: '' },
        submittedAt: { type: Date, default: Date.now }
      },
      adminReviewNotes: { type: String, default: '' },
      verifiedAt: { type: Date }
    }
  },
  { timestamps: true }
);

// Keep name/fullName and avatar/profilePicture synchronized
UserSchema.pre('save', function () {
  if (this.name && (!this.fullName || this.isModified('name'))) {
    this.fullName = this.name;
  } else if (this.fullName && !this.name) {
    this.name = this.fullName;
  }

  if (this.isModified('profilePicture') && !this.isModified('avatar')) {
    this.avatar = this.profilePicture || '';
  } else if (this.isModified('avatar') && !this.isModified('profilePicture')) {
    this.profilePicture = this.avatar || '';
  } else if (this.avatar && !this.profilePicture) {
    this.profilePicture = this.avatar;
  } else if (this.profilePicture && !this.avatar) {
    this.avatar = this.profilePicture;
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
