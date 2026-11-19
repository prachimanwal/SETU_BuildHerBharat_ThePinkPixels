import mongoose, { Document, Schema } from 'mongoose';

export type ReportReason =
  | 'fraud_or_scam'
  | 'misleading_terms'
  | 'discrimination'
  | 'spam'
  | 'other';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: [
        'fraud_or_scam',
        'misleading_terms',
        'discrimination',
        'spam',
        'other'
      ],
      required: true
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
    resolutionNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>('Report', ReportSchema);
