import mongoose, { Document, Schema } from 'mongoose';

export type LearningStatus = 'started' | 'in_progress' | 'completed';

export interface ILearningProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  status: LearningStatus;
  completedSteps: number[];
  submissionDetails?: string;
  submissionText?: string;
  submissionUrl?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningProgressSchema = new Schema<ILearningProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningResource',
      required: true
    },
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed'],
      default: 'started',
      required: true
    },
    completedSteps: { type: [Number], default: [] },
    submissionDetails: { type: String, default: '' },
    submissionText: { type: String, default: '' },
    submissionUrl: { type: String, default: '' },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

LearningProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const LearningProgress = mongoose.model<ILearningProgress>(
  'LearningProgress',
  LearningProgressSchema
);
