import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  ShieldAlert,
  AlertCircle,
  X
} from 'lucide-react';
import { apiFetch, extractArray, formatLocation, unwrapData } from '../../utils/api';

const EMPLOYMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'entry_level', label: 'Entry-Level' }
];

export const EmployerJobsPage: React.FC = () => {
  const routerLocation = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [isVerified, setIsVerified] = useState(false);
  const [verificationLabel, setVerificationLabel] = useState('Pending');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed' | 'archived'>('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Job Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [experienceRequired, setExperienceRequired] = useState('0-2 Years / Fresher Friendly');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [stipendOrSalary, setStipendOrSalary] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [opportunityType, setOpportunityType] = useState('full_time');
  const [workMode, setWorkMode] = useState<'remote' | 'hybrid' | 'onsite'>('hybrid');
  const [vacancies, setVacancies] = useState(1);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [screeningQuestions, setScreeningQuestions] = useState('');
  const [isCareerRestart, setIsCareerRestart] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    try {
      const [compRes, jobsRes, appsRes] = await Promise.all([
        apiFetch('/api/employer/company'),
        apiFetch('/api/employer/opportunities'),
        apiFetch('/api/employer/applicants')
      ]);

      if (compRes.ok && compRes.data) {
        const c = unwrapData(compRes.data);
        setIsVerified(Boolean(c?.isVerified));
        setVerificationLabel(c?.verificationLabel || 'Pending');
      }
      if (jobsRes.ok) {
        setJobs(extractArray(jobsRes.data, ['results']));
      }
      if (appsRes.ok) {
        const apps = extractArray(appsRes.data, ['results']);
        const counts: Record<string, number> = {};
        apps.forEach((a: any) => {
          const oid = a.opportunityId?._id || a.opportunityId;
          if (oid) counts[oid] = (counts[oid] || 0) + 1;
        });
        setAppCounts(counts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Pre-fill modal if navigated from Hiring Preferences ("Create Job from Preference")
  useEffect(() => {
    const prefill = (routerLocation.state as any)?.fromPreference;
    if (prefill && !loading) {
      setEditingJob(null);
      setTitle(prefill.jobTitle || '');
      setDepartment(prefill.department || 'General');
      setRequiredSkills((prefill.requiredSkills || []).join(', '));
      setExperienceRequired(prefill.experienceLevel || 'Fresher Friendly');
      setQualifications(prefill.requiredEducation || '');
      setSalaryMin(prefill.minSalary ? String(prefill.minSalary) : '');
      setSalaryMax(prefill.maxSalary ? String(prefill.maxSalary) : '');
      setVacancies(prefill.vacancies || 1);
      const locParts = String(prefill.jobLocation || 'Pan-India, India').split(',');
      setCity(locParts[0]?.trim() || 'Pan-India');
      setStateName(locParts[1]?.trim() || 'India');
      setWorkMode(
        prefill.workArrangement === 'Remote'
          ? 'remote'
          : prefill.workArrangement === 'On-site'
          ? 'onsite'
          : 'hybrid'
      );
      setDescription(
        `We are hiring for ${prefill.jobTitle} in our ${prefill.department || 'General'} team. Interview process: ${prefill.interviewProcess || 'Structured skill review'}.`
      );
      setModalOpen(true);
    }
  }, [routerLocation.state, loading]);

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setDepartment('General');
    setDescription('');
    setResponsibilities('');
    setQualifications('');
    setRequiredSkills('');
    setExperienceRequired('0-2 Years / Fresher Friendly');
    setSalaryMin('');
    setSalaryMax('');
    setStipendOrSalary('');
    setCity('Bengaluru');
    setStateName('Karnataka');
    setOpportunityType('full_time');
    setWorkMode('hybrid');
    setVacancies(1);
    setApplicationDeadline('');
    setScreeningQuestions('');
    setIsCareerRestart(true);
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (job: any) => {
    setEditingJob(job);
    setTitle(job.title || '');
    setDepartment(job.department || 'General');
    setDescription(job.description || '');
    setResponsibilities((job.responsibilities || []).join('\n'));
    setQualifications((job.qualifications || []).join('\n'));
    setRequiredSkills((job.requiredSkills || []).join(', '));
    setExperienceRequired(job.experienceRequired || '');
    setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : '');
    setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : '');
    setStipendOrSalary(job.stipendOrSalary || '');
    setCity(job.location?.city || 'Pan-India');
    setStateName(job.location?.state || 'India');
    setOpportunityType(job.opportunityType || 'full_time');
    setWorkMode(job.workMode || 'hybrid');
    setVacancies(job.vacancies || 1);
    setApplicationDeadline(job.applicationDeadline || '');
    setScreeningQuestions((job.screeningQuestions || []).join('\n'));
    setIsCareerRestart(Boolean(job.isCareerRestart));
    setModalError('');
    setModalOpen(true);
  };

  const submitJob = async (targetStatus: 'draft' | 'published') => {
    setModalError('');
    if (targetStatus === 'published' && !isVerified) {
      setModalError(
        'Only verified employers can publish live jobs. Click "Save as Draft" until SETU administrators approve your company verification.'
      );
      return;
    }

    const skillsArr = requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillsArr.length === 0) {
      setModalError('Please specify at least one required skill.');
      return;
    }

    const minNum = salaryMin ? Number(salaryMin) : null;
    const maxNum = salaryMax ? Number(salaryMax) : null;
    if (minNum !== null && maxNum !== null && minNum > maxNum) {
      setModalError('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      department: department.trim() || 'General',
      description: description.trim(),
      responsibilities: responsibilities
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      qualifications: qualifications
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      requiredSkills: skillsArr,
      experienceRequired: experienceRequired.trim(),
      salaryMin: minNum,
      salaryMax: maxNum,
      stipendOrSalary:
        stipendOrSalary.trim() ||
        (minNum && maxNum
          ? `₹${minNum.toLocaleString('en-IN')} - ₹${maxNum.toLocaleString('en-IN')}`
          : 'Competitive'),
      location: {
        city: city.trim() || 'Pan-India',
        state: stateName.trim() || 'India',
        isRuralFocus: false
      },
      opportunityType,
      workMode,
      vacancies: Number(vacancies) || 1,
      applicationDeadline,
      screeningQuestions: screeningQuestions
        .split('\n')
        .map((q) => q.trim())
        .filter(Boolean),
      isCareerRestart,
      status: targetStatus
    };

    const res = editingJob
      ? await apiFetch(`/api/employer/opportunities/${editingJob._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      : await apiFetch('/api/employer/opportunities', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

    setSaving(false);
    if (!res.ok) {
      setModalError(res.error || 'Could not save job posting.');
      return;
    }

    setModalOpen(false);
    setNotice({
      type: 'success',
      text:
        targetStatus === 'published'
          ? 'Job opportunity published live on SETU!'
          : 'Job vacancy saved as draft.'
    });
    await load();
  };

  const changeJobStatus = async (job: any, nextStatus: 'published' | 'closed' | 'archived' | 'draft') => {
    setNotice(null);
    const res = await apiFetch(`/api/employer/opportunities/${job._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    });
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Failed to update job status.' });
      return;
    }
    setNotice({ type: 'success', text: `"${job.title}" moved to ${nextStatus}.` });
    await load();
  };

  const filteredJobs = jobs.filter((j) =>
    statusFilter === 'all' ? true : j.status === statusFilter
  );

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'draft':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading job postings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Job Management</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, edit, publish, close, reopen, and archive genuine vacancies with screening questions.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isVerified ? 'Create Job Posting' : 'Create Job Draft'}</span>
        </button>
      </div>

      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Verification Required to Publish ({verificationLabel}):</strong> Unverified companies can create and save drafts, but publishing live requires SETU admin verification.
            </span>
          </div>
          <Link to="/employer/verification" className="font-bold underline shrink-0">
            Verify Now
          </Link>
        </div>
      )}

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

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'published', 'draft', 'closed', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border transition ${
              statusFilter === tab
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                : 'bg-white text-[#64748B] border-[#D8ECFA] hover:bg-[#EAF7FF]'
            }`}
          >
            {tab} ({tab === 'all' ? jobs.length : jobs.filter((j) => j.status === tab).length})
          </button>
        ))}
      </div>

      {/* Job Cards */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#1E3A5F]">No job postings in this view</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Create your first vacancy draft or publish a role once verified to start receiving applications from skilled SETU candidates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-5 sm:p-6 shadow-baby-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#1E3A5F]">{job.title}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${getStatusPill(job.status)}`}>
                      {job.status}
                    </span>
                    {job.department && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF7FF] text-[#1E3A5F]">
                        {job.department}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    {formatLocation(job.location)} • {job.workMode} • {job.opportunityType.replace('_', ' ')} •{' '}
                    {job.vacancies || 1} vacancy(s) • {job.stipendOrSalary}
                    {job.applicationDeadline ? ` • Deadline: ${job.applicationDeadline}` : ''}
                  </p>
                </div>

                <Link
                  to={`/employer/applications?jobId=${job._id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE] hover:bg-[#D6EEFF] self-start"
                >
                  <Users className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  <span>{appCounts[job._id] || 0} Applications</span>
                </Link>
              </div>

              <p className="text-xs text-[#475569] line-clamp-2">{job.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {(job.requiredSkills || []).map((sk: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#F8FCFF] border border-[#D8ECFA] text-[11px] font-medium text-[#1E3A5F]">
                    {sk}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAF7FF]">
                <button
                  type="button"
                  onClick={() => openEditModal(job)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                {job.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => changeJobStatus(job, 'published')}
                    disabled={!isVerified}
                    title={!isVerified ? 'Verify company first to publish live' : 'Publish job'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-45"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish Live
                  </button>
                )}
                {job.status === 'published' && (
                  <button
                    type="button"
                    onClick={() => changeJobStatus(job, 'closed')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Close Vacancy
                  </button>
                )}
                {(job.status === 'closed' || job.status === 'archived') && (
                  <button
                    type="button"
                    onClick={() => changeJobStatus(job, isVerified ? 'published' : 'draft')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {isVerified ? 'Reopen' : 'Move to Draft'}
                  </button>
                )}
                {job.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => changeJobStatus(job, 'archived')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D8ECFA] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#EAF7FF] pb-3">
              <h2 className="text-lg font-bold text-[#1E3A5F]">
                {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl hover:bg-[#EAF7FF]">
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Junior Data Analyst"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Analytics, Engineering, Operations"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Employment Type</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                >
                  {EMPLOYMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Work Arrangement</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">State *</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Minimum Salary (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g., 300000"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Maximum Salary (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="e.g., 550000"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Display Salary / Stipend Label</label>
                <input
                  type="text"
                  value={stipendOrSalary}
                  onChange={(e) => setStipendOrSalary(e.target.value)}
                  placeholder="e.g., ₹3.5 - ₹5.5 LPA"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Experience Required</label>
                <input
                  type="text"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Number of Vacancies</label>
                <input
                  type="number"
                  min={1}
                  value={vacancies}
                  onChange={(e) => setVacancies(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">Required Skills (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="e.g., Excel, SQL, Data Visualization, Communication"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clear overview of the role, team, and impact..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Key Responsibilities (one per line)</label>
                <textarea
                  rows={3}
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="Analyze weekly operations metrics&#10;Collaborate with product team"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Required Qualifications (one per line)</label>
                <textarea
                  rows={3}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="Bachelor's degree or equivalent skill proof&#10;Strong analytical thinking"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">Screening Questions (one per line, optional)</label>
                <textarea
                  rows={2}
                  value={screeningQuestions}
                  onChange={(e) => setScreeningQuestions(e.target.value)}
                  placeholder="Share a link or summary of a project you are proud of.&#10;What is your earliest joining availability?"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#334155]">
              <input
                type="checkbox"
                checked={isCareerRestart}
                onChange={(e) => setIsCareerRestart(e.target.checked)}
              />
              <span>Welcome career-restart & returnee applicants (Build Her inclusive role)</span>
            </label>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#EAF7FF]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-2xl border border-[#D8ECFA] text-xs font-semibold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => submitJob('draft')}
                className="px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE] hover:bg-[#D6EEFF]"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                disabled={saving || !isVerified}
                onClick={() => submitJob('published')}
                className="px-5 py-2 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold disabled:opacity-45"
              >
                {saving ? 'Publishing...' : 'Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
