import { AssessmentCategory, IQuestion } from '../../models/Assessment';

export interface SeedAssessment {
  slug: string;
  title: string;
  category: AssessmentCategory;
  domain: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillsEvaluated: string[];
  timed: boolean;
  questions: IQuestion[];
}

export const TECHNICAL_ASSESSMENTS: SeedAssessment[] = [
  {
    slug: 'python-fundamentals',
    title: 'Python Fundamentals Assessment',
    category: 'Technical',
    domain: 'Python',
    description:
      'Evaluate core Python syntax, data structures, functions, mutability, and common programming patterns.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Python'],
    timed: true,
    questions: [
      {
        id: 'py-1',
        question: 'Which Python data type is immutable?',
        options: ['list', 'dict', 'tuple', 'set'],
        correctAnswerIndex: 2,
        explanation: 'A tuple cannot be modified after creation, whereas lists, dicts, and sets are mutable.',
        skillTested: 'Python Data Types'
      },
      {
        id: 'py-2',
        question: 'What is the output of: len([x for x in range(10) if x % 2 == 0])?',
        options: ['4', '5', '6', '10'],
        correctAnswerIndex: 1,
        explanation: 'Even numbers in range(10) are 0, 2, 4, 6, and 8 — a total of 5 elements.',
        skillTested: 'Python List Comprehensions'
      },
      {
        id: 'py-3',
        question: 'Which method safely retrieves a value from a dictionary without raising KeyError if the key is missing?',
        options: ['dict.find(key)', 'dict.get(key)', 'dict.fetch(key)', 'dict.index(key)'],
        correctAnswerIndex: 1,
        explanation: 'dict.get(key, default) returns None (or the provided default) when a key does not exist.',
        skillTested: 'Python Dictionaries'
      },
      {
        id: 'py-4',
        question: 'What does the `with open("data.txt", "r") as f:` statement guarantee?',
        options: [
          'The file is opened in write mode automatically',
          'The file is automatically closed when the block exits',
          'The file is encrypted on disk',
          'The file is read line by line into a list'
        ],
        correctAnswerIndex: 1,
        explanation: 'Context managers using `with` ensure file handles are properly closed even if an exception occurs.',
        skillTested: 'Python File Handling'
      },
      {
        id: 'py-5',
        question: 'What is the output of `bool([])` in Python?',
        options: ['True', 'False', 'None', 'TypeError'],
        correctAnswerIndex: 1,
        explanation: 'Empty sequences and collections such as [], (), "", and {} evaluate to False in Python.',
        skillTested: 'Python Truthiness'
      }
    ]
  },
  {
    slug: 'java-programming',
    title: 'Java Programming Assessment',
    category: 'Technical',
    domain: 'Java',
    description:
      'Test object-oriented programming concepts, collections, exception handling, and JVM fundamentals in Java.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Java'],
    timed: true,
    questions: [
      {
        id: 'java-1',
        question: 'Which keyword prevents a Java class from being subclassed?',
        options: ['static', 'private', 'final', 'sealed-off'],
        correctAnswerIndex: 2,
        explanation: 'Declaring a class as `final` prevents any other class from extending it.',
        skillTested: 'Java OOP'
      },
      {
        id: 'java-2',
        question: 'How should you compare the character contents of two Java String objects?',
        options: ['str1 == str2', 'str1.equals(str2)', 'str1.compare(str2)', 'str1 === str2'],
        correctAnswerIndex: 1,
        explanation: '`equals()` compares string contents, while `==` compares object references.',
        skillTested: 'Java Strings'
      },
      {
        id: 'java-3',
        question: 'Which Java collection guarantees unique elements and does not allow duplicates?',
        options: ['ArrayList', 'LinkedList', 'HashSet', 'Vector'],
        correctAnswerIndex: 2,
        explanation: 'HashSet implements the Set interface, storing only unique elements.',
        skillTested: 'Java Collections'
      },
      {
        id: 'java-4',
        question: 'Which block in a try-catch-finally statement always executes regardless of whether an exception was thrown (assuming the JVM does not exit)?',
        options: ['try', 'catch', 'finally', 'throw'],
        correctAnswerIndex: 2,
        explanation: 'The `finally` block executes after try/catch completes, making it ideal for cleanup.',
        skillTested: 'Java Exception Handling'
      },
      {
        id: 'java-5',
        question: 'Which method signature is the standard entry point of a standalone Java application?',
        options: [
          'public void main(String[] args)',
          'public static void main(String[] args)',
          'static int main(String args)',
          'private static void main()'
        ],
        correctAnswerIndex: 1,
        explanation: 'The JVM looks for `public static void main(String[] args)` to start execution.',
        skillTested: 'Java Basics'
      }
    ]
  },
  {
    slug: 'artificial-intelligence',
    title: 'Artificial Intelligence Fundamentals',
    category: 'Technical',
    domain: 'Artificial Intelligence',
    description:
      'Evaluate core AI concepts including generative AI, prompt engineering, natural language processing, ethical AI, and hallucination verification.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Artificial Intelligence', 'Prompt Engineering'],
    timed: true,
    questions: [
      {
        id: 'ai-1',
        question: 'What is "hallucination" in the context of Large Language Models (LLMs)?',
        options: [
          'A hardware display error',
          'Generating confident-sounding information that is factually incorrect or fabricated',
          'Running out of disk space',
          'Compressing an image file'
        ],
        correctAnswerIndex: 1,
        explanation: 'LLMs predict plausible text rather than querying a verified fact database, so outputs must be fact-checked.',
        skillTested: 'Responsible AI Usage'
      },
      {
        id: 'ai-2',
        question: 'Which subfield of AI focuses on enabling computers to interpret and generate human language?',
        options: [
          'Computer Vision',
          'Natural Language Processing (NLP)',
          'Network Routing',
          'Relational Algebra'
        ],
        correctAnswerIndex: 1,
        explanation: 'NLP covers text classification, translation, summarization, and conversational systems.',
        skillTested: 'AI Subfields'
      },
      {
        id: 'ai-3',
        question: 'What practice consistently produces more accurate and relevant results when prompting an AI assistant?',
        options: [
          'Giving vague one-word instructions',
          'Providing clear context, constraints, target audience, and desired output format',
          'Sharing confidential customer passwords in the prompt',
          'Never reviewing the generated output'
        ],
        correctAnswerIndex: 1,
        explanation: 'Specific context, constraints, and format expectations guide AI models effectively while protecting privacy.',
        skillTested: 'Prompt Engineering'
      },
      {
        id: 'ai-4',
        question: 'Why is training data diversity important when building AI systems for hiring or lending?',
        options: [
          'It slows down training unnecessarily',
          'Biased or narrow training data can lead to unfair, discriminatory model decisions',
          'It eliminates the need for evaluation',
          'It guarantees 100% accuracy'
        ],
        correctAnswerIndex: 1,
        explanation: 'Models learn patterns from historical data, so unrepresentative data can perpetuate real-world bias.',
        skillTested: 'AI Ethics & Fairness'
      },
      {
        id: 'ai-5',
        question: 'Which data should NEVER be pasted into an unapproved public generative AI tool at work?',
        options: [
          'Publicly documented syntax questions',
          'Confidential customer Aadhaar/PAN records, passwords, or private company trade secrets',
          'General formatting tips',
          'Public open-source documentation'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sensitive personal and proprietary data must remain protected under workplace privacy and security policies.',
        skillTested: 'AI Data Privacy'
      }
    ]
  },
  {
    slug: 'digital-literacy',
    title: 'Digital Literacy & Online Workplace Safety',
    category: 'Technical',
    domain: 'Digital Literacy',
    description:
      'Test practical digital productivity, cloud collaboration, phishing detection, UPI/online payment safety, and document sharing.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Digital Literacy', 'Online Safety'],
    timed: true,
    questions: [
      {
        id: 'dl-1',
        question: 'You receive an email claiming you won a job offer and asking for ₹2,500 upfront as a "laptop security deposit" via UPI. What is this?',
        options: [
          'Standard Indian hiring practice',
          'A recruitment scam — legitimate employers never charge candidates upfront fees to get hired',
          'A government tax',
          'Mandatory interview insurance'
        ],
        correctAnswerIndex: 1,
        explanation: 'Legitimate employers never ask job seekers to pay registration, laptop, or security deposits.',
        skillTested: 'Scam & Phishing Detection'
      },
      {
        id: 'dl-2',
        question: 'When sharing a Google Doc resume with a recruiter, which permission setting is safest?',
        options: [
          'Anyone with the link can Edit',
          'Anyone with the link can View (read-only)',
          'Delete the file after sharing',
          'Share your Google account password'
        ],
        correctAnswerIndex: 1,
        explanation: 'View-only access lets recruiters read your resume without accidental edits.',
        skillTested: 'Cloud Collaboration'
      },
      {
        id: 'dl-3',
        question: 'Do you ever need to enter your UPI PIN to RECEIVE money from a client or employer?',
        options: [
          'Yes, always',
          'No — UPI PIN is ONLY required to authorize sending/paying money out of your account',
          'Only on weekends',
          'Only for amounts under ₹1,000'
        ],
        correctAnswerIndex: 1,
        explanation: 'Entering a UPI PIN debits your account; fraudsters trick victims using collect requests.',
        skillTested: 'Digital Payment Safety'
      },
      {
        id: 'dl-4',
        question: 'Which domain suffix indicates an official Government of India portal?',
        options: ['.gov.in or .nic.in', '.freejob-offer.xyz', '.winprize.click', '.promo-apply.net'],
        correctAnswerIndex: 0,
        explanation: 'Official Indian government websites use verified `.gov.in` or `.nic.in` (and officially designated portals).',
        skillTested: 'Information Verification'
      },
      {
        id: 'dl-5',
        question: 'What is the purpose of backing up important career documents (resume, certificates) to cloud storage?',
        options: [
          'Makes files impossible to open',
          'Ensures you can access them safely from any device even if a phone or laptop is lost',
          'Automatically posts them publicly',
          'Deletes local copies immediately'
        ],
        correctAnswerIndex: 1,
        explanation: 'Cloud backups protect critical career records against hardware loss and simplify applying from anywhere.',
        skillTested: 'Digital Productivity'
      }
    ]
  },
  {
    slug: 'sql-dbms',
    title: 'SQL & DBMS Assessment',
    category: 'Technical',
    domain: 'SQL',
    description:
      'Test relational database concepts, JOINs, GROUP BY aggregations, primary/foreign keys, and normalization.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['SQL', 'Database Management'],
    timed: true,
    questions: [
      {
        id: 'sql-1',
        question: 'Which SQL clause is used to filter aggregated groups produced by GROUP BY?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
        correctAnswerIndex: 1,
        explanation: '`WHERE` filters individual rows before grouping; `HAVING` filters groups after aggregation.',
        skillTested: 'SQL Aggregations'
      },
      {
        id: 'sql-2',
        question: 'What does a LEFT JOIN return?',
        options: [
          'Only rows matching in both tables',
          'All rows from the left table and matched rows from the right table (NULL if unmatched)',
          'All rows from the right table only',
          'The Cartesian product of both tables'
        ],
        correctAnswerIndex: 1,
        explanation: 'LEFT JOIN preserves every row from the left table and fills unmatched right-side columns with NULL.',
        skillTested: 'SQL Joins'
      },
      {
        id: 'sql-3',
        question: 'Which constraint uniquely identifies each record in a relational table and disallows NULL values?',
        options: ['FOREIGN KEY', 'INDEX', 'PRIMARY KEY', 'CHECK'],
        correctAnswerIndex: 2,
        explanation: 'A PRIMARY KEY enforces both uniqueness and NOT NULL on the column(s).',
        skillTested: 'DBMS Keys'
      },
      {
        id: 'sql-4',
        question: 'What does the "A" in ACID database transactions stand for?',
        options: ['Availability', 'Atomicity', 'Aggregation', 'Authorization'],
        correctAnswerIndex: 1,
        explanation: 'Atomicity ensures a transaction completes entirely or rolls back completely with no partial updates.',
        skillTested: 'DBMS Transactions'
      },
      {
        id: 'sql-5',
        question: 'Which SQL statement removes duplicate rows from a SELECT query result?',
        options: ['SELECT UNIQUE', 'SELECT DISTINCT', 'SELECT SINGLE', 'SELECT ONLY'],
        correctAnswerIndex: 1,
        explanation: '`SELECT DISTINCT` eliminates duplicate rows from the returned result set.',
        skillTested: 'SQL Queries'
      }
    ]
  },
  {
    slug: 'html-css',
    title: 'HTML & CSS Assessment',
    category: 'Technical',
    domain: 'Web Development',
    description:
      'Check semantic HTML5 elements, CSS Flexbox/Grid layouts, responsive design, and accessibility essentials.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['HTML/CSS', 'Web Development'],
    timed: true,
    questions: [
      {
        id: 'hc-1',
        question: 'Which HTML attribute provides alternative text for screen readers and broken images?',
        options: ['title', 'alt', 'src', 'aria-role'],
        correctAnswerIndex: 1,
        explanation: 'The `alt` attribute describes an image for assistive technologies and displays if the image fails to load.',
        skillTested: 'HTML Accessibility'
      },
      {
        id: 'hc-2',
        question: 'In CSS Flexbox, which property aligns items along the cross axis?',
        options: ['justify-content', 'align-items', 'flex-direction', 'order'],
        correctAnswerIndex: 1,
        explanation: '`justify-content` aligns along the main axis, while `align-items` aligns along the cross axis.',
        skillTested: 'CSS Flexbox'
      },
      {
        id: 'hc-3',
        question: 'What does `box-sizing: border-box;` do in CSS?',
        options: [
          'Excludes padding from element width',
          'Includes padding and border within the declared width and height',
          'Hides overflow content automatically',
          'Centers the box horizontally'
        ],
        correctAnswerIndex: 1,
        explanation: 'With `border-box`, declared width and height include content, padding, and border.',
        skillTested: 'CSS Box Model'
      },
      {
        id: 'hc-4',
        question: 'Which HTML5 element best represents the primary navigation links of a page?',
        options: ['<div>', '<section>', '<nav>', '<aside>'],
        correctAnswerIndex: 2,
        explanation: '`<nav>` semantically defines a block of major navigation links.',
        skillTested: 'Semantic HTML'
      },
      {
        id: 'hc-5',
        question: 'Which CSS selector has the highest specificity among the options below?',
        options: ['p', '.card', '#header', '*'],
        correctAnswerIndex: 2,
        explanation: 'ID selectors (`#header`) have higher specificity than class (`.card`), element (`p`), or universal (`*`) selectors.',
        skillTested: 'CSS Specificity'
      }
    ]
  },
  {
    slug: 'javascript-core',
    title: 'JavaScript Core Assessment',
    category: 'Technical',
    domain: 'JavaScript',
    description:
      'Measure proficiency in modern ES6+ JavaScript, promises, closures, array methods, and type equality.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['JavaScript'],
    timed: true,
    questions: [
      {
        id: 'js-1',
        question: 'What is the difference between `===` and `==` in JavaScript?',
        options: [
          'They behave identically',
          '`===` checks both value and type without type coercion',
          '`==` is only used for objects',
          '`===` converts strings to numbers first'
        ],
        correctAnswerIndex: 1,
        explanation: 'Strict equality (`===`) avoids implicit type coercion and checks both value and type.',
        skillTested: 'JavaScript Operators'
      },
      {
        id: 'js-2',
        question: 'Which Array method creates a new array containing only elements that pass a test function?',
        options: ['forEach()', 'filter()', 'reduce()', 'push()'],
        correctAnswerIndex: 1,
        explanation: '`Array.prototype.filter()` returns a new array of elements for which the callback returns truthy.',
        skillTested: 'JavaScript Arrays'
      },
      {
        id: 'js-3',
        question: 'What does `const` prevent when declaring an object in JavaScript?',
        options: [
          'Modifying properties inside the object',
          'Reassigning the variable binding to a different value',
          'Converting the object to JSON',
          'Iterating over object keys'
        ],
        correctAnswerIndex: 1,
        explanation: '`const` prevents reassigning the identifier, though properties of a referenced object remain mutable unless frozen.',
        skillTested: 'JavaScript Scope & Variables'
      },
      {
        id: 'js-4',
        question: 'What value does an `async` function always return?',
        options: ['A synchronous value', 'A Promise', 'An Iterator', 'Undefined'],
        correctAnswerIndex: 1,
        explanation: 'Every `async` function wraps its return value (or thrown error) in a Promise.',
        skillTested: 'Async JavaScript'
      },
      {
        id: 'js-5',
        question: 'What is a closure in JavaScript?',
        options: [
          'A syntax error caused by missing braces',
          'A function bundled with references to its surrounding lexical scope',
          'A method to close a browser tab',
          'A loop that ends with break'
        ],
        correctAnswerIndex: 1,
        explanation: 'A closure lets an inner function retain access to variables from its outer lexical scope even after the outer function returns.',
        skillTested: 'JavaScript Closures'
      }
    ]
  },
  {
    slug: 'react-basics',
    title: 'React Basics Assessment',
    category: 'Technical',
    domain: 'React',
    description:
      'Assess React components, props, hooks (`useState`, `useEffect`), list keys, and unidirectional data flow.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['React', 'JavaScript'],
    timed: true,
    questions: [
      {
        id: 'react-1',
        question: 'Why should each item in a rendered React list have a unique `key` prop?',
        options: [
          'To encrypt component props',
          'To help React efficiently identify which items changed, were added, or were removed',
          'To apply CSS classes automatically',
          'To sort the array alphabetically'
        ],
        correctAnswerIndex: 1,
        explanation: 'Stable unique keys let React reconcile list changes accurately without losing component state.',
        skillTested: 'React Rendering'
      },
      {
        id: 'react-2',
        question: 'When does `useEffect(() => { ... }, [])` execute?',
        options: [
          'On every re-render',
          'Once after the initial mount (and its cleanup runs on unmount)',
          'Never',
          'Only when props change'
        ],
        correctAnswerIndex: 1,
        explanation: 'An empty dependency array `[]` runs the effect once after mount and its cleanup on unmount.',
        skillTested: 'React Hooks'
      },
      {
        id: 'react-3',
        question: 'How should state be updated when the next state depends on the previous state value?',
        options: [
          'Mutate the state variable directly',
          'Use the functional updater form `setCount((prev) => prev + 1)`',
          'Modify `document.getElementById` directly',
          'Reload the page'
        ],
        correctAnswerIndex: 1,
        explanation: 'The functional updater guarantees you compute the next state from the latest queued state value.',
        skillTested: 'React State Management'
      },
      {
        id: 'react-4',
        question: 'In React, how does data primarily flow between parent and child components?',
        options: [
          'From child to parent automatically',
          'Unidirectionally from parent to child via props',
          'Via global window variables only',
          'Only through localStorage'
        ],
        correctAnswerIndex: 1,
        explanation: 'React uses unidirectional (top-down) data flow via props; children communicate upward via callback props.',
        skillTested: 'React Architecture'
      },
      {
        id: 'react-5',
        question: 'Which statement about React props is true?',
        options: [
          'Child components should directly mutate their received props',
          'Props are read-only inputs passed into a component',
          'Props can only be strings',
          'Props replace the need for useState entirely'
        ],
        correctAnswerIndex: 1,
        explanation: 'Props are immutable inputs to a component; changing UI data over time belongs in state.',
        skillTested: 'React Props'
      }
    ]
  },
  {
    slug: 'data-structures',
    title: 'Data Structures & Algorithms Basics',
    category: 'Technical',
    domain: 'Data Structures',
    description:
      'Verify understanding of time complexity, stacks, queues, hash maps, trees, and binary search.',
    durationMinutes: 15,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Data Structures', 'Algorithms'],
    timed: true,
    questions: [
      {
        id: 'dsa-1',
        question: 'What is the time complexity of Binary Search on a sorted array of size n?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswerIndex: 1,
        explanation: 'Binary search halves the search interval at every step, giving O(log n) worst-case time.',
        skillTested: 'Searching Algorithms'
      },
      {
        id: 'dsa-2',
        question: 'Which data structure follows the Last-In, First-Out (LIFO) principle?',
        options: ['Queue', 'Stack', 'Hash Table', 'Graph'],
        correctAnswerIndex: 1,
        explanation: 'A stack pushes and pops elements from the same end (LIFO).',
        skillTested: 'Linear Data Structures'
      },
      {
        id: 'dsa-3',
        question: 'What is the average-case time complexity for looking up a key in a well-designed Hash Table?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctAnswerIndex: 0,
        explanation: 'Hashing maps keys directly to buckets, achieving O(1) expected lookup time.',
        skillTested: 'Hash Maps'
      },
      {
        id: 'dsa-4',
        question: 'Which traversal of a Binary Search Tree visits nodes in ascending sorted order?',
        options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
        correctAnswerIndex: 1,
        explanation: 'Inorder traversal (Left → Root → Right) visits BST keys in sorted ascending order.',
        skillTested: 'Trees'
      },
      {
        id: 'dsa-5',
        question: 'Which data structure is typically used to implement Breadth-First Search (BFS) on a graph?',
        options: ['Stack', 'Queue', 'Min-Heap', 'Trie'],
        correctAnswerIndex: 1,
        explanation: 'BFS explores neighbors level by level using a First-In, First-Out (FIFO) Queue.',
        skillTested: 'Graph Traversal'
      }
    ]
  },
  {
    slug: 'machine-learning-basics',
    title: 'Machine Learning Basics Assessment',
    category: 'Technical',
    domain: 'Machine Learning',
    description:
      'Test foundational ML concepts: supervised vs unsupervised learning, overfitting, evaluation metrics, and cross-validation.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Intermediate',
    skillsEvaluated: ['Machine Learning', 'Data Science'],
    timed: true,
    questions: [
      {
        id: 'ml-1',
        question: 'Predicting house prices (a continuous numeric value) from historical labeled data is an example of:',
        options: ['Clustering', 'Regression', 'Dimensionality reduction', 'Association rules'],
        correctAnswerIndex: 1,
        explanation: 'Supervised learning with continuous numeric targets is regression.',
        skillTested: 'Supervised Learning'
      },
      {
        id: 'ml-2',
        question: 'What does "overfitting" mean in machine learning?',
        options: [
          'The model performs poorly on both training and test data',
          'The model memorizes training data noise and generalizes poorly to unseen data',
          'The dataset has too few features',
          'Training finishes too quickly'
        ],
        correctAnswerIndex: 1,
        explanation: 'Overfitting yields high training accuracy but poor generalization on validation/test data.',
        skillTested: 'Model Generalization'
      },
      {
        id: 'ml-3',
        question: 'Which algorithm is an unsupervised learning method used for grouping unlabeled data?',
        options: ['Linear Regression', 'Logistic Regression', 'K-Means Clustering', 'Decision Tree Classifier'],
        correctAnswerIndex: 2,
        explanation: 'K-Means partitions unlabeled observations into k clusters without ground-truth labels.',
        skillTested: 'Unsupervised Learning'
      },
      {
        id: 'ml-4',
        question: 'Why do we split data into separate training and test sets?',
        options: [
          'To reduce file size',
          'To evaluate how well the trained model generalizes to unseen data',
          'Because algorithms cannot read large files',
          'To remove missing values automatically'
        ],
        correctAnswerIndex: 1,
        explanation: 'Holding out a test set provides an unbiased estimate of real-world generalization.',
        skillTested: 'Model Evaluation'
      },
      {
        id: 'ml-5',
        question: 'When classes are heavily imbalanced (e.g., 99% negative, 1% positive), which metric is more informative than plain accuracy?',
        options: ['Precision, Recall, and F1-score', 'Training time', 'Number of rows', 'Epoch count'],
        correctAnswerIndex: 0,
        explanation: 'Precision, Recall, and F1-score capture performance on the minority class where raw accuracy can mislead.',
        skillTested: 'Classification Metrics'
      }
    ]
  },
  {
    slug: 'data-analysis-essentials',
    title: 'Data Analysis Essentials',
    category: 'Technical',
    domain: 'Data Analysis',
    description:
      'Assess data cleaning, descriptive statistics, visualization choices, and analytical reasoning.',
    durationMinutes: 12,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Data Analysis', 'Statistics'],
    timed: true,
    questions: [
      {
        id: 'da-1',
        question: 'Which measure of central tendency is least affected by extreme outliers?',
        options: ['Mean', 'Median', 'Range', 'Standard Deviation'],
        correctAnswerIndex: 1,
        explanation: 'The median depends only on the middle ordered value(s), making it robust against extreme outliers.',
        skillTested: 'Descriptive Statistics'
      },
      {
        id: 'da-2',
        question: 'Which chart type is most appropriate for showing a trend over continuous time periods?',
        options: ['Pie chart', 'Line chart', 'Radar chart', 'Word cloud'],
        correctAnswerIndex: 1,
        explanation: 'Line charts clearly depict continuity and directional trends over time.',
        skillTested: 'Data Visualization'
      },
      {
        id: 'da-3',
        question: 'What is the first critical step before building analytical reports from raw operational data?',
        options: [
          'Choosing color palettes',
          'Inspecting and cleaning missing values, duplicates, and inconsistent formats',
          'Deleting random rows',
          'Publishing immediately'
        ],
        correctAnswerIndex: 1,
        explanation: 'Data cleaning ensures downstream metrics and insights are reliable and accurate.',
        skillTested: 'Data Cleaning'
      },
      {
        id: 'da-4',
        question: 'If two variables have a strong positive correlation (r = 0.89), what can we conclude?',
        options: [
          'Variable A definitely causes Variable B',
          'As one variable increases, the other tends to increase, though causation is not proven',
          'There is no relationship between them',
          'Both variables must be identical'
        ],
        correctAnswerIndex: 1,
        explanation: 'Correlation indicates association in direction and strength, not causation by itself.',
        skillTested: 'Statistical Interpretation'
      },
      {
        id: 'da-5',
        question: 'What does a Pivot Table help an analyst do quickly?',
        options: [
          'Write compiled C++ code',
          'Summarize, group, and cross-tabulate large tabular datasets dynamically',
          'Design web CSS animations',
          'Encrypt database passwords'
        ],
        correctAnswerIndex: 1,
        explanation: 'Pivot tables let analysts aggregate and slice data across multiple dimensions rapidly.',
        skillTested: 'Spreadsheet Analytics'
      }
    ]
  },
  {
    slug: 'excel-fundamentals',
    title: 'Microsoft Excel Fundamentals',
    category: 'Technical',
    domain: 'Excel',
    description:
      'Test practical spreadsheet formulas, lookup functions, cell referencing, conditional formatting, and data tools.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Excel', 'Spreadsheet Analysis'],
    timed: true,
    questions: [
      {
        id: 'ex-1',
        question: 'What does `$A$1` represent in an Excel formula?',
        options: [
          'A currency value',
          'An absolute cell reference that does not change when copied',
          'A relative cell reference',
          'A syntax error'
        ],
        correctAnswerIndex: 1,
        explanation: 'Dollar signs lock both the column (`$A`) and row (`$1`) during copy/fill operations.',
        skillTested: 'Excel Cell References'
      },
      {
        id: 'ex-2',
        question: 'Which formula sums values in B2:B20 only where A2:A20 equals "North"?',
        options: [
          '=SUM(B2:B20, "North")',
          '=SUMIF(A2:A20, "North", B2:B20)',
          '=COUNT(A2:A20, "North")',
          '=AVERAGE(B2:B20)'
        ],
        correctAnswerIndex: 1,
        explanation: '`SUMIF(range, criteria, sum_range)` sums cells that meet a single condition.',
        skillTested: 'Excel Conditional Formulas'
      },
      {
        id: 'ex-3',
        question: 'In `=VLOOKUP(E2, A2:C50, 3, FALSE)`, what does `FALSE` specify?',
        options: [
          'Approximate match',
          'Exact match lookup',
          'Case-sensitive sort',
          'Ignore column 3'
        ],
        correctAnswerIndex: 1,
        explanation: 'Setting range_lookup to `FALSE` enforces an exact match instead of an approximate match.',
        skillTested: 'Excel Lookups'
      },
      {
        id: 'ex-4',
        question: 'Which Excel feature highlights cells automatically based on rules (such as values below target)?',
        options: ['Data Validation', 'Conditional Formatting', 'Freeze Panes', 'Text to Columns'],
        correctAnswerIndex: 1,
        explanation: 'Conditional Formatting dynamically styles cells when they satisfy defined rules.',
        skillTested: 'Excel Formatting'
      },
      {
        id: 'ex-5',
        question: 'Which function returns the number of non-empty cells in a range (including text and numbers)?',
        options: ['COUNT()', 'COUNTA()', 'SUM()', 'LEN()'],
        correctAnswerIndex: 1,
        explanation: '`COUNT()` counts only numeric cells, whereas `COUNTA()` counts all non-blank cells.',
        skillTested: 'Excel Core Functions'
      }
    ]
  },
  {
    slug: 'computer-fundamentals',
    title: 'Computer Fundamentals & Digital Literacy',
    category: 'Technical',
    domain: 'Computer Fundamentals',
    description:
      'Evaluate essential operating system concepts, hardware/software fundamentals, internet safety, and file management.',
    durationMinutes: 10,
    passingScore: 60,
    difficulty: 'Beginner',
    skillsEvaluated: ['Computer Fundamentals', 'Digital Literacy'],
    timed: true,
    questions: [
      {
        id: 'cf-1',
        question: 'Which type of computer memory is volatile and loses its contents when power is turned off?',
        options: ['SSD', 'Hard Disk Drive', 'RAM', 'USB Flash Drive'],
        correctAnswerIndex: 2,
        explanation: 'RAM (Random Access Memory) holds active working data temporarily and clears when powered off.',
        skillTested: 'Computer Hardware'
      },
      {
        id: 'cf-2',
        question: 'What does HTTPS indicate compared to plain HTTP when visiting a website?',
        options: [
          'The website is offline',
          'Data exchanged between your browser and the server is encrypted via TLS/SSL',
          'The page contains no images',
          'The site requires paid software'
        ],
        correctAnswerIndex: 1,
        explanation: 'HTTPS encrypts web traffic in transit and verifies server identity via digital certificates.',
        skillTested: 'Cybersecurity Basics'
      },
      {
        id: 'cf-3',
        question: 'What is the primary role of an Operating System (such as Windows, Linux, or macOS)?',
        options: [
          'Only editing text documents',
          'Managing hardware resources, processes, memory, and providing an interface for applications',
          'Replacing internet routers',
          'Printing photographs exclusively'
        ],
        correctAnswerIndex: 1,
        explanation: 'An OS coordinates hardware resources and provides core services for user programs.',
        skillTested: 'Operating Systems'
      },
      {
        id: 'cf-4',
        question: 'Which practice best protects your online accounts from unauthorized access?',
        options: [
          'Reusing one simple password everywhere',
          'Using unique strong passwords and enabling Two-Factor Authentication (2FA)',
          'Sharing OTPs with unknown callers',
          'Clicking unverified password-reset links'
        ],
        correctAnswerIndex: 1,
        explanation: 'Unique passwords combined with 2FA dramatically reduce account takeover risk.',
        skillTested: 'Digital Safety'
      },
      {
        id: 'cf-5',
        question: 'Which file format is best for sharing a finalized resume so its layout remains consistent across devices?',
        options: ['.txt', '.pdf', '.tmp', '.csv'],
        correctAnswerIndex: 1,
        explanation: 'PDF preserves fonts, margins, and formatting reliably across operating systems and viewers.',
        skillTested: 'Office Productivity'
      }
    ]
  }
];
