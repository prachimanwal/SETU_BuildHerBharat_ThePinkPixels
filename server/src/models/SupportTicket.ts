import mongoose, { Document, Schema, Types } from 'mongoose';

export type TicketCategory =
  | 'workplace_safety_posh'
  | 'wage_payment_issue'
  | 'discrimination'
  | 'career_guidance'
  | 'general_support';

export type TicketStatus = 'open' | 'in_review' | 'resolved';

export interface ISupportTicket extends Document {
  userId?: Types.ObjectId;
  name: string;
  contactEmailOrPhone: string;
  category: TicketCategory;
  subject: string;
  message: string;
  isConfidential: boolean;
  status: TicketStatus;
  adminNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    contactEmailOrPhone: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'workplace_safety_posh',
        'wage_payment_issue',
        'discrimination',
        'career_guidance',
        'general_support'
      ],
      required: true
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    isConfidential: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open'
    },
    adminNotes: { type: String, default: '' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model<ISupportTicket>(
  'SupportTicket',
  SupportTicketSchema
);
