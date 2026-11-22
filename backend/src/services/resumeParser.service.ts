import mammoth from 'mammoth';
import { IExtractedResumeData } from '../models/UploadedResumeFile';

const KNOWN_SKILLS_DICTIONARY = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'MySQL',
  'PostgreSQL', 'HTML', 'CSS', 'Tailwind CSS', 'Java', 'C++', 'C', 'Git', 'GitHub', 'Docker',
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

export async function extractRawTextFromResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const lowerName = filename.toLowerCase();

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || '').trim();
  }

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    // Support both pdf-parse v1 (default function) and v2 (PDFParse class)
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
      const parser = new pdfParseMod.PDFParse({ data: buffer });
      const parsed = await parser.getText();
      return (parsed?.text || '').trim();
    }
    throw new Error('PDF text extractor could not initialize.');
  }

  throw new Error('Unsupported file format. Please upload a PDF or DOCX resume.');
}

export function parseStructuredResumeText(rawText: string): IExtractedResumeData {
  const cleanText = rawText.replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Email & Phone
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanText.match(/(?:\+91[\s-]?)?[6-9]\d{9}\b/);

  // 2. Probable Full Name (first short non-email/non-heading line)
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    if (
      line.length >= 3 &&
      line.length <= 50 &&
      !line.includes('@') &&
      !/resume|curriculum vitae|cv|phone|email|http/i.test(line) &&
      /^[A-Za-z][A-Za-z .'-]+$/.test(line)
    ) {
      fullName = line;
      break;
    }
  }

  // 3. Skills detection against curated dictionary
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

  // 5. Section-based extraction for Projects, Experience, Certifications
  const extractSectionLines = (headerPattern: RegExp, maxItems: number): string[] => {
    const startIdx = lines.findIndex((l) => headerPattern.test(l) && l.length < 40);
    if (startIdx < 0) return [];
    const stopPattern =
      /^(education|skills|technical skills|projects|experience|work experience|internships|certifications|certificates|achievements|awards|languages|references|summary|objective)\b/i;
    const collected: string[] = [];
    for (let i = startIdx + 1; i < lines.length && collected.length < maxItems; i++) {
      if (stopPattern.test(lines[i]) && lines[i].length < 35) break;
      if (lines[i].length >= 4) collected.push(lines[i]);
    }
    return collected;
  };

  const projectLines = extractSectionLines(/^(projects|academic projects|key projects)\b/i, 6);
  const projects: Array<{ title: string; description: string }> = [];
  for (let i = 0; i < projectLines.length; i += 2) {
    projects.push({
      title: projectLines[i].replace(/^[•\-*]\s*/, '').slice(0, 80),
      description: (projectLines[i + 1] || projectLines[i]).replace(/^[•\-*]\s*/, '').slice(0, 240)
    });
  }

  const expLines = extractSectionLines(/^(experience|work experience|internships|employment)\b/i, 6);
  const workExperience: Array<{ jobTitle: string; organization: string; duration?: string }> = [];
  for (let i = 0; i < expLines.length; i += 2) {
    const parts = expLines[i].replace(/^[•\-*]\s*/, '').split(/[-–|@]| at /i);
    workExperience.push({
      jobTitle: (parts[0] || expLines[i]).trim().slice(0, 80),
      organization: (parts[1] || expLines[i + 1] || 'Organization').trim().slice(0, 80)
    });
  }

  const certifications = extractSectionLines(
    /^(certifications|certificates|courses|licenses)\b/i,
    5
  ).map((c) => c.replace(/^[•\-*]\s*/, '').slice(0, 120));

  // 6. Infer career interests from detected skills/text
  const careerInterests = INTEREST_KEYWORDS.filter((entry) =>
    entry.patterns.some((pat) => lowerFull.includes(pat))
  ).map((entry) => entry.interest);

  return {
    fullName,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    education,
    skills: Array.from(new Set(detectedSkills)).slice(0, 20),
    projects: projects.slice(0, 4),
    workExperience: workExperience.slice(0, 4),
    certifications,
    careerInterests
  };
}
