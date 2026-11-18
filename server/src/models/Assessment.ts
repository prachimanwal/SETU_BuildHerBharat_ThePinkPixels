import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  question: string;
  questionHindi?: string;
  options: string[];
  optionsHindi?: string[];
  correctOptionIndex: number;
  skillTag: string; // The specific sub-skill being tested (e.g. CSS Flexbox, Typography, Electrical Safety)
  explanation?: string;
}

export interface IAssessment extends Document {
  title: string;
  titleHindi?: string;
  domain: 'web_development' | 'graphic_design' | 'practical_vocational';
  description: string;
  descriptionHindi?: string;
  estimatedMinutes: number;
  passingScore: number; // percentage, e.g. 60
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    questionHindi: { type: String, default: '' },
    options: { type: [String], required: true },
    optionsHindi: { type: [String], default: [] },
    correctOptionIndex: { type: Number, required: true },
    skillTag: { type: String, required: true },
    explanation: { type: String, default: '' }
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    titleHindi: { type: String, default: '' },
    domain: {
      type: String,
      enum: ['web_development', 'graphic_design', 'practical_vocational'],
      required: true
    },
    description: { type: String, required: true },
    descriptionHindi: { type: String, default: '' },
    estimatedMinutes: { type: Number, default: 15 },
    passingScore: { type: Number, default: 60 },
    questions: [QuestionSchema]
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
