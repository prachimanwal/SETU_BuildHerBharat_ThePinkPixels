import mongoose, { Document, Schema } from 'mongoose';

export type SchemeCategory =
  | 'skill_training'
  | 'entrepreneurship_loan'
  | 'women_livelihood'
  | 'rural_employment'
  | 'internship';

export interface IGovernmentScheme extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  hindiTitle?: string;
  ministry: string;
  category: SchemeCategory;
  targetAudience: string;
  benefitsSummary: string;
  eligibilitySummary: string;
  officialUrl: string;
  lastReviewedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GovernmentSchemeSchema = new Schema<IGovernmentScheme>(
  {
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
    benefitsSummary: { type: String, required: true },
    eligibilitySummary: { type: String, required: true },
    officialUrl: { type: String, required: true, trim: true },
    lastReviewedDate: { type: String, default: '2026-02-15' }
  },
  { timestamps: true }
);

GovernmentSchemeSchema.index({ title: 'text', ministry: 'text', benefitsSummary: 'text' });

export const GovernmentScheme = mongoose.model<IGovernmentScheme>(
  'GovernmentScheme',
  GovernmentSchemeSchema
);
