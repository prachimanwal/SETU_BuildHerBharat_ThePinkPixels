import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { ENV } from '../config/env';
import { Opportunity, OpportunityType, WorkMode } from '../models/Opportunity';
import { User } from '../models/User';

/**
 * DEVELOPMENT-ONLY Sample Opportunities Seeder.
 * Strictly refuses to run in production (NODE_ENV === 'production').
 * Every inserted document is clearly labeled as a development example (`isSampleExample: true`).
 */
const DEV_SAMPLE_OPPORTUNITIES: Array<{
  title: string;
  organisationName: string;
  description: string;
  requiredSkills: string[];
  location: { city: string; state: string; isRuralFocus: boolean };
  workMode: WorkMode;
  opportunityType: OpportunityType;
  stipendOrSalary: string;
  duration: string;
  experienceRequired: string;
  isCareerRestart: boolean;
  isSampleExample: boolean;
}> = [
  {
    title: '[SAMPLE EXAMPLE] Junior Data Analyst (Fresher Friendly)',
    organisationName: 'Example Analytics Collective (Dev Sample)',
    description:
      'Development-only example listing demonstrating SETU profile-weighted matching across SQL, Excel, Python, and remote flexibility.',
    requiredSkills: ['SQL', 'Excel', 'Python', 'Data Analysis'],
    location: { city: 'Gurugram', state: 'Haryana', isRuralFocus: false },
    workMode: 'remote',
    opportunityType: 'full_time',
    stipendOrSalary: '₹4.5 - 6 LPA (Example)',
    duration: 'Full-Time',
    experienceRequired: 'Entry-Level / 0-1 Years',
    isCareerRestart: true,
    isSampleExample: true
  },
  {
    title: '[SAMPLE EXAMPLE] Social Media & Canva Content Intern',
    organisationName: 'Example Creative Studio (Dev Sample)',
    description:
      'Development-only example internship for testing internship filtering, Canva/Digital Marketing skill matching, and application tracking.',
    requiredSkills: ['Canva', 'Digital Marketing', 'Content Writing'],
    location: { city: 'Jaipur', state: 'Rajasthan', isRuralFocus: false },
    workMode: 'hybrid',
    opportunityType: 'internship',
    stipendOrSalary: '₹10,000 / month (Example)',
    duration: '3 Months',
    experienceRequired: 'Students & Freshers Welcome',
    isCareerRestart: true,
    isSampleExample: true
  },
  {
    title: '[SAMPLE EXAMPLE] Part-Time Customer Support Associate',
    organisationName: 'Example Bharat Support Desk (Dev Sample)',
    description:
      'Development-only example listing for testing part-time and communication/customer-service skill filters.',
    requiredSkills: ['Customer Service', 'Communication Skills', 'Digital Literacy'],
    location: { city: 'Bengaluru', state: 'Karnataka', isRuralFocus: false },
    workMode: 'remote',
    opportunityType: 'part_time',
    stipendOrSalary: '₹15,000 / month (Example)',
    duration: 'Part-Time (20 hrs/week)',
    experienceRequired: 'Entry-Level Welcome',
    isCareerRestart: true,
    isSampleExample: true
  },
  {
    title: '[SAMPLE EXAMPLE] Frontend React Freelance Project',
    organisationName: 'Example Civic Tech Initiative (Dev Sample)',
    description:
      'Development-only example freelance project for testing freelance filter and technical skill matching.',
    requiredSkills: ['HTML/CSS', 'JavaScript', 'React'],
    location: { city: 'Remote', state: 'India', isRuralFocus: false },
    workMode: 'remote',
    opportunityType: 'freelance',
    stipendOrSalary: '₹25,000 fixed milestone (Example)',
    duration: '6 Weeks',
    experienceRequired: 'Portfolio-based',
    isCareerRestart: false,
    isSampleExample: true
  },
  {
    title: '[SAMPLE EXAMPLE] Digital Operations Apprentice',
    organisationName: 'Example Skill Partner Org (Dev Sample)',
    description:
      'Development-only example apprenticeship listing demonstrating apprenticeship filter and career-pathway testing.',
    requiredSkills: ['Computer Fundamentals', 'Excel', 'Communication Skills'],
    location: { city: 'Pune', state: 'Maharashtra', isRuralFocus: true },
    workMode: 'onsite',
    opportunityType: 'apprenticeship',
    stipendOrSalary: '₹12,000 / month stipend (Example)',
    duration: '12 Months',
    experienceRequired: 'Class 12 / ITI / Diploma / Graduate',
    isCareerRestart: false,
    isSampleExample: true
  },
  {
    title: '[SAMPLE EXAMPLE] Micro-Enterprise Cohort Fellow',
    organisationName: 'Example Women Entrepreneurship Hub (Dev Sample)',
    description:
      'Development-only example entrepreneurship opportunity for testing entrepreneurship filter and scheme cross-links.',
    requiredSkills: ['Entrepreneurship', 'Digital Marketing', 'Project Management'],
    location: { city: 'Indore', state: 'Madhya Pradesh', isRuralFocus: true },
    workMode: 'hybrid',
    opportunityType: 'entrepreneurship',
    stipendOrSalary: 'Mentorship + Seed Grant Guidance (Example)',
    duration: '4 Months Cohort',
    experienceRequired: 'Aspiring Founders',
    isCareerRestart: true,
    isSampleExample: true
  }
];

async function runDevSampleSeed() {
  if (ENV.NODE_ENV === 'production') {
    throw new Error(
      'REFUSED: seedDevSampleOpportunities cannot run when NODE_ENV=production. Production opportunities must come from verified employers.'
    );
  }

  await connectDB();

  const employer = await User.findOne({ role: 'employer' });
  const fallbackEmployerId = employer?._id || new mongoose.Types.ObjectId();

  let inserted = 0;
  let skipped = 0;

  for (const item of DEV_SAMPLE_OPPORTUNITIES) {
    const exists = await Opportunity.findOne({ title: item.title, isSampleExample: true });
    if (exists) {
      skipped++;
    } else {
      await Opportunity.create({
        ...item,
        employerId: fallbackEmployerId,
        status: 'published',
        moderationStatus: 'clean'
      });
      inserted++;
    }
  }

  console.log(
    `[Dev Sample Opportunities] inserted: ${inserted}, skipped: ${skipped} (all labeled isSampleExample: true)`
  );
}

if (require.main === module) {
  runDevSampleSeed()
    .then(async () => {
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Dev Sample Seed Error]', err?.message || err);
      try {
        await mongoose.connection.close();
      } catch {}
      process.exit(1);
    });
}
