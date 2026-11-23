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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employer = void 0;
exports.isEmployerVerified = isEmployerVerified;
exports.formatVerificationLabel = formatVerificationLabel;
const mongoose_1 = __importStar(require("mongoose"));
function isEmployerVerified(status) {
    return status === 'approved' || status === 'verified';
}
function formatVerificationLabel(status) {
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
const EmployerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            actorName: { type: String, required: true },
            actorRole: { type: String, enum: ['employer', 'admin', 'system'], required: true },
            notes: { type: String, default: '' },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });
exports.Employer = mongoose_1.default.model('Employer', EmployerSchema);
