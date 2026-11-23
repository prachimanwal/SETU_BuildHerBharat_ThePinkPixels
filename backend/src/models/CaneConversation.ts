import mongoose, { Document, Schema } from 'mongoose';

export type CaneLanguage = 'English' | 'Hindi' | 'Hinglish';
export type CaneMode =
  | 'general'
  | 'career_discovery'
  | 'job_search'
  | 'skill_gap'
  | 'roadmap'
  | 'resume'
  | 'interview'
  | 'schemes'
  | 'recruiter_general'
  | 'jd_writer'
  | 'hiring_criteria'
  | 'interview_questions'
  | 'candidate_summary'
  | 'candidate_compare'
  | 'skill_gap_explain'
  | 'outreach_message'
  | 'recruitment_strategy';

export interface ICaneConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  language: CaneLanguage;
  mode: CaneMode;
  useProfileContext: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CaneConversationSchema = new Schema<ICaneConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, default: 'New Career Chat', trim: true },
    language: {
      type: String,
      enum: ['English', 'Hindi', 'Hinglish'],
      default: 'English'
    },
    mode: {
      type: String,
      enum: [
        'general',
        'career_discovery',
        'job_search',
        'skill_gap',
        'roadmap',
        'resume',
        'interview',
        'schemes',
        'recruiter_general',
        'jd_writer',
        'hiring_criteria',
        'interview_questions',
        'candidate_summary',
        'candidate_compare',
        'skill_gap_explain',
        'outreach_message',
        'recruitment_strategy'
      ],
      default: 'general'
    },
    useProfileContext: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CaneConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export const CaneConversation = mongoose.model<ICaneConversation>(
  'CaneConversation',
  CaneConversationSchema,
  'caneconversations'
);
