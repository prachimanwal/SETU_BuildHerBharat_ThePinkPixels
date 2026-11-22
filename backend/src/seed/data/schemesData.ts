import {
  ISchemeEligibilityRules,
  SchemeCategory,
  SchemeVerificationStatus
} from '../../models/GovernmentScheme';

export interface SeedGovernmentScheme {
  slug: string;
  title: string;
  hindiTitle: string;
  ministry: string;
  category: SchemeCategory;
  targetAudience: string;
  description: string;
  benefitsSummary: string;
  eligibilitySummary: string;
  ageRequirements: string;
  educationRequirements: string;
  stateApplicability: string;
  verificationStatus: SchemeVerificationStatus;
  requiredDocuments: string[];
  applicationProcess: string;
  applicationStatus: string;
  officialUrl: string;
  applicationUrl: string;
  eligibilityRules: ISchemeEligibilityRules;
  lastReviewedDate: string;
}

export const GOVERNMENT_SCHEMES_CATALOG: SeedGovernmentScheme[] = [
  {
    slug: 'pmkvy-4',
    title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',
    hindiTitle: 'प्रधानमंत्री कौशल विकास योजना (PMKVY)',
    ministry: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    category: 'skill_training',
    targetAudience: 'Indian youth, school/college dropouts, unemployed job seekers',
    description:
      'Flagship skill-development and certification scheme of MSDE enabling Indian youth to take up industry-relevant short-term NSQF skill training and Recognition of Prior Learning (RPL).',
    benefitsSummary:
      'Free industry-aligned skill training, formal NSQF certification, and career/placement support via Rozgar Melas and Skill India Digital Hub.',
    eligibilitySummary:
      'Indian youth (unemployed or school/college dropouts) satisfying sector-specific NSQF job-role prerequisites.',
    ageRequirements: 'Varies by NSQF job role (typically youth aged 15–45 years; verify per course on portal)',
    educationRequirements: 'Depends on selected NSQF job role (ranges from school pass to graduate)',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card (for e-KYC)',
      'Bank Account details',
      'Educational certificates (as required by job role)',
      'Passport-size photograph'
    ],
    applicationProcess:
      'Register on Skill India Digital Hub (skillindiadigital.gov.in), complete e-KYC, choose an accredited PMKVY course and training center, and complete assessment.',
    applicationStatus: 'Ongoing — Check active batches on Skill India Digital Hub',
    officialUrl: 'https://www.skillindiadigital.gov.in/',
    applicationUrl: 'https://www.skillindiadigital.gov.in/',
    eligibilityRules: {
      minAge: 15,
      maxAge: 45,
      educationLevels: ['Class 10', 'Class 12', 'Diploma', 'ITI', 'Undergraduate', 'Graduate'],
      studentFriendly: true,
      keywords: ['skill', 'training', 'vocational', 'certification', 'job']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'naps-apprenticeship',
    title: 'National Apprenticeship Promotion Scheme (NAPS)',
    hindiTitle: 'राष्ट्रीय शिक्षुता प्रोत्साहन योजना (NAPS)',
    ministry: 'Ministry of Skill Development and Entrepreneurship (MSDE)',
    category: 'internship',
    targetAudience: 'Candidates aged 14+ (ITI, Class 10/12, Diploma, Graduates) seeking paid on-the-job training',
    description:
      'Promotes paid on-the-job apprenticeship training across industries with practical workplace exposure, monthly stipend, and government Direct Benefit Transfer (DBT) support.',
    benefitsSummary:
      'Practical on-the-job apprenticeship training, monthly stipend from establishment, government DBT stipend support (up to ₹1,500/month as per NAPS guidelines), and nationally recognized certification.',
    eligibilitySummary:
      'Individuals aged 14 years and above (18+ for hazardous trades) meeting minimum trade-specific educational qualifications.',
    ageRequirements: '14 years and above (18+ for hazardous industries)',
    educationRequirements: 'Varies by trade (Class 5–12, ITI, Diploma, or Graduate)',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card',
      'Educational / ITI / Diploma certificates',
      'Aadhaar-seeded Bank Account for DBT'
    ],
    applicationProcess:
      'Register as a Candidate on apprenticeshipindia.gov.in, complete e-KYC and bank verification, search live openings, and apply directly.',
    applicationStatus: 'Open year-round across participating establishments',
    officialUrl: 'https://www.apprenticeshipindia.gov.in/',
    applicationUrl: 'https://www.apprenticeshipindia.gov.in/',
    eligibilityRules: {
      minAge: 14,
      educationLevels: ['Class 10', 'Class 12', 'Diploma', 'ITI', 'Graduate'],
      studentFriendly: true,
      keywords: ['apprenticeship', 'internship', 'iti', 'diploma', 'training', 'first job']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'nats-apprenticeship',
    title: 'National Apprenticeship Training Scheme (NATS)',
    hindiTitle: 'राष्ट्रीय शिक्षुता प्रशिक्षण योजना (NATS)',
    ministry: 'Ministry of Education (Department of Higher Education)',
    category: 'internship',
    targetAudience: 'Fresh Graduates and Diploma Holders (Engineering & General Streams)',
    description:
      'One-year structured workplace apprenticeship program equipping fresh diploma holders and graduates (Engineering, Technology, B.A., B.Sc., B.Com., etc.) with practical industry training.',
    benefitsSummary:
      '1 year of hands-on training in public/private establishments, fixed monthly stipend (shared between employer and Central Government), and Certificate of Proficiency.',
    eligibilitySummary:
      'Fresh graduates or diploma holders from recognized Indian institutions who have not previously undergone apprenticeship training.',
    ageRequirements: '18 years and above (confirm recency of graduation window on NATS portal)',
    educationRequirements: 'Completed Diploma or Graduate Degree (Engineering or General streams)',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card',
      'Provisional or Final Degree / Diploma Certificate',
      'Consolidated Mark Sheet',
      'Aadhaar-seeded Bank Account'
    ],
    applicationProcess:
      'Register as a Student on nats.education.gov.in, await Board verification, browse active establishment vacancies, and submit applications.',
    applicationStatus: 'Ongoing — Apply to active openings on NATS 2.0 Portal',
    officialUrl: 'https://nats.education.gov.in/',
    applicationUrl: 'https://nats.education.gov.in/',
    eligibilityRules: {
      minAge: 18,
      educationLevels: ['Diploma', 'Graduate', 'Postgraduate'],
      studentFriendly: true,
      keywords: ['graduate', 'diploma', 'engineering', 'apprenticeship', 'internship', 'fresher']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'pm-vishwakarma',
    title: 'PM Vishwakarma Scheme',
    hindiTitle: 'पीएम विश्वकर्मा योजना',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    category: 'skill_training',
    targetAudience: 'Traditional artisans and craftspeople across 18 recognized family-based trades',
    description:
      'Central Sector Scheme supporting traditional artisans and craftspeople working with hands and tools through recognition, skill upgradation, toolkit incentive, credit support, and marketing assistance.',
    benefitsSummary:
      'PM Vishwakarma Certificate & ID Card; basic (5–7 days) & advanced (15+ days) training with ₹500/day stipend; toolkit e-voucher up to ₹15,000; collateral-free loans up to ₹3 lakh (Tranche I: ₹1L, Tranche II: ₹2L) at 5% concessional rate.',
    eligibilitySummary:
      'Artisans/craftspeople aged 18+ working in 18 specified traditional trades (carpenter, potter, tailor, weaver, blacksmith, etc.). Limited to one member per family; government employees excluded.',
    ageRequirements: 'Minimum 18 years on date of registration',
    educationRequirements: 'No formal degree required; must practice one of the 18 eligible trades',
    stateApplicability: 'All India (Central Sector Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card & Aadhaar-linked mobile number',
      'Ration Card / Family details',
      'Active Bank Account',
      'Local Panchayat / ULB trade verification'
    ],
    applicationProcess:
      'Apply via nearest Common Service Centre (CSC) using biometric Aadhaar authentication on pmvishwakarma.gov.in, followed by 3-tier verification.',
    applicationStatus: 'Ongoing — Registration via CSC & Official Portal',
    officialUrl: 'https://pmvishwakarma.gov.in/',
    applicationUrl: 'https://pmvishwakarma.gov.in/',
    eligibilityRules: {
      minAge: 18,
      ruralFocused: true,
      entrepreneurshipFocused: true,
      keywords: ['artisan', 'craft', 'tailor', 'vocational', 'self-employed', 'rural']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'stand-up-india',
    title: 'Stand-Up India Scheme',
    hindiTitle: 'स्टैंड-अप इंडिया योजना',
    ministry: 'Department of Financial Services, Ministry of Finance',
    category: 'women_livelihood',
    targetAudience: 'Women entrepreneurs and SC/ST entrepreneurs launching greenfield enterprises',
    description:
      'Facilitates composite bank loans between ₹10 lakh and ₹1 crore for setting up a first-time (greenfield) enterprise in manufacturing, services, trading, or agri-allied sectors.',
    benefitsSummary:
      'Composite bank loan (term loan + working capital) from ₹10 lakh to ₹1 crore, RuPay debit card for working capital, credit guarantee coverage, and SIDBI/NABARD handholding support.',
    eligibilitySummary:
      'Women, SC, or ST entrepreneurs aged 18+ starting a greenfield enterprise. For non-individual enterprises, at least 51% shareholding and controlling stake must be held by an SC/ST or woman entrepreneur.',
    ageRequirements: '18 years and above',
    educationRequirements: 'No formal degree mandated; viable greenfield project report required',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Identity & Address Proof (Aadhaar, PAN)',
      'Category Proof (if applying under SC/ST)',
      'Detailed Project Report (DPR)',
      'Business premises & Bank KYC documents'
    ],
    applicationProcess:
      'Register on standupmitra.in (or JanSamarth), access handholding support if needed, and submit your application to a Scheduled Commercial Bank.',
    applicationStatus: 'Ongoing — Apply online via Stand-Up Mitra',
    officialUrl: 'https://www.standupmitra.in/',
    applicationUrl: 'https://www.standupmitra.in/',
    eligibilityRules: {
      minAge: 18,
      womenFocused: true,
      entrepreneurshipFocused: true,
      keywords: ['women', 'entrepreneurship', 'business', 'startup', 'loan']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'startup-india',
    title: 'Startup India Initiative',
    hindiTitle: 'स्टार्टअप इंडिया पहल',
    ministry: 'Department for Promotion of Industry and Internal Trade (DPIIT)',
    category: 'entrepreneurship_loan',
    targetAudience: 'Innovative founders, student entrepreneurs, and DPIIT-recognized startups',
    description:
      'National initiative nurturing innovation-driven startups through DPIIT recognition, mentorship, tax incentives, IPR rebates, self-certification compliance, and access to incubators and funding programs.',
    benefitsSummary:
      'DPIIT recognition, 80% patent filing fee rebate & fast-tracked IPR, labor/environmental self-certification, public procurement relaxations, free learning programs, and Seed Fund / Fund-of-Funds access.',
    eligibilitySummary:
      'Incorporated in India (Pvt Ltd, LLP, or Registered Partnership) up to 10 years old, annual turnover not exceeding ₹100 crore, working toward innovation or scalable products/services. Individuals can access free learning resources.',
    ageRequirements: '18 years and above for founders',
    educationRequirements: 'Open to all educational backgrounds',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Certificate of Incorporation / Partnership Registration',
      'PAN of entity & Founder details',
      'Brief Innovation / Pitch Description'
    ],
    applicationProcess:
      'Create an account on startupindia.gov.in to access free Startup India learning programs or submit your DPIIT recognition application.',
    applicationStatus: 'Ongoing — Portal open year-round',
    officialUrl: 'https://www.startupindia.gov.in/',
    applicationUrl: 'https://www.startupindia.gov.in/',
    eligibilityRules: {
      minAge: 18,
      entrepreneurshipFocused: true,
      studentFriendly: true,
      keywords: ['startup', 'entrepreneurship', 'innovation', 'technology', 'business']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'pm-mudra-yojana',
    title: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    hindiTitle: 'प्रधानमंत्री मुद्रा योजना (PMMY)',
    ministry: 'Department of Financial Services, Ministry of Finance',
    category: 'entrepreneurship_loan',
    targetAudience: 'Micro and small non-farm business owners, traders, service providers, artisans',
    description:
      'Provides institutional credit through banks, NBFCs, and MFIs to non-corporate, non-farm income-generating micro and small enterprises under Shishu, Kishore, Tarun, and Tarun Plus tiers.',
    benefitsSummary:
      'Collateral-free business loans: Shishu (up to ₹50,000), Kishore (₹50,001–₹5 lakh), Tarun (₹5 lakh–₹10 lakh), and Tarun Plus (₹10 lakh–₹20 lakh for eligible repeat borrowers who repaid prior Tarun loans).',
    eligibilitySummary:
      'Indian citizens operating viable non-farm small/micro enterprises (manufacturing, trading, services) with a clean bank credit track record.',
    ageRequirements: '18 years and above',
    educationRequirements: 'No formal education mandated',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Identity & Address Proof (Aadhaar, PAN, Voter ID)',
      'Business Plan / Equipment Quotations',
      'Udyam / Business registration (where applicable)',
      'Bank statements'
    ],
    applicationProcess:
      'Apply online via JanSamarth (jansamarth.in) or visit a participating bank/MFI branch with your project plan and KYC documents.',
    applicationStatus: 'Ongoing — Apply via JanSamarth or participating banks',
    officialUrl: 'https://www.mudra.org.in/',
    applicationUrl: 'https://www.jansamarth.in/',
    eligibilityRules: {
      minAge: 18,
      entrepreneurshipFocused: true,
      keywords: ['business', 'entrepreneurship', 'self-employed', 'loan', 'msme']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'pmegp-msme',
    title: "Prime Minister's Employment Generation Programme (PMEGP)",
    hindiTitle: 'प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME) / KVIC',
    category: 'entrepreneurship_loan',
    targetAudience: 'Aspiring micro-enterprise founders setting up new manufacturing or service units',
    description:
      'Credit-linked subsidy program generating self-employment in rural and urban areas by assisting individuals and institutions to establish new micro-enterprises.',
    benefitsSummary:
      'Margin money subsidy on bank-financed new manufacturing and service projects (higher subsidy rates apply for special categories including women and rural applicants—check current slabs on portal).',
    eligibilitySummary:
      'Individuals aged 18+ starting a new project (existing units or prior subsidy beneficiaries excluded). No income ceiling; one person per family (self/spouse).',
    ageRequirements: 'Above 18 years',
    educationRequirements:
      'No minimum education for manufacturing up to ₹10L / service up to ₹5L; at least Class 8 pass above those limits',
    stateApplicability: 'All India (Implemented via KVIC, KVIB & DICs)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card & PAN Card',
      'Class 8+ certificate (if project exceeds threshold)',
      'Detailed Project Report (DPR)',
      'Special category / rural area certificate (if applicable)'
    ],
    applicationProcess:
      'Submit your online application and project report on the PMEGP e-Portal (kviconline.gov.in/pmegpeportal / pmegp.msme.gov.in) for agency scrutiny and bank appraisal.',
    applicationStatus: 'Ongoing — Online application via PMEGP Portal',
    officialUrl: 'https://pmegp.msme.gov.in/',
    applicationUrl: 'https://pmegp.msme.gov.in/',
    eligibilityRules: {
      minAge: 18,
      entrepreneurshipFocused: true,
      ruralFocused: true,
      keywords: ['business', 'entrepreneurship', 'self-employed', 'manufacturing', 'subsidy']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'ddu-gky',
    title: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
    hindiTitle: 'दीन दयाल उपाध्याय ग्रामीण कौशल्य योजना (DDU-GKY)',
    ministry: 'Ministry of Rural Development (MoRD)',
    category: 'rural_employment',
    targetAudience: 'Rural youth from poor households seeking placement-linked skill training',
    description:
      'Placement-linked skill development program under NRLM designed to transform rural youth into an economically independent, wage-employed workforce.',
    benefitsSummary:
      'Free residential/non-residential skill training, uniform/study materials, post-placement support, and placement linkages with verified employers.',
    eligibilitySummary:
      'Rural youth aged 15–35 years (relaxed up to 45 years for women, PwDs, PVTGs, transgender & special groups) from eligible rural poor households (BPL, MGNREGA 15+ days, SHG/NRLM household, etc.).',
    ageRequirements: '15–35 years (up to 45 years for women, PwDs, and special categories)',
    educationRequirements: 'Varies by training trade (school pass & non-graduate friendly)',
    stateApplicability: 'All India — Rural areas via State Rural Livelihoods Missions',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card',
      'Rural residence & eligible household proof (BPL / MGNREGA / SHG card)',
      'Age & educational certificates',
      'Bank Account details'
    ],
    applicationProcess:
      'Register through Kaushal Panjee / local Gram Panchayat / State SRLM mobilization camps and select an accredited DDU-GKY training partner.',
    applicationStatus: 'Ongoing across States — Verify local batches via SRLM / Portal',
    officialUrl: 'https://ddugky.info/',
    applicationUrl: 'https://ddugky.info/',
    eligibilityRules: {
      minAge: 15,
      maxAge: 35,
      ruralFocused: true,
      studentFriendly: true,
      keywords: ['rural', 'skill', 'training', 'placement', 'youth']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'national-career-service',
    title: 'National Career Service (NCS) Portal',
    hindiTitle: 'नेशनल करियर सर्विस (NCS) पोर्टल',
    ministry: 'Ministry of Labour and Employment, Government of India',
    category: 'rural_employment',
    targetAudience: 'All Indian job seekers, students, freshers, women restarters, and skilled workers',
    description:
      'One-stop national employment exchange connecting job seekers with verified employers, Model Career Centres, nationwide job fairs, and career counseling.',
    benefitsSummary:
      'Free registration, verified job listings, local & online job fairs, Model Career Centre counseling, and free employability skill modules.',
    eligibilitySummary:
      'Open free to all Indian job seekers across urban and rural regions with valid basic identification.',
    ageRequirements: 'Open to working-age Indian job seekers (typically 15+)',
    educationRequirements: 'Open to all education levels (unskilled to postgraduate)',
    stateApplicability: 'All India (Central Portal + State Employment Exchanges)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar / UAN / PAN / Voter ID',
      'Educational & Skill details',
      'Updated Resume'
    ],
    applicationProcess:
      'Register free as a Job Seeker on ncs.gov.in, build your career profile, search verified listings, and attend job fairs.',
    applicationStatus: 'Open year-round',
    officialUrl: 'https://www.ncs.gov.in/',
    applicationUrl: 'https://www.ncs.gov.in/',
    eligibilityRules: {
      minAge: 15,
      studentFriendly: true,
      ruralFocused: true,
      keywords: ['job', 'employment', 'career', 'fresher', 'counseling', 'rural']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'pm-internship-scheme',
    title: "Prime Minister's Internship Scheme (PMIS)",
    hindiTitle: 'प्रधानमंत्री इंटर्नशिप योजना (PMIS)',
    ministry: 'Ministry of Corporate Affairs (MCA)',
    category: 'internship',
    targetAudience: 'Youth seeking 12-month corporate internship exposure across top Indian companies',
    description:
      'Connects eligible young learners across India with 12-month practical internships in participating top companies across sectors.',
    benefitsSummary:
      '12-month real-world corporate internship, monthly stipend/financial assistance, one-time grant for incidentals, and insurance coverage as per official scheme terms.',
    eligibilitySummary:
      'Indian youth (check current cycle age bracket, typically 21–24 / 18–25 as notified) who completed Class 10/12, ITI, Polytechnic Diploma, or eligible Graduation and are not in full-time regular employment or education. Income and exclusion rules apply.',
    ageRequirements: 'Verify current cycle age window (21–24 / 18–25) on pminternship.mca.gov.in',
    educationRequirements: 'Class 10, Class 12, ITI, Polytechnic Diploma, or eligible Graduate degree',
    stateApplicability: 'All India (Central Scheme)',
    verificationStatus: 'verified',
    requiredDocuments: [
      'Aadhaar Card',
      'Educational qualification certificates',
      'Self-declaration of eligibility & income criteria',
      'Aadhaar-seeded Bank Account'
    ],
    applicationProcess:
      'Register on pminternship.mca.gov.in during an active registration cycle, complete e-KYC, and apply to preferred openings.',
    applicationStatus: 'Cycle-based — Confirm open registration window on Official Portal',
    officialUrl: 'https://pminternship.mca.gov.in/',
    applicationUrl: 'https://pminternship.mca.gov.in/',
    eligibilityRules: {
      minAge: 18,
      maxAge: 25,
      educationLevels: ['Class 10', 'Class 12', 'Diploma', 'ITI', 'Graduate'],
      studentFriendly: true,
      keywords: ['internship', 'fresher', 'first job', 'corporate']
    },
    lastReviewedDate: '2026-11-22'
  },

  // ==================== PENDING VERIFICATION (STATE / DYNAMIC SCHEMES — 4) ====================
  {
    slug: 'day-nrlm-livelihoods',
    title: 'DAY-NRLM (National Rural Livelihoods Mission)',
    hindiTitle: 'दीनदयाल अंत्योदय योजना - राष्ट्रीय ग्रामीण आजीविका मिशन',
    ministry: 'Ministry of Rural Development & State Rural Livelihoods Missions (SRLMs)',
    category: 'women_livelihood',
    targetAudience: 'Rural women Self-Help Groups (SHGs) and micro-entrepreneurs',
    description:
      'Empowers rural women households through Self-Help Groups, RSETI skill/enterprise training, financial inclusion, and market linkages. State-specific enrollment rules vary by SRLM.',
    benefitsSummary:
      'SHG community funds, bank credit linkages, RSETI training, and artisan/SHG market platforms (confirm current state benefits via SRLM).',
    eligibilitySummary:
      'Rural women households eligible for village SHG membership under State Rural Livelihoods Missions — verify local state guidelines.',
    ageRequirements: 'Typically 18+ years (verify state SRLM norms)',
    educationRequirements: 'No formal education required',
    stateApplicability: 'All States & UTs (State SRLM implementation varies)',
    verificationStatus: 'pending_verification',
    requiredDocuments: [
      'Aadhaar Card',
      'Rural Residence Proof',
      'Savings Bank Account',
      'SHG Membership Details'
    ],
    applicationProcess:
      'Contact your Block Mission Management Unit (BMMU) or visit aajeevika.gov.in to confirm your state SRLM enrollment process.',
    applicationStatus: 'Pending state-level verification — Confirm with local SRLM / Portal',
    officialUrl: 'https://aajeevika.gov.in/',
    applicationUrl: 'https://aajeevika.gov.in/',
    eligibilityRules: {
      minAge: 18,
      womenFocused: true,
      ruralFocused: true,
      entrepreneurshipFocused: true,
      keywords: ['women', 'rural', 'livelihood', 'shg', 'self-employed']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'udyam-msme-registration',
    title: 'Udyam Registration (Official MSME Recognition)',
    hindiTitle: 'उद्यम पंजीकरण (MSME मान्यता)',
    ministry: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
    category: 'entrepreneurship_loan',
    targetAudience: 'Micro, small, and medium business founders, freelancers, and home-based enterprises',
    description:
      'Free, paperless online registration providing an official Udyam Registration Number and MSME certificate that helps small businesses access priority credit and MSME schemes.',
    benefitsSummary:
      'Official MSME recognition certificate, access to collateral-free MSME credit schemes, tender preferences, and delayed-payment protection (confirm current investment/turnover thresholds on portal).',
    eligibilitySummary:
      'Proprietorships, partnerships, LLPs, companies, and eligible micro-enterprises meeting current MSME investment and turnover classification limits.',
    ageRequirements: '18 years and above',
    educationRequirements: 'Open to all educational backgrounds',
    stateApplicability: 'All India (Central Portal)',
    verificationStatus: 'pending_verification',
    requiredDocuments: [
      'Aadhaar Number of proprietor/partner/director',
      'PAN & GSTIN (where applicable)',
      'Bank account & business activity NIC code'
    ],
    applicationProcess:
      'Visit udyamregistration.gov.in (free official government portal—avoid paid third-party agents) and complete Aadhaar/PAN-based self-declaration.',
    applicationStatus: 'Pending verification of latest classification slabs — Check Official Portal',
    officialUrl: 'https://udyamregistration.gov.in/',
    applicationUrl: 'https://udyamregistration.gov.in/',
    eligibilityRules: {
      minAge: 18,
      entrepreneurshipFocused: true,
      keywords: ['business', 'msme', 'entrepreneurship', 'freelance', 'self-employed']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'myscheme-state-employment-finder',
    title: 'myScheme National & State Skill/Employment Directory',
    hindiTitle: 'माई-स्कीम राष्ट्रीय एवं राज्य योजना निर्देशिका',
    ministry: 'National e-Governance Division (NeGD), MeitY',
    category: 'skill_training',
    targetAudience: 'Citizens searching for state-specific youth, women, scholarship, and employment schemes',
    description:
      'Official Government of India discovery platform aggregating Central and State-specific skill training, unemployment allowance, women entrepreneurship, and scholarship schemes.',
    benefitsSummary:
      'Single verified government search portal to filter state-specific employment, education, and women welfare schemes by your exact state, age, and category.',
    eligibilitySummary:
      'Eligibility varies by each individual Central or State scheme listed inside myScheme — check each scheme page directly.',
    ageRequirements: 'Varies by individual state/central scheme',
    educationRequirements: 'Varies by individual scheme',
    stateApplicability: 'All Indian States & Union Territories (State-specific filtering)',
    verificationStatus: 'pending_verification',
    requiredDocuments: [
      'Depends on the specific Central/State scheme chosen on myScheme'
    ],
    applicationProcess:
      'Visit myscheme.gov.in, enter your state, age, gender, and education in the official eligibility checker, and follow the verified scheme application link.',
    applicationStatus: 'Pending individual state-scheme check — Use official myScheme matcher',
    officialUrl: 'https://www.myscheme.gov.in/',
    applicationUrl: 'https://www.myscheme.gov.in/',
    eligibilityRules: {
      studentFriendly: true,
      keywords: ['state', 'scholarship', 'skill', 'women', 'employment']
    },
    lastReviewedDate: '2026-11-22'
  },
  {
    slug: 'mahila-samriddhi-nsfdc',
    title: 'Mahila Samriddhi Yojana (Micro-Finance for Women Entrepreneurs)',
    hindiTitle: 'महिला समृद्धि योजना',
    ministry: 'Ministry of Social Justice & Empowerment (NSFDC / State Channelizing Agencies)',
    category: 'women_livelihood',
    targetAudience: 'Eligible women entrepreneurs seeking micro-credit for income-generating ventures',
    description:
      'Micro-finance scheme providing concessional credit through State Channelizing Agencies (SCAs) to support small income-generating enterprises led by eligible women.',
    benefitsSummary:
      'Concessional micro-credit loans for small business equipment and working capital (confirm current loan cap, interest rate, and income limit with your State Channelizing Agency).',
    eligibilitySummary:
      'Category-specific and annual family income criteria apply — please verify current official eligibility notifications on nsfdc.nic.in / myScheme before applying.',
    ageRequirements: 'Typically 18–55 years (confirm on official portal)',
    educationRequirements: 'No formal degree required',
    stateApplicability: 'Implemented through State Channelizing Agencies (SCAs) across India',
    verificationStatus: 'pending_verification',
    requiredDocuments: [
      'Identity & Residence Proof (Aadhaar)',
      'Income & Category Certificates (as applicable)',
      'Small business proposal & Bank Account details'
    ],
    applicationProcess:
      'Check current guidelines on nsfdc.nic.in or contact your District Social Welfare / State Channelizing Agency office.',
    applicationStatus: 'Pending verification of current state cycle & terms — Check Official Portal',
    officialUrl: 'https://nsfdc.nic.in/',
    applicationUrl: 'https://nsfdc.nic.in/',
    eligibilityRules: {
      minAge: 18,
      womenFocused: true,
      entrepreneurshipFocused: true,
      keywords: ['women', 'microfinance', 'entrepreneurship', 'self-employed']
    },
    lastReviewedDate: '2026-11-22'
  }
];
