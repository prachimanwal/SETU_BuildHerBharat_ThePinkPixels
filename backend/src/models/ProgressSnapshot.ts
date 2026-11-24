import mongoose, { Document, Schema } from 'mongoose';

export interface IProgressSnapshot extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dateKey: string; // YYYY-MM-DD
  overallCareerProgressPct: number;
  overallJourneyPct: number;
  assessmentAvgPct: number;
  learningCompletionPct: number;
  learningHours: number;
  assignmentsCompleted: number;
  portfolioCount: number;
  resumesCount: number;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  hiredCount: number;
  milestones: string[];
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
    overallCareerProgressPct: { type: Number, default: 0 },
    overallJourneyPct: { type: Number, default: 0 },
    assessmentAvgPct: { type: Number, default: 0 },
    learningCompletionPct: { type: Number, default: 0 },
    learningHours: { type: Number, default: 0 },
    assignmentsCompleted: { type: Number, default: 0 },
    portfolioCount: { type: Number, default: 0 },
    resumesCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    interviewsCount: { type: Number, default: 0 },
    offersCount: { type: Number, default: 0 },
    hiredCount: { type: Number, default: 0 },
    milestones: { type: [String], default: [] }
  },
  { timestamps: true }
);

ProgressSnapshotSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const ProgressSnapshot = mongoose.model<IProgressSnapshot>(
  'ProgressSnapshot',
  ProgressSnapshotSchema
);
