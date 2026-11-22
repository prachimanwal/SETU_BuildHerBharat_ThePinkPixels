import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Employer } from '../models/Employer';
import { Opportunity } from '../models/Opportunity';
import { Assessment } from '../models/Assessment';
import { AssessmentResult } from '../models/AssessmentResult';
import { LearningResource } from '../models/LearningResource';
import { LearningProgress } from '../models/LearningProgress';
import { Portfolio } from '../models/Portfolio';
import { Application } from '../models/Application';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { Report } from '../models/Report';

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Employer.deleteMany({}),
      Opportunity.deleteMany({}),
      Assessment.deleteMany({}),
      AssessmentResult.deleteMany({}),
      LearningResource.deleteMany({}),
      LearningProgress.deleteMany({}),
      Portfolio.deleteMany({}),
      Application.deleteMany({}),
      GovernmentScheme.deleteMany({}),
      Report.deleteMany({})
    ]);

    console.log('[Seed] Collections cleared. Creating demo users...');

    const salt = await bcrypt.genSalt(10);
    const seekerPasswordHash = await bcrypt.hash('SetuDemo@2026', salt);
    const employerPasswordHash = await bcrypt.hash('SetuDemo@2026', salt);
    const adminPasswordHash = await bcrypt.hash('SetuAdmin@2026', salt);

    // 1. Demo Job Seeker: Priya Sharma
    const seeker = await User.create({
      name: 'Priya Sharma',
      fullName: 'Priya Sharma',
      email: 'seeker@setu.demo',
      passwordHash: seekerPasswordHash,
      role: 'seeker',
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      seekerProfile: {
        headline: 'Canva Creative Designer | Social Media Support',
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
            title: 'Bachelor of Arts (Hindi Literature)',
            institute: 'Kurukshetra University',
            year: '2021'
          }
        ],
        skills: ['Canva', 'Hindi Typing', 'Social Media Management', 'Spreadsheet Formulas'],
        experienceLevel: 'Career break / Returning to work',
        careerGoals: 'Seeking flexible remote design work or digital freelance assignments.',
        interests: ['Digital Marketing', 'Graphic Design', 'Rural Artisans'],
        preferredWorkMode: 'remote',
        resumeUrl: 'https://setu.demo/resumes/priya_sharma_portfolio.pdf',
        isCareerRestart: true
      }
    });

    // 2. Pending Employer: BharatTech Innovations
    const pendingEmployer = await User.create({
      name: 'BharatTech Innovations',
      fullName: 'BharatTech Innovations',
      email: 'pending@startup.demo',
      passwordHash: employerPasswordHash,
      role: 'employer',
      emailVerified: true,
      employerProfile: {
        companyName: 'BharatTech Innovations',
        industry: 'Information Technology',
        website: 'https://bharattech.demo',
        companySize: '11-50',
        description: 'Building digital public infrastructure and vernacular tools for tier-2/3 cities.',
        verificationStatus: 'pending',
        verificationDocs: {
          docType: 'GSTIN / Business License',
          docNumber: '06AAACB1234F1Z8',
          notes: 'Incorporation documents submitted for verification desk review.',
          submittedAt: new Date()
        }
      }
    });

    await Employer.create({
      userId: pendingEmployer._id,
      companyName: 'BharatTech Innovations',
      industry: 'Information Technology',
      verificationStatus: 'pending',
      verificationDocs: pendingEmployer.employerProfile?.verificationDocs
    });

    // 3. Approved Employer: Gramin Digital Services Pvt Ltd
    const approvedEmployer = await User.create({
      name: 'Gramin Digital Services Pvt Ltd',
      fullName: 'Gramin Digital Services Pvt Ltd',
      email: 'employer@techcorp.demo',
      passwordHash: employerPasswordHash,
      role: 'employer',
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
      profilePicture: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
      employerProfile: {
        companyName: 'Gramin Digital Services Pvt Ltd',
        industry: 'Digital Content & Operations',
        website: 'https://gramindigital.demo',
        companySize: '51-200',
        description: 'Enabling rural enterprises with localized digital content, design, and operations support.',
        verificationStatus: 'approved',
        verificationDocs: {
          docType: 'GSTIN & PAN Certificate',
          docNumber: '07AABCG5432D1Z5',
          notes: 'Full corporate documentation verified by SETU administration.',
          submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        verifiedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      }
    });

    await Employer.create({
      userId: approvedEmployer._id,
      companyName: 'Gramin Digital Services Pvt Ltd',
      industry: 'Digital Content & Operations',
      verificationStatus: 'approved',
      verificationDocs: approvedEmployer.employerProfile?.verificationDocs,
      verifiedAt: approvedEmployer.employerProfile?.verifiedAt
    });

    // 4. Platform Administrator
    await User.create({
      name: 'SETU Platform Admin',
      fullName: 'SETU Platform Admin',
      email: 'admin@setu.gov.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    });

    console.log('[Seed] Users seeded. Seeding assessments...');

    // 5. Skill Assessments
    const graphicAssessment = await Assessment.create({
      title: 'Graphic Design & Canva Practical Skill Assessment',
      domain: 'graphic_design',
      description: 'Test your understanding of visual hierarchy, Canva tools, poster formatting, and color harmony for client projects.',
      durationMinutes: 15,
      passingScore: 70,
      difficulty: 'Beginner',
      questions: [
        {
          id: 'gd_q1',
          question: 'Which design principle is most critical for directing the viewer’s eye first to the main event headline?',
          options: ['Visual Hierarchy', 'Low Contrast', 'Monochrome Grayscale', 'Uniform Font Size'],
          correctAnswerIndex: 0,
          explanation: 'Visual hierarchy uses scale, contrast, and weight to guide the eye to the key information first.',
          skillTested: 'Visual Hierarchy'
        },
        {
          id: 'gd_q2',
          question: 'What is the standard aspect ratio commonly used for Instagram square social media posts in Canva?',
          options: ['1:1 (1080 x 1080 px)', '16:9 (1920 x 1080 px)', '9:16 (1080 x 1920 px)', '4:3'],
          correctAnswerIndex: 0,
          explanation: '1:1 ratio (1080x1080) is the standard format for square social media feed posts.',
          skillTested: 'Canva Formatting'
        },
        {
          id: 'gd_q3',
          question: 'When saving a brand logo created in Canva for transparent overlay over any background, which format must you choose?',
          options: ['PNG with Transparent Background', 'Standard JPG', 'PDF Print with bleed', 'GIF'],
          correctAnswerIndex: 0,
          explanation: 'PNG supports alpha channel transparency, ensuring clean placement on any background.',
          skillTested: 'Asset Exporting'
        },
        {
          id: 'gd_q4',
          question: 'Which typography guideline helps keep promotional brochures clean and legible?',
          options: ['Limit to 2 complementary font families', 'Use at least 6 different ornate fonts', 'Use all-caps for long paragraphs', 'Eliminate line spacing'],
          correctAnswerIndex: 0,
          explanation: 'Limiting a design to 2 complementary typefaces preserves readability and professionalism.',
          skillTested: 'Typography'
        },
        {
          id: 'gd_q5',
          question: 'What color harmony uses colors directly opposite each other on the color wheel to create maximum pop?',
          options: ['Complementary Colors', 'Monochromatic Colors', 'Analogous Colors', 'Neutral Grayscale'],
          correctAnswerIndex: 0,
          explanation: 'Complementary colors (like orange & blue) sit opposite each other on the color wheel and create vivid contrast.',
          skillTested: 'Color Theory'
        }
      ]
    });

    const webAssessment = await Assessment.create({
      title: 'Web Development & Frontend Operations Assessment',
      domain: 'web_development',
      description: 'Evaluate essential HTML5, CSS responsive design, JavaScript essentials, and Git basics for modern web junior roles.',
      durationMinutes: 20,
      passingScore: 70,
      difficulty: 'Intermediate',
      questions: [
        {
          id: 'wd_q1',
          question: 'Which HTML5 semantic element is best suited for encapsulating self-contained blog articles or product listings?',
          options: ['<article>', '<section>', '<div>', '<span>'],
          correctAnswerIndex: 0,
          explanation: '<article> is explicitly designed for self-contained syndicatable content.',
          skillTested: 'HTML5 Semantics'
        },
        {
          id: 'wd_q2',
          question: 'How do you create a mobile-responsive layout that stacks columns on small screens in CSS Flexbox?',
          options: ['flex-direction: column (or flex-wrap: wrap)', 'display: none', 'position: absolute', 'float: left'],
          correctAnswerIndex: 0,
          explanation: 'flex-direction: column or flex-wrap: wrap with media queries stacks elements vertically on smaller screens.',
          skillTested: 'Responsive Layouts'
        },
        {
          id: 'wd_q3',
          question: 'Which JavaScript array method creates a new array with all elements that pass a test condition?',
          options: ['filter()', 'map()', 'forEach()', 'reduce()'],
          correctAnswerIndex: 0,
          explanation: 'filter() returns a new array containing all elements that evaluate to truthy against the callback.',
          skillTested: 'JavaScript Fundamentals'
        },
        {
          id: 'wd_q4',
          question: 'How do you properly handle asynchronous operations without callback hell in modern JavaScript?',
          options: ['async / await with try/catch', 'Nested setTimeout blocks', 'Synchronous XMLHttpRequest', 'eval()'],
          correctAnswerIndex: 0,
          explanation: 'async/await provides clean, sequential-looking asynchronous code with standard try/catch error handling.',
          skillTested: 'JavaScript Async/Await'
        },
        {
          id: 'wd_q5',
          question: 'What command creates and switches to a new Git branch simultaneously?',
          options: ['git checkout -b <branch-name>', 'git push origin main', 'git commit -m', 'git branch -d'],
          correctAnswerIndex: 0,
          explanation: 'git checkout -b creates the specified branch and switches your working tree to it immediately.',
          skillTested: 'Git Version Control'
        }
      ]
    });

    console.log('[Seed] Seeding learning resources...');

    // 6. Learning Resources & Practical Assignments
    const canvaResource = await LearningResource.create({
      title: 'Canva Social Media Poster & Asset Design',
      description: 'Design practical promotional banners and infographics for small businesses and regional enterprises.',
      duration: '45 mins',
      type: 'practical_assignment',
      skillTag: 'Visual Hierarchy',
      contentUrl: 'https://setu.demo/learning/canva-poster',
      assignmentBrief: 'Design a 1080x1080 social media post for a local rural handicrafts brand. Include brand name, product photograph, price badge, and call to action.',
      targetAudience: 'Job Seekers, Freelancers, Returnees'
    });

    await LearningResource.create({
      title: 'Responsive Rural Clinic Landing Page',
      description: 'Hands-on practical assignment building an accessible, mobile-first healthcare portal for regional clinic appointment booking.',
      duration: '60 mins',
      type: 'practical_assignment',
      skillTag: 'HTML5 Semantics',
      contentUrl: 'https://setu.demo/learning/rural-clinic-page',
      assignmentBrief: 'Code a responsive single-page clinic site with doctor timings, clinic location, emergency contact button, and bilingual toggle.',
      targetAudience: 'Junior Developers, Students'
    });

    await LearningResource.create({
      title: 'Spreadsheet Essentials: VLOOKUP & Data Filtering',
      description: 'Master practical data hygiene, spreadsheet formulas, and client reporting for office operation roles.',
      duration: '35 mins',
      type: 'tutorial',
      skillTag: 'Spreadsheet Formulas',
      contentUrl: 'https://setu.demo/learning/spreadsheets-vlookup',
      targetAudience: 'Operations Candidates, High School Graduates'
    });

    console.log('[Seed] Seeding initial seeker activity...');

    // 7. Initial Seeker Assessment Attempt
    await AssessmentResult.create({
      userId: seeker._id,
      assessmentId: graphicAssessment._id,
      domain: 'graphic_design',
      score: 4,
      maxScore: 5,
      percentage: 80,
      passed: true,
      strengths: ['Visual Hierarchy', 'Canva Formatting', 'Asset Exporting', 'Color Theory'],
      gaps: ['Typography'],
      answers: {
        gd_q1: 0,
        gd_q2: 0,
        gd_q3: 0,
        gd_q4: 1, // Missed typography question
        gd_q5: 0
      },
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // 8. Learning Progress for Priya
    await LearningProgress.create({
      userId: seeker._id,
      resourceId: canvaResource._id,
      status: 'completed',
      submissionDetails: 'https://setu.demo/deliverables/priya_handicrafts_poster.png'
    });

    // 9. Portfolio Projects for Priya
    await Portfolio.create({
      userId: seeker._id,
      title: 'Gramin Mahila Udyog - Artisan Recruitment Campaign',
      description: 'Complete visual identity campaign including 4 Canva social media posters, promotional flyers, and regional WhatsApp catalog banners.',
      skills: ['Canva', 'Visual Hierarchy', 'Social Media Management'],
      workSampleUrl: 'https://setu.demo/portfolio/gramin-mahila-campaign',
      category: 'Practical Deliverable',
      source: 'practice_assignment',
      featured: true
    });

    console.log('[Seed] Seeding verified opportunities...');

    // 10. Opportunities
    const opp1 = await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Remote Social Media & Canva Designer',
      organisationName: 'Gramin Digital Services Pvt Ltd',
      description: 'We are seeking a talented designer to create daily social media posters, announcement graphics, and WhatsApp flyers for our community enterprise partners. High degree of flexibility and returnee-friendly schedule.',
      requiredSkills: ['Canva', 'Social Media Management', 'Hindi Typing'],
      location: {
        city: 'Gurugram',
        state: 'Haryana',
        isRuralFocus: true
      },
      workMode: 'remote',
      opportunityType: 'job',
      stipendOrSalary: '₹18,000 - ₹24,000 / month',
      duration: 'Permanent Full-Time',
      isCareerRestart: true,
      status: 'published',
      moderationStatus: 'clean'
    });

    await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Agritech Data Operations Executive',
      organisationName: 'Gramin Digital Services Pvt Ltd',
      description: 'Assist our regional field coordinators by verifying farmer registration records, entering daily warehouse dispatches, and maintaining clean spreadsheets.',
      requiredSkills: ['Spreadsheet Formulas', 'Hindi Typing'],
      location: {
        city: 'Sonipat',
        state: 'Haryana',
        isRuralFocus: true
      },
      workMode: 'hybrid',
      opportunityType: 'job',
      stipendOrSalary: '₹16,000 - ₹20,000 / month',
      duration: 'Full-Time',
      isCareerRestart: false,
      status: 'published',
      moderationStatus: 'clean'
    });

    await Opportunity.create({
      employerId: approvedEmployer._id,
      title: 'Junior Frontend Assistant & Content Coordinator',
      organisationName: 'Gramin Digital Services Pvt Ltd',
      description: 'Help build and maintain responsive public clinic sites and update content catalogs using HTML5, modern CSS, and lightweight JavaScript.',
      requiredSkills: ['HTML5 Semantics', 'Responsive Layouts'],
      location: {
        city: 'Gurugram',
        state: 'Haryana',
        isRuralFocus: false
      },
      workMode: 'hybrid',
      opportunityType: 'apprenticeship',
      stipendOrSalary: '₹15,000 / month Stipend',
      duration: '6 Months Apprenticeship',
      isCareerRestart: true,
      status: 'published',
      moderationStatus: 'clean'
    });

    console.log('[Seed] Seeding application & interview...');

    // 11. Application with Scheduled Interview for Priya
    await Application.create({
      opportunityId: opp1._id,
      seekerId: seeker._id,
      employerId: approvedEmployer._id,
      status: 'Interview Scheduled',
      coverNote: 'I completed my Canva skill assessment on SETU with an 80% verified score and published a real artisan campaign in my portfolio. I am returning to the workforce and would love to support your mission.',
      interviewDetails: {
        date: '2026-11-24',
        time: '11:30 AM IST',
        mode: 'online_call',
        meetingLink: 'https://meet.google.com/setu-interview-priya',
        notes: 'Review candidate portfolio and discuss regional WhatsApp flyer requirements.'
      }
    });

    console.log('[Seed] Seeding government schemes directory...');

    // 12. Verified Government Schemes
    await GovernmentScheme.create([
      {
        title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
        hindiTitle: 'प्रधानमंत्री कौशल विकास योजना',
        ministry: 'Ministry of Skill Development & Entrepreneurship',
        category: 'skill_training',
        targetAudience: 'Youth, School Dropouts, Job Seekers',
        benefitsSummary: 'Free industry-aligned skill certification with government assessment, food/travel stipends, and placement support.',
        eligibilitySummary: 'Indian citizens aged 15-45 with practical aptitude or school education seeking formal vocational certification.',
        officialUrl: 'https://www.pmkvyofficial.org'
      },
      {
        title: 'National Apprenticeship Promotion Scheme (NAPS)',
        hindiTitle: 'राष्ट्रीय शिक्षुता प्रोत्साहन योजना',
        ministry: 'Ministry of Skill Development & Entrepreneurship',
        category: 'internship',
        targetAudience: 'Fresh Graduates, ITI Holders, Vocational Trainees',
        benefitsSummary: 'Direct government stipend co-sharing up to ₹1,500/month during on-the-job industrial apprenticeship.',
        eligibilitySummary: 'Candidates with minimum 5th to 12th pass or ITI credentials entering apprentice contracts with verified establishments.',
        officialUrl: 'https://www.apprenticeshipindia.gov.in'
      },
      {
        title: 'PM Vishwakarma Yojana',
        hindiTitle: 'पीएम विश्वकर्मा योजना',
        ministry: 'Ministry of Micro, Small & Medium Enterprises (MSME)',
        category: 'entrepreneurship_loan',
        targetAudience: 'Artisans, Traditional Craftspersons, Rural Makers',
        benefitsSummary: 'Collateral-free enterprise loans up to ₹3 Lakh at 5% interest, toolkit grant of ₹15,000, and daily training stipends of ₹500.',
        eligibilitySummary: 'Traditional artisans engaged in 18 notified family crafts (carpenters, potters, blacksmiths, tailors, etc.).',
        officialUrl: 'https://pmvishwakarma.gov.in'
      },
      {
        title: 'Stand-Up India Scheme',
        hindiTitle: 'स्टैंड-अप इंडिया योजना',
        ministry: 'Ministry of Finance, Government of India',
        category: 'women_livelihood',
        targetAudience: 'Women Entrepreneurs & SC/ST Business Founders',
        benefitsSummary: 'Bank composite loans between ₹10 Lakh and ₹1 Crore for setting up greenfield trading, manufacturing, or service ventures.',
        eligibilitySummary: 'Women entrepreneurs aged 18+ holding minimum 51% stake in the enterprise.',
        officialUrl: 'https://www.standupmitra.in'
      }
    ]);

    // 13. Sample Report for Admin Moderation
    await Report.create({
      listingId: opp1._id,
      reporterId: seeker._id,
      reason: 'other',
      description: 'Tested reporting system to verify admin escalation queue.',
      status: 'pending'
    });

    console.log('--------------------------------------------------');
    console.log('SETU Standalone Database Seeded Successfully!');
    console.log('Demo Credentials:');
    console.log('  Job Seeker:    seeker@setu.demo     / SetuDemo@2026');
    console.log('  Pending Emp:   pending@startup.demo / SetuDemo@2026');
    console.log('  Approved Emp:  employer@techcorp.demo / SetuDemo@2026');
    console.log('  Administrator: admin@setu.gov.in    / SetuAdmin@2026');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Fatal error during seed:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('seed')) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}
