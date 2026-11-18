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
exports.LearningResource = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LearningResourceSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    titleHindi: { type: String, default: '' },
    domain: {
        type: String,
        enum: ['web_development', 'graphic_design', 'practical_vocational', 'build_her_refresher'],
        required: true
    },
    type: {
        type: String,
        enum: ['tutorial', 'practical_assignment', 'refresher'],
        required: true
    },
    skillTag: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    summary: { type: String, required: true },
    summaryHindi: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    contentMarkdown: { type: String, required: true },
    assignmentBrief: { type: String, default: '' },
    assignmentBriefHindi: { type: String, default: '' },
    sampleDeliverable: { type: String, default: '' }
}, { timestamps: true });
exports.LearningResource = mongoose_1.default.model('LearningResource', LearningResourceSchema);
