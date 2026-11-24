export const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Non-binary',
  'Other',
  'Prefer not to say'
] as const;

export const EDUCATION_LEVELS = [
  'Below Class 10',
  'Class 10 completed',
  'Class 12 completed',
  'ITI',
  'Diploma',
  'Undergraduate student',
  'Graduate',
  'Postgraduate',
  'Doctorate',
  'Other qualifications'
] as const;

export const SCHOOL_EDUCATION_LEVELS = new Set([
  'Below Class 10',
  'Class 10 completed',
  'Class 12 completed'
]);

export const COLLEGE_STUDENT_LEVELS = new Set(['Undergraduate student']);

export const GRADUATE_EDUCATION_LEVELS = new Set([
  'ITI',
  'Diploma',
  'Graduate',
  'Postgraduate',
  'Doctorate'
]);

export const SUGGESTED_SKILLS: Record<string, string[]> = {
  Technical: [
    'Python',
    'Java',
    'SQL',
    'Web Development',
    'Data Analysis',
    'Machine Learning',
    'UI/UX Design',
    'Excel & Spreadsheets',
    'JavaScript',
    'React',
    'Cloud Basics',
    'Cybersecurity Basics'
  ],
  Professional: [
    'Communication',
    'Leadership',
    'Teamwork',
    'Project Management',
    'Problem Solving',
    'Public Speaking',
    'Time Management',
    'Client Coordination'
  ],
  Creative: [
    'Graphic Design',
    'Canva',
    'Video Editing',
    'Content Writing',
    'Photography',
    'Digital Marketing',
    'Social Media Management',
    'Copywriting'
  ],
  Other: [
    'Sales',
    'Customer Service',
    'Teaching',
    'Accounting',
    'Entrepreneurship',
    'Hindi Typing',
    'Data Entry',
    'Community Outreach'
  ]
};

export const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const CAREER_INTERESTS = [
  'Technology',
  'Business',
  'Healthcare',
  'Education',
  'Design',
  'Marketing',
  'Finance',
  'Government Jobs',
  'Engineering',
  'Hospitality',
  'Entrepreneurship',
  'Freelancing',
  'Creative Industries',
  'Skilled Trades',
  'Other'
] as const;

export const CAREER_GOALS = [
  'Find my first job',
  'Find an internship',
  'Switch careers',
  'Develop new skills',
  'Start freelancing',
  'Start a business',
  'Return to employment',
  'Prepare for government jobs'
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Freelance',
  'Contract',
  'Gig work',
  'Apprenticeship'
] as const;

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site'] as const;

export const PREFERRED_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Marathi',
  'Telugu',
  'Tamil',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Odia',
  'Assamese',
  'Urdu'
] as const;

export const AVAILABILITY_OPTIONS = [
  'Immediate',
  'Within 15 days',
  'Within 1 month',
  'Flexible / Future'
] as const;

export const YEARS_OF_EXPERIENCE_OPTIONS = [
  'Fresher / 0 years',
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '5+ years'
] as const;
