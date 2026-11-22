import mongoose, { Document, Schema } from 'mongoose';

export type LearningResourceType =
  | 'tutorial'
  | 'practical_assignment'
  | 'learning_path'
  | 'course';

export type LearningCategory =
  | 'Programming'
  | 'Data and AI'
  | 'Business'
  | 'Creative'
  | 'Professional Development';

export interface ITutorialStep {
  title: string;
  content: string;
  codeOrExample?: string;
}

export interface IKnowledgeCheck {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ITutorialContent {
  overview: string;
  steps: ITutorialStep[];
  exercises: string[];
  knowledgeChecks: IKnowledgeCheck[];
}

export interface IAssignmentDetails {
  objective: string;
  instructions: string[];
  deliverables: string[];
  submissionRequirements: string;
  evaluationCriteria: string[];
}

export interface ILearningPathStep {
  title: string;
  summary: string;
  duration: string;
}

export interface ILearningResource extends Document {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  title: string;
  description: string;
  duration: string;
  type: LearningResourceType;
  category: LearningCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillTag: string;
  skillsGained: string[];
  learningObjectives: string[];
  contentUrl: string;
  contentSourceLabel?: string;
  assignmentBrief?: string;
  targetAudience?: string;
  tutorialContent?: ITutorialContent;
  assignmentDetails?: IAssignmentDetails;
  learningPathSteps?: ILearningPathStep[];
  createdAt: Date;
  updatedAt: Date;
}

const TutorialStepSchema = new Schema<ITutorialStep>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    codeOrExample: { type: String, default: '' }
  },
  { _id: false }
);

const KnowledgeCheckSchema = new Schema<IKnowledgeCheck>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answerIndex: { type: Number, required: true },
    explanation: { type: String, required: true }
  },
  { _id: false }
);

const LearningPathStepSchema = new Schema<ILearningPathStep>(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    duration: { type: String, default: '1 week' }
  },
  { _id: false }
);

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    duration: { type: String, default: '30 mins' },
    type: {
      type: String,
      enum: ['tutorial', 'practical_assignment', 'learning_path', 'course'],
      default: 'tutorial',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        'Programming',
        'Data and AI',
        'Business',
        'Creative',
        'Professional Development'
      ],
      default: 'Programming',
      index: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    skillTag: { type: String, required: true, index: true },
    skillsGained: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    contentUrl: { type: String, required: true },
    contentSourceLabel: { type: String, default: 'Official Documentation' },
    assignmentBrief: { type: String, default: '' },
    targetAudience: { type: String, default: 'General' },
    tutorialContent: {
      overview: { type: String, default: '' },
      steps: { type: [TutorialStepSchema], default: [] },
      exercises: { type: [String], default: [] },
      knowledgeChecks: { type: [KnowledgeCheckSchema], default: [] }
    },
    assignmentDetails: {
      objective: { type: String, default: '' },
      instructions: { type: [String], default: [] },
      deliverables: { type: [String], default: [] },
      submissionRequirements: { type: String, default: '' },
      evaluationCriteria: { type: [String], default: [] }
    },
    learningPathSteps: { type: [LearningPathStepSchema], default: [] }
  },
  { timestamps: true }
);

export const LearningResource = mongoose.model<ILearningResource>(
  'LearningResource',
  LearningResourceSchema
);
