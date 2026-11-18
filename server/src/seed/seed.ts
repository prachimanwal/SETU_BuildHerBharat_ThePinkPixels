import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';
import { User } from '../models/User';
import { Assessment } from '../models/Assessment';
import { AssessmentAttempt } from '../models/AssessmentAttempt';
import { LearningResource } from '../models/LearningResource';
import { UserLearningProgress } from '../models/UserLearningProgress';
import { PortfolioProject } from '../models/PortfolioProject';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { SavedOpportunity } from '../models/SavedOpportunity';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { Report } from '../models/Report';
import { SupportTicket } from '../models/SupportTicket';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected. Clearing previous test data...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Assessment.deleteMany({}),
      AssessmentAttempt.deleteMany({}),
      LearningResource.deleteMany({}),
      UserLearningProgress.deleteMany({}),
      PortfolioProject.deleteMany({}),
      Opportunity.deleteMany({}),
      Application.deleteMany({}),
      SavedOpportunity.deleteMany({}),
      GovernmentScheme.deleteMany({}),
      Report.deleteMany({}),
      SupportTicket.deleteMany({})
    ]);

    console.log('[Seed] Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const seekerPasswordHash = await bcrypt.hash('SetuDemo@2026', salt);
    const employerPasswordHash = await bcrypt.hash('SetuDemo@2026', salt);
    const adminPasswordHash = await bcrypt.hash('SetuAdmin@2026', salt);

    // 1. Demo Job Seeker: Priya Sharma
    const seeker = await User.create({
      name: 'Priya Sharma',
      email: 'seeker@setu.demo',
      passwordHash: seekerPasswordHash,
      role: 'seeker',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      seekerProfile: {
        headline: 'Aspiring Digital Designer & Content Creator | Returning to Career',
        phone: '+91 98765 43210',
        location: {
          city: 'Sonipat',
          state: 'Haryana',
          isRural: true
        },
        languages: ['Hindi', 'English', 'Haryanvi'],
        educationLevel: 'Graduate',
        qualifications: [
          {
            title: 'Bachelor of Arts (Humanities)',
            institute: 'Maharshi Dayanand University',
            year: '2021'
          }
        ],
        skills: ['Canva', 'Graphic Design', 'Social Media Management', 'Hindi Typing', 'HTML Basics'],
        experienceLevel: 'Career break / Returning to work',
        careerGoals: 'Looking for flexible remote or hybrid creative design roles and digital freelancing opportunities.',
        interests: ['Visual Design', 'Rural Artisans Promotion', 'Digital Marketing', 'E-commerce'],
        preferredWorkMode: 'remote',
        resumeUrl: 'https://setu.demo/resumes/priya_sharma_portfolio_summary.pdf',
        isCareerRestart: true
      }
    });

    // 2. Pending Employer: BharatTech Innovations
    const pendingEmployer = await User.create({
      name: 'Vikram Mehta',
      email: 'pending@startup.demo',
      passwordHash: employerPasswordHash,
      role: 'employer',
      employerProfile: {
        companyName: 'BharatTech Innovations',
        industry: 'Agritech & Rural Logistics',
        website: 'https://bharattech.example.com',
        companySize: '11-50',
        description: 'Building connected supply chain tools for tier-2 and tier-3 farmer producer organisations.',
        verificationStatus: 'pending',
        verificationDocs: {
          docType: 'GSTIN Registration Certificate',
          docNumber: '06AAACB1234F1Z8',
          notes: 'Incorporation certificate and MSME Udyam registration uploaded. Awaiting administrative review.',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // 3. Approved Demo Employer: Gramin Digital Services
    const approvedEmployer = await User.create({
      name: 'Ananya Rao',
      email: 'employer@techcorp.demo',
      passwordHash: employerPasswordHash,
      role: 'employer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      employerProfile: {
        companyName: 'Gramin Digital Services Pvt Ltd',
        industry: 'Information Technology & Creative Media',
        website: 'https://gramindigital.example.com',
        companySize: '51-200',
        description: 'Empowering regional brands and rural enterprises with high-quality visual creative, social storytelling, and customer support.',
        verificationStatus: 'approved',
        verificationDocs: {
          docType: 'GSTIN / CIN Certificate',
          docNumber: '07AAACG9876E1Z2',
          notes: 'Verified corporate registration with Ministry of Corporate Affairs.',
          submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        adminReviewNotes: 'Verified against MCA portal and active GSTIN registry. Approved for public listings.',
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      }
    });

    // 4. Platform Admin
    const admin = await User.create({
      name: 'SETU National Administrator',
      email: 'admin@setu.gov.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    });

    console.log('[Seed] Seeding Skill Assessments...');
    // 1. Web Development Assessment
    const webDevAssessment = await Assessment.create({
      title: 'Web Development Foundations & Practical Debugging',
      titleHindi: 'वेब डेवलपमेंट बुनियादी सिद्धांत और व्यावहारिक डिबगिंग',
      domain: 'web_development',
      description: 'Assess essential HTML, modern responsive CSS (Flexbox/Grid), and core JavaScript logic for real-world web pages.',
      descriptionHindi: 'एचटीएमएल, आधुनिक उत्तरदायी सीएसएस और वास्तविक वेब पेजों के लिए जावास्क्रिप्ट कौशल का परीक्षण करें।',
      estimatedMinutes: 15,
      passingScore: 60,
      questions: [
        {
          id: 'web_q1',
          question: 'Which CSS property configuration is best suited to vertically and horizontally center a child container inside a parent element?',
          questionHindi: 'किसी पैरेंट तत्व के भीतर चाइल्ड कंटेनर को लंबवत और क्षैतिज रूप से केंद्र में संरेखित करने के लिए कौन सा सीएसएस कॉन्फ़िगरेशन सर्वोत्तम है?',
          options: [
            'display: flex; justify-content: center; align-items: center;',
            'text-align: center; margin: auto;',
            'display: inline; vertical-align: middle;',
            'float: center; clear: both;'
          ],
          optionsHindi: [
            'display: flex; justify-content: center; align-items: center;',
            'text-align: center; margin: auto;',
            'display: inline; vertical-align: middle;',
            'float: center; clear: both;'
          ],
          correctOptionIndex: 0,
          skillTag: 'CSS Flexbox',
          explanation: 'Flexbox with justify-content: center and align-items: center achieves centering along both axes reliably.'
        },
        {
          id: 'web_q2',
          question: 'Why is it critical to include alt text on an <img> tag in HTML?',
          questionHindi: 'HTML में <img> टैग पर alt टेक्स्ट शामिल करना क्यों महत्वपूर्ण है?',
          options: [
            'It accelerates image download speed over the network',
            'It enables screen readers for visually impaired users and displays fallback text if the image fails to load',
            'It applies a default border style to the image element',
            'It automatically compresses PNG images to WebP format'
          ],
          optionsHindi: [
            'यह नेटवर्क पर छवि डाउनलोड गति को तेज करता है',
            'यह दृष्टिबाधित उपयोगकर्ताओं के लिए स्क्रीन रीडर को सक्षम बनाता है और लोड न होने पर टेक्स्ट दिखाता है',
            'यह छवि तत्व पर डिफ़ॉल्ट बॉर्डर शैली लागू करता है',
            'यह स्वचालित रूप से पीएनजी छवियों को वेबपी में बदलता है'
          ],
          correctOptionIndex: 1,
          skillTag: 'Web Accessibility & HTML',
          explanation: 'Alt attributes are vital for web accessibility and as fallback content.'
        },
        {
          id: 'web_q3',
          question: 'In modern JavaScript, how do you handle asynchronous operations cleanly without callback hell?',
          questionHindi: 'आधुनिक जावास्क्रिप्ट में कॉलबैक समस्याओं के बिना एसिंक्रोनस संचालन को कैसे नियंत्रित किया जाता है?',
          options: [
            'Using async/await syntax with Promise handling and try/catch blocks',
            'Using synchronous while loops with sleep timers',
            'By nesting multiple setTimeout callbacks',
            'By disabling JavaScript event loop in the browser'
          ],
          optionsHindi: [
            'Promise हैंडलिंग और try/catch ब्लॉक के साथ async/await सिंटैक्स का उपयोग करके',
            'स्लीप टाइमर के साथ सिंक्रोनस while लूप का उपयोग करके',
            'एकाधिक setTimeout कॉलबैक नेस्ट करके',
            'ब्राउज़र में जावास्क्रिप्ट इवेंट लूप को अक्षम करके'
          ],
          correctOptionIndex: 0,
          skillTag: 'JavaScript Async/Await',
          explanation: 'async/await allows asynchronous code to be read sequentially and handled safely with try/catch.'
        },
        {
          id: 'web_q4',
          question: 'When designing for users in rural areas with low-bandwidth connections, what is the best practice for web images?',
          questionHindi: 'कम बैंडविड्थ वाले ग्रामीण क्षेत्रों के उपयोगकर्ताओं के लिए वेब छवियों का सर्वोत्तम अभ्यास क्या है?',
          options: [
            'Use uncompressed 4K TIFF images directly from cameras',
            'Compress images, use modern formats like WebP, and implement lazy-loading (loading="lazy")',
            'Embed images as base64 encoded strings in the HTML head',
            'Disable all visual media entirely from the site'
          ],
          optionsHindi: [
            'कैमरे से सीधे असम्पीडित 4K TIFF छवियों का उपयोग करें',
            'छवियों को कंप्रेस करें, WebP प्रारूप का उपयोग करें और lazy-loading लागू करें',
            'HTML हेड में बेस64 एनकोडेड स्ट्रिंग के रूप में छवियों को एम्बेड करें',
            'साइट से सभी विज़ुअल मीडिया को पूरी तरह से अक्षम करें'
          ],
          correctOptionIndex: 1,
          skillTag: 'Performance & Optimization',
          explanation: 'Modern compression (WebP/AVIF) and lazy loading ensure fast load times on constrained networks.'
        },
        {
          id: 'web_q5',
          question: 'Which meta tag in HTML ensures a responsive layout adapts properly to mobile phone screens?',
          questionHindi: 'HTML में कौन सा मेटा टैग सुनिश्चित करता है कि एक उत्तरदायी लेआउट मोबाइल स्क्रीन के अनुकूल हो?',
          options: [
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<meta name="screen" content="mobile-first">',
            '<meta name="resolution" content="1080p">',
            '<meta name="handheld" content="true">'
          ],
          optionsHindi: [
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<meta name="screen" content="mobile-first">',
            '<meta name="resolution" content="1080p">',
            '<meta name="handheld" content="true">'
          ],
          correctOptionIndex: 0,
          skillTag: 'Responsive Web Design',
          explanation: 'The viewport meta tag instructs mobile browsers to render at device width with 1.0 initial zoom.'
        }
      ]
    });

    // 2. Graphic & Digital Design Assessment
    const graphicDesignAssessment = await Assessment.create({
      title: 'Digital Graphic Design & Brand Communication',
      titleHindi: 'डिजिटल ग्राफिक डिज़ाइन और ब्रांड संचार',
      domain: 'graphic_design',
      description: 'Evaluate practical design instincts: Canva layouts, color contrast, typography hierarchy, and social media deliverables.',
      descriptionHindi: 'कैनवा लेआउट, रंग कंट्रास्ट, टाइपोग्राफी पदानुक्रम और सोशल मीडिया पोस्टर्स की व्यावहारिक समझ का मूल्यांकन करें।',
      estimatedMinutes: 12,
      passingScore: 60,
      questions: [
        {
          id: 'gd_q1',
          question: 'When creating an announcement poster for a local workshop, what is visual hierarchy?',
          questionHindi: 'स्थानीय कार्यशाला के लिए एक पोस्टर बनाते समय, विज़ुअल पदानुक्रम (Visual Hierarchy) क्या है?',
          options: [
            'Arranging elements so the viewer’s eye naturally grasps the most important headline first, followed by details like date and location',
            'Making all text elements exactly the same font size and weight',
            'Using as many distinct colors and fonts as possible',
            'Filling every single pixel of whitespace with patterns'
          ],
          optionsHindi: [
            'तत्वों को इस तरह व्यवस्थित करना कि दर्शक की नज़र सबसे पहले मुख्य शीर्षक पर पड़े, फिर तारीख और स्थान पर',
            'सभी टेक्स्ट तत्वों को बिल्कुल समान फ़ॉन्ट आकार और मोटाई में रखना',
            'यथासंभव विभिन्न रंगों और फ़ॉन्ट शैलियों का उपयोग करना',
            'व्हाइटस्पेस के प्रत्येक पिक्सेल को पैटर्न से भरना'
          ],
          correctOptionIndex: 0,
          skillTag: 'Visual Hierarchy & Layout',
          explanation: 'Visual hierarchy guides the viewer through information according to significance.'
        },
        {
          id: 'gd_q2',
          question: 'To guarantee that text is easily readable on mobile screens over photographic backgrounds, what should you do?',
          questionHindi: 'फ़ोटो बैकग्राउंड के ऊपर मोबाइल स्क्रीन पर टेक्स्ट आसानी से पढ़ने योग्य बनाने के लिए क्या करना चाहिए?',
          options: [
            'Add a semi-transparent dark or light overlay card behind the text to ensure high contrast',
            'Use light yellow text directly on a bright sky photo',
            'Use tiny decorative cursive typography',
            'Remove the text completely'
          ],
          optionsHindi: [
            'उच्च कंट्रास्ट सुनिश्चित करने के लिए टेक्स्ट के पीछे पारदर्शी कार्ड या ओवरले जोड़ें',
            'उज्ज्वल आकाश की तस्वीर पर सीधे हल्के पीले रंग के टेक्स्ट का उपयोग करें',
            'बहुत छोटी सजावटी घसीट टाइपोग्राफी का उपयोग करें',
            'टेक्स्ट को पूरी तरह से हटा दें'
          ],
          correctOptionIndex: 0,
          skillTag: 'Color Contrast & Readability',
          explanation: 'Semi-transparent overlays stabilize contrast regardless of background variation.'
        },
        {
          id: 'gd_q3',
          question: 'What is the recommended export format for digital social media graphics containing clean text and vector illustrations?',
          questionHindi: 'साफ टेक्स्ट और वेक्टर चित्रण वाले सोशल मीडिया ग्राफिक्स के लिए अनुशंसित निर्यात प्रारूप क्या है?',
          options: [
            'PNG format (lossless compression with sharp text and transparent background support)',
            'Low-quality JPEG with high artifacting',
            'BMP (Bitmap) uncompressed',
            'Animated GIF with 8-color palette'
          ],
          optionsHindi: [
            'PNG प्रारूप (स्पष्ट टेक्स्ट और पारदर्शी बैकग्राउंड के साथ दोषरहित संपीडन)',
            'उच्च आर्टिफैक्ट्स वाला निम्न-गुणवत्ता वाला JPEG',
            'असंपीड़ित BMP (बिटमैप)',
            '8-रंग पैलेट वाला एनिमेटेड GIF'
          ],
          correctOptionIndex: 0,
          skillTag: 'Asset Exporting & Formats',
          explanation: 'PNG maintains crisp edges and sharp text rendering without JPEG compression blur.'
        },
        {
          id: 'gd_q4',
          question: 'In Canva or Figma, how many font families should you typically pair in a single promotional graphic for professional aesthetics?',
          questionHindi: 'पेशेवर डिज़ाइन के लिए एक प्रचार ग्राफिक में आमतौर पर कितने फ़ॉन्ट परिवारों का उपयोग करना चाहिए?',
          options: [
            'Maximum 2 complementary font families (e.g., strong sans-serif header + readable body font)',
            'At least 5 to 6 contrasting fonts to show variety',
            'Only Comic Sans throughout the document',
            'A different font for every individual word'
          ],
          optionsHindi: [
            'अधिकतम 2 पूरक फ़ॉन्ट परिवार (जैसे मजबूत हेडर + स्पष्ट बॉडी फ़ॉन्ट)',
            'विविधता दिखाने के लिए कम से कम 5 से 6 फ़ॉन्ट',
            'पूरे दस्तावेज़ में केवल एक ही अव्यवसायिक फ़ॉन्ट',
            'प्रत्येक अलग शब्द के लिए एक अलग फ़ॉन्ट'
          ],
          correctOptionIndex: 0,
          skillTag: 'Typography & Pairing',
          explanation: 'Limiting to 2 harmonious fonts preserves professional cohesion and clean readability.'
        },
        {
          id: 'gd_q5',
          question: 'What is the primary role of "Negative Space" (Whitespace) in marketing design?',
          questionHindi: 'मार्केटिंग डिज़ाइन में "नेगेटिव स्पेस" (व्हाइटस्पेस) की प्राथमिक भूमिका क्या है?',
          options: [
            'Giving elements breathing room so the layout does not look cluttered and core calls to action stand out',
            'It represents wasted space that must always be filled with stickers',
            'It reduces the file size by deleting ink',
            'It prevents the viewer from looking at the logo'
          ],
          optionsHindi: [
            'तत्वों को सांस लेने की जगह देना ताकि लेआउट अव्यवस्थित न दिखे और मुख्य संदेश प्रमुखता से उभरे',
            'यह व्यर्थ स्थान है जिसे हमेशा स्टिकर से भरना चाहिए',
            'यह स्याही हटाकर फ़ाइल का आकार कम करता है',
            'यह दर्शक को लोगो देखने से रोकता है'
          ],
          correctOptionIndex: 0,
          skillTag: 'Layout & Negative Space',
          explanation: 'Whitespace brings focus to key messages and gives content professional breathing room.'
        }
      ]
    });

    // 3. Practical / Vocational Skills Assessment
    const vocationalAssessment = await Assessment.create({
      title: 'Digital Office Operations, Data Handling & Practical Safety',
      titleHindi: 'डिजिटल कार्यालय संचालन, डेटा प्रबंधन और व्यावहारिक सुरक्षा',
      domain: 'practical_vocational',
      description: 'Assess core real-world workplace skills: Excel/Google Sheets calculations, professional communication, data confidentiality, and workshop safety.',
      descriptionHindi: 'स्प्रेडशीट गणना, पेशेवर संचार, डेटा गोपनीयता और कार्यस्थल सुरक्षा का परीक्षण करें।',
      estimatedMinutes: 15,
      passingScore: 60,
      questions: [
        {
          id: 'voc_q1',
          question: 'In a spreadsheet (Excel or Google Sheets), which formula correctly sums the values in cells B2 through B25?',
          questionHindi: 'स्प्रेडशीट (एक्सेल या गूगल शीट्स) में कौन सा सूत्र सेल B2 से B25 तक के मानों को सही ढंग से जोड़ता है?',
          options: [
            '=SUM(B2:B25)',
            '=TOTAL(B2..B25)',
            '=ADD(B2-B25)',
            '=COUNT(B2:B25)'
          ],
          optionsHindi: [
            '=SUM(B2:B25)',
            '=TOTAL(B2..B25)',
            '=ADD(B2-B25)',
            '=COUNT(B2:B25)'
          ],
          correctOptionIndex: 0,
          skillTag: 'Spreadsheet Formulas',
          explanation: '=SUM(start:end) is the standard formula to add numeric values across a range.'
        },
        {
          id: 'voc_q2',
          question: 'A client calls with an urgent complaint regarding a delayed delivery. What is the most professional response?',
          questionHindi: 'एक ग्राहक विलंबित डिलीवरी के संबंध में शिकायत करता है। सबसे पेशेवर प्रतिक्रिया क्या है?',
          options: [
            'Listen patiently without interrupting, acknowledge their inconvenience, record order details, and commit to a clear follow-up timeframe',
            'Immediately hang up the call because you were not personally responsible',
            'Blame the logistics delivery agent and argue with the customer',
            'Promise an unrealistic solution that you cannot deliver'
          ],
          optionsHindi: [
            'बिना टोकें धैर्यपूर्वक सुनें, उनकी असुविधा को समझें, विवरण नोट करें और स्पष्ट समय सीमा का वादा करें',
            'कॉल काट दें क्योंकि आपकी व्यक्तिगत गलती नहीं थी',
            'डिलीवरी एजेंट को दोष दें और ग्राहक से बहस करें',
            'एक अवास्तविक वादा करें जिसे आप पूरा नहीं कर सकते'
          ],
          correctOptionIndex: 0,
          skillTag: 'Customer Communication',
          explanation: 'Active listening, empathy, structured logging, and realistic follow-ups build trust.'
        },
        {
          id: 'voc_q3',
          question: 'When maintaining citizen or customer records, what constitutes a critical data privacy breach?',
          questionHindi: 'ग्राहकों के रिकॉर्ड को बनाए रखते समय, क्या एक गंभीर डेटा गोपनीयता उल्लंघन माना जाता है?',
          options: [
            'Sharing an unredacted spreadsheet containing phone numbers, Aadhaar, and bank account details on a public social media group',
            'Backing up encrypted files to an authorized organization server',
            'Sorting columns alphabetically by customer last name',
            'Formatting phone numbers with a +91 country code prefix'
          ],
          optionsHindi: [
            'सार्वजनिक सोशल मीडिया समूह पर फोन नंबर, आधार और बैंक विवरण वाली स्प्रेडशीट साझा करना',
            'अधिकृत सर्वर पर एन्क्रिप्टेड फ़ाइलों का बैकअप लेना',
            'ग्राहक के उपनाम के अनुसार कॉलम को वर्णानुक्रम में सॉर्ट करना',
            'फ़ोन नंबरों को +91 देश कोड के साथ प्रारूपित करना'
          ],
          correctOptionIndex: 0,
          skillTag: 'Data Privacy & Security',
          explanation: 'Sharing personally identifiable information (PII) on public channels is a severe violation of privacy regulations.'
        },
        {
          id: 'voc_q4',
          question: 'Before inspecting or repairing any electrical appliance, machine or wiring, what is the mandatory first safety step?',
          questionHindi: 'किसी भी विद्युत उपकरण या वायरिंग का निरीक्षण या मरम्मत करने से पहले पहला अनिवार्य सुरक्षा कदम क्या है?',
          options: [
            'Isolate power by switching off the main breaker/MCB and verifying voltage with a test meter',
            'Touch the wires with wet hands to check for heat',
            'Wrap exposed joints with decorative paper tape',
            'Work in a wet flooded room without footwear'
          ],
          optionsHindi: [
            'मुख्य ब्रेकर/MCB को बंद करके बिजली काटें और टेस्टर से वोल्टेज की पुष्टि करें',
            'गर्मी की जांच के लिए गीले हाथों से तारों को छुएं',
            'खुले जोड़ों को सजावटी कागज़ के टेप से लपेटें',
            'बिना जूते के पानी भरे कमरे में काम करें'
          ],
          correctOptionIndex: 0,
          skillTag: 'Electrical Safety Protocols',
          explanation: 'Lockout/Tagout and power disconnection verified with a voltage tester prevents fatal electrocution.'
        },
        {
          id: 'voc_q5',
          question: 'What is a key advantage of cloud storage (e.g. Google Drive, DigiLocker) for small business record keeping?',
          questionHindi: 'छोटे व्यवसायों के रिकॉर्ड रखने के लिए क्लाउड स्टोरेज का मुख्य लाभ क्या है?',
          options: [
            'Secure automatic backup, multi-device access, and prevention of data loss if a local phone/laptop is damaged',
            'It completely removes the need for internet connectivity',
            'It automatically pays business taxes without review',
            'It deletes old files every Friday'
          ],
          optionsHindi: [
            'सुरक्षित ऑटो-बैकअप, किसी भी डिवाइस से पहुंच, और फोन/लैपटॉप खराब होने पर डेटा सुरक्षित रहना',
            'यह इंटरनेट कनेक्टिविटी की आवश्यकता को पूरी तरह समाप्त कर देता है',
            'यह बिना समीक्षा के व्यावसायिक करों का भुगतान करता है',
            'यह हर शुक्रवार को पुरानी फाइलें हटा देता है'
          ],
          correctOptionIndex: 0,
          skillTag: 'Cloud Storage & Digital Tools',
          explanation: 'Cloud storage ensures disaster recovery, seamless synchronization, and access anywhere.'
        }
      ]
    });

    console.log('[Seed] Seeding Learning Resources & Practical Assignments...');
    // Learning Resources
    const lrCanva = await LearningResource.create({
      title: 'Canva Social Media Poster & Asset Design',
      titleHindi: 'कैनवा सोशल मीडिया पोस्टर और एसेट डिज़ाइन',
      domain: 'graphic_design',
      type: 'practical_assignment',
      skillTag: 'Visual Hierarchy & Layout',
      durationMinutes: 45,
      difficulty: 'beginner',
      summary: 'Master layout grids, contrasting color palettes, and typographic hierarchy in Canva to produce high-impact marketing creatives.',
      summaryHindi: 'कैनवा में लेआउट ग्रिड, विपरीत रंग और टाइपोग्राफी में महारत हासिल करें।',
      externalUrl: 'https://www.canva.com/designschool/',
      contentMarkdown: `### Overview\nLearn how to compose balanced social media graphics using free design tools like Canva.\n\n#### Key Learnings:\n1. 60-30-10 Color Rule for cohesive brand identity.\n2. Font Pairing: Contrast a bold geometric sans-serif title with a clean legible body font.\n3. Mobile viewport testing: ensure phone readability.\n\n### Practical Assignment\nDesign an Instagram recruitment poster for a women-led artisan collective in rural Haryana.\n- Dimensions: 1080x1080px.\n- Must include: Headline, 3 key benefits (flexible hours, fair pay, training provided), date/contact, and a high contrast call-to-action button.`,
      assignmentBrief: 'Design a 1080x1080px announcement graphic for an artisan collective recruitment drive. Include title, 3 bullet points, and contact info with clear visual hierarchy.',
      assignmentBriefHindi: 'कारीगर समूह भर्ती अभियान के लिए 1080x1080px का ग्राफ़िक डिज़ाइन करें। स्पष्ट पदानुक्रम के साथ शीर्षक, 3 बिंदु और संपर्क शामिल करें।',
      sampleDeliverable: 'A published Canva share link or exported image demonstrating balanced margins, contrast overlay, and clean typography.'
    });

    const lrContrast = await LearningResource.create({
      title: 'Color Contrast & Mobile Readability Masterclass',
      titleHindi: 'कलर कंट्रास्ट और मोबाइल पठनीयता मास्टरक्लास',
      domain: 'graphic_design',
      type: 'tutorial',
      skillTag: 'Color Contrast & Readability',
      durationMinutes: 30,
      difficulty: 'beginner',
      summary: 'Ensure your designs meet WCAG accessibility standards so elderly and low-vision users on mobile phones can effortlessly read your messaging.',
      summaryHindi: 'सुनिश्चित करें कि आपके डिज़ाइन मोबाइल पर आसानी से पढ़े जा सकें।',
      externalUrl: 'https://webaim.org/resources/contrastchecker/',
      contentMarkdown: `### Color Contrast Fundamentals\nText contrast ratio should be at least 4.5:1 against the background for standard text.\n\n#### Rules for Mobile:\n- Never place yellow text on white or light grey backgrounds.\n- When using photo backgrounds, always apply a 40% to 60% black overlay.\n- Test readability by turning your phone screen brightness down to 20%.`
    });

    const lrFlexbox = await LearningResource.create({
      title: 'Responsive Web Layouts with CSS Flexbox & Grid',
      titleHindi: 'सीएसएस फ्लेक्सबॉक्स और ग्रिड के साथ उत्तरदायी वेब लेआउट',
      domain: 'web_development',
      type: 'practical_assignment',
      skillTag: 'CSS Flexbox',
      durationMinutes: 60,
      difficulty: 'intermediate',
      summary: 'Build clean responsive page sections that transition fluidly from a 360px mobile screen up to desktop monitors without breaking layout.',
      summaryHindi: 'साफ उत्तरदायी वेब पेज बनाएं जो मोबाइल से डेस्कटॉप तक अनुकूलित हों।',
      externalUrl: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox',
      contentMarkdown: `### Building with Flexbox\nFlexbox is designed for 1-dimensional layouts (rows or columns).\n\n#### Practical Assignment:\nBuild a responsive 3-card services section for a local rural clinic or repair shop.\n- Cards must stack in 1 column on mobile screens (<640px).\n- Cards must align horizontally in 3 equal columns on desktop screens (>1024px).\n- Include hover micro-interactions and accessible focus states.`,
      assignmentBrief: 'Create a responsive 3-card service component using Flexbox or CSS Grid with mobile-first CSS media queries.',
      sampleDeliverable: 'Code snippet or CodeSandbox/GitHub link showing HTML/CSS with flex-wrap and responsive breakpoint handling.'
    });

    const lrSheets = await LearningResource.create({
      title: 'Digital Office Spreadsheets & Business Bookkeeping',
      titleHindi: 'डिजिटल कार्यालय स्प्रेडशीट और व्यापार बहीखाता',
      domain: 'practical_vocational',
      type: 'practical_assignment',
      skillTag: 'Spreadsheet Formulas',
      durationMinutes: 45,
      difficulty: 'beginner',
      summary: 'Learn essential business formulas (SUM, AVERAGE, IF, VLOOKUP) to manage inventory, track daily wages, and generate clean client invoices.',
      summaryHindi: 'इन्वेंट्री और दैनिक खर्चों के प्रबंधन के लिए आवश्यक स्प्रेडशीट सूत्रों में महारत हासिल करें।',
      externalUrl: 'https://support.google.com/docs/table/25273',
      contentMarkdown: `### Spreadsheet Essentials for Small Businesses\nManaging inventory and transactions digitally saves time and prevents calculation errors.\n\n#### Practical Assignment:\nConstruct a monthly business expense & sales tracking sheet with:\n1. 15 line items (Date, Description, Category, Inflow, Outflow, Balance).\n2. Automated SUM formulas for Total Sales and Total Expenses.\n3. Net Profit / Loss calculation using =B18-B19.`,
      assignmentBrief: 'Create a 15-row monthly cashflow spreadsheet with functional SUM and NET PROFIT formulas.',
      sampleDeliverable: 'A shared Google Sheets link or downloaded .xlsx spreadsheet demonstrating error-free automated formulas.'
    });

    const lrBuildHerRefresher = await LearningResource.create({
      title: 'Build Her: Career Restart Confidence & Remote Work Readiness',
      titleHindi: 'बिल्ड हर: करियर रीस्टार्ट आत्मविश्वास और रिमोट वर्क तत्परता',
      domain: 'build_her_refresher',
      type: 'refresher',
      skillTag: 'Career Transition & Confidence',
      durationMinutes: 40,
      difficulty: 'beginner',
      summary: 'A supportive, practical guide for women resuming professional work after a sabbatical or family break. Covers remote work etiquette, digital tools, and framing your career break positively.',
      summaryHindi: 'पारिवारिक अंतराल के बाद पेशेवर काम फिर से शुरू करने वाली महिलाओं के लिए व्यावहारिक मार्गदर्शन।',
      externalUrl: 'https://setu.in/build-her/restart-guide',
      contentMarkdown: `### Transforming a Career Break into a Superpower\nTaking time off for caregiving or family priorities develops exceptional time management, negotiation, budget discipline, and crisis resolution skills.\n\n#### What Top Employers Value:\n1. **Continuous Learning**: Showcase recent micro-credentials or completed practice assignments.\n2. **Digital Fluency**: Comfort with Google Workspace, Zoom/Meet, and async project trackers.\n3. **Clear Boundary Setting**: Stating your availability (e.g., 20 flexible hours/week) transparently.\n\n#### Action Items:\n- Update your SETU profile with your latest hands-on portfolio projects.\n- Practice explaining your career gap in 2 positive, forward-looking sentences.`
    });

    const lrElectricalSafety = await LearningResource.create({
      title: 'Practical Electrical Safety, Circuit Testing & Tools',
      titleHindi: 'व्यावहारिक विद्युत सुरक्षा, सर्किट परीक्षण और उपकरण',
      domain: 'practical_vocational',
      type: 'tutorial',
      skillTag: 'Electrical Safety Protocols',
      durationMinutes: 35,
      difficulty: 'beginner',
      summary: 'Standard operating procedures for domestic and commercial electrical maintenance: isolation, PPE, multimeter troubleshooting, and earthing.',
      summaryHindi: 'घरेलू और वाणिज्यिक विद्युत रखरखाव के लिए मानक संचालन प्रक्रियाएं और सुरक्षा नियम।',
      externalUrl: 'https://www.electrical-safety.org.uk/',
      contentMarkdown: `### Safety First in Electrical Operations\nAlways follow the Five Safety Rules:\n1. Disconnect completely.\n2. Secure against re-connection.\n3. Verify absence of operating voltage.\n4. Carry out earthing and short-circuiting where required.\n5. Provide protection against adjacent live parts.`
    });

    console.log('[Seed] Seeding Initial Seeker Activity (Assessment Attempt, Practice Progress, Portfolio Project)...');
    // Seed Seeker's graphic design assessment attempt
    await AssessmentAttempt.create({
      userId: seeker._id,
      assessmentId: graphicDesignAssessment._id,
      domain: 'graphic_design',
      answers: [
        { questionId: 'gd_q1', selectedOptionIndex: 0, isCorrect: true, skillTag: 'Visual Hierarchy & Layout' },
        { questionId: 'gd_q2', selectedOptionIndex: 0, isCorrect: true, skillTag: 'Color Contrast & Readability' },
        { questionId: 'gd_q3', selectedOptionIndex: 0, isCorrect: true, skillTag: 'Asset Exporting & Formats' },
        { questionId: 'gd_q4', selectedOptionIndex: 0, isCorrect: true, skillTag: 'Typography & Pairing' },
        { questionId: 'gd_q5', selectedOptionIndex: 1, isCorrect: false, skillTag: 'Layout & Negative Space' }
      ],
      score: 4,
      maxScore: 5,
      percentage: 80,
      passed: true,
      strengths: ['Visual Hierarchy & Layout', 'Color Contrast & Readability', 'Typography & Pairing'],
      gaps: [
        {
          skillTag: 'Layout & Negative Space',
          linkedResourceId: lrCanva._id,
          resourceTitle: 'Canva Social Media Poster & Asset Design'
        }
      ],
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // Seed Seeker's learning progress & completed practical assignment
    await UserLearningProgress.create({
      userId: seeker._id,
      resourceId: lrCanva._id,
      status: 'completed',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      submittedWork: {
        title: 'Gramin Mahila Udyog - Recruitment Campaign Flyer',
        link: 'https://www.canva.com/design/DAFexample/view',
        notes: 'Designed an Instagram promotional flyer featuring warm saffron accents, clear bold typography, and 3 key worker benefits.'
      },
      addedToPortfolio: true
    });

    // Seed Seeker's Portfolio Project
    const demoPortfolioProject = await PortfolioProject.create({
      userId: seeker._id,
      title: 'Gramin Mahila Udyog - Artisan Recruitment Campaign',
      description: 'Complete digital branding and social media flyer design created for a women-led rural handicraft enterprise in Haryana. Features accessible color contrast and bilingual headers.',
      skills: ['Canva', 'Graphic Design', 'Social Media', 'Visual Hierarchy'],
      workSampleUrl: 'https://www.canva.com/design/DAFexample/view',
      source: 'practice_assignment',
      associatedResourceId: lrCanva._id,
      featured: true
    });

    console.log('[Seed] Seeding Diverse Demo Opportunities...');
    // Opportunity 1: Remote Canva Designer (Gramin Digital Services - Approved)
    const opp1 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Remote Social Media & Canva Designer',
      organisationName: 'Gramin Digital Services Pvt Ltd',
      opportunityType: 'flexible_work',
      workMode: 'remote',
      location: 'Pan-India (Remote)',
      salaryOrStipend: '₹18,000 - ₹24,000 / month',
      requiredSkills: ['Canva', 'Graphic Design', 'Social Media Management'],
      experienceRequired: 'None / Fresher or Career Break friendly',
      educationRequired: 'No minimum degree required (Portfolio based selection)',
      isCareerRestart: true,
      description: 'We are seeking creative individuals to craft social media posts, festival banners, and promotional templates for regional Indian businesses. Flexible hours (4 hours/day), women returning to work encouraged to apply.',
      status: 'published',
      isExternal: false,
      isDemoData: true
    });

    // Opportunity 2: Customer Support & Tele-calling Associate
    const opp2 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Customer Onboarding & Tele-support Associate (Hindi / Regional)',
      organisationName: 'Gramin Digital Services Pvt Ltd',
      opportunityType: 'job',
      workMode: 'remote',
      location: 'Gurugram / Remote (Haryana)',
      salaryOrStipend: '₹16,000 - ₹20,000 / month + Incentives',
      requiredSkills: ['Hindi Typing', 'Customer Communication', 'Spreadsheet Formulas'],
      experienceRequired: 'Fresher friendly',
      educationRequired: '12th Pass or Diploma',
      isCareerRestart: true,
      description: 'Handle inbound customer inquiries and assist rural users in onboarding to digital services. Training provided on calling software and ticketing.',
      status: 'published',
      isExternal: false,
      isDemoData: true
    });

    // Opportunity 3: Solar Electrical System Apprentice (Local practical skills)
    const opp3 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Rooftop Solar Installation & Maintenance Apprentice',
      organisationName: 'Urja Bharat Green Solutions',
      opportunityType: 'apprenticeship',
      workMode: 'onsite',
      location: 'Gurugram, Haryana',
      salaryOrStipend: '₹12,000 / month Govt NAPS Stipend + Travel',
      requiredSkills: ['Electrical Safety Protocols', 'Wiring Basics', 'Hardware Maintenance'],
      experienceRequired: 'ITI or practical electrical knowledge',
      educationRequired: 'ITI / 10th Pass with vocational training',
      isCareerRestart: false,
      description: 'Hands-on practical apprenticeship installing solar PV panels, inverters, and battery storage across residential and small commercial roofs. On-job safety equipment and certification provided.',
      status: 'published',
      isExternal: false,
      isDemoData: true
    });

    // Opportunity 4: Junior Frontend Web Development Intern
    const opp4 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Junior Frontend Web Developer Intern (React / TypeScript)',
      organisationName: 'Kriti Web Labs',
      opportunityType: 'internship',
      workMode: 'hybrid',
      location: 'Gurugram, Haryana',
      salaryOrStipend: '₹15,000 / month',
      requiredSkills: ['HTML Basics', 'CSS Flexbox', 'JavaScript Async/Await'],
      experienceRequired: 'Practical project portfolio required',
      educationRequired: 'Any graduate / self-taught developer',
      isCareerRestart: false,
      description: 'Build fast, mobile-friendly user interfaces for web portals. Work closely with senior engineers to implement components and integrate REST APIs.',
      status: 'published',
      isExternal: false,
      isDemoData: true
    });

    // Opportunity 5: External Apprenticeship under National Apprenticeship Portal
    const opp5 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Digital Office Assistant & Data Associate (Govt NAPS Apprenticeship)',
      organisationName: 'District Skill Development Office, Gurugram',
      opportunityType: 'apprenticeship',
      workMode: 'onsite',
      location: 'Mini Secretariat, Gurugram',
      salaryOrStipend: '₹11,500 / month (NAPS scheme)',
      requiredSkills: ['Spreadsheet Formulas', 'Hindi Typing', 'Data Privacy & Security'],
      experienceRequired: 'None',
      educationRequired: '10th / 12th Pass',
      isCareerRestart: true,
      description: 'Government registered apprentice role under NAPS. Manage citizen service records, digitize scheme applications, and maintain logbooks.',
      status: 'published',
      isExternal: true,
      externalApplyUrl: 'https://www.apprenticeshipindia.gov.in/',
      isDemoData: true
    });

    // Opportunity 6: Draft Listing from Pending Employer (Not published yet!)
    const oppDraft = await Opportunity.create({
      employerId: pendingEmployer._id,
      title: 'Agritech Supply Chain Field Associate',
      organisationName: 'BharatTech Innovations',
      opportunityType: 'job',
      workMode: 'onsite',
      location: 'Karnal & Sonipat, Haryana',
      salaryOrStipend: '₹18,000 / month',
      requiredSkills: ['Customer Communication', 'Data Entry'],
      experienceRequired: 'Fresher friendly',
      educationRequired: '12th Pass',
      isCareerRestart: false,
      description: 'Coordinate grain delivery schedules with local farmer collectives. Draft pending admin verification.',
      status: 'draft',
      isExternal: false,
      isDemoData: true
    });

    console.log('[Seed] Seeding Pre-existing Application & Scheduled Interview for Demo Flow...');
    // Seed Seeker's application to Opportunity 1 with status moved to "Interview Scheduled"
    await Application.create({
      opportunityId: opp1._id,
      seekerId: seeker._id,
      employerId: approvedEmployer._id,
      status: 'Interview Scheduled',
      timeline: [
        {
          status: 'Applied',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          note: 'Application submitted via SETU platform with attached portfolio project.',
          updatedBy: seeker._id
        },
        {
          status: 'Under Review',
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
          note: 'Resume and Canva portfolio reviewed by Lead Recruiter.',
          updatedBy: approvedEmployer._id
        },
        {
          status: 'Shortlisted',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          note: 'Shortlisted for creative trial round.',
          updatedBy: approvedEmployer._id
        },
        {
          status: 'Interview Scheduled',
          timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
          note: 'Virtual conversation scheduled with Creative Director.',
          updatedBy: approvedEmployer._id
        }
      ],
      interviewDetails: {
        date: '2026-11-22',
        time: '03:00 PM IST',
        instructions: 'Please be ready to share your screen and walk through your Canva recruitment poster deliverable. Discussion will focus on your design thought process and availability.',
        meetLinkOrLocation: 'https://meet.google.com/setu-demo-interview'
      },
      portfolioProjectsSnapshot: [
        {
          title: demoPortfolioProject.title,
          workSampleUrl: demoPortfolioProject.workSampleUrl,
          skills: demoPortfolioProject.skills
        }
      ],
      coverNote: 'Excited to apply! I recently completed the SETU Canva practical assignment and published a bilingual promotional flyer. Ready to contribute 20 flexible hours per week.'
    });

    // Seed Seeker's saved opportunity (Opportunity 4)
    await SavedOpportunity.create({
      userId: seeker._id,
      opportunityId: opp4._id
    });

    console.log('[Seed] Seeding Verified Government Schemes Directory...');
    const schemesData = [
      {
        title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
        hindiTitle: 'प्रधानमंत्री कौशल विकास योजना (पीएमकेवीवाई 4.0)',
        ministryOrDepartment: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
        targetAudience: ['all', 'youth', 'women', 'rural'],
        category: 'skill_training',
        benefitsSummary: 'Free industry-aligned skill certification, stipend support, assessment certification, and placement assistance across emerging & traditional trades.',
        benefitsSummaryHindi: 'निःशुल्क उद्योग-उन्मुख कौशल प्रमाणन, वजीफा सहायता और रोजगार सहायता।',
        eligibilitySummary: 'Any Indian citizen aged 15-45 with intent to acquire practical skills. No mandatory formal degree required.',
        eligibilitySummaryHindi: '15-45 वर्ष की आयु का कोई भी भारतीय नागरिक। कोई अनिवार्य औपचारिक डिग्री नहीं।',
        officialUrl: 'https://www.pmkvyofficial.org/',
        lastReviewedDate: '2026-02-10',
        isDemoData: false,
        isActive: true
      },
      {
        title: 'National Apprenticeship Promotion Scheme (NAPS)',
        hindiTitle: 'राष्ट्रीय शिक्षुता संवर्धन योजना (एनएपीएस)',
        ministryOrDepartment: 'Ministry of Skill Development and Entrepreneurship',
        targetAudience: ['youth', 'all'],
        category: 'apprenticeship',
        benefitsSummary: 'Govt reimburses 25% of prescribed stipend up to ₹1,500/month directly to apprentices during on-the-job industrial training.',
        benefitsSummaryHindi: 'व्यावहारिक औद्योगिक प्रशिक्षण के दौरान प्रशिक्षुओं को सीधे वजीफा सहायता।',
        eligibilitySummary: 'Aged 14+ (18+ for hazardous trades) with minimum 5th to 12th pass or ITI certification depending on trade.',
        eligibilitySummaryHindi: '14 वर्ष से अधिक आयु (खतरनाक उद्योगों के लिए 18+) न्यूनतम 5वीं से 12वीं पास या आईटीआई।',
        officialUrl: 'https://www.apprenticeshipindia.gov.in/',
        lastReviewedDate: '2026-02-12',
        isDemoData: false,
        isActive: true
      },
      {
        title: 'PM Vishwakarma Scheme',
        hindiTitle: 'पीएम विश्वकर्मा योजना',
        ministryOrDepartment: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
        targetAudience: ['artisans', 'rural', 'all'],
        category: 'self_employment',
        benefitsSummary: 'Recognition as Vishwakarma with ID, 5-7 days basic training with ₹500/day stipend, ₹15,000 modern toolkit incentive, and collateral-free enterprise loans up to ₹3 Lakh at 5% interest.',
        benefitsSummaryHindi: 'पहचान पत्र, ₹500/दिन वजीफे के साथ प्रशिक्षण, ₹15,000 टूलकिट सहायता और ₹3 लाख तक का सस्ता ऋण।',
        eligibilitySummary: 'Traditional artisans and craftspeople working with hands and tools in 18 identified trades (carpenters, blacksmiths, tailors, potters, etc.). Minimum age 18.',
        eligibilitySummaryHindi: 'पारंपरिक कारीगर और शिल्पकार (बढ़ई, लोहार, दर्जी, कुम्हार आदि)। न्यूनतम आयु 18 वर्ष।',
        officialUrl: 'https://pmvishwakarma.gov.in/',
        lastReviewedDate: '2026-02-14',
        isDemoData: false,
        isActive: true
      },
      {
        title: 'Stand-Up India Scheme',
        hindiTitle: 'स्टैंड-अप इंडिया योजना',
        ministryOrDepartment: 'Department of Financial Services, Ministry of Finance',
        targetAudience: ['women', 'entrepreneurs'],
        category: 'financial_assistance',
        benefitsSummary: 'Facilitates bank loans between ₹10 Lakh and ₹1 Crore to at least one Woman borrower per bank branch for setting up greenfield enterprises in manufacturing, services, or trading.',
        benefitsSummaryHindi: 'विनिर्माण, सेवा या व्यापार में नए उद्यमों के लिए ₹10 लाख से ₹1 करोड़ तक बैंक ऋण।',
        eligibilitySummary: 'Women entrepreneurs aged 18+ initiating a new (greenfield) enterprise. In non-individual enterprises, 51% shareholding must be held by a woman.',
        eligibilitySummaryHindi: '18 वर्ष से अधिक आयु की महिला उद्यमी जो नया उद्यम शुरू कर रही हैं।',
        officialUrl: 'https://www.standupmitra.in/',
        lastReviewedDate: '2026-02-15',
        isDemoData: false,
        isActive: true
      },
      {
        title: 'Mahila Samriddhi Yojana (MSY)',
        hindiTitle: 'महिला समृद्धि योजना',
        ministryOrDepartment: 'National Backward Classes Finance & Development Corporation (NBCFDC)',
        targetAudience: ['women', 'rural'],
        category: 'women_empowerment',
        benefitsSummary: 'Micro-finance loans up to ₹1,40,000 provided through Self Help Groups (SHGs) at nominal interest of 4% per annum for women starting income-generating micro-enterprises.',
        benefitsSummaryHindi: 'स्वयं सहायता समूहों (SHG) के माध्यम से महिलाओं के सूक्ष्म व्यवसायों के लिए 4% वार्षिक ब्याज पर ₹1,40,000 तक ऋण।',
        eligibilitySummary: 'Women belonging to backward classes with family income below ₹3 Lakh per annum.',
        eligibilitySummaryHindi: 'वार्षिक ₹3 लाख से कम पारिवारिक आय वाली पिछड़े वर्ग की महिलाएं।',
        officialUrl: 'https://nbcfdc.gov.in/',
        lastReviewedDate: '2026-02-16',
        isDemoData: false,
        isActive: true
      },
      {
        title: 'Prime Minister’s Employment Generation Programme (PMEGP)',
        hindiTitle: 'प्रधानमंत्री रोजगार सृजन कार्यक्रम (पीएमईजीपी)',
        ministryOrDepartment: 'Khadi and Village Industries Commission (KVIC), MSME',
        targetAudience: ['rural', 'youth', 'entrepreneurs'],
        category: 'self_employment',
        benefitsSummary: 'Credit-linked subsidy programme offering 25% to 35% government subsidy for projects up to ₹50 Lakh in manufacturing and ₹20 Lakh in service sectors in rural areas.',
        benefitsSummaryHindi: 'ग्रामीण क्षेत्रों में विनिर्माण के लिए ₹50 लाख और सेवा क्षेत्र के लिए ₹20 लाख तक 25% से 35% सरकारी सब्सिडी।',
        eligibilitySummary: 'Any individual above 18 years. For projects above ₹10 Lakh in manufacturing and ₹5 Lakh in services, 8th standard pass is required.',
        eligibilitySummaryHindi: '18 वर्ष से अधिक का कोई भी नागरिक। ₹10 लाख से अधिक की परियोजना के लिए 8वीं पास अनिवार्य।',
        officialUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
        lastReviewedDate: '2026-02-15',
        isDemoData: false,
        isActive: true
      }
    ];

    await GovernmentScheme.insertMany(schemesData);

    console.log('[Seed] Seeding Sample Report & Support Ticket for Moderation...');
    // Sample reported listing for Admin queue
    await Report.create({
      reporterId: seeker._id,
      opportunityId: opp3._id,
      reason: 'inaccurate_details',
      description: 'The job posting states required tools must be bought by apprentices, but NAPS rules require employer to provide tools. Please verify.',
      status: 'pending'
    });

    // Sample Build Her confidential ticket
    await SupportTicket.create({
      userId: seeker._id,
      name: 'Priya Sharma',
      contactEmailOrPhone: 'seeker@setu.demo',
      category: 'workplace_safety_posh',
      subject: 'Inquiry regarding POSH compliance in remote freelance contracts',
      message: 'I am taking up remote graphic design client projects and want to know how the POSH Act protects women working in independent freelance arrangements. Thank you.',
      isConfidential: true,
      status: 'open'
    });

    console.log('--------------------------------------------------');
    console.log('SETU Database seeded successfully!');
    console.log('Demo Logins:');
    console.log('  Job Seeker:    seeker@setu.demo     / SetuDemo@2026');
    console.log('  Pending Emp:   pending@startup.demo / SetuDemo@2026');
    console.log('  Approved Emp:  employer@techcorp.demo / SetuDemo@2026');
    console.log('  Administrator: admin@setu.gov.in    / SetuAdmin@2026');
    console.log('--------------------------------------------------');

    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
