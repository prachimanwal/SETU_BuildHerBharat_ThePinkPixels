import mongoose, { Document, Schema } from 'mongoose';

export type EmployerVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'verified'
  | 'rejected'
  | 'additional_info_required'
  | 'suspended';

export function isEmployerVerified(status?: string): boolean {
  return status === 'approved' || status === 'verified';
}

export function formatVerificationLabel(status?: string): string {
  switch (status) {
    case 'approved':
    case 'verified':
      return 'Verified';
    case 'under_review':
      return 'Under Review';
    case 'rejected':
      return 'Rejected';
    case 'additional_info_required':
      return 'Additional Information Required';
    case 'suspended':
      return 'Suspended';
    default:
      return 'Pending';
  }
}

export interface IBusinessRepresentative {
  fullName: string;
  designation: string;
  workEmail: string;
  contactNumber: string;
  department: string;
  relationshipToCompany: string;
  authorizedToRecruit: boolean;
}

export interface IAuthorizedRecruiter {
  name: string;
  email: string;
  designation: string;
  department?: string;
  canPublishJobs?: boolean;
  addedAt?: Date;
}

export interface IVerificationAuditEntry {
  status: string;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: 'employer' | 'admin' | 'system';
  notes: string;
  timestamp: Date;
}

export interface IEmployer extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  registeredName?: string;
  publicName?: string;
  logoDataUrl?: string;
  industry: string;
  businessCategory?: string;
  legalStructure?: string;
  website?: string;
  linkedinUrl?: string;
  companySize?: string;
  yearEstablished?: number | null;
  description?: string;
  officialEmail?: string;
  contactNumber?: string;
  headquartersLocation?: {
    city: string;
    state: string;
    address?: string;
  };
  officeAddresses?: string[];
  benefits?: string[];
  cultureDescription?: string;
  achievements?: string[];
  authorizedRecruiters?: IAuthorizedRecruiter[];
  representative?: IBusinessRepresentative;
  isPublicProfileVisible?: boolean;
  notificationPreferences?: {
    newApplications: boolean;
    candidateResponses: boolean;
    interviewReminders: boolean;
    verificationUpdates: boolean;
    jobExpirationReminders: boolean;
    offerResponses: boolean;
  };
  onboardingCompleted?: boolean;
  onboardingSteps?: {
    companyInfo: boolean;
    representative: boolean;
    verification: boolean;
    hiringPreferences: boolean;
    completed: boolean;
  };
  completionPercentage?: number;
  verificationStatus: EmployerVerificationStatus;
  verificationDocs?: {
    docType: string;
    docNumber: string;
    notes?: string;
    submittedAt: Date;
  };
  adminReviewNotes?: string;
  verifiedAt?: Date;
  verificationAuditTrail?: IVerificationAuditEntry[];
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
    companyName: { type: String, required: true, trim: true },
    registeredName: { type: String, default: '', trim: true },
    publicName: { type: String, default: '', trim: true },
    logoDataUrl: { type: String, default: '' },
    industry: { type: String, default: 'General', trim: true },
    businessCategory: { type: String, default: '', trim: true },
    legalStructure: { type: String, default: 'Private Limited', trim: true },
    website: { type: String, default: '', trim: true },
    linkedinUrl: { type: String, default: '', trim: true },
    companySize: { type: String, default: '1-10', trim: true },
    yearEstablished: { type: Number, default: null },
    description: { type: String, default: '' },
    officialEmail: { type: String, default: '', trim: true },
    contactNumber: { type: String, default: '', trim: true },
    headquartersLocation: {
      city: { type: String, default: '', trim: true },
      state: { type: String, default: '', trim: true },
      address: { type: String, default: '', trim: true }
    },
    officeAddresses: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    cultureDescription: { type: String, default: '' },
    achievements: { type: [String], default: [] },
    authorizedRecruiters: [
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        designation: { type: String, default: 'Recruiter', trim: true },
        department: { type: String, default: 'Human Resources', trim: true },
        canPublishJobs: { type: Boolean, default: true },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    representative: {
      fullName: { type: String, default: '', trim: true },
      designation: { type: String, default: '', trim: true },
      workEmail: { type: String, default: '', trim: true },
      contactNumber: { type: String, default: '', trim: true },
      department: { type: String, default: '', trim: true },
      relationshipToCompany: { type: String, default: 'Authorized Representative', trim: true },
      authorizedToRecruit: { type: Boolean, default: false }
    },
    isPublicProfileVisible: { type: Boolean, default: true },
    notificationPreferences: {
      newApplications: { type: Boolean, default: true },
      candidateResponses: { type: Boolean, default: true },
      interviewReminders: { type: Boolean, default: true },
      verificationUpdates: { type: Boolean, default: true },
      jobExpirationReminders: { type: Boolean, default: true },
      offerResponses: { type: Boolean, default: true }
    },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSteps: {
      companyInfo: { type: Boolean, default: false },
      representative: { type: Boolean, default: false },
      verification: { type: Boolean, default: false },
      hiringPreferences: { type: Boolean, default: false },
      completed: { type: Boolean, default: false }
    },
    completionPercentage: { type: Number, default: 15, min: 0, max: 100 },
    verificationStatus: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'approved',
        'verified',
        'rejected',
        'additional_info_required',
        'suspended'
      ],
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
    verifiedAt: { type: Date },
    verificationAuditTrail: [
      {
        status: { type: String, required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        actorName: { type: String, required: true },
        actorRole: { type: String, enum: ['employer', 'admin', 'system'], required: true },
        notes: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Employer = mongoose.model<IEmployer>('Employer', EmployerSchema);
