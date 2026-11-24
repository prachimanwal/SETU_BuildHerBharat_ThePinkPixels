import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  FileText,
  Clock,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { PromptModal } from '../components/PromptModal';
import { apiFetch, extractArray, formatLocation, getApiUrl, unwrapData } from '../utils/api';

type AdminPromptState =
  | {
      kind: 'employer';
      employerId: string;
      newStatus: string;
      defaultNote: string;
      title: string;
      label: string;
    }
  | {
      kind: 'document';
      docId: string;
      status: 'Rejected' | 'Additional Information Required';
      title: string;
      label: string;
    };

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'verification' | 'reports' | 'listings' | 'support'>('verification');
  const [stats, setStats] = useState<any>(null);
  const [employers, setEmployers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin note modal
  const [actionSuccess, setActionSuccess] = useState('');
  const [promptState, setPromptState] = useState<AdminPromptState | null>(null);
  const [promptSubmitting, setPromptSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, empRes, repRes, listRes, supRes] = await Promise.all([
        apiFetch('/api/analytics/admin/stats'),
        apiFetch('/api/admin/employers'),
        apiFetch('/api/admin/reports'),
        apiFetch('/api/admin/opportunities'),
        apiFetch('/api/admin/support-tickets')
      ]);

      if (statsRes.ok && statsRes.data) setStats(unwrapData(statsRes.data));
      if (empRes.ok) setEmployers(extractArray(empRes.data, ['employers', 'results']));
      if (repRes.ok) setReports(extractArray(repRes.data, ['reports', 'results']));
      if (listRes.ok) setListings(extractArray(listRes.data, ['results', 'opportunities']));
      if (supRes.ok) setSupportTickets(extractArray(supRes.data, ['tickets', 'results']));
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setEmployers([]);
      setReports([]);
      setListings([]);
      setSupportTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateEmployer = (
    employerId: string,
    newStatus: string,
    defaultNote: string
  ) => {
    setPromptState({
      kind: 'employer',
      employerId,
      newStatus,
      defaultNote,
      title: `Update Employer Status (${newStatus})`,
      label: 'Admin review note for audit'
    });
  };

  const handlePreviewEmployerDoc = async (docId: string) => {
    const token = localStorage.getItem('setu_auth_token');
    const res = await fetch(getApiUrl(`/api/admin/verification/documents/${docId}/file`), {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      toast.error('Could not preview document right now.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const submitDocReview = async (
    docId: string,
    status: 'Verified' | 'Rejected' | 'Additional Information Required',
    reason: string
  ) => {
    const res = await apiFetch(`/api/admin/verification/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason: reason, adminNotes: reason })
    });
    if (res.ok) {
      setActionSuccess(`Document marked as ${status}`);
      toast.success(`Document marked as ${status}.`);
      await loadData();
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      toast.error(res.error || 'Could not update document status.');
    }
  };

  const handleReviewDoc = async (
    docId: string,
    status: 'Verified' | 'Rejected' | 'Additional Information Required'
  ) => {
    if (status === 'Verified') {
      await submitDocReview(docId, status, 'Document verified by SETU administrator.');
      return;
    }
    setPromptState({
      kind: 'document',
      docId,
      status,
      title: `Mark Document as "${status}"`,
      label: `Feedback / reason for "${status}"`
    });
  };

  const handlePromptConfirm = async (value: string) => {
    if (!promptState || promptSubmitting) return;
    setPromptSubmitting(true);
    try {
      if (promptState.kind === 'employer') {
        const note = value || promptState.defaultNote;
        const res = await apiFetch(`/api/admin/employers/${promptState.employerId}/verify`, {
          method: 'PUT',
          body: JSON.stringify({
            status: promptState.newStatus,
            notes: note,
            adminReviewNotes: note
          })
        });
        if (res.ok) {
          setActionSuccess(`Employer status changed to ${promptState.newStatus}`);
          toast.success(`Employer status updated to ${promptState.newStatus}.`);
          setPromptState(null);
          await loadData();
          setTimeout(() => setActionSuccess(''), 3000);
        } else {
          toast.error(res.error || 'Could not update employer verification status.');
        }
      } else {
        await submitDocReview(promptState.docId, promptState.status, value || promptState.status);
        setPromptState(null);
      }
    } catch {
      toast.error('Network error while saving admin review note.');
    } finally {
      setPromptSubmitting(false);
    }
  };

  const handleToggleListingVisibility = async (oppId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'hidden_by_admin' ? 'published' : 'hidden_by_admin';
    try {
      const res = await apiFetch(`/api/admin/opportunities/${oppId}/moderate`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string, actionTaken: string) => {
    try {
      const res = await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'action_taken',
          actionTaken,
          adminNotes: `Resolved by ${user?.name} via moderation desk`
        })
      });

      if (res.ok) {
        setActionSuccess(`Report resolved (${actionTaken})`);
        await loadData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'resolved',
          adminNotes: 'Attended to by administrative officer.'
        })
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading SETU administrator controls...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8ECFA] gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-700">
            <ShieldAlert className="w-4 h-4" />
            <span>National Platform Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#334155]">
            Administrator Moderation & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Review employer business documentation, moderate suspicious listing reports, and handle private Build Her safety tickets.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 bg-purple-100 text-purple-900 rounded-lg font-semibold border border-purple-200 self-start sm:self-auto">
          Logged in as: {user?.name} (Admin)
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#D8ECFA] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Pending Employers
          </span>
          <div className="text-2xl font-black text-amber-600 font-serif">
            {stats?.pendingEmployers || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">Require document review</p>
        </div>

        <div className="bg-white rounded-xl border border-[#D8ECFA] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Approved Employers
          </span>
          <div className="text-2xl font-black text-emerald-700 font-serif">
            {stats?.approvedEmployers || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">Verified badge granted</p>
        </div>

        <div className="bg-white rounded-xl border border-[#D8ECFA] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Reported Listings
          </span>
          <div className="text-2xl font-black text-rose-600 font-serif">
            {stats?.pendingReports || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">Seeker fraud reports</p>
        </div>

        <div className="bg-white rounded-xl border border-[#D8ECFA] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wider block">
            Build Her Safety Desk
          </span>
          <div className="text-2xl font-black text-pink-700 font-serif">
            {stats?.openSafetyTickets || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">Confidential tickets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#D8ECFA]">
        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'verification'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#64748B] hover:text-[#334155]'
          }`}
        >
          Employer Verifications ({employers.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#64748B] hover:text-[#334155]'
          }`}
        >
          Reported Listings ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'listings'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#64748B] hover:text-[#334155]'
          }`}
        >
          All Listings Moderation ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'support'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#64748B] hover:text-[#334155]'
          }`}
        >
          Safety & Support Desk ({supportTickets.length})
        </button>
      </div>

      {/* Tab 1: Employer Verification Queue */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {employers.map((emp) => {
            const prof = emp.employerProfile || {};
            const st = prof.verificationStatus || 'pending';
            const isApproved = st === 'approved' || st === 'verified';
            const uploadedDocs = Array.isArray(emp.verificationDocuments)
              ? emp.verificationDocuments
              : [];

            return (
              <div
                key={emp._id}
                className="bg-white rounded-2xl border border-[#D8ECFA] p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#334155] font-serif">
                        {emp.companyRecord?.publicName || prof.companyName || emp.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : st === 'rejected' || st === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Recruiter: {emp.name} ({emp.email}) • Industry: {prof.industry}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isApproved && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateEmployer(
                              emp._id,
                              'approved',
                              'Verified business documents against official records'
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                        >
                          Approve & Verify
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateEmployer(
                              emp._id,
                              'additional_info_required',
                              'Please upload clearer business registration or authorization letter'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
                        >
                          Request Info
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateEmployer(
                              emp._id,
                              'rejected',
                              'Submitted verification documents could not be validated'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <button
                        onClick={() =>
                          handleUpdateEmployer(
                            emp._id,
                            'suspended',
                            'Suspended due to compliance inquiry'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                      >
                        Suspend Employer
                      </button>
                    )}
                  </div>
                </div>

                {/* Uploaded Verification Documents */}
                {uploadedDocs.length > 0 && (
                  <div className="p-3.5 bg-[#F8FCFF] rounded-xl border border-[#D8ECFA] text-xs space-y-2">
                    <span className="font-bold text-[#334155] block">
                      Uploaded Verification Files ({uploadedDocs.length}):
                    </span>
                    {uploadedDocs.map((doc: any) => (
                      <div
                        key={doc._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-[#EAF7FF]"
                      >
                        <div>
                          <p className="font-bold text-[#1E3A5F]">{doc.documentType}</p>
                          <p className="text-[11px] text-[#64748B]">
                            {doc.originalFilename} • Status: <strong>{doc.status}</strong>
                            {doc.documentNumber ? ` • Ref: ${doc.documentNumber}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePreviewEmployerDoc(doc._id)}
                            className="px-2.5 py-1 rounded-lg bg-[#EAF7FF] text-[#1E3A5F] text-[11px] font-semibold"
                          >
                            Preview File
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDoc(doc._id, 'Verified')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold"
                          >
                            Verify Doc
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewDoc(doc._id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold"
                          >
                            Reject Doc
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submitted Docs Preview */}
                <div className="p-3.5 bg-[#F8FCFF] rounded-xl border border-[#D8ECFA] text-xs space-y-1">
                  <span className="font-bold text-[#334155] block">Verification Submission:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#475569]">
                    <div>
                      <strong>Document Type:</strong> {prof.verificationDocs?.docType || 'Not specified'}
                    </div>
                    <div>
                      <strong>Document Number:</strong> {prof.verificationDocs?.docNumber || 'Not provided'}
                    </div>
                  </div>
                  {prof.verificationDocs?.notes && (
                    <p className="text-[#64748B] italic text-[11px] pt-1">
                      "{prof.verificationDocs.notes}"
                    </p>
                  )}
                  {prof.adminReviewNotes && (
                    <div className="pt-2 border-t border-[#D8ECFA] text-purple-900 font-medium">
                      Admin Audit Note: {prof.adminReviewNotes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#BDE0FE] p-12 text-center text-[#64748B]">
              No reported listings in moderation queue.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep._id}
                  className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded">
                        Reason: {rep.reason.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-[#334155] text-base mt-1">
                        Reported Listing: {rep.opportunityId?.title || 'Unknown Opportunity'}
                      </h4>
                      <p className="text-xs text-[#64748B]">
                        Reported by seeker: {rep.reporterId?.name || 'Anonymous Seeker'} (
                        {rep.reporterId?.email})
                      </p>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF7FF] text-[#334155]">
                      Status: {rep.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FCFF] rounded-xl text-xs text-[#475569] border border-[#D8ECFA]">
                    <span className="font-bold block mb-1">Seeker Description:</span>
                    <p className="leading-relaxed">{rep.description}</p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveReport(rep._id, 'listing_hidden')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Hide Listing from Public
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep._id, 'dismissed')}
                        className="px-4 py-2 border border-[#BDE0FE] text-[#475569] font-bold text-xs rounded-lg hover:bg-[#F8FCFF] transition"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Listings Moderation */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((opp) => (
              <div
                key={opp._id}
                className="bg-white rounded-2xl border border-[#D8ECFA] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      opp.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : opp.status === 'hidden_by_admin'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-[#EAF7FF] text-[#475569]'
                    }`}
                  >
                    {opp.status}
                  </span>
                  <span className="text-xs text-[#64748B]">
                    {(opp.workMode || 'hybrid').toUpperCase()}
                  </span>
                </div>

                <h4 className="font-bold text-[#334155] text-base">{opp.title}</h4>
                <p className="text-xs text-[#64748B] font-medium">{opp.organisationName}</p>

                <div className="pt-3 border-t border-[#EAF7FF] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">{formatLocation(opp.location)}</span>
                  <button
                    onClick={() => handleToggleListingVisibility(opp._id, opp.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      opp.status === 'hidden_by_admin'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {opp.status === 'hidden_by_admin' ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Restore Listing</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide Listing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Confidential Safety Desk */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          {supportTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#BDE0FE] p-12 text-center text-[#64748B]">
              No confidential support tickets received.
            </div>
          ) : (
            <div className="space-y-4">
              {supportTickets.map((t) => (
                <div
                  key={t._id}
                  className="bg-white rounded-2xl border border-pink-200 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900">
                          {t.category.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-[#64748B]">
                          Confidential Ticket
                        </span>
                      </div>
                      <h4 className="font-bold text-[#334155] text-base mt-1">{t.subject}</h4>
                      <p className="text-xs text-[#64748B]">
                        From: <strong>{t.name}</strong> • Contact: <strong>{t.contactEmailOrPhone}</strong>
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        t.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FCFF] rounded-xl text-xs text-[#334155] border border-[#D8ECFA] leading-relaxed whitespace-pre-line">
                    {t.message}
                  </div>

                  {t.status !== 'resolved' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleResolveTicket(t._id)}
                        className="px-4 py-1.5 rounded-lg bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs transition"
                      >
                        Mark as Addressed & Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PromptModal
        open={Boolean(promptState)}
        title={promptState?.title || 'Admin Review Note'}
        description="Provide clear audit feedback for this moderation decision."
        label={promptState?.label || 'Review Note'}
        defaultValue={promptState?.kind === 'employer' ? promptState.defaultNote : ''}
        placeholder="Enter review note or reason..."
        confirmLabel="Save & Apply"
        loading={promptSubmitting}
        onConfirm={(val) => void handlePromptConfirm(val)}
        onCancel={() => {
          if (!promptSubmitting) setPromptState(null);
        }}
      />
    </div>
  );
};
