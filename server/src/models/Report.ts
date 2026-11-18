import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  opportunityId: Types.ObjectId;
  reason: 'fraud_or_scam' | 'fee_charged' | 'inaccurate_details' | 'unsafe_conditions' | 'other';
  description: string;
  status: ReportStatus;
  adminNotes?: string;
  actionTaken?: 'listing_hidden' | 'employer_suspended' | 'dismissed' | 'none';
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    reason: {
      type: String,
      enum: ['fraud_or_scam', 'fee_charged', 'inaccurate_details', 'unsafe_conditions', 'other'],
      required: true
    },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
      index: true
    },
    adminNotes: { type: String, default: '' },
    actionTaken: {
      type: String,
      enum: ['listing_hidden', 'employer_suspended', 'dismissed', 'none'],
      default: 'none'
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
