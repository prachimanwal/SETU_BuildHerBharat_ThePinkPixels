import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export interface IInterviewDetails {
  date?: string;
  time?: string;
  mode?: 'online_call' | 'in_person';
  meetingLink?: string;
  notes?: string;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  coverNote?: string;
  interviewDetails?: IInterviewDetails;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Selected',
        'Rejected'
      ],
      default: 'Applied',
      required: true,
      index: true
    },
    coverNote: { type: String, default: '' },
    interviewDetails: {
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      mode: {
        type: String,
        enum: ['online_call', 'in_person'],
        default: 'online_call'
      },
      meetingLink: { type: String, default: '' },
      notes: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Prevent duplicate direct applications from same seeker to same opportunity
ApplicationSchema.index({ opportunityId: 1, seekerId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
