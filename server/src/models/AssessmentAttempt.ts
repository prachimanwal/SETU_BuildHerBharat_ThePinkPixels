import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssessmentAttempt extends Document {
  userId: Types.ObjectId;
  assessmentId: Types.ObjectId;
  domain: string;
  answers: Array<{
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
    skillTag: string;
  }>;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  strengths: string[];
  gaps: Array<{
    skillTag: string;
    linkedResourceId?: Types.ObjectId;
    resourceTitle?: string;
  }>;
  completedAt: Date;
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    domain: { type: String, required: true },
    answers: [
      {
        questionId: { type: String, required: true },
        selectedOptionIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
        skillTag: { type: String, required: true }
      }
    ],
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    strengths: { type: [String], default: [] },
    gaps: [
      {
        skillTag: { type: String, required: true },
        linkedResourceId: { type: Schema.Types.ObjectId, ref: 'LearningResource' },
        resourceTitle: { type: String }
      }
    ],
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const AssessmentAttempt = mongoose.model<IAssessmentAttempt>(
  'AssessmentAttempt',
  AssessmentAttemptSchema
);
