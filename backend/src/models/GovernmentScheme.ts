import mongoose, { Document, Schema } from 'mongoose';

export type SchemeCategory =
  | 'skill_training'
  | 'entrepreneurship_loan'
  | 'women_livelihood'
  | 'rural_employment'
  | 'internship';

export interface ISchemeEligibilityRules {
  minAge?: number;
  maxAge?: number;
  educationLevels?: string[];
  studentFriendly?: boolean;
  entrepreneurshipFocused?: boolean;
  womenFocused?: boolean;
  ruralFocused?: boolean;
  states?: string[];
  keywords?: string[];
}

export type SchemeVerificationStatus = 'verified' | 'pending_verification';

export interface IGovernmentScheme extends Document {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  title: string;
  hindiTitle?: string;
  ministry: string;
  category: SchemeCategory;
  targetAudience: string;
  description?: string;
  benefitsSummary: string;
  eligibilitySummary: string;
  ageRequirements?: string;
  educationRequirements?: string;
  stateApplicability?: string;
  verificationStatus?: SchemeVerificationStatus;
  requiredDocuments: string[];
  applicationProcess: string;
  applicationStatus: string;
  officialUrl: string;
  applicationUrl?: string;
  eligibilityRules?: ISchemeEligibilityRules;
  lastReviewedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GovernmentSchemeSchema = new Schema<IGovernmentScheme>(
  {
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true },
    hindiTitle: { type: String, default: '' },
    ministry: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'skill_training',
        'entrepreneurship_loan',
        'women_livelihood',
        'rural_employment',
        'internship'
      ],
      required: true,
      index: true
    },
    targetAudience: { type: String, default: 'General' },
    description: { type: String, default: '' },
    benefitsSummary: { type: String, required: true },
    eligibilitySummary: { type: String, required: true },
    ageRequirements: { type: String, default: 'Check official portal for current age rules' },
    educationRequirements: { type: String, default: 'Varies by program — see official portal' },
    stateApplicability: { type: String, default: 'All India (Central Scheme)' },
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending_verification'],
      default: 'pending_verification'
    },
    requiredDocuments: { type: [String], default: [] },
    applicationProcess: { type: String, default: '' },
    applicationStatus: {
      type: String,
      default: 'Ongoing — Verify current cycle on Official Portal'
    },
    officialUrl: { type: String, required: true, trim: true },
    applicationUrl: { type: String, default: '' },
    eligibilityRules: {
      minAge: { type: Number },
      maxAge: { type: Number },
      educationLevels: { type: [String], default: [] },
      studentFriendly: { type: Boolean, default: false },
      entrepreneurshipFocused: { type: Boolean, default: false },
      womenFocused: { type: Boolean, default: false },
      ruralFocused: { type: Boolean, default: false },
      states: { type: [String], default: [] },
      keywords: { type: [String], default: [] }
    },
    lastReviewedDate: { type: String, default: '2026-03-01' }
  },
  { timestamps: true }
);

GovernmentSchemeSchema.index({ title: 'text', ministry: 'text', benefitsSummary: 'text' });

export const GovernmentScheme = mongoose.model<IGovernmentScheme>(
  'GovernmentScheme',
  GovernmentSchemeSchema
);
