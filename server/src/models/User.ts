import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'seeker' | 'employer' | 'admin';
export type EmployerVerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface ISeekerProfile {
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
}

export interface IEmployerProfile {
  companyName?: string;
  industry?: string;
  website?: string;
  companySize?: string;
  description?: string;
  verificationStatus: EmployerVerificationStatus;
  verificationDocs?: {
    docType?: string; // e.g. GSTIN, PAN, Udyam Registration, Certificate
    docNumber?: string;
    notes?: string;
    submittedAt?: Date;
  };
  adminReviewNotes?: string;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  seekerProfile?: ISeekerProfile;
  employerProfile?: IEmployerProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['seeker', 'employer', 'admin'], default: 'seeker' },
    avatar: { type: String, default: '' },
    seekerProfile: {
      headline: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        isRural: { type: Boolean, default: false }
      },
      languages: { type: [String], default: [] },
      educationLevel: { type: String, default: 'No formal degree' },
      qualifications: [
        {
          title: { type: String },
          institute: { type: String },
          year: { type: String }
        }
      ],
      skills: { type: [String], default: [] },
      experienceLevel: { type: String, default: 'No previous experience / Fresher' },
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
      industry: { type: String, default: '' },
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
        submittedAt: { type: Date }
      },
      adminReviewNotes: { type: String, default: '' },
      verifiedAt: { type: Date }
    }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
