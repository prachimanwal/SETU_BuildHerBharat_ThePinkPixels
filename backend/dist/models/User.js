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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
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
    googleId: { type: String, sparse: true },
    seekerProfile: {
        headline: { type: String, default: '' },
        phone: { type: String, default: '' },
        location: {
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            isRural: { type: Boolean, default: false }
        },
        languages: { type: [String], default: ['Hindi', 'English'] },
        educationLevel: { type: String, default: 'No formal degree' },
        qualifications: [
            {
                title: { type: String, required: true },
                institute: { type: String, default: '' },
                year: { type: String, default: '' }
            }
        ],
        skills: { type: [String], default: [] },
        experienceLevel: {
            type: String,
            default: 'No previous experience / Fresher'
        },
        careerGoals: { type: String, default: '' },
        interests: { type: [String], default: [] },
        preferredWorkMode: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite', 'any'],
            default: 'any'
        },
        resumeUrl: { type: String, default: '' },
        isCareerRestart: { type: Boolean, default: false }
    },
    employerProfile: {
        companyName: { type: String, default: '' },
        industry: { type: String, default: 'General' },
        website: { type: String, default: '' },
        companySize: { type: String, default: '1-10' },
        description: { type: String, default: '' },
        verificationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'suspended'],
            default: 'pending'
        },
        verificationDocs: {
            docType: { type: String, default: '' },
            docNumber: { type: String, default: '' },
            notes: { type: String, default: '' },
            submittedAt: { type: Date, default: Date.now }
        },
        adminReviewNotes: { type: String, default: '' },
        verifiedAt: { type: Date }
    }
}, { timestamps: true });
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = mongoose_1.default.model('User', UserSchema);
