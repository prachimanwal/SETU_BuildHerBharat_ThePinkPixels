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
exports.GovernmentScheme = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GovernmentSchemeSchema = new mongoose_1.Schema({
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true },
    hindiTitle: { type: String, default: '' },
    ministry: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: [
            'skill_training',
            'entrepreneurship_loan',
            'women_livelihood',
            'rural_employment',
            'internship'
        ],
        required: true,
        index: true
    },
    targetAudience: { type: String, default: 'General' },
    description: { type: String, default: '' },
    benefitsSummary: { type: String, required: true },
    eligibilitySummary: { type: String, required: true },
    requiredDocuments: { type: [String], default: [] },
    applicationProcess: { type: String, default: '' },
    applicationStatus: {
        type: String,
        default: 'Ongoing — Verify current cycle on Official Portal'
    },
    officialUrl: { type: String, required: true, trim: true },
    applicationUrl: { type: String, default: '' },
    eligibilityRules: {
        minAge: { type: Number },
        maxAge: { type: Number },
        educationLevels: { type: [String], default: [] },
        studentFriendly: { type: Boolean, default: false },
        entrepreneurshipFocused: { type: Boolean, default: false },
        womenFocused: { type: Boolean, default: false },
        ruralFocused: { type: Boolean, default: false },
        states: { type: [String], default: [] },
        keywords: { type: [String], default: [] }
    },
    lastReviewedDate: { type: String, default: '2026-03-01' }
}, { timestamps: true });
GovernmentSchemeSchema.index({ title: 'text', ministry: 'text', benefitsSummary: 'text' });
exports.GovernmentScheme = mongoose_1.default.model('GovernmentScheme', GovernmentSchemeSchema);
