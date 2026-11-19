import mongoose, { Document, Schema } from 'mongoose';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type OpportunityType = 'job' | 'internship' | 'freelance' | 'apprenticeship';
export type OpportunityStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  title: string;
  organisationName: string;
  description: string;
  requiredSkills: string[];
  location: {
    city: string;
    state: string;
    isRuralFocus: boolean;
  };
  workMode: WorkMode;
  opportunityType: OpportunityType;
  stipendOrSalary: string;
  duration?: string;
  isCareerRestart: boolean;
  status: OpportunityStatus;
  moderationStatus: 'clean' | 'flagged' | 'hidden';
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
    title: { type: String, required: true, trim: true },
    organisationName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
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
      enum: ['job', 'internship', 'freelance', 'apprenticeship'],
      default: 'job',
      required: true
    },
    stipendOrSalary: { type: String, default: 'Competitive' },
    duration: { type: String, default: 'Full-Time' },
    isCareerRestart: { type: Boolean, default: false, index: true },
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
    }
  },
  { timestamps: true }
);

OpportunitySchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
