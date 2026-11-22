import { SeedAssessment } from './assessmentsTechnical';

export const NON_TECHNICAL_ASSESSMENTS: SeedAssessment[] = [
  // ==================== PROFESSIONAL (11) ====================
  {
    slug: 'communication-skills',
    title: 'Communication Skills Assessment',
    category: 'Professional',
    domain: 'Communication',
    description:
      'Measure clarity in written and verbal communication, active listening, structured messaging, and audience adaptation.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Communication Skills'],
    timed: true,
    questions: [
      {
        id: 'comm-1',
        question: 'What is the most effective behavior during active listening in a meeting?',
        options: [
          'Interrupting quickly to offer your solution',
          'Paraphrasing key points and asking clarifying questions after the speaker finishes',
          'Checking notifications while nodding',
          'Changing the topic to your own achievements'
        ],
        correctAnswerIndex: 1,
        explanation: 'Active listening demonstrates comprehension through paraphrasing and thoughtful follow-up questions.',
        skillTested: 'Active Listening'
      },
      {
        id: 'comm-2',
        question: 'What makes a professional email subject line most effective?',
        options: [
          'Leaving it blank',
          'Writing "URGENT!!!" with no details',
          'Stating the topic and required action concisely (e.g., "Action Needed: Q3 Budget Approval by Friday")',
          'Copying the entire email body into the subject'
        ],
        correctAnswerIndex: 2,
        explanation: 'A clear, action-oriented subject line helps recipients prioritize and retrieve emails quickly.',
        skillTested: 'Written Communication'
      },
      {
        id: 'comm-3',
        question: 'When presenting complex technical findings to non-technical stakeholders, you should:',
        options: [
          'Use dense jargon to sound authoritative',
          'Focus on business impact, plain-language summaries, and clear visual takeaways',
          'Skip explaining recommendations',
          'Read raw spreadsheet cells aloud'
        ],
        correctAnswerIndex: 1,
        explanation: 'Tailoring language to the audience ensures understanding and faster decision-making.',
        skillTested: 'Audience Adaptation'
      },
      {
        id: 'comm-4',
        question: 'Which approach delivers constructive feedback most effectively?',
        options: [
          'Criticizing the person’s character publicly',
          'Focusing on specific observable behaviors, impact, and actionable next steps privately',
          'Waiting a year before mentioning recurring issues',
          'Giving only vague remarks like "Do better"'
        ],
        correctAnswerIndex: 1,
        explanation: 'Specific, behavior-focused, timely feedback helps teammates improve without defensiveness.',
        skillTested: 'Feedback Delivery'
      },
      {
        id: 'comm-5',
        question: 'What is the benefit of summarizing agreed action items at the end of a discussion?',
        options: [
          'It lengthens meetings unnecessarily',
          'It confirms shared understanding of owners and deadlines',
          'It replaces project documentation completely',
          'It avoids assigning responsibility'
        ],
        correctAnswerIndex: 1,
        explanation: 'Recapping owners and due dates prevents ambiguity and missed handoffs.',
        skillTested: 'Structured Communication'
      }
    ]
  },
  {
    slug: 'english-proficiency',
    title: 'English Proficiency & Business Writing',
    category: 'Professional',
    domain: 'English Proficiency',
    description:
      'Evaluate grammar accuracy, vocabulary in context, professional tone, sentence clarity, and workplace English comprehension.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['English Proficiency', 'Business Writing'],
    timed: true,
    questions: [
      {
        id: 'eng-1',
        question: 'Choose the grammatically correct sentence:',
        options: [
          'Neither the manager nor the employees was informed.',
          'Neither the manager nor the employees were informed.',
          'Neither the manager or the employees were informed.',
          'Neither the manager nor the employees is informed.'
        ],
        correctAnswerIndex: 1,
        explanation: 'With "neither...nor", the verb agrees with the nearer subject ("employees" → plural "were").',
        skillTested: 'English Grammar'
      },
      {
        id: 'eng-2',
        question: 'Choose the closest synonym for "METICULOUS":',
        options: ['Careless', 'Thorough', 'Hasty', 'Vague'],
        correctAnswerIndex: 1,
        explanation: 'Meticulous means showing great attention to detail and being thorough.',
        skillTested: 'Vocabulary'
      },
      {
        id: 'eng-3',
        question: 'Fill in the blank: "She has been leading the customer support team _____ 2023."',
        options: ['for', 'since', 'from', 'during'],
        correctAnswerIndex: 1,
        explanation: 'Use "since" with a specific starting point in time and "for" with a duration.',
        skillTested: 'Prepositions & Tenses'
      },
      {
        id: 'eng-4',
        question: 'Which sentence is clearest and most professional for a client update?',
        options: [
          'Due to the fact that the server went down, we could not send the file.',
          'Because the server was temporarily offline, we will send the file by 3 PM today.',
          'Server down so file late sorry.',
          'Owing to the occurrence of server unavailability, file transmission did not transpire.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Clear, polite, concise sentences with a specific delivery time build client confidence.',
        skillTested: 'Business Writing'
      },
      {
        id: 'eng-5',
        question: 'Choose the correct word: "Your portfolio will positively _____ the hiring panel."',
        options: ['affect', 'effect', 'afflict', 'infect'],
        correctAnswerIndex: 0,
        explanation: '"Affect" is typically a verb meaning to influence; "effect" is usually a noun meaning a result.',
        skillTested: 'Word Usage'
      }
    ]
  },
  {
    slug: 'interview-preparation',
    title: 'Interview Preparation & Behavioral Readiness',
    category: 'Professional',
    domain: 'Interview Preparation',
    description:
      'Assess STAR storytelling, company research, handling tough interview questions, salary discussions, and post-interview follow-up.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Interview Preparation', 'Workplace Communication'],
    timed: true,
    questions: [
      {
        id: 'int-1',
        question: 'What does the STAR method stand for in behavioral interviews?',
        options: [
          'Situation, Task, Action, Result',
          'Salary, Title, Age, Role',
          'Study, Test, Apply, Repeat',
          'Summary, Theory, Assumption, Review'
        ],
        correctAnswerIndex: 0,
        explanation: 'STAR organizes real examples clearly around context, responsibility, actions taken, and measurable outcomes.',
        skillTested: 'STAR Storytelling'
      },
      {
        id: 'int-2',
        question: 'When an interviewer asks "Tell me about yourself", what is the strongest structure?',
        options: [
          'Recite your entire life history from primary school',
          'A concise 60–90 second summary covering your current background, key relevant skills/projects, and why this role excites you',
          'Say "Everything is already on my resume"',
          'List unrelated personal hobbies only'
        ],
        correctAnswerIndex: 1,
        explanation: 'A focused Present → Past highlights → Future fit pitch immediately aligns you with the role.',
        skillTested: 'Self-Introduction'
      },
      {
        id: 'int-3',
        question: 'How should you respond when asked about a weakness or mistake from a past project?',
        options: [
          'Claim you have zero weaknesses',
          'Share a genuine past learning area and highlight the concrete steps you took to improve it',
          'Blame your former classmates or manager',
          'Refuse to answer'
        ],
        correctAnswerIndex: 1,
        explanation: 'Self-awareness paired with measurable improvement shows maturity and coachability.',
        skillTested: 'Behavioral Questions'
      },
      {
        id: 'int-4',
        question: 'When the interviewer asks "Do you have any questions for us?", what is the best response?',
        options: [
          'Say "No, nothing at all"',
          'Ask thoughtful questions about the team’s goals, first-90-day success metrics, or learning opportunities',
          'Ask what the company does because you didn’t read the website',
          'End the call immediately'
        ],
        correctAnswerIndex: 1,
        explanation: 'Informed questions prove genuine interest and help you evaluate whether the role fits you.',
        skillTested: 'Interview Engagement'
      },
      {
        id: 'int-5',
        question: 'What is a smart step to take within 24 hours after an interview?',
        options: [
          'Send 10 repeated messages every hour',
          'Send a brief, polite thank-you note reiterating your interest and a key point from the conversation',
          'Withdraw your application immediately',
          'Forget the company name'
        ],
        correctAnswerIndex: 1,
        explanation: 'A concise thank-you message reinforces professionalism and keeps your conversation memorable.',
        skillTested: 'Interview Follow-Up'
      }
    ]
  },
  {
    slug: 'resume-writing',
    title: 'Resume Writing & ATS Optimization',
    category: 'Professional',
    domain: 'Resume Writing',
    description:
      'Test ATS-friendly resume structure, action verbs, quantifiable impact bullets, tailoring to job descriptions, and avoiding common pitfalls.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Resume Writing', 'Career Preparation'],
    timed: true,
    questions: [
      {
        id: 'res-1',
        question: 'Which resume bullet point communicates impact most effectively to a recruiter?',
        options: [
          'Responsible for social media posts',
          'Designed 24 Canva campaign graphics and grew Instagram workshop registrations by 35% in 2 months',
          'Did various marketing stuff for team',
          'Worked hard every day'
        ],
        correctAnswerIndex: 1,
        explanation: 'Strong action verbs + specific tools + measurable results prove concrete value.',
        skillTested: 'Impact Quantification'
      },
      {
        id: 'res-2',
        question: 'Why should you keep resume formatting clean with standard headings (Education, Skills, Projects, Experience)?',
        options: [
          'Applicant Tracking Systems (ATS) and busy recruiters can parse clean layouts accurately in seconds',
          'Complex multi-column tables and heavy icons are required by law',
          'Clean layouts hide your skills',
          'Resumes must be 8 pages long'
        ],
        correctAnswerIndex: 0,
        explanation: 'ATS parsers often scramble graphics-heavy tables; clean single-column hierarchy ensures nothing is lost.',
        skillTested: 'ATS Compatibility'
      },
      {
        id: 'res-3',
        question: 'What is the recommended resume length for most students and early-career candidates (0–5 years experience)?',
        options: ['1 page (concise and tailored)', '5–6 pages', 'Half a paragraph', '10 pages with full essays'],
        correctAnswerIndex: 0,
        explanation: 'A crisp 1-page resume showcases your strongest relevant qualifications without diluting focus.',
        skillTested: 'Resume Structure'
      },
      {
        id: 'res-4',
        question: 'If you are a fresher with no full-time corporate experience yet, what should you highlight prominently?',
        options: [
          'Leave the resume completely blank',
          'Practical projects, internships, verified skill assessments, volunteer leadership, and academic coursework',
          'Invent fake company names',
          'Only your street address'
        ],
        correctAnswerIndex: 1,
        explanation: 'Real projects, practical assignments, and verified skills demonstrate job readiness honestly.',
        skillTested: 'Fresher Resume Strategy'
      },
      {
        id: 'res-5',
        question: 'Which file format and filename is best when emailing your resume?',
        options: [
          'resume_final_v2_edit.docx',
          'Asha_Verma_Data_Analyst_Resume.pdf',
          'IMG_4829.jpg',
          'notes.txt'
        ],
        correctAnswerIndex: 1,
        explanation: 'A PDF named with your name and target role preserves formatting and is easy for recruiters to find.',
        skillTested: 'Professional Presentation'
      }
    ]
  },
  {
    slug: 'problem-solving',
    title: 'Problem Solving Assessment',
    category: 'Professional',
    domain: 'Problem Solving',
    description:
      'Test root-cause analysis, structured decomposition, hypothesis testing, and pragmatic decision-making.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Problem Solving'],
    timed: true,
    questions: [
      {
        id: 'ps-1',
        question: 'What is the purpose of the "5 Whys" technique?',
        options: [
          'Assigning blame to five people',
          'Iteratively asking why an issue occurred to uncover its underlying root cause',
          'Generating five marketing slogans',
          'Extending project timelines by five days'
        ],
        correctAnswerIndex: 1,
        explanation: 'Asking "Why?" iteratively moves beyond surface symptoms to systemic root causes.',
        skillTested: 'Root Cause Analysis'
      },
      {
        id: 'ps-2',
        question: 'When faced with a large, ambiguous problem, what is the best first step?',
        options: [
          'Start implementing the first guess immediately',
          'Clarify the problem statement, constraints, and break it into smaller verifiable sub-problems',
          'Ignore the constraints',
          'Copy an unrelated solution without testing'
        ],
        correctAnswerIndex: 1,
        explanation: 'Problem framing and decomposition prevent wasted effort on the wrong problem.',
        skillTested: 'Structured Decomposition'
      },
      {
        id: 'ps-3',
        question: 'Why is validating a small prototype or pilot useful before a full rollout?',
        options: [
          'It eliminates the need for users',
          'It tests key assumptions early at low cost and reveals unexpected issues',
          'It guarantees zero bugs forever',
          'It delays delivery without benefit'
        ],
        correctAnswerIndex: 1,
        explanation: 'Small experiments produce real evidence quickly while limiting downside risk.',
        skillTested: 'Iterative Validation'
      },
      {
        id: 'ps-4',
        question: 'When comparing three candidate solutions with trade-offs in cost, speed, and quality, what tool helps make a transparent choice?',
        options: [
          'Flipping a coin',
          'A weighted decision matrix evaluating each option against agreed criteria',
          'Picking the most expensive option automatically',
          'Ignoring long-term maintenance costs'
        ],
        correctAnswerIndex: 1,
        explanation: 'A decision matrix makes trade-offs explicit and defensible.',
        skillTested: 'Decision Analysis'
      },
      {
        id: 'ps-5',
        question: 'After implementing a fix for a recurring operational error, what completes the problem-solving cycle?',
        options: [
          'Immediately forgetting about it',
          'Monitoring results to verify the fix worked and documenting preventive steps',
          'Deleting all logs',
          'Disabling error alerts'
        ],
        correctAnswerIndex: 1,
        explanation: 'Verification and documentation confirm resolution and stop recurrence.',
        skillTested: 'Verification & Learning'
      }
    ]
  },
  {
    slug: 'project-management',
    title: 'Project Management Fundamentals',
    category: 'Professional',
    domain: 'Project Management',
    description:
      'Assess project scope, milestones, risk management, Agile/Scrum concepts, and stakeholder communication.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Project Management'],
    timed: true,
    questions: [
      {
        id: 'pm-1',
        question: 'What is "scope creep" in project management?',
        options: [
          'Finishing ahead of schedule',
          'Uncontrolled expansion of project requirements without corresponding adjustments to time, cost, or resources',
          'Reducing unnecessary features',
          'Holding a project retrospective'
        ],
        correctAnswerIndex: 1,
        explanation: 'Scope creep threatens timelines and budgets when changes are absorbed without formal trade-offs.',
        skillTested: 'Scope Control'
      },
      {
        id: 'pm-2',
        question: 'What are the three classic constraints of the Project Management "Iron Triangle"?',
        options: [
          'Scope, Time, and Cost (affecting Quality)',
          'Sales, Marketing, and Legal',
          'HTML, CSS, and JavaScript',
          'Hiring, Payroll, and Leave'
        ],
        correctAnswerIndex: 0,
        explanation: 'Changes in scope, schedule (time), or budget (cost) directly affect one another and quality.',
        skillTested: 'Project Constraints'
      },
      {
        id: 'pm-3',
        question: 'What is the purpose of a Project Risk Register?',
        options: [
          'Tracking employee attendance',
          'Documenting potential risks, their likelihood, impact, owners, and mitigation plans',
          'Listing completed invoices',
          'Storing design logos'
        ],
        correctAnswerIndex: 1,
        explanation: 'A risk register helps teams proactively monitor and mitigate threats before they derail delivery.',
        skillTested: 'Risk Management'
      },
      {
        id: 'pm-4',
        question: 'In Agile Scrum, what is the primary goal of a Sprint Retrospective?',
        options: [
          'Demoing features to external customers',
          'Reflecting on how the team worked and identifying concrete process improvements for the next sprint',
          'Assigning blame for bugs',
          'Writing annual budgets'
        ],
        correctAnswerIndex: 1,
        explanation: 'Retrospectives drive continuous improvement in team practices and collaboration.',
        skillTested: 'Agile Practices'
      },
      {
        id: 'pm-5',
        question: 'What does a Work Breakdown Structure (WBS) accomplish?',
        options: [
          'Decomposes total project deliverables into manageable, assignable work packages',
          'Replaces all team communication',
          'Eliminates project budgets',
          'Tracks office supplies'
        ],
        correctAnswerIndex: 0,
        explanation: 'A WBS organizes all deliverables hierarchically for accurate planning and tracking.',
        skillTested: 'Project Planning'
      }
    ]
  },
  {
    slug: 'entrepreneurship',
    title: 'Entrepreneurship & Small Business Foundations',
    category: 'Professional',
    domain: 'Entrepreneurship',
    description:
      'Evaluate customer discovery, unit economics, pricing, cash-flow discipline, MVP validation, and MSME registration basics.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Entrepreneurship', 'Business Planning'],
    timed: true,
    questions: [
      {
        id: 'ent-1',
        question: 'What is a Minimum Viable Product (MVP)?',
        options: [
          'The most expensive version of a product',
          'The simplest working version of a product built to test real customer demand and gather feedback quickly',
          'A business logo only',
          'A 100-page theoretical report with no customers'
        ],
        correctAnswerIndex: 1,
        explanation: 'An MVP validates whether customers genuinely value and pay for a solution before heavy investment.',
        skillTested: 'Customer Validation'
      },
      {
        id: 'ent-2',
        question: 'If a handmade bag costs ₹320 in materials and packaging to produce and sells for ₹500, what is the gross profit per unit?',
        options: ['₹120', '₹180', '₹200', '₹320'],
        correctAnswerIndex: 1,
        explanation: 'Gross profit per unit = Selling Price (₹500) − Direct Cost (₹320) = ₹180.',
        skillTested: 'Unit Economics'
      },
      {
        id: 'ent-3',
        question: 'Why should small business owners separate their business bank account from personal expenses?',
        options: [
          'It is only for giant corporations',
          'It keeps cash flow transparent, simplifies tax/GST filing, and builds credibility for MUDRA/bank loans',
          'It doubles bank fees',
          'It hides revenue'
        ],
        correctAnswerIndex: 1,
        explanation: 'Clean financial separation helps track real profitability and prepares you for formal credit.',
        skillTested: 'Financial Hygiene'
      },
      {
        id: 'ent-4',
        question: 'What does Udyam Registration provide to eligible micro, small, and medium enterprises in India?',
        options: [
          'Official MSME recognition enabling access to priority-sector credit and government MSME schemes',
          'Guaranteed stock market listing',
          'Free office buildings automatically',
          'Exemption from keeping accounts'
        ],
        correctAnswerIndex: 0,
        explanation: 'Free online Udyam Registration officially recognizes MSMEs for credit and government support programs.',
        skillTested: 'MSME Ecosystem'
      },
      {
        id: 'ent-5',
        question: 'What is "break-even point" for a new business?',
        options: [
          'The day the website launches',
          'The sales volume where total revenue equals total fixed plus variable costs (zero profit, zero loss)',
          'When all inventory is given away free',
          'The first social media follower'
        ],
        correctAnswerIndex: 1,
        explanation: 'Knowing your break-even volume tells you the minimum monthly sales needed to sustain operations.',
        skillTested: 'Business Finance'
      }
    ]
  },
  {
    slug: 'customer-service',
    title: 'Customer Service & Client Support Excellence',
    category: 'Professional',
    domain: 'Customer Service',
    description:
      'Test empathy, de-escalation, first-contact resolution, SLA prioritization, and clear customer communication.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Customer Service', 'Communication Skills'],
    timed: true,
    questions: [
      {
        id: 'cs-1',
        question: 'An upset customer calls because their order arrived damaged. What should you do FIRST?',
        options: [
          'Argue that the courier is responsible',
          'Listen calmly, acknowledge their frustration with empathy, and apologize for the inconvenience',
          'Transfer them immediately without speaking',
          'Ask them to read the terms and conditions'
        ],
        correctAnswerIndex: 1,
        explanation: 'Empathy and ownership immediately de-escalate tension and set up a constructive resolution.',
        skillTested: 'De-escalation & Empathy'
      },
      {
        id: 'cs-2',
        question: 'What does First Contact Resolution (FCR) measure in customer support?',
        options: [
          'How fast a rep hangs up',
          'The percentage of customer issues fully resolved on the first interaction without needing follow-ups',
          'Total number of complaints received',
          'How many transfers occurred'
        ],
        correctAnswerIndex: 1,
        explanation: 'High FCR indicates thorough, accurate support that saves customers time.',
        skillTested: 'Support Metrics'
      },
      {
        id: 'cs-3',
        question: 'If you do not immediately know the answer to a technical customer question, what is the most trustworthy response?',
        options: [
          'Guess an answer confidently',
          'Politely let the customer know you will verify with the specialist team and confirm a specific time you will follow up',
          'Ignore the ticket until it closes',
          'Tell them to search online themselves'
        ],
        correctAnswerIndex: 1,
        explanation: 'Honesty plus a clear follow-up commitment builds long-term customer trust.',
        skillTested: 'Professional Accountability'
      },
      {
        id: 'cs-4',
        question: 'Why is logging clear ticket notes in a CRM/helpdesk system important?',
        options: [
          'So customers do not have to repeat their story if another agent assists later',
          'It only increases typing work',
          'It replaces resolving the issue',
          'It is never read again'
        ],
        correctAnswerIndex: 0,
        explanation: 'Accurate CRM records ensure seamless handoffs and reveal recurring product issues.',
        skillTested: 'CRM Documentation'
      },
      {
        id: 'cs-5',
        question: 'When closing a resolved support ticket, what adds a great finishing touch?',
        options: [
          'Closing silently with no message',
          'Confirming the solution worked, summarizing what was done, and asking if they need anything else',
          'Sending a wall of legal text',
          'Using all-caps warnings'
        ],
        correctAnswerIndex: 1,
        explanation: 'Confirming satisfaction prevents reopened tickets and leaves a positive brand impression.',
        skillTested: 'Customer Satisfaction'
      }
    ]
  },
  {
    slug: 'leadership-essentials',
    title: 'Leadership Essentials Assessment',
    category: 'Professional',
    domain: 'Leadership',
    description:
      'Evaluate delegation, accountability, coaching mindset, conflict resolution, and inclusive team leadership.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Leadership'],
    timed: true,
    questions: [
      {
        id: 'lead-1',
        question: 'What characterizes effective delegation?',
        options: [
          'Assigning tasks with clear goals, authority, support, and expected outcomes',
          'Micromanaging every keystroke after delegating',
          'Handing off unclear work with no context',
          'Keeping all critical work to yourself'
        ],
        correctAnswerIndex: 0,
        explanation: 'Effective delegation pairs clear expectations and empowerment with appropriate check-ins.',
        skillTested: 'Delegation'
      },
      {
        id: 'lead-2',
        question: 'How should a leader respond when a team misses a milestone due to an unforeseen blocker?',
        options: [
          'Blame the junior-most team member publicly',
          'Facilitate a blameless root-cause review, adjust the plan, and remove blockers',
          'Hide the delay from stakeholders until launch day',
          'Cancel all future standups'
        ],
        correctAnswerIndex: 1,
        explanation: 'Blameless problem-solving fosters psychological safety and transparent risk recovery.',
        skillTested: 'Accountability & Resilience'
      },
      {
        id: 'lead-3',
        question: 'When two teammates disagree sharply on a technical approach, a strong leader:',
        options: [
          'Ignores the conflict hoping it disappears',
          'Guides both sides to evaluate options against shared criteria and user impact',
          'Always sides with the louder voice',
          'Forbids technical debates'
        ],
        correctAnswerIndex: 1,
        explanation: 'Objective criteria shift disagreements from personal friction to collaborative decision-making.',
        skillTested: 'Conflict Resolution'
      },
      {
        id: 'lead-4',
        question: 'Which habit builds high trust within a diverse team?',
        options: [
          'Taking credit for team wins personally',
          'Following through on commitments and recognizing others’ contributions openly',
          'Withholding context about project goals',
          'Changing priorities silently without informing the team'
        ],
        correctAnswerIndex: 1,
        explanation: 'Reliability, transparency, and fair recognition are foundational to leadership trust.',
        skillTested: 'Team Trust'
      },
      {
        id: 'lead-5',
        question: 'What is psychological safety in a workplace team?',
        options: [
          'Never having deadlines',
          'A shared belief that members can ask questions, admit mistakes, and share ideas without fear of humiliation',
          'Working completely independently',
          'Avoiding all performance reviews'
        ],
        correctAnswerIndex: 1,
        explanation: 'Psychological safety encourages early error reporting, learning, and innovation.',
        skillTested: 'Inclusive Leadership'
      }
    ]
  },
  {
    slug: 'teamwork-collaboration',
    title: 'Teamwork & Workplace Collaboration',
    category: 'Professional',
    domain: 'Teamwork',
    description:
      'Assess cross-functional collaboration, reliability, shared ownership, and constructive peer interaction.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Teamwork'],
    timed: true,
    questions: [
      {
        id: 'team-1',
        question: 'You notice a teammate is overloaded before a shared release deadline while you have extra bandwidth. What is the best action?',
        options: [
          'Wait until they miss the deadline',
          'Proactively offer to take over a well-defined piece of work or pair with them',
          'Report them without speaking to them',
          'Leave early since your own tasks are finished'
        ],
        correctAnswerIndex: 1,
        explanation: 'Shared ownership means helping unblock teammates so the team succeeds together.',
        skillTested: 'Collaborative Support'
      },
      {
        id: 'team-2',
        question: 'If you realize your deliverable will be delayed by two days, when should you notify your team?',
        options: [
          'After the deadline has already passed',
          'As soon as you identify the risk, along with a revised timeline or mitigation option',
          'Only if someone asks directly',
          'At the annual review'
        ],
        correctAnswerIndex: 1,
        explanation: 'Early communication allows dependent teammates to adjust smoothly.',
        skillTested: 'Reliability'
      },
      {
        id: 'team-3',
        question: 'In a cross-functional project with designers, engineers, and marketers, what prevents misaligned deliverables?',
        options: [
          'Working in silos until the final week',
          'Establishing shared definitions of done and regular milestone demos',
          'Avoiding written requirements',
          'Having each group pick different target users'
        ],
        correctAnswerIndex: 1,
        explanation: 'Shared milestones and clear criteria keep cross-functional teams aligned.',
        skillTested: 'Cross-Functional Alignment'
      },
      {
        id: 'team-4',
        question: 'How should you handle receiving valid constructive criticism on your work from a peer?',
        options: [
          'Dismiss it immediately',
          'Listen openly, thank them, clarify details if needed, and apply improvements',
          'Criticize their past work in return',
          'Refuse to collaborate with them again'
        ],
        correctAnswerIndex: 1,
        explanation: 'Receptiveness to feedback accelerates personal growth and strengthens peer trust.',
        skillTested: 'Growth Mindset'
      },
      {
        id: 'team-5',
        question: 'What makes asynchronous collaboration effective for hybrid or remote teams?',
        options: [
          'Sending vague one-word messages like "Hi" and waiting',
          'Writing self-contained updates with context, links, decisions needed, and timelines',
          'Expecting instant replies at midnight',
          'Never documenting decisions'
        ],
        correctAnswerIndex: 1,
        explanation: 'Complete, documented async updates reduce back-and-forth delays across schedules.',
        skillTested: 'Remote Collaboration'
      }
    ]
  },
  {
    slug: 'time-management',
    title: 'Time Management & Critical Thinking',
    category: 'Professional',
    domain: 'Time Management',
    description:
      'Evaluate prioritization frameworks, deep work habits, cognitive bias recognition, and realistic deadline estimation.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Time Management', 'Critical Thinking'],
    timed: true,
    questions: [
      {
        id: 'tm-1',
        question: 'In the Eisenhower Matrix, how should you handle tasks that are Important but Not Urgent?',
        options: [
          'Ignore them indefinitely',
          'Schedule dedicated time for them proactively so they do not become crises',
          'Do them only after all low-value distractions',
          'Delete them immediately'
        ],
        correctAnswerIndex: 1,
        explanation: 'Proactively scheduling important non-urgent work drives long-term progress and prevents emergencies.',
        skillTested: 'Prioritization'
      },
      {
        id: 'tm-2',
        question: 'Why does frequent task-switching (multitasking) typically reduce output quality?',
        options: [
          'Computers slow down when you think',
          'Context-switching introduces cognitive overhead and increases error rates',
          'It saves too much time',
          'It eliminates breaks'
        ],
        correctAnswerIndex: 1,
        explanation: 'Switching attention between complex tasks incurs mental restart costs and lowers focus.',
        skillTested: 'Focus Management'
      },
      {
        id: 'tm-3',
        question: 'What is "confirmation bias" in critical thinking?',
        options: [
          'Double-checking calculations before sending a report',
          'Favoring information that supports preexisting beliefs while discounting contradictory evidence',
          'Confirming calendar invitations',
          'Citing primary research'
        ],
        correctAnswerIndex: 1,
        explanation: 'Confirmation bias distorts decisions by filtering out evidence that challenges assumptions.',
        skillTested: 'Critical Thinking'
      },
      {
        id: 'tm-4',
        question: 'When estimating how long a multi-step deliverable will take, what is a smart practice?',
        options: [
          'Assume zero interruptions or review cycles',
          'Break it into subtasks and include a reasonable buffer for reviews and unknowns',
          'Always promise half the time you think it needs',
          'Refuse to give any estimate'
        ],
        correctAnswerIndex: 1,
        explanation: 'Bottom-up breakdown plus realistic buffers leads to trustworthy commitments.',
        skillTested: 'Estimation'
      },
      {
        id: 'tm-5',
        question: 'If your manager assigns a new high-priority request when your week is already full, you should:',
        options: [
          'Say yes silently and burn out',
          'Share your current commitments and ask which item should be reprioritized or rescheduled',
          'Ignore the new request',
          'Drop existing work without telling anyone'
        ],
        correctAnswerIndex: 1,
        explanation: 'Transparent trade-off discussions align expectations and protect quality.',
        skillTested: 'Workload Negotiation'
      }
    ]
  },

  // ==================== CREATIVE (5) ====================
  {
    slug: 'graphic-design',
    title: 'Graphic Design Fundamentals',
    category: 'Creative',
    domain: 'Graphic Design',
    description:
      'Test visual hierarchy, typography, color contrast, raster vs vector graphics, and layout alignment.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Graphic Design'],
    timed: true,
    questions: [
      {
        id: 'gd-1',
        question: 'Which file format stores scalable vector graphics that remain sharp at any size?',
        options: ['JPEG', 'PNG', 'SVG', 'BMP'],
        correctAnswerIndex: 2,
        explanation: 'SVG describes paths mathematically, allowing infinite scaling without pixelation.',
        skillTested: 'Design File Formats'
      },
      {
        id: 'gd-2',
        question: 'What is the main purpose of visual hierarchy in a poster or landing page?',
        options: [
          'Making every element the exact same size',
          'Guiding the viewer’s eye to the most important information first',
          'Using as many fonts as possible',
          'Removing all whitespace'
        ],
        correctAnswerIndex: 1,
        explanation: 'Hierarchy uses scale, contrast, and spacing to communicate priority at a glance.',
        skillTested: 'Visual Hierarchy'
      },
      {
        id: 'gd-3',
        question: 'Which color model is standard for digital screens vs commercial printing?',
        options: [
          'CMYK for screens, RGB for printing',
          'RGB for digital screens, CMYK for commercial printing',
          'Grayscale for both',
          'Hex codes for printing ink'
        ],
        correctAnswerIndex: 1,
        explanation: 'Screens emit RGB light, whereas print presses combine Cyan, Magenta, Yellow, and Key (Black) inks.',
        skillTested: 'Color Theory'
      },
      {
        id: 'gd-4',
        question: 'Why is whitespace (negative space) valuable in graphic design?',
        options: [
          'It wastes canvas space',
          'It improves readability, reduces clutter, and emphasizes focal elements',
          'It only applies to white backgrounds',
          'It hides poor alignment'
        ],
        correctAnswerIndex: 1,
        explanation: 'Intentional negative space gives designs breathing room and makes content scannable.',
        skillTested: 'Layout & Composition'
      },
      {
        id: 'gd-5',
        question: 'What does "kerning" adjust in typography?',
        options: [
          'Vertical space between lines of text',
          'Horizontal spacing between specific pairs of individual characters',
          'The background color of a page',
          'Paragraph indentation'
        ],
        correctAnswerIndex: 1,
        explanation: 'Kerning fine-tunes space between character pairs; leading controls line spacing.',
        skillTested: 'Typography'
      }
    ]
  },
  {
    slug: 'canva-design',
    title: 'Canva & Visual Content Creation',
    category: 'Creative',
    domain: 'Canva',
    description:
      'Assess practical Canva workflows: brand kits, templates, aspect ratios for social platforms, print bleeds, and export formats.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Canva', 'Graphic Design'],
    timed: true,
    questions: [
      {
        id: 'canva-1',
        question: 'Which export format in Canva preserves a transparent background for logos or overlays?',
        options: ['JPG', 'PNG (with Transparent background enabled)', 'MP4', 'TXT'],
        correctAnswerIndex: 1,
        explanation: 'PNG supports alpha transparency; JPG always flattens onto a solid background.',
        skillTested: 'Canva Export Settings'
      },
      {
        id: 'canva-2',
        question: 'Which aspect ratio is best for a vertical Instagram Reel / YouTube Short graphic?',
        options: ['16:9 (1920×1080)', '9:16 (1080×1920)', '4:1', '3:2'],
        correctAnswerIndex: 1,
        explanation: '9:16 (1080×1920 px) fills full-screen vertical mobile feeds cleanly.',
        skillTested: 'Social Media Dimensions'
      },
      {
        id: 'canva-3',
        question: 'Why should a designer use a Brand Kit (consistent fonts, hex palette, and logos) in Canva?',
        options: [
          'To slow down editing',
          'To keep every post, pitch deck, and flyer visually cohesive and recognizable',
          'To force random colors on every slide',
          'Because Canva prohibits custom colors'
        ],
        correctAnswerIndex: 1,
        explanation: 'Consistent typography and palette make a brand look polished and trustworthy across channels.',
        skillTested: 'Brand Consistency'
      },
      {
        id: 'canva-4',
        question: 'When exporting a brochure or visiting card from Canva for professional printing, which format is recommended?',
        options: ['GIF', 'PDF Print (with crop marks and bleed if full-bleed)', 'Low-res JPG', 'MP3'],
        correctAnswerIndex: 1,
        explanation: 'PDF Print exports at 300 DPI and supports bleed/crop marks for crisp physical printing.',
        skillTested: 'Print Preparation'
      },
      {
        id: 'canva-5',
        question: 'How many distinct font families should typically be paired in a clean Canva flyer or carousel?',
        options: [
          '6 to 8 different decorative fonts',
          '1 to 2 complementary fonts (e.g., one display heading font + one readable body font)',
          'A different font for every single word',
          'Only unreadable script fonts for body text'
        ],
        correctAnswerIndex: 1,
        explanation: 'Limiting designs to 1–2 well-paired fonts maintains clarity and professional hierarchy.',
        skillTested: 'Visual Hierarchy'
      }
    ]
  },
  {
    slug: 'ui-ux-fundamentals',
    title: 'UI/UX Design Fundamentals',
    category: 'Creative',
    domain: 'UI/UX Design',
    description:
      'Evaluate user research, wireframing, usability testing, accessibility (WCAG), and interaction design principles.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['UI/UX Design'],
    timed: true,
    questions: [
      {
        id: 'ux-1',
        question: 'What is the primary purpose of a low-fidelity wireframe?',
        options: [
          'Finalizing pixel-perfect brand illustrations',
          'Quickly exploring layout structure, information architecture, and user flows before visual polish',
          'Writing backend database queries',
          'Testing server uptime'
        ],
        correctAnswerIndex: 1,
        explanation: 'Low-fidelity wireframes let teams iterate cheaply on structure and flow before investing in high-fidelity visuals.',
        skillTested: 'Wireframing'
      },
      {
        id: 'ux-2',
        question: 'Why is checking WCAG color contrast ratios important in UI design?',
        options: [
          'To make websites load faster',
          'To ensure text and controls remain legible for users with low vision or color blindness',
          'To add extra animations',
          'To increase advertising clicks'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sufficient contrast makes interfaces accessible and readable for all users across lighting conditions.',
        skillTested: 'Accessibility'
      },
      {
        id: 'ux-3',
        question: 'What is the most reliable way to discover where users struggle in a product flow?',
        options: [
          'Guessing inside a conference room',
          'Observing real target users attempting realistic tasks in usability testing',
          'Asking only the developer who built it',
          'Removing user feedback forms'
        ],
        correctAnswerIndex: 1,
        explanation: 'Task-based usability testing exposes real friction points that teams often overlook.',
        skillTested: 'Usability Testing'
      },
      {
        id: 'ux-4',
        question: 'What does clear visual "affordance" (signifiers) mean in interface design?',
        options: [
          'The price of the software',
          'Visual cues that clearly signal how an element can be interacted with (e.g., buttons look clickable)',
          'Hiding navigation menus',
          'Using identical styles for headings and links'
        ],
        correctAnswerIndex: 1,
        explanation: 'Clear signifiers help users recognize interactive elements effortlessly without instructions.',
        skillTested: 'Interaction Design'
      },
      {
        id: 'ux-5',
        question: 'What is the difference between UI and UX?',
        options: [
          'They are completely unrelated fields',
          'UX covers the end-to-end user journey and usability, while UI focuses on visual and interactive interface elements',
          'UI is only for mobile and UX is only for desktop',
          'UX only means choosing fonts'
        ],
        correctAnswerIndex: 1,
        explanation: 'UX encompasses research, flows, and overall satisfaction; UI crafts the visual touchpoints within that experience.',
        skillTested: 'UX Foundations'
      }
    ]
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing Fundamentals',
    category: 'Creative',
    domain: 'Digital Marketing',
    description:
      'Assess SEO, conversion funnels, CTR/CPA metrics, audience targeting, and ethical campaign measurement.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Digital Marketing'],
    timed: true,
    questions: [
      {
        id: 'dm-1',
        question: 'What does CTR stand for in digital advertising and email campaigns?',
        options: [
          'Cost To Reach',
          'Click-Through Rate',
          'Content Transfer Ratio',
          'Customer Trust Rating'
        ],
        correctAnswerIndex: 1,
        explanation: 'CTR = (Clicks / Impressions) × 100%, measuring how compelling an ad or link is to viewers.',
        skillTested: 'Marketing Metrics'
      },
      {
        id: 'dm-2',
        question: 'Which practice improves organic Search Engine Optimization (SEO) sustainably?',
        options: [
          'Stuffing hidden repetitive keywords onto a page',
          'Publishing helpful, well-structured content matching user search intent with fast page load speeds',
          'Buying thousands of spammy links',
          'Blocking search crawlers on public pages'
        ],
        correctAnswerIndex: 1,
        explanation: 'Modern search engines reward relevant, authoritative, accessible, and fast-loading content.',
        skillTested: 'SEO Basics'
      },
      {
        id: 'dm-3',
        question: 'What is the purpose of A/B testing a landing page?',
        options: [
          'Comparing two versions with split traffic to measure which performs better on a target conversion metric',
          'Launching two unrelated brands',
          'Deleting analytics tracking',
          'Doubling page length'
        ],
        correctAnswerIndex: 0,
        explanation: 'Controlled A/B tests replace guesswork with empirical conversion data.',
        skillTested: 'Conversion Optimization'
      },
      {
        id: 'dm-4',
        question: 'Why are UTM parameters added to campaign URLs?',
        options: [
          'To encrypt passwords',
          'To identify which source, medium, and campaign drove website traffic in analytics',
          'To increase font size',
          'To shorten URLs'
        ],
        correctAnswerIndex: 1,
        explanation: 'UTM tags (`utm_source`, `utm_medium`, `utm_campaign`) attribute traffic accurately across channels.',
        skillTested: 'Campaign Attribution'
      },
      {
        id: 'dm-5',
        question: 'What does a "Call to Action" (CTA) do in a marketing campaign?',
        options: [
          'Explains company history',
          'Guides the audience clearly toward the next desired step (e.g., Sign Up, Download Guide)',
          'Lists legal disclaimers',
          'Replaces product descriptions'
        ],
        correctAnswerIndex: 1,
        explanation: 'A clear, visible CTA converts interest into measurable user action.',
        skillTested: 'Funnel Design'
      }
    ]
  },
  {
    slug: 'content-writing',
    title: 'Content Writing & Social Media Marketing',
    category: 'Creative',
    domain: 'Content Writing',
    description:
      'Measure web readability, active voice, content calendars, audience engagement metrics, and ethical original copywriting.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Content Writing', 'Social Media Marketing'],
    timed: true,
    questions: [
      {
        id: 'cw-1',
        question: 'Which formatting practice makes long web articles easiest for online readers to scan?',
        options: [
          'One continuous 1,500-word paragraph',
          'Clear descriptive subheadings, short paragraphs, and bullet points where helpful',
          'Writing everything in ALL CAPS',
          'Removing punctuation'
        ],
        correctAnswerIndex: 1,
        explanation: 'Online readers scan before reading deeply; visual structure improves comprehension and retention.',
        skillTested: 'Web Readability'
      },
      {
        id: 'cw-2',
        question: 'Why is Engagement Rate often more valuable than raw Follower Count alone on social media?',
        options: [
          'Follower count is always zero',
          'Engagement shows whether real audiences actively interact with and care about your content',
          'Engagement replaces websites',
          'Engagement cannot be measured'
        ],
        correctAnswerIndex: 1,
        explanation: 'Active saves, shares, comments, and clicks signal real audience resonance rather than vanity numbers.',
        skillTested: 'Social Analytics'
      },
      {
        id: 'cw-3',
        question: 'Before drafting an article or product copy, what should a content writer define first?',
        options: [
          'The target audience, their pain points, and the single primary goal of the piece',
          'Random word count targets only',
          'Decorative emojis',
          'Unverified statistics'
        ],
        correctAnswerIndex: 0,
        explanation: 'Knowing the reader and goal shapes tone, depth, examples, and call to action.',
        skillTested: 'Content Strategy'
      },
      {
        id: 'cw-4',
        question: 'What is the main benefit of maintaining a social media content calendar?',
        options: [
          'Eliminating creative ideas',
          'Ensuring consistent posting, balanced content pillars, and alignment with key campaigns/dates',
          'Posting the exact same caption daily',
          'Avoiding audience replies'
        ],
        correctAnswerIndex: 1,
        explanation: 'Content calendars sustain consistency and reduce last-minute scrambling.',
        skillTested: 'Content Planning'
      },
      {
        id: 'cw-5',
        question: 'When referencing statistics or research in an article, good editorial practice requires:',
        options: [
          'Inventing rounded numbers that sound persuasive',
          'Citing credible primary sources and verifying accuracy',
          'Copying paragraphs word-for-word without attribution',
          'Omitting dates completely'
        ],
        correctAnswerIndex: 1,
        explanation: 'Verifying and citing reputable sources builds reader trust and avoids plagiarism.',
        skillTested: 'Editorial Integrity'
      }
    ]
  },

  // ==================== APTITUDE (3) ====================
  {
    slug: 'logical-reasoning',
    title: 'Logical Reasoning Assessment',
    category: 'Aptitude',
    domain: 'Logical Reasoning',
    description:
      'Assess deductive reasoning, syllogisms, sequences, pattern recognition, and analytical puzzles.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Logical Reasoning'],
    timed: true,
    questions: [
      {
        id: 'lr-1',
        question: 'Find the next number in the sequence: 3, 6, 11, 18, 27, ?',
        options: ['36', '38', '40', '42'],
        correctAnswerIndex: 1,
        explanation: 'Differences increase by 2 each step: +3, +5, +7, +9, so next is +11 → 27 + 11 = 38.',
        skillTested: 'Number Patterns'
      },
      {
        id: 'lr-2',
        question: 'All engineers are problem solvers. Some problem solvers are designers. Which conclusion MUST be true?',
        options: [
          'All engineers are designers',
          'All problem solvers are engineers',
          'Some designers are problem solvers',
          'No engineers are designers'
        ],
        correctAnswerIndex: 2,
        explanation: 'If some problem solvers are designers, then by conversion some designers must be problem solvers.',
        skillTested: 'Syllogisms'
      },
      {
        id: 'lr-3',
        question: 'In a certain code, CAT is written as DBU. How is DOG written in that code?',
        options: ['EPH', 'EPG', 'DPH', 'FQI'],
        correctAnswerIndex: 0,
        explanation: 'Each letter shifts forward by +1 in the alphabet: D→E, O→P, G→H → EPH.',
        skillTested: 'Coding-Decoding'
      },
      {
        id: 'lr-4',
        question: 'Riya walks 4 km North, then turns right and walks 3 km East. How far is she from her starting point?',
        options: ['5 km', '6 km', '7 km', '1 km'],
        correctAnswerIndex: 0,
        explanation: 'By the Pythagorean theorem, √(4² + 3²) = √(16 + 9) = 5 km.',
        skillTested: 'Direction Sense'
      },
      {
        id: 'lr-5',
        question: 'If Monday is 3 days before the meeting, on which day is the meeting?',
        options: ['Wednesday', 'Thursday', 'Friday', 'Tuesday'],
        correctAnswerIndex: 1,
        explanation: 'Monday + 3 days = Thursday (Tue=1, Wed=2, Thu=3).',
        skillTested: 'Calendar Reasoning'
      }
    ]
  },
  {
    slug: 'quantitative-aptitude',
    title: 'Quantitative Aptitude Assessment',
    category: 'Aptitude',
    domain: 'Quantitative Aptitude',
    description:
      'Test percentages, ratios, averages, speed-distance-time, and profit/loss problem solving.',
    durationMinutes: 15,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Quantitative Aptitude'],
    timed: true,
    questions: [
      {
        id: 'qa-1',
        question: 'A laptop priced at ₹40,000 is offered at a 15% discount. What is the sale price?',
        options: ['₹34,000', '₹35,000', '₹36,000', '₹38,500'],
        correctAnswerIndex: 0,
        explanation: '15% of 40,000 = 6,000; Sale price = 40,000 − 6,000 = ₹34,000.',
        skillTested: 'Percentages & Discounts'
      },
      {
        id: 'qa-2',
        question: 'The average of 5 numbers is 24. If one number is excluded, the average of the remaining 4 numbers becomes 22. What was the excluded number?',
        options: ['26', '30', '32', '28'],
        correctAnswerIndex: 2,
        explanation: 'Sum of 5 numbers = 5 × 24 = 120; sum of remaining 4 = 4 × 22 = 88; excluded = 120 − 88 = 32.',
        skillTested: 'Averages'
      },
      {
        id: 'qa-3',
        question: 'A train travels 180 km in 3 hours. At the same speed, how long will it take to travel 300 km?',
        options: ['4 hours', '4.5 hours', '5 hours', '6 hours'],
        correctAnswerIndex: 2,
        explanation: 'Speed = 180 / 3 = 60 km/h. Time for 300 km = 300 / 60 = 5 hours.',
        skillTested: 'Time, Speed & Distance'
      },
      {
        id: 'qa-4',
        question: 'If the ratio of boys to girls in a workshop is 3:5 and there are 40 participants in total, how many girls are there?',
        options: ['15', '20', '25', '30'],
        correctAnswerIndex: 2,
        explanation: 'Total parts = 3 + 5 = 8; each part = 40 / 8 = 5; girls = 5 × 5 = 25.',
        skillTested: 'Ratios & Proportions'
      },
      {
        id: 'qa-5',
        question: 'An artisan buys raw material for ₹800 and sells the finished craft for ₹1,000. What is the profit percentage?',
        options: ['20%', '25%', '15%', '30%'],
        correctAnswerIndex: 1,
        explanation: 'Profit = ₹200. Profit % = (200 / 800) × 100 = 25%.',
        skillTested: 'Profit & Loss'
      }
    ]
  },
  {
    slug: 'general-aptitude',
    title: 'General & Numerical Aptitude Test',
    category: 'Aptitude',
    domain: 'Aptitude',
    description:
      'A balanced placement-style aptitude test combining numerical reasoning, data interpretation, analogies, and workplace calculations.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['General Aptitude', 'Numerical Reasoning'],
    timed: true,
    questions: [
      {
        id: 'ga-1',
        question: 'Monthly website visits grew from 2,000 in January to 2,500 in February. What was the percentage increase?',
        options: ['20%', '25%', '30%', '50%'],
        correctAnswerIndex: 1,
        explanation: 'Increase = 500; Percentage increase = (500 / 2,000) × 100 = 25%.',
        skillTested: 'Percentage Change'
      },
      {
        id: 'ga-2',
        question: 'If 12 notebooks cost ₹360, how much do 7 notebooks cost?',
        options: ['₹180', '₹200', '₹210', '₹240'],
        correctAnswerIndex: 2,
        explanation: 'Cost per notebook = 360 / 12 = ₹30; 7 notebooks = 7 × 30 = ₹210.',
        skillTested: 'Unitary Method'
      },
      {
        id: 'ga-3',
        question: 'A team spent ₹18,000 out of a ₹24,000 quarterly budget. What fraction of the budget remains unspent?',
        options: ['1/2', '1/3', '1/4', '3/4'],
        correctAnswerIndex: 2,
        explanation: 'Remaining = 24,000 − 18,000 = ₹6,000; 6,000 / 24,000 = 1/4.',
        skillTested: 'Budget Fractions'
      },
      {
        id: 'ga-4',
        question: 'Quarter sales were Q1: 120, Q2: 150, Q3: 180, Q4: 150. What is the mean quarterly sales?',
        options: ['145', '150', '155', '160'],
        correctAnswerIndex: 1,
        explanation: 'Total = 120 + 150 + 180 + 150 = 600; Mean = 600 / 4 = 150.',
        skillTested: 'Data Table Interpretation'
      },
      {
        id: 'ga-5',
        question: 'A meeting starts at 10:45 AM and lasts 1 hour 35 minutes. When does it end?',
        options: ['12:10 PM', '12:15 PM', '12:20 PM', '12:25 PM'],
        correctAnswerIndex: 2,
        explanation: '10:45 + 1 hr = 11:45; 11:45 + 35 mins = 12:20 PM.',
        skillTested: 'Time Calculations'
      }
    ]
  }
];
