import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployer extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  industry: string;
  website?: string;
  companySize?: string;
  description?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  verificationDocs?: {
    docType: string;
    docNumber: string;
    notes?: string;
    submittedAt: Date;
  };
  adminReviewNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerSchema = new Schema<IEmployer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    companyName: { type: String, required: true },
    industry: { type: String, default: 'General' },
    website: { type: String, default: '' },
    companySize: { type: String, default: '1-10' },
    description: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true
    },
    verificationDocs: {
      docType: { type: String, default: '' },
      docNumber: { type: String, default: '' },
      notes: { type: String, default: '' },
      submittedAt: { type: Date, default: Date.now }
    },
    adminReviewNotes: { type: String, default: '' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

export const Employer = mongoose.model<IEmployer>('Employer', EmployerSchema);
