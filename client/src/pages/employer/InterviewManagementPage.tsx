import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarClock,
  List,
  Calendar,
  Plus,
  Video,
  MapPin,
  Phone,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { apiFetch, extractArray } from '../../utils/api';

const MODES = ['Online', 'Offline', 'Telephone'] as const;
const STATUSES = ['Scheduled', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'] as const;

export const InterviewManagementPage: React.FC = () => {
  const routerLoc = useLocation();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Schedule / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [applicationId, setApplicationId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [mode, setMode] = useState<(typeof MODES)[number]>('Online');
  const [meetingLinkOrLocation, setMeetingLinkOrLocation] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('Scheduled');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [ivRes, appsRes, jobsRes] = await Promise.all([
        apiFetch('/api/employer/interviews'),
        apiFetch('/api/employer/applicants'),
        apiFetch('/api/employer/opportunities')
      ]);
      if (ivRes.ok) setInterviews(extractArray(ivRes.data));
      if (appsRes.ok) setApplicants(extractArray(appsRes.data));
      if (jobsRes.ok) setJobs(extractArray(jobsRes.data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Pre-open modal if navigated from Applications page
  useEffect(() => {
    const preset = (routerLoc.state as any)?.scheduleFor;
    if (preset && !loading) {
      setEditing(null);
      setApplicationId(preset.applicationId || '');
      setOpportunityId(preset.opportunityId || '');
      setCandidateId(preset.candidateId || '');
      setMode('Online');
      setStatus('Scheduled');
      setModalOpen(true);
    }
  }, [routerLoc.state, loading]);

  const openNewModal = () => {
    setEditing(null);
    setApplicationId('');
    setOpportunityId(jobs[0]?._id || '');
    setCandidateId(applicants[0]?.seekerId?._id || '');
    setScheduledDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setScheduledTime('11:00');
    setDurationMinutes(45);
    setMode('Online');
    setMeetingLinkOrLocation('');
    setInterviewerName('');
    setInterviewerEmail('');
    setNotes('');
    setFeedback('');
    setRating('');
    setStatus('Scheduled');
    setModalOpen(true);
  };

  const openEditModal = (iv: any) => {
    setEditing(iv);
    setApplicationId(iv.applicationId?._id || iv.applicationId || '');
    setOpportunityId(iv.opportunityId?._id || iv.opportunityId || '');
    setCandidateId(iv.candidateId?._id || iv.candidateId || '');
    setScheduledDate(iv.scheduledDate || '');
    setScheduledTime(iv.scheduledTime || '11:00');
    setDurationMinutes(iv.durationMinutes || 45);
    setMode(iv.mode || 'Online');
    setMeetingLinkOrLocation(iv.meetingLinkOrLocation || '');
    setInterviewerName(iv.interviewerName || '');
    setInterviewerEmail(iv.interviewerEmail || '');
    setNotes(iv.notes || '');
    setFeedback(iv.feedback || '');
    setRating(iv.rating ? String(iv.rating) : '');
    setStatus(iv.status || 'Scheduled');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    const payload = {
      applicationId: applicationId || undefined,
      opportunityId,
      candidateId,
      scheduledDate,
      scheduledTime,
      durationMinutes: Number(durationMinutes) || 45,
      mode,
      meetingLinkOrLocation,
      interviewerName,
      interviewerEmail,
      notes,
      feedback,
      rating: rating ? Number(rating) : null,
      status
    };

    const res = editing
      ? await apiFetch(`/api/employer/interviews/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      : await apiFetch('/api/employer/interviews', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

    setSaving(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Could not save interview.' });
      return;
    }

    setModalOpen(false);
    setNotice({
      type: 'success',
      text: editing
        ? 'Interview updated and notifications sent.'
        : 'Interview scheduled and candidate notified!'
    });
    await load();
  };

  // Group interviews by date for Calendar view
  const groupedByDate = interviews.reduce<Record<string, any[]>>((acc, iv) => {
    const key = iv.scheduledDate || 'Unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(iv);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort();

  // Deduplicated candidate choices from applicants
  const uniqueCandidates = Array.from(
    new Map(
      applicants
        .filter((a) => a.seekerId?._id)
        .map((a) => [a.seekerId._id, a.seekerId])
    ).values()
  );

  const ModeIcon = (m: string) =>
    m === 'Offline' ? MapPin : m === 'Telephone' ? Phone : Video;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">Interview Management</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Schedule Online, Offline, or Telephone interviews, record interviewer feedback, and keep candidates automatically updated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                viewMode === 'list' ? 'bg-white text-[#1E3A5F] shadow-xs' : 'text-[#64748B]'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                viewMode === 'calendar' ? 'bg-white text-[#1E3A5F] shadow-xs' : 'text-[#64748B]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" /> Schedule Interview
          </button>
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
          <p className="text-xs">Loading interview schedule...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-2">
          <CalendarClock className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#1E3A5F]">No interviews scheduled yet</h3>
          <p className="text-xs text-[#64748B]">
            Schedule an interview from here or directly from any candidate in your Applications pipeline.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const Icon = ModeIcon(iv.mode);
            return (
              <div
                key={iv._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#1E3A5F]">
                      {iv.candidateId?.name || 'Candidate'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                      {iv.status}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8FCFF] text-[#475569] border border-[#D8ECFA]">
                      <Icon className="w-3 h-3 text-[#3B9EE8]" /> {iv.mode}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Role: <strong className="text-[#1E3A5F]">{iv.opportunityId?.title || 'Position'}</strong> •{' '}
                    {iv.scheduledDate} at {iv.scheduledTime} ({iv.durationMinutes} min) • Interviewer: {iv.interviewerName}
                  </p>
                  {iv.meetingLinkOrLocation && (
                    <p className="text-xs text-[#2589D6] break-all">
                      <strong>Link / Location:</strong> {iv.meetingLinkOrLocation}
                    </p>
                  )}
                  {iv.feedback && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <strong>Feedback{iv.rating ? ` (${iv.rating}/5)` : ''}:</strong> {iv.feedback}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(iv)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE] hover:bg-[#D6EEFF] self-start md:self-auto"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Manage / Feedback
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar Agenda Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDates.map((dateKey) => (
            <div key={dateKey} className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAF7FF]">
                <span className="text-sm font-bold text-[#1E3A5F]">{dateKey}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7FF] text-[#2589D6]">
                  {groupedByDate[dateKey].length} session(s)
                </span>
              </div>
              <div className="space-y-2.5">
                {groupedByDate[dateKey].map((iv) => (
                  <button
                    key={iv._id}
                    type="button"
                    onClick={() => openEditModal(iv)}
                    className="w-full text-left p-3 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] border border-[#D8ECFA] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E3A5F]">{iv.scheduledTime}</span>
                      <span className="text-[10px] font-semibold text-[#2589D6]">{iv.mode} • {iv.status}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#334155] mt-1">{iv.candidateId?.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{iv.opportunityId?.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule / Edit Interview Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-[#D8ECFA] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#EAF7FF] pb-3">
              <h2 className="text-lg font-bold text-[#1E3A5F]">
                {editing ? 'Update Interview & Record Feedback' : 'Schedule New Interview'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {!editing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Candidate *</label>
                  <select
                    required
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                  >
                    <option value="">Select applicant...</option>
                    {uniqueCandidates.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Job Position *</label>
                  <select
                    required
                    value={opportunityId}
                    onChange={(e) => setOpportunityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                  >
                    <option value="">Select job...</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>{j.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Time *</label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Mode *</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Interviewer Name *</label>
                <input
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g., Priya Verma (Engineering Lead)"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  {mode === 'Online' ? 'Meeting Link' : mode === 'Offline' ? 'Office Location' : 'Phone Instructions'}
                </label>
                <input
                  type="text"
                  value={meetingLinkOrLocation}
                  onChange={(e) => setMeetingLinkOrLocation(e.target.value)}
                  placeholder={mode === 'Online' ? 'https://meet.google.com/...' : 'Address / dial-in'}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Interview Notes / Preparation</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
              />
            </div>

            {editing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EAF7FF]">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Interview Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Objective Skill Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Interviewer Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Record structured, skills-based evaluation feedback..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-[#D8ECFA] text-xs font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes & Notify' : 'Schedule & Notify'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
