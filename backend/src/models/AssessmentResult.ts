import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessmentResult extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  assessmentTitle?: string;
  category?: string;
  domain: string;
  score: number;
  correctCount?: number;
  incorrectCount?: number;
  totalQuestions?: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  badgeAwarded?: boolean;
  verifiedSkillsAwarded?: string[];
  strengths: string[];
  gaps: string[];
  answers: Record<string, number>;
  completedAt: Date;
}

const AssessmentResultSchema = new Schema<IAssessmentResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true
    },
    assessmentTitle: { type: String, default: '' },
    category: { type: String, default: '' },
    domain: { type: String, required: true },
    score: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    badgeAwarded: { type: Boolean, default: false },
    verifiedSkillsAwarded: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    answers: { type: Map, of: Number, default: {} },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AssessmentResultSchema.index({ userId: 1, assessmentId: 1, completedAt: -1 });

export const AssessmentResult = mongoose.model<IAssessmentResult>(
  'AssessmentResult',
  AssessmentResultSchema
);
