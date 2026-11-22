import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ExternalLink,
  Search,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Scale,
  X,
  FileText,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray, unwrapData } from '../utils/api';

type SchemeTab = 'all' | 'recommended' | 'saved';

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'skill_training', label: 'Skill Training' },
  { id: 'internship', label: 'Internships & Apprenticeships' },
  { id: 'entrepreneurship_loan', label: 'Entrepreneurship & Startups' },
  { id: 'women_livelihood', label: 'Women & Livelihood' },
  { id: 'rural_employment', label: 'Employment & Career Services' }
];

const getEligibilityBadgeStyle = (status?: string) => {
  switch (status) {
    case 'Likely Eligible':
      return {
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: CheckCircle2
      };
    case 'More Information Required':
      return {
        cls: 'bg-[#EAF7FF] text-[#1E3A5F] border-[#BDE0FE]',
        icon: HelpCircle
      };
    case 'Not Eligible Based on Available Information':
      return {
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertCircle
      };
    default:
      return {
        cls: 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA]',
        icon: HelpCircle
      };
  }
};

export const GovernmentSchemesPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  const [schemes, setSchemes] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState<SchemeTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive modals & comparison
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadSchemes = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const requests = [apiFetch('/api/schemes')];
      if (isAuthenticated) {
        requests.push(apiFetch('/api/schemes/recommended'));
      }
      const [allRes, recRes] = await Promise.all(requests);

      if (allRes.ok) {
        setSchemes(extractArray(allRes.data, ['schemes', 'results']));
      } else {
        setSchemes([]);
        setLoadError(allRes.error || 'Could not load government schemes right now.');
      }

      if (recRes && recRes.ok) {
        setRecommended(extractArray(recRes.data, ['schemes', 'recommended']));
      } else {
        setRecommended([]);
      }
    } catch (err: any) {
      setSchemes([]);
      setRecommended([]);
      setLoadError(err?.message || 'Network error while fetching verified government schemes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [isAuthenticated, user?.id, user?.profileCompletion]);

  const handleToggleSave = async (schemeId: string) => {
    if (!isAuthenticated) return;
    setSavingId(schemeId);
    try {
      const res = await apiFetch(`/api/schemes/${schemeId}/save`, { method: 'POST' });
      if (res.ok) {
        const data = unwrapData(res.data) || {};
        const isSaved = Boolean(data.saved);
        setSchemes((prev) =>
          prev.map((s) => (String(s._id) === schemeId ? { ...s, isSaved } : s))
        );
        setRecommended((prev) =>
          prev.map((s) => (String(s._id) === schemeId ? { ...s, isSaved } : s))
        );
        if (selectedScheme && String(selectedScheme._id) === schemeId) {
          setSelectedScheme((prev: any) => (prev ? { ...prev, isSaved } : null));
        }
      }
    } finally {
      setSavingId(null);
    }
  };

  const toggleCompare = (schemeId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(schemeId)) return prev.filter((id) => id !== schemeId);
      if (prev.length >= 3) return prev;
      return [...prev, schemeId];
    });
  };

  const displayedSchemes = useMemo(() => {
    const base =
      activeTab === 'recommended'
        ? recommended
        : activeTab === 'saved'
        ? schemes.filter((s) => s.isSaved)
        : schemes;

    const q = searchQuery.trim().toLowerCase();
    return base.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (q) {
        const hay = [
          s.title,
          s.hindiTitle,
          s.ministry,
          s.description,
          s.benefitsSummary,
          s.eligibilitySummary,
          s.targetAudience
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, categoryFilter, searchQuery, schemes, recommended]);

  const comparedSchemes = useMemo(
    () => schemes.filter((s) => compareIds.includes(String(s._id))),
    [schemes, compareIds]
  );

  const savedCount = schemes.filter((s) => s.isSaved).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
          <Landmark className="w-3.5 h-3.5" />
          <span>Verified Government Schemes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#334155]">
          {language === 'hi'
            ? 'सरकारी योजनाएं एवं कौशल कार्यक्रम 🏛️'
            : 'Indian Government Skill & Employment Schemes 🏛️'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
          Explore verified national skilling, apprenticeship, internship, entrepreneurship, and
          livelihood programs with direct links to official Government of India portals. Eligibility
          indicators are guidance hints based on your profile — always confirm final criteria on the
          official portal before applying.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#3B9EE8] font-bold">{schemes.length}</span> Verified Schemes
          </div>
          {isAuthenticated && (
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
              <span className="text-emerald-600 font-bold">{savedCount}</span> Saved Bookmarks
            </div>
          )}
          {compareIds.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Selected ({compareIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 sm:p-5 shadow-baby-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all' as SchemeTab, label: 'All Schemes' },
              ...(isAuthenticated
                ? [
                    { id: 'recommended' as SchemeTab, label: '✨ Recommended For You' },
                    { id: 'saved' as SchemeTab, label: `Saved (${savedCount})` }
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
            <Link
              to="/login"
              className="text-xs font-bold text-[#2589D6] hover:underline"
            >
              Sign in for personalized eligibility hints →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#EAF7FF]">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                categoryFilter === cat.id
                  ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                  : 'bg-white text-[#64748B] border-[#D8ECFA] hover:bg-[#F8FCFF]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PMKVY, NAPS, NATS, MUDRA, Stand-Up India, PM Vishwakarma, Startup India..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE] focus:bg-white"
          />
        </div>
      </div>

      {/* Content */}
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
          <h3 className="text-base font-bold text-[#334155]">
            Unable to Load Government Schemes
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={loadSchemes}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : displayedSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-10 text-center space-y-2 shadow-baby-sm">
          <p className="text-sm font-bold text-[#334155]">
            {activeTab === 'saved'
              ? 'You have not saved any government schemes yet.'
              : 'No government schemes match your search or filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
          >
            Show All Verified Schemes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedSchemes.map((scheme) => {
            const badge = getEligibilityBadgeStyle(scheme.eligibilityStatus);
            const BadgeIcon = badge.icon;
            const isCompared = compareIds.includes(String(scheme._id));

            return (
              <div
                key={scheme._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm hover:border-[#60B6F8] hover:shadow-baby transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Ministry + Save/Compare */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#2589D6] bg-[#EAF7FF] px-3 py-1 rounded-full border border-[#BDE0FE]">
                      {scheme.ministry}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleCompare(String(scheme._id))}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          isCompared
                            ? 'bg-[#3B9EE8] text-white border-[#3B9EE8]'
                            : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#1E3A5F]'
                        }`}
                        title="Select up to 3 schemes to compare"
                      >
                        {isCompared ? 'Comparing ✓' : 'Compare'}
                      </button>

                      {isAuthenticated && (
                        <button
                          type="button"
                          disabled={savingId === String(scheme._id)}
                          onClick={() => handleToggleSave(String(scheme._id))}
                          className={`p-2 rounded-xl border transition ${
                            scheme.isSaved
                              ? 'bg-[#EAF7FF] text-[#2589D6] border-[#60B6F8]'
                              : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#1E3A5F]'
                          }`}
                          aria-label={scheme.isSaved ? 'Remove saved scheme' : 'Save scheme'}
                        >
                          {scheme.isSaved ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#334155] leading-snug">
                      {language === 'hi' && scheme.hindiTitle ? scheme.hindiTitle : scheme.title}
                    </h3>
                    {scheme.description && (
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                        {scheme.description}
                      </p>
                    )}
                  </div>

                  {/* Eligibility Guidance Badge */}
                  <div className={`p-3 rounded-2xl border text-xs space-y-1 ${badge.cls}`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{scheme.eligibilityStatus || 'Eligibility Not Assessed'}</span>
                    </div>
                    {scheme.eligibilityExplanation && (
                      <p className="text-[11px] opacity-90 leading-relaxed">
                        {scheme.eligibilityExplanation}
                      </p>
                    )}
                  </div>

                  {/* Key Benefits */}
                  <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1">
                    <p className="text-[11px] font-bold text-[#1E3A5F] uppercase tracking-wider">
                      Key Benefits
                    </p>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      {scheme.benefitsSummary}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#EAF7FF] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      Reviewed: {scheme.lastReviewedDate || '2026-03-01'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Official Portal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedScheme(scheme)}
                      className="py-2.5 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition"
                    >
                      View Full Details
                    </button>
                    <a
                      href={scheme.applicationUrl || scheme.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#2589D6]">
                  {selectedScheme.ministry}
                </span>
                <h3 className="text-lg font-extrabold text-[#334155] font-display mt-0.5">
                  {selectedScheme.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#334155]">
              {selectedScheme.description && (
                <p className="text-[#475569] leading-relaxed">{selectedScheme.description}</p>
              )}

              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                <p className="text-xs font-bold text-[#1E3A5F] uppercase">Benefits Summary</p>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {selectedScheme.benefitsSummary}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                <p className="text-xs font-bold text-[#1E3A5F] uppercase">Eligibility Overview</p>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {selectedScheme.eligibilitySummary}
                </p>
                {selectedScheme.eligibilityExplanation && (
                  <p className="text-xs font-semibold text-[#2589D6] pt-1">
                    Profile Hint ({selectedScheme.eligibilityStatus}):{' '}
                    {selectedScheme.eligibilityExplanation}
                  </p>
                )}
              </div>

              {Array.isArray(selectedScheme.requiredDocuments) &&
                selectedScheme.requiredDocuments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F] uppercase">
                      <FileText className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      <span>Typically Required Documents</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-[#475569]">
                      {selectedScheme.requiredDocuments.map((doc: string, idx: number) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedScheme.applicationProcess && (
                <div className="p-4 rounded-2xl bg-[#EAF7FF]/50 border border-[#BDE0FE] space-y-1.5">
                  <p className="text-xs font-bold text-[#1E3A5F] uppercase">How to Apply</p>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {selectedScheme.applicationProcess}
                  </p>
                  {selectedScheme.applicationStatus && (
                    <p className="text-[11px] font-semibold text-[#2589D6]">
                      Status: {selectedScheme.applicationStatus}
                    </p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-[#64748B]">
                Last reviewed: {selectedScheme.lastReviewedDate || '2026-03-01'}. SETU provides
                curated public scheme guidance and links directly to official Government of India
                portals; please confirm final rules on the official portal.
              </p>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#EAF7FF] bg-[#F8FCFF] flex flex-wrap items-center justify-between gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => handleToggleSave(String(selectedScheme._id))}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold"
                >
                  {selectedScheme.isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#2589D6]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save Scheme</span>
                    </>
                  )}
                </button>
              )}

              <a
                href={selectedScheme.applicationUrl || selectedScheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition ml-auto"
              >
                <span>Visit Official Government Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {showCompareModal && comparedSchemes.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#3B9EE8]" />
                <h3 className="text-lg font-extrabold text-[#334155] font-display">
                  Compare Government Schemes ({comparedSchemes.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D8ECFA]">
                    <th className="p-3 font-bold text-[#64748B] w-36">Criteria</th>
                    {comparedSchemes.map((s) => (
                      <th key={s._id} className="p-3 font-extrabold text-[#1E3A5F]">
                        {s.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF7FF]">
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Ministry</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3 text-[#475569]">
                        {s.ministry}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Profile Hint</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3 font-semibold text-[#1E3A5F]">
                        {s.eligibilityStatus}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Benefits</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3 text-[#475569]">
                        {s.benefitsSummary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Eligibility</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3 text-[#475569]">
                        {s.eligibilitySummary}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Status</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3 text-[#475569]">
                        {s.applicationStatus}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#334155]">Official Link</td>
                    {comparedSchemes.map((s) => (
                      <td key={s._id} className="p-3">
                        <a
                          href={s.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#2589D6] font-bold hover:underline"
                        >
                          <span>Open Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#EAF7FF] bg-[#F8FCFF] flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setCompareIds([]);
                  setShowCompareModal(false);
                }}
                className="text-xs font-semibold text-[#64748B] hover:text-[#334155]"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
