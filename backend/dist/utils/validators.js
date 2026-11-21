"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemeSchema = exports.portfolioSchema = exports.applicationSchema = exports.opportunitySchema = exports.profileUpdateSchema = exports.googleAuthSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2, 'Name must be at least 2 characters long'),
    email: zod_1.z.string().trim().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    role: zod_1.z.enum(['seeker', 'employer'], {
        errorMap: () => ({ message: "Role must be 'seeker' or 'employer'" })
    })
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.googleAuthSchema = zod_1.z.object({
    credential: zod_1.z
        .string({ required_error: 'Google authentication credential is required' })
        .trim()
        .min(1, 'Google authentication credential is required')
});
exports.profileUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).optional(),
    avatar: zod_1.z.string().optional(),
    seekerProfile: zod_1.z
        .object({
        headline: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        location: zod_1.z
            .object({
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            isRural: zod_1.z.boolean().optional()
        })
            .optional(),
        languages: zod_1.z.array(zod_1.z.string()).optional(),
        educationLevel: zod_1.z.string().optional(),
        qualifications: zod_1.z
            .array(zod_1.z.object({
            title: zod_1.z.string(),
            institute: zod_1.z.string().optional(),
            year: zod_1.z.string().optional()
        }))
            .optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        experienceLevel: zod_1.z.string().optional(),
        careerGoals: zod_1.z.string().optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        preferredWorkMode: zod_1.z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
        resumeUrl: zod_1.z.string().optional(),
        isCareerRestart: zod_1.z.boolean().optional()
    })
        .optional(),
    employerProfile: zod_1.z
        .object({
        companyName: zod_1.z.string().optional(),
        industry: zod_1.z.string().optional(),
        website: zod_1.z.string().optional(),
        companySize: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        verificationDocs: zod_1.z
            .object({
            docType: zod_1.z.string().optional(),
            docNumber: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional()
        })
            .optional()
    })
        .optional()
});
exports.opportunitySchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title is required and must be at least 3 characters'),
    organisationName: zod_1.z.string().trim().optional(),
    description: zod_1.z.string().trim().min(10, 'Description must be at least 10 characters'),
    requiredSkills: zod_1.z.array(zod_1.z.string()).min(1, 'At least one required skill must be specified'),
    location: zod_1.z.object({
        city: zod_1.z.string().trim().default('Gurugram'),
        state: zod_1.z.string().trim().default('Haryana'),
        isRuralFocus: zod_1.z.boolean().default(false)
    }),
    workMode: zod_1.z.enum(['remote', 'hybrid', 'onsite']).default('hybrid'),
    opportunityType: zod_1.z.enum(['job', 'internship', 'freelance', 'apprenticeship']).default('job'),
    stipendOrSalary: zod_1.z.string().trim().default('Competitive / Market Standard'),
    duration: zod_1.z.string().trim().default('Full-Time'),
    isCareerRestart: zod_1.z.boolean().default(false)
});
exports.applicationSchema = zod_1.z.object({
    opportunityId: zod_1.z.string().min(1, 'Opportunity ID is required'),
    coverNote: zod_1.z.string().max(2000).optional().default('')
});
exports.portfolioSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().trim().min(10, 'Description must be at least 10 characters'),
    skills: zod_1.z.array(zod_1.z.string()).default([]),
    workSampleUrl: zod_1.z.string().trim().min(1, 'Work sample link is required'),
    category: zod_1.z.string().optional().default('Practical Deliverable'),
    source: zod_1.z.enum(['self_created', 'practice_assignment']).default('self_created'),
    featured: zod_1.z.boolean().default(false)
});
exports.schemeSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(3, 'Title is required'),
    hindiTitle: zod_1.z.string().trim().optional(),
    ministry: zod_1.z.string().trim().min(2, 'Ministry / Department is required'),
    category: zod_1.z.enum(['skill_training', 'entrepreneurship_loan', 'women_livelihood', 'rural_employment', 'internship']),
    targetAudience: zod_1.z.string().trim().default('Youth, Women, Rural Job Seekers'),
    benefitsSummary: zod_1.z.string().trim().min(10, 'Benefits summary is required'),
    eligibilitySummary: zod_1.z.string().trim().min(10, 'Eligibility summary is required'),
    officialUrl: zod_1.z.string().trim().url('Must be a valid URL')
});
