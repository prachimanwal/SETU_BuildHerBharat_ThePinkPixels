import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPortfolioProject extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  skills: string[];
  workSampleUrl?: string;
  source: 'self_created' | 'practice_assignment';
  associatedResourceId?: Types.ObjectId;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioProjectSchema = new Schema<IPortfolioProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    workSampleUrl: { type: String, default: '' },
    source: {
      type: String,
      enum: ['self_created', 'practice_assignment'],
      default: 'self_created'
    },
    associatedResourceId: { type: Schema.Types.ObjectId, ref: 'LearningResource' },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PortfolioProject = mongoose.model<IPortfolioProject>(
  'PortfolioProject',
  PortfolioProjectSchema
);
