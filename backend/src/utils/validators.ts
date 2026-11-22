import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['seeker', 'employer'], {
    errorMap: () => ({ message: "Role must be 'seeker' or 'employer'" })
  })
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const educationEntrySchema = z.object({
  level: z.string().trim().min(1, 'Qualification level is required'),
  degree: z.string().trim().optional().default(''),
  specialization: z.string().trim().optional().default(''),
  institution: z.string().trim().optional().default(''),
  currentYearOrSemester: z.string().trim().optional().default(''),
  expectedGraduationYear: z.string().trim().optional().default(''),
  graduationYear: z.string().trim().optional().default(''),
  classCompleted: z.string().trim().optional().default(''),
  stream: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('')
});

const detailedSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required'),
  category: z.string().trim().optional().default('General'),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
  supportingTitle: z.string().trim().optional().default(''),
  supportingUrl: z.string().trim().optional().default('')
});

const experienceEntrySchema = z.object({
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  organization: z.string().trim().min(1, 'Organization is required'),
  employmentType: z.string().trim().optional().default('Full-time'),
  startDate: z.string().trim().optional().default(''),
  endDate: z.string().trim().optional().default(''),
  isCurrent: z.boolean().optional().default(false),
  responsibilities: z.string().trim().optional().default(''),
  achievements: z.string().trim().optional().default('')
});

const employmentPreferencesSchema = z.object({
  jobTypes: z.array(z.string().trim()).optional(),
  workModes: z.array(z.string().trim()).optional(),
  preferredLocations: z.array(z.string().trim()).optional(),
  expectedSalary: z.string().trim().optional(),
  availableHours: z.string().trim().optional(),
  yearsOfExperience: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  willingToRelocate: z.boolean().optional()
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  fullName: z.string().trim().min(2).optional(),
  avatar: z.string().optional(),
  profilePicture: z.string().optional(),
  seekerProfile: z
    .object({
      headline: z.string().optional(),
      bio: z.string().max(1500).optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      accessibilityPreferences: z.string().max(500).optional(),
      preferredLanguage: z.string().optional(),
      location: z
        .object({
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          isRural: z.boolean().optional()
        })
        .optional(),
      languages: z.array(z.string()).optional(),
      educationLevel: z.string().optional(),
      education: z.array(educationEntrySchema).optional(),
      qualifications: z
        .array(
          z.object({
            title: z.string(),
            institute: z.string().optional(),
            year: z.string().optional()
          })
        )
        .optional(),
      skills: z.array(z.string()).optional(),
      detailedSkills: z.array(detailedSkillSchema).optional(),
      experienceLevel: z.string().optional(),
      hasExperience: z.boolean().optional(),
      experience: z.array(experienceEntrySchema).optional(),
      careerGoals: z.string().optional(),
      careerGoalsList: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      preferredWorkMode: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
      employmentPreferences: employmentPreferencesSchema.optional(),
      resumeUrl: z.string().optional(),
      isCareerRestart: z.boolean().optional(),
      onboardingCompleted: z.boolean().optional(),
      onboardingSkipped: z.boolean().optional()
    })
    .optional(),
  employerProfile: z
    .object({
      companyName: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      companySize: z.string().optional(),
      description: z.string().optional(),
      verificationDocs: z
        .object({
          docType: z.string().optional(),
          docNumber: z.string().optional(),
          notes: z.string().optional()
        })
        .optional()
    })
    .optional()
});

export const opportunitySchema = z.object({
  title: z.string().trim().min(3, 'Title is required and must be at least 3 characters'),
  organisationName: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill must be specified'),
  location: z.object({
    city: z.string().trim().default('Gurugram'),
    state: z.string().trim().default('Haryana'),
    isRuralFocus: z.boolean().default(false)
  }),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).default('hybrid'),
  opportunityType: z.enum(['job', 'internship', 'freelance', 'apprenticeship']).default('job'),
  stipendOrSalary: z.string().trim().default('Competitive / Market Standard'),
  duration: z.string().trim().default('Full-Time'),
  isCareerRestart: z.boolean().default(false)
});

export const applicationSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  coverNote: z.string().max(2000).optional().default('')
});

export const portfolioSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  skills: z.array(z.string()).default([]),
  workSampleUrl: z.string().trim().min(1, 'Work sample link is required'),
  category: z.string().optional().default('Practical Deliverable'),
  source: z.enum(['self_created', 'practice_assignment']).default('self_created'),
  featured: z.boolean().default(false)
});

export const schemeSchema = z.object({
  title: z.string().trim().min(3, 'Title is required'),
  hindiTitle: z.string().trim().optional(),
  ministry: z.string().trim().min(2, 'Ministry / Department is required'),
  category: z.enum(['skill_training', 'entrepreneurship_loan', 'women_livelihood', 'rural_employment', 'internship']),
  targetAudience: z.string().trim().default('Youth, Women, Rural Job Seekers'),
  benefitsSummary: z.string().trim().min(10, 'Benefits summary is required'),
  eligibilitySummary: z.string().trim().min(10, 'Eligibility summary is required'),
  officialUrl: z.string().trim().url('Must be a valid URL')
});
