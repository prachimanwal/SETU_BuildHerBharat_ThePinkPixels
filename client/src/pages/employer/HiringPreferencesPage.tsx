import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Briefcase,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch, extractArray } from '../../utils/api';

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Freelance',
  'Contract',
  'Remote'
] as const;

export const HiringPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('General');
  const [vacancies, setVacancies] = useState(1);
  const [requiredEducation, setRequiredEducation] = useState('Any Graduate / Relevant Skills');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('0-2 Years');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [jobLocation, setJobLocation] = useState('Pan-India');
  const [employmentType, setEmploymentType] = useState<(typeof EMPLOYMENT_TYPES)[number]>('Full-time');
  const [workArrangement, setWorkArrangement] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [preferredJoiningDate, setPreferredJoiningDate] = useState('');
  const [requiredCertifications, setRequiredCertifications] = useState('');
  const [interviewProcess, setInterviewProcess] = useState(
    'Application Review -> Skill Round -> Final HR Discussion'
  );

  const load = async () => {
    const res = await apiFetch('/api/employer/hiring-preferences');
    if (res.ok) setPrefs(extractArray(res.data));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    const res = await apiFetch('/api/employer/hiring-preferences', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle,
        department,
        vacancies: Number(vacancies) || 1,
        requiredEducation,
        requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceLevel,
        minSalary: minSalary ? Number(minSalary) : null,
        maxSalary: maxSalary ? Number(maxSalary) : null,
        jobLocation,
        employmentType,
        workArrangement,
        preferredJoiningDate,
        requiredCertifications: requiredCertifications.split(',').map((s) => s.trim()).filter(Boolean),
        interviewProcess
      })
    });

    setSaving(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Could not save hiring preference.' });
      return;
    }

    setJobTitle('');
    setRequiredSkills('');
    setMinSalary('');
    setMaxSalary('');
    setRequiredCertifications('');
    setNotice({ type: 'success', text: 'Hiring preference saved to MongoDB!' });
    await load();
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/employer/hiring-preferences/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotice({ type: 'success', text: 'Hiring preference removed.' });
      await load();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
        <h1 className="text-xl font-bold text-[#1E3A5F]">Hiring Preferences</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Save multiple hiring profiles for roles you regularly recruit for. Convert any saved preference into a job posting in one click.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4"
      >
        <h2 className="text-sm font-bold text-[#1E3A5F]">Add New Hiring Preference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <input
            type="text"
            required
            placeholder="Job Title *"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="number"
            min={1}
            placeholder="Vacancies"
            value={vacancies}
            onChange={(e) => setVacancies(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={workArrangement}
            onChange={(e) => setWorkArrangement(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          >
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
          <input
            type="text"
            placeholder="Job Location"
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Required Education"
            value={requiredEducation}
            onChange={(e) => setRequiredEducation(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Experience Level"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="date"
            value={preferredJoiningDate}
            onChange={(e) => setPreferredJoiningDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder="Min Salary (₹)"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="number"
            min={0}
            placeholder="Max Salary (₹)"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Required Skills (comma separated)"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Certifications (optional)"
            value={requiredCertifications}
            onChange={(e) => setRequiredCertifications(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
          <input
            type="text"
            placeholder="Interview Process"
            value={interviewProcess}
            onChange={(e) => setInterviewProcess(e.target.value)}
            className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Hiring Preference'}</span>
        </button>
      </form>

      {loading ? (
        <p className="text-center text-xs text-[#64748B] py-10">Loading saved preferences...</p>
      ) : prefs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-2">
          <SlidersHorizontal className="w-9 h-9 text-[#94A3B8] mx-auto" />
          <p className="text-sm font-bold text-[#1E3A5F]">No hiring preferences saved yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prefs.map((p) => (
            <div key={p._id} className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#1E3A5F]">{p.jobTitle}</h3>
                  <p className="text-xs text-[#64748B]">
                    {p.department} • {p.vacancies} vacancy(s) • {p.employmentType} ({p.workArrangement})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(p._id)}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-[#475569] space-y-1">
                <p><strong>Location:</strong> {p.jobLocation}</p>
                <p><strong>Education / Exp:</strong> {p.requiredEducation} • {p.experienceLevel}</p>
                {(p.minSalary || p.maxSalary) && (
                  <p>
                    <strong>Salary Range:</strong> ₹{p.minSalary?.toLocaleString('en-IN') || '0'} – ₹
                    {p.maxSalary?.toLocaleString('en-IN') || 'Negotiable'}
                  </p>
                )}
                <p><strong>Interview Process:</strong> {p.interviewProcess}</p>
              </div>
              {p.requiredSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.requiredSkills.map((sk: string, i: number) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/employer/jobs', { state: { fromPreference: p } })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE] hover:bg-[#D6EEFF]"
              >
                <Briefcase className="w-3.5 h-3.5" /> Create Job From Preference
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
