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

const nullableNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? val : num;
  },
  z.number().nullable().optional()
);

const educationEntrySchema = z
  .object({
    level: z.string().trim().min(1, 'Qualification level is required'),
    degree: z.string().trim().optional().default(''),
    specialization: z.string().trim().optional().default(''),
    institution: z.string().trim().optional().default(''),
    schoolName: z.string().trim().optional().default(''),
    board: z.string().trim().optional().default(''),
    duration: z.string().trim().optional().default(''),
    currentYear: z.string().trim().optional().default(''),
    currentSemester: z.string().trim().optional().default(''),
    currentYearOrSemester: z.string().trim().optional().default(''),
    expectedGraduationYear: z.string().trim().optional().default(''),
    graduationYear: z.string().trim().optional().default(''),
    classCompleted: z.string().trim().optional().default(''),
    stream: z.string().trim().optional().default(''),
    status: z.string().trim().optional().default(''),
    scoreType: z.enum(['Percentage', 'CGPA', 'Grade', '']).optional().default(''),
    percentage: nullableNumber,
    cgpa: nullableNumber,
    cgpaScale: nullableNumber,
    grade: z.string().trim().optional().default(''),
    gradingSystem: z.string().trim().optional().default('')
  })
  .superRefine((ed, ctx) => {
    if (ed.scoreType === 'Percentage' && ed.percentage !== null && ed.percentage !== undefined) {
      if (ed.percentage < 0 || ed.percentage > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['percentage'],
          message: 'Percentage must be between 0 and 100'
        });
      }
    }
    if (ed.scoreType === 'CGPA') {
      const scale = ed.cgpaScale ?? 10;
      if (scale <= 0 || scale > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cgpaScale'],
          message: 'CGPA scale must be a positive number'
        });
      }
      if (ed.cgpa !== null && ed.cgpa !== undefined && (ed.cgpa < 0 || ed.cgpa > scale)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cgpa'],
          message: `CGPA must be between 0 and ${scale}`
        });
      }
    }
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
      onboardingSkipped: z.boolean().optional(),
      profileVisibility: z
        .object({
          discoverableByEmployers: z.boolean().optional(),
          showResumeToEmployers: z.boolean().optional(),
          showContactAfterShortlist: z.boolean().optional()
        })
        .optional()
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

const locationPreprocessor = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const parts = val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        city: parts[0] || 'Pan-India',
        state: parts[1] || 'India',
        isRuralFocus: false
      };
    }
    return val;
  },
  z.object({
    city: z.string().trim().min(1).default('Pan-India'),
    state: z.string().trim().default('India'),
    isRuralFocus: z.boolean().default(false)
  })
);

export const opportunitySchema = z.object({
  title: z.string().trim().min(3, 'Title is required and must be at least 3 characters'),
  department: z.string().trim().optional().default('General'),
  organisationName: z.string().trim().optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  responsibilities: z.array(z.string().trim()).optional().default([]),
  qualifications: z.array(z.string().trim()).optional().default([]),
  requiredSkills: z.array(z.string().trim().min(1)).min(1, 'At least one required skill must be specified'),
  location: locationPreprocessor.default({ city: 'Pan-India', state: 'India', isRuralFocus: false }),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).default('hybrid'),
  opportunityType: z
    .enum([
      'job',
      'full_time',
      'part_time',
      'internship',
      'freelance',
      'contract',
      'apprenticeship',
      'entry_level',
      'entrepreneurship'
    ])
    .default('job'),
  stipendOrSalary: z.string().trim().optional().default('Competitive / Market Standard'),
  salaryOrStipend: z.string().trim().optional(),
  salaryMin: nullableNumber,
  salaryMax: nullableNumber,
  vacancies: z.coerce.number().int().min(1).max(5000).optional().default(1),
  duration: z.string().trim().optional().default('Full-Time'),
  experienceRequired: z.string().trim().optional().default('Fresher / Entry-Level Welcome'),
  minEducationLevel: z.string().trim().optional().default(''),
  educationRequired: z.string().trim().optional(),
  applicationDeadline: z.string().trim().optional().default(''),
  screeningQuestions: z.array(z.string().trim()).optional().default([]),
  isCareerRestart: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published', 'closed', 'archived']).optional()
});

export const applicationSchema = z.object({
  opportunityId: z.string().min(1, 'Opportunity ID is required'),
  coverNote: z.string().max(2000).optional().default(''),
  screeningAnswers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string()
      })
    )
    .optional()
    .default([])
});

export const hiringPreferenceSchema = z.object({
  jobTitle: z.string().trim().min(2, 'Job title is required'),
  department: z.string().trim().optional().default('General'),
  vacancies: z.coerce.number().int().min(1).max(5000).default(1),
  requiredEducation: z.string().trim().optional().default('Any Graduate / Relevant Skills'),
  requiredSkills: z.array(z.string().trim()).optional().default([]),
  experienceLevel: z.string().trim().optional().default('Entry-level / Fresher'),
  minSalary: nullableNumber,
  maxSalary: nullableNumber,
  salaryCurrency: z.string().trim().optional().default('INR'),
  jobLocation: z.string().trim().optional().default('Pan-India'),
  employmentType: z
    .enum(['Full-time', 'Part-time', 'Internship', 'Freelance', 'Contract', 'Remote'])
    .default('Full-time'),
  workArrangement: z.enum(['Remote', 'Hybrid', 'On-site']).default('Hybrid'),
  preferredJoiningDate: z.string().trim().optional().default(''),
  requiredCertifications: z.array(z.string().trim()).optional().default([]),
  interviewProcess: z
    .string()
    .trim()
    .optional()
    .default('Screening -> Technical/Skill Round -> HR Discussion'),
  isActive: z.boolean().optional().default(true)
});

export const interviewSchema = z.object({
  applicationId: z.string().optional(),
  opportunityId: z.string().min(1, 'Job position is required'),
  candidateId: z.string().min(1, 'Candidate is required'),
  scheduledDate: z.string().min(4, 'Interview date is required'),
  scheduledTime: z.string().min(2, 'Interview time is required'),
  durationMinutes: z.coerce.number().int().min(10).max(480).optional().default(45),
  mode: z.enum(['Online', 'Offline', 'Telephone']).default('Online'),
  meetingLinkOrLocation: z.string().trim().optional().default(''),
  interviewerName: z.string().trim().min(2, 'Interviewer name is required'),
  interviewerEmail: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
  feedback: z.string().trim().optional().default(''),
  rating: nullableNumber,
  status: z
    .enum(['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'])
    .optional()
    .default('Scheduled')
});

export const portfolioSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  skills: z.array(z.string()).default([]),
  technologies: z.array(z.string()).optional().default([]),
  projectType: z.enum(['Individual', 'Team']).optional().default('Individual'),
  role: z.string().trim().optional().default(''),
  duration: z.string().trim().optional().default(''),
  workSampleUrl: z.string().trim().optional().default(''),
  githubUrl: z.string().trim().optional().default(''),
  documentUrl: z.string().trim().optional().default(''),
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
