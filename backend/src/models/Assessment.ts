import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  skillTested: string;
}

export type AssessmentCategory = 'Technical' | 'Professional' | 'Creative' | 'Aptitude';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  title: string;
  category: AssessmentCategory;
  domain: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillsEvaluated: string[];
  timed: boolean;
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
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['Technical', 'Professional', 'Creative', 'Aptitude'],
      default: 'Technical',
      index: true
    },
    domain: { type: String, required: true, index: true },
    description: { type: String, required: true },
    durationMinutes: { type: Number, default: 15 },
    passingScore: { type: Number, default: 70 },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    skillsEvaluated: { type: [String], default: [] },
    timed: { type: Boolean, default: true },
    questions: [QuestionSchema]
  },
  { timestamps: true }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
