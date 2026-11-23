import mongoose, { Document, Schema } from 'mongoose';

export type RecruitmentNotificationType =
  | 'new_application'
  | 'candidate_response'
  | 'upcoming_interview'
  | 'interview_update'
  | 'interview_cancelled'
  | 'verification_update'
  | 'job_expiring'
  | 'offer_response'
  | 'job_invitation'
  | 'application_update';

export interface IRecruitmentNotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientRole: 'employer' | 'seeker' | 'admin';
  type: RecruitmentNotificationType;
  title: string;
  message: string;
  link?: string;
  dedupeKey?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecruitmentNotificationSchema = new Schema<IRecruitmentNotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['employer', 'seeker', 'admin'],
      required: true
    },
    type: {
      type: String,
      enum: [
        'new_application',
        'candidate_response',
        'upcoming_interview',
        'interview_update',
        'interview_cancelled',
        'verification_update',
        'job_expiring',
        'offer_response',
        'job_invitation',
        'application_update'
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    dedupeKey: { type: String, default: '', index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

RecruitmentNotificationSchema.index({ recipientId: 1, createdAt: -1 });

export const RecruitmentNotification = mongoose.model<IRecruitmentNotification>(
  'RecruitmentNotification',
  RecruitmentNotificationSchema,
  'recruitmentnotifications'
);
