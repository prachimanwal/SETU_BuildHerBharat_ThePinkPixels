import mongoose, { Document, Schema } from 'mongoose';

export type ResumeTemplateId =
  | 'ats_professional'
  | 'modern_minimal'
  | 'student_fresher'
  | 'creative_professional';

export interface IResumeEducation {
  qualification: string;
  institution: string;
  degree?: string;
  specialization?: string;
  startYear?: string;
  graduationYear?: string;
  score?: string;
}

export interface IResumeSkill {
  name: string;
  category?: string;
  verified?: boolean;
  assessmentScore?: number | null;
}

export interface IResumeProject {
  title: string;
  description: string;
  technologies?: string[];
  projectType?: 'Individual' | 'Team';
  role?: string;
  duration?: string;
  skillsDemonstrated?: string[];
  projectLink?: string;
  githubLink?: string;
  attachmentLink?: string;
}

export interface IResumeExperience {
  jobTitle: string;
  companyName: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
  achievements?: string;
}

export interface IResumeCertification {
  name: string;
  organization: string;
  completionDate?: string;
  certificateLink?: string;
}

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  versionName: string;
  template: ResumeTemplateId;
  isDefault: boolean;
  status: 'draft' | 'ready';
  shareWithEmployers: boolean;
  sectionOrder: string[];
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
  careerObjective: {
    targetRole?: string;
    interests?: string;
    strongestSkills?: string;
    summary: string;
  };
  education: IResumeEducation[];
  skills: IResumeSkill[];
  hasProjects: boolean;
  projects: IResumeProject[];
  hasWorkExperience: boolean;
  workExperience: IResumeExperience[];
  certifications: IResumeCertification[];
  awards: string[];
  volunteering: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    versionName: { type: String, required: true, trim: true, default: 'My SETU Resume' },
    template: {
      type: String,
      enum: ['ats_professional', 'modern_minimal', 'student_fresher', 'creative_professional'],
      default: 'ats_professional'
    },
    isDefault: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'ready'],
      default: 'draft'
    },
    shareWithEmployers: { type: Boolean, default: false },
    sectionOrder: {
      type: [String],
      default: ['summary', 'education', 'skills', 'projects', 'experience', 'certifications']
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      githubUrl: { type: String, default: '' },
      portfolioUrl: { type: String, default: '' }
    },
    careerObjective: {
      targetRole: { type: String, default: '' },
      interests: { type: String, default: '' },
      strongestSkills: { type: String, default: '' },
      summary: { type: String, default: '' }
    },
    education: {
      type: [
        {
          qualification: { type: String, default: '' },
          institution: { type: String, default: '' },
          degree: { type: String, default: '' },
          specialization: { type: String, default: '' },
          startYear: { type: String, default: '' },
          graduationYear: { type: String, default: '' },
          score: { type: String, default: '' }
        }
      ],
      default: []
    },
    skills: {
      type: [
        {
          name: { type: String, required: true },
          category: { type: String, default: 'General' },
          verified: { type: Boolean, default: false },
          assessmentScore: { type: Number, default: null }
        }
      ],
      default: []
    },
    hasProjects: { type: Boolean, default: false },
    projects: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, default: '' },
          technologies: { type: [String], default: [] },
          projectType: { type: String, enum: ['Individual', 'Team'], default: 'Individual' },
          role: { type: String, default: '' },
          duration: { type: String, default: '' },
          skillsDemonstrated: { type: [String], default: [] },
          projectLink: { type: String, default: '' },
          githubLink: { type: String, default: '' },
          attachmentLink: { type: String, default: '' }
        }
      ],
      default: []
    },
    hasWorkExperience: { type: Boolean, default: false },
    workExperience: {
      type: [
        {
          jobTitle: { type: String, required: true },
          companyName: { type: String, required: true },
          employmentType: { type: String, default: 'Full-time' },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          isCurrent: { type: Boolean, default: false },
          responsibilities: { type: String, default: '' },
          achievements: { type: String, default: '' }
        }
      ],
      default: []
    },
    certifications: {
      type: [
        {
          name: { type: String, required: true },
          organization: { type: String, default: '' },
          completionDate: { type: String, default: '' },
          certificateLink: { type: String, default: '' }
        }
      ],
      default: []
    },
    awards: { type: [String], default: [] },
    volunteering: { type: [String], default: [] }
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1, updatedAt: -1 });

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
