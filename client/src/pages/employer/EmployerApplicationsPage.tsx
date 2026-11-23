import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CalendarClock,
  FileText,
  FolderGit2,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';
import { apiFetch, extractArray } from '../../utils/api';

const STAGES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Sent',
  'Hired',
  'Rejected',
  'Withdrawn'
];

export const EmployerApplicationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobFilter, setJobFilter] = useState(searchParams.get('jobId') || 'all');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected application detail modal
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState('Under Review');
  const [candidateMessage, setCandidateMessage] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        apiFetch(
          `/api/employer/applicants?opportunityId=${encodeURIComponent(
            jobFilter
          )}&status=${encodeURIComponent(stageFilter)}`
        ),
        apiFetch('/api/employer/opportunities')
      ]);

      if (appsRes.ok) setApplications(extractArray(appsRes.data));
      if (jobsRes.ok) setJobs(extractArray(jobsRes.data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobFilter, stageFilter]);

  const openAppModal = (app: any) => {
    setSelectedApp(app);
    setNextStatus(app.status || 'Under Review');
    setCandidateMessage(app.candidateUpdateMessage || '');
    setPrivateNote('');
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSaving(true);
    setNotice(null);

    const res = await apiFetch(`/api/employer/applicants/${selectedApp._id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: nextStatus,
        candidateMessage,
        recruiterNote: privateNote
      })
    });

    setSaving(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Could not update application.' });
      return;
    }

    setNotice({ type: 'success', text: `Application moved to "${nextStatus}" and candidate notified.` });
    setSelectedApp(null);
    await load();
  };

  const handleQuickAddNote = async () => {
    if (!selectedApp || !privateNote.trim()) return;
    setSaving(true);
    const res = await apiFetch(`/api/employer/applicants/${selectedApp._id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note: privateNote.trim() })
    });
    setSaving(false);
    if (res.ok) {
      setPrivateNote('');
      await load();
      setNotice({ type: 'success', text: 'Private recruiter note saved.' });
      setSelectedApp(null);
    }
  };

  const getStageBadge = (st: string) => {
    switch (st) {
      case 'Hired':
      case 'Selected':
        return 'bg-emerald-600 text-white border-emerald-600';
      case 'Offer Sent':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Interview Scheduled':
      case 'Interview Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Shortlisted':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Rejected':
      case 'Withdrawn':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-[#EAF7FF] text-[#1E3A5F] border-[#BDE0FE]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Application Tracking System</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Review applicants, inspect resumes & portfolios, record private recruiter notes, and send transparent status updates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs font-medium"
          >
            <option value="all">All Job Positions</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>{j.title}</option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs font-medium"
          >
            <option value="all">All Pipeline Stages</option>
            {STAGES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
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

      {loading ? (
        <div className="py-16 text-center text-[#64748B]">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#1E3A5F]">No applications matching these filters</h3>
          <p className="text-xs text-[#64748B]">
            Applications submitted by candidates to your published jobs (or shortlisted candidates) appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const seeker = app.seekerId || {};
            const opp = app.opportunityId || {};
            const skills = seeker.seekerProfile?.skills || [];
            return (
              <div
                key={app._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#1E3A5F]">{seeker.name || 'Candidate'}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStageBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Applied for <strong className="text-[#1E3A5F]">{opp.title || 'Vacancy'}</strong> •{' '}
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B]">
                    <span className="inline-flex items-center gap-1">
                      <FolderGit2 className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {app.candidatePortfolios?.length || 0} Portfolio(s)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {app.candidateResume || app.candidateUploadedResume ? 'Resume Available' : 'Profile Only'}
                    </span>
                    {app.recruiterNotes?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Lock className="w-3 h-3" /> {app.recruiterNotes.length} Private Note(s)
                      </span>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {skills.slice(0, 6).map((sk: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-[#F8FCFF] border border-[#D8ECFA] text-[10px] text-[#1E3A5F]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAppModal(app)}
                    className="px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE] hover:bg-[#D6EEFF]"
                  >
                    Review & Update Stage
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/employer/interviews', {
                        state: {
                          scheduleFor: {
                            applicationId: app._id,
                            opportunityId: opp._id,
                            candidateId: seeker._id,
                            candidateName: seeker.name,
                            jobTitle: opp.title
                          }
                        }
                      })
                    }
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-[#3B9EE8] text-white text-xs font-bold hover:bg-[#2589D6]"
                  >
                    <CalendarClock className="w-3.5 h-3.5" /> Schedule Interview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail & Stage Update Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D8ECFA] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF7FF] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A5F]">{selectedApp.seekerId?.name}</h2>
                <p className="text-xs text-[#64748B]">
                  {selectedApp.opportunityId?.title} • {selectedApp.seekerId?.email}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedApp(null)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {selectedApp.coverNote && (
              <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs text-[#334155]">
                <p className="font-bold text-[#1E3A5F] mb-1">Candidate Cover Note</p>
                <p>{selectedApp.coverNote}</p>
              </div>
            )}

            {/* Resume & Portfolio Inspection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
                <p className="font-bold text-[#1E3A5F] mb-1">Resume Summary</p>
                {selectedApp.candidateResume ? (
                  <p className="text-[#475569]">
                    {selectedApp.candidateResume.summary || 'SETU Resume available'}
                  </p>
                ) : selectedApp.candidateUploadedResume ? (
                  <p className="text-[#475569]">
                    Uploaded: {selectedApp.candidateUploadedResume.originalFilename}
                  </p>
                ) : (
                  <p className="text-[#64748B]">No separate resume file submitted.</p>
                )}
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
                <p className="font-bold text-[#1E3A5F] mb-1">
                  Portfolio Projects ({selectedApp.candidatePortfolios?.length || 0})
                </p>
                {selectedApp.candidatePortfolios?.length > 0 ? (
                  <ul className="space-y-1 text-[#475569]">
                    {selectedApp.candidatePortfolios.slice(0, 3).map((p: any) => (
                      <li key={p._id}>• {p.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#64748B]">No portfolio projects linked.</p>
                )}
              </div>
            </div>

            {/* Existing Private Recruiter Notes */}
            {selectedApp.recruiterNotes?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> Private Recruiter Notes (Hidden from Candidate)
                </p>
                {selectedApp.recruiterNotes.map((rn: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                    <p>{rn.note}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      {rn.authorName} • {new Date(rn.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleUpdateStage} className="space-y-4 pt-2 border-t border-[#EAF7FF]">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Update Application Stage</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm font-medium"
                >
                  {STAGES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Candidate Status Update Message (Visible to Candidate)
                </label>
                <textarea
                  rows={2}
                  value={candidateMessage}
                  onChange={(e) => setCandidateMessage(e.target.value)}
                  placeholder="Optional friendly message shown in the candidate's SETU dashboard..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Add Private Recruiter Note (Internal Only)
                </label>
                <textarea
                  rows={2}
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="Internal evaluation note (never visible to the candidate)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {privateNote.trim() && (
                  <button
                    type="button"
                    onClick={handleQuickAddNote}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" /> Save Note Only
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold"
                >
                  {saving ? 'Updating...' : 'Save Status & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
