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
    employerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    organisationName: { type: String, required: true, trim: true },
    opportunityType: {
        type: String,
        enum: ['job', 'internship', 'apprenticeship', 'freelance', 'flexible_work'],
        required: true
    },
    workMode: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite'],
        required: true
    },
    location: { type: String, required: true },
    salaryOrStipend: { type: String, default: 'Competitive / Project Based' },
    requiredSkills: { type: [String], default: [] },
    experienceRequired: { type: String, default: 'None / Fresher friendly' },
    educationRequired: { type: String, default: 'No minimum requirement' },
    isCareerRestart: { type: Boolean, default: false },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'hidden_by_admin'],
        default: 'draft'
    },
    isExternal: { type: Boolean, default: false },
    externalApplyUrl: { type: String, default: '' },
    isDemoData: { type: Boolean, default: false }
}, { timestamps: true });
// Indexes for fast searching and filtering
OpportunitySchema.index({ status: 1, opportunityType: 1, workMode: 1, isCareerRestart: 1 });
OpportunitySchema.index({ title: 'text', description: 'text', organisationName: 'text' });
exports.Opportunity = mongoose_1.default.model('Opportunity', OpportunitySchema);
