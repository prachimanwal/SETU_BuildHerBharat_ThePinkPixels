import mongoose, { Document, Schema } from 'mongoose';

export type SchemeAudience = 'all' | 'women' | 'youth' | 'rural' | 'artisans' | 'entrepreneurs';
export type SchemeCategory =
  | 'skill_training'
  | 'financial_assistance'
  | 'self_employment'
  | 'apprenticeship'
  | 'women_empowerment';

export interface IGovernmentScheme extends Document {
  title: string;
  hindiTitle?: string;
  ministryOrDepartment: string;
  targetAudience: SchemeAudience[];
  category: SchemeCategory;
  benefitsSummary: string;
  benefitsSummaryHindi?: string;
  eligibilitySummary: string;
  eligibilitySummaryHindi?: string;
  officialUrl: string; // Must be official confirmed link e.g. .gov.in
  lastReviewedDate: string;
  isDemoData: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GovernmentSchemeSchema = new Schema<IGovernmentScheme>(
  {
    title: { type: String, required: true, trim: true },
    hindiTitle: { type: String, default: '' },
    ministryOrDepartment: { type: String, required: true },
    targetAudience: {
      type: [String],
      enum: ['all', 'women', 'youth', 'rural', 'artisans', 'entrepreneurs'],
      default: ['all']
    },
    category: {
      type: String,
      enum: [
        'skill_training',
        'financial_assistance',
        'self_employment',
        'apprenticeship',
        'women_empowerment'
      ],
      required: true
    },
    benefitsSummary: { type: String, required: true },
    benefitsSummaryHindi: { type: String, default: '' },
    eligibilitySummary: { type: String, required: true },
    eligibilitySummaryHindi: { type: String, default: '' },
    officialUrl: { type: String, required: true },
    lastReviewedDate: { type: String, default: '2026-02-15' },
    isDemoData: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

GovernmentSchemeSchema.index({ category: 1, targetAudience: 1, isActive: 1 });
GovernmentSchemeSchema.index({ title: 'text', ministryOrDepartment: 'text' });

export const GovernmentScheme = mongoose.model<IGovernmentScheme>(
  'GovernmentScheme',
  GovernmentSchemeSchema
);
