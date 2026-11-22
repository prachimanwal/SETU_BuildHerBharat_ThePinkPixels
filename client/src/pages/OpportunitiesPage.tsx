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
import { apiFetch, extractArray, formatLocation, unwrapData } from '../utils/api';

export const OpportunitiesPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (locationFilter) params.append('location', locationFilter);
      if (workModeFilter !== 'all') params.append('workMode', workModeFilter);
      if (typeFilter !== 'all') params.append('opportunityType', typeFilter);
      if (restartOnly) params.append('isCareerRestart', 'true');

      const [oppRes, savedRes] = await Promise.all([
        apiFetch(`/api/public/opportunities?${params.toString()}`),
        user?.role === 'seeker'
          ? apiFetch('/api/seeker/saved-opportunities')
          : Promise.resolve(null)
      ]);

      if (oppRes.ok) {
        const list = extractArray(oppRes.data, ['results']);
        setOpportunities(list);
      } else {
        setOpportunities([]);
        setLoadError(oppRes.error || 'Unable to load opportunities right now. Please try again.');
      }

      if (savedRes && savedRes.ok) {
        const sList = extractArray(savedRes.data);
        setSavedIds(
          sList.map((s: any) => (typeof s === 'string' ? s : s?._id || s?.opportunityId || '')).filter(Boolean)
        );
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setOpportunities([]);
      setLoadError('Unable to load opportunities right now. Please try again.');
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
      const res = await apiFetch('/api/seeker/saved-opportunities/toggle', {
        method: 'POST',
        body: JSON.stringify({ opportunityId: oppId })
      });

      if (res.ok) {
        const payload = unwrapData(res.data) || res.data;
        if (payload?.saved) {
          setSavedIds((prev) => (prev.includes(oppId) ? prev : [...prev, oppId]));
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
      const res = await apiFetch('/api/seeker/applications/apply', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: applyOpp._id,
          coverNote
        })
      });

      if (!res.ok) {
        setApplyError(res.error || 'Failed to submit application');
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
      const res = await apiFetch('/api/seeker/report', {
        method: 'POST',
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
      <div className="space-y-1 pb-4 border-b border-[#D8ECFA]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2589D6]">
          <Briefcase className="w-4 h-4" />
          <span>Stage 6: Find Opportunities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#334155]">
          {language === 'hi' ? 'खोजें और आवेदन करें' : 'Explore Verified Opportunities'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl">
          Search jobs, apprenticeships, internships, and freelance projects. Each listing shows transparent matching reasons derived from your verified skills and preferences.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-[#D8ECFA] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skills (Canva, Excel)..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#BDE0FE] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location (e.g. Gurugram, Remote, Haryana)"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#BDE0FE] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold rounded-lg text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#EAF7FF] text-xs">
          <div className="flex items-center space-x-1 text-[#64748B] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#BDE0FE] bg-white text-[#475569] font-medium outline-none focus:ring-2 focus:ring-[#BDE0FE]"
          >
            <option value="all">All Work Modes</option>
            <option value="remote">100% Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#BDE0FE] bg-white text-[#475569] font-medium outline-none focus:ring-2 focus:ring-[#BDE0FE]"
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
        <div className="text-center py-16 text-[#64748B]">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm">Finding matched opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-2">
          <Briefcase className="w-10 h-10 text-[#64748B] mx-auto" />
          <h4 className="font-bold text-[#334155] text-base">No matching opportunities found</h4>
          <p className="text-xs text-[#64748B]">
            Try adjusting your search query, location filter, or work mode preference.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
            <span>Showing {opportunities.length} credible opportunities</span>
            <span className="flex items-center space-x-1 text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Only approved employers appear in discovery</span>
            </span>
          </div>

          {loadError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {(Array.isArray(opportunities) ? opportunities : []).map((item: any, idx: number) => {
              const opp = item?.opportunity || item;
              if (!opp || typeof opp !== 'object') return null;
              const isSaved = savedIds.includes(opp._id);
              const matchScore = item?.matchScore ?? opp.matchScore ?? 50;
              const matchReasons: string[] = Array.isArray(item?.matchReasons)
                ? item.matchReasons
                : Array.isArray(opp.matchingSkills) && opp.matchingSkills.length > 0
                ? opp.matchingSkills.map((sk: string) => `Matches skill: ${sk}`)
                : opp.matchExplanation
                ? [opp.matchExplanation]
                : [];

              return (
                <div
                  key={opp._id || idx}
                  className="bg-white rounded-2xl border border-[#D8ECFA] p-5 sm:p-6 shadow-sm hover:border-[#A2D2FF] transition space-y-4"
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
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold font-serif text-[#334155] pt-1">
                        {opp.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#64748B] font-medium">
                        {opp.organisationName || 'Verified Employer'} • {formatLocation(opp.location)}
                      </p>
                    </div>

                    {/* Match Score & Bookmark */}
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]">
                        {matchScore}% Match
                      </span>
                      {user?.role === 'seeker' && (
                        <button
                          onClick={() => handleToggleSave(opp._id)}
                          className={`p-2 rounded-lg border transition ${
                            isSaved
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : 'border-[#D8ECFA] text-[#64748B] hover:text-[#475569] hover:bg-[#F8FCFF]'
                          }`}
                          title={isSaved ? 'Bookmarked' : 'Save opportunity'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Explainability Badges */}
                  {matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-[#F8FCFF] rounded-xl border border-[#D8ECFA]/60 text-xs">
                      <span className="font-bold text-[#475569] flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Why this matches you:</span>
                      </span>
                      {matchReasons.map((reason: string, rIdx: number) => (
                        <span
                          key={rIdx}
                          className="bg-white text-[#334155] px-2.5 py-0.5 rounded-md border border-[#D8ECFA] font-medium flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{reason}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 text-xs text-[#64748B]">
                    <span className="bg-[#EAF7FF] px-2.5 py-1 rounded font-medium">
                      Mode: <strong className="text-[#334155]">{(opp.workMode || 'hybrid').toUpperCase()}</strong>
                    </span>
                    <span className="bg-[#EAF7FF] px-2.5 py-1 rounded font-medium">
                      Type: <strong className="text-[#334155]">{(opp.opportunityType || 'job').replace('_', ' ')}</strong>
                    </span>
                    <span className="bg-[#EAF7FF] px-2.5 py-1 rounded font-medium">
                      Compensation: <strong className="text-emerald-600">{opp.stipendOrSalary || opp.salaryOrStipend || 'Competitive'}</strong>
                    </span>
                    {opp.experienceRequired && (
                      <span className="bg-[#EAF7FF] px-2.5 py-1 rounded font-medium">
                        Experience: <strong className="text-[#334155]">{opp.experienceRequired}</strong>
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-[#EAF7FF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 text-xs text-[#64748B]">
                      <button
                        onClick={() => {
                          setReportOpp(opp);
                          setReportSuccess('');
                        }}
                        className="text-[#64748B] hover:text-rose-600 transition flex items-center space-x-1"
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
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <span>Apply on Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleOpenApply(opp)}
                          className="px-5 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-[#EAF7FF]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#D8ECFA] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#D8ECFA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
                  Direct SETU Application
                </span>
                <h3 className="font-bold text-[#334155] text-base font-serif">{applyOpp.title}</h3>
                <p className="text-xs text-[#64748B]">{applyOpp.organisationName}</p>
              </div>
              <button
                onClick={() => setApplyOpp(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EAF7FF]"
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

              <div className="p-3.5 bg-[#EAF7FF]/70 border border-[#BDE0FE] rounded-xl text-xs space-y-1">
                <span className="font-bold text-orange-950 block">Portfolio Snapshot Attached:</span>
                <p className="text-[#2589D6] text-[11px] leading-relaxed">
                  Your public portfolio projects and verified assessment scores will be automatically shared with {applyOpp.organisationName}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Cover Note / Introduction for Recruiter
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Introduce yourself, mention your key practical skills, and your availability..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#D8ECFA]">
                <button
                  type="button"
                  onClick={() => setApplyOpp(null)}
                  className="px-4 py-2 rounded-lg border border-[#BDE0FE] text-xs font-semibold text-[#475569] hover:bg-[#EAF7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying || !!applySuccess}
                  className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-[#EAF7FF]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#D8ECFA] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#D8ECFA] flex items-center justify-between">
              <h3 className="font-bold text-[#334155] text-base font-serif flex items-center space-x-1.5 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <span>Report Suspicious Listing</span>
              </h3>
              <button
                onClick={() => setReportOpp(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EAF7FF]"
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
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Reason for Reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e: any) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="fraud_or_scam">Fraud / Fake Job Scam</option>
                  <option value="fee_charged">Charging Money / Registration Fee</option>
                  <option value="inaccurate_details">Inaccurate / Misleading Details</option>
                  <option value="unsafe_conditions">Unsafe or Exploitative Conditions</option>
                  <option value="other">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Description of Issue *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Explain why this listing is suspicious. The SETU administration moderates reports promptly."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#D8ECFA]">
                <button
                  type="button"
                  onClick={() => setReportOpp(null)}
                  className="px-4 py-2 rounded-lg border border-[#BDE0FE] text-xs font-semibold text-[#475569] hover:bg-[#EAF7FF]"
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
