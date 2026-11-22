import mongoose, { Document, Schema } from 'mongoose';

export interface IProgressSnapshot extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dateKey: string; // YYYY-MM-DD
  overallJourneyPct: number;
  assessmentAvgPct: number;
  learningCompletionPct: number;
  assignmentsCompleted: number;
  portfolioCount: number;
  applicationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSnapshotSchema = new Schema<IProgressSnapshot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dateKey: { type: String, required: true },
    overallJourneyPct: { type: Number, default: 0 },
    assessmentAvgPct: { type: Number, default: 0 },
    learningCompletionPct: { type: Number, default: 0 },
    assignmentsCompleted: { type: Number, default: 0 },
    portfolioCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ProgressSnapshotSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const ProgressSnapshot = mongoose.model<IProgressSnapshot>(
  'ProgressSnapshot',
  ProgressSnapshotSchema
);
