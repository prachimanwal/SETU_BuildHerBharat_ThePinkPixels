import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  ChevronRight,
  X,
  RefreshCw,
  Search,
  ShieldCheck,
  History,
  Timer,
  Check,
  XCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray, unwrapData } from '../utils/api';

type CategoryFilter = 'All' | 'Recommended' | 'Technical' | 'Professional' | 'Creative' | 'Aptitude';

const CATEGORIES: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'All', label: 'All Assessments' },
  { id: 'Recommended', label: 'Recommended For You' },
  { id: 'Technical', label: 'Technical' },
  { id: 'Professional', label: 'Professional' },
  { id: 'Creative', label: 'Creative' },
  { id: 'Aptitude', label: 'Aptitude' }
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const formatTimer = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const AssessPage: React.FC = () => {
  const { language } = useLanguage();
  const { user, refreshUser } = useAuth();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active assessment runner state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [runnerError, setRunnerError] = useState('');
  const autoSubmittedRef = useRef(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [assRes, recRes, attRes] = await Promise.all([
        apiFetch('/api/assessments'),
        apiFetch('/api/assessments/recommended'),
        apiFetch('/api/assessments/history')
      ]);

      if (assRes.ok) {
        setAssessments(extractArray(assRes.data, ['assessments', 'results']));
      } else {
        setAssessments([]);
        setLoadError(assRes.error || 'Could not load skill assessments. Please try again.');
      }

      if (recRes.ok) {
        setRecommended(extractArray(recRes.data, ['assessments', 'recommended']));
      } else {
        setRecommended([]);
      }

      if (attRes.ok) {
        setPastAttempts(extractArray(attRes.data, ['attempts', 'results', 'history']));
      } else {
        setPastAttempts([]);
      }
    } catch (err: any) {
      setAssessments([]);
      setRecommended([]);
      setPastAttempts([]);
      setLoadError(err?.message || 'Unable to reach SETU assessment service right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.profileCompletion]);

  // Countdown timer for active timed quiz
  useEffect(() => {
    if (!activeQuiz || quizResult || !activeQuiz.timed) return;
    if (secondsLeft <= 0) {
      if (!autoSubmittedRef.current && !submitting) {
        autoSubmittedRef.current = true;
        handleSubmitQuiz(true);
      }
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, quizResult, secondsLeft, submitting]);

  const handleStartQuiz = async (assessmentSummary: any) => {
    setRunnerError('');
    setLoadingQuizId(assessmentSummary._id);
    try {
      const res = await apiFetch(`/api/assessments/${assessmentSummary._id}`);
      const fullQuiz = res.ok ? unwrapData(res.data) || assessmentSummary : assessmentSummary;
      setActiveQuiz(fullQuiz);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizResult(null);
      setShowReview(false);
      autoSubmittedRef.current = false;
      setSecondsLeft((fullQuiz.durationMinutes || fullQuiz.estimatedMinutes || 10) * 60);
    } catch {
      setActiveQuiz(assessmentSummary);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizResult(null);
      setShowReview(false);
      autoSubmittedRef.current = false;
      setSecondsLeft((assessmentSummary.durationMinutes || 10) * 60);
    } finally {
      setLoadingQuizId(null);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async (fromTimer = false) => {
    if (!activeQuiz || submitting) return;
    const questions = Array.isArray(activeQuiz.questions) ? activeQuiz.questions : [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (!fromTimer && answeredCount === 0 && questions.length > 0) {
      setRunnerError('Please answer at least one question before submitting.');
      return;
    }

    setRunnerError('');
    setSubmitting(true);

    try {
      const res = await apiFetch(`/api/assessments/${activeQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: activeQuiz._id,
          answers: selectedAnswers
        })
      });

      if (!res.ok) {
        setRunnerError(res.error || 'Failed to evaluate assessment. Please try again.');
      } else {
        const payload = unwrapData(res.data) || res.data;
        setQuizResult(payload?.attempt || payload?.result || payload);
        await refreshUser();
        await loadData();
      }
    } catch (err: any) {
      setRunnerError(err?.message || 'Network error while submitting assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedAssessments = useMemo(() => {
    const source = activeCategory === 'Recommended' ? recommended : assessments;
    const q = searchQuery.trim().toLowerCase();

    return source.filter((item) => {
      if (
        activeCategory !== 'All' &&
        activeCategory !== 'Recommended' &&
        (item.category || 'Technical') !== activeCategory
      ) {
        return false;
      }
      if (difficultyFilter !== 'All' && item.difficulty !== difficultyFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.title,
          item.domain,
          item.category,
          item.description,
          ...(Array.isArray(item.skillsEvaluated) ? item.skillsEvaluated : [])
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [activeCategory, difficultyFilter, searchQuery, assessments, recommended]);

  const activeQuestions = Array.isArray(activeQuiz?.questions) ? activeQuiz.questions : [];
  const currentQuestion = activeQuestions[currentQuestionIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct =
    activeQuestions.length > 0 ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
          <Award className="w-3.5 h-3.5" />
          <span>Skill Assessments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#334155]">
          {language === 'hi' ? 'व्यावहारिक कौशल मूल्यांकन' : 'Interactive Skill Assessments 🧠'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
          Evaluate your technical, professional, creative, and aptitude abilities with timed,
          server-scored assessments. Meet the passing threshold to earn{' '}
          <strong className="text-[#1E3A5F]">Verified Skill Badges</strong> on your SETU profile and
          unlock personalized learning recommendations.
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#3B9EE8] font-bold">{assessments.length}</span> Assessments Available
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-emerald-600 font-bold">
              {pastAttempts.filter((a) => a.passed).length}
            </span>{' '}
            Passed
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#334155]">
            <span className="text-[#1E3A5F] font-bold">{pastAttempts.length}</span> Total Attempts
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-4 sm:p-5 shadow-baby-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8] shadow-baby-sm'
                  : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:text-[#334155] hover:bg-[#EAF7FF]'
              }`}
            >
              {cat.id === 'Recommended' ? `✨ ${cat.label}` : cat.label}
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
              placeholder="Search Python, SQL, Communication, UI/UX, Aptitude..."
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

      {/* Loading / Error / Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-6 space-y-4 animate-pulse"
            >
              <div className="h-4 w-24 bg-[#EAF7FF] rounded-full" />
              <div className="h-5 w-3/4 bg-[#EAF7FF] rounded-lg" />
              <div className="h-12 w-full bg-[#F8FCFF] rounded-xl" />
              <div className="h-10 w-full bg-[#EAF7FF] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-baby-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-[#334155]">
            Unable to Load Skill Assessments
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
      ) : displayedAssessments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-10 text-center space-y-2 shadow-baby-sm">
          <p className="text-sm font-bold text-[#334155]">
            No assessments match your current filter.
          </p>
          <p className="text-xs text-[#64748B]">
            Try switching categories or clearing your search query.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('All');
              setDifficultyFilter('All');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
          >
            Show All Assessments
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedAssessments.map((a) => {
            const pastAttemptForThis = pastAttempts.find(
              (att) =>
                String(att.assessmentId?._id || att.assessmentId) === String(a._id)
            );
            const skillsEval = Array.isArray(a.skillsEvaluated) ? a.skillsEvaluated : [a.domain];

            return (
              <div
                key={a._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm hover:border-[#60B6F8] hover:shadow-baby transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] uppercase">
                      {a.category || 'Technical'}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F8FCFF] text-[#475569] border border-[#D8ECFA]">
                      {a.difficulty || 'Beginner'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#334155] text-base leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 line-clamp-3 leading-relaxed">
                      {a.description}
                    </p>
                  </div>

                  {a.recommendationReason && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1E3A5F] bg-[#EAF7FF]/80 px-3 py-1.5 rounded-xl border border-[#BDE0FE]">
                      <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8] shrink-0" />
                      <span>{a.recommendationReason}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {skillsEval.slice(0, 3).map((sk: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FCFF] text-[#475569] border border-[#D8ECFA]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#64748B] flex flex-wrap items-center gap-3 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {a.questionCount || a.questions?.length || 5} Questions
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {a.durationMinutes || a.estimatedMinutes || 10} mins
                    </span>
                    <span>Pass: {a.passingScore || 60}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAF7FF] space-y-2.5">
                  {pastAttemptForThis && (
                    <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA]">
                      <span className="text-[#64748B]">Last Score:</span>
                      <span
                        className={`font-bold ${
                          pastAttemptForThis.passed ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {pastAttemptForThis.percentage}%{' '}
                        {pastAttemptForThis.passed ? '• Passed ✓' : '• Practice'}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loadingQuizId === a._id}
                    onClick={() => handleStartQuiz(a)}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-baby-sm disabled:opacity-60"
                  >
                    <span>
                      {loadingQuizId === a._id
                        ? 'Opening...'
                        : pastAttemptForThis
                        ? 'Retake Assessment'
                        : 'Start Assessment'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assessment History */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#3B9EE8]" />
            <h2 className="text-base font-bold text-[#334155] font-display">
              {language === 'hi' ? 'पूर्व मूल्यांकन इतिहास' : 'Your Assessment History'}
            </h2>
          </div>
          <span className="text-xs text-[#64748B]">
            Persisted in your SETU profile across sessions
          </span>
        </div>

        {pastAttempts.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-[#64748B] text-xs">
            No assessment attempts yet. Start any assessment above to test your skills and earn
            verified badges!
          </div>
        ) : (
          <div className="space-y-3">
            {pastAttempts.map((attempt) => {
              const linkedAssessment = assessments.find(
                (a) =>
                  String(a._id) ===
                  String(attempt.assessmentId?._id || attempt.assessmentId)
              );
              return (
                <div
                  key={attempt._id}
                  className="p-4 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#334155] text-sm">
                          {attempt.assessmentId?.title || attempt.assessmentTitle || attempt.domain}
                        </h4>
                        {attempt.badgeAwarded && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Badge Earned
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Completed on{' '}
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recently'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[#D8ECFA] text-[#334155]">
                        {attempt.score} / {attempt.maxScore} ({attempt.percentage}%)
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          attempt.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {attempt.passed ? 'Passed' : 'Practice Recommended'}
                      </span>
                      {linkedAssessment && (
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(linkedAssessment)}
                          className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] transition"
                        >
                          Retake
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#D8ECFA]/70 text-xs">
                    <div>
                      <span className="font-bold text-emerald-700 block mb-1">
                        ✓ Strengths:
                      </span>
                      {Array.isArray(attempt.strengths) && attempt.strengths.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {attempt.strengths.map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#64748B]">Keep practicing to build strengths</span>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-amber-700 block mb-1">
                        Areas to Strengthen:
                      </span>
                      {Array.isArray(attempt.gaps) && attempt.gaps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {attempt.gaps.map((g: any, idx: number) => {
                            const label = typeof g === 'string' ? g : g.skillTag || 'Topic';
                            return (
                              <Link
                                key={idx}
                                to={`/learn?skill=${encodeURIComponent(label)}`}
                                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px] font-medium transition"
                              >
                                <span>{label}</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          No gaps identified in this attempt!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Assessment Runner Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            {/* Runner Header */}
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F]">
                    {activeQuiz.category || 'Skill Assessment'}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Passing: {activeQuiz.passingScore || 60}%
                  </span>
                </div>
                <h3 className="font-bold text-[#334155] text-base sm:text-lg font-display truncate mt-1">
                  {activeQuiz.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!quizResult && activeQuiz.timed && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border ${
                      secondsLeft <= 60
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : 'bg-white text-[#1E3A5F] border-[#BDE0FE]'
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    <span>{formatTimer(secondsLeft)}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="p-2 rounded-xl text-[#64748B] hover:bg-white hover:text-[#334155] transition"
                  aria-label="Close assessment"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Runner Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {runnerError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{runnerError}</span>
                </div>
              )}

              {quizResult ? (
                /* ================= RESULTS SUMMARY ================= */
                <div className="space-y-6">
                  <div className="text-center space-y-3 bg-gradient-to-b from-[#EAF7FF] to-white p-6 rounded-3xl border border-[#BDE0FE]">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto ${
                        quizResult.passed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-[#D6EEFF] text-[#1E3A5F]'
                      }`}
                    >
                      {quizResult.passed ? (
                        <CheckCircle2 className="w-9 h-9" />
                      ) : (
                        <Award className="w-9 h-9" />
                      )}
                    </div>

                    <h4 className="text-xl sm:text-2xl font-extrabold font-display text-[#334155]">
                      Amazing Effort! Here&apos;s How You Did 🩵
                    </h4>
                    <p className="text-xs text-[#64748B]">
                      {quizResult.passed
                        ? 'Congratulations — you met the passing criteria!'
                        : `You scored ${quizResult.percentage}%. Passing score is ${quizResult.passingScore}%. Review the recommendations below and try again anytime!`}
                    </p>

                    {/* Score Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-xl mx-auto">
                      <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
                        <p className="text-lg font-extrabold text-[#1E3A5F]">
                          {quizResult.percentage}%
                        </p>
                        <p className="text-[11px] text-[#64748B]">Score</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
                        <p className="text-lg font-extrabold text-emerald-700">
                          {quizResult.correctCount ?? quizResult.score}
                        </p>
                        <p className="text-[11px] text-[#64748B]">Correct</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
                        <p className="text-lg font-extrabold text-rose-600">
                          {quizResult.incorrectCount ??
                            (quizResult.maxScore || 0) - (quizResult.score || 0)}
                        </p>
                        <p className="text-[11px] text-[#64748B]">Incorrect</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
                        <p className="text-lg font-extrabold text-[#334155]">
                          {quizResult.totalQuestions ?? quizResult.maxScore}
                        </p>
                        <p className="text-[11px] text-[#64748B]">Total Qs</p>
                      </div>
                    </div>

                    {quizResult.badgeAwarded &&
                      Array.isArray(quizResult.verifiedSkillsAwarded) &&
                      quizResult.verifiedSkillsAwarded.length > 0 && (
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            Verified Skill Badge Awarded:{' '}
                            {quizResult.verifiedSkillsAwarded.join(', ')}
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        ✓ Strengths
                      </p>
                      {Array.isArray(quizResult.strengths) && quizResult.strengths.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {quizResult.strengths.map((s: string, i: number) => (
                            <span
                              key={i}
                              className="bg-white text-emerald-800 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B]">
                          Practice the fundamentals below to build momentum!
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#BDE0FE] space-y-2">
                      <p className="text-xs font-bold text-[#1E3A5F] uppercase tracking-wider">
                        Areas for Improvement
                      </p>
                      {Array.isArray(quizResult.gaps) && quizResult.gaps.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {quizResult.gaps.map((g: string, i: number) => (
                            <Link
                              key={i}
                              to={`/learn?skill=${encodeURIComponent(g)}`}
                              onClick={() => setActiveQuiz(null)}
                              className="inline-flex items-center gap-1 bg-white text-[#1E3A5F] px-2.5 py-1 rounded-full text-xs font-semibold border border-[#BDE0FE] hover:bg-[#EAF7FF]"
                            >
                              <span>{g}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-700 font-medium">
                          Perfect score across all topics evaluated!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recommended Learning Resources */}
                  {Array.isArray(quizResult.recommendations) &&
                    quizResult.recommendations.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2.5">
                        <p className="text-xs font-bold text-[#334155]">
                          📚 Recommended Learning Resources For You
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {quizResult.recommendations.map((rec: any) => (
                            <Link
                              key={rec._id}
                              to={`/learn?resource=${rec._id}`}
                              onClick={() => setActiveQuiz(null)}
                              className="p-3 rounded-xl bg-white border border-[#D8ECFA] hover:border-[#60B6F8] transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#334155] truncate">
                                  {rec.title}
                                </p>
                                <p className="text-[11px] text-[#64748B]">
                                  {rec.category || rec.skillTag} • {rec.duration || 'Self-paced'}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#3B9EE8] shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Question Review Toggle */}
                  {Array.isArray(quizResult.questionReview) &&
                    quizResult.questionReview.length > 0 && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowReview((v) => !v)}
                          className="text-xs font-bold text-[#2589D6] hover:underline"
                        >
                          {showReview
                            ? 'Hide Answer Explanations ▲'
                            : 'Review Questions & Explanations ▼'}
                        </button>

                        {showReview && (
                          <div className="space-y-3">
                            {quizResult.questionReview.map((item: any, idx: number) => (
                              <div
                                key={item.id || idx}
                                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                                  item.isCorrect
                                    ? 'bg-emerald-50/50 border-emerald-200'
                                    : 'bg-rose-50/40 border-rose-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {item.isCorrect ? (
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  )}
                                  <p className="font-bold text-[#334155]">
                                    Q{idx + 1}. {item.question}
                                  </p>
                                </div>
                                <p className="text-[#475569] pl-6">
                                  Your Answer:{' '}
                                  <strong>
                                    {item.selectedOptionIndex !== null &&
                                    item.options?.[item.selectedOptionIndex]
                                      ? item.options[item.selectedOptionIndex]
                                      : 'Not answered'}
                                  </strong>
                                </p>
                                {!item.isCorrect && (
                                  <p className="text-emerald-700 pl-6">
                                    Correct Answer:{' '}
                                    <strong>{item.options?.[item.correctAnswerIndex]}</strong>
                                  </p>
                                )}
                                <p className="text-[#64748B] pl-6">{item.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Result Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAF7FF]">
                    <button
                      type="button"
                      onClick={() => handleStartQuiz(activeQuiz)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Assessment</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {quizResult.nextAssessment && (
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(quizResult.nextAssessment)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
                        >
                          <span>Next: {quizResult.nextAssessment.title}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveQuiz(null)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ================= ACTIVE QUESTION RUNNER ================= */
                <div className="space-y-5">
                  {/* Progress Bar & Question Palette */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                      <span>
                        Question {currentQuestionIdx + 1} of {activeQuestions.length}
                      </span>
                      <span className="text-[#2589D6]">
                        {answeredCount} / {activeQuestions.length} Answered ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#EAF7FF] rounded-full overflow-hidden border border-[#D8ECFA]">
                      <div
                        className="h-full bg-gradient-to-r from-[#60B6F8] to-[#3B9EE8] rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeQuestions.map((q: any, idx: number) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const isCurrent = idx === currentQuestionIdx;
                        return (
                          <button
                            key={q.id || idx}
                            type="button"
                            onClick={() => setCurrentQuestionIdx(idx)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold border transition ${
                              isCurrent
                                ? 'bg-[#3B9EE8] text-white border-[#3B9EE8] shadow-baby-sm'
                                : isAnswered
                                ? 'bg-[#D6EEFF] text-[#1E3A5F] border-[#60B6F8]'
                                : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:border-[#A2D2FF]'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Question Card */}
                  {currentQuestion && (
                    <div className="p-5 rounded-3xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#2589D6] uppercase tracking-wider">
                          Topic: {currentQuestion.skillTested || activeQuiz.domain}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#334155] leading-relaxed">
                        {currentQuestionIdx + 1}. {currentQuestion.question}
                      </h4>

                      <div className="space-y-2.5">
                        {(currentQuestion.options || []).map((opt: string, optIdx: number) => {
                          const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                              className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition flex items-start gap-3 ${
                                isSelected
                                  ? 'bg-[#EAF7FF] border-[#3B9EE8] text-[#1E3A5F] font-semibold shadow-baby-sm'
                                  : 'bg-white border-[#D8ECFA] text-[#334155] hover:border-[#A2D2FF] hover:bg-[#F8FCFF]'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 border ${
                                  isSelected
                                    ? 'bg-[#3B9EE8] text-white border-[#3B9EE8]'
                                    : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA]'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Question Navigation & Submit Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAF7FF]">
                    <button
                      type="button"
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold disabled:opacity-40 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {currentQuestionIdx < activeQuestions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentQuestionIdx((i) =>
                              Math.min(activeQuestions.length - 1, i + 1)
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmitQuiz(false)}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{submitting ? 'Scoring...' : 'Submit Assessment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
