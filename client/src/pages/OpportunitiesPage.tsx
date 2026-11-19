import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const OpportunitiesPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [restartOnly, setRestartOnly] = useState(false);

  // Apply Modal State
  const [applyOpp, setApplyOpp] = useState<any>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  // Report Modal State
  const [reportOpp, setReportOpp] = useState<any>(null);
  const [reportReason, setReportReason] = useState<any>('fraud_or_scam');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  const loadOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (locationFilter) params.append('location', locationFilter);
      if (workModeFilter !== 'all') params.append('workMode', workModeFilter);
      if (typeFilter !== 'all') params.append('opportunityType', typeFilter);
      if (restartOnly) params.append('isCareerRestart', 'true');

      const [oppRes, savedRes] = await Promise.all([
        fetch(`/api/public/opportunities?${params.toString()}`, { credentials: 'include' }),
        user?.role === 'seeker'
          ? fetch('/api/seeker/saved-opportunities', { credentials: 'include' })
          : Promise.resolve(null)
      ]);

      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.results || []);
      }

      if (savedRes && savedRes.ok) {
        const sData = await savedRes.json();
        setSavedIds((sData || []).map((s: any) => s._id || s));
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [workModeFilter, typeFilter, restartOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadOpportunities();
  };

  const handleToggleSave = async (oppId: string) => {
    if (!user) {
      alert('Please log in as a job seeker to bookmark opportunities.');
      return;
    }

    try {
      const res = await fetch('/api/seeker/saved-opportunities/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ opportunityId: oppId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.saved) {
          setSavedIds((prev) => [...prev, oppId]);
        } else {
          setSavedIds((prev) => prev.filter((id) => id !== oppId));
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleOpenApply = (opp: any) => {
    if (!user) {
      alert('Please log in as a job seeker to apply.');
      return;
    }
    setApplyOpp(opp);
    setCoverNote('');
    setApplySuccess('');
    setApplyError('');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyOpp) return;
    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const res = await fetch('/api/seeker/applications/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          opportunityId: applyOpp._id,
          coverNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setApplyError(data.error || 'Failed to submit application');
      } else {
        setApplySuccess('Application submitted successfully! Track progress in Applications.');
        setTimeout(() => {
          setApplyOpp(null);
          setApplySuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setApplyError(err.message || 'Network error');
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportOpp) return;
    setReporting(true);

    try {
      const res = await fetch('/api/seeker/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          opportunityId: reportOpp._id,
          reason: reportReason,
          description: reportDesc
        })
      });

      if (res.ok) {
        setReportSuccess('Thank you. Report received and routed to our moderation team.');
        setTimeout(() => {
          setReportOpp(null);
          setReportSuccess('');
          setReportDesc('');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#292929]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#FF7847]">
          <Briefcase className="w-4 h-4" />
          <span>Stage 6: Find Opportunities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
          {language === 'hi' ? 'खोजें और आवेदन करें' : 'Explore Verified Opportunities'}
        </h1>
        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-3xl">
          Search jobs, apprenticeships, internships, and freelance projects. Each listing shows transparent matching reasons derived from your verified skills and preferences.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="bg-[#151515] rounded-2xl border border-[#292929] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#555555] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skills (Canva, Excel)..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#333333] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-[#555555] absolute left-3 top-3" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location (e.g. Gurugram, Remote, Haryana)"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#333333] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#E65100] hover:bg-[#FF7847] text-white font-bold rounded-lg text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#222222] text-xs">
          <div className="flex items-center space-x-1 text-[#737373] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#333333] bg-[#151515] text-[#D4D4D4] font-medium outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          >
            <option value="all">All Work Modes</option>
            <option value="remote">100% Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#333333] bg-[#151515] text-[#D4D4D4] font-medium outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          >
            <option value="all">All Types</option>
            <option value="job">Jobs</option>
            <option value="internship">Internships</option>
            <option value="apprenticeship">Apprenticeships</option>
            <option value="flexible_work">Flexible Work</option>
            <option value="freelance">Freelance Projects</option>
          </select>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-pink-200 bg-pink-50 text-pink-900 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={restartOnly}
              onChange={(e) => setRestartOnly(e.target.checked)}
              className="rounded text-pink-600 focus:ring-pink-500 w-3.5 h-3.5"
            />
            <span>Build Her (Career Restart Friendly)</span>
          </label>
        </div>
      </form>

      {/* Listings Stream */}
      {loading ? (
        <div className="text-center py-16 text-[#737373]">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#FF5A1F] border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm">Finding matched opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center space-y-2">
          <Briefcase className="w-10 h-10 text-[#555555] mx-auto" />
          <h4 className="font-bold text-[#E5E5E5] text-base">No matching opportunities found</h4>
          <p className="text-xs text-[#737373]">
            Try adjusting your search query, location filter, or work mode preference.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#737373] px-1">
            <span>Showing {opportunities.length} credible opportunities</span>
            <span className="flex items-center space-x-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Only approved employers appear in discovery</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {opportunities.map((item: any) => {
              const opp = item.opportunity;
              const isSaved = savedIds.includes(opp._id);

              return (
                <div
                  key={opp._id}
                  className="bg-[#151515] rounded-2xl border border-[#292929] p-5 sm:p-6 shadow-sm hover:border-orange-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Employer</span>
                        </span>
                        {opp.isCareerRestart && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                            Build Her Friendly
                          </span>
                        )}
                        {opp.isDemoData && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A3A3A3]">
                            Demo Data
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold font-serif text-[#F5F5F5] pt-1">
                        {opp.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#A3A3A3] font-medium">
                        {opp.organisationName} • {opp.location}
                      </p>
                    </div>

                    {/* Match Score & Bookmark */}
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#241A14] text-[#FF7847] border border-orange-200">
                        {item.matchScore}% Match
                      </span>
                      {user?.role === 'seeker' && (
                        <button
                          onClick={() => handleToggleSave(opp._id)}
                          className={`p-2 rounded-lg border transition ${
                            isSaved
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'border-[#292929] text-[#555555] hover:text-[#D4D4D4] hover:bg-[#101010]'
                          }`}
                          title={isSaved ? 'Bookmarked' : 'Save opportunity'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Explainability Badges */}
                  <div className="flex flex-wrap gap-2 p-3 bg-[#101010] rounded-xl border border-[#292929]/60 text-xs">
                    <span className="font-bold text-[#D4D4D4] flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Why this matches you:</span>
                    </span>
                    {item.matchReasons?.map((reason: string, rIdx: number) => (
                      <span
                        key={rIdx}
                        className="bg-[#151515] text-[#E5E5E5] px-2.5 py-0.5 rounded-md border border-[#292929] font-medium flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{reason}</span>
                      </span>
                    ))}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 text-xs text-[#A3A3A3]">
                    <span className="bg-[#1C1C1C] px-2.5 py-1 rounded font-medium">
                      Mode: <strong className="text-[#E5E5E5]">{opp.workMode.toUpperCase()}</strong>
                    </span>
                    <span className="bg-[#1C1C1C] px-2.5 py-1 rounded font-medium">
                      Type: <strong className="text-[#E5E5E5]">{opp.opportunityType.replace('_', ' ')}</strong>
                    </span>
                    <span className="bg-[#1C1C1C] px-2.5 py-1 rounded font-medium">
                      Compensation: <strong className="text-emerald-800">{opp.salaryOrStipend}</strong>
                    </span>
                    <span className="bg-[#1C1C1C] px-2.5 py-1 rounded font-medium">
                      Experience: <strong className="text-[#E5E5E5]">{opp.experienceRequired}</strong>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#D4D4D4] leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 text-xs text-[#737373]">
                      <button
                        onClick={() => {
                          setReportOpp(opp);
                          setReportSuccess('');
                        }}
                        className="text-[#555555] hover:text-rose-600 transition flex items-center space-x-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Report Suspicious Listing</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      {opp.isExternal ? (
                        <a
                          href={opp.externalApplyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <span>Apply on Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleOpenApply(opp)}
                          className="px-5 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#FF7847] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <span>Apply Directly on SETU</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct Apply Modal */}
      {applyOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-lg w-full shadow-2xl border border-[#292929] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7847]">
                  Direct SETU Application
                </span>
                <h3 className="font-bold text-[#F5F5F5] text-base font-serif">{applyOpp.title}</h3>
                <p className="text-xs text-[#A3A3A3]">{applyOpp.organisationName}</p>
              </div>
              <button
                onClick={() => setApplyOpp(null)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4">
              {applyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{applyError}</span>
                </div>
              )}

              {applySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{applySuccess}</span>
                </div>
              )}

              <div className="p-3.5 bg-[#1C1C1C]/70 border border-orange-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-orange-950 block">Portfolio Snapshot Attached:</span>
                <p className="text-[#FF7847] text-[11px] leading-relaxed">
                  Your public portfolio projects and verified assessment scores will be automatically shared with {applyOpp.organisationName}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                  Cover Note / Introduction for Recruiter
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Introduce yourself, mention your key practical skills, and your availability..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setApplyOpp(null)}
                  className="px-4 py-2 rounded-lg border border-[#333333] text-xs font-semibold text-[#D4D4D4] hover:bg-[#1C1C1C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying || !!applySuccess}
                  className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#FF7847] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Confirm & Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Suspicious Listing Modal */}
      {reportOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-md w-full shadow-2xl border border-[#292929] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <h3 className="font-bold text-[#F5F5F5] text-base font-serif flex items-center space-x-1.5 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <span>Report Suspicious Listing</span>
              </h3>
              <button
                onClick={() => setReportOpp(null)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              {reportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl">
                  {reportSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                  Reason for Reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e: any) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-[#151515]"
                >
                  <option value="fraud_or_scam">Fraud / Fake Job Scam</option>
                  <option value="fee_charged">Charging Money / Registration Fee</option>
                  <option value="inaccurate_details">Inaccurate / Misleading Details</option>
                  <option value="unsafe_conditions">Unsafe or Exploitative Conditions</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                  Description of Issue *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Explain why this listing is suspicious. The SETU administration moderates reports promptly."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setReportOpp(null)}
                  className="px-4 py-2 rounded-lg border border-[#333333] text-xs font-semibold text-[#D4D4D4] hover:bg-[#1C1C1C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting || !!reportSuccess}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {reporting ? 'Submitting...' : 'Submit Report to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
