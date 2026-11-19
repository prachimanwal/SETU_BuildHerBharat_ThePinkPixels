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

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'verification' | 'reports' | 'listings' | 'support'>('verification');
  const [stats, setStats] = useState<any>(null);
  const [employers, setEmployers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin note prompt
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, empRes, repRes, listRes, supRes] = await Promise.all([
        fetch('/api/analytics/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/employers', { credentials: 'include' }),
        fetch('/api/admin/reports', { credentials: 'include' }),
        fetch('/api/admin/opportunities', { credentials: 'include' }),
        fetch('/api/admin/support-tickets', { credentials: 'include' })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (empRes.ok) setEmployers(await empRes.json());
      if (repRes.ok) setReports(await repRes.json());
      if (listRes.ok) setListings(await listRes.json());
      if (supRes.ok) setSupportTickets(await supRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateEmployer = async (
    employerId: string,
    newStatus: string,
    defaultNote: string
  ) => {
    const note = prompt('Admin review note for audit:', defaultNote) || defaultNote;
    try {
      const res = await fetch(`/api/admin/employers/${employerId}/verification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          adminReviewNotes: note
        })
      });

      if (res.ok) {
        setActionSuccess(`Employer status changed to ${newStatus}`);
        await loadData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleListingVisibility = async (oppId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'hidden_by_admin' ? 'published' : 'hidden_by_admin';
    try {
      const res = await fetch(`/api/admin/opportunities/${oppId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      const res = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#A3A3A3]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading SETU administrator controls...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#292929] gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-700">
            <ShieldAlert className="w-4 h-4" />
            <span>National Platform Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
            Administrator Moderation & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-0.5">
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
        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Pending Employers
          </span>
          <div className="text-2xl font-black text-amber-600 font-serif">
            {stats?.pendingEmployers || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Require document review</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Approved Employers
          </span>
          <div className="text-2xl font-black text-emerald-700 font-serif">
            {stats?.approvedEmployers || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Verified badge granted</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Reported Listings
          </span>
          <div className="text-2xl font-black text-rose-600 font-serif">
            {stats?.pendingReports || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Seeker fraud reports</p>
        </div>

        <div className="bg-[#151515] rounded-xl border border-[#292929] p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-pink-700 uppercase tracking-wider block">
            Build Her Safety Desk
          </span>
          <div className="text-2xl font-black text-pink-700 font-serif">
            {stats?.openSafetyTickets || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Confidential tickets</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#292929]">
        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'verification'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          Employer Verifications ({employers.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          Reported Listings ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'listings'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
          }`}
        >
          All Listings Moderation ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'support'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-[#737373] hover:text-[#F5F5F5]'
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
            const isPending = prof.verificationStatus === 'pending';
            const isApproved = prof.verificationStatus === 'approved';

            return (
              <div
                key={emp._id}
                className="bg-[#151515] rounded-2xl border border-[#292929] p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-[#F5F5F5] font-serif">
                        {prof.companyName || emp.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {prof.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">
                      Recruiter: {emp.name} ({emp.email}) • Industry: {prof.industry}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <button
                        onClick={() =>
                          handleUpdateEmployer(
                            emp._id,
                            'approved',
                            'Verified registry against official MCA / GSTIN registry'
                          )
                        }
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                      >
                        Approve & Grant Badge
                      </button>
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
                    {!isPending && !isApproved && (
                      <button
                        onClick={() =>
                          handleUpdateEmployer(
                            emp._id,
                            'approved',
                            'Reinstated after review'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs transition"
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitted Docs Preview */}
                <div className="p-3.5 bg-[#101010] rounded-xl border border-[#292929] text-xs space-y-1">
                  <span className="font-bold text-[#F5F5F5] block">Verification Submission:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#D4D4D4]">
                    <div>
                      <strong>Document Type:</strong> {prof.verificationDocs?.docType || 'Not specified'}
                    </div>
                    <div>
                      <strong>Document Number:</strong> {prof.verificationDocs?.docNumber || 'Not provided'}
                    </div>
                  </div>
                  {prof.verificationDocs?.notes && (
                    <p className="text-[#A3A3A3] italic text-[11px] pt-1">
                      "{prof.verificationDocs.notes}"
                    </p>
                  )}
                  {prof.adminReviewNotes && (
                    <div className="pt-2 border-t border-[#292929] text-purple-900 font-medium">
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
            <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373]">
              No reported listings in moderation queue.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep._id}
                  className="bg-[#151515] rounded-2xl border border-rose-200 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded">
                        Reason: {rep.reason.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-[#F5F5F5] text-base mt-1">
                        Reported Listing: {rep.opportunityId?.title || 'Unknown Opportunity'}
                      </h4>
                      <p className="text-xs text-[#A3A3A3]">
                        Reported by seeker: {rep.reporterId?.name || 'Anonymous Seeker'} (
                        {rep.reporterId?.email})
                      </p>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#1C1C1C] text-[#E5E5E5]">
                      Status: {rep.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#101010] rounded-xl text-xs text-[#D4D4D4] border border-[#292929]">
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
                        className="px-4 py-2 border border-[#333333] text-[#D4D4D4] font-bold text-xs rounded-lg hover:bg-[#101010] transition"
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
                className="bg-[#151515] rounded-2xl border border-[#292929] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      opp.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : opp.status === 'hidden_by_admin'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-[#1C1C1C] text-[#D4D4D4]'
                    }`}
                  >
                    {opp.status}
                  </span>
                  <span className="text-xs text-[#737373]">{opp.workMode.toUpperCase()}</span>
                </div>

                <h4 className="font-bold text-[#F5F5F5] text-base">{opp.title}</h4>
                <p className="text-xs text-[#A3A3A3] font-medium">{opp.organisationName}</p>

                <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                  <span className="text-[#737373]">{opp.location}</span>
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
            <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373]">
              No confidential support tickets received.
            </div>
          ) : (
            <div className="space-y-4">
              {supportTickets.map((t) => (
                <div
                  key={t._id}
                  className="bg-[#151515] rounded-2xl border border-pink-200 p-6 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900">
                          {t.category.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-[#A3A3A3]">
                          Confidential Ticket
                        </span>
                      </div>
                      <h4 className="font-bold text-[#F5F5F5] text-base mt-1">{t.subject}</h4>
                      <p className="text-xs text-[#A3A3A3]">
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

                  <div className="p-3 bg-[#101010] rounded-xl text-xs text-[#E5E5E5] border border-[#292929] leading-relaxed whitespace-pre-line">
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
    </div>
  );
};
