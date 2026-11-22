import React, { useEffect, useState } from 'react';
import {
  Building,
  Briefcase,
  Users,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, extractArray, formatLocation, unwrapData } from '../utils/api';

export const EmployerDashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'opportunities' | 'applicants' | 'verification'>(
    'opportunities'
  );
  const [stats, setStats] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Opportunity Modal
  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [oppType, setOppType] = useState<any>('job');
  const [workMode, setWorkMode] = useState<any>('remote');
  const [location, setLocation] = useState('Pan-India (Remote)');
  const [salary, setSalary] = useState('Competitive');
  const [skills, setSkills] = useState('');
  const [expRequired, setExpRequired] = useState('None / Fresher friendly');
  const [eduRequired, setEduRequired] = useState('No minimum requirement');
  const [isRestart, setIsRestart] = useState(true);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [submittingOpp, setSubmittingOpp] = useState(false);
  const [oppError, setOppError] = useState('');

  // Status & Interview Modal
  const [statusModalApp, setStatusModalApp] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<any>('Shortlisted');
  const [statusNote, setStatusNote] = useState('');
  const [interviewDate, setInterviewDate] = useState('2026-11-25');
  const [interviewTime, setInterviewTime] = useState('02:00 PM IST');
  const [interviewInstructions, setInterviewInstructions] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Verification Submission Form State
  const [docType, setDocType] = useState(
    user?.employerProfile?.verificationDocs?.docType || 'GSTIN Registration Certificate'
  );
  const [docNumber, setDocNumber] = useState(
    user?.employerProfile?.verificationDocs?.docNumber || ''
  );
  const [verNotes, setVerNotes] = useState(
    user?.employerProfile?.verificationDocs?.notes || ''
  );
  const [submittingVer, setSubmittingVer] = useState(false);
  const [verSuccess, setVerSuccess] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, oppsRes, appsRes] = await Promise.all([
        apiFetch('/api/analytics/employer/stats'),
        apiFetch('/api/employer/opportunities'),
        apiFetch('/api/employer/applicants')
      ]);

      if (statsRes.ok && statsRes.data) setStats(unwrapData(statsRes.data));
      if (oppsRes.ok) setOpportunities(extractArray(oppsRes.data, ['results', 'recentOpportunities']));
      if (appsRes.ok) setApplicants(extractArray(appsRes.data, ['results', 'recentApplications']));
    } catch (err) {
      console.error('Failed to load employer data:', err);
      setOpportunities([]);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isApproved = user?.employerProfile?.verificationStatus === 'approved';

  const openCreateOppModal = () => {
    setEditingOpp(null);
    setTitle('');
    setOppType('job');
    setWorkMode('remote');
    setLocation('Pan-India (Remote)');
    setSalary('₹18,000 - ₹25,000 / month');
    setSkills('Canva, Hindi Typing, Social Media');
    setExpRequired('Fresher friendly');
    setEduRequired('No minimum requirement');
    setIsRestart(true);
    setDescription('');
    setStatus(isApproved ? 'published' : 'draft');
    setOppError('');
    setOppModalOpen(true);
  };

  const openEditOppModal = (o: any) => {
    setEditingOpp(o);
    setTitle(o.title);
    setOppType(o.opportunityType);
    setWorkMode(o.workMode);
    setLocation(o.location);
    setSalary(o.salaryOrStipend);
    setSkills((o.requiredSkills || []).join(', '));
    setExpRequired(o.experienceRequired);
    setEduRequired(o.educationRequired);
    setIsRestart(!!o.isCareerRestart);
    setDescription(o.description);
    setStatus(o.status);
    setOppError('');
    setOppModalOpen(true);
  };

  const handleSaveOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOpp(true);
    setOppError('');

    const payload = {
      title,
      opportunityType: oppType,
      workMode,
      location,
      salaryOrStipend: salary,
      requiredSkills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      experienceRequired: expRequired,
      educationRequired: eduRequired,
      isCareerRestart: isRestart,
      description,
      status: !isApproved && status === 'published' ? 'draft' : status
    };

    try {
      const res = editingOpp
        ? await apiFetch(`/api/employer/opportunities/${editingOpp._id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiFetch('/api/employer/opportunities', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

      if (!res.ok) {
        setOppError(res.error || 'Failed to save opportunity');
      } else {
        setOppModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setOppError(err.message || 'Network error');
    } finally {
      setSubmittingOpp(false);
    }
  };

  const handleDeleteOpp = async (id: string) => {
    if (!window.confirm('Delete this opportunity listing?')) return;
    try {
      const res = await apiFetch(`/api/employer/opportunities/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenStatusModal = (app: any) => {
    setStatusModalApp(app);
    setNewStatus(app.status || 'Under Review');
    setStatusNote('');
    if (app.interviewDetails) {
      setInterviewDate(app.interviewDetails.date || '2026-11-25');
      setInterviewTime(app.interviewDetails.time || '03:00 PM IST');
      setInterviewInstructions(app.interviewDetails.instructions || '');
      setMeetLink(app.interviewDetails.meetLinkOrLocation || app.interviewDetails.meetingLink || '');
    } else {
      setInterviewDate('2026-11-25');
      setInterviewTime('03:00 PM IST');
      setInterviewInstructions('Prepare to discuss practical deliverable and availability.');
      setMeetLink('');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalApp) return;
    setUpdatingStatus(true);

    const payload: any = {
      status: newStatus,
      note: statusNote || `Status updated to ${newStatus}`
    };

    if (newStatus === 'Interview Scheduled') {
      payload.interviewDetails = {
        date: interviewDate,
        time: interviewTime,
        instructions: interviewInstructions,
        meetLinkOrLocation: meetLink,
        meetingLink: meetLink
      };
    }

    try {
      const res = await apiFetch(`/api/employer/applicants/${statusModalApp._id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStatusModalApp(null);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to update applicant status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVer(true);
    setVerSuccess('');

    try {
      const res = await apiFetch('/api/employer/verification', {
        method: 'PUT',
        body: JSON.stringify({
          docType,
          docNumber,
          notes: verNotes
        })
      });

      if (res.ok) {
        setVerSuccess('Verification details submitted. SETU administration will review shortly.');
        await refreshUser();
        await loadData();
      }
    } catch (err) {
      console.error('Failed to submit verification:', err);
    } finally {
      setSubmittingVer(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#A3A3A3]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading employer portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#292929] gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Building className="w-4 h-4" />
            <span>Employer Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
            {user?.employerProfile?.companyName || user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-0.5">
            Industry: {user?.employerProfile?.industry || 'General'} • Company Size: {user?.employerProfile?.companySize}
          </p>
        </div>

        <button
          onClick={openCreateOppModal}
          className="px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#FF7847] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {isApproved ? (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                Verified Employer Account
              </span>
              <p className="text-xs text-emerald-800">
                Administrative review completed. Your published opportunities are visible in public seeker discovery.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-full">
            APPROVED
          </span>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  Verification Pending Administrative Review
                </span>
                <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                  Your organisation is currently in pending status. You can create and save draft opportunities. To protect seekers, listings cannot be published until an administrator verifies your business credentials.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('verification')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
            >
              Review Documents
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Published Listings
          </span>
          <div className="text-2xl font-black text-indigo-900 font-serif">
            {stats?.publishedCount || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Live in search</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Draft Postings
          </span>
          <div className="text-2xl font-black text-[#E5E5E5] font-serif">
            {stats?.draftCount || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Pending publish</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Total Candidates
          </span>
          <div className="text-2xl font-black text-[#F5F5F5] font-serif">
            {stats?.totalApplicants || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Applicants to your roles</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider block">
            Interviews Scheduled
          </span>
          <div className="text-2xl font-black text-emerald-700 font-serif">
            {stats?.interviewsScheduled || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Stage 7 progress</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#292929]">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'opportunities'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          My Opportunities ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('applicants')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'applicants'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          Applicants Review ({applicants.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'verification'
              ? 'border-indigo-600 text-indigo-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          Verification Credentials
        </button>
      </div>

      {/* Tab 1: Opportunities */}
      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          {opportunities.length === 0 ? (
            <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373]">
              No opportunities created yet. Click "Post New Opportunity" above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {opportunities.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-[#151515] rounded-2xl border border-[#292929] p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        opp.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#1C1C1C] text-[#D4D4D4]'
                      }`}
                    >
                      {opp.status}
                    </span>
                    <span className="text-xs text-[#737373] flex items-center space-x-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{opp.applicantCount} Applicant(s)</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-[#F5F5F5] text-base leading-snug">{opp.title}</h3>

                  <div className="flex flex-wrap gap-1.5 text-xs text-[#A3A3A3]">
                    <span className="bg-[#1C1C1C] px-2 py-0.5 rounded text-[11px]">
                      {(opp.workMode || 'hybrid').toUpperCase()}
                    </span>
                    <span className="bg-[#1C1C1C] px-2 py-0.5 rounded text-[11px]">
                      {opp.stipendOrSalary || opp.salaryOrStipend || 'Competitive'}
                    </span>
                    {opp.isCareerRestart && (
                      <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                        Career Restart
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#A3A3A3] line-clamp-2">{opp.description}</p>

                  <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                    <span className="text-[#737373]">{formatLocation(opp.location)}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditOppModal(opp)}
                        className="p-1.5 text-[#737373] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOpp(opp._id)}
                        className="p-1.5 text-[#737373] hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Applicants Review */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {applicants.length === 0 ? (
            <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373]">
              No applicants have applied to your postings yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => {
                const seeker = app.seekerId || {};
                const profile = seeker.seekerProfile || {};

                return (
                  <div
                    key={app._id}
                    className="bg-[#151515] rounded-2xl border border-[#292929] p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-[#F5F5F5]">{seeker.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-900">
                            {app.opportunityId?.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#A3A3A3] mt-0.5">
                          {profile.headline || 'Job Seeker'} • {profile.location?.city || 'India'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#1C1C1C] text-[#E5E5E5]">
                          {app.status}
                        </span>
                        <button
                          onClick={() => handleOpenStatusModal(app)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs transition"
                        >
                          Update Status & Interview
                        </button>
                      </div>
                    </div>

                    {/* Candidate Details & Portfolio Samples */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-[#D4D4D4] block mb-0.5">Education:</span>
                          <span className="text-[#E5E5E5] font-medium">{profile.educationLevel}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#D4D4D4] block mb-0.5">Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {profile.skills?.map((s: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="bg-[#1C1C1C] text-[#E5E5E5] px-2 py-0.5 rounded text-[11px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-[#D4D4D4] block mb-0.5">
                            Attached Portfolio Deliverables:
                          </span>
                          {app.portfolioProjectsSnapshot?.length > 0 ? (
                            <div className="space-y-1">
                              {app.portfolioProjectsSnapshot.map((proj: any, pIdx: number) => (
                                <div key={pIdx} className="flex items-center justify-between bg-[#101010] p-1.5 rounded border border-[#292929]">
                                  <span className="font-medium text-[#E5E5E5]">{proj.title}</span>
                                  {proj.workSampleUrl && (
                                    <a
                                      href={proj.workSampleUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#FF7847] hover:underline font-bold"
                                    >
                                      View Work Sample →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#555555] italic">None attached</span>
                          )}
                        </div>

                        {app.coverNote && (
                          <div>
                            <span className="font-semibold text-[#D4D4D4] block mb-0.5">Cover Note:</span>
                            <p className="text-[#D4D4D4] italic">"{app.coverNote}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interview scheduled notice if present */}
                    {app.status === 'Interview Scheduled' && app.interviewDetails?.date && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                        <div>
                          <strong>Interview Scheduled: </strong>
                          {app.interviewDetails.date} at {app.interviewDetails.time}
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800">
                          Meet Link Sent to Candidate
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Verification */}
      {activeTab === 'verification' && (
        <div className="bg-[#151515] rounded-2xl border border-[#292929] p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-serif text-[#F5F5F5]">
              Employer Verification Details
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Submit your corporate registration, GSTIN, PAN, or MSME Udyam details for SETU administration review.
            </p>
          </div>

          {verSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{verSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitVerification} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#D4D4D4] mb-1">Document Type *</label>
              <input
                type="text"
                required
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="e.g. GSTIN Certificate, CIN, MSME Udyam"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#D4D4D4] mb-1">
                Document / Registration Number *
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g. 06AAACB1234F1Z8"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#D4D4D4] mb-1">
                Verification Notes for Admin
              </label>
              <textarea
                rows={3}
                value={verNotes}
                onChange={(e) => setVerNotes(e.target.value)}
                placeholder="Provide registry verification details or official MCA corporate portal references..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingVer}
              className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {submittingVer ? 'Submitting...' : 'Submit Verification Credentials'}
            </button>
          </form>
        </div>
      )}

      {/* Opportunity Modal */}
      {oppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-xl w-full shadow-2xl border border-[#292929] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <h3 className="font-bold text-[#F5F5F5] text-base font-serif">
                {editingOpp ? 'Edit Opportunity' : 'Post New Opportunity'}
              </h3>
              <button
                onClick={() => setOppModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpp} className="p-6 space-y-4 text-xs">
              {oppError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {oppError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Remote Canva & Social Media Designer"
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Opportunity Type</label>
                  <select
                    value={oppType}
                    onChange={(e: any) => setOppType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  >
                    <option value="job">Job</option>
                    <option value="internship">Internship</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="flexible_work">Flexible Work</option>
                    <option value="freelance">Freelance Project</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e: any) => setWorkMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  >
                    <option value="remote">Remote (Work from Home)</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Gurugram, Remote"
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Stipend / Salary</label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹20,000 / month"
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Canva, Graphic Design, Social Media"
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the practical responsibilities, flexible schedule, and deliverables..."
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="restartOpp"
                  checked={isRestart}
                  onChange={(e) => setIsRestart(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                />
                <label htmlFor="restartOpp" className="text-xs text-[#D4D4D4] font-semibold cursor-pointer">
                  Build Her Initiative: Women returning to work / flexible transition friendly
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Publication Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                >
                  <option value="draft">Draft (Private, not published)</option>
                  <option value="published" disabled={!isApproved}>
                    {isApproved
                      ? 'Published (Live in Seeker discovery)'
                      : 'Published (Locked - Requires Admin Approval)'}
                  </option>
                </select>
                {!isApproved && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    * Publishing is blocked until administrator approves your verification.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setOppModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#333333] font-semibold hover:bg-[#1C1C1C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOpp}
                  className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#FF7847] text-white font-bold"
                >
                  {submittingOpp ? 'Saving...' : 'Save Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applicant Status & Interview Scheduling Modal */}
      {statusModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-lg w-full shadow-2xl border border-[#292929] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Update Candidate Progress
                </span>
                <h3 className="font-bold text-[#F5F5F5] text-base font-serif">
                  {statusModalApp.seekerId?.name} ({statusModalApp.opportunityId?.title})
                </h3>
              </div>
              <button
                onClick={() => setStatusModalApp(null)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Application Status *</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Selected">Selected (Job Offer / Project Award)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">
                  Recruiter Note for Audit History
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Portfolio reviewed, qualified for creative conversation."
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Interview Details Sub-form */}
              {newStatus === 'Interview Scheduled' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-3">
                  <span className="font-bold text-emerald-950 block text-xs uppercase tracking-wider">
                    Schedule Interview Details (Delivered to Candidate):
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1">Time *</label>
                      <input
                        type="text"
                        required
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        placeholder="03:00 PM IST"
                        className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">
                      Meeting Link or Location
                    </label>
                    <input
                      type="url"
                      value={meetLink}
                      onChange={(e) => setMeetLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">
                      Instructions for Candidate *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={interviewInstructions}
                      onChange={(e) => setInterviewInstructions(e.target.value)}
                      placeholder="e.g. Please bring your practical Canva deliverable. Focus will be on design hierarchy."
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setStatusModalApp(null)}
                  className="px-4 py-2 rounded-lg border border-[#333333] font-semibold hover:bg-[#1C1C1C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-5 py-2 rounded-lg bg-indigo-900 hover:bg-indigo-950 text-white font-bold"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
