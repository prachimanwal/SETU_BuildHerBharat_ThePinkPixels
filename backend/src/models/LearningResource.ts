import mongoose, { Document, Schema } from 'mongoose';

export type LearningResourceType = 'tutorial' | 'practical_assignment' | 'course';

export interface ILearningResource extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  duration: string;
  type: LearningResourceType;
  skillTag: string;
  contentUrl: string;
  assignmentBrief?: string;
  targetAudience?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    duration: { type: String, default: '30 mins' },
    type: {
      type: String,
      enum: ['tutorial', 'practical_assignment', 'course'],
      default: 'tutorial',
      required: true
    },
    skillTag: { type: String, required: true, index: true },
    contentUrl: { type: String, required: true },
    assignmentBrief: { type: String, default: '' },
    targetAudience: { type: String, default: 'General' }
  },
  { timestamps: true }
);

export const LearningResource = mongoose.model<ILearningResource>(
  'LearningResource',
  LearningResourceSchema
);
