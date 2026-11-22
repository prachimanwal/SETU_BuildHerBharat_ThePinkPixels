import {
  LearningCategory,
  LearningResourceType,
  ITutorialContent,
  IAssignmentDetails,
  ILearningPathStep
} from '../../models/LearningResource';
import { EXTENDED_LEARNING_CATALOG } from './learningExtendedData';

export interface SeedLearningResource {
  slug: string;
  title: string;
  description: string;
  duration: string;
  type: LearningResourceType;
  category: LearningCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillTag: string;
  skillsGained: string[];
  learningObjectives: string[];
  contentUrl: string;
  contentSourceLabel: string;
  assignmentBrief?: string;
  targetAudience: string;
  tutorialContent?: ITutorialContent;
  assignmentDetails?: IAssignmentDetails;
  learningPathSteps?: ILearningPathStep[];
}

export const LEARNING_CATALOG: SeedLearningResource[] = [
  // ==================== TUTORIALS ====================
  {
    slug: 'tutorial-python-essentials',
    title: 'Python Programming Essentials for Beginners',
    description:
      'Learn Python variables, data structures (lists, tuples, dictionaries), functions, and file handling with clear examples and hands-on practice.',
    duration: '45 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'Python',
    skillsGained: ['Python', 'Python Data Types', 'Python Dictionaries', 'Python File Handling'],
    learningObjectives: [
      'Choose between mutable lists/dicts and immutable tuples',
      'Write clean functions and list comprehensions',
      'Read and write files safely with context managers'
    ],
    contentUrl: 'https://docs.python.org/3/tutorial/',
    contentSourceLabel: 'Official Python 3 Tutorial (python.org)',
    targetAudience: 'Students, Freshers, Career Switchers',
    tutorialContent: {
      overview:
        'Python is one of the most readable, versatile languages used across backend engineering, data analytics, automation, and AI. Mastering its built-in collections and clean idioms unlocks rapid problem solving.',
      steps: [
        {
          title: '1. Lists, Tuples, and Dictionaries',
          content:
            'Use lists when order matters and items change, tuples for fixed records, and dictionaries for fast key-value lookups. Always prefer `.get(key, default)` to avoid KeyError.',
          codeOrExample: `skills = ["Python", "SQL", "Excel"]
profile = {"name": "Asha", "cgpa": 8.4}
print(profile.get("city", "Not specified"))`
        },
        {
          title: '2. Clean Filtering with List Comprehensions',
          content:
            'List comprehensions express mapping and filtering concisely while remaining readable.',
          codeOrExample: `scores = [55, 78, 92, 61, 44]
passed = [s for s in scores if s >= 60]
# Result: [78, 92, 61]`
        },
        {
          title: '3. Safe File Handling with Context Managers',
          content:
            'Wrapping `open()` in a `with` block guarantees the OS file descriptor closes automatically even if an exception is raised.',
          codeOrExample: `with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("Prepared for SETU Python Assessment\\n")`
        }
      ],
      exercises: [
        'Write a function `word_counts(text)` that returns a dictionary mapping each lowercase word to its frequency.',
        'Filter a list of student dictionaries to return only students scoring >= 75%.'
      ],
      knowledgeChecks: [
        {
          question: 'Which Python statement safely closes a file handle automatically after reading?',
          options: [
            'f = open("file.txt")',
            'with open("file.txt", "r") as f:',
            'read("file.txt")',
            'file.auto_close()'
          ],
          answerIndex: 1,
          explanation: 'The `with` statement uses Python’s context manager protocol to close the file automatically.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-html-css-responsive',
    title: 'Modern HTML5 & Responsive CSS Flexbox/Grid',
    description:
      'Build clean, accessible, mobile-first layouts using semantic HTML5 landmarks, CSS Box Model, Flexbox, and Grid.',
    duration: '40 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'HTML/CSS',
    skillsGained: ['HTML/CSS', 'Semantic HTML', 'CSS Flexbox', 'Web Development'],
    learningObjectives: [
      'Structure pages with semantic HTML5 tags (<header>, <nav>, <main>, <footer>)',
      'Build responsive card grids using Flexbox and CSS Grid',
      'Apply accessibility fundamentals including alt attributes and focus outlines'
    ],
    contentUrl: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    contentSourceLabel: 'MDN Web Docs — Learn Web Development',
    targetAudience: 'Beginners & Aspiring Web Developers',
    tutorialContent: {
      overview:
        'Clean semantic HTML gives screen readers and search engines clear structure, while modern CSS Flexbox and Grid eliminate fragile layout hacks.',
      steps: [
        {
          title: '1. Semantic Landmarks & Accessibility',
          content:
            'Replace generic nested `<div>` containers with `<header>`, `<nav>`, `<main>`, `<article>`, and `<footer>`, and always add meaningful `alt` text on images.',
          codeOrExample: `<nav aria-label="Main navigation">
  <a href="#projects">Projects</a>
  <a href="#contact">Contact</a>
</nav>`
        },
        {
          title: '2. Predictable Sizing with border-box & Flexbox',
          content:
            'Set `box-sizing: border-box` globally so padding and borders stay inside declared widths, and align items cleanly with Flexbox.',
          codeOrExample: `.card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: stretch;
}`
        }
      ],
      exercises: [
        'Build a 3-column feature section that stacks into 1 column on mobile screens below 640px.',
        'Audit one existing HTML page to replace non-semantic clickable divs with `<button>` elements.'
      ],
      knowledgeChecks: [
        {
          question: 'Which CSS property aligns Flexbox children along the cross axis?',
          options: ['justify-content', 'align-items', 'gap', 'display'],
          answerIndex: 1,
          explanation: '`align-items` controls cross-axis alignment while `justify-content` aligns along the main axis.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-javascript-es6',
    title: 'JavaScript ES6+, Array Methods & Async/Await',
    description:
      'Master modern JavaScript patterns used in real web apps: destructuring, `map`/`filter`/`reduce`, closures, and Promises.',
    duration: '50 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'JavaScript',
    skillsGained: ['JavaScript', 'Async JavaScript', 'JavaScript Arrays'],
    learningObjectives: [
      'Transform API arrays safely with `map`, `filter`, and `reduce`',
      'Handle asynchronous API requests cleanly with `async`/`await` and `try`/`catch`',
      'Prevent coercion bugs using strict equality (`===`)'
    ],
    contentUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    contentSourceLabel: 'MDN JavaScript Guide',
    targetAudience: 'Web Developers & Students',
    tutorialContent: {
      overview:
        'Modern JavaScript favors immutable array transformations and readable `async`/`await` flows over callback pyramids.',
      steps: [
        {
          title: '1. Pure Array Transformations',
          content:
            'Use `.filter()` to select matching items and `.map()` to project data without mutating the original array.',
          codeOrExample: `const jobs = [
  { title: "Data Intern", remote: true },
  { title: "Lab Assistant", remote: false }
];
const remoteTitles = jobs.filter((j) => j.remote).map((j) => j.title);`
        },
        {
          title: '2. Resilient Async/Await Fetching',
          content:
            'Always inspect `response.ok` and guard against unexpected shapes before calling `.map()`.',
          codeOrExample: `async function loadItems(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  const payload = await res.json();
  return Array.isArray(payload.data) ? payload.data : [];
}`
        }
      ],
      exercises: [
        'Write a function using `.reduce()` to group an array of courses by their `category` field.',
        'Refactor a chained `.then()` fetch call into an `async`/`await` function with error handling.'
      ],
      knowledgeChecks: [
        {
          question: 'What does an `async` function always return in JavaScript?',
          options: ['A string', 'A Promise', 'A Boolean', 'An Array'],
          answerIndex: 1,
          explanation: 'Every `async` function automatically wraps its return value inside a Promise.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-react-components',
    title: 'React Fundamentals: Components, Props & Hooks',
    description:
      'Build interactive single-page interfaces with reusable React functional components, `useState`, `useEffect`, and clean state updates.',
    duration: '55 mins',
    type: 'tutorial',
    category: 'Programming',
    difficulty: 'Intermediate',
    skillTag: 'React',
    skillsGained: ['React', 'React Hooks', 'React State Management'],
    learningObjectives: [
      'Compose reusable components with typed props and stable list keys',
      'Manage interactive state cleanly with functional state updates',
      'Synchronize side effects properly with `useEffect` dependency arrays'
    ],
    contentUrl: 'https://react.dev/learn',
    contentSourceLabel: 'Official React Documentation (react.dev)',
    targetAudience: 'Frontend Developers',
    tutorialContent: {
      overview:
        'React models UI as a predictable function of state. Keeping state minimal and updating it immutably avoids stale renders and hard-to-trace UI glitches.',
      steps: [
        {
          title: '1. Functional State Updates',
          content:
            'Whenever new state depends on previous state, pass an updater callback to `setState`.',
          codeOrExample: `const [count, setCount] = useState(0);
const increment = () => setCount((prev) => prev + 1);`
        },
        {
          title: '2. Rendering Lists with Stable Keys',
          content:
            'Always assign each list item a unique persistent ID as its `key` so React reconciles DOM changes cleanly.',
          codeOrExample: `{skills.map((skill) => (
  <li key={skill.id}>{skill.name}</li>
))}`
        }
      ],
      exercises: [
        'Create a searchable filterable skill-tag list component using `useState` and `useMemo`.',
        'Add loading, error, and retry UI states to a data-fetching component.'
      ],
      knowledgeChecks: [
        {
          question: 'When does `useEffect(() => { fetchData(); }, [])` execute?',
          options: [
            'On every keystroke',
            'Once after the component first mounts',
            'Only when state changes',
            'Never'
          ],
          answerIndex: 1,
          explanation: 'An empty dependency array tells React to run the effect once after initial mount.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-sql-queries',
    title: 'SQL & Relational Databases: Queries, JOINs & Aggregations',
    description:
      'Learn how to query real relational tables using SELECT, WHERE, GROUP BY, HAVING, INNER/LEFT JOINs, and clean schema keys.',
    duration: '45 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'SQL',
    skillsGained: ['SQL', 'SQL Joins', 'SQL Aggregations', 'Database Management'],
    learningObjectives: [
      'Combine normalized tables accurately with INNER JOIN and LEFT JOIN',
      'Summarize datasets with COUNT, SUM, AVG, GROUP BY, and HAVING',
      'Design tables using Primary Keys and Foreign Keys'
    ],
    contentUrl: 'https://sqlbolt.com/',
    contentSourceLabel: 'SQLBolt Interactive SQL Lessons',
    targetAudience: 'Analysts, Backend Developers, Students',
    tutorialContent: {
      overview:
        'SQL is the universal language of structured data. Whether you work in analytics, finance, or backend software, confident JOIN and aggregation skills are tested in nearly every technical interview.',
      steps: [
        {
          title: '1. Combining Tables with LEFT JOIN',
          content:
            'Use LEFT JOIN when you want every record from the primary table even if no related record exists yet in the secondary table.',
          codeOrExample: `SELECT s.name, COUNT(e.course_id) AS courses_enrolled
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
GROUP BY s.student_id, s.name;`
        },
        {
          title: '2. Filtering Groups with HAVING',
          content:
            'Apply `WHERE` to filter individual rows before grouping, and `HAVING` to filter aggregated groups afterward.',
          codeOrExample: `SELECT department, AVG(marks) AS avg_marks
FROM exam_scores
GROUP BY department
HAVING AVG(marks) >= 75;`
        }
      ],
      exercises: [
        'Write a query listing the top 5 cities by total customer orders in the past quarter.',
        'Find all students who have NOT submitted any assignment using a LEFT JOIN and `IS NULL`.'
      ],
      knowledgeChecks: [
        {
          question: 'Which clause filters aggregated results created by `GROUP BY`?',
          options: ['WHERE', 'HAVING', 'LIMIT', 'ORDER BY'],
          answerIndex: 1,
          explanation: '`HAVING` evaluates conditions on grouped aggregates after `GROUP BY` runs.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-excel-data-analysis',
    title: 'Data Analysis with Microsoft Excel: Formulas & Pivot Tables',
    description:
      'Turn messy spreadsheets into clear business dashboards using absolute references, SUMIFS, XLOOKUP/VLOOKUP, and Pivot Tables.',
    duration: '40 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'Excel',
    skillsGained: ['Excel', 'Data Analysis', 'Spreadsheet Analysis'],
    learningObjectives: [
      'Lock formula references properly using `$A$1` notation',
      'Automate conditional summaries with `SUMIFS` and `COUNTIFS`',
      'Build dynamic multi-dimensional summaries with Pivot Tables'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/excel',
    contentSourceLabel: 'Microsoft Official Excel Help & Learning',
    targetAudience: 'Students, Business Analysts, Operations Roles',
    tutorialContent: {
      overview:
        'Excel remains the most widely used analytical tool across Indian enterprises, startups, and government operations. Clean structured tables and lookup formulas save hours every week.',
      steps: [
        {
          title: '1. Clean Tables & Conditional Aggregations',
          content:
            'Convert raw ranges into Excel Tables (`Ctrl + T`) so ranges auto-expand, then use `SUMIF` / `SUMIFS` for category totals.',
          codeOrExample: `=SUMIFS(Sales[Amount], Sales[Region], "West", Sales[Status], "Paid")`
        },
        {
          title: '2. Exact-Match Lookups',
          content:
            'Always pass `FALSE` (exact match) in `VLOOKUP` or use `XLOOKUP` so unsorted tables never return wrong rows.',
          codeOrExample: `=VLOOKUP(A2, ProductMaster!$A$2:$D$200, 3, FALSE)`
        }
      ],
      exercises: [
        'Create a 12-row expense table and build a summary using `SUMIF` by expense category.',
        'Add Conditional Formatting to highlight any budget category exceeding 100% of plan.'
      ],
      knowledgeChecks: [
        {
          question: 'What does `$B$2` mean when copied across cells in Excel?',
          options: [
            'Both column B and row 2 stay fixed',
            'Only row 2 stays fixed',
            'It formats the cell as US Dollars',
            'It multiplies B2 by 2'
          ],
          answerIndex: 0,
          explanation: 'The `$` prefix locks column and row coordinates against shifting when copied.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-ml-foundations',
    title: 'Machine Learning Foundations: Models, Features & Evaluation',
    description:
      'Understand supervised vs unsupervised learning, train/validation/test splits, preventing overfitting, and choosing the right metric.',
    duration: '50 mins',
    type: 'tutorial',
    category: 'Data and AI',
    difficulty: 'Intermediate',
    skillTag: 'Machine Learning',
    skillsGained: ['Machine Learning', 'Data Science', 'Model Evaluation'],
    learningObjectives: [
      'Match real-world business problems to regression, classification, or clustering',
      'Prevent data leakage when splitting datasets into train and test sets',
      'Interpret Precision, Recall, F1-score, and RMSE honestly'
    ],
    contentUrl: 'https://developers.google.com/machine-learning/crash-course',
    contentSourceLabel: 'Google Machine Learning Crash Course',
    targetAudience: 'Data Science Learners & Engineering Students',
    tutorialContent: {
      overview:
        'Effective machine learning starts with clean problem framing and honest validation—not blindly running complex neural networks.',
      steps: [
        {
          title: '1. Problem Framing',
          content:
            'Use Regression for numeric predictions (e.g., demand forecast), Classification for categories (e.g., spam vs valid), and Clustering when labels do not exist.'
        },
        {
          title: '2. Detecting Overfitting Early',
          content:
            'Compare training performance against a held-out validation set. A huge gap indicates overfitting—address it with simpler features, regularization, or more diverse data.'
        }
      ],
      exercises: [
        'List 3 classification scenarios where Recall matters more than Precision (e.g., medical screening).',
        'Sketch a clean train/validation/test workflow that fits scalers only on training data.'
      ],
      knowledgeChecks: [
        {
          question: 'Why must feature scaling parameters be computed only on the training set?',
          options: [
            'To make code longer',
            'To prevent data leakage from the test set into model training',
            'Because test sets have no numbers',
            'Scaling only works on 10 rows'
          ],
          answerIndex: 1,
          explanation: 'Using test-set statistics during preprocessing leaks unseen information and inflates validation scores.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-ui-ux-accessibility',
    title: 'UI/UX Design & Accessible Interface Systems',
    description:
      'Learn user flows, wireframing, visual hierarchy, and WCAG accessibility guidelines to design inclusive digital products.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'UI/UX Design',
    skillsGained: ['UI/UX Design', 'Accessibility', 'Wireframing'],
    learningObjectives: [
      'Translate user goals into clear low-fidelity wireframes before visual styling',
      'Apply typography scale, whitespace, and clear interactive signifiers',
      'Verify WCAG contrast ratios and keyboard navigability'
    ],
    contentUrl: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
    contentSourceLabel: 'W3C Web Accessibility Initiative (WAI)',
    targetAudience: 'Designers, Product Builders, Frontend Developers',
    tutorialContent: {
      overview:
        'Great user experience removes friction and respects every user’s time, device size, and accessibility needs.',
      steps: [
        {
          title: '1. Start With User Tasks, Not Colors',
          content:
            'Map the core user task (e.g., "find and save a relevant government scheme in under 60 seconds") and sketch wireframes showing only layout and copy hierarchy.'
        },
        {
          title: '2. Inclusive Contrast & Touch Targets',
          content:
            'Maintain at least 4.5:1 contrast for body text, keep buttons at least 44px tall on touchscreens, and never convey error states using color alone.'
        }
      ],
      exercises: [
        'Redesign a cluttered registration form into a calm 2-step layout with clear labels and inline help.',
        'Check keyboard Tab order across a web page to ensure every interactive button shows a visible focus ring.'
      ],
      knowledgeChecks: [
        {
          question: 'What is the main advantage of starting with low-fidelity wireframes?',
          options: [
            'They let teams test structure and flows rapidly before spending hours on visual polish',
            'They automatically generate backend APIs',
            'They remove the need for user research',
            'They replace final CSS styling'
          ],
          answerIndex: 0,
          explanation: 'Low-fidelity wireframes make structural iterations fast and inexpensive.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-digital-marketing-seo',
    title: 'Digital Marketing, SEO & Campaign Measurement',
    description:
      'Understand search intent, on-page SEO structure, UTM campaign tracking, conversion funnels, and ethical growth metrics.',
    duration: '35 mins',
    type: 'tutorial',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Digital Marketing',
    skillsGained: ['Digital Marketing', 'SEO Basics', 'Campaign Attribution'],
    learningObjectives: [
      'Structure web pages around genuine user search intent and clear headings',
      'Tag campaign links using UTM parameters for accurate channel attribution',
      'Evaluate CTR, conversion rate, and retention rather than vanity impressions'
    ],
    contentUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    contentSourceLabel: 'Google Search Central — SEO Starter Guide',
    targetAudience: 'Marketers, Small Business Owners, Creators',
    tutorialContent: {
      overview:
        'Sustainable digital marketing connects genuinely useful content with the right audience and measures outcomes transparently.',
      steps: [
        {
          title: '1. Search Intent & Helpful Page Structure',
          content:
            'Use descriptive `<title>` tags, clear `<h1>`/`<h2>` headings, fast-loading images, and direct answers to questions your audience actually searches.'
        },
        {
          title: '2. Measuring Campaigns with UTMs',
          content:
            'Append `?utm_source=linkedin&utm_medium=social&utm_campaign=career_workshop` so analytics clearly reveals which channel brings real sign-ups.'
        }
      ],
      exercises: [
        'Draft an SEO title (<60 chars) and meta description (<155 chars) for a skill-training workshop page.',
        'Calculate CTR and conversion rate for a campaign with 5,000 impressions, 200 clicks, and 24 registrations.'
      ],
      knowledgeChecks: [
        {
          question: 'If an ad receives 4,000 impressions and 120 clicks, what is its CTR?',
          options: ['1.5%', '3.0%', '4.0%', '12%'],
          answerIndex: 1,
          explanation: 'CTR = (120 / 4,000) × 100 = 3.0%.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-workplace-communication',
    title: 'Workplace Communication, STAR Interviews & Stakeholder Updates',
    description:
      'Communicate with confidence across emails, team meetings, constructive feedback conversations, and behavioral job interviews.',
    duration: '30 mins',
    type: 'tutorial',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Communication Skills',
    skillsGained: ['Communication Skills', 'Workplace Communication', 'Interview Communication'],
    learningObjectives: [
      'Write concise, scannable workplace emails with clear asks and deadlines',
      'Structure behavioral interview stories with the STAR framework',
      'Deliver calm, solution-oriented blocker escalations'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'National Career Service (NCS) Career Resources',
    targetAudience: 'Job Seekers, Freshers, Returning Professionals',
    tutorialContent: {
      overview:
        'Clear communication often differentiates equally skilled candidates during hiring and accelerates trust during your first 90 days on the job.',
      steps: [
        {
          title: '1. Lead With the Bottom Line (BLUF)',
          content:
            'Start workplace emails with the core update or decision needed in the first two sentences, followed by brief bullet points and exact dates.'
        },
        {
          title: '2. Master the STAR Interview Framework',
          content:
            'Describe the **S**ituation (context), **T**ask (your responsibility), **A**ction (specific steps YOU took), and **R**esult (measurable outcome or lesson learned).'
        }
      ],
      exercises: [
        'Write two STAR stories from your college projects, internships, or volunteer work.',
        'Rewrite a rambling 10-line status email into a 4-bullet executive update.'
      ],
      knowledgeChecks: [
        {
          question: 'What does the "A" in the STAR interview method represent?',
          options: [
            'Assumptions made by teammates',
            'Specific Actions you personally took to solve the challenge',
            'Annual company revenue',
            'Academic grades only'
          ],
          answerIndex: 1,
          explanation: 'Interviewers want to understand your concrete personal contribution and reasoning.'
        }
      ]
    }
  },
  {
    slug: 'tutorial-business-project-planning',
    title: 'Business Operations & Project Planning Fundamentals',
    description:
      'Plan projects reliably using Work Breakdown Structures, realistic timelines, risk registers, and scope control.',
    duration: '40 mins',
    type: 'tutorial',
    category: 'Business',
    difficulty: 'Intermediate',
    skillTag: 'Project Management',
    skillsGained: ['Project Management', 'Risk Management', 'Time Management'],
    learningObjectives: [
      'Break complex goals into estimable tasks with clear owners',
      'Prevent scope creep by documenting trade-offs across scope, time, and cost',
      'Track project risks proactively before deadlines slip'
    ],
    contentUrl: 'https://www.pmi.org/learning',
    contentSourceLabel: 'Project Management Institute (PMI) Learning',
    targetAudience: 'Coordinators, Aspiring Managers, Entrepreneurs',
    tutorialContent: {
      overview:
        'Strong project planning turns ambitious goals into predictable, low-stress weekly milestones.',
      steps: [
        {
          title: '1. Define Scope & Out-of-Scope Explicitly',
          content:
            'Write down both what IS included in Phase 1 and what is deferred to Phase 2 so stakeholders share the same expectations.'
        },
        {
          title: '2. Maintain a Living Risk Register',
          content:
            'For every major dependency, note Likelihood (Low/Med/High), Impact, Mitigation step, and Owner—and review it weekly.'
        }
      ],
      exercises: [
        'Create a 4-week milestone schedule for launching a small community workshop.',
        'Identify 3 project risks and write a concrete mitigation plan for each.'
      ],
      knowledgeChecks: [
        {
          question: 'Which action best prevents uncontrolled scope creep?',
          options: [
            'Silently accepting every informal feature request',
            'Reviewing new requests against timeline, cost, and priority before approving changes',
            'Removing all project milestones',
            'Avoiding written requirements'
          ],
          answerIndex: 1,
          explanation: 'Evaluating trade-offs transparently protects delivery commitments and quality.'
        }
      ]
    }
  },

  // ==================== PRACTICAL ASSIGNMENTS ====================
  {
    slug: 'assignment-python-calculator',
    title: 'Practical Assignment: Python CLI Calculator & Expense Utility',
    description:
      'Build a clean, modular Python command-line utility supporting arithmetic operations, input validation, and monthly expense summaries.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'Python',
    skillsGained: ['Python', 'Problem Solving'],
    learningObjectives: [
      'Organize Python code into reusable functions with error handling',
      'Handle invalid user input and division-by-zero gracefully',
      'Export a summary report to a text or CSV file'
    ],
    contentUrl: 'https://docs.python.org/3/tutorial/errors.html',
    contentSourceLabel: 'Python Error Handling Docs',
    assignmentBrief:
      'Write a Python script with a menu loop supporting basic arithmetic and an expense tracker that prints total and average spend.',
    targetAudience: 'Beginners & Python Learners',
    assignmentDetails: {
      objective:
        'Demonstrate practical Python fundamentals by building an interactive CLI program that safely handles edge cases.',
      instructions: [
        'Create separate functions for `add`, `subtract`, `multiply`, `divide` (guarding against divide-by-zero).',
        'Add an Expense Summary mode where a user can enter labeled expenses (e.g., Food: 350, Travel: 120) and view total, highest item, and average.',
        'Validate numeric inputs using `try`/`except ValueError` so invalid entries prompt cleanly instead of crashing.',
        'Save a clean session summary to `summary.txt` using a `with open(...)` block.'
      ],
      deliverables: [
        'Working Python script (`calculator_expense.py`) hosted on GitHub/Gist or documented in your submission notes',
        'Short README or notes describing test cases you verified'
      ],
      submissionRequirements:
        'Paste a link to your GitHub repository/Gist OR write a clear summary of your code design and test results.',
      evaluationCriteria: [
        'Modular functions with clean naming',
        'Graceful handling of divide-by-zero and non-numeric inputs',
        'Accurate total/average expense calculation and file export'
      ]
    }
  },
  {
    slug: 'assignment-sql-student-db',
    title: 'Practical Assignment: SQL Student & Course Management Database',
    description:
      'Design a normalized 3-table relational schema (Students, Courses, Enrollments) and write analytical JOIN and aggregation queries.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'SQL',
    skillsGained: ['SQL', 'Database Management', 'Data Analysis'],
    learningObjectives: [
      'Create normalized tables with Primary Keys and Foreign Keys',
      'Insert realistic sample rows and query them using JOIN and GROUP BY',
      'Answer practical reporting questions with accurate SQL'
    ],
    contentUrl: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
    contentSourceLabel: 'PostgreSQL Official SQL Tutorial',
    assignmentBrief:
      'Build `students`, `courses`, and `enrollments` tables and write 5 analytical SQL queries.',
    targetAudience: 'Data Analysts & Backend Students',
    assignmentDetails: {
      objective:
        'Prove hands-on relational schema design and analytical SQL query skills ready for technical interviews.',
      instructions: [
        'Write `CREATE TABLE` statements for `students`, `courses`, and `enrollments` with proper primary and foreign keys.',
        'Insert at least 6 students, 4 courses, and 10 enrollment records (including scores).',
        'Write queries to: (a) list each course with total enrolled students, (b) compute average score per course, (c) find students scoring above 80%, and (d) list students with zero enrollments using `LEFT JOIN`.',
        'Document your SQL script and sample output.'
      ],
      deliverables: [
        'SQL file (`student_db.sql`) or GitHub link with DDL + DML + analytical queries',
        'Brief note explaining your primary/foreign key choices'
      ],
      submissionRequirements:
        'Share a GitHub/Gist URL to your `.sql` file or submit your SQL schema and key queries in the solution box.',
      evaluationCriteria: [
        'Proper normalization and foreign key constraints',
        'Correct use of `LEFT JOIN`, `GROUP BY`, and `HAVING`',
        'Readable, well-formatted SQL syntax'
      ]
    }
  },
  {
    slug: 'assignment-responsive-portfolio',
    title: 'Practical Assignment: Build a Responsive Personal Portfolio Website',
    description:
      'Design and code a mobile-friendly HTML & CSS portfolio highlighting your education, verified skills, projects, and contact details.',
    duration: '2 hours',
    type: 'practical_assignment',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'HTML/CSS',
    skillsGained: ['HTML/CSS', 'Web Development', 'UI/UX Design'],
    learningObjectives: [
      'Implement semantic HTML5 sections and accessible navigation',
      'Create a responsive Flexbox/Grid layout that adapts from mobile to desktop',
      'Publish a live portfolio link you can share with employers'
    ],
    contentUrl: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout',
    contentSourceLabel: 'MDN CSS Layout Guide',
    assignmentBrief:
      'Create a clean 1-page responsive portfolio using semantic HTML5 and CSS Flexbox/Grid.',
    targetAudience: 'Web Development Learners & Job Seekers',
    assignmentDetails: {
      objective:
        'Create a real, employer-ready portfolio site demonstrating layout precision, accessibility, and clean styling.',
      instructions: [
        'Create Hero, About, Skills, Projects (at least 2 project cards), and Contact sections using semantic HTML5 elements.',
        'Style the page with CSS Flexbox/Grid so project cards arrange in 1 column on mobile and 2–3 columns on desktop.',
        'Ensure readable color contrast, alt text on images, and keyboard-accessible links.',
        'Host on GitHub Pages / Netlify or share your repository link.'
      ],
      deliverables: [
        'Live portfolio URL or GitHub repository containing `index.html` and `styles.css`'
      ],
      submissionRequirements:
        'Provide your live site or GitHub repository URL (`https://...`) and a brief summary of responsive breakpoints used.',
      evaluationCriteria: [
        'Semantic HTML structure & accessibility basics',
        'Responsive behavior across mobile and desktop viewports',
        'Visual polish, spacing, and readable typography'
      ]
    }
  },
  {
    slug: 'assignment-excel-budget-tracker',
    title: 'Practical Assignment: Monthly Budget Tracker & KPI Dashboard in Excel',
    description:
      'Construct an automated personal or small-business monthly budget workbook with category summaries, variance alerts, and charts.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'Excel',
    skillsGained: ['Excel', 'Data Analysis', 'Numerical Reasoning'],
    learningObjectives: [
      'Separate raw transaction logs from automated summary tables',
      'Use `SUMIF`, variance formulas, and conditional formatting effectively',
      'Present financial insights with clean bar/column charts'
    ],
    contentUrl: 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576',
    contentSourceLabel: 'Microsoft Excel PivotTable Guide',
    assignmentBrief:
      'Build an Excel/Google Sheets monthly budget tracker with planned vs actual formulas and visual charts.',
    targetAudience: 'Students, Analysts, Small Business Owners',
    assignmentDetails: {
      objective:
        'Build an automated spreadsheet dashboard demonstrating formula accuracy and clear visual reporting.',
      instructions: [
        'Create Sheet 1 (`Transactions`) with Date, Category, Description, Type (Income/Expense), and Amount (at least 20 realistic rows).',
        'Create Sheet 2 (`Summary`) listing each category’s Planned Budget, Actual Spend (computed via `SUMIF`), and Remaining Variance.',
        'Apply Conditional Formatting to flag categories where Actual Spend exceeds Planned Budget.',
        'Insert a clean comparison chart (Planned vs Actual) and calculate Savings Rate %.'
      ],
      deliverables: [
        'Shared Google Sheet / OneDrive Excel link (view access) or detailed formula breakdown'
      ],
      submissionRequirements:
        'Submit your viewable spreadsheet URL (`https://...`) or explain your formulas and key takeaways.',
      evaluationCriteria: [
        'Zero hardcoded totals (all summaries formula-driven)',
        'Accurate `SUMIF` and variance calculations',
        'Clear, uncluttered chart and formatting'
      ]
    }
  },
  {
    slug: 'assignment-pm-timeline-risk',
    title: 'Practical Assignment: Project Timeline & Risk Register Plan',
    description:
      'Draft a realistic 6-week project delivery plan complete with milestones, task owners, dependencies, and a risk mitigation register.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Business',
    difficulty: 'Intermediate',
    skillTag: 'Project Management',
    skillsGained: ['Project Management', 'Time Management', 'Leadership'],
    learningObjectives: [
      'Define clear project scope, milestones, and deliverables',
      'Sequence dependent tasks across a 6-week schedule',
      'Anticipate delivery risks with concrete mitigation actions'
    ],
    contentUrl: 'https://www.pmi.org/standards/pmbok',
    contentSourceLabel: 'PMI Standards Overview',
    assignmentBrief:
      'Create a 6-week launch plan and 5-item Risk Register for a community skilling camp or website launch.',
    targetAudience: 'Aspiring Project Coordinators & Business Leads',
    assignmentDetails: {
      objective:
        'Demonstrate structured planning, dependency thinking, and proactive risk management.',
      instructions: [
        'Pick a realistic scenario (e.g., launching a college career fair or a small e-commerce storefront).',
        'Write a 3-sentence Scope Statement including 2 explicit "Out of Scope" items.',
        'Build a 6-week milestone table with Task, Owner Role, Start/End Week, and Deliverable.',
        'Create a Risk Register with at least 5 risks rated by Likelihood & Impact plus Mitigation Plans.'
      ],
      deliverables: [
        'Document link (Google Docs / Notion / PDF) or structured submission text'
      ],
      submissionRequirements:
        'Share a viewable link or write your structured scope, milestones, and risk register directly below.',
      evaluationCriteria: [
        'Clear scope boundaries and measurable deliverables',
        'Realistic task sequencing and buffer time',
        'Actionable risk mitigations rather than generic statements'
      ]
    }
  },
  {
    slug: 'assignment-professional-email-suite',
    title: 'Practical Assignment: Professional Workplace Communication Suite',
    description:
      'Craft three essential career messages: a targeted job application email, a weekly stakeholder status update, and a respectful blocker escalation.',
    duration: '45 mins',
    type: 'practical_assignment',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Communication Skills',
    skillsGained: ['Communication Skills', 'Workplace Communication', 'Content Writing'],
    learningObjectives: [
      'Write crisp, action-oriented subject lines and openings',
      'Communicate value and progress concisely without fluff',
      'Propose solutions calmly when raising project blockers'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'National Career Service (NCS)',
    assignmentBrief:
      'Draft 3 concise workplace emails demonstrating clarity, professionalism, and strong structure.',
    targetAudience: 'All Job Seekers & Working Professionals',
    assignmentDetails: {
      objective:
        'Practice high-clarity professional writing that gets fast, positive responses from recruiters and managers.',
      instructions: [
        'Email 1: Cold application or follow-up email to a hiring manager highlighting 2 relevant skills and a portfolio link.',
        'Email 2: Weekly project status update using Completed / In Progress / Next Week bullets.',
        'Email 3: Polite escalation informing your team lead about a 2-day delay with 2 proposed mitigation options.'
      ],
      deliverables: ['All 3 drafted emails with subject lines and sign-offs'],
      submissionRequirements:
        'Paste your 3 drafted emails directly in the notes box or share a viewable Google Doc link.',
      evaluationCriteria: [
        'Specific, scannable subject lines',
        'Concise paragraphs and bulleted takeaways',
        'Constructive, respectful, solution-oriented tone'
      ]
    }
  },
  {
    slug: 'assignment-social-media-campaign',
    title: 'Practical Assignment: 2-Week Social Media Campaign & Content Calendar',
    description:
      'Plan a realistic 2-week social media growth campaign for a local artisan brand or youth skill initiative with measurable KPIs.',
    duration: '1.5 hours',
    type: 'practical_assignment',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Digital Marketing',
    skillsGained: ['Digital Marketing', 'Social Media Marketing', 'Content Writing'],
    learningObjectives: [
      'Define target audience personas and 3–4 content pillars',
      'Schedule platform-native posts with clear hooks and calls to action',
      'Set realistic engagement and conversion KPIs'
    ],
    contentUrl: 'https://developers.google.com/analytics',
    contentSourceLabel: 'Google Analytics Measurement Docs',
    assignmentBrief:
      'Create a 2-week content calendar (6–8 posts) with hooks, formats, CTAs, and target KPIs.',
    targetAudience: 'Aspiring Digital Marketers & Creators',
    assignmentDetails: {
      objective:
        'Demonstrate end-to-end campaign planning from audience insight to measurable outcomes.',
      instructions: [
        'Choose a real cause or small business (e.g., handloom craft collective or local coding bootcamp).',
        'Define 1 primary audience persona and 3 content pillars (Educational, Behind-the-Scenes, Social Proof).',
        'Plan 6–8 posts across 2 weeks specifying Platform, Format (Reel/Carousel/Post), 3-second Hook, Caption angle, and CTA.',
        'Define 3 measurable KPIs (e.g., Saves, Link CTR, Workshop Registrations) and UTM naming.'
      ],
      deliverables: ['Content calendar spreadsheet/doc link or structured plan in notes'],
      submissionRequirements:
        'Submit a viewable doc/sheet URL or paste your structured 2-week campaign plan below.',
      evaluationCriteria: [
        'Clear audience alignment and varied content pillars',
        'Strong hooks and specific calls to action',
        'Realistic, measurable KPI definitions'
      ]
    }
  },

  // ==================== LEARNING PATHS ====================
  {
    slug: 'path-data-analyst',
    title: 'Learning Path: Job-Ready Data Analyst Roadmap',
    description:
      'A structured step-by-step roadmap taking you from Excel and SQL fundamentals to Python data analysis and portfolio case studies.',
    duration: '6 weeks',
    type: 'learning_path',
    category: 'Data and AI',
    difficulty: 'Beginner',
    skillTag: 'Data Analysis',
    skillsGained: ['Excel', 'SQL', 'Python', 'Data Analysis'],
    learningObjectives: [
      'Master spreadsheet KPIs, SQL joins, and Python data cleaning',
      'Complete 2 portfolio-ready analytical assignments',
      'Pass SQL, Excel, and Data Analysis SETU assessments'
    ],
    contentUrl: 'https://docs.python.org/3/tutorial/',
    contentSourceLabel: 'Official Python & SQL Learning Guides',
    targetAudience: 'Students, Commerce/Science/Tech Graduates',
    learningPathSteps: [
      {
        title: 'Stage 1: Excel Formulas, Pivot Tables & KPI Dashboards',
        summary: 'Complete the Excel tutorial, build the Monthly Budget Tracker assignment, and pass the Excel Fundamentals assessment.',
        duration: 'Week 1–2'
      },
      {
        title: 'Stage 2: Relational SQL Queries & Aggregations',
        summary: 'Study SQL JOINs and GROUP BY, build the Student Management Database assignment, and earn your verified SQL badge.',
        duration: 'Week 3–4'
      },
      {
        title: 'Stage 3: Python Essentials & Analytical Storytelling',
        summary: 'Practice Python data structures, review descriptive statistics, and publish your completed projects on your SETU Portfolio.',
        duration: 'Week 5–6'
      }
    ]
  },
  {
    slug: 'path-frontend-web-dev',
    title: 'Learning Path: Modern Frontend Web Developer',
    description:
      'Build real interactive web applications step by step — starting from accessible HTML/CSS through ES6 JavaScript and React.',
    duration: '8 weeks',
    type: 'learning_path',
    category: 'Programming',
    difficulty: 'Beginner',
    skillTag: 'Web Development',
    skillsGained: ['HTML/CSS', 'JavaScript', 'React', 'UI/UX Design'],
    learningObjectives: [
      'Build responsive, accessible layouts with semantic HTML and CSS',
      'Write clean asynchronous JavaScript and modular React components',
      'Deploy a live portfolio project and earn verified technical badges'
    ],
    contentUrl: 'https://developer.mozilla.org/en-US/docs/Learn_web_development',
    contentSourceLabel: 'MDN & React Official Learning Paths',
    targetAudience: 'Students & Aspiring Web Developers',
    learningPathSteps: [
      {
        title: 'Stage 1: Semantic HTML5 & Responsive CSS',
        summary: 'Complete the HTML/CSS tutorial, ship your Responsive Portfolio assignment, and pass the HTML & CSS assessment.',
        duration: 'Week 1–2'
      },
      {
        title: 'Stage 2: Core JavaScript & Async APIs',
        summary: 'Master ES6 array methods, closures, and fetch error handling, then pass the JavaScript Core assessment.',
        duration: 'Week 3–5'
      },
      {
        title: 'Stage 3: React Components, Hooks & Deployment',
        summary: 'Build a multi-view React app with state and routing, deploy it live, and earn your React Basics verified badge.',
        duration: 'Week 6–8'
      }
    ]
  },
  {
    slug: 'path-digital-marketing-creative',
    title: 'Learning Path: Digital Marketing & Creative Brand Growth',
    description:
      'Combine visual hierarchy, content strategy, SEO fundamentals, and social media analytics to launch a creative digital career.',
    duration: '5 weeks',
    type: 'learning_path',
    category: 'Creative',
    difficulty: 'Beginner',
    skillTag: 'Digital Marketing',
    skillsGained: ['Digital Marketing', 'Content Writing', 'Social Media Marketing', 'Graphic Design'],
    learningObjectives: [
      'Create scannable copy and visually clean promotional graphics',
      'Plan multi-channel social campaigns with UTM tracking',
      'Verify Creative & Digital Marketing skills on your SETU profile'
    ],
    contentUrl: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    contentSourceLabel: 'Google Search Central & W3C Design Guides',
    targetAudience: 'Creative Learners, Freelancers, Small Business Founders',
    learningPathSteps: [
      {
        title: 'Stage 1: Visual Design & Accessible UX Basics',
        summary: 'Learn visual hierarchy, typography, and contrast fundamentals, then take the Graphic Design & UI/UX assessments.',
        duration: 'Week 1–2'
      },
      {
        title: 'Stage 2: SEO & Persuasive Content Writing',
        summary: 'Master search intent, web readability, and ethical copywriting with the Digital Marketing tutorial.',
        duration: 'Week 3–4'
      },
      {
        title: 'Stage 3: Campaign Execution & Portfolio Showcase',
        summary: 'Complete the 2-Week Social Media Campaign assignment and showcase it in your SETU Portfolio.',
        duration: 'Week 5'
      }
    ]
  },
  {
    slug: 'path-career-readiness',
    title: 'Learning Path: Placement & Career-Restart Readiness',
    description:
      'Designed for fresh graduates and career-restart professionals to sharpen aptitude, workplace communication, and interview confidence.',
    duration: '4 weeks',
    type: 'learning_path',
    category: 'Professional Development',
    difficulty: 'Beginner',
    skillTag: 'Communication Skills',
    skillsGained: ['Communication Skills', 'Time Management', 'Logical Reasoning', 'Problem Solving'],
    learningObjectives: [
      'Build sharp aptitude and logical reasoning speed for hiring tests',
      'Prepare polished STAR interview stories and concise workplace emails',
      'Organize your SETU profile, portfolio, and target applications'
    ],
    contentUrl: 'https://www.ncs.gov.in/',
    contentSourceLabel: 'National Career Service (NCS) Guidance',
    targetAudience: 'Freshers, Final-Year Students, Career Restarters',
    learningPathSteps: [
      {
        title: 'Stage 1: Workplace Communication & STAR Storytelling',
        summary: 'Complete the Workplace Communication tutorial and submit the 3-Email Professional Communication Suite.',
        duration: 'Week 1–2'
      },
      {
        title: 'Stage 2: Aptitude & Quantitative Warmup',
        summary: 'Take the Logical Reasoning, Verbal Ability, and General Aptitude assessments to build test-taking fluency.',
        duration: 'Week 3'
      },
      {
        title: 'Stage 3: Profile Polish & Targeted Applications',
        summary: 'Reach 90%+ SETU Profile Completion, add portfolio evidence, and explore matched jobs and government schemes.',
        duration: 'Week 4'
      }
    ]
  },
  ...EXTENDED_LEARNING_CATALOG
];
