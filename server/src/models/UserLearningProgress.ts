import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserLearningProgress extends Document {
  userId: Types.ObjectId;
  resourceId: Types.ObjectId;
  status: 'started' | 'completed';
  completedAt?: Date;
  submittedWork?: {
    title: string;
    link?: string;
    notes?: string;
  };
  addedToPortfolio: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserLearningProgressSchema = new Schema<IUserLearningProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'LearningResource', required: true },
    status: { type: String, enum: ['started', 'completed'], default: 'started' },
    completedAt: { type: Date },
    submittedWork: {
      title: { type: String, default: '' },
      link: { type: String, default: '' },
      notes: { type: String, default: '' }
    },
    addedToPortfolio: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Prevent duplicate progress entries for same user and resource
UserLearningProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const UserLearningProgress = mongoose.model<IUserLearningProgress>(
  'UserLearningProgress',
  UserLearningProgressSchema
);
