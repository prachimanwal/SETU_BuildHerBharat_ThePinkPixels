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
const TutorialStepSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    codeOrExample: { type: String, default: '' }
}, { _id: false });
const KnowledgeCheckSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answerIndex: { type: Number, required: true },
    explanation: { type: String, required: true }
}, { _id: false });
const LearningPathStepSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    summary: { type: String, required: true },
    duration: { type: String, default: '1 week' }
}, { _id: false });
const LearningResourceSchema = new mongoose_1.Schema({
    slug: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    duration: { type: String, default: '30 mins' },
    type: {
        type: String,
        enum: ['tutorial', 'practical_assignment', 'learning_path', 'course'],
        default: 'tutorial',
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: [
            'Programming',
            'Data and AI',
            'Business',
            'Creative',
            'Professional Development'
        ],
        default: 'Programming',
        index: true
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    skillTag: { type: String, required: true, index: true },
    skillsGained: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    contentUrl: { type: String, required: true },
    contentSourceLabel: { type: String, default: 'Official Documentation' },
    assignmentBrief: { type: String, default: '' },
    targetAudience: { type: String, default: 'General' },
    tutorialContent: {
        overview: { type: String, default: '' },
        steps: { type: [TutorialStepSchema], default: [] },
        exercises: { type: [String], default: [] },
        knowledgeChecks: { type: [KnowledgeCheckSchema], default: [] }
    },
    assignmentDetails: {
        objective: { type: String, default: '' },
        instructions: { type: [String], default: [] },
        deliverables: { type: [String], default: [] },
        submissionRequirements: { type: String, default: '' },
        evaluationCriteria: { type: [String], default: [] }
    },
    learningPathSteps: { type: [LearningPathStepSchema], default: [] }
}, { timestamps: true });
exports.LearningResource = mongoose_1.default.model('LearningResource', LearningResourceSchema);
