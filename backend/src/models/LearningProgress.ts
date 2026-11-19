import mongoose, { Document, Schema } from 'mongoose';

export type LearningStatus = 'started' | 'completed';

export interface ILearningProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  status: LearningStatus;
  submissionDetails?: string;
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
      enum: ['started', 'completed'],
      default: 'started',
      required: true
    },
    submissionDetails: { type: String, default: '' }
  },
  { timestamps: true }
);

LearningProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const LearningProgress = mongoose.model<ILearningProgress>(
  'LearningProgress',
  LearningProgressSchema
);
