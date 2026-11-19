import mongoose, { Document, Schema } from 'mongoose';

export type PortfolioSource = 'self_created' | 'practice_assignment';

export interface IPortfolio extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  skills: string[];
  workSampleUrl: string;
  category?: string;
  source: PortfolioSource;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    workSampleUrl: { type: String, required: true, trim: true },
    category: { type: String, default: 'Practical Project' },
    source: {
      type: String,
      enum: ['self_created', 'practice_assignment'],
      default: 'self_created'
    },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
