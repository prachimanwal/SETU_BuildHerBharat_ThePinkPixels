import React, { useEffect, useState } from 'react';
import {
  Search,
  Users,
  FolderGit2,
  FileText,
  UserCheck,
  Send,
  Eye,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch, extractArray, unwrapData } from '../../utils/api';

export const CandidateSearchPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [availability, setAvailability] = useState('');
  const [hasPortfolio, setHasPortfolio] = useState(false);

  // Modals
  const [profileModal, setProfileModal] = useState<any>(null);
  const [resumeModal, setResumeModal] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'shortlist' | 'invite';
    candidate: any;
  } | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (skills.trim()) params.set('skills', skills.trim());
    if (education.trim()) params.set('education', education.trim());
    if (experience.trim()) params.set('experience', experience.trim());
    if (role.trim()) params.set('role', role.trim());
    if (location.trim()) params.set('location', location.trim());
    if (employmentType.trim()) params.set('employmentType', employmentType.trim());
    if (availability.trim()) params.set('availability', availability.trim());
    if (hasPortfolio) params.set('hasPortfolio', 'true');

    const res = await apiFetch(`/api/employer/candidates?${params.toString()}`);
    if (res.ok) {
      setCandidates(extractArray(res.data));
    } else {
      setCandidates([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
    (async () => {
      const jobsRes = await apiFetch('/api/employer/opportunities');
      if (jobsRes.ok) {
        const list = extractArray(jobsRes.data);
        setJobs(list);
        const pub = list.find((j: any) => j.status === 'published') || list[0];
        if (pub) setSelectedJobId(pub._id);
      }
    })();
  }, []);

  const handleOpenProfile = async (candidateId: string, showResumeDirectly = false) => {
    const res = await apiFetch(`/api/employer/candidates/${candidateId}`);
    if (!res.ok || !res.data) {
      setNotice({ type: 'error', text: res.error || 'Could not load candidate details.' });
      return;
    }
    const detail = unwrapData(res.data);
    if (showResumeDirectly) {
      setResumeModal(detail);
    } else {
      setProfileModal(detail);
    }
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal || !selectedJobId) return;
    setSubmittingAction(true);
    setNotice(null);

    const endpoint =
      actionModal.type === 'invite'
        ? `/api/employer/candidates/${actionModal.candidate._id}/invite`
        : `/api/employer/candidates/${actionModal.candidate._id}/shortlist`;

    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: selectedJobId,
        message: actionMessage,
        note: actionMessage
      })
    });

    setSubmittingAction(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Action failed.' });
    } else {
      setNotice({
        type: 'success',
        text:
          actionModal.type === 'invite'
            ? `Invitation sent to ${actionModal.candidate.name}!`
            : `${actionModal.candidate.name} shortlisted cleanly!`
      });
      setActionModal(null);
      setActionMessage('');
      await fetchCandidates();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
        <h1 className="text-xl font-bold text-[#1E3A5F]">Candidate Search & Matching</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Search consenting SETU candidates by skills, education, experience, location, and portfolio projects. Private contact information stays protected until authorized.
        </p>

        {/* Multi-Filter Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCandidates();
          }}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keyword / headline..."
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Skills (e.g., Excel, React, SQL)"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Education (e.g., B.Tech, MBA)"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <input
            type="text"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Experience (e.g., Fresher, 2 years)"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Preferred job role"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (city or state)"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          >
            <option value="">Any Employment Preference</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
            <option value="remote">Remote</option>
          </select>
          <input
            type="text"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Availability (e.g., Immediate)"
            className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
          />

          <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-[#334155]">
              <input
                type="checkbox"
                checked={hasPortfolio}
                onChange={(e) => setHasPortfolio(e.target.checked)}
              />
              <span>Only candidates with Portfolio Projects</span>
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Candidates</span>
            </button>
          </div>
        </form>
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
          <p className="text-xs">Searching consenting candidates...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-2">
          <Users className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <p className="text-sm font-bold text-[#1E3A5F]">No matching consenting candidates found</p>
          <p className="text-xs text-[#64748B]">Try broadening your skills, location, or education filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand._id}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1E3A5F]">{cand.name}</h3>
                    <p className="text-xs text-[#475569] mt-0.5">{cand.headline}</p>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      {cand.location} • {cand.educationSummary} • {cand.experienceSummary}
                    </p>
                  </div>
                  {cand.existingApplicationStatus && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]">
                      {cand.existingApplicationStatus}
                    </span>
                  )}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5">
                  {(cand.skills || []).slice(0, 7).map((sk: string, idx: number) => {
                    const isVer = (cand.verifiedSkills || []).includes(sk);
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          isVer
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#F8FCFF] text-[#1E3A5F] border-[#D8ECFA]'
                        }`}
                      >
                        {isVer && <ShieldCheck className="w-3 h-3" />}
                        {sk}
                      </span>
                    );
                  })}
                </div>

                {/* Portfolio & Resume Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B]">
                  <span className="inline-flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5 text-[#3B9EE8]" />
                    {cand.portfolioCount} Portfolio Project(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#3B9EE8]" />
                    {cand.resumeAuthorizedToView
                      ? 'Resume Shared'
                      : cand.resumeAvailable
                      ? 'Resume Available on Application'
                      : 'No Resume Uploaded'}
                  </span>
                </div>

                {cand.relevantProjects?.length > 0 && (
                  <p className="text-[11px] text-[#475569] bg-[#F8FCFF] px-3 py-1.5 rounded-xl border border-[#EAF7FF]">
                    <strong>Projects:</strong> {cand.relevantProjects.map((p: any) => p.title).join(', ')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EAF7FF]">
                <button
                  type="button"
                  onClick={() => handleOpenProfile(cand._id, false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenProfile(cand._id, true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                >
                  <FileText className="w-3.5 h-3.5" /> View Resume
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionModal({ type: 'shortlist', candidate: cand });
                    setActionMessage('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionModal({ type: 'invite', candidate: cand });
                    setActionMessage('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B9EE8] text-white text-xs font-semibold hover:bg-[#2589D6]"
                >
                  <Send className="w-3.5 h-3.5" /> Invite to Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D8ECFA] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF7FF] pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A5F]">{profileModal.candidate?.name}</h2>
                <p className="text-xs text-[#64748B]">{profileModal.candidate?.headline}</p>
              </div>
              <button type="button" onClick={() => setProfileModal(null)} className="p-1.5 rounded-xl hover:bg-[#EAF7FF]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {profileModal.candidate?.bio && (
              <p className="text-xs text-[#475569] leading-relaxed">{profileModal.candidate.bio}</p>
            )}
            <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs text-[#475569]">
              {profileModal.candidate?.contactAuthorized ? (
                <p>
                  <strong>Authorized Contact:</strong> {profileModal.candidate.email}
                  {profileModal.candidate.phone ? ` • ${profileModal.candidate.phone}` : ''}
                </p>
              ) : (
                <p>
                  <strong>Privacy Protected:</strong> Private contact details are hidden until the candidate applies or explicitly consents. Use <em>Invite to Apply</em> to connect.
                </p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-[#64748B] mb-2">Portfolio Projects ({profileModal.projects?.length || 0})</h3>
              {profileModal.projects?.length ? (
                <div className="space-y-2">
                  {profileModal.projects.map((p: any) => (
                    <div key={p._id} className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#EAF7FF]">
                      <p className="text-xs font-bold text-[#1E3A5F]">{p.title}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{p.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No portfolio projects added yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal */}
      {resumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D8ECFA] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF7FF] pb-3">
              <h2 className="text-base font-bold text-[#1E3A5F]">
                Resume — {resumeModal.candidate?.name}
              </h2>
              <button type="button" onClick={() => setResumeModal(null)} className="p-1.5 rounded-xl hover:bg-[#EAF7FF]">
                <X className="w-5 h-5" />
              </button>
            </div>
            {!resumeModal.resumeAuthorized ? (
              <div className="p-6 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center text-xs text-[#64748B]">
                This candidate has not enabled open resume sharing yet. Invite them to apply to view their submitted resume.
              </div>
            ) : resumeModal.resumePreview ? (
              <div className="space-y-3 text-xs text-[#334155]">
                <p className="font-bold text-sm text-[#1E3A5F]">{resumeModal.resumePreview.title || 'SETU Resume'}</p>
                {resumeModal.resumePreview.summary && <p>{resumeModal.resumePreview.summary}</p>}
                {resumeModal.resumePreview.skills?.length > 0 && (
                  <p><strong>Skills:</strong> {resumeModal.resumePreview.skills.join(', ')}</p>
                )}
              </div>
            ) : resumeModal.uploadedResumeMeta ? (
              <div className="space-y-2 text-xs text-[#334155]">
                <p><strong>Uploaded File:</strong> {resumeModal.uploadedResumeMeta.originalFilename}</p>
                {resumeModal.uploadedResumeMeta.extractedData?.skills?.length > 0 && (
                  <p><strong>Skills:</strong> {resumeModal.uploadedResumeMeta.extractedData.skills.join(', ')}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">No resume uploaded by this candidate yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Shortlist / Invite Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmAction}
            className="bg-white rounded-3xl border border-[#D8ECFA] max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A5F]">
                {actionModal.type === 'invite' ? 'Invite to Apply' : 'Shortlist Candidate'} — {actionModal.candidate.name}
              </h2>
              <button type="button" onClick={() => setActionModal(null)}>
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Select Job Position *</label>
              <select
                required
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              >
                <option value="">Choose a vacancy...</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                {actionModal.type === 'invite' ? 'Personal Message (Optional)' : 'Private Recruiter Note (Optional)'}
              </label>
              <textarea
                rows={3}
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={
                  actionModal.type === 'invite'
                    ? 'We loved your skills and portfolio and would love to invite you to apply...'
                    : 'Strong fit for required skills...'
                }
                className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 rounded-xl border border-[#D8ECFA] text-xs font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction || !selectedJobId}
                className="px-4 py-2 rounded-xl bg-[#3B9EE8] text-white text-xs font-bold disabled:opacity-50"
              >
                {submittingAction ? 'Processing...' : actionModal.type === 'invite' ? 'Send Invitation' : 'Confirm Shortlist'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
