import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningResource extends Document {
  title: string;
  titleHindi?: string;
  domain: 'web_development' | 'graphic_design' | 'practical_vocational' | 'build_her_refresher';
  type: 'tutorial' | 'practical_assignment' | 'refresher';
  skillTag: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  summaryHindi?: string;
  externalUrl?: string;
  contentMarkdown: string;
  assignmentBrief?: string;
  assignmentBriefHindi?: string;
  sampleDeliverable?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true },
    titleHindi: { type: String, default: '' },
    domain: {
      type: String,
      enum: ['web_development', 'graphic_design', 'practical_vocational', 'build_her_refresher'],
      required: true
    },
    type: {
      type: String,
      enum: ['tutorial', 'practical_assignment', 'refresher'],
      required: true
    },
    skillTag: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    summary: { type: String, required: true },
    summaryHindi: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    contentMarkdown: { type: String, required: true },
    assignmentBrief: { type: String, default: '' },
    assignmentBriefHindi: { type: String, default: '' },
    sampleDeliverable: { type: String, default: '' }
  },
  { timestamps: true }
);

export const LearningResource = mongoose.model<ILearningResource>(
  'LearningResource',
  LearningResourceSchema
);
