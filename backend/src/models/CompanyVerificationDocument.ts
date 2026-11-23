import mongoose, { Document, Schema } from 'mongoose';

export type VerificationDocStatus =
  | 'Pending'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Additional Information Required';

export interface ICompanyVerificationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  documentType: string;
  documentNumber?: string;
  notes?: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  fileData: Buffer;
  status: VerificationDocStatus;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  replacedDocumentId?: mongoose.Types.ObjectId;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyVerificationDocumentSchema = new Schema<ICompanyVerificationDocument>(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Employer',
      index: true
    },
    documentType: { type: String, required: true, trim: true },
    documentNumber: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    originalFilename: { type: String, required: true, trim: true },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    },
    sizeBytes: { type: Number, required: true },
    // Strictly hidden from default queries; streamed only via RBAC-checked file endpoints
    fileData: { type: Buffer, required: true, select: false },
    status: {
      type: String,
      enum: [
        'Pending',
        'Under Review',
        'Verified',
        'Rejected',
        'Additional Information Required'
      ],
      default: 'Under Review',
      index: true
    },
    rejectionReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    replacedDocumentId: { type: Schema.Types.ObjectId, ref: 'CompanyVerificationDocument' },
    isCurrent: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const CompanyVerificationDocument = mongoose.model<ICompanyVerificationDocument>(
  'CompanyVerificationDocument',
  CompanyVerificationDocumentSchema,
  'companyverificationdocuments'
);
