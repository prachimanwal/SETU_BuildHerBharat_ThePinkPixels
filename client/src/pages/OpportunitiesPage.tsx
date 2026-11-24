import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X,
  RefreshCw,
  BookOpen,
  Landmark,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, extractArray, formatLocation, unwrapData } from '../utils/api';

type OppTab = 'all' | 'recommended' | 'saved';

const OFFICIAL_CAREER_PORTALS = [
  {
    name: 'National Career Service (NCS)',
    authority: 'Ministry of Labour & Employment, Govt. of India',
    description:
      'Verified national employment portal for government & private jobs, job fairs, and free career counseling across India.',
    url: 'https://www.ncs.gov.in/',
    badge: 'Official Govt Portal'
  },
  {
    name: 'National Apprenticeship Training Scheme (NATS 2.0)',
    authority: 'Ministry of Education, Govt. of India',
    description:
      'Paid 1-year apprenticeships at PSUs, government establishments, and leading private companies for Diploma & Degree graduates.',
    url: 'https://nats.education.gov.in/',
    badge: 'Graduate & Diploma'
  },
  {
    name: 'Apprenticeship India (NAPS)',
    authority: 'Ministry of Skill Development & Entrepreneurship',
    description:
      'Hands-on paid apprenticeships across IT, manufacturing, retail, healthcare, and trades for Class 10/12, ITI, Diploma, and Graduates.',
    url: 'https://www.apprenticeshipindia.gov.in/',
    badge: 'Paid Apprenticeships'
  },
  {
    name: 'PM Internship Scheme Portal',
    authority: 'Ministry of Corporate Affairs',
    description:
      '12-month corporate internship opportunities across top Indian companies for eligible youth (verify active cycle on portal).',
    url: 'https://pminternship.mca.gov.in/',
    badge: 'Corporate Internships'
  },
  {
    name: 'Startup India Hub',
    authority: 'DPIIT, Ministry of Commerce & Industry',
    description:
      'Explore DPIIT-recognized startups, innovation programs, incubators, and startup ecosystem opportunities.',
    url: 'https://www.startupindia.gov.in/',
    badge: 'Startup Ecosystem'
  }
];

export const OpportunitiesPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = Boolean(user);

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [savedOpps, setSavedOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<OppTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [restartOnly, setRestartOnly] = useState(false);

  // Interactive Modals
  const [detailOpp, setDetailOpp] = useState<any>(null);
  const [applyOpp, setApplyOpp] = useState<any>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  const [reportOpp, setReportOpp] = useState<any>(null);
  const [reportReason, setReportReason] = useState('fraud_or_scam');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadOpportunities = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (locationFilter.trim()) params.append('location', locationFilter.trim());
      if (workModeFilter !== 'all') params.append('workMode', workModeFilter);
      if (typeFilter !== 'all') params.append('opportunityType', typeFilter);
      if (restartOnly) params.append('isCareerRestart', 'true');

      const requests = [apiFetch(`/api/opportunities?${params.toString()}`)];
      if (isAuthenticated && user?.role === 'seeker') {
        requests.push(apiFetch('/api/opportunities/recommended'));
        requests.push(apiFetch('/api/opportunities/saved'));
      }

      const [oppRes, recRes, savedRes] = await Promise.all(requests);

      if (oppRes.ok) {
        setOpportunities(extractArray(oppRes.data, ['results', 'opportunities']));
      } else {
        setOpportunities([]);
        setLoadError(oppRes.error || 'Unable to load opportunities right now. Please try again.');
      }

      if (recRes && recRes.ok) {
        setRecommended(extractArray(recRes.data, ['results', 'opportunities']));
      } else {
        setRecommended([]);
      }

      if (savedRes && savedRes.ok) {
        setSavedOpps(extractArray(savedRes.data, ['results', 'opportunities']));
      } else {
        setSavedOpps([]);
      }
    } catch (err: any) {
      setOpportunities([]);
      setRecommended([]);
      setSavedOpps([]);
      setLoadError(err?.message || 'Unable to connect to SETU Opportunities service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [workModeFilter, typeFilter, restartOnly, isAuthenticated, user?.id, user?.profileCompletion]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOpportunities();
  };

  const handleToggleSave = async (oppId: string) => {
    if (!isAuthenticated) return;
    setSavingId(oppId);
    try {
      const res = await apiFetch(`/api/opportunities/${oppId}/save`, { method: 'POST' });
      if (res.ok) {
        const data = unwrapData(res.data) || {};
        const isSaved = Boolean(data.saved);

        setOpportunities((prev) =>
          prev.map((o) => (String(o._id) === oppId ? { ...o, isSaved } : o))
        );
        setRecommended((prev) =>
          prev.map((o) => (String(o._id) === oppId ? { ...o, isSaved } : o))
        );
        if (detailOpp && String(detailOpp._id) === oppId) {
          setDetailOpp((prev: any) => (prev ? { ...prev, isSaved } : null));
        }

        // Refresh saved list
        const savedRes = await apiFetch('/api/opportunities/saved');
        if (savedRes.ok) {
          setSavedOpps(extractArray(savedRes.data, ['results', 'opportunities']));
        }
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyOpp) return;
    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const res = await apiFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: applyOpp._id,
          coverNote: coverNote.trim()
        })
      });

      if (!res.ok) {
        const errText = res.error || 'Failed to submit application.';
        setApplyError(errText);
        toast.error(errText);
      } else {
        setApplySuccess(
          'Application submitted successfully! Track updates anytime in My Applications.'
        );
        toast.success('Application submitted successfully!');
        setOpportunities((prev) =>
          prev.map((o) =>
            String(o._id) === String(applyOpp._id) ? { ...o, hasApplied: true } : o
          )
        );
        setRecommended((prev) =>
          prev.map((o) =>
            String(o._id) === String(applyOpp._id) ? { ...o, hasApplied: true } : o
          )
        );
      }
    } catch (err: any) {
      setApplyError(err?.message || 'Network error while submitting application.');
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
          description: reportDesc.trim()
        })
      });
      if (res.ok) {
        setReportSuccess(
          'Thank you for helping keep SETU safe. Our moderation team will review this listing.'
        );
      }
    } finally {
      setReporting(false);
    }
  };

  const displayedList = useMemo(() => {
    if (activeTab === 'recommended') return recommended;
    if (activeTab === 'saved') return savedOpps;
    return opportunities;
  }, [activeTab, opportunities, recommended, savedOpps]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Verified Opportunities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#334155]">
          {language === 'hi'
            ? 'सत्यापित रोजगार एवं इंटर्नशिप अवसर 💼'
            : 'Opportunities Matched To Your Profile 💼'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
          Explore genuine employer listings posted on SETU with transparent profile matching, plus
          verified Government of India career and apprenticeship portals. SETU never displays fake
          jobs or unverified listings.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#3B9EE8] font-bold">{opportunities.length}</span> Live Employer
            Listings
          </div>
          {isAuthenticated && user?.role === 'seeker' && (
            <>
              <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
                <span className="text-emerald-600 font-bold">{savedOpps.length}</span> Saved Jobs
              </div>
              <Link
                to="/applications"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F] transition"
              >
                <span>Track My Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs & Search / Filter Panel */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 sm:p-5 shadow-baby-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all' as OppTab, label: 'All Opportunities' },
              ...(isAuthenticated && user?.role === 'seeker'
                ? [
                    { id: 'recommended' as OppTab, label: '✨ Recommended For You' },
                    { id: 'saved' as OppTab, label: `Saved Jobs (${savedOpps.length})` }
                  ]
                : [])
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8] shadow-baby-sm'
                    : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#334155] hover:bg-[#EAF7FF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isAuthenticated && (
            <Link to="/login" className="text-xs font-bold text-[#2589D6] hover:underline">
              Sign in for personalized job matching →
            </Link>
          )}
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Role, skill, or organization..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE] focus:bg-white"
            />
          </div>
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="City or State"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE] focus:bg-white"
            />
          </div>
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="md:col-span-2 px-3 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs font-semibold text-[#334155] outline-none"
          >
            <option value="all">Any Mode</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
          <button
            type="submit"
            className="md:col-span-2 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#EAF7FF]">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'full_time', label: 'Full-Time' },
              { id: 'part_time', label: 'Part-Time' },
              { id: 'entry_level', label: 'Entry-Level' },
              { id: 'internship', label: 'Internship' },
              { id: 'apprenticeship', label: 'Apprenticeship' },
              { id: 'freelance', label: 'Freelance' },
              { id: 'entrepreneurship', label: 'Entrepreneurship' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                  typeFilter === t.id
                    ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                    : 'bg-white text-[#64748B] border-[#D8ECFA] hover:bg-[#F8FCFF]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
            <input
              type="checkbox"
              checked={restartOnly}
              onChange={(e) => setRestartOnly(e.target.checked)}
              className="rounded border-[#A2D2FF] text-[#3B9EE8]"
            />
            <span>Career-Restart Friendly Only</span>
          </label>
        </div>
      </div>

      {/* Results Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 w-32 bg-[#EAF7FF] rounded-full" />
              <div className="h-6 w-3/4 bg-[#EAF7FF] rounded-lg" />
              <div className="h-16 w-full bg-[#F8FCFF] rounded-xl" />
              <div className="h-10 w-full bg-[#EAF7FF] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-baby-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-[#334155]">Unable to Load Opportunities</h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={loadOpportunities}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#D8ECFA] p-8 text-center space-y-3 shadow-baby-sm">
            <Building2 className="w-10 h-10 text-[#3B9EE8] mx-auto" />
            <h3 className="text-base font-bold text-[#334155]">
              {activeTab === 'saved'
                ? 'No Saved Opportunities Yet'
                : 'No Live SETU Employer Vacancies Match Right Now'}
            </h3>
            <p className="text-xs text-[#64748B] max-w-xl mx-auto leading-relaxed">
              {activeTab === 'saved'
                ? 'Bookmark any employer listing on SETU to compare and apply later.'
                : 'SETU displays only authentic employer-posted listings — we never fabricate fake jobs or companies. While verified SETU employers post new roles, you can apply immediately through the official Government of India career and apprenticeship portals below!'}
            </p>
            {(searchQuery || locationFilter || workModeFilter !== 'all' || typeFilter !== 'all' || restartOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('');
                  setWorkModeFilter('all');
                  setTypeFilter('all');
                  setRestartOnly(false);
                  setActiveTab('all');
                }}
                className="px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
              >
                Reset Search &amp; Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedList.map((opp) => {
            const matchingSkills: string[] = Array.isArray(opp.matchingSkills)
              ? opp.matchingSkills
              : [];
            const missingSkills: string[] = Array.isArray(opp.missingSkills)
              ? opp.missingSkills
              : [];
            const matchReasons: string[] = Array.isArray(opp.matchReasons)
              ? opp.matchReasons
              : [];

            return (
              <div
                key={opp._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm hover:border-[#60B6F8] hover:shadow-baby transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] uppercase">
                        {opp.opportunityType || 'Job'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F8FCFF] text-[#475569] border border-[#D8ECFA] capitalize">
                        {opp.workMode || 'Hybrid'}
                      </span>
                      {opp.isCareerRestart && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Career-Restart Friendly
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {typeof opp.matchScore === 'number' && (
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-gradient-to-r from-[#EAF7FF] to-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE]">
                          {opp.matchScore}% Match
                        </span>
                      )}
                      {isAuthenticated && user?.role === 'seeker' && (
                        <button
                          type="button"
                          disabled={savingId === String(opp._id)}
                          onClick={() => handleToggleSave(String(opp._id))}
                          className={`p-2 rounded-xl border transition ${
                            opp.isSaved
                              ? 'bg-[#EAF7FF] text-[#2589D6] border-[#60B6F8]'
                              : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#1E3A5F]'
                          }`}
                          aria-label={opp.isSaved ? 'Remove bookmark' : 'Save job'}
                        >
                          {opp.isSaved ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Org */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#334155] leading-snug">
                      {opp.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#64748B]">
                      <span className="font-semibold text-[#1E3A5F] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {opp.organisationName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#3B9EE8]" />
                        {formatLocation(opp.location)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3B9EE8]" />
                        {opp.stipendOrSalary || 'Competitive'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Why This Opportunity Matches You */}
                  {matchReasons.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1">
                      <p className="text-[11px] font-bold text-[#1E3A5F] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8]" />
                        <span>Why This Opportunity Matches You</span>
                      </p>
                      <ul className="space-y-0.5 text-[11px] text-[#475569]">
                        {matchReasons.slice(0, 3).map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                      {opp.academicEligibilityNote && (
                        <p className="text-[11px] text-amber-700 font-medium pt-0.5">
                          Note: {opp.academicEligibilityNote}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Skills & Skill Gap Learning Nudge */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {matchingSkills.map((sk, idx) => (
                        <span
                          key={`m-${idx}`}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                      {missingSkills.slice(0, 4).map((sk, idx) => (
                        <span
                          key={`x-${idx}`}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FCFF] text-[#64748B] border border-[#D8ECFA]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {missingSkills.length > 0 && (
                      <Link
                        to={`/learn?skill=${encodeURIComponent(missingSkills[0])}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2589D6] hover:underline"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          You&apos;re Almost There! 🩵 Learn {missingSkills[0]} on SETU
                        </span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#EAF7FF] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailOpp(opp)}
                      className="px-3.5 py-2 rounded-xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition"
                    >
                      View Details
                    </button>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportOpp(opp);
                          setReportSuccess('');
                          setReportDesc('');
                        }}
                        className="p-2 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Report suspicious listing"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {opp.hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Applied</span>
                    </span>
                  ) : opp.externalApplyUrl ? (
                    <a
                      href={opp.externalApplyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
                    >
                      <span>Apply Externally</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.warning('Please sign in as a Job Seeker to apply for opportunities.');
                          return;
                        }
                        setApplyOpp(opp);
                        setCoverNote('');
                        setApplyError('');
                        setApplySuccess('');
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clearly Labeled Verified Official Career & Government Employment Portals */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2589D6]">
              <Landmark className="w-3.5 h-3.5" />
              <span>Official National Portals</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#334155] font-display mt-0.5">
              Verified Government Career &amp; Apprenticeship Portals
            </h2>
            <p className="text-xs text-[#64748B]">
              Official external portals operated by Government of India ministries for verified jobs,
              internships, and paid apprenticeships (clearly separated from direct SETU employer
              listings).
            </p>
          </div>
          <Link
            to="/schemes"
            className="text-xs font-bold text-[#2589D6] hover:underline shrink-0"
          >
            Explore All Schemes →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_CAREER_PORTALS.map((portal) => (
            <div
              key={portal.url}
              className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1E3A5F] border border-[#BDE0FE]">
                  {portal.badge}
                </span>
                <h3 className="text-sm font-bold text-[#334155]">{portal.name}</h3>
                <p className="text-[11px] font-semibold text-[#2589D6]">{portal.authority}</p>
                <p className="text-xs text-[#64748B] leading-relaxed">{portal.description}</p>
              </div>
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
              >
                <span>Open Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* View Opportunity Details Modal */}
      {detailOpp && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#2589D6]">{detailOpp.organisationName}</p>
                <h3 className="text-lg font-extrabold text-[#334155] font-display">
                  {detailOpp.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {formatLocation(detailOpp.location)} • {detailOpp.workMode} •{' '}
                  {detailOpp.stipendOrSalary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpp(null)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#334155]">
              <p className="whitespace-pre-line text-[#475569] leading-relaxed">
                {detailOpp.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
                  <p className="font-bold text-[#1E3A5F]">Experience</p>
                  <p className="text-[#64748B] mt-0.5">
                    {detailOpp.experienceRequired || 'Fresher / Entry-Level Welcome'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
                  <p className="font-bold text-[#1E3A5F]">Duration / Type</p>
                  <p className="text-[#64748B] mt-0.5 capitalize">
                    {detailOpp.duration || detailOpp.opportunityType}
                  </p>
                </div>
              </div>
              {Array.isArray(detailOpp.requiredSkills) && detailOpp.requiredSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#334155] mb-1.5">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailOpp.requiredSkills.map((s: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#EAF7FF] bg-[#F8FCFF] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailOpp(null)}
                className="px-4 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-bold text-[#64748B]"
              >
                Close
              </button>
              {!detailOpp.hasApplied && !detailOpp.externalApplyUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const target = detailOpp;
                    setDetailOpp(null);
                    setApplyOpp(target);
                    setCoverNote('');
                    setApplyError('');
                    setApplySuccess('');
                  }}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Now Modal */}
      {applyOpp && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#2589D6]">Apply via SETU</p>
                <h3 className="text-base font-extrabold text-[#334155]">{applyOpp.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyOpp(null)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitApplication} className="p-5 space-y-4">
              {applyError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {applyError}
                </div>
              )}
              {applySuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <p className="font-bold">{applySuccess}</p>
                  <Link
                    to="/applications"
                    className="inline-flex items-center gap-1 text-[#2589D6] font-bold hover:underline"
                  >
                    <span>Go to My Applications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                      Short Cover Note (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Highlight your relevant skills, projects, or why you are excited about this role..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setApplyOpp(null)}
                      className="px-4 py-2 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-bold text-[#64748B]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm disabled:opacity-50"
                    >
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpp && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-[#EAF7FF] border-b border-[#D8ECFA] flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#334155]">Report Suspicious Listing</h3>
              <button
                type="button"
                onClick={() => setReportOpp(null)}
                className="p-1.5 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
              {reportSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {reportSuccess}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Reason
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                    >
                      <option value="fraud_or_scam">Suspected Fraud / Upfront Fee Demand</option>
                      <option value="misleading_info">Misleading Job Description</option>
                      <option value="harassment_or_unsafe">Unsafe / Inappropriate Content</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Additional Details
                    </label>
                    <textarea
                      rows={3}
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Describe what seemed suspicious..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportOpp(null)}
                      className="px-4 py-2 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-bold text-[#64748B]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reporting}
                      className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {reporting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
