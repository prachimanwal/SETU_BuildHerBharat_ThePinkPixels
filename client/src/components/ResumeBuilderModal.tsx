import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  FileText,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertCircle,
  Save
} from 'lucide-react';
import { apiFetch, unwrapData } from '../utils/api';

interface ResumeBuilderModalProps {
  existingResume?: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const STEPS = [
  '1. Personal Info',
  '2. Objective',
  '3. Education',
  '4. Skills',
  '5. Projects',
  '6. Experience',
  '7. Certifications',
  '8. Templates',
  '9. Preview & Export'
];

const TEMPLATES = [
  {
    id: 'ats_professional',
    name: 'ATS-Friendly Professional',
    desc: 'Classic single-column recruiter & ATS favorite with navy accents.',
    accent: '#1E3A5F'
  },
  {
    id: 'modern_minimal',
    name: 'Modern Minimal',
    desc: 'Left-aligned contemporary typography with sky-blue highlights.',
    accent: '#2589D6'
  },
  {
    id: 'student_fresher',
    name: 'Student / Fresher Resume',
    desc: 'Emphasizes education, verified skills, and hands-on projects first.',
    accent: '#0F766E'
  },
  {
    id: 'creative_professional',
    name: 'Creative Professional',
    desc: 'Refined editorial hierarchy with soft rose accents for creative roles.',
    accent: '#BE185D'
  }
];

const BEGINNER_PROJECT_IDEAS = [
  {
    title: 'Personal Monthly Budget & KPI Tracker (Excel)',
    hint: 'Great for Data, Business, Operations & Commerce roles'
  },
  {
    title: 'Responsive Personal Career Portfolio Website (HTML/CSS)',
    hint: 'Great for Software, Web & Creative roles'
  },
  {
    title: '2-Week Social Media Campaign & Canva Brand Kit',
    hint: 'Great for Digital Marketing, Content & Design roles'
  },
  {
    title: 'SQL Student & Course Management Database',
    hint: 'Great for Data Analytics & Backend roles'
  }
];

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({
  existingResume,
  onClose,
  onSaved
}) => {
  const [step, setStep] = useState(0);
  const [loadingPrefill, setLoadingPrefill] = useState(!existingResume);
  const [saving, setSaving] = useState(false);
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);
  const [reviewingCane, setReviewingCane] = useState(false);
  const [caneReview, setCaneReview] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [resumeId, setResumeId] = useState<string>(existingResume?._id || '');
  const [versionName, setVersionName] = useState<string>(
    existingResume?.versionName || 'My SETU Resume'
  );
  const [template, setTemplate] = useState<string>(
    existingResume?.template || 'ats_professional'
  );
  const [isDefault, setIsDefault] = useState<boolean>(Boolean(existingResume?.isDefault));
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    Array.isArray(existingResume?.sectionOrder) && existingResume.sectionOrder.length > 0
      ? existingResume.sectionOrder
      : ['summary', 'education', 'skills', 'projects', 'experience', 'certifications']
  );

  const [personalInfo, setPersonalInfo] = useState<any>(
    existingResume?.personalInfo || {
      fullName: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: ''
    }
  );
  const [careerObjective, setCareerObjective] = useState<any>(
    existingResume?.careerObjective || {
      targetRole: '',
      interests: '',
      strongestSkills: '',
      summary: ''
    }
  );
  const [education, setEducation] = useState<any[]>(existingResume?.education || []);
  const [skills, setSkills] = useState<any[]>(existingResume?.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCat, setNewSkillCat] = useState('Technical');

  const [hasProjects, setHasProjects] = useState<boolean>(
    existingResume ? Boolean(existingResume.hasProjects) : true
  );
  const [projects, setProjects] = useState<any[]>(existingResume?.projects || []);
  const [hasWorkExperience, setHasWorkExperience] = useState<boolean>(
    existingResume ? Boolean(existingResume.hasWorkExperience) : false
  );
  const [workExperience, setWorkExperience] = useState<any[]>(
    existingResume?.workExperience || []
  );
  const [certifications, setCertifications] = useState<any[]>(
    existingResume?.certifications || []
  );
  const [awardsText, setAwardsText] = useState<string>(
    Array.isArray(existingResume?.awards) ? existingResume.awards.join('\n') : ''
  );
  const [volunteeringText, setVolunteeringText] = useState<string>(
    Array.isArray(existingResume?.volunteering) ? existingResume.volunteering.join('\n') : ''
  );

  useEffect(() => {
    if (existingResume) return;
    apiFetch('/api/resumes/prefill')
      .then((res) => {
        if (res.ok && res.data) {
          const pre = unwrapData(res.data);
          if (pre.versionName) setVersionName(pre.versionName);
          if (pre.template) setTemplate(pre.template);
          if (pre.personalInfo) setPersonalInfo(pre.personalInfo);
          if (pre.careerObjective) setCareerObjective(pre.careerObjective);
          if (Array.isArray(pre.education)) setEducation(pre.education);
          if (Array.isArray(pre.skills)) setSkills(pre.skills);
          if (Array.isArray(pre.projects)) {
            setProjects(pre.projects);
            setHasProjects(pre.projects.length > 0);
          }
          if (Array.isArray(pre.workExperience)) {
            setWorkExperience(pre.workExperience);
            setHasWorkExperience(pre.workExperience.length > 0);
          }
        }
      })
      .finally(() => setLoadingPrefill(false));
  }, [existingResume]);

  const buildPayload = (status: 'draft' | 'ready') => ({
    versionName: versionName.trim() || 'My SETU Resume',
    template,
    isDefault,
    status,
    sectionOrder,
    personalInfo,
    careerObjective,
    education,
    skills,
    hasProjects,
    projects: hasProjects ? projects : [],
    hasWorkExperience,
    workExperience: hasWorkExperience ? workExperience : [],
    certifications,
    awards: awardsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    volunteering: volunteeringText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  });

  const handleSave = async (status: 'draft' | 'ready'): Promise<string | null> => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = buildPayload(status);
      const res = resumeId
        ? await apiFetch(`/api/resumes/${resumeId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiFetch('/api/resumes', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

      if (!res.ok) {
        setError(res.error || 'Could not save resume right now.');
        return null;
      }
      const saved = unwrapData(res.data);
      const newId = saved?._id || resumeId;
      setResumeId(newId);
      setNotice(
        status === 'ready'
          ? 'Resume saved and marked Ready! You can download PDF or DOCX below. 🩵'
          : 'Draft saved safely to your SETU account.'
      );
      onSaved();
      return newId;
    } catch (err: any) {
      setError(err?.message || 'Network error while saving resume.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    let targetId = resumeId;
    if (!targetId) {
      const savedId = await handleSave('ready');
      if (!savedId) return;
      targetId = savedId;
    } else {
      await handleSave('ready');
    }

    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    window.open(`${baseUrl}/api/resumes/${targetId}/download/${format}`, '_blank', 'noopener');
  };

  const generateSuggestedSummary = () => {
    const role = careerObjective.targetRole?.trim() || 'entry-level career opportunities';
    const interests = careerObjective.interests?.trim();
    const topSkills =
      careerObjective.strongestSkills?.trim() ||
      skills
        .slice(0, 4)
        .map((s) => s.name)
        .join(', ');
    const latestEdu = education[0]?.degree || education[0]?.qualification || '';

    const parts = [
      `${latestEdu ? `${latestEdu} candidate` : 'Motivated professional'} seeking ${role}${
        interests ? ` with strong interest in ${interests}` : ''
      }.`,
      topSkills ? `Skilled in ${topSkills}.` : '',
      hasProjects && projects.length > 0
        ? `Hands-on experience demonstrated through ${projects.length} practical project${
            projects.length > 1 ? 's' : ''
          }.`
        : 'Committed to continuous learning, practical problem solving, and reliable team contribution.'
    ].filter(Boolean);

    setCareerObjective({ ...careerObjective, summary: parts.join(' ') });
  };

  const handleImproveProject = async (idx: number) => {
    const proj = projects[idx];
    if (!proj) return;
    setImprovingIdx(idx);
    setError('');
    try {
      const res = await apiFetch('/api/resumes/improve-project', {
        method: 'POST',
        body: JSON.stringify({
          title: proj.title,
          description: proj.description,
          technologies: proj.technologies,
          role: proj.role
        })
      });
      if (res.ok) {
        const data = unwrapData(res.data);
        if (data?.improvedDescription) {
          const next = [...projects];
          next[idx] = { ...next[idx], description: data.improvedDescription };
          setProjects(next);
          setNotice(`Project description improved (${data.poweredBy || 'CANE'}). Review and edit anytime.`);
        }
      } else {
        setError(res.error || 'Could not polish description right now.');
      }
    } finally {
      setImprovingIdx(null);
    }
  };

  const handleCaneResumeReview = async () => {
    setReviewingCane(true);
    setError('');
    try {
      const res = await apiFetch('/api/resumes/improve-resume', {
        method: 'POST',
        body: JSON.stringify({ resume: buildPayload('draft') })
      });
      if (res.ok) {
        setCaneReview(unwrapData(res.data));
      } else {
        setError(res.error || 'Could not generate CANE resume feedback.');
      }
    } finally {
      setReviewingCane(false);
    }
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[index], next[target]] = [next[target], next[index]];
    setSectionOrder(next);
  };

  const activeAccent = TEMPLATES.find((t) => t.id === template)?.accent || '#1E3A5F';

  return (
    <div className="fixed inset-0 z-50 bg-[#1E3A5F]/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/40 border-b border-[#D8ECFA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#BDE0FE] flex items-center justify-center text-[#3B9EE8] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="font-extrabold text-[#334155] text-sm sm:text-base bg-transparent border-b border-dashed border-[#A2D2FF] outline-none focus:border-[#3B9EE8] w-full max-w-xs"
                aria-label="Resume Version Name"
              />
              <p className="text-[11px] text-[#64748B]">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF7FF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:bg-white"
              aria-label="Close resume builder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="px-4 py-2.5 bg-[#F8FCFF] border-b border-[#EAF7FF] flex gap-1.5 overflow-x-auto">
          {STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(idx)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition ${
                step === idx
                  ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8]'
                  : 'bg-white text-[#64748B] border-[#D8ECFA] hover:text-[#334155]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {loadingPrefill ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              Importing your SETU profile, education, verified skills &amp; projects...
            </div>
          ) : (
            <>
              {/* STEP 1: PERSONAL INFO */}
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'fullName', label: 'Full Name *', placeholder: 'Your full name' },
                    { key: 'email', label: 'Professional Email *', placeholder: 'you@example.com' },
                    { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210' },
                    { key: 'city', label: 'City', placeholder: 'e.g. Gurugram' },
                    { key: 'state', label: 'State', placeholder: 'e.g. Haryana' },
                    { key: 'linkedinUrl', label: 'LinkedIn Profile (Optional)', placeholder: 'https://linkedin.com/in/...' },
                    { key: 'githubUrl', label: 'GitHub Profile (Optional)', placeholder: 'https://github.com/...' },
                    { key: 'portfolioUrl', label: 'Portfolio Website (Optional)', placeholder: 'https://...' }
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-[#334155] mb-1">{f.label}</label>
                      <input
                        type="text"
                        value={personalInfo[f.key] || ''}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, [f.key]: e.target.value })
                        }
                        placeholder={f.placeholder}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 2: CAREER OBJECTIVE */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        What kind of job are you looking for?
                      </label>
                      <input
                        type="text"
                        value={careerObjective.targetRole || ''}
                        onChange={(e) =>
                          setCareerObjective({ ...careerObjective, targetRole: e.target.value })
                        }
                        placeholder="e.g. Junior Data Analyst, UI/UX Intern"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        What are your career interests?
                      </label>
                      <input
                        type="text"
                        value={careerObjective.interests || ''}
                        onChange={(e) =>
                          setCareerObjective({ ...careerObjective, interests: e.target.value })
                        }
                        placeholder="e.g. Analytics, Web Dev, Marketing"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        What are your strongest skills?
                      </label>
                      <input
                        type="text"
                        value={careerObjective.strongestSkills || ''}
                        onChange={(e) =>
                          setCareerObjective({
                            ...careerObjective,
                            strongestSkills: e.target.value
                          })
                        }
                        placeholder="e.g. Python, SQL, Communication"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateSuggestedSummary}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8]" />
                    <span>Generate Suggested Professional Summary</span>
                  </button>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] mb-1">
                      Professional Summary (Editable)
                    </label>
                    <textarea
                      rows={4}
                      value={careerObjective.summary || ''}
                      onChange={(e) =>
                        setCareerObjective({ ...careerObjective, summary: e.target.value })
                      }
                      placeholder="Write or generate a crisp 2-3 sentence career summary..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: EDUCATION */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#334155]">
                      Educational Qualifications ({education.length})
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setEducation([
                          ...education,
                          {
                            qualification: 'Graduate',
                            institution: '',
                            degree: '',
                            specialization: '',
                            startYear: '',
                            graduationYear: '',
                            score: ''
                          }
                        ])
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Qualification</span>
                    </button>
                  </div>

                  {education.map((ed, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#1E3A5F]">
                          Qualification #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                          className="text-[#64748B] hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={ed.degree || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], degree: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="Degree / Class (e.g. B.Tech, Class 12)"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={ed.specialization || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], specialization: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="Specialization / Stream"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={ed.institution || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], institution: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="University / School"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={ed.startYear || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], startYear: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="Start Year (e.g. 2023)"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={ed.graduationYear || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], graduationYear: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="Graduation / Expected Year"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={ed.score || ''}
                          onChange={(e) => {
                            const next = [...education];
                            next[idx] = { ...next[idx], score: e.target.value };
                            setEducation(next);
                          }}
                          placeholder="Percentage or CGPA (e.g. 8.4/10 CGPA)"
                          className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 4: SKILLS */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748B]">
                    Imported from your SETU profile. Verified assessment achievements are clearly
                    distinguished from self-reported skills.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Add a skill (e.g. Python, Canva, Excel)..."
                      className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                    />
                    <select
                      value={newSkillCat}
                      onChange={(e) => setNewSkillCat(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Professional">Professional</option>
                      <option value="Creative">Creative</option>
                      <option value="Tools">Tools</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const clean = newSkillName.trim();
                        if (!clean) return;
                        if (!skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
                          setSkills([
                            ...skills,
                            { name: clean, category: newSkillCat, verified: false }
                          ]);
                        }
                        setNewSkillName('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                    >
                      Add Skill
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                          sk.verified
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155]'
                        }`}
                      >
                        {sk.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>
                          {sk.name}
                          {sk.verified && typeof sk.assessmentScore === 'number'
                            ? ` (${sk.assessmentScore}%)`
                            : ''}
                        </span>
                        <span className="text-[10px] opacity-70">
                          [{sk.verified ? 'Verified' : 'Self-Reported'}]
                        </span>
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                          className="text-[#64748B] hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: PROJECTS */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
                    <span className="text-xs font-bold text-[#334155]">
                      Have you worked on any academic, personal, or practical projects?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasProjects(true)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${
                          hasProjects
                            ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                            : 'bg-white text-[#64748B] border-[#D8ECFA]'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasProjects(false)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${
                          !hasProjects
                            ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                            : 'bg-white text-[#64748B] border-[#D8ECFA]'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {!hasProjects ? (
                    <div className="p-5 rounded-2xl bg-[#EAF7FF]/50 border border-[#BDE0FE] space-y-3">
                      <p className="text-xs font-bold text-[#1E3A5F]">
                        No worries! Here are beginner-friendly project ideas you can complete in SETU
                        Learn &amp; Practice to strengthen your resume:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {BEGINNER_PROJECT_IDEAS.map((idea) => (
                          <div
                            key={idea.title}
                            className="p-3 rounded-xl bg-white border border-[#D8ECFA] text-xs"
                          >
                            <p className="font-bold text-[#334155]">{idea.title}</p>
                            <p className="text-[11px] text-[#64748B] mt-0.5">{idea.hint}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          setProjects([
                            ...projects,
                            {
                              title: '',
                              description: '',
                              technologies: [],
                              projectType: 'Individual',
                              role: '',
                              duration: '',
                              projectLink: '',
                              githubLink: ''
                            }
                          ])
                        }
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>

                      {projects.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#1E3A5F]">
                              Project #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                              className="text-[#64748B] hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={p.title || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="Project Title"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={
                                Array.isArray(p.technologies) ? p.technologies.join(', ') : ''
                              }
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = {
                                  ...next[idx],
                                  technologies: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                };
                                setProjects(next);
                              }}
                              placeholder="Technologies / Tools (comma separated)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <select
                              value={p.projectType || 'Individual'}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], projectType: e.target.value };
                                setProjects(next);
                              }}
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            >
                              <option value="Individual">Individual Project</option>
                              <option value="Team">Team Project</option>
                            </select>
                            <input
                              type="text"
                              value={p.role || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], role: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="Your Role (e.g. Frontend Developer)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={p.duration || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], duration: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="Duration (e.g. Jan – Mar 2026)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="url"
                              value={p.projectLink || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], projectLink: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="Project / Live Link (Optional)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="url"
                              value={p.githubLink || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], githubLink: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="GitHub Link (Optional)"
                              className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-[#334155]">
                                Project Description
                              </label>
                              <button
                                type="button"
                                disabled={improvingIdx === idx}
                                onClick={() => handleImproveProject(idx)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-[#EAF7FF] to-[#FCE7F3] text-[#1E3A5F] border border-[#BDE0FE] text-[11px] font-bold"
                              >
                                <Sparkles className="w-3 h-3 text-[#3B9EE8]" />
                                <span>
                                  {improvingIdx === idx
                                    ? 'Polishing...'
                                    : 'Improve My Project Description'}
                                </span>
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={p.description || ''}
                              onChange={(e) => {
                                const next = [...projects];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setProjects(next);
                              }}
                              placeholder="Describe what you built, what problem it solved, and your contribution..."
                              className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: WORK EXPERIENCE */}
              {step === 5 && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2.5 p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] cursor-pointer text-xs font-bold text-[#334155]">
                    <input
                      type="checkbox"
                      checked={!hasWorkExperience}
                      onChange={(e) => setHasWorkExperience(!e.target.checked)}
                      className="rounded border-[#A2D2FF] text-[#3B9EE8]"
                    />
                    <span>
                      No Work Experience Yet (Creates a clean fresher-friendly resume without
                      inventing work history)
                    </span>
                  </label>

                  {hasWorkExperience && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          setWorkExperience([
                            ...workExperience,
                            {
                              jobTitle: '',
                              companyName: '',
                              employmentType: 'Full-time',
                              startDate: '',
                              endDate: '',
                              responsibilities: '',
                              achievements: ''
                            }
                          ])
                        }
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Experience</span>
                      </button>

                      {workExperience.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#1E3A5F]">
                              Experience #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setWorkExperience(workExperience.filter((_, i) => i !== idx))
                              }
                              className="text-[#64748B] hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={ex.jobTitle || ''}
                              onChange={(e) => {
                                const next = [...workExperience];
                                next[idx] = { ...next[idx], jobTitle: e.target.value };
                                setWorkExperience(next);
                              }}
                              placeholder="Job Title"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={ex.companyName || ''}
                              onChange={(e) => {
                                const next = [...workExperience];
                                next[idx] = { ...next[idx], companyName: e.target.value };
                                setWorkExperience(next);
                              }}
                              placeholder="Company / Organization"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={ex.startDate || ''}
                              onChange={(e) => {
                                const next = [...workExperience];
                                next[idx] = { ...next[idx], startDate: e.target.value };
                                setWorkExperience(next);
                              }}
                              placeholder="Start Date (e.g. Jun 2025)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                            <input
                              type="text"
                              value={ex.endDate || ''}
                              onChange={(e) => {
                                const next = [...workExperience];
                                next[idx] = { ...next[idx], endDate: e.target.value };
                                setWorkExperience(next);
                              }}
                              placeholder="End Date (or Present)"
                              className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={ex.responsibilities || ''}
                            onChange={(e) => {
                              const next = [...workExperience];
                              next[idx] = { ...next[idx], responsibilities: e.target.value };
                              setWorkExperience(next);
                            }}
                            placeholder="Key responsibilities..."
                            className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                          />
                          <input
                            type="text"
                            value={ex.achievements || ''}
                            onChange={(e) => {
                              const next = [...workExperience];
                              next[idx] = { ...next[idx], achievements: e.target.value };
                              setWorkExperience(next);
                            }}
                            placeholder="Measurable achievements (Optional)"
                            className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 7: CERTIFICATIONS & ACHIEVEMENTS */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#334155]">
                      Certifications ({certifications.length})
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setCertifications([
                          ...certifications,
                          { name: '', organization: '', completionDate: '', certificateLink: '' }
                        ])
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Certification</span>
                    </button>
                  </div>

                  {certifications.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                    >
                      <input
                        type="text"
                        value={c.name || ''}
                        onChange={(e) => {
                          const next = [...certifications];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setCertifications(next);
                        }}
                        placeholder="Certification Name"
                        className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={c.organization || ''}
                        onChange={(e) => {
                          const next = [...certifications];
                          next[idx] = { ...next[idx], organization: e.target.value };
                          setCertifications(next);
                        }}
                        placeholder="Issuing Organization (e.g. NPTEL, PMKVY)"
                        className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={c.completionDate || ''}
                        onChange={(e) => {
                          const next = [...certifications];
                          next[idx] = { ...next[idx], completionDate: e.target.value };
                          setCertifications(next);
                        }}
                        placeholder="Completion Date (e.g. Feb 2026)"
                        className="px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={c.certificateLink || ''}
                          onChange={(e) => {
                            const next = [...certifications];
                            next[idx] = { ...next[idx], certificateLink: e.target.value };
                            setCertifications(next);
                          }}
                          placeholder="Certificate URL (Optional)"
                          className="flex-1 px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCertifications(certifications.filter((_, i) => i !== idx))
                          }
                          className="p-2 text-[#64748B] hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        Awards, Hackathons &amp; Competitions (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={awardsText}
                        onChange={(e) => setAwardsText(e.target.value)}
                        placeholder="e.g. Build Her Bharat 2026 Finalist"
                        className="w-full px-3 py-2 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        Volunteering Experience (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={volunteeringText}
                        onChange={(e) => setVolunteeringText(e.target.value)}
                        placeholder="e.g. Digital Literacy Volunteer — Local Youth Center"
                        className="w-full px-3 py-2 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: TEMPLATES */}
              {step === 7 && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748B]">
                    Select a clean, selectable-text resume layout. All 4 templates generate real
                    ATS-readable PDF and editable DOCX files.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTemplate(t.id)}
                        className={`p-5 rounded-3xl border text-left transition space-y-2 ${
                          template === t.id
                            ? 'bg-[#EAF7FF] border-[#3B9EE8] shadow-baby-sm'
                            : 'bg-white border-[#D8ECFA] hover:border-[#A2D2FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: t.accent }}
                          />
                          {template === t.id && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1E3A5F] border border-[#BDE0FE]">
                              Selected ✓
                            </span>
                          )}
                        </div>
                        <p className="font-extrabold text-sm text-[#334155]">{t.name}</p>
                        <p className="text-xs text-[#64748B]">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 9: LIVE PREVIEW, SECTION REORDER, CANE IMPROVE & DOWNLOAD */}
              {step === 8 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Controls */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2.5">
                      <p className="text-xs font-bold text-[#334155]">Rearrange Resume Sections</p>
                      {sectionOrder.map((sec, idx) => (
                        <div
                          key={sec}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#D8ECFA] text-xs"
                        >
                          <span className="font-semibold capitalize">{sec}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, -1)}
                              className="p-1 rounded hover:bg-[#EAF7FF] disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sectionOrder.length - 1}
                              onClick={() => moveSection(idx, 1)}
                              className="p-1 rounded hover:bg-[#EAF7FF] disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-[#334155] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="rounded border-[#A2D2FF]"
                        />
                        <span>Set as my Default Resume</span>
                      </label>
                    </div>

                    {/* Improve with CANE */}
                    <button
                      type="button"
                      disabled={reviewingCane}
                      onClick={handleCaneResumeReview}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#EAF7FF] via-[#D6EEFF] to-[#FCE7F3] hover:opacity-95 text-[#1E3A5F] border border-[#BDE0FE] text-xs font-extrabold flex items-center justify-center gap-2 shadow-baby-sm"
                    >
                      <Sparkles className="w-4 h-4 text-[#3B9EE8]" />
                      <span>
                        {reviewingCane ? 'CANE is Reviewing...' : 'Improve My Resume with CANE'}
                      </span>
                    </button>

                    {caneReview && (
                      <div className="p-4 rounded-2xl bg-white border border-[#BDE0FE] space-y-2.5 text-xs">
                        <p className="font-extrabold text-[#1E3A5F]">CANE Resume Feedback</p>
                        {caneReview.missingSections?.length > 0 && (
                          <div>
                            <p className="font-bold text-rose-700">Missing / Light Sections:</p>
                            <ul className="list-disc pl-4 text-[#475569]">
                              {caneReview.missingSections.map((m: string, i: number) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {caneReview.suggestions?.length > 0 && (
                          <div>
                            <p className="font-bold text-[#2589D6]">ATS Suggestions:</p>
                            <ul className="list-disc pl-4 text-[#475569]">
                              {caneReview.suggestions.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {caneReview.aiFeedback && (
                          <div className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] whitespace-pre-line text-[#334155]">
                            {caneReview.aiFeedback}
                          </div>
                        )}
                        <p className="text-[10px] text-[#64748B]">{caneReview.poweredBy}</p>
                      </div>
                    )}

                    {/* Download PDF / DOCX */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDownload('pdf')}
                        className="py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm inline-flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleDownload('docx')}
                        className="py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download DOCX</span>
                      </button>
                    </div>
                  </div>

                  {/* Live A4 Resume Preview */}
                  <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white border border-[#D8ECFA] shadow-baby space-y-4 text-xs text-[#1E293B]">
                    <div
                      className={`pb-3 border-b-2 ${
                        template === 'modern_minimal' ? 'text-left' : 'text-center'
                      }`}
                      style={{ borderColor: activeAccent }}
                    >
                      <h2
                        className="text-xl font-extrabold"
                        style={{ color: activeAccent }}
                      >
                        {personalInfo.fullName || 'Your Name'}
                      </h2>
                      <p className="text-[11px] text-[#475569] mt-1">
                        {[
                          personalInfo.email,
                          personalInfo.phone,
                          [personalInfo.city, personalInfo.state].filter(Boolean).join(', ')
                        ]
                          .filter(Boolean)
                          .join('  •  ')}
                      </p>
                      {(personalInfo.linkedinUrl ||
                        personalInfo.githubUrl ||
                        personalInfo.portfolioUrl) && (
                        <p className="text-[10px] text-[#2589D6] mt-0.5 break-all">
                          {[
                            personalInfo.linkedinUrl,
                            personalInfo.githubUrl,
                            personalInfo.portfolioUrl
                          ]
                            .filter(Boolean)
                            .join('  |  ')}
                        </p>
                      )}
                    </div>

                    {sectionOrder.map((sec) => {
                      if (sec === 'summary' && careerObjective.summary?.trim()) {
                        return (
                          <div key={sec} className="space-y-1">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Professional Summary
                            </h3>
                            <p className="leading-relaxed">{careerObjective.summary}</p>
                          </div>
                        );
                      }
                      if (sec === 'education' && education.length > 0) {
                        return (
                          <div key={sec} className="space-y-1.5">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Education
                            </h3>
                            {education.map((ed, i) => (
                              <div key={i}>
                                <p className="font-bold">
                                  {[ed.degree || ed.qualification, ed.specialization]
                                    .filter(Boolean)
                                    .join(' — ')}
                                </p>
                                <p className="text-[11px] text-[#475569]">
                                  {[
                                    ed.institution,
                                    [ed.startYear, ed.graduationYear].filter(Boolean).join('–'),
                                    ed.score
                                  ]
                                    .filter(Boolean)
                                    .join(' | ')}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (sec === 'skills' && skills.length > 0) {
                        const verified = skills.filter((s) => s.verified);
                        const selfRep = skills.filter((s) => !s.verified);
                        return (
                          <div key={sec} className="space-y-1">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Skills
                            </h3>
                            {verified.length > 0 && (
                              <p>
                                <strong>SETU Assessment-Verified:</strong>{' '}
                                {verified
                                  .map((s) =>
                                    typeof s.assessmentScore === 'number'
                                      ? `${s.name} (${s.assessmentScore}%)`
                                      : s.name
                                  )
                                  .join(', ')}
                              </p>
                            )}
                            {selfRep.length > 0 && (
                              <p>
                                <strong>Additional Skills:</strong>{' '}
                                {selfRep.map((s) => s.name).join(', ')}
                              </p>
                            )}
                          </div>
                        );
                      }
                      if (sec === 'projects' && hasProjects && projects.length > 0) {
                        return (
                          <div key={sec} className="space-y-2">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Projects
                            </h3>
                            {projects.map((p, i) => (
                              <div key={i}>
                                <p className="font-bold">
                                  {p.title}{' '}
                                  {p.role || p.duration ? (
                                    <span className="font-normal text-[#475569]">
                                      ({[p.role, p.projectType, p.duration].filter(Boolean).join(' | ')})
                                    </span>
                                  ) : null}
                                </p>
                                <p className="text-[#334155]">{p.description}</p>
                                {p.technologies?.length > 0 && (
                                  <p className="text-[10px] text-[#64748B]">
                                    Tech: {p.technologies.join(', ')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (sec === 'experience' && hasWorkExperience && workExperience.length > 0) {
                        return (
                          <div key={sec} className="space-y-2">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Work Experience
                            </h3>
                            {workExperience.map((ex, i) => (
                              <div key={i}>
                                <p className="font-bold">
                                  {ex.jobTitle} — {ex.companyName}{' '}
                                  <span className="font-normal text-[#475569]">
                                    ({[ex.startDate, ex.endDate].filter(Boolean).join(' – ')})
                                  </span>
                                </p>
                                <p>{ex.responsibilities}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      if (
                        sec === 'certifications' &&
                        (certifications.length > 0 || awardsText.trim() || volunteeringText.trim())
                      ) {
                        return (
                          <div key={sec} className="space-y-1">
                            <h3
                              className="text-[11px] font-extrabold uppercase tracking-wider border-b pb-0.5"
                              style={{ color: activeAccent, borderColor: '#E2E8F0' }}
                            >
                              Certifications &amp; Achievements
                            </h3>
                            {certifications.map((c, i) => (
                              <p key={i}>
                                • {[c.name, c.organization, c.completionDate].filter(Boolean).join(' — ')}
                              </p>
                            ))}
                            {awardsText
                              .split('\n')
                              .filter((l) => l.trim())
                              .map((a, i) => (
                                <p key={`aw-${i}`}>• Award: {a.trim()}</p>
                              ))}
                            {volunteeringText
                              .split('\n')
                              .filter((l) => l.trim())
                              .map((v, i) => (
                                <p key={`vol-${i}`}>• Volunteering: {v.trim()}</p>
                              ))}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Nav */}
        <div className="p-4 border-t border-[#EAF7FF] bg-[#F8FCFF] flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-bold text-[#334155] disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('ready')}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Final Resume'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
