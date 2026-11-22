"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemeSchema = exports.portfolioSchema = exports.applicationSchema = exports.opportunitySchema = exports.profileUpdateSchema = exports.loginSchema = exports.registerSchema = void 0;
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
const educationEntrySchema = zod_1.z.object({
    level: zod_1.z.string().trim().min(1, 'Qualification level is required'),
    degree: zod_1.z.string().trim().optional().default(''),
    specialization: zod_1.z.string().trim().optional().default(''),
    institution: zod_1.z.string().trim().optional().default(''),
    currentYearOrSemester: zod_1.z.string().trim().optional().default(''),
    expectedGraduationYear: zod_1.z.string().trim().optional().default(''),
    graduationYear: zod_1.z.string().trim().optional().default(''),
    classCompleted: zod_1.z.string().trim().optional().default(''),
    stream: zod_1.z.string().trim().optional().default(''),
    status: zod_1.z.string().trim().optional().default('')
});
const detailedSkillSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Skill name is required'),
    category: zod_1.z.string().trim().optional().default('General'),
    proficiency: zod_1.z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
    supportingTitle: zod_1.z.string().trim().optional().default(''),
    supportingUrl: zod_1.z.string().trim().optional().default('')
});
const experienceEntrySchema = zod_1.z.object({
    jobTitle: zod_1.z.string().trim().min(1, 'Job title is required'),
    organization: zod_1.z.string().trim().min(1, 'Organization is required'),
    employmentType: zod_1.z.string().trim().optional().default('Full-time'),
    startDate: zod_1.z.string().trim().optional().default(''),
    endDate: zod_1.z.string().trim().optional().default(''),
    isCurrent: zod_1.z.boolean().optional().default(false),
    responsibilities: zod_1.z.string().trim().optional().default(''),
    achievements: zod_1.z.string().trim().optional().default('')
});
const employmentPreferencesSchema = zod_1.z.object({
    jobTypes: zod_1.z.array(zod_1.z.string().trim()).optional(),
    workModes: zod_1.z.array(zod_1.z.string().trim()).optional(),
    preferredLocations: zod_1.z.array(zod_1.z.string().trim()).optional(),
    expectedSalary: zod_1.z.string().trim().optional(),
    availableHours: zod_1.z.string().trim().optional(),
    yearsOfExperience: zod_1.z.string().trim().optional(),
    availability: zod_1.z.string().trim().optional(),
    willingToRelocate: zod_1.z.boolean().optional()
});
exports.profileUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).optional(),
    fullName: zod_1.z.string().trim().min(2).optional(),
    avatar: zod_1.z.string().optional(),
    profilePicture: zod_1.z.string().optional(),
    seekerProfile: zod_1.z
        .object({
        headline: zod_1.z.string().optional(),
        bio: zod_1.z.string().max(1500).optional(),
        phone: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        accessibilityPreferences: zod_1.z.string().max(500).optional(),
        preferredLanguage: zod_1.z.string().optional(),
        location: zod_1.z
            .object({
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            country: zod_1.z.string().optional(),
            isRural: zod_1.z.boolean().optional()
        })
            .optional(),
        languages: zod_1.z.array(zod_1.z.string()).optional(),
        educationLevel: zod_1.z.string().optional(),
        education: zod_1.z.array(educationEntrySchema).optional(),
        qualifications: zod_1.z
            .array(zod_1.z.object({
            title: zod_1.z.string(),
            institute: zod_1.z.string().optional(),
            year: zod_1.z.string().optional()
        }))
            .optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        detailedSkills: zod_1.z.array(detailedSkillSchema).optional(),
        experienceLevel: zod_1.z.string().optional(),
        hasExperience: zod_1.z.boolean().optional(),
        experience: zod_1.z.array(experienceEntrySchema).optional(),
        careerGoals: zod_1.z.string().optional(),
        careerGoalsList: zod_1.z.array(zod_1.z.string()).optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        preferredWorkMode: zod_1.z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
        employmentPreferences: employmentPreferencesSchema.optional(),
        resumeUrl: zod_1.z.string().optional(),
        isCareerRestart: zod_1.z.boolean().optional(),
        onboardingCompleted: zod_1.z.boolean().optional(),
        onboardingSkipped: zod_1.z.boolean().optional()
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
