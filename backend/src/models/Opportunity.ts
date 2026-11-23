import mongoose, { Document, Schema } from 'mongoose';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type OpportunityType =
  | 'job'
  | 'full_time'
  | 'part_time'
  | 'internship'
  | 'freelance'
  | 'contract'
  | 'apprenticeship'
  | 'entry_level'
  | 'entrepreneurship';
export type OpportunityStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  title: string;
  department?: string;
  organisationName: string;
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  requiredSkills: string[];
  location: {
    city: string;
    state: string;
    isRuralFocus: boolean;
  };
  workMode: WorkMode;
  opportunityType: OpportunityType;
  stipendOrSalary: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  vacancies?: number;
  duration?: string;
  experienceRequired?: string;
  minEducationLevel?: string;
  minAcademicPercentage?: number | null;
  minCgpa?: number | null;
  minCgpaScale?: number | null;
  applicationDeadline?: string;
  screeningQuestions?: string[];
  externalApplyUrl?: string;
  isCareerRestart: boolean;
  isSampleExample?: boolean;
  status: OpportunityStatus;
  moderationStatus: 'clean' | 'flagged' | 'hidden';
  publishedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Employer',
      index: true
    },
    title: { type: String, required: true, trim: true },
    department: { type: String, default: 'General', trim: true },
    organisationName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    qualifications: { type: [String], default: [] },
    requiredSkills: { type: [String], required: true, index: true },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      isRuralFocus: { type: Boolean, default: false }
    },
    workMode: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'hybrid',
      required: true
    },
    opportunityType: {
      type: String,
      enum: [
        'job',
        'full_time',
        'part_time',
        'internship',
        'freelance',
        'contract',
        'apprenticeship',
        'entry_level',
        'entrepreneurship'
      ],
      default: 'job',
      required: true
    },
    stipendOrSalary: { type: String, default: 'Competitive' },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    vacancies: { type: Number, default: 1, min: 1 },
    duration: { type: String, default: 'Full-Time' },
    experienceRequired: { type: String, default: 'Fresher / Entry-Level Welcome' },
    minEducationLevel: { type: String, default: '' },
    minAcademicPercentage: { type: Number, default: null },
    minCgpa: { type: Number, default: null },
    minCgpaScale: { type: Number, default: 10 },
    applicationDeadline: { type: String, default: '' },
    screeningQuestions: { type: [String], default: [] },
    externalApplyUrl: { type: String, default: '' },
    isCareerRestart: { type: Boolean, default: false, index: true },
    isSampleExample: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'published',
      required: true,
      index: true
    },
    moderationStatus: {
      type: String,
      enum: ['clean', 'flagged', 'hidden'],
      default: 'clean',
      index: true
    },
    publishedAt: { type: Date },
    closedAt: { type: Date }
  },
  { timestamps: true }
);

OpportunitySchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
