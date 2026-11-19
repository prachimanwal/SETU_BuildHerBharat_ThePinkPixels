import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  skillTested: string;
}

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  domain: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswerIndex: { type: Number, required: true, select: false },
    explanation: { type: String, required: true },
    skillTested: { type: String, required: true }
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    description: { type: String, required: true },
    durationMinutes: { type: Number, default: 20 },
    passingScore: { type: Number, default: 70 },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    questions: [QuestionSchema]
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
