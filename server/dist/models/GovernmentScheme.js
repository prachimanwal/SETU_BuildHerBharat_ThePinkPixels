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
    title: { type: String, required: true, trim: true },
    hindiTitle: { type: String, default: '' },
    ministryOrDepartment: { type: String, required: true },
    targetAudience: {
        type: [String],
        enum: ['all', 'women', 'youth', 'rural', 'artisans', 'entrepreneurs'],
        default: ['all']
    },
    category: {
        type: String,
        enum: [
            'skill_training',
            'financial_assistance',
            'self_employment',
            'apprenticeship',
            'women_empowerment'
        ],
        required: true
    },
    benefitsSummary: { type: String, required: true },
    benefitsSummaryHindi: { type: String, default: '' },
    eligibilitySummary: { type: String, required: true },
    eligibilitySummaryHindi: { type: String, default: '' },
    officialUrl: { type: String, required: true },
    lastReviewedDate: { type: String, default: '2026-02-15' },
    isDemoData: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
GovernmentSchemeSchema.index({ category: 1, targetAudience: 1, isActive: 1 });
GovernmentSchemeSchema.index({ title: 'text', ministryOrDepartment: 'text' });
exports.GovernmentScheme = mongoose_1.default.model('GovernmentScheme', GovernmentSchemeSchema);
