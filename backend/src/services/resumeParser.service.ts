import mammoth from 'mammoth';
import { IExtractedResumeData } from '../models/UploadedResumeFile';

export class ResumeFileCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResumeFileCorruptedError';
  }
}

const KNOWN_SKILLS_DICTIONARY = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'MySQL',
  'PostgreSQL', 'HTML', 'CSS', 'Tailwind CSS', 'Java', 'C++', 'C', 'Git', 'GitHub', 'Docker',
  'AWS', 'Azure', 'REST API', 'GraphQL', 'Next.js', 'Angular', 'Vue.js', 'Flutter', 'Android',
  'Machine Learning', 'Artificial Intelligence', 'Data Analysis', 'Data Science', 'Pandas',
  'NumPy', 'Power BI', 'Tableau', 'Excel', 'Microsoft Excel', 'Microsoft Office', 'Google Workspace',
  'Canva', 'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Graphic Design', 'UI/UX Design',
  'Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Writing', 'Copywriting',
  'Video Editing', 'Project Management', 'Agile', 'Scrum', 'Communication', 'Communication Skills',
  'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Time Management',
  'Customer Service', 'Sales', 'Accounting', 'Tally', 'Finance', 'Entrepreneurship',
  'Digital Literacy', 'Computer Fundamentals', 'Hindi Typing', 'English Proficiency'
];

const INTEREST_KEYWORDS: Array<{ interest: string; patterns: string[] }> = [
  { interest: 'Software & Web Development', patterns: ['react', 'javascript', 'html', 'css', 'node.js', 'software', 'frontend', 'backend', 'full stack'] },
  { interest: 'Data & AI', patterns: ['data analysis', 'data science', 'machine learning', 'sql', 'pandas', 'power bi', 'tableau', 'artificial intelligence'] },
  { interest: 'Design & Creative', patterns: ['canva', 'figma', 'ui/ux', 'graphic design', 'photoshop', 'video editing', 'illustrator'] },
  { interest: 'Marketing & Content', patterns: ['digital marketing', 'seo', 'social media', 'content writing', 'copywriting'] },
  { interest: 'Business & Management', patterns: ['project management', 'business analyst', 'operations', 'finance', 'accounting', 'customer service', 'entrepreneurship'] }
];

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK.. (DOCX is a ZIP container)

/**
 * Validates binary magic bytes against the claimed PDF or DOCX format
 * to catch renamed/fake or corrupted documents early.
 */
export function validateResumeFileSignature(
  buffer: Buffer,
  mimeType: string,
  filename: string
): 'pdf' | 'docx' {
  if (!buffer || buffer.length === 0) {
    throw new ResumeFileCorruptedError(
      'The uploaded resume file is empty. Please upload a valid PDF or DOCX document.'
    );
  }

  const lowerName = (filename || '').toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || mimeType === 'application/pdf';
  const isDocx =
    lowerName.endsWith('.docx') ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isPdf) {
    // Allow optional leading whitespace/BOM before %PDF-
    const head = buffer.subarray(0, Math.min(buffer.length, 1024));
    if (head.indexOf(PDF_MAGIC) === -1) {
      throw new ResumeFileCorruptedError(
        'The uploaded PDF file appears to be corrupted or invalid. Please re-export it as a valid PDF and try again.'
      );
    }
    return 'pdf';
  }

  if (isDocx) {
    if (buffer.length < 4 || !buffer.subarray(0, 4).equals(ZIP_MAGIC)) {
      throw new ResumeFileCorruptedError(
        'The uploaded DOCX file appears to be corrupted or not a valid Word (.docx) document.'
      );
    }
    return 'docx';
  }

  throw new Error('Only PDF and DOCX files are supported.');
}

export async function extractRawTextFromResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const kind = validateResumeFileSignature(buffer, mimeType, filename);

  if (kind === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim();
    } catch {
      throw new ResumeFileCorruptedError(
        'Unable to read this DOCX file because it appears corrupted or password-protected. Please save a fresh copy and try again.'
      );
    }
  }

  // PDF parsing (supports pdf-parse v1 default function & v2 PDFParse class)
  let parserInstance: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParseMod = require('pdf-parse');
    if (typeof pdfParseMod === 'function') {
      const parsed = await pdfParseMod(buffer);
      return (parsed?.text || '').trim();
    }
    if (typeof pdfParseMod?.default === 'function') {
      const parsed = await pdfParseMod.default(buffer);
      return (parsed?.text || '').trim();
    }
    if (typeof pdfParseMod?.PDFParse === 'function') {
      parserInstance = new pdfParseMod.PDFParse({ data: buffer });
      const parsed = await parserInstance.getText();
      return (parsed?.text || '').trim();
    }
    throw new Error('PDF text extractor could not initialize.');
  } catch (err: any) {
    if (err instanceof ResumeFileCorruptedError) throw err;
    throw new ResumeFileCorruptedError(
      'Unable to read this PDF file because it appears corrupted, encrypted, or damaged. Please upload a valid unencrypted PDF.'
    );
  } finally {
    if (parserInstance && typeof parserInstance.destroy === 'function') {
      await parserInstance.destroy().catch(() => {});
    }
  }
}

export function createEmptyExtractedResumeData(): IExtractedResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    education: [],
    skills: [],
    projects: [],
    workExperience: [],
    internships: [],
    certifications: [],
    achievements: [],
    careerInterests: []
  };
}

export function parseStructuredResumeText(rawText: string): IExtractedResumeData {
  const cleanText = rawText.replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return createEmptyExtractedResumeData();
  }

  // 1. Email & Phone (only when actually present in resume)
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanText.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b|\+\d{1,3}[\s-]?\d{7,12}\b/);

  // 2. Probable Full Name (first short non-email/non-heading line)
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    if (
      line.length >= 3 &&
      line.length <= 50 &&
      !line.includes('@') &&
      !/resume|curriculum vitae|cv|phone|email|http|linkedin|github/i.test(line) &&
      /^[A-Za-z][A-Za-z .'-]+$/.test(line)
    ) {
      fullName = line;
      break;
    }
  }

  // 3. Skills detection against curated dictionary + explicit Skills section tokens
  const lowerFull = cleanText.toLowerCase();
  const detectedSkills = KNOWN_SKILLS_DICTIONARY.filter((skill) => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[\\s,;|/•(-])${escaped}(?:$|[\\s,;|/•).+-])`, 'i');
    return regex.test(lowerFull);
  });

  // 4. Education extraction (degree keywords + years)
  const education: IExtractedResumeData['education'] = [];
  const eduRegex =
    /(B\.?\s?Tech|B\.?\s?E\.?|B\.?\s?Sc|B\.?\s?Com|B\.?\s?A\.?|B\.?\s?B\.?\s?A|B\.?\s?C\.?\s?A|M\.?\s?Tech|M\.?\s?B\.?\s?A|M\.?\s?C\.?\s?A|M\.?\s?Sc|Diploma|ITI|Class\s*12|12th|Higher Secondary|Class\s*10|10th)/i;

  for (const line of lines) {
    const m = line.match(eduRegex);
    if (m && education.length < 4) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const scoreMatch = line.match(/(\d{2}(?:\.\d+)?\s*%|\d(?:\.\d{1,2})?\s*(?:CGPA|GPA|\/\s*10))/i);
      const token = m[1];
      let level = 'Graduate';
      if (/10|secondary/i.test(token) && !/12|higher/i.test(token)) level = 'Class 10 completed';
      else if (/12|higher/i.test(token)) level = 'Class 12 completed';
      else if (/diploma|iti/i.test(token)) level = 'Diploma / ITI';
      else if (/M\.?\s?Tech|M\.?\s?B\.?\s?A|M\.?\s?C\.?\s?A|M\.?\s?Sc/i.test(token)) level = 'Postgraduate';

      education.push({
        level,
        degree: line.slice(0, 90),
        graduationYear: yearMatch ? yearMatch[0] : '',
        score: scoreMatch ? scoreMatch[0] : ''
      });
    }
  }

  // 5. Section-based extraction (strictly from real resume lines; never invents missing entries)
  const stopPattern =
    /^(education|academic background|skills|technical skills|core skills|projects|academic projects|key projects|experience|work experience|employment|professional experience|internships|internship|certifications|certificates|courses|licenses|achievements|awards|honors|honours|languages|references|summary|objective|profile)\s*:?$/i;

  const extractSectionLines = (headerPattern: RegExp, maxItems: number): string[] => {
    const startIdx = lines.findIndex((l) => headerPattern.test(l.replace(/:$/, '').trim()) && l.length < 45);
    if (startIdx < 0) return [];
    const collected: string[] = [];
    for (let i = startIdx + 1; i < lines.length && collected.length < maxItems; i++) {
      if (stopPattern.test(lines[i].trim()) && lines[i].length < 40) break;
      if (lines[i].length >= 3) collected.push(lines[i]);
    }
    return collected;
  };

  // Projects
  const projectLines = extractSectionLines(/^(projects|academic projects|key projects)$/i, 8);
  const projects: Array<{ title: string; description: string }> = [];
  for (let i = 0; i < projectLines.length; i += 2) {
    const rawTitle = projectLines[i].replace(/^[•\-*]\s*/, '').trim();
    const rawDesc = (projectLines[i + 1] || '').replace(/^[•\-*]\s*/, '').trim();
    if (rawTitle) {
      projects.push({
        title: rawTitle.slice(0, 90),
        description: (rawDesc || rawTitle).slice(0, 260)
      });
    }
  }

  // Dedicated Internships section
  const internshipLines = extractSectionLines(/^(internships|internship|internship experience)$/i, 6);
  const internships: Array<{ role: string; organization: string; duration?: string }> = [];
  for (const line of internshipLines) {
    const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
    if (!cleaned) continue;
    const parts = cleaned.split(/\s*(?:[-–|@]| at )\s*/i);
    if (parts[0]) {
      internships.push({
        role: parts[0].trim().slice(0, 80),
        organization: (parts[1] || '').trim().slice(0, 80),
        duration: (parts[2] || '').trim().slice(0, 40)
      });
    }
  }

  // Work Experience (routes intern titles cleanly into internships if no separate section)
  const expLines = extractSectionLines(
    /^(experience|work experience|employment|professional experience)$/i,
    8
  );
  const workExperience: Array<{ jobTitle: string; organization: string; duration?: string }> = [];
  for (const line of expLines) {
    const cleaned = line.replace(/^[•\-*]\s*/, '').trim();
    if (!cleaned) continue;
    const parts = cleaned.split(/\s*(?:[-–|@]| at )\s*/i);
    const titleStr = (parts[0] || cleaned).trim().slice(0, 80);
    const orgStr = (parts[1] || '').trim().slice(0, 80);
    const durStr = (parts[2] || '').trim().slice(0, 40);
    if (/\bintern\b|\btrainee\b/i.test(titleStr)) {
      internships.push({ role: titleStr, organization: orgStr, duration: durStr });
    } else {
      workExperience.push({ jobTitle: titleStr, organization: orgStr, duration: durStr });
    }
  }

  // Certifications
  const certifications = extractSectionLines(
    /^(certifications|certificates|courses|licenses)$/i,
    6
  )
    .map((c) => c.replace(/^[•\-*]\s*/, '').trim().slice(0, 120))
    .filter(Boolean);

  // Achievements / Awards
  const achievements = extractSectionLines(
    /^(achievements|awards|honors|honours|accomplishments)$/i,
    6
  )
    .map((a) => a.replace(/^[•\-*]\s*/, '').trim().slice(0, 160))
    .filter(Boolean);

  // Career Interests (derived from detected skills/text only)
  const careerInterests = INTEREST_KEYWORDS.filter((entry) =>
    entry.patterns.some((pat) => lowerFull.includes(pat))
  ).map((entry) => entry.interest);

  return {
    fullName,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    education,
    skills: Array.from(new Set(detectedSkills)).slice(0, 24),
    projects: projects.slice(0, 4),
    workExperience: workExperience.slice(0, 5),
    internships: internships.slice(0, 5),
    certifications,
    achievements,
    careerInterests
  };
}
