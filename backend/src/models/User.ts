import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'seeker' | 'employer' | 'admin';

export interface IEducationEntry {
  level: string;
  degree?: string;
  specialization?: string;
  institution?: string;
  schoolName?: string;
  board?: string;
  duration?: string;
  currentYear?: string;
  currentSemester?: string;
  currentYearOrSemester?: string;
  expectedGraduationYear?: string;
  graduationYear?: string;
  classCompleted?: string;
  stream?: string;
  status?: string;
  scoreType?: 'Percentage' | 'CGPA' | 'Grade' | '';
  percentage?: number | null;
  cgpa?: number | null;
  cgpaScale?: number | null;
  grade?: string;
  gradingSystem?: string;
}

export interface IDetailedSkill {
  name: string;
  category?: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  verified?: boolean;
  source: 'self_reported' | 'assessment_verified';
  supportingTitle?: string;
  supportingUrl?: string;
}

export interface IExperienceEntry {
  jobTitle: string;
  organization: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
  achievements?: string;
}

export interface IEmploymentPreferences {
  jobTypes?: string[];
  workModes?: string[];
  preferredLocations?: string[];
  expectedSalary?: string;
  availableHours?: string;
  yearsOfExperience?: string;
  availability?: string;
  willingToRelocate?: boolean;
}

export interface ISeekerProfile {
  headline?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  accessibilityPreferences?: string;
  preferredLanguage?: string;
  location?: {
    city: string;
    state: string;
    country?: string;
    isRural?: boolean;
  };
  languages?: string[];
  educationLevel?: string;
  education?: IEducationEntry[];
  qualifications?: Array<{
    title: string;
    institute?: string;
    year?: string;
  }>;
  skills?: string[];
  detailedSkills?: IDetailedSkill[];
  experienceLevel?: string;
  hasExperience?: boolean;
  experience?: IExperienceEntry[];
  careerGoals?: string;
  careerGoalsList?: string[];
  interests?: string[];
  preferredWorkMode?: 'remote' | 'hybrid' | 'onsite' | 'any';
  employmentPreferences?: IEmploymentPreferences;
  resumeUrl?: string;
  isCareerRestart?: boolean;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
  profileVisibility?: {
    discoverableByEmployers?: boolean;
    showResumeToEmployers?: boolean;
    showContactAfterShortlist?: boolean;
  };
}

export interface IEmployerProfile {
  companyName: string;
  industry: string;
  website?: string;
  companySize?: string;
  description?: string;
  verificationStatus:
    | 'pending'
    | 'under_review'
    | 'approved'
    | 'verified'
    | 'rejected'
    | 'additional_info_required'
    | 'suspended';
  onboardingCompleted?: boolean;
  verificationDocs?: {
    docType: string;
    docNumber: string;
    notes?: string;
    submittedAt: Date;
  };
  adminReviewNotes?: string;
  verifiedAt?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  fullName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  profilePicture?: string;
  emailVerified: boolean;
  profileCompletion: number;
  lastLogin?: Date;
  seekerProfile?: ISeekerProfile;
  employerProfile?: IEmployerProfile;
  savedOpportunities?: mongoose.Types.ObjectId[];
  savedSchemes?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    fullName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['seeker', 'employer', 'admin'],
      default: 'seeker',
      required: true
    },
    avatar: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    profileCompletion: { type: Number, default: 10, min: 0, max: 100 },
    lastLogin: { type: Date },
    seekerProfile: {
      headline: { type: String, default: '' },
      bio: { type: String, default: '' },
      phone: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      accessibilityPreferences: { type: String, default: '' },
      preferredLanguage: { type: String, default: 'English' },
      location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: 'India' },
        isRural: { type: Boolean, default: false }
      },
      languages: { type: [String], default: [] },
      educationLevel: { type: String, default: '' },
      education: [
        {
          level: { type: String, required: true },
          degree: { type: String, default: '' },
          specialization: { type: String, default: '' },
          institution: { type: String, default: '' },
          schoolName: { type: String, default: '' },
          board: { type: String, default: '' },
          duration: { type: String, default: '' },
          currentYear: { type: String, default: '' },
          currentSemester: { type: String, default: '' },
          currentYearOrSemester: { type: String, default: '' },
          expectedGraduationYear: { type: String, default: '' },
          graduationYear: { type: String, default: '' },
          classCompleted: { type: String, default: '' },
          stream: { type: String, default: '' },
          status: { type: String, default: '' },
          scoreType: {
            type: String,
            enum: ['Percentage', 'CGPA', 'Grade', ''],
            default: ''
          },
          percentage: { type: Number, min: 0, max: 100, default: null },
          cgpa: { type: Number, min: 0, default: null },
          cgpaScale: { type: Number, min: 1, default: null },
          grade: { type: String, default: '' },
          gradingSystem: { type: String, default: '' }
        }
      ],
      qualifications: [
        {
          title: { type: String, required: true },
          institute: { type: String, default: '' },
          year: { type: String, default: '' }
        }
      ],
      skills: { type: [String], default: [] },
      detailedSkills: [
        {
          name: { type: String, required: true, trim: true },
          category: { type: String, default: 'General' },
          proficiency: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner'
          },
          verified: { type: Boolean, default: false },
          source: {
            type: String,
            enum: ['self_reported', 'assessment_verified'],
            default: 'self_reported'
          },
          supportingTitle: { type: String, default: '' },
          supportingUrl: { type: String, default: '' }
        }
      ],
      experienceLevel: {
        type: String,
        default: ''
      },
      hasExperience: { type: Boolean, default: false },
      experience: [
        {
          jobTitle: { type: String, required: true, trim: true },
          organization: { type: String, required: true, trim: true },
          employmentType: { type: String, default: 'Full-time' },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          isCurrent: { type: Boolean, default: false },
          responsibilities: { type: String, default: '' },
          achievements: { type: String, default: '' }
        }
      ],
      careerGoals: { type: String, default: '' },
      careerGoalsList: { type: [String], default: [] },
      interests: { type: [String], default: [] },
      preferredWorkMode: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite', 'any'],
        default: 'any'
      },
      employmentPreferences: {
        jobTypes: { type: [String], default: [] },
        workModes: { type: [String], default: [] },
        preferredLocations: { type: [String], default: [] },
        expectedSalary: { type: String, default: '' },
        availableHours: { type: String, default: '' },
        yearsOfExperience: { type: String, default: '' },
        availability: { type: String, default: '' },
        willingToRelocate: { type: Boolean, default: false }
      },
      resumeUrl: { type: String, default: '' },
      isCareerRestart: { type: Boolean, default: false },
      onboardingCompleted: { type: Boolean, default: false },
      onboardingSkipped: { type: Boolean, default: false },
      profileVisibility: {
        discoverableByEmployers: { type: Boolean, default: true },
        showResumeToEmployers: { type: Boolean, default: false },
        showContactAfterShortlist: { type: Boolean, default: false }
      }
    },
    employerProfile: {
      companyName: { type: String, default: '' },
      industry: { type: String, default: 'General' },
      website: { type: String, default: '' },
      companySize: { type: String, default: '1-10' },
      description: { type: String, default: '' },
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
        default: 'pending'
      },
      onboardingCompleted: { type: Boolean, default: false },
      verificationDocs: {
        docType: { type: String, default: '' },
        docNumber: { type: String, default: '' },
        notes: { type: String, default: '' },
        submittedAt: { type: Date, default: Date.now }
      },
      adminReviewNotes: { type: String, default: '' },
      verifiedAt: { type: Date }
    },
    savedOpportunities: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Opportunity' }],
      default: []
    },
    savedSchemes: {
      type: [{ type: Schema.Types.ObjectId, ref: 'GovernmentScheme' }],
      default: []
    }
  },
  { timestamps: true }
);

// Keep name/fullName and avatar/profilePicture synchronized
UserSchema.pre('save', function () {
  if (this.name && (!this.fullName || this.isModified('name'))) {
    this.fullName = this.name;
  } else if (this.fullName && !this.name) {
    this.name = this.fullName;
  }

  if (this.isModified('profilePicture') && !this.isModified('avatar')) {
    this.avatar = this.profilePicture || '';
  } else if (this.isModified('avatar') && !this.isModified('profilePicture')) {
    this.profilePicture = this.avatar || '';
  } else if (this.avatar && !this.profilePicture) {
    this.profilePicture = this.avatar;
  } else if (this.profilePicture && !this.avatar) {
    this.avatar = this.profilePicture;
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
