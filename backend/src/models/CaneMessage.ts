import mongoose, { Document, Schema } from 'mongoose';

export interface ICaneMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  feedback?: 'up' | 'down' | null;
  links?: Array<{ label: string; route: string; type?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const CaneMessageSchema = new Schema<ICaneMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'CaneConversation',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: { type: String, required: true },
    provider: { type: String, default: '' },
    feedback: {
      type: String,
      enum: ['up', 'down', null],
      default: null
    },
    links: {
      type: [
        {
          label: { type: String, required: true },
          route: { type: String, required: true },
          type: { type: String, default: 'internal' }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

CaneMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const CaneMessage = mongoose.model<ICaneMessage>(
  'CaneMessage',
  CaneMessageSchema,
  'canemessages'
);
