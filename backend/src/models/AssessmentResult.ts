import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessmentResult extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  domain: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
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
    domain: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
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
