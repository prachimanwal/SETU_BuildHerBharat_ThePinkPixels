import mongoose, { Document, Schema, Types } from 'mongoose';

export type OpportunityType = 'job' | 'internship' | 'apprenticeship' | 'freelance' | 'flexible_work';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type OpportunityStatus = 'draft' | 'published' | 'archived' | 'hidden_by_admin';

export interface IOpportunity extends Document {
  employerId: Types.ObjectId;
  title: string;
  organisationName: string;
  opportunityType: OpportunityType;
  workMode: WorkMode;
  location: string;
  salaryOrStipend: string;
  requiredSkills: string[];
  experienceRequired: string;
  educationRequired: string;
  isCareerRestart: boolean;
  description: string;
  status: OpportunityStatus;
  isExternal: boolean;
  externalApplyUrl?: string;
  isDemoData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    organisationName: { type: String, required: true, trim: true },
    opportunityType: {
      type: String,
      enum: ['job', 'internship', 'apprenticeship', 'freelance', 'flexible_work'],
      required: true
    },
    workMode: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      required: true
    },
    location: { type: String, required: true },
    salaryOrStipend: { type: String, default: 'Competitive / Project Based' },
    requiredSkills: { type: [String], default: [] },
    experienceRequired: { type: String, default: 'None / Fresher friendly' },
    educationRequired: { type: String, default: 'No minimum requirement' },
    isCareerRestart: { type: Boolean, default: false },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'hidden_by_admin'],
      default: 'draft'
    },
    isExternal: { type: Boolean, default: false },
    externalApplyUrl: { type: String, default: '' },
    isDemoData: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for fast searching and filtering
OpportunitySchema.index({ status: 1, opportunityType: 1, workMode: 1, isCareerRestart: 1 });
OpportunitySchema.index({ title: 'text', description: 'text', organisationName: 'text' });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
