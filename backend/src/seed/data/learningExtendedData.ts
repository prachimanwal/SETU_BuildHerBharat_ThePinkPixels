import type { SeedLearningResource } from './learningData';

export const EXTENDED_LEARNING_CATALOG: SeedLearningResource[] = [
  // ==================== CAREER PREP, INTERVIEW & RESUME (8) ====================
  {
    slug: 'tutorial-ats-resume-mastery',
    title: 'ATS-Friendly Resume Writing for Students & Freshers',
    description:
      'Build a clean, recruiter-scannable 1-page resume that passes Applicant Tracking Systems and highlights projects, education scores, and verified skills.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Resume Writing',
    skillsGained: ['Resume Writing', 'Career Preparation'],
    learningObjectives: [
      'Structure standard ATS-readable sections without complex tables or graphics',
      'Rewrite passive duties into action-verb + metric impact bullets',
      'Tailor skills and keywords honestly to each job description'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'National Career Service (NCS) Career Guidance',
    targetAudience: 'Students, Freshers, Job Seekers',
    tutorialContent: {
      overview:
        'Most employers review resumes in under 15 seconds or scan them with ATS software first. Clear section headings, measurable bullet points, and honest alignment with role keywords dramatically increase interview callbacks.',
      steps: [
        {
          title: '1. Clean 1-Page ATS Structure',
          content:
            'Use standard section names: Contact Details, Summary (2 lines), Education (with Percentage/CGPA), Verified Skills, Projects/Experience, and Certifications. Save as `FirstName_LastName_Role_Resume.pdf`.'
        },
        {
          title: '2. Action Verb + Tool + Measurable Outcome Formula',
          content:
            'Transform vague lines like "Helped with Excel" into "Automated weekly inventory tracking in Excel using SUMIFS and Pivot Tables, saving 3 hours per week."'
        }
      ],
      exercises: [
        'Rewrite 3 bullets from your current resume using the Action Verb + Tool + Result formula.',
        'Compare your resume against 1 target job posting and verify your top 5 honest matching skills appear near the top.'
      ],
      knowledgeChecks: [
        {
          question: 'Which filename is best when submitting your resume to an employer?',
          options: [
            'resume_final_v3.docx',
            'Priya_Sharma_Python_Analyst_Resume.pdf',
            'photo123.jpg',
            'untitled.txt'
          ],
          answerIndex: 1,
          explanation: 'A cleanly named PDF locks layout across devices and makes your application easy to retrieve.'
        }
      ]
    }
  },
  {
    slug: 'assignment-resume-builder-audit',
    title: 'Resume-Building Exercise: Draft & Self-Audit Your 1-Page Resume',
    description:
      'Create or polish your 1-page ATS-ready resume tailored to your target role, complete a 10-point quality audit, and save a viewable link.',
    duration: '1 hour',
    type: 'practical_assignment',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Resume Writing',
    skillsGained: ['Resume Writing', 'Career Preparation'],
    learningObjectives: [
      'Produce a clean, typo-free 1-page PDF resume',
      'Highlight verified SETU skills, academic scores, and at least 2 concrete projects',
      'Verify ATS readability by testing plain-text copy/paste'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'NCS Career Portal',
    assignmentBrief: 'Draft a tailored 1-page resume and complete the 10-point ATS self-audit.',
    targetAudience: 'All Job Seekers',
    assignmentDetails: {
      objective: 'Leave this exercise with an employer-ready resume you can attach to real applications immediately.',
      instructions: [
        'Choose 1 target role (e.g., Data Analyst Intern, Frontend Developer, Digital Marketing Associate).',
        'Include Contact info (email, phone, city/state, LinkedIn/GitHub/SETU Portfolio), Education with Percentage/CGPA, Skills, and 2–3 quantified projects or roles.',
        'Export to PDF, copy-paste all text into Notepad to verify clean reading order, and proofread carefully.',
        'Upload your PDF to Google Drive (View-only) or submit your audited resume summary below.'
      ],
      deliverables: ['Viewable PDF resume link or structured resume draft with 3 quantified impact bullets'],
      submissionRequirements: 'Share a view-only Drive/Portfolio link (`https://...`) or paste your polished summary and 3 impact bullets.',
      evaluationCriteria: [
        'Clean single-page structure with zero typos',
        'At least 3 quantified achievement bullets',
        'Honest alignment with target role keywords'
      ]
    }
  },
  {
    slug: 'tutorial-behavioral-interview-prep',
    title: 'Interview Preparation: Mastering Behavioral & HR Questions',
    description:
      'Prepare confident, genuine answers for "Tell me about yourself", strengths/weaknesses, conflict handling, and career-gap questions using STAR.',
    duration: '40 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Interview Preparation',
    skillsGained: ['Interview Preparation', 'Communication Skills'],
    learningObjectives: [
      'Craft a crisp 60-second personal career pitch',
      'Prepare 4 versatile STAR stories from academics, projects, or work',
      'Frame career breaks confidently around continuous learning and readiness'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'NCS Interview Resources',
    targetAudience: 'Freshers, Students, Career Restarters',
    tutorialContent: {
      overview:
        'Interviewers look for clarity of thought, honesty, and evidence of how you solve problems—not memorized textbook scripts.',
      steps: [
        {
          title: '1. The Present–Past–Future 60-Second Pitch',
          content:
            'Present: who you are & core strength. Past: 1–2 concrete projects or achievements. Future: why this specific role & company excite you.'
        },
        {
          title: '2. Build a 4-Story STAR Bank',
          content:
            'Prepare real examples for: (a) a hard problem you solved, (b) a teamwork success, (c) a deadline/mistake you recovered from, and (d) something you taught yourself quickly.'
        }
      ],
      exercises: [
        'Record a 60-second voice memo answering "Tell me about yourself" and review your pacing.',
        'Write 3 thoughtful questions you would ask a hiring manager at the end of an interview.'
      ],
      knowledgeChecks: [
        {
          question: 'When addressing a career break in an interview, what approach works best?',
          options: [
            'Apologize repeatedly and avoid eye contact',
            'Briefly acknowledge it with confidence and focus on your recent upskilling, projects, and readiness to contribute',
            'Refuse to discuss your timeline',
            'Invent fake employment dates'
          ],
          answerIndex: 1,
          explanation: 'Brief, honest framing followed by tangible evidence of current skills inspires employer confidence.'
        }
      ]
    }
  },
  {
    slug: 'assignment-mock-interview-star',
    title: 'Interview Practice Exercise: Write Your 5-Story STAR Interview Playbook',
    description:
      'Draft 5 concise, authentic STAR responses and 3 role-specific interviewer questions so you walk into any interview prepared.',
    duration: '1 hour',
    type: 'practical_assignment',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Interview Preparation',
    skillsGained: ['Interview Preparation', 'Workplace Communication'],
    learningObjectives: [
      'Document 5 reusable real-life STAR stories',
      'Practice concise 90-second verbal delivery',
      'Prepare tailored questions showing employer research'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'NCS Interview Preparation',
    assignmentBrief: 'Write 5 structured STAR stories and 3 thoughtful closing questions.',
    targetAudience: 'Job Seekers & Final-Year Students',
    assignmentDetails: {
      objective: 'Build a personal interview reference sheet you can review 15 minutes before every call.',
      instructions: [
        'Write your 60-second "Tell me about yourself" pitch.',
        'Draft 5 STAR stories covering: Problem Solving, Teamwork, Handling Feedback, Tight Deadline, and Proud Project.',
        'List 3 intelligent questions to ask the interviewer about role expectations and team culture.'
      ],
      deliverables: ['STAR Interview Playbook document link or written playbook notes'],
      submissionRequirements: 'Paste your 60-second pitch and at least 2 complete STAR stories (or link a viewable doc).',
      evaluationCriteria: [
        'Each story clearly separates Situation, Task, Action, and Result',
        'Highlights your personal actions rather than vague group statements',
        'Specific, genuine, and concise'
      ]
    }
  },
  {
    slug: 'tutorial-english-business-writing',
    title: 'English Proficiency: Clear Grammar & Workplace Writing',
    description:
      'Eliminate common grammar mistakes, master active voice, tense consistency, and write polished emails, messages, and reports in English.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'English Proficiency',
    skillsGained: ['English Proficiency', 'Business Writing', 'Communication Skills'],
    learningObjectives: [
      'Avoid frequent subject-verb agreement and preposition slips',
      'Write crisp, polite workplace messages without wordy filler',
      'Proofread emails confidently before hitting Send'
    ],
    contentUrl: 'https://learnenglish.britishcouncil.org/business-english',
    contentSourceLabel: 'British Council — Business English',
    targetAudience: 'Students & Early-Career Professionals',
    tutorialContent: {
      overview:
        'Effective workplace English is not about big vocabulary—it is about being clear, courteous, accurate, and easy to understand on the first read.',
      steps: [
        {
          title: '1. Short Sentences & Active Voice',
          content:
            'Prefer "I attached the quarterly report for your review" over "Attached herewith kindly find the quarterly report which has been prepared by me."'
        },
        {
          title: '2. High-Frequency Grammar Checks',
          content:
            'Check since (starting point) vs for (duration), affect (verb) vs effect (noun), and ensure plural subjects match plural verbs.'
        }
      ],
      exercises: [
        'Simplify 5 overly formal sentences into crisp modern workplace English.',
        'Draft a polite 4-sentence email requesting an interview reschedule.'
      ],
      knowledgeChecks: [
        {
          question: 'Which sentence is grammatically accurate?',
          options: [
            'I am working here since two years.',
            'I have been working here for two years.',
            'I working here from two years.',
            'I am worked here for two years.'
          ],
          answerIndex: 1,
          explanation: 'Present perfect continuous (`have been working`) pairs with `for` + duration (`two years`).'
        }
      ]
    }
  },
  {
    slug: 'tutorial-customer-service-excellence',
    title: 'Customer Service & Client Support Fundamentals',
    description:
      'Master empathetic listening, de-escalation scripts, SLA prioritization, CRM ticket hygiene, and first-contact resolution.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Business',
    difficulty: 'Beginner',
    skillTag: 'Customer Service',
    skillsGained: ['Customer Service', 'Communication Skills', 'Problem Solving'],
    learningObjectives: [
      'Calm frustrated customers using the L.A.S.T. method (Listen, Apologize, Solve, Thank)',
      'Write clear, empathetic chat and email support replies',
      'Document crisp CRM notes for seamless team handoffs'
    ],
    contentUrl: 'https://www.skillindiadigital.gov.in/',
    contentSourceLabel: 'Skill India Digital Hub — Service Roles',
    targetAudience: 'Support Associates, Operations & Retail Candidates',
    tutorialContent: {
      overview:
        'Customer service roles are among the fastest-growing remote and hybrid hiring tracks in India. Empathy, clear follow-through, and clean documentation set top performers apart.',
      steps: [
        {
          title: '1. The L.A.S.T. De-escalation Framework',
          content:
            'Listen without interrupting → Apologize genuinely for the inconvenience → Solve (or commit to an exact follow-up time) → Thank the customer for their patience.'
        },
        {
          title: '2. Positive Framing in Support Replies',
          content:
            'State what you CAN do rather than only what you cannot: "I can dispatch a replacement today so it arrives by Thursday" instead of "We cannot refund until next month."'
        }
      ],
      exercises: [
        'Write a calm, empathetic chat reply to a customer whose delivery is 2 days late.',
        'Summarize a mock support conversation into 3 crisp CRM bullet notes.'
      ],
      knowledgeChecks: [
        {
          question: 'What should you do FIRST when a customer reports an urgent billing error?',
          options: [
            'Transfer them immediately without reading the account',
            'Acknowledge their concern empathetically and verify the transaction details',
            'Tell them billing errors never happen',
            'Close the chat window'
          ],
          answerIndex: 1,
          explanation: 'Empathy plus prompt fact-checking calms the customer and speeds up accurate resolution.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-career-planning-networking',
    title: 'Career Preparation: Job Search Strategy & Ethical Networking',
    description:
      'Organize a focused weekly job-search system, optimize your LinkedIn/SETU profile, and send respectful outreach messages that earn replies.',
    duration: '30 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Career Preparation',
    skillsGained: ['Career Preparation', 'Workplace Communication'],
    learningObjectives: [
      'Replace random mass-applying with targeted, high-quality applications',
      'Track applications, follow-ups, and interview learnings systematically',
      'Write respectful 3-sentence informational outreach notes'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'National Career Service (NCS)',
    targetAudience: 'All Job Seekers',
    tutorialContent: {
      overview:
        'Applying thoughtfully to 8 well-matched roles with tailored resumes outperforms clicking apply on 100 mismatched listings.',
      steps: [
        {
          title: '1. Weekly Job-Search Rhythm',
          content:
            'Dedicate fixed blocks each week: 40% skill building & portfolio projects, 40% targeted applications & follow-ups, 20% interview practice & outreach.'
        },
        {
          title: '2. Respectful Short Outreach',
          content:
            'Mention shared context, ask one specific concise question, and respect the recipient’s time.'
        }
      ],
      exercises: [
        'List 10 target companies or government portals relevant to your top 2 career interests.',
        'Draft a polite 3-sentence LinkedIn connection request to an alum or hiring coordinator.'
      ],
      knowledgeChecks: [
        {
          question: 'Which job-search strategy usually yields higher interview conversion?',
          options: [
            'Submitting an untailored resume to 100 unrelated roles',
            'Targeting well-matched roles with tailored skills, portfolio links, and polite follow-up',
            'Leaving profile sections incomplete',
            'Never tracking where you applied'
          ],
          answerIndex: 1,
          explanation: 'Relevance and tangible proof of skills dramatically outperform untargeted volume.'
        }
      ]
    }
  },
  {
    slug: 'assignment-communication-pitch',
    title: 'Communication Exercise: 2-Minute Career Pitch & Executive Summary',
    description:
      'Practice distilling complex work into a clear 2-minute spoken introduction and a 150-word written summary for non-technical readers.',
    duration: '45 mins',
    type: 'practical_assignment',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Communication Skills',
    skillsGained: ['Communication Skills', 'English Proficiency'],
    learningObjectives: [
      'Explain a project clearly without confusing jargon',
      'Structure spoken and written updates concisely'
    ],
    contentUrl: 'https://learnenglish.britishcouncil.org/business-english',
    contentSourceLabel: 'British Council Business English',
    assignmentBrief: 'Write your 150-word project explainer and 60-second spoken career pitch.',
    targetAudience: 'Students & Job Seekers',
    assignmentDetails: {
      objective: 'Strengthen clarity and confidence when introducing yourself and explaining your work.',
      instructions: [
        'Pick one project, course, or assignment you completed recently.',
        'Explain in 150 words: what problem it solved, what steps you took, and what you learned—in plain language anyone can understand.',
        'Write a 60-second spoken career pitch and practice reading it aloud twice.'
      ],
      deliverables: ['150-word plain-language project summary + 60-second spoken pitch script'],
      submissionRequirements: 'Paste both pieces directly in the solution notes box (or link a viewable doc).',
      evaluationCriteria: [
        'Clear, jargon-free explanation',
        'Logical flow from problem to outcome',
        'Error-free, natural English'
      ]
    }
  },

  // ==================== DIGITAL LITERACY & OFFICE SKILLS (5) ====================
  {
    slug: 'tutorial-digital-literacy-safety',
    title: 'Digital Literacy: Cloud Tools, File Hygiene & Job-Scam Safety',
    description:
      'Build everyday workplace digital fluency—Google Drive/Docs sharing, PDF conversion, strong 2FA security, UPI safety, and spotting fake job offers.',
    duration: '30 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Digital Literacy',
    skillsGained: ['Digital Literacy', 'Computer Fundamentals', 'Online Safety'],
    learningObjectives: [
      'Organize career documents cleanly in cloud folders with safe view-only links',
      'Spot fake recruitment scams demanding upfront fees or OTPs/UPI PINs',
      'Protect accounts using unique passwords and Two-Factor Authentication'
    ],
    contentUrl: 'https://www.cert-in.org.in/',
    contentSourceLabel: 'CERT-In (Indian Computer Emergency Response Team) Advisories',
    targetAudience: 'Beginners, Students, First-Time Digital Job Seekers',
    tutorialContent: {
      overview:
        'Digital fluency keeps you productive in modern offices and protects you from online recruitment fraud.',
      steps: [
        {
          title: '1. Zero-Fee Hiring Rule',
          content:
            'Genuine employers NEVER ask candidates to pay registration fees, laptop deposits, or training deposits via UPI to receive an offer letter. Report any suspicious listing immediately.'
        },
        {
          title: '2. Safe Document Sharing & Cloud Hygiene',
          content:
            'Store your resume, mark sheets, and certificates in a dedicated cloud folder. Share links as "Viewer" only and export resumes as PDF.'
        }
      ],
      exercises: [
        'Create a neat "Career_Documents" cloud folder with subfolders for Resumes, Certificates, and Portfolio.',
        'Enable 2-Step Verification on your primary email account.'
      ],
      knowledgeChecks: [
        {
          question: 'When receiving payment from a freelance client via UPI, do you need to enter your UPI PIN?',
          options: [
            'Yes, to accept funds',
            'Never — UPI PIN is strictly for authorizing outgoing payments',
            'Only for first-time clients',
            'Only above ₹500'
          ],
          answerIndex: 1,
          explanation: 'Entering a UPI PIN always debits money from your account.'
        }
      ]
    }
  },
  {
    slug: 'assignment-digital-career-kit',
    title: 'Digital Literacy Exercise: Organize Your Cloud Career Kit',
    description:
      'Set up a clean cloud folder with named PDFs, configure safe view-only sharing permissions, and complete a digital safety checklist.',
    duration: '40 mins',
    type: 'practical_assignment',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Digital Literacy',
    skillsGained: ['Digital Literacy', 'Computer Fundamentals'],
    learningObjectives: [
      'Apply clean professional file naming conventions',
      'Verify read-only link permissions in an incognito browser tab'
    ],
    contentUrl: 'https://support.google.com/drive',
    contentSourceLabel: 'Google Drive Official Help',
    assignmentBrief: 'Organize your cloud Career Kit and document your 5-point digital safety check.',
    targetAudience: 'Students & First-Time Job Seekers',
    assignmentDetails: {
      objective: 'Ensure you can send polished, safe document links in seconds whenever an employer asks.',
      instructions: [
        'Create a cloud folder structure: `Career_Kit/Resume`, `Career_Kit/Certificates`, `Career_Kit/Projects`.',
        'Rename your files cleanly (no `final_final2.docx` or `IMG_001.jpg`).',
        'Verify your shareable link opens cleanly in an Incognito window with Viewer-only access.'
      ],
      deliverables: ['Summary of your organized folder structure and safety check (or public portfolio folder link)'],
      submissionRequirements: 'Describe your folder setup and confirm your 2FA + view-only checks in the notes box.',
      evaluationCriteria: [
        'Clear professional naming convention',
        'Read-only sharing permissions verified',
        '2FA enabled on job-search email'
      ]
    }
  },
  {
    slug: 'tutorial-computer-os-shortcuts',
    title: 'Computer Fundamentals: Operating Systems, Files & Keyboard Productivity',
    description:
      'Understand RAM vs storage, file formats (PDF/CSV/ZIP), browser safety, and essential keyboard shortcuts that double everyday desk speed.',
    duration: '30 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'Computer Fundamentals',
    skillsGained: ['Computer Fundamentals', 'Digital Literacy'],
    learningObjectives: [
      'Distinguish RAM, SSD/HDD storage, CPU, and OS responsibilities',
      'Use CSV, PDF, ZIP, and DOCX formats appropriately at work',
      'Navigate windows and spreadsheets faster with universal keyboard shortcuts'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/windows',
    contentSourceLabel: 'Microsoft Windows Official Support',
    targetAudience: 'Beginners & Office Role Candidates',
    tutorialContent: {
      overview:
        'Knowing how files, memory, browsers, and shortcuts work eliminates everyday tech friction at any workplace.',
      steps: [
        {
          title: '1. Choosing the Right File Format',
          content:
            'Use `.pdf` for finalized resumes/reports, `.csv` for clean tabular data exchange, `.xlsx` for multi-sheet formula models, and `.zip` to bundle multiple files cleanly.'
        },
        {
          title: '2. Universal Productivity Shortcuts',
          content:
            'Master `Ctrl+C`/`V`/`Z`, `Ctrl+F` (find), `Alt+Tab` (switch apps), `Ctrl+Shift+T` (reopen closed browser tab), and `Ctrl+S` (save often).'
        }
      ],
      exercises: [
        'Export a document to PDF and compress 3 sample project files into a neatly named `.zip` archive.',
        'Practice switching apps and searching within a webpage using only keyboard shortcuts for 10 minutes.'
      ],
      knowledgeChecks: [
        {
          question: 'Which computer component stores active working data temporarily and clears when powered off?',
          options: ['SSD', 'RAM', 'USB Drive', 'Hard Disk'],
          answerIndex: 1,
          explanation: 'RAM is fast volatile memory used by running programs.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-excel-intermediate-lookups',
    title: 'Intermediate Excel: XLOOKUP, INDEX-MATCH & Data Cleaning',
    description:
      'Level up your spreadsheet skills with multi-criteria lookups, `TRIM`/`CLEAN`/`TEXTSPLIT`, Data Validation dropdowns, and dynamic dashboards.',
    duration: '50 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'Excel',
    skillsGained: ['Excel', 'Data Cleaning', 'Data Analysis'],
    learningObjectives: [
      'Combine `INDEX` & `MATCH` (or `XLOOKUP`) for flexible left/right lookups',
      'Clean messy imported text with `TRIM`, `PROPER`, `IFERROR`, and Remove Duplicates',
      'Protect data entry accuracy using Excel Data Validation dropdown lists'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929',
    contentSourceLabel: 'Microsoft Official XLOOKUP & Formula Docs',
    targetAudience: 'Analysts, Operations, Finance & MIS Roles',
    tutorialContent: {
      overview:
        'Real company spreadsheets are rarely tidy. Mastering lookup formulas and text-cleaning functions turns hours of manual copy-pasting into reliable 2-minute workflows.',
      steps: [
        {
          title: '1. Clean Messy Strings Safely',
          content:
            'Wrap messy names with `=PROPER(TRIM(A2))` to strip extra spaces and standardize capitalization before matching tables.',
          codeOrExample: `=IFERROR(INDEX(Master!$C$2:$C$500, MATCH(TRIM(A2), Master!$A$2:$A$500, 0)), "Not Found")`
        },
        {
          title: '2. Prevent Bad Data with Data Validation',
          content:
            'Use Data → Data Validation → List so teammates select standardized values (e.g., Paid / Pending / Cancelled) instead of mistyping statuses.'
        }
      ],
      exercises: [
        'Clean a 15-row table with inconsistent spaces and casing using `TRIM` and `PROPER`.',
        'Link a Sales table to a Product Price list using `XLOOKUP` or `INDEX/MATCH` wrapped in `IFERROR`.'
      ],
      knowledgeChecks: [
        {
          question: 'Why wrap lookup formulas inside `IFERROR(..., "Not Found")`?',
          options: [
            'To delete the worksheet',
            'To display a clean fallback message instead of ugly `#N/A` errors when a key is missing',
            'To sort cells alphabetically',
            'To change currency formatting'
          ],
          answerIndex: 1,
          explanation: '`IFERROR` keeps dashboards clean and prevents error values from breaking downstream sums.'
        }
      ]
    }
  },
  {
    slug: 'assignment-excel-sales-dashboard',
    title: 'Skill-Building Exercise: Regional Sales & MIS Summary Workbook',
    description:
      'Analyze a multi-region product sales log using Pivot Tables, `COUNTIFS`/`SUMIFS`, top-performer ranking, and executive KPI cards.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'Excel',
    skillsGained: ['Excel', 'Data Analysis', 'Spreadsheet Analysis'],
    learningObjectives: [
      'Build a clean MIS summary tab driven purely by formulas and Pivot Tables',
      'Identify top-performing regions and revenue contribution %'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/excel',
    contentSourceLabel: 'Microsoft Excel Learning Center',
    assignmentBrief: 'Create a 30-row sales dataset and build a formula-driven MIS summary tab.',
    targetAudience: 'Aspiring Data & MIS Analysts',
    assignmentDetails: {
      objective: 'Create a realistic business reporting workbook employers love seeing in analyst portfolios.',
      instructions: [
        'Create a `RawSales` tab with 30 rows: OrderDate, Region (North/South/East/West), Product, Units, UnitPrice, Revenue (`=Units*UnitPrice`).',
        'Create a `Dashboard` tab with Total Revenue, Average Order Value, Units Sold, and a Region-wise breakdown using `SUMIF` and `% of Total`.',
        'Add a Pivot Table + Column Chart highlighting top regions.'
      ],
      deliverables: ['Viewable Google Sheet/Excel link or formula + insight summary'],
      submissionRequirements: 'Share a viewable spreadsheet URL (`https://...`) or summarize your formulas and top 3 analytical insights.',
      evaluationCriteria: [
        'All KPIs update dynamically when raw rows change',
        'Accurate percentage-of-total math',
        'Clean, readable visual presentation'
      ]
    }
  },

  // ==================== PROGRAMMING, GIT, APIs & AI (9) ====================
  {
    slug: 'tutorial-git-github-essentials',
    title: 'Git & GitHub Version Control for Beginners',
    description:
      'Learn repositories, commits, branches, pull requests, `.gitignore`, and how to publish clean code portfolios on GitHub.',
    duration: '40 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'Git & GitHub',
    skillsGained: ['Git & GitHub', 'Web Development', 'Teamwork'],
    learningObjectives: [
      'Initialize repositories and write clear, atomic commit messages',
      'Create feature branches and merge cleanly without breaking `main`',
      'Never commit `.env` secrets or `node_modules` by configuring `.gitignore`'
    ],
    contentUrl: 'https://docs.github.com/en/get-started',
    contentSourceLabel: 'GitHub Official Get Started Docs',
    targetAudience: 'All Aspiring Software Developers',
    tutorialContent: {
      overview:
        'Every software team relies on Git for safe collaboration and change history. A well-organized GitHub profile with clear READMEs also serves as live proof of your coding ability.',
      steps: [
        {
          title: '1. Core Everyday Git Workflow',
          content:
            'Inspect changed files before staging, write meaningful commit messages explaining WHY, and push to feature branches.',
          codeOrExample: `git status
git checkout -b feature/contact-form
git add .
git commit -m "Add accessible contact form with validation"
git push -u origin feature/contact-form`
        },
        {
          title: '2. Protect Secrets with .gitignore',
          content:
            'Always exclude `.env`, API keys, and `node_modules/` in `.gitignore` before your very first commit.'
        }
      ],
      exercises: [
        'Create a public GitHub repository for one of your SETU assignments with a clear `README.md` explaining setup and screenshots.',
        'Practice creating a branch, making 2 commits, and opening a Pull Request to `main`.'
      ],
      knowledgeChecks: [
        {
          question: 'Which file tells Git never to track local `.env` secrets or `node_modules/`?',
          options: ['package.json', '.gitignore', 'README.md', 'index.html'],
          answerIndex: 1,
          explanation: '`.gitignore` prevents untracked sensitive or generated files from being committed.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-python-data-pandas',
    title: 'Intermediate Python: Data Cleaning & Analysis Patterns',
    description:
      'Process CSV datasets cleanly using Python `csv`/Pandas workflows—handling missing values, grouping aggregations, and exporting clean summaries.',
    duration: '55 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'Python',
    skillsGained: ['Python', 'Data Analysis', 'Data Cleaning'],
    learningObjectives: [
      'Load tabular CSV files and inspect missing or malformed rows',
      'Compute group-by summaries and filter outliers cleanly',
      'Export reproducible analytical reports without altering raw source files'
    ],
    contentUrl: 'https://pandas.pydata.org/docs/getting_started/index.html',
    contentSourceLabel: 'Official Pandas Getting Started Guide',
    targetAudience: 'Data Analysts & Python Developers',
    tutorialContent: {
      overview:
        'Python plus Pandas makes repeating weekly data-cleaning pipelines fast, auditable, and far less error-prone than manual spreadsheet edits.',
      steps: [
        {
          title: '1. Inspect & Clean Missing Values',
          content:
            'Always check `.info()` and `.isna().sum()` first, then decide transparently whether to drop or fill missing values.',
          codeOrExample: `import pandas as pd
df = pd.read_csv("sales.csv")
df["city"] = df["city"].fillna("Unknown").str.strip()
summary = df.groupby("city")["amount"].agg(["count", "sum", "mean"])`
        }
      ],
      exercises: [
        'Load a CSV of student marks, compute subject-wise mean and median, and identify top 5 scores.',
        'Write a short cleaning script that strips whitespace and removes exact duplicate rows.'
      ],
      knowledgeChecks: [
        {
          question: 'Which statistical summary is least distorted by one extreme outlier?',
          options: ['Mean', 'Median', 'Maximum', 'Range'],
          answerIndex: 1,
          explanation: 'Median uses the middle ordered value and stays stable even when extreme outliers exist.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-nodejs-rest-apis',
    title: 'Intermediate Node.js & Express: Designing Clean REST APIs',
    description:
      'Learn REST status codes, request validation with Zod, secure password hashing, JWT authentication, and centralized JSON error handling.',
    duration: '60 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'JavaScript',
    skillsGained: ['JavaScript', 'Node.js', 'REST APIs'],
    learningObjectives: [
      'Return consistent HTTP status codes (200, 201, 400, 401, 403, 404, 500)',
      'Validate incoming payloads before touching the database',
      'Protect private endpoints with authentication & role checks'
    ],
    contentUrl: 'https://expressjs.com/en/guide/routing.html',
    contentSourceLabel: 'Express.js Official Routing Guide',
    targetAudience: 'Backend & Full-Stack Learners',
    tutorialContent: {
      overview:
        'Well-structured REST APIs validate every request, fail predictably with clear JSON errors, and separate route definitions from controller logic.',
      steps: [
        {
          title: '1. Consistent JSON Response Envelopes',
          content:
            'Standardizing `{ success, message, data }` across endpoints prevents frontend crashes and makes debugging effortless.'
        },
        {
          title: '2. Never Trust Client-Supplied Roles or Scores',
          content:
            'Always derive user identity from verified JWTs on the server and compute scores or permissions server-side.'
        }
      ],
      exercises: [
        'Design a 4-endpoint CRUD API spec for a Bookmarks service including status codes and validation rules.',
        'Add a centralized Express error handler middleware returning JSON instead of HTML stack traces.'
      ],
      knowledgeChecks: [
        {
          question: 'Which HTTP status code best indicates an authenticated user lacks permission for an admin route?',
          options: ['200 OK', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
          answerIndex: 2,
          explanation: '401 means unauthenticated; 403 means authenticated but not authorized for the resource.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-java-oop-collections',
    title: 'Java Programming: OOP Principles & Collections Framework',
    description:
      'Master classes, inheritance, interfaces, polymorphism, `ArrayList`, `HashSet`, `HashMap`, and exception handling in modern Java.',
    duration: '55 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'Java',
    skillsGained: ['Java', 'Java OOP', 'Java Collections'],
    learningObjectives: [
      'Design cohesive classes with encapsulation and interfaces',
      'Pick the right Java Collection (`List` vs `Set` vs `Map`) for each use case',
      'Compare String values safely using `.equals()`'
    ],
    contentUrl: 'https://dev.java/learn/',
    contentSourceLabel: 'Official Dev.java Learning Portal',
    targetAudience: 'CS/IT Students & Backend Candidates',
    tutorialContent: {
      overview:
        'Java powers enterprise backends and Android systems across India. Mastering OOP design and the Collections Framework prepares you for technical coding rounds.',
      steps: [
        {
          title: '1. Choosing List, Set, or Map',
          content:
            'Use `ArrayList` for ordered duplicates, `HashSet` for fast unique membership checks, and `HashMap` for key-value lookups.',
          codeOrExample: `Map<String, Integer> skillCounts = new HashMap<>();
skillCounts.put("Java", 5);
int count = skillCounts.getOrDefault("Python", 0);`
        }
      ],
      exercises: [
        'Write a Java program that counts word frequencies in a sentence using a `HashMap<String, Integer>`.',
        'Model a `PaymentMethod` interface implemented by `UpiPayment` and `CardPayment` classes.'
      ],
      knowledgeChecks: [
        {
          question: 'How should two Java `String` values be compared for equal text content?',
          options: ['a == b', 'a.equals(b)', 'a === b', 'a.same(b)'],
          answerIndex: 1,
          explanation: '`.equals()` compares character sequences, whereas `==` checks reference identity.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-dsa-problem-patterns',
    title: 'Data Structures & Algorithms: Core Coding Interview Patterns',
    description:
      'Learn Big-O analysis, two-pointer techniques, hash-map frequency lookups, stacks/queues, and binary search with clear intuition.',
    duration: '60 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'Data Structures',
    skillsGained: ['Data Structures', 'Algorithms', 'Problem Solving'],
    learningObjectives: [
      'Estimate time and space complexity in Big-O notation accurately',
      'Replace slow O(n²) nested loops with O(n) hash maps or two pointers',
      'Implement bug-free binary search on sorted arrays'
    ],
    contentUrl: 'https://cp-algorithms.com/',
    contentSourceLabel: 'CP-Algorithms Reference',
    targetAudience: 'Engineering Students & Software Candidates',
    tutorialContent: {
      overview:
        'Technical interviews reward recognizing underlying patterns—like hash-map lookups and binary search—rather than memorizing solutions blindly.',
      steps: [
        {
          title: '1. Hash Map Lookup Pattern (Two Sum)',
          content:
            'Store previously seen numbers in a hash map so checking for `target - num` takes O(1) average time, cutting total runtime from O(n²) to O(n).'
        },
        {
          title: '2. Binary Search Halving',
          content:
            'On any sorted array, checking the midpoint halves remaining elements every iteration, achieving O(log n) search.'
        }
      ],
      exercises: [
        'Implement balanced parentheses checking (`()[]{}`) using a Stack.',
        'Implement Binary Search iteratively and trace it on an array of 7 sorted integers.'
      ],
      knowledgeChecks: [
        {
          question: 'What is the worst-case time complexity of Binary Search on a sorted array of n items?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          answerIndex: 1,
          explanation: 'Halving the search space each step takes at most ⌈log₂ n⌉ comparisons.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-ai-prompting-productivity',
    title: 'Artificial Intelligence & Responsible Prompt Engineering',
    description:
      'Use generative AI effectively and safely at work: structured prompting, fact-checking hallucinations, privacy rules, and ethical workflows.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'Artificial Intelligence',
    skillsGained: ['Artificial Intelligence', 'Prompt Engineering', 'Digital Literacy'],
    learningObjectives: [
      'Write clear Role + Context + Task + Format prompts for reliable drafts',
      'Verify facts, citations, and calculations independently to catch hallucinations',
      'Keep confidential personal and company data out of public AI tools'
    ],
    contentUrl: 'https://ai.google/education/',
    contentSourceLabel: 'Google AI Education Resources',
    targetAudience: 'Students, Professionals, Creators, Analysts',
    tutorialContent: {
      overview:
        'AI tools amplify human judgment—they work best when you give clear constraints, protect private data, and verify every factual output yourself.',
      steps: [
        {
          title: '1. The R.C.T.F. Prompt Formula',
          content:
            'Specify **R**ole (audience perspective), **C**ontext (background & constraints), **T**ask (exact goal), and **F**ormat (bullets, table, word count).'
        },
        {
          title: '2. Always Verify Outputs & Guard Privacy',
          content:
            'Never paste Aadhaar/PAN numbers, passwords, or private customer sheets into public AI chatboxes, and double-check all numbers, legal claims, and URLs.'
        }
      ],
      exercises: [
        'Improve a vague prompt ("help with resume") into a structured R.C.T.F. prompt for a specific job role.',
        'Draft a 5-point personal "Safe AI Checklist" for workplace use.'
      ],
      knowledgeChecks: [
        {
          question: 'Why must AI-generated statistics and government scheme rules always be checked against primary sources?',
          options: [
            'AI models can hallucinate plausible-sounding but incorrect facts or outdated rules',
            'AI models never understand English',
            'Government portals never change',
            'Checking sources is unnecessary'
          ],
          answerIndex: 0,
          explanation: 'LLMs predict probable text and can fabricate or cite outdated policy details.'
        }
      ]
    }
  },
  {
    slug: 'assignment-js-todo-tracker',
    title: 'Practical Assignment: Interactive JavaScript Job-Application Tracker',
    description:
      'Code a lightweight HTML/CSS/JavaScript web app where users can add, filter, and persist job applications using `localStorage`.',
    duration: '2 hours',
    type: 'practical_assignment',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'JavaScript',
    skillsGained: ['JavaScript', 'HTML/CSS', 'Web Development'],
    learningObjectives: [
      'Manipulate the DOM cleanly with event delegation and array methods',
      'Persist structured state in `localStorage` safely with `JSON.parse` error handling'
    ],
    contentUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
    contentSourceLabel: 'MDN Web Storage API Docs',
    assignmentBrief: 'Build a filterable job-application tracker in vanilla JS with localStorage persistence.',
    targetAudience: 'Aspiring Frontend Developers',
    assignmentDetails: {
      objective: 'Demonstrate DOM manipulation, state filtering, and clean JavaScript coding without external libraries.',
      instructions: [
        'Build a form to add Role, Company, Status (Applied/Interview/Offer), and Date.',
        'Render cards dynamically using `.map()` and allow filtering by status.',
        'Save and restore the list from `localStorage` with `try`/`catch` fallback.'
      ],
      deliverables: ['GitHub repository / live URL or JavaScript implementation summary'],
      submissionRequirements: 'Share your GitHub/live URL (`https://...`) or paste your architecture and key JS functions.',
      evaluationCriteria: [
        'Clean state rendering without innerHTML XSS vulnerabilities',
        'Working filter and delete controls',
        'Data persists across page refreshes'
      ]
    }
  },
  {
    slug: 'assignment-react-skill-dashboard',
    title: 'Practical Assignment: Build a Searchable React Skill Explorer',
    description:
      'Create a responsive React component with search, category filter pills, loading/empty states, and favorite toggling.',
    duration: '2 hours',
    type: 'practical_assignment',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'React',
    skillsGained: ['React', 'JavaScript', 'UI/UX Design'],
    learningObjectives: [
      'Manage derived filtered lists cleanly with `useMemo` and `useState`',
      'Design accessible empty and error states'
    ],
    contentUrl: 'https://react.dev/learn/thinking-in-react',
    contentSourceLabel: 'Official Thinking in React Guide',
    assignmentBrief: 'Build a filterable React catalog component with bookmarks and empty state.',
    targetAudience: 'React Learners',
    assignmentDetails: {
      objective: 'Prove real React component composition and clean state handling for frontend interviews.',
      instructions: [
        'Build a parent `SkillExplorer` component holding search text, selected category, and bookmarked IDs.',
        'Render child `SkillCard` components with stable unique keys.',
        'Include a friendly empty state with a "Reset Filters" button when no items match.'
      ],
      deliverables: ['GitHub/CodeSandbox/live URL or component structure summary'],
      submissionRequirements: 'Share your repo/demo link (`https://...`) or explain your component state tree.',
      evaluationCriteria: [
        'Immutable state updates and unique keys',
        'Clean separation of parent state and reusable cards',
        'Responsive layout on mobile and desktop'
      ]
    }
  },
  {
    slug: 'assignment-sql-ecommerce-analytics',
    title: 'Intermediate Exercise: SQL Revenue & Customer Retention Queries',
    description:
      'Practice intermediate SQL—CTEs (`WITH`), `CASE WHEN` segmentation, window functions (`RANK()`), and multi-table JOINs.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'SQL',
    skillsGained: ['SQL', 'Data Analysis', 'Database Management'],
    learningObjectives: [
      'Write readable multi-step queries with Common Table Expressions (CTEs)',
      'Rank top products per category using `ROW_NUMBER()` or `RANK()`'
    ],
    contentUrl: 'https://www.postgresql.org/docs/current/queries-with.html',
    contentSourceLabel: 'PostgreSQL CTE & Window Function Docs',
    assignmentBrief: 'Write 4 intermediate analytical SQL queries using CTEs and window functions.',
    targetAudience: 'Intermediate Data Analysts & Backend Devs',
    assignmentDetails: {
      objective: 'Prepare for real analyst SQL screens involving ranking, cohorts, and conditional aggregation.',
      instructions: [
        'Given `orders(order_id, customer_id, category, amount, order_date)`, write queries for:',
        '1. Monthly revenue growth summary.',
        '2. Top 2 highest-spending customers per category using `RANK() OVER (PARTITION BY category ORDER BY total_spend DESC)`.',
        '3. Customer tier classification (`Gold`/`Silver`/`Bronze`) using `CASE WHEN`.'
      ],
      deliverables: ['SQL script link or pasted queries with brief explanations'],
      submissionRequirements: 'Paste your SQL queries below or share a GitHub/Gist link (`https://...`).',
      evaluationCriteria: [
        'Valid CTE and window function syntax',
        'Handles grouping cleanly without ambiguous columns',
        'Readable formatting and comments'
      ]
    }
  },

  // ==================== CREATIVE, CANVA & DESIGN (4) ====================
  {
    slug: 'tutorial-canva-visual-design',
    title: 'Canva for Career & Business: Brand Kits, Posters & Carousels',
    description:
      'Create polished social graphics, pitch decks, and printable flyers in Canva using visual hierarchy, clean alignment, and proper export formats.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Canva',
    skillsGained: ['Canva', 'Graphic Design', 'Social Media Marketing'],
    learningObjectives: [
      'Combine 1–2 complementary fonts with balanced whitespace',
      'Choose the right pixel dimensions for Instagram, LinkedIn, YouTube, and print',
      'Export transparent PNGs vs 300-DPI Print PDFs accurately'
    ],
    contentUrl: 'https://www.canva.com/designschool/',
    contentSourceLabel: 'Canva Design School (Official)',
    targetAudience: 'Creators, Freelancers, Small Business Owners',
    tutorialContent: {
      overview:
        'Canva lets non-illustrators produce agency-quality marketing collateral quickly when paired with fundamental graphic design rules.',
      steps: [
        {
          title: '1. Alignment & Contrast Beat Clutter',
          content:
            'Turn on Margins & Guides, align headlines consistently, leave at least 25% breathing space, and make your main headline 2× larger than body copy.'
        },
        {
          title: '2. Export Settings Checklist',
          content:
            'Use PNG for crisp social graphics and transparent logos; PDF Standard for digital brochures/resumes; PDF Print with bleed for physical printing.'
        }
      ],
      exercises: [
        'Design a 3-slide LinkedIn carousel introducing one skill you learned on SETU.',
        'Create a simple 3-color + 2-font Brand Style Card for a hypothetical local craft shop.'
      ],
      knowledgeChecks: [
        {
          question: 'Which Canva export format supports transparent backgrounds for logos?',
          options: ['JPG', 'PNG (Transparent Background)', 'MP4', 'TXT'],
          answerIndex: 1,
          explanation: 'PNG preserves transparency so logos overlay cleanly on any colored surface.'
        }
      ]
    }
  },
  {
    slug: 'assignment-canva-brand-poster',
    title: 'Practical Assignment: Design a 3-Piece Brand Collateral Kit in Canva',
    description:
      'Create a cohesive social post (1:1), vertical story (9:16), and event flyer (A4) for a community initiative or small business using one brand palette.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Canva',
    skillsGained: ['Canva', 'Graphic Design', 'Digital Marketing'],
    learningObjectives: [
      'Adapt one visual identity cleanly across three aspect ratios',
      'Apply strong typography hierarchy and readable color contrast'
    ],
    contentUrl: 'https://www.canva.com/designschool/',
    contentSourceLabel: 'Canva Design School',
    assignmentBrief: 'Design a cohesive 3-piece visual kit (1:1 post, 9:16 story, A4 flyer) in Canva.',
    targetAudience: 'Creative Learners & Freelancers',
    assignmentDetails: {
      objective: 'Build a real graphic design portfolio sample showing multi-format consistency.',
      instructions: [
        'Pick a real or sample community cause (e.g., Women Coding Bootcamp or Local Handloom Fair).',
        'Select 1 primary color, 1 accent color, and 2 readable fonts.',
        'Design: (1) 1080×1080 square post, (2) 1080×1920 vertical story, and (3) A4 printable flyer.',
        'Share a view-only Canva link or describe your design choices below.'
      ],
      deliverables: ['Viewable Canva share link (`https://www.canva.com/...`) or design rationale'],
      submissionRequirements: 'Paste your view-only Canva/Drive link or describe your color, font, and layout decisions.',
      evaluationCriteria: [
        'Consistent visual identity across all 3 sizes',
        'Strong focal hierarchy and clean margins',
        'Legible contrast on mobile screens'
      ]
    }
  },
  {
    slug: 'tutorial-content-copywriting-craft',
    title: 'Content Writing & Storytelling for Blogs, LinkedIn & Websites',
    description:
      'Write engaging hooks, scannable subheadings, clear landing-page copy, and well-researched articles that readers trust and share.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Content Writing',
    skillsGained: ['Content Writing', 'Digital Marketing', 'Communication Skills'],
    learningObjectives: [
      'Write benefit-focused headlines and opening hooks',
      'Format articles with short 2–3 line paragraphs and clear subheadings',
      'Edit drafts ruthlessly to cut filler words and verify cited facts'
    ],
    contentUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
    contentSourceLabel: 'Google Search — Creating Helpful Content',
    targetAudience: 'Writers, Marketers, Freelancers',
    tutorialContent: {
      overview:
        'Readers online decide within 5 seconds whether your article answers their question. Lead with value, write like a helpful human, and back claims with real sources.',
      steps: [
        {
          title: '1. Hook → Promise → Structured Value → CTA',
          content:
            'Open with a relatable question or concrete fact, state what the reader will gain, break steps into numbered headings, and close with one clear next action.'
        }
      ],
      exercises: [
        'Write 3 headline options for a blog post on "How College Students Can Land Their First Remote Internship".',
        'Edit a 250-word draft down to 170 words without losing any core insight.'
      ],
      knowledgeChecks: [
        {
          question: 'What makes web articles easiest to read on smartphones?',
          options: [
            'Long 20-line unbroken paragraphs',
            'Short 2–3 sentence paragraphs, descriptive subheadings, and scannable bullet lists',
            'All capital letters',
            'Tiny light-gray text'
          ],
          answerIndex: 1,
          explanation: 'Short chunks and clear subheadings make reading effortless on narrow mobile screens.'
        }
      ]
    }
  },
  {
    slug: 'assignment-ux-app-redesign-audit',
    title: 'Skill-Building Exercise: UX Usability Audit & Wireframe Sketch',
    description:
      'Audit one everyday mobile app or public website for usability friction and sketch a cleaner 3-screen wireframe improvement.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Creative',
    difficulty: 'Intermediate',
    skillTag: 'UI/UX Design',
    skillsGained: ['UI/UX Design', 'Accessibility', 'Problem Solving'],
    learningObjectives: [
      'Spot real navigation, contrast, and cognitive-load friction points',
      'Communicate UX improvements cleanly via annotated wireframes'
    ],
    contentUrl: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
    contentSourceLabel: 'W3C Easy Checks for Accessibility',
    assignmentBrief: 'Audit 1 real app/website flow and propose a cleaner 3-screen wireframe.',
    targetAudience: 'Aspiring UI/UX Designers',
    assignmentDetails: {
      objective: 'Create a compelling UX case study mini-artifact for your design portfolio.',
      instructions: [
        'Choose 1 real flow (e.g., booking a train ticket or registering for an exam).',
        'Document 3 concrete usability or accessibility pain points (confusing labels, poor contrast, too many steps).',
        'Sketch 3 low-fidelity wireframe screens (paper photo, Figma, or Canva) showing your streamlined redesign.'
      ],
      deliverables: ['Figma/Drive link or written UX audit + redesign rationale'],
      submissionRequirements: 'Share a viewable Figma/Drive link (`https://...`) or paste your 3 findings and redesign steps.',
      evaluationCriteria: [
        'Grounded in real user friction rather than subjective color preference',
        'Addresses accessibility (contrast, labels, touch targets)',
        'Clear before/after reasoning'
      ]
    }
  },

  // ==================== ENTREPRENEURSHIP, BUSINESS & APTITUDE (4) ====================
  {
    slug: 'tutorial-entrepreneurship-launch-guide',
    title: 'Entrepreneurship Training: From Idea Validation to First 10 Customers',
    description:
      'Learn how to validate a small business or freelance service cheaply, calculate unit pricing, manage cash flow, and explore Udyam & MUDRA support.',
    duration: '45 mins',
    type: 'tutorial',
    category: 'Business',
    difficulty: 'Beginner',
    skillTag: 'Entrepreneurship',
    skillsGained: ['Entrepreneurship', 'Business Planning', 'Financial Literacy'],
    learningObjectives: [
      'Test demand with a low-cost MVP before buying heavy inventory',
      'Calculate direct costs, gross margin, and monthly break-even units',
      'Understand Udyam Registration and official MSME support schemes'
    ],
    contentUrl: 'https://www.startupindia.gov.in/content/sih/en/learning-and-development_v2.html',
    contentSourceLabel: 'Startup India Official Learning & Development',
    targetAudience: 'Aspiring Founders, Artisans, Women Entrepreneurs',
    tutorialContent: {
      overview:
        'Successful small businesses start by solving one painful customer problem profitably at small scale—long before taking large loans.',
      steps: [
        {
          title: '1. Talk to 10 Real Customers Before Building',
          content:
            'Ask potential buyers what they currently spend time or money on and test whether they will pre-order a simple first version (MVP).'
        },
        {
          title: '2. Know Your Unit Economics Cold',
          content:
            'Track Direct Material + Packaging + Delivery + Platform Fee per order so every sale earns healthy positive margin toward fixed costs.'
        }
      ],
      exercises: [
        'Write a 1-page Lean Business Plan: Problem, Target Customer, Solution, Price, Direct Cost, and First Marketing Channel.',
        'Compute your monthly break-even sales count assuming ₹10,000 fixed monthly costs and ₹200 profit per unit.'
      ],
      knowledgeChecks: [
        {
          question: 'With ₹10,000 in fixed monthly costs and ₹200 profit per unit sold, how many units must you sell monthly to break even?',
          options: ['20 units', '50 units', '100 units', '200 units'],
          answerIndex: 1,
          explanation: 'Break-even units = Fixed Costs (₹10,000) / Profit per Unit (₹200) = 50 units.'
        }
      ]
    }
  },
  {
    slug: 'assignment-lean-business-plan',
    title: 'Entrepreneurship Exercise: Build Your 1-Page Business & Pricing Plan',
    description:
      'Draft a realistic 1-page business model, unit pricing sheet, break-even calculation, and 30-day customer launch plan.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Business',
    difficulty: 'Beginner',
    skillTag: 'Entrepreneurship',
    skillsGained: ['Entrepreneurship', 'Business Planning', 'Project Management'],
    learningObjectives: [
      'Validate pricing and unit profitability on paper before spending capital',
      'Create an actionable 30-day roadmap to win your first paying customers'
    ],
    contentUrl: 'https://udyamregistration.gov.in/',
    contentSourceLabel: 'Official Udyam MSME Registration Portal',
    assignmentBrief: 'Draft a 1-page business plan with unit economics and a 30-day launch checklist.',
    targetAudience: 'Entrepreneurs, Freelancers, SHG & Micro-Business Builders',
    assignmentDetails: {
      objective: 'Build a clear, lender-ready 1-page business foundation that can also support MUDRA or Stand-Up India preparation.',
      instructions: [
        'Define your product/service, exact target buyer, and why they would choose you.',
        'List Selling Price, Direct Cost per unit, Gross Profit per unit, Monthly Fixed Costs, and Break-Even Volume.',
        'Outline 5 concrete actions to acquire your first 10 paying customers in 30 days.'
      ],
      deliverables: ['1-page Business Plan link or structured notes'],
      submissionRequirements: 'Paste your business model, unit math, and 30-day launch steps below (or share a viewable doc link).',
      evaluationCriteria: [
        'Realistic cost and break-even arithmetic',
        'Specific customer segment rather than "everyone"',
        'Actionable low-cost first-customer plan'
      ]
    }
  },
  {
    slug: 'tutorial-freelancing-portfolio-pricing',
    title: 'Freelancing Foundations: Scopes, Pricing & Safe Client Payments',
    description:
      'Start freelancing ethically in design, writing, web dev, or virtual assistance—scoping deliverables clearly, quoting fairly, and avoiding unpaid work.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Business',
    difficulty: 'Beginner',
    skillTag: 'Entrepreneurship',
    skillsGained: ['Entrepreneurship', 'Communication Skills', 'Project Management'],
    learningObjectives: [
      'Write a simple 1-page Scope of Work (deliverables, revision limits, timeline, payment milestones)',
      'Quote project rates confidently based on effort and client value',
      'Use milestone payments (e.g., 40% advance / 60% delivery) to protect your time'
    ],
    contentUrl: 'https://www.startupindia.gov.in/',
    contentSourceLabel: 'Startup India & Independent Creator Guides',
    targetAudience: 'Freelancers, Students, Remote Professionals',
    tutorialContent: {
      overview:
        'Freelancing offers flexible income when you treat it like a real micro-business with clear written scopes and milestone invoicing.',
      steps: [
        {
          title: '1. Put Scope & Revisions in Writing Before Starting',
          content:
            'Always confirm deliverables, number of included revisions (e.g., 2 rounds), delivery dates, and payment schedule in an email before doing work.'
        }
      ],
      exercises: [
        'Draft a 1-paragraph freelance proposal for a ₹5,000 logo or landing-page project including 2 revision rounds and 50/50 payment milestones.'
      ],
      knowledgeChecks: [
        {
          question: 'Why should freelancers specify a fixed number of revision rounds in a proposal?',
          options: [
            'To avoid delivering good work',
            'To prevent endless unpaid scope creep while setting fair expectations for both sides',
            'Because clients dislike timelines',
            'To double invoice taxes'
          ],
          answerIndex: 1,
          explanation: 'Clear revision boundaries protect your schedule and keep feedback focused.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-aptitude-placement-drill',
    title: 'Placement Aptitude Bootcamp: Percentages, Ratios & Logical Puzzles',
    description:
      'Sharpen speed and accuracy for Indian campus and corporate aptitude screens covering percentage change, ratios, averages, speed-distance, and syllogisms.',
    duration: '45 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Quantitative Aptitude',
    skillsGained: ['Quantitative Aptitude', 'Logical Reasoning', 'Numerical Reasoning'],
    learningObjectives: [
      'Solve percentage, discount, and profit/loss problems mentally in under 45 seconds',
      'Avoid classic syllogism and ratio traps under time pressure'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'NCS Placement & Aptitude Preparation',
    targetAudience: 'College Students, Freshers, Competitive Exam Aspirants',
    tutorialContent: {
      overview:
        'Aptitude rounds test calm structured thinking under a clock. Mastering fraction-to-percentage shortcuts (`1/4 = 25%`, `1/8 = 12.5%`, `1/6 = 16.67%`) saves huge time.',
      steps: [
        {
          title: '1. Fraction–Percentage Shortcut Table',
          content:
            'Memorize 1/2 (50%), 1/3 (33.3%), 1/4 (25%), 1/5 (20%), 1/8 (12.5%) so discounts and percentage increases become instant one-step arithmetic.'
        },
        {
          title: '2. Venn Diagrams for Syllogisms',
          content:
            'Draw quick minimal Venn diagrams to check whether a conclusion MUST hold in every valid case—never assume "Some A are B" means "All A are B".'
        }
      ],
      exercises: [
        'Solve 10 timed percentage & ratio problems in 8 minutes and review every missed step.',
        'Take the SETU Logical Reasoning and Quantitative Aptitude assessments to benchmark your score.'
      ],
      knowledgeChecks: [
        {
          question: 'If a product price rises from ₹400 to ₹500, what is the percentage increase?',
          options: ['20%', '25%', '30%', '100%'],
          answerIndex: 1,
          explanation: 'Increase = ₹100; (100 / 400) × 100 = 25%.'
        }
      ]
    }
  },

  // ==================== EXTRA SKILL-BUILDING & LEARNING PATHS (6) ====================
  {
    slug: 'tutorial-problem-solving-root-cause',
    title: 'Structured Problem Solving: 5 Whys, Issue Trees & Decision Matrices',
    description:
      'Break messy workplace problems into clear root causes, compare trade-offs objectively, and present crisp recommendations to managers.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Intermediate',
    skillTag: 'Problem Solving',
    skillsGained: ['Problem Solving', 'Critical Thinking', 'Leadership'],
    learningObjectives: [
      'Separate root causes from surface symptoms with the 5 Whys',
      'Compare competing options using a transparent weighted decision matrix'
    ],
    contentUrl: 'https://www.pmi.org/learning',
    contentSourceLabel: 'PMI Problem Solving & Decision Resources',
    targetAudience: 'Analysts, Coordinators, Aspiring Leads',
    tutorialContent: {
      overview:
        'Managers value teammates who bring clear diagnosis and 2 evaluated options rather than raw complaints.',
      steps: [
        {
          title: '1. Diagnose Before Prescribing',
          content:
            'Apply the 5 Whys to trace why orders shipped late or why users dropped off a form before proposing software or process changes.'
        }
      ],
      exercises: [
        'Run a 5 Whys analysis on one bottleneck from a college project or workplace task.',
        'Build a 3-option Decision Matrix scored on Cost, Speed, and Reliability.'
      ],
      knowledgeChecks: [
        {
          question: 'What is the main goal of the 5 Whys exercise?',
          options: [
            'Blaming 5 teammates',
            'Uncovering the underlying root cause of a recurring problem',
            'Canceling a project',
            'Skipping testing'
          ],
          answerIndex: 1,
          explanation: 'Iterative questioning reveals systemic causes so fixes actually stick.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-leadership-feedback-delegation',
    title: 'Leadership & Teamwork: Delegation, Feedback & Inclusive Collaboration',
    description:
      'Lead peers and project teams with clarity—running short standups, giving kind direct feedback, and building psychological safety.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Business',
    difficulty: 'Intermediate',
    skillTag: 'Leadership',
    skillsGained: ['Leadership', 'Teamwork', 'Communication Skills'],
    learningObjectives: [
      'Delegate with clear outcomes and decision boundaries',
      'Deliver SBI (Situation–Behavior–Impact) feedback respectfully'
    ],
    contentUrl: 'https://www.pmi.org/learning',
    contentSourceLabel: 'PMI Team Leadership Guides',
    targetAudience: 'Team Leads, Project Coordinators, Club Leaders',
    tutorialContent: {
      overview:
        'Leadership starts long before a manager title—it shows up whenever you clarify confusion, unblock a teammate, and own shared outcomes.',
      steps: [
        {
          title: '1. S.B.I. Constructive Feedback',
          content:
            'Describe the **S**ituation (when/where), observable **B**ehavior (what happened, never personal labels), and **I**mpact (effect on team/user), then ask how to improve together.'
        }
      ],
      exercises: [
        'Rewrite a blunt criticism ("You are always disorganized") into a constructive S.B.I. feedback script.'
      ],
      knowledgeChecks: [
        {
          question: 'What does psychological safety enable inside a high-performing team?',
          options: [
            'Hiding mistakes forever',
            'Raising risks early, asking questions, and learning openly without fear of humiliation',
            'Eliminating all deadlines',
            'Working in total silence'
          ],
          answerIndex: 1,
          explanation: 'Teams with psychological safety catch bugs and blockers far earlier.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-time-management-deep-work',
    title: 'Time Management: Eisenhower Matrix, Time-Blocking & Deep Work',
    description:
      'Beat overwhelm and meet deadlines reliably by prioritizing high-impact work, eliminating context-switching, and adding realistic buffers.',
    duration: '30 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Time Management',
    skillsGained: ['Time Management', 'Project Management'],
    learningObjectives: [
      'Sort weekly work into Urgent/Important quadrants',
      'Protect 90-minute distraction-free blocks for high-focus tasks'
    ],
    contentUrl: 'https://www.pmi.org/learning',
    contentSourceLabel: 'Productivity & Planning Reference',
    targetAudience: 'Students, Remote Workers, Busy Professionals',
    tutorialContent: {
      overview:
        'Great time management is not doing everything—it is protecting focused energy for the 20% of tasks that drive 80% of your career progress.',
      steps: [
        {
          title: '1. Schedule Quadrant 2 Work First',
          content:
            'Skill building, portfolio projects, and exam prep are Important but rarely scream Urgent—block them on your calendar before small interruptions take over.'
        }
      ],
      exercises: [
        'Write tomorrow’s Top 3 Must-Do tasks and assign each a 45–90 minute time block.'
      ],
      knowledgeChecks: [
        {
          question: 'Why does rapid multitasking usually hurt complex work?',
          options: [
            'Context-switching creates cognitive drag and increases errors',
            'It finishes tasks instantly',
            'It improves memory',
            'It removes deadlines'
          ],
          answerIndex: 0,
          explanation: 'Single-tasking in focused intervals yields higher quality in less total time.'
        }
      ]
    }
  },
  {
    slug: 'assignment-data-storytelling-brief',
    title: 'Skill-Building Exercise: 1-Page Executive Data Insight Brief',
    description:
      'Translate raw numbers from any dataset into a 1-page executive insight memo featuring a clear headline, 3 findings, and 2 actionable recommendations.',
    duration: '1 hour',
    type: 'practical_assignment',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'Data Analysis',
    skillsGained: ['Data Analysis', 'Communication Skills', 'Critical Thinking'],
    learningObjectives: [
      'Communicate analytical findings cleanly to non-technical decision-makers',
      'Distinguish observed correlation from unproven causation'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/excel',
    contentSourceLabel: 'Data Analysis Reporting Guide',
    assignmentBrief: 'Write a 1-page insight memo with 3 data-backed findings and 2 recommendations.',
    targetAudience: 'Aspiring Data & Business Analysts',
    assignmentDetails: {
      objective: 'Prove you can turn spreadsheet/SQL outputs into crisp business decisions.',
      instructions: [
        'Use data from your Excel Budget/Sales assignment or a public Indian open dataset (e.g., data.gov.in).',
        'Write a 1-sentence Executive Headline, 3 bulleted data findings (with exact numbers), 1 caveat/limitation, and 2 concrete next-step recommendations.'
      ],
      deliverables: ['1-page executive insight brief (doc link or structured text)'],
      submissionRequirements: 'Paste your structured insight brief below or share a viewable document URL (`https://...`).',
      evaluationCriteria: [
        'Headline states the main takeaway immediately',
        'Every finding cites concrete numbers accurately',
        'Honest about limitations without claiming unsupported causation'
      ]
    }
  },
  {
    slug: 'path-entrepreneurship-msme',
    title: 'Learning Path: Launch & Grow a Micro-Business or Freelance Practice',
    description:
      'A practical 5-week roadmap covering customer validation, unit pricing, Canva branding, digital marketing, Udyam registration, and MUDRA/Stand-Up India readiness.',
    duration: '5 weeks',
    type: 'learning_path',
    category: 'Business',
    difficulty: 'Beginner',
    skillTag: 'Entrepreneurship',
    skillsGained: ['Entrepreneurship', 'Canva', 'Digital Marketing', 'Financial Literacy'],
    learningObjectives: [
      'Validate an offering and calculate break-even profitability',
      'Build cohesive brand graphics and a 2-week customer acquisition plan',
      'Review official MSME, PM MUDRA, and Stand-Up India scheme criteria'
    ],
    contentUrl: 'https://www.startupindia.gov.in/',
    contentSourceLabel: 'Startup India & MSME Learning Resources',
    targetAudience: 'Aspiring Founders, Women Entrepreneurs, Freelancers, Artisans',
    learningPathSteps: [
      {
        title: 'Stage 1: Idea Validation & Unit Economics',
        summary: 'Complete the Entrepreneurship tutorial and submit your 1-Page Business & Pricing Plan.',
        duration: 'Week 1–2'
      },
      {
        title: 'Stage 2: Brand Identity & Customer Outreach',
        summary: 'Design your 3-piece Canva brand kit and schedule your 2-week social media campaign.',
        duration: 'Week 3–4'
      },
      {
        title: 'Stage 3: Formal Registration & Official Scheme Exploration',
        summary: 'Review Udyam MSME registration, PM MUDRA, Stand-Up India, or PM Vishwakarma in SETU Schemes and pass the Entrepreneurship assessment.',
        duration: 'Week 5'
      }
    ]
  },
  {
    slug: 'path-ai-digital-fluency',
    title: 'Learning Path: AI-Ready Modern Office & Operations Professional',
    description:
      'Master digital safety, Excel analytics, responsible AI prompting, customer service, and business communication for high-demand remote & hybrid roles.',
    duration: '4 weeks',
    type: 'learning_path',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Digital Literacy',
    skillsGained: ['Digital Literacy', 'Excel', 'Artificial Intelligence', 'Communication Skills'],
    learningObjectives: [
      'Work safely and efficiently with cloud tools, spreadsheets, and AI assistants',
      'Earn verified badges in Digital Literacy, Excel, AI Fundamentals, and Communication'
    ],
    contentUrl: 'https://www.skillindiadigital.gov.in/',
    contentSourceLabel: 'Skill India Digital Hub',
    targetAudience: 'Students, Career Restarters, Operations & Remote Support Seekers',
    learningPathSteps: [
      {
        title: 'Stage 1: Digital Safety, Cloud Hygiene & Computer Basics',
        summary: 'Complete Digital Literacy training, organize your Cloud Career Kit, and pass the Digital Literacy assessment.',
        duration: 'Week 1'
      },
      {
        title: 'Stage 2: Excel Dashboards & Responsible AI Prompting',
        summary: 'Complete the Excel & AI Prompt Engineering tutorials and submit the Monthly Budget Tracker assignment.',
        duration: 'Week 2–3'
      },
      {
        title: 'Stage 3: Resume, Interviews & Employer Applications',
        summary: 'Audit your 1-page ATS resume, build your 5-story STAR playbook, and start applying to matched roles!',
        duration: 'Week 4'
      }
    ]
  }
];
