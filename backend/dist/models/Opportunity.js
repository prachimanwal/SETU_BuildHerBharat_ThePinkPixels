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
exports.Opportunity = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OpportunitySchema = new mongoose_1.Schema({
    employerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employer',
        index: true
    },
    title: { type: String, required: true, trim: true },
    department: { type: String, default: 'General', trim: true },
    organisationName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    qualifications: { type: [String], default: [] },
    requiredSkills: { type: [String], required: true, index: true },
    location: {
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        isRuralFocus: { type: Boolean, default: false }
    },
    workMode: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite'],
        default: 'hybrid',
        required: true
    },
    opportunityType: {
        type: String,
        enum: [
            'job',
            'full_time',
            'part_time',
            'internship',
            'freelance',
            'contract',
            'apprenticeship',
            'entry_level',
            'entrepreneurship'
        ],
        default: 'job',
        required: true
    },
    stipendOrSalary: { type: String, default: 'Competitive' },
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    vacancies: { type: Number, default: 1, min: 1 },
    duration: { type: String, default: 'Full-Time' },
    experienceRequired: { type: String, default: 'Fresher / Entry-Level Welcome' },
    minEducationLevel: { type: String, default: '' },
    minAcademicPercentage: { type: Number, default: null },
    minCgpa: { type: Number, default: null },
    minCgpaScale: { type: Number, default: 10 },
    applicationDeadline: { type: String, default: '' },
    screeningQuestions: { type: [String], default: [] },
    externalApplyUrl: { type: String, default: '' },
    isCareerRestart: { type: Boolean, default: false, index: true },
    isSampleExample: { type: Boolean, default: false, index: true },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed', 'archived'],
        default: 'published',
        required: true,
        index: true
    },
    moderationStatus: {
        type: String,
        enum: ['clean', 'flagged', 'hidden'],
        default: 'clean',
        index: true
    },
    publishedAt: { type: Date },
    closedAt: { type: Date }
}, { timestamps: true });
OpportunitySchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });
exports.Opportunity = mongoose_1.default.model('Opportunity', OpportunitySchema);
