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
exports.Application = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApplicationSchema = new mongoose_1.Schema({
    opportunityId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    seekerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
        type: String,
        enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
        default: 'Applied'
    },
    timeline: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            note: { type: String, default: '' },
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
        }
    ],
    interviewDetails: {
        date: { type: String, default: '' },
        time: { type: String, default: '' },
        instructions: { type: String, default: '' },
        meetLinkOrLocation: { type: String, default: '' }
    },
    portfolioProjectsSnapshot: [
        {
            title: { type: String },
            workSampleUrl: { type: String },
            skills: { type: [String] }
        }
    ],
    coverNote: { type: String, default: '' }
}, { timestamps: true });
// Prevent duplicate direct applications from same seeker to same opportunity
ApplicationSchema.index({ opportunityId: 1, seekerId: 1 }, { unique: true });
exports.Application = mongoose_1.default.model('Application', ApplicationSchema);
