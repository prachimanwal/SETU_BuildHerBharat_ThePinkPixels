import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interview Completed'
  | 'Offer Sent'
  | 'Hired'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn';

export interface IInterviewDetails {
  date?: string;
  time?: string;
  mode?: 'online_call' | 'in_person' | 'Online' | 'Offline' | 'Telephone';
  meetingLink?: string;
  notes?: string;
}

export interface IRecruiterNote {
  note: string;
  authorName: string;
  createdAt: Date;
}

export interface IApplicationStatusHistory {
  status: ApplicationStatus;
  updatedByRole: 'seeker' | 'employer' | 'admin' | 'system';
  note?: string;
  timestamp: Date;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  coverNote?: string;
  screeningAnswers?: Array<{ question: string; answer: string }>;
  interviewDetails?: IInterviewDetails;
  recruiterNotes?: IRecruiterNote[];
  candidateUpdateMessage?: string;
  statusHistory?: IApplicationStatusHistory[];
  invitedByEmployer?: boolean;
  offerSentAt?: Date;
  hiredAt?: Date;
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
        'Interview Completed',
        'Offer Sent',
        'Hired',
        'Selected',
        'Rejected',
        'Withdrawn'
      ],
      default: 'Applied',
      required: true,
      index: true
    },
    coverNote: { type: String, default: '' },
    screeningAnswers: [
      {
        question: { type: String, default: '' },
        answer: { type: String, default: '' }
      }
    ],
    interviewDetails: {
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      mode: {
        type: String,
        enum: ['online_call', 'in_person', 'Online', 'Offline', 'Telephone'],
        default: 'online_call'
      },
      meetingLink: { type: String, default: '' },
      notes: { type: String, default: '' }
    },
    // Private to employer/admin; explicitly stripped before returning to seekers
    recruiterNotes: [
      {
        note: { type: String, required: true, trim: true },
        authorName: { type: String, default: 'Recruiter' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    candidateUpdateMessage: { type: String, default: '' },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedByRole: {
          type: String,
          enum: ['seeker', 'employer', 'admin', 'system'],
          default: 'system'
        },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    invitedByEmployer: { type: Boolean, default: false },
    offerSentAt: { type: Date },
    hiredAt: { type: Date }
  },
  { timestamps: true }
);

// Prevent duplicate direct applications from same seeker to same opportunity
ApplicationSchema.index({ opportunityId: 1, seekerId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
