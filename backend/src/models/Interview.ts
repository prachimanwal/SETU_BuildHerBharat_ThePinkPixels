import mongoose, { Document, Schema } from 'mongoose';

export type InterviewMode = 'Online' | 'Offline' | 'Telephone';
export type InterviewStatus = 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No Show';

export interface IInterview extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // e.g., "14:30" or "02:30 PM"
  scheduledAt: Date;
  durationMinutes: number;
  mode: InterviewMode;
  meetingLinkOrLocation: string;
  interviewerName: string;
  interviewerEmail?: string;
  notes?: string;
  feedback?: string;
  rating?: number | null;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
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
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduledDate: { type: String, required: true, trim: true },
    scheduledTime: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 45, min: 10, max: 480 },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Telephone'],
      default: 'Online',
      required: true
    },
    meetingLinkOrLocation: { type: String, default: '', trim: true },
    interviewerName: { type: String, default: 'Hiring Manager', trim: true },
    interviewerEmail: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    feedback: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: null },
    status: {
      type: String,
      enum: ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'],
      default: 'Scheduled',
      index: true
    }
  },
  { timestamps: true }
);

InterviewSchema.index({ employerId: 1, scheduledAt: 1 });

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema, 'interviews');
