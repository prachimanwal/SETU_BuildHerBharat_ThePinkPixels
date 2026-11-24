import mongoose, { Document, Schema } from 'mongoose';

export interface IExtractedResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  education: Array<{
    level: string;
    degree?: string;
    institution?: string;
    graduationYear?: string;
    score?: string;
  }>;
  skills: string[];
  projects: Array<{ title: string; description: string }>;
  workExperience: Array<{ jobTitle: string; organization: string; duration?: string }>;
  internships: Array<{ role: string; organization: string; duration?: string }>;
  certifications: string[];
  achievements: string[];
  careerInterests: string[];
}

export interface IUploadedResumeFile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  fileData: Buffer;
  extractedText: string;
  extractedData: IExtractedResumeData;
  confirmedByUser: boolean;
  shareWithEmployers: boolean;
  parseStatus: 'processing' | 'completed' | 'failed';
  parseWarning?: string;
  parseError?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedResumeFileSchema = new Schema<IUploadedResumeFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    versionNumber: { type: Number, default: 1, min: 1 },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    fileData: { type: Buffer, required: true, select: false },
    extractedText: { type: String, default: '', select: false },
    extractedData: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      education: { type: Schema.Types.Mixed, default: [] },
      skills: { type: [String], default: [] },
      projects: { type: Schema.Types.Mixed, default: [] },
      workExperience: { type: Schema.Types.Mixed, default: [] },
      internships: { type: Schema.Types.Mixed, default: [] },
      certifications: { type: [String], default: [] },
      achievements: { type: [String], default: [] },
      careerInterests: { type: [String], default: [] }
    },
    confirmedByUser: { type: Boolean, default: false },
    shareWithEmployers: { type: Boolean, default: false },
    parseStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed'
    },
    parseWarning: { type: String, default: '' },
    parseError: { type: String, default: '' },
    idempotencyKey: { type: String, default: '', index: true }
  },
  { timestamps: true }
);

export const UploadedResumeFile = mongoose.model<IUploadedResumeFile>(
  'UploadedResumeFile',
  UploadedResumeFileSchema,
  'resumeversions'
);
