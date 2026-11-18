import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export interface IStatusTimeline {
  status: ApplicationStatus;
  timestamp: Date;
  note?: string;
  updatedBy: Types.ObjectId;
}

export interface IInterviewDetails {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  instructions: string;
  meetLinkOrLocation?: string;
}

export interface IApplication extends Document {
  opportunityId: Types.ObjectId;
  seekerId: Types.ObjectId;
  employerId: Types.ObjectId;
  status: ApplicationStatus;
  timeline: IStatusTimeline[];
  interviewDetails?: IInterviewDetails;
  portfolioProjectsSnapshot: Array<{
    title: string;
    workSampleUrl?: string;
    skills: string[];
  }>;
  coverNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    seekerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
      default: 'Applied'
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    interviewDetails: {
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      instructions: { type: String, default: '' },
      meetLinkOrLocation: { type: String, default: '' }
    },
    portfolioProjectsSnapshot: [
      {
        title: { type: String },
        workSampleUrl: { type: String },
        skills: { type: [String] }
      }
    ],
    coverNote: { type: String, default: '' }
  },
  { timestamps: true }
);

// Prevent duplicate direct applications from same seeker to same opportunity
ApplicationSchema.index({ opportunityId: 1, seekerId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
