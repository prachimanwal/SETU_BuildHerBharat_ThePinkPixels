import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Code2,
  Sparkles,
  Award,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Compass,
  PlayCircle,
  FileCheck,
  Check,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray } from '../utils/api';

type SectionTab =
  | 'all'
  | 'recommended'
  | 'tutorial'
  | 'practical_assignment'
  | 'learning_path'
  | 'continue'
  | 'completed';

const SECTION_TABS: Array<{ id: SectionTab; label: string }> = [
  { id: 'all', label: 'All Resources' },
  { id: 'recommended', label: 'Recommended For You' },
  { id: 'tutorial', label: 'Tutorials' },
  { id: 'practical_assignment', label: 'Practice Assignments' },
  { id: 'learning_path', label: 'Learning Paths' },
  { id: 'continue', label: 'Continue Learning' },
  { id: 'completed', label: 'Completed' }
];

const CATEGORIES = [
  'All',
  'Programming',
  'Data and AI',
  'Business',
  'Creative',
  'Professional Development'
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const isValidWebLink = (url: string) => {
  if (!url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const LearnPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState<SectionTab>('all');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('skill') || '');

  // Active workspace modal
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [kcAnswers, setKcAnswers] = useState<Record<number, number>>({});
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalNotice, setModalNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [allRes, recRes] = await Promise.all([
        apiFetch('/api/learning'),
        apiFetch('/api/learning/recommended')
      ]);

      if (allRes.ok) {
        const list = extractArray(allRes.data, ['resources', 'learning']);
        setResources(list);

        // Open deep-linked resource if present in query params
        const targetId = searchParams.get('resource');
        if (targetId) {
          const found = list.find((r) => String(r._id) === targetId);
          if (found) openWorkspace(found);
        }
      } else {
        setResources([]);
        setLoadError(allRes.error || 'Could not load learning resources right now.');
      }

      if (recRes.ok) {
        setRecommended(extractArray(recRes.data, ['resources', 'recommended']));
      } else {
        setRecommended([]);
      }
    } catch (err: any) {
      setResources([]);
      setRecommended([]);
      setLoadError(err?.message || 'Unable to connect to SETU Learning API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.profileCompletion]);

  useEffect(() => {
    const skillParam = searchParams.get('skill');
    if (skillParam) {
      setSearchQuery(skillParam);
    }
  }, [searchParams]);

  const openWorkspace = (resource: any) => {
    setSelectedResource(resource);
    setCompletedSteps(Array.isArray(resource.completedSteps) ? resource.completedSteps : []);
    setKcAnswers({});
    setSubmissionUrl(resource.submissionUrl || '');
    setSubmissionText(resource.submissionText || '');
    setModalError('');
    setModalNotice('');
  };

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIndex) ? prev.filter((i) => i !== stepIndex) : [...prev, stepIndex]
    );
  };

  const handleSaveProgress = async (status: 'started' | 'in_progress' | 'completed') => {
    if (!selectedResource) return;
    setModalError('');
    setModalNotice('');

    if (submissionUrl.trim() && !isValidWebLink(submissionUrl)) {
      setModalError('Please enter a valid http:// or https:// URL (e.g. GitHub, Google Drive, or live site).');
      return;
    }

    if (
      status === 'completed' &&
      selectedResource.type === 'practical_assignment' &&
      !submissionUrl.trim() &&
      !submissionText.trim()
    ) {
      setModalError('Please provide either your project link (URL) or solution summary before submitting.');
      return;
    }

    setSavingProgress(true);
    try {
      const res = await apiFetch(`/api/learning/${selectedResource._id}/progress`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          completedSteps,
          submissionUrl: submissionUrl.trim(),
          submissionText: submissionText.trim()
        })
      });

      if (!res.ok) {
        setModalError(res.error || 'Could not save progress right now.');
      } else {
        setModalNotice(
          status === 'completed'
            ? selectedResource.type === 'practical_assignment'
              ? 'Assignment submitted and saved to your Learning History & Portfolio! 🩵'
              : 'Marked as completed and saved to your Learning History! 🩵'
            : 'Progress saved! You can continue anytime.'
        );
        await loadData();
        setSelectedResource((prev: any) =>
          prev
            ? {
                ...prev,
                progressStatus: status,
                completedSteps,
                submissionUrl: submissionUrl.trim(),
                submissionText: submissionText.trim()
              }
            : null
        );
      }
    } catch (err: any) {
      setModalError(err?.message || 'Network error while saving progress.');
    } finally {
      setSavingProgress(false);
    }
  };

  const filteredResources = useMemo(() => {
    const baseList = activeTab === 'recommended' ? recommended : resources;
    const q = searchQuery.trim().toLowerCase();

    return baseList.filter((item) => {
      if (activeTab === 'tutorial' && item.type !== 'tutorial' && item.type !== 'course') {
        return false;
      }
      if (activeTab === 'practical_assignment' && item.type !== 'practical_assignment') {
        return false;
      }
      if (activeTab === 'learning_path' && item.type !== 'learning_path') {
        return false;
      }
      if (
        activeTab === 'continue' &&
        item.progressStatus !== 'started' &&
        item.progressStatus !== 'in_progress'
      ) {
        return false;
      }
      if (activeTab === 'completed' && item.progressStatus !== 'completed') {
        return false;
      }
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }
      if (difficultyFilter !== 'All' && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (q) {
        const hay = [
          item.title,
          item.description,
          item.category,
          item.skillTag,
          ...(Array.isArray(item.skillsGained) ? item.skillsGained : [])
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, activeCategory, difficultyFilter, searchQuery, resources, recommended]);

  const inProgressCount = resources.filter(
    (r) => r.progressStatus === 'started' || r.progressStatus === 'in_progress'
  ).length;
  const completedCount = resources.filter((r) => r.progressStatus === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Learn &amp; Practice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#334155]">
          {language === 'hi' ? 'व्यावहारिक शिक्षा व अभ्यास' : 'Learn & Practice Hub 📚'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
          Build practical skills through guided tutorials, real-world assignments, and structured
          learning paths tailored to your profile and assessment gaps. Completed practical
          assignments automatically strengthen your SETU Portfolio!
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#3B9EE8] font-bold">{resources.length}</span> Learning Resources
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#2589D6] font-bold">{inProgressCount}</span> In Progress
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-emerald-600 font-bold">{completedCount}</span> Completed
          </div>
          <Link
            to="/assess"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F] transition"
          >
            <Award className="w-3.5 h-3.5 text-[#3B9EE8]" />
            <span>Verify Skills via Assessments</span>
          </Link>
        </div>
      </div>

      {/* Section Tabs + Filters */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 sm:p-5 shadow-baby-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8] shadow-baby-sm'
                  : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#334155] hover:bg-[#EAF7FF]'
              }`}
            >
              {tab.id === 'recommended' ? `✨ ${tab.label}` : tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAF7FF]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                activeCategory === cat
                  ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8]'
                  : 'bg-white text-[#64748B] border-[#D8ECFA] hover:bg-[#F8FCFF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Python, SQL, Excel, Portfolio, UI/UX, Marketing..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE] focus:bg-white"
            />
          </div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs font-semibold text-[#334155] outline-none"
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff === 'All' ? 'All Difficulty Levels' : diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error / Resource Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 w-28 bg-[#EAF7FF] rounded-full" />
              <div className="h-5 w-4/5 bg-[#EAF7FF] rounded-lg" />
              <div className="h-14 w-full bg-[#F8FCFF] rounded-xl" />
              <div className="h-10 w-full bg-[#EAF7FF] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-baby-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-[#334155]">
            Unable to Load Learning Resources
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">{loadError}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-10 text-center space-y-2 shadow-baby-sm">
          <p className="text-sm font-bold text-[#334155]">
            {activeTab === 'continue'
              ? 'You have no in-progress resources yet.'
              : activeTab === 'completed'
              ? 'No completed learning resources yet — start your first tutorial or assignment!'
              : 'No learning resources match your current filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setActiveCategory('All');
              setDifficultyFilter('All');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
          >
            Browse All Learning Resources
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((item) => {
            const typeBadge =
              item.type === 'practical_assignment'
                ? { label: 'Practice Assignment', icon: Code2, cls: 'bg-[#D6EEFF] text-[#1E3A5F]' }
                : item.type === 'learning_path'
                ? { label: 'Learning Path', icon: Compass, cls: 'bg-[#EAF7FF] text-[#1E3A5F]' }
                : { label: 'Tutorial', icon: PlayCircle, cls: 'bg-[#F8FCFF] text-[#2589D6]' };
            const TypeIcon = typeBadge.icon;
            const isDone = item.progressStatus === 'completed';
            const isInProgress =
              item.progressStatus === 'started' || item.progressStatus === 'in_progress';

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm hover:border-[#60B6F8] hover:shadow-baby transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#BDE0FE] ${typeBadge.cls}`}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {typeBadge.label}
                    </span>

                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FCFF] text-[#64748B] border border-[#D8ECFA]">
                        {item.difficulty || 'Beginner'}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-[#3B9EE8]">{item.category}</p>
                    <h3 className="font-bold text-[#334155] text-base leading-snug mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.recommendationReason && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1E3A5F] bg-[#EAF7FF]/80 px-3 py-1.5 rounded-xl border border-[#BDE0FE]">
                      <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8] shrink-0" />
                      <span>{item.recommendationReason}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(item.skillsGained) && item.skillsGained.length > 0
                      ? item.skillsGained
                      : [item.skillTag]
                    )
                      .slice(0, 3)
                      .map((sk: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FCFF] text-[#475569] border border-[#D8ECFA]"
                        >
                          {sk}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAF7FF] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {item.duration}
                    </span>
                    <span className="truncate max-w-[160px]">{item.targetAudience}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openWorkspace(item)}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-baby-sm"
                  >
                    <span>
                      {isDone
                        ? 'Review Resource'
                        : isInProgress
                        ? 'Continue Learning'
                        : item.type === 'practical_assignment'
                        ? 'Open Assignment'
                        : item.type === 'learning_path'
                        ? 'Explore Path'
                        : 'Start Tutorial'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Tutorial / Assignment / Learning Path Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F] uppercase">
                    {selectedResource.category}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {selectedResource.difficulty} • {selectedResource.duration}
                  </span>
                  {selectedResource.progressStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#334155] font-display mt-1">
                  {selectedResource.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="p-2 rounded-xl text-[#64748B] hover:bg-white hover:text-[#334155]"
                aria-label="Close workspace"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm text-[#334155]">
              {modalError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modalNotice}</span>
                </div>
              )}

              {/* Learning Objectives */}
              {Array.isArray(selectedResource.learningObjectives) &&
                selectedResource.learningObjectives.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2589D6]">
                      What You Will Learn
                    </p>
                    <ul className="space-y-1.5 text-xs text-[#475569]">
                      {selectedResource.learningObjectives.map((obj: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* TUTORIAL CONTENT */}
              {selectedResource.type === 'tutorial' && selectedResource.tutorialContent && (
                <div className="space-y-5">
                  {selectedResource.tutorialContent.overview && (
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {selectedResource.tutorialContent.overview}
                    </p>
                  )}

                  {/* Step-by-step interactive lessons */}
                  {Array.isArray(selectedResource.tutorialContent.steps) &&
                    selectedResource.tutorialContent.steps.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                          Guided Steps (Check off as you learn)
                        </p>
                        {selectedResource.tutorialContent.steps.map((step: any, idx: number) => {
                          const checked = completedSteps.includes(idx);
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border space-y-2.5 transition ${
                                checked
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : 'bg-[#F8FCFF] border-[#D8ECFA]'
                              }`}
                            >
                              <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleStep(idx)}
                                  className="mt-1 rounded border-[#A2D2FF] text-[#3B9EE8]"
                                />
                                <div>
                                  <p className="font-bold text-[#334155] text-sm">{step.title}</p>
                                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                                    {step.content}
                                  </p>
                                </div>
                              </label>
                              {step.codeOrExample && (
                                <pre className="p-3 rounded-xl bg-white border border-[#D8ECFA] text-[11px] font-mono text-[#1E3A5F] overflow-x-auto">
                                  <code>{step.codeOrExample}</code>
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Practice Exercises */}
                  {Array.isArray(selectedResource.tutorialContent.exercises) &&
                    selectedResource.tutorialContent.exercises.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#EAF7FF]/50 border border-[#BDE0FE] space-y-2">
                        <p className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                          Hands-On Practice Exercises
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#334155]">
                          {selectedResource.tutorialContent.exercises.map((ex: string, i: number) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Knowledge Checks */}
                  {Array.isArray(selectedResource.tutorialContent.knowledgeChecks) &&
                    selectedResource.tutorialContent.knowledgeChecks.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                          Quick Knowledge Check
                        </p>
                        {selectedResource.tutorialContent.knowledgeChecks.map(
                          (kc: any, kcIdx: number) => {
                            const picked = kcAnswers[kcIdx];
                            const answered = picked !== undefined;
                            const isRight = picked === kc.answerIndex;
                            return (
                              <div
                                key={kcIdx}
                                className="p-4 rounded-2xl bg-white border border-[#D8ECFA] space-y-2.5"
                              >
                                <p className="text-xs font-bold text-[#334155]">{kc.question}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(kc.options || []).map((opt: string, optIdx: number) => (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() =>
                                        setKcAnswers((prev) => ({ ...prev, [kcIdx]: optIdx }))
                                      }
                                      className={`text-left px-3 py-2 rounded-xl border text-xs transition ${
                                        picked === optIdx
                                          ? optIdx === kc.answerIndex
                                            ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                                            : 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                                          : 'bg-[#F8FCFF] border-[#D8ECFA] hover:border-[#60B6F8]'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                                {answered && (
                                  <p
                                    className={`text-xs font-medium ${
                                      isRight ? 'text-emerald-700' : 'text-amber-700'
                                    }`}
                                  >
                                    {isRight ? '✓ Correct! ' : 'Not quite — '}
                                    {kc.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                </div>
              )}

              {/* PRACTICAL ASSIGNMENT WORKSPACE */}
              {selectedResource.type === 'practical_assignment' && (
                <div className="space-y-4">
                  {selectedResource.assignmentDetails?.objective && (
                    <div className="p-4 rounded-2xl bg-[#EAF7FF]/60 border border-[#BDE0FE]">
                      <p className="text-xs font-bold text-[#1E3A5F] uppercase mb-1">
                        Assignment Objective
                      </p>
                      <p className="text-xs text-[#334155]">
                        {selectedResource.assignmentDetails.objective}
                      </p>
                    </div>
                  )}

                  {Array.isArray(selectedResource.assignmentDetails?.instructions) &&
                    selectedResource.assignmentDetails.instructions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                          Step-by-Step Instructions
                        </p>
                        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-[#475569]">
                          {selectedResource.assignmentDetails.instructions.map(
                            (inst: string, i: number) => (
                              <li key={i}>{inst}</li>
                            )
                          )}
                        </ol>
                      </div>
                    )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.isArray(selectedResource.assignmentDetails?.deliverables) && (
                      <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                        <p className="text-[11px] font-bold text-[#1E3A5F] uppercase">
                          Expected Deliverables
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-[#475569]">
                          {selectedResource.assignmentDetails.deliverables.map(
                            (d: string, i: number) => (
                              <li key={i}>{d}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(selectedResource.assignmentDetails?.evaluationCriteria) && (
                      <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                        <p className="text-[11px] font-bold text-[#1E3A5F] uppercase">
                          Evaluation Checklist
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-[#475569]">
                          {selectedResource.assignmentDetails.evaluationCriteria.map(
                            (c: string, i: number) => (
                              <li key={i}>{c}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Submission Form */}
                  <div className="p-4 rounded-2xl bg-white border border-[#BDE0FE] space-y-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#3B9EE8]" />
                      <p className="text-xs font-bold text-[#334155]">Submit Your Work</p>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedResource.assignmentDetails?.submissionRequirements ||
                        'Share a link to your project (GitHub, Drive, live URL) or paste your structured solution below.'}
                    </p>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                        Project / Document Link (Optional — must start with https://)
                      </label>
                      <input
                        type="url"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="https://github.com/yourname/project or https://docs.google.com/..."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                        Solution Notes / Implementation Summary
                      </label>
                      <textarea
                        rows={4}
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Summarize your approach, formulas/queries used, or paste your drafted deliverables..."
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LEARNING PATH ROADMAP */}
              {selectedResource.type === 'learning_path' &&
                Array.isArray(selectedResource.learningPathSteps) && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                      Structured Roadmap Stages (Check off completed stages)
                    </p>
                    {selectedResource.learningPathSteps.map((st: any, idx: number) => {
                      const checked = completedSteps.includes(idx);
                      return (
                        <label
                          key={idx}
                          className={`block p-4 rounded-2xl border cursor-pointer transition ${
                            checked
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-[#F8FCFF] border-[#D8ECFA]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStep(idx)}
                              className="mt-1 rounded border-[#A2D2FF] text-[#3B9EE8]"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="font-bold text-sm text-[#334155]">{st.title}</p>
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#D8ECFA] text-[#2589D6]">
                                  {st.duration}
                                </span>
                              </div>
                              <p className="text-xs text-[#64748B] mt-1">{st.summary}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

              {/* Official External Documentation Reference */}
              {selectedResource.contentUrl && (
                <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] font-bold text-[#334155]">
                      Official Reference Documentation
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {selectedResource.contentSourceLabel || selectedResource.contentUrl}
                    </p>
                  </div>
                  <a
                    href={selectedResource.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
                  >
                    <span>Open Official Guide</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <p className="text-[11px] text-[#64748B] italic">
                Note: Completing learning resources updates your Learning History &amp; Portfolio. To
                earn a Verified Skill Badge on your profile, pass the matching evaluation in{' '}
                <Link
                  to="/assess"
                  onClick={() => setSelectedResource(null)}
                  className="text-[#2589D6] font-semibold hover:underline"
                >
                  Skill Assessments
                </Link>
                .
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#EAF7FF] bg-[#F8FCFF] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={savingProgress}
                onClick={() => handleSaveProgress('in_progress')}
                className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition disabled:opacity-50"
              >
                {savingProgress ? 'Saving...' : 'Save Progress (In Progress)'}
              </button>

              <button
                type="button"
                disabled={savingProgress}
                onClick={() => handleSaveProgress('completed')}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {savingProgress
                    ? 'Saving...'
                    : selectedResource.type === 'practical_assignment'
                    ? 'Submit Assignment & Mark Complete'
                    : 'Mark as Completed'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
