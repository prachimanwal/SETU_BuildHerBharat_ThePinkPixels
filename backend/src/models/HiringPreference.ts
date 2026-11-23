import mongoose, { Document, Schema } from 'mongoose';

export type HiringEmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Internship'
  | 'Freelance'
  | 'Contract'
  | 'Remote';

export type WorkArrangementType = 'Remote' | 'Hybrid' | 'On-site';

export interface IHiringPreference extends Document {
  _id: mongoose.Types.ObjectId;
  employerId: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  jobTitle: string;
  department: string;
  vacancies: number;
  requiredEducation: string;
  requiredSkills: string[];
  experienceLevel: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryCurrency: string;
  jobLocation: string;
  employmentType: HiringEmploymentType;
  workArrangement: WorkArrangementType;
  preferredJoiningDate?: string;
  requiredCertifications: string[];
  interviewProcess: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HiringPreferenceSchema = new Schema<IHiringPreference>(
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
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, default: 'General', trim: true },
    vacancies: { type: Number, default: 1, min: 1 },
    requiredEducation: { type: String, default: 'Any Graduate / Relevant Skills', trim: true },
    requiredSkills: { type: [String], default: [] },
    experienceLevel: { type: String, default: 'Entry-level / Fresher', trim: true },
    minSalary: { type: Number, default: null, min: 0 },
    maxSalary: { type: Number, default: null, min: 0 },
    salaryCurrency: { type: String, default: 'INR' },
    jobLocation: { type: String, default: 'Pan-India', trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract', 'Remote'],
      default: 'Full-time'
    },
    workArrangement: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Hybrid'
    },
    preferredJoiningDate: { type: String, default: '', trim: true },
    requiredCertifications: { type: [String], default: [] },
    interviewProcess: { type: String, default: 'Screening -> Technical/Skill Round -> HR Discussion' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const HiringPreference = mongoose.model<IHiringPreference>(
  'HiringPreference',
  HiringPreferenceSchema,
  'hiringpreferences'
);
