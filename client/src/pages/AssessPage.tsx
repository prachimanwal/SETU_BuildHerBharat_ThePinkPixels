import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  X,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray, unwrapData } from '../utils/api';

export const AssessPage: React.FC = () => {
  const { language } = useLanguage();
  const { refreshUser } = useAuth();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active quiz runner state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [assRes, attRes] = await Promise.all([
        apiFetch('/api/seeker/assessments'),
        apiFetch('/api/seeker/assessments/my-attempts')
      ]);

      if (assRes.ok) {
        setAssessments(extractArray(assRes.data, ['assessments', 'results']));
      } else {
        setAssessments([]);
        setErrorMsg(assRes.error || 'Unable to load assessments right now.');
      }

      if (attRes.ok) {
        setPastAttempts(extractArray(attRes.data, ['attempts', 'results']));
      } else {
        setPastAttempts([]);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
      setAssessments([]);
      setPastAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartQuiz = (assessment: any) => {
    setActiveQuiz(assessment);
    setSelectedAnswers({});
    setQuizResult(null);
    setErrorMsg('');
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/seeker/assessments/submit', {
        method: 'POST',
        body: JSON.stringify({
          assessmentId: activeQuiz._id,
          answers: selectedAnswers
        })
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to evaluate assessment');
      } else {
        const payload = unwrapData(res.data) || res.data;
        setQuizResult(payload?.attempt || payload?.result || payload);
        await refreshUser();
        await loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#D8ECFA]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2589D6]">
          <Award className="w-4 h-4" />
          <span>Stage 2: Assess Skills</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#334155]">
          {language === 'hi' ? 'व्यावहारिक कौशल मूल्यांकन' : 'Interactive Skill Assessments'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl">
          Short, scenario-based evaluations scored on the server. Identify your verified strengths, detect skill gaps, and get instant recommendations linked to hands-on practice.
        </p>
      </div>

      {/* Available Assessments Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#334155] font-serif">
          {language === 'hi' ? 'उपलब्ध मूल्यांकन परीक्षाएं' : 'Available Assessments'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assessments.map((a) => {
            const pastAttemptForThis = pastAttempts.find(
              (att) => att.assessmentId?._id === a._id || att.assessmentId === a._id
            );

            return (
              <div
                key={a._id}
                className="bg-white rounded-2xl border border-[#D8ECFA] p-6 shadow-sm hover:border-[#A2D2FF] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7FF] text-[#475569] uppercase">
                      {a.domain.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{a.estimatedMinutes} mins</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-[#334155] text-base leading-snug">
                    {language === 'hi' && a.titleHindi ? a.titleHindi : a.title}
                  </h4>

                  <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
                    {language === 'hi' && a.descriptionHindi ? a.descriptionHindi : a.description}
                  </p>

                  <div className="text-[11px] text-[#64748B] flex items-center space-x-3 pt-1">
                    <span>{a.questions?.length || 5} Questions</span>
                    <span>•</span>
                    <span>Passing: {a.passingScore}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAF7FF] space-y-2">
                  {pastAttemptForThis && (
                    <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#F8FCFF] text-[#475569]">
                      <span>Last Score:</span>
                      <span className={`font-bold ${pastAttemptForThis.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {pastAttemptForThis.percentage}% ({pastAttemptForThis.passed ? 'Passed' : 'Needs Practice'})
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartQuiz(a)}
                    className="w-full py-2.5 rounded-xl bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>{pastAttemptForThis ? 'Retake Assessment' : 'Start Assessment'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past Assessment Attempts Table */}
      <div className="bg-white rounded-2xl border border-[#D8ECFA] p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#334155] font-serif">
          {language === 'hi' ? 'पूर्व मूल्यांकन परिणाम व विश्लेषण' : 'Assessment History & Gap Analysis'}
        </h3>

        {pastAttempts.length === 0 ? (
          <div className="text-center py-8 text-[#64748B] text-xs">
            No assessment attempts recorded yet. Take your first assessment above to discover your strengths!
          </div>
        ) : (
          <div className="space-y-4">
            {pastAttempts.map((attempt) => (
              <div
                key={attempt._id}
                className="p-4 rounded-xl border border-[#D8ECFA] bg-stone-50/50 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-[#334155] text-sm">
                      {attempt.assessmentId?.title || attempt.domain}
                    </h5>
                    <span className="text-[11px] text-[#64748B]">
                      Completed on {new Date(attempt.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-[#D8ECFA]">
                      Score: {attempt.score} / {attempt.maxScore} ({attempt.percentage}%)
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        attempt.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {attempt.passed ? 'PASSED' : 'PRACTICE RECOMMENDED'}
                    </span>
                  </div>
                </div>

                {/* Strengths & Gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#D8ECFA]/60 text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 block mb-1">
                      ✓ Demonstrated Strengths:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {attempt.strengths?.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-amber-800 block mb-1">
                      ⚠ Identified Focus Gaps & Recommendations:
                    </span>
                    <div className="flex flex-col space-y-1">
                      {attempt.gaps?.map((g: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-amber-50/80 p-1.5 rounded border border-amber-200">
                          <span className="text-amber-900 font-medium">{g.skillTag}</span>
                          {g.linkedResourceId ? (
                            <Link
                              to={`/learn`}
                              className="text-[11px] font-bold text-[#2589D6] hover:underline flex items-center space-x-1"
                            >
                              <span>Learn This</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-[#64748B]">Review tutorials</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Runner Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-[#EAF7FF]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#D8ECFA] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#D8ECFA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
                  Skill Assessment Runner
                </span>
                <h3 className="font-bold text-[#334155] text-lg font-serif">
                  {activeQuiz.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EAF7FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {quizResult ? (
                // Evaluation Results Card
                <div className="space-y-5 text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto ${
                      quizResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {quizResult.passed ? (
                      <CheckCircle2 className="w-10 h-10" />
                    ) : (
                      <AlertCircle className="w-10 h-10" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold font-serif text-[#334155]">
                      {quizResult.passed ? 'Assessment Passed!' : 'Assessment Completed'}
                    </h4>
                    <p className="text-sm font-semibold text-[#64748B] mt-1">
                      Score: {quizResult.score} / {quizResult.maxScore} ({quizResult.percentage}%)
                    </p>
                  </div>

                  {/* Strengths */}
                  <div className="text-left bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                      Demonstrated Strengths (Added to your Profile):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quizResult.strengths?.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white text-emerald-900 px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Gaps & Linked Learning Resources */}
                  {quizResult.gaps?.length > 0 && (
                    <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                        Identified Gaps Linked to Learning Modules:
                      </span>
                      <div className="space-y-2">
                        {quizResult.gaps.map((gap: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#334155] block">{gap.skillTag}</span>
                              <span className="text-[11px] text-[#64748B]">
                                Recommended: {gap.resourceTitle}
                              </span>
                            </div>
                            <Link
                              to="/learn"
                              onClick={() => setActiveQuiz(null)}
                              className="px-3 py-1 bg-[#E65100] text-white rounded font-semibold text-[11px] hover:bg-[#8CC6FA] transition"
                            >
                              Practice Now
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="px-6 py-2.5 rounded-xl bg-[#EAF7FF] text-white font-bold text-xs"
                    >
                      Close & Return
                    </button>
                  </div>
                </div>
              ) : (
                // Questions list
                <div className="space-y-6">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  {activeQuiz.questions?.map((q: any, qIdx: number) => (
                    <div key={q.id} className="p-4 rounded-xl border border-[#D8ECFA] space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-[#2589D6] bg-[#EAF7FF] px-2 py-0.5 rounded">
                          Question {qIdx + 1}
                        </span>
                        <span className="text-[10px] text-[#64748B] bg-[#EAF7FF] px-2 py-0.5 rounded">
                          {q.skillTag}
                        </span>
                      </div>

                      <p className="font-semibold text-[#334155] text-sm">
                        {language === 'hi' && q.questionHindi ? q.questionHindi : q.question}
                      </p>

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          const optLabel =
                            language === 'hi' && q.optionsHindi?.[optIdx]
                              ? q.optionsHindi[optIdx]
                              : opt;

                          return (
                            <label
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`flex items-start p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                                isSelected
                                  ? 'border-[#60B6F8] bg-[#EAF7FF]/60 font-semibold text-orange-950'
                                  : 'border-[#D8ECFA] hover:bg-[#F8FCFF] text-[#475569]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                checked={isSelected}
                                onChange={() => handleSelectOption(q.id, optIdx)}
                                className="mt-0.5 mr-2.5 text-[#3B9EE8] focus:ring-[#BDE0FE]"
                              />
                              <span className="flex-1">{optLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!quizResult && (
              <div className="p-4 border-t border-[#D8ECFA] flex items-center justify-between bg-stone-50/50">
                <span className="text-xs text-[#64748B]">
                  Answered {Object.keys(selectedAnswers).length} of {activeQuiz.questions?.length || 0}
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="px-4 py-2 rounded-lg border border-[#BDE0FE] text-xs font-semibold text-[#475569] hover:bg-[#EAF7FF]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting || Object.keys(selectedAnswers).length === 0}
                    className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Scoring on Server...' : 'Submit Answers'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
