"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.GENDER_OPTIONS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.GENDER_OPTIONS = [
    'Female',
    'Male',
    'Non-binary',
    'Other',
    'Prefer not to say'
];
const UserSchema = new mongoose_1.Schema({
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
    gender: {
        type: String,
        enum: ['', 'Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say'],
        default: ''
    },
    themePreference: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    tokenVersion: { type: Number, default: 0 },
    googleId: { type: String, default: '' },
    notificationPreferences: {
        jobApplicationUpdates: { type: Boolean, default: true },
        interviewNotifications: { type: Boolean, default: true },
        learningReminders: { type: Boolean, default: true },
        accountSecurityAlerts: { type: Boolean, default: true }
    },
    securityActivity: {
        type: [
            {
                action: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                ipAddress: { type: String, default: '' },
                userAgent: { type: String, default: '' }
            }
        ],
        default: []
    },
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
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Opportunity' }],
        default: []
    },
    savedSchemes: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'GovernmentScheme' }],
        default: []
    }
}, { timestamps: true });
// Keep name/fullName and avatar/profilePicture synchronized
UserSchema.pre('save', function () {
    if (this.name && (!this.fullName || this.isModified('name'))) {
        this.fullName = this.name;
    }
    else if (this.fullName && !this.name) {
        this.name = this.fullName;
    }
    if (this.isModified('profilePicture') && !this.isModified('avatar')) {
        this.avatar = this.profilePicture || '';
    }
    else if (this.isModified('avatar') && !this.isModified('profilePicture')) {
        this.profilePicture = this.avatar || '';
    }
    else if (this.avatar && !this.profilePicture) {
        this.profilePicture = this.avatar;
    }
    else if (this.profilePicture && !this.avatar) {
        this.avatar = this.profilePicture;
    }
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.passwordHash) {
        return false;
    }
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = mongoose_1.default.model('User', UserSchema);
