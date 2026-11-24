import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Award,
  BookOpen,
  Layers,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Target,
  Info,
  Clock,
  Trophy,
  FileText,
  FolderGit2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, unwrapData } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

type ViewRangeKey = 'weekly' | 'monthly' | 'yearly';

const VIEW_OPTIONS: Array<{ id: ViewRangeKey; label: string; subtitle: string }> = [
  { id: 'weekly', label: 'Weekly', subtitle: 'Last 7 days' },
  { id: 'monthly', label: 'Monthly', subtitle: 'Last 30 days' },
  { id: 'yearly', label: 'Yearly', subtitle: 'Last 12 months' }
];

export const MyProgressPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [range, setRange] = useState<ViewRangeKey>('monthly');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('discover');
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  const loadAnalytics = async (selectedRange: ViewRangeKey = range) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/analytics/progress?range=${selectedRange}`);
      if (res.ok && res.data) {
        const payload = unwrapData(res.data);
        setData(payload);
        const stages = Array.isArray(payload?.journeyStages) ? payload.journeyStages : [];
        const firstIncomplete = stages.find((s: any) => !s.completed);
        if (firstIncomplete) setSelectedStageId(firstIncomplete.id);
      } else {
        setData(null);
        setError(res.error || 'Unable to load your progress analytics right now.');
      }
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Network error while fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(range);
  }, [range, user?.id]);

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-[#D8ECFA]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-3xl border border-[#D8ECFA]" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-3xl border border-[#D8ECFA]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-baby-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-[#334155]">Could Not Load Career Analytics</h2>
        <p className="text-xs text-[#64748B]">{error}</p>
        <button
          type="button"
          onClick={() => loadAnalytics(range)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const formula = summary.progressFormula || {};
  const timeline: any[] = Array.isArray(data?.growthTimeline) ? data.growthTimeline : [];
  const coreCategories: any[] = Array.isArray(data?.skillDevelopment?.coreCategories)
    ? data.skillDevelopment.coreCategories
    : [];
  const assessedSkills: any[] = Array.isArray(data?.skillDevelopment?.assessedSkills)
    ? data.skillDevelopment.assessedSkills
    : [];
  const learningDonut = data?.learningDonut || {
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    enrolledTotal: 0,
    completionPercentage: 0,
    totalLearningHours: 0,
    weeklyActivity: []
  };
  const weeklyLearning: any[] = Array.isArray(learningDonut.weeklyActivity)
    ? learningDonut.weeklyActivity
    : [];
  const applicationFunnel: any[] = Array.isArray(data?.applications?.funnel)
    ? data.applications.funnel
    : [];
  const appsOverTime: any[] = Array.isArray(data?.applications?.overTime)
    ? data.applications.overTime
    : [];
  const journeyStages: any[] = Array.isArray(data?.journeyStages) ? data.journeyStages : [];
  const achievements: any[] = Array.isArray(data?.achievements) ? data.achievements : [];
  const insights: any[] = Array.isArray(data?.insights) ? data.insights : [];
  const activeStage =
    journeyStages.find((s) => s.id === selectedStageId) || journeyStages[0] || null;

  const overallPct = summary.overallCareerProgressPct ?? summary.journeyPercentage ?? 0;
  const periodDelta: number | null =
    typeof summary.periodImprovementDelta === 'number' ? summary.periodImprovementDelta : null;
  const hasCoreSkillActivity = coreCategories.some((c) => c.hasActivity);

  // SECTION A: "My Career Growth" Line Chart
  const growthChartData = {
    labels: timeline.map((pt) =>
      pt.date.length === 7
        ? pt.date
        : new Date(pt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Career Progress (%)',
        data: timeline.map((pt) => pt.overallCareerProgressPct ?? pt.overallJourneyPct),
        borderColor: '#3B9EE8',
        backgroundColor: 'rgba(162, 210, 255, 0.28)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#2589D6'
      },
      {
        label: 'Assessment Avg (%)',
        data: timeline.map((pt) => pt.assessmentAvgPct),
        borderColor: '#EC4899',
        backgroundColor: 'rgba(244, 114, 182, 0.12)',
        fill: false,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#EC4899'
      },
      {
        label: 'Learning Completion (%)',
        data: timeline.map((pt) => pt.learningPct),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: false,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#10B981'
      }
    ]
  };

  // SECTION B: 6-Category Skill Development Bar Chart
  const coreSkillChartData = {
    labels: coreCategories.map((c) => c.category),
    datasets: [
      {
        label: 'Skill Progress (%)',
        data: coreCategories.map((c) => c.score),
        backgroundColor: coreCategories.map((c) => {
          if (!c.hasActivity) return '#E2F1FC';
          if (c.status === 'improving' || c.status === 'strong') return '#34D399';
          return '#60B6F8';
        }),
        borderRadius: 10
      }
    ]
  };

  // SECTION C: Learning Donut & Weekly Learning Activity
  const learningDonutData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [learningDonut.completed, learningDonut.inProgress, learningDonut.notStarted],
        backgroundColor: ['#34D399', '#60B6F8', '#E2F1FC'],
        borderColor: '#FFFFFF',
        borderWidth: 3
      }
    ]
  };

  const weeklyLearningChartData = {
    labels: weeklyLearning.map((w) => `Wk of ${w.week.slice(5)}`),
    datasets: [
      {
        label: 'Learning Hours',
        data: weeklyLearning.map((w) => w.hours),
        backgroundColor: '#60B6F8',
        borderRadius: 8
      },
      {
        label: 'Modules Completed',
        data: weeklyLearning.map((w) => w.completedCount),
        backgroundColor: '#34D399',
        borderRadius: 8
      }
    ]
  };

  // SECTION D: 6-Stage Job Application Funnel + Applications Over Time
  const funnelChartData = {
    labels: applicationFunnel.map((f) => f.stage),
    datasets: [
      {
        label: 'Applications',
        data: applicationFunnel.map((f) => f.count),
        backgroundColor: ['#93C5FD', '#60A5FA', '#3B82F6', '#6366F1', '#A855F7', '#10B981'],
        borderRadius: 10
      }
    ]
  };

  const appsOverTimeData = {
    labels: appsOverTime.map((pt) =>
      pt.date.length === 7
        ? pt.date
        : new Date(pt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Applications Submitted',
        data: appsOverTime.map((pt) => pt.count),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 4
      }
    ]
  };

  const achievementIcon = (id: string) => {
    switch (id) {
      case 'assessments':
        return Award;
      case 'certificates':
        return ShieldCheck;
      case 'projects':
        return FolderGit2;
      case 'resume':
        return FileText;
      case 'learning':
        return BookOpen;
      default:
        return Briefcase;
    }
  };

  const skillStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return { label: 'Improving', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'strong':
        return { label: 'Strong', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'needs_attention':
        return { label: 'Needs Attention', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Not Started', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header + Weekly / Monthly / Yearly Switcher */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2589D6]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Interactive Career Analytics</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A5F] font-display mt-0.5">
            {language === 'hi' ? 'मेरी प्रगति और करियर यात्रा' : 'My Progress & Career Analytics'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Every metric and chart is computed live from your real SETU assessments, courses, portfolio, resume, and applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  range === opt.id
                    ? 'bg-[#3B9EE8] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E3A5F]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => loadAnalytics(range)}
            className="p-2 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-[#475569] hover:bg-[#EAF7FF]"
            aria-label="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Real-Data Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Overall Career Progress</span>
            <TrendingUp className="w-4 h-4 text-[#3B9EE8]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1E3A5F]">{overallPct}%</span>
            {periodDelta !== null && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  periodDelta >= 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {periodDelta >= 0 ? `+${periodDelta}%` : `${periodDelta}%`} vs prior
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFormula((s) => !s)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2589D6] hover:underline"
          >
            <Info className="w-3 h-3" /> How it&apos;s calculated
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Learning Hours</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#1E3A5F]">
            {summary.totalLearningHours ?? 0}h
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            {summary.completedLearningCount ?? 0} completed • {summary.inProgressLearningCount ?? 0} in progress
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Skill Assessments</span>
            <Award className="w-4 h-4 text-pink-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#1E3A5F]">
            {summary.totalAssessments ?? 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            {summary.passedAssessments ?? 0} passed • Avg {summary.averageAssessmentScore ?? 0}%
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Job Applications</span>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#1E3A5F]">
            {summary.applicationsCount ?? 0}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            {summary.interviewsCount ?? 0} interviews • {summary.offersCount ?? 0} offers
          </p>
        </div>
      </div>

      {/* Expandable Transparent Formula Breakdown */}
      {showFormula && (
        <div className="p-4 rounded-3xl bg-[#EAF7FF]/70 border border-[#BDE0FE] text-xs text-[#1E3A5F] grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
            <p className="text-[10px] font-bold uppercase text-[#64748B]">Profile (15%)</p>
            <p className="text-base font-extrabold mt-0.5">{formula.profilePoints ?? 0}/15</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
            <p className="text-[10px] font-bold uppercase text-[#64748B]">Assessments (20%)</p>
            <p className="text-base font-extrabold mt-0.5">{formula.assessmentPoints ?? 0}/20</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
            <p className="text-[10px] font-bold uppercase text-[#64748B]">Learning (20%)</p>
            <p className="text-base font-extrabold mt-0.5">{formula.learningPoints ?? 0}/20</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
            <p className="text-[10px] font-bold uppercase text-[#64748B]">Portfolio &amp; Resume (20%)</p>
            <p className="text-base font-extrabold mt-0.5">{formula.portfolioResumePoints ?? 0}/20</p>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#D8ECFA]">
            <p className="text-[10px] font-bold uppercase text-[#64748B]">Applications (25%)</p>
            <p className="text-base font-extrabold mt-0.5">{formula.applicationPoints ?? 0}/25</p>
          </div>
        </div>
      )}

      {/* SECTION A: OVERALL CAREER PROGRESS — "My Career Growth" */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F]">My Career Growth</h2>
            <p className="text-xs text-[#64748B]">
              Timestamped career progress (0–100%) tracked across {VIEW_OPTIONS.find((v) => v.id === range)?.subtitle.toLowerCase()}. Hover any point for milestone details.
            </p>
          </div>
          {periodDelta !== null && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border self-start ${
                periodDelta >= 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {periodDelta >= 0 ? `+${periodDelta}%` : `${periodDelta}%`} compared to previous period
              </span>
            </span>
          )}
        </div>

        {timeline.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center space-y-3">
            <Sparkles className="w-9 h-9 text-[#3B9EE8] mx-auto" />
            <h3 className="text-sm font-bold text-[#1E3A5F]">Your Career Growth chart starts with your first action</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Complete a skill assessment, finish a learning module, add a project, upload your resume, or apply to a job to record your first timestamped progress point.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Link to="/assess" className="px-4 py-2 rounded-xl bg-[#3B9EE8] text-white text-xs font-bold">
                Take First Assessment
              </Link>
              <Link to="/learn" className="px-4 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold">
                Start a Course
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="h-72">
              <Line
                data={growthChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  scales: {
                    y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        afterBody: (items) => {
                          const idx = items[0]?.dataIndex ?? -1;
                          const ms = timeline[idx]?.milestones || [];
                          return ms.length > 0 ? [`Milestones: ${ms.join(', ')}`] : [];
                        }
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Milestones strip */}
            {timeline.some((pt) => pt.milestones?.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAF7FF]">
                <span className="text-[11px] font-bold uppercase text-[#64748B]">Milestones:</span>
                {Array.from(new Set(timeline.flatMap((pt) => pt.milestones || []))).map((m: any, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-[11px] font-semibold"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {m}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION B: SKILL DEVELOPMENT GRAPH (6 CORE CATEGORIES) */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#3B9EE8]" />
              <span>Skill Development Across Core Competencies</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Calculated strictly from your completed SETU assessments and learning modules — zero fabricated scores.
            </p>
          </div>
          <Link to="/assess" className="text-xs font-bold text-[#2589D6] hover:underline">
            Take Skill Assessments →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          <div className="lg:col-span-3 h-64">
            <Bar
              data={coreSkillChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const cat = coreCategories[ctx.dataIndex];
                        if (!cat?.hasActivity) return 'No assessments or courses completed yet (0%)';
                        return `${cat.score}% (${cat.assessmentsCount} assessment(s), ${cat.completedLearningCount} course(s))`;
                      }
                    }
                  }
                }
              }}
            />
          </div>

          <div className="lg:col-span-2 space-y-2">
            {coreCategories.map((c) => {
              const badge = skillStatusBadge(c.status);
              return (
                <div
                  key={c.category}
                  className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E3A5F] truncate">{c.category}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {c.hasActivity
                        ? `${c.assessmentsCount} test(s) • ${c.completedLearningCount} course(s)`
                        : 'No recorded activity yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-[#1E3A5F]">{c.score}%</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!hasCoreSkillActivity && (
          <p className="text-xs text-[#64748B] bg-[#F8FCFF] p-3.5 rounded-2xl border border-dashed border-[#BDE0FE] text-center">
            All categories begin at 0% until you complete real assessments or courses. Start in{' '}
            <Link to="/assess" className="text-[#2589D6] font-bold underline">Assessments</Link> or{' '}
            <Link to="/learn" className="text-[#2589D6] font-bold underline">Learn &amp; Practice</Link> to see your verified progress grow.
          </p>
        )}

        {assessedSkills.length > 0 && (
          <div className="pt-3 border-t border-[#EAF7FF]">
            <p className="text-[11px] font-bold uppercase text-[#64748B] mb-2">
              Individual Assessed Domains
            </p>
            <div className="flex flex-wrap gap-2">
              {assessedSkills.map((sk) => (
                <span
                  key={sk.skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#F8FCFF] border border-[#BDE0FE] text-xs font-semibold text-[#1E3A5F]"
                >
                  {sk.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{sk.skill}: {sk.currentProficiency}%</span>
                  {typeof sk.improvement === 'number' && sk.improvement !== 0 && (
                    <span className={sk.improvement > 0 ? 'text-emerald-600 font-bold' : 'text-amber-700'}>
                      ({sk.improvement > 0 ? `+${sk.improvement}%` : `${sk.improvement}%`})
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION C: LEARNING ANALYTICS (DONUT + WEEKLY ACTIVITY + HOURS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E3A5F] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3B9EE8]" />
                <span>Learning Progress Overview</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Course completion rate: <strong>{learningDonut.completionPercentage}%</strong> • Total:{' '}
                <strong>{learningDonut.totalLearningHours ?? 0} hrs</strong>
              </p>
            </div>
            <Link to="/learn" className="text-xs font-bold text-[#2589D6] hover:underline">
              Explore Courses
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <p className="text-lg font-extrabold text-emerald-800">{learningDonut.completed}</p>
              <p className="text-[11px] font-semibold text-emerald-700">Completed</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE]">
              <p className="text-lg font-extrabold text-[#1E3A5F]">{learningDonut.inProgress}</p>
              <p className="text-[11px] font-semibold text-[#2589D6]">In Progress</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
              <p className="text-lg font-extrabold text-[#475569]">{learningDonut.notStarted}</p>
              <p className="text-[11px] font-semibold text-[#64748B]">Not Started</p>
            </div>
          </div>

          <div className="h-52 flex items-center justify-center">
            <Doughnut
              data={learningDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '64%',
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E3A5F]">Weekly Learning Activity</h2>
            <p className="text-xs text-[#64748B]">
              Modules completed and estimated learning hours per week from your real completions
            </p>
          </div>
          {weeklyLearning.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center p-6 space-y-2">
              <BookOpen className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-xs font-bold text-[#1E3A5F]">No weekly learning activity yet</p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Complete a course or practical assignment in Learn &amp; Practice to track your weekly study hours here.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <Bar
                data={weeklyLearningChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION D: JOB APPLICATION ANALYTICS (6-STAGE FUNNEL + OVER TIME) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E3A5F]">Job Application Funnel</h2>
              <p className="text-xs text-[#64748B]">
                Submitted → Reviewed → Shortlisted → Interviews → Offers → Hired
              </p>
            </div>
            <Link to="/applications" className="text-xs font-bold text-[#2589D6] hover:underline">
              My Applications
            </Link>
          </div>

          {(data?.applications?.total ?? 0) === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center p-6 space-y-2">
              <Briefcase className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-xs font-bold text-[#1E3A5F]">No job applications submitted yet</p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Apply directly to matched SETU opportunities to track your progression through interviews and offers.
              </p>
              <Link to="/opportunities" className="px-3.5 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-bold border border-[#BDE0FE]">
                Explore Opportunities
              </Link>
            </div>
          ) : (
            <div className="h-60">
              <Bar
                data={funnelChartData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E3A5F]">Applications Submitted Over Time</h2>
            <p className="text-xs text-[#64748B]">
              Chronological record of your direct job applications on SETU
            </p>
          </div>
          {appsOverTime.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center p-6 space-y-2">
              <TrendingUp className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-xs font-bold text-[#1E3A5F]">No application trend in this period</p>
              <p className="text-[11px] text-[#64748B]">
                Submit applications on SETU to visualize your momentum over time.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <Line
                data={appsOverTimeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION E: INTERACTIVE SEVEN-STAGE CAREER JOURNEY */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3B9EE8]" />
              <span>Seven-Stage SETU Career Journey</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              {summary.completedStagesCount ?? 0} of 7 stages completed ({summary.journeyPercentage ?? 0}%). Click any stage to inspect completed &amp; pending actions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {journeyStages.map((stage, idx) => {
            const isSelected = activeStage?.id === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'bg-[#EAF7FF] border-[#3B9EE8] shadow-xs'
                    : stage.completed
                    ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                    : 'bg-[#F8FCFF] border-[#D8ECFA] hover:bg-[#EAF7FF]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-[#64748B]">Stage {idx + 1}</span>
                  {stage.completed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs font-bold text-[#1E3A5F] mt-1 truncate">{stage.label}</p>
                <div className="mt-2 w-full h-1.5 bg-white rounded-full overflow-hidden border border-[#D8ECFA]">
                  <div
                    className={`h-full rounded-full ${stage.completed ? 'bg-emerald-500' : 'bg-[#3B9EE8]'}`}
                    style={{ width: `${stage.completionPct ?? (stage.completed ? 100 : 0)}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-[#2589D6] mt-1">
                  {stage.completionPct ?? (stage.completed ? 100 : 0)}%
                </p>
              </button>
            );
          })}
        </div>

        {activeStage && (
          <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#BDE0FE] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1E3A5F]">
                  {activeStage.label} — {activeStage.completionPct ?? (activeStage.completed ? 100 : 0)}% Complete
                </h3>
                <p className="text-xs text-[#64748B]">{activeStage.description}</p>
              </div>
              {activeStage.nextAction && (
                <Link
                  to={activeStage.nextAction.route}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold self-start sm:self-auto"
                >
                  <span>{activeStage.nextAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/80 space-y-1.5">
                <p className="font-bold text-emerald-800">Completed Activities</p>
                {activeStage.completedActivities?.length > 0 ? (
                  activeStage.completedActivities.map((act: string, i: number) => (
                    <p key={i} className="text-[#334155]">✓ {act}</p>
                  ))
                ) : (
                  <p className="text-[#64748B]">No completed activities in this stage yet.</p>
                )}
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 space-y-1.5">
                <p className="font-bold text-amber-800">Pending Activities</p>
                {activeStage.pendingActivities?.length > 0 ? (
                  activeStage.pendingActivities.map((act: string, i: number) => (
                    <p key={i} className="text-[#334155]">• {act}</p>
                  ))
                ) : (
                  <p className="text-emerald-700 font-medium">All requirements for this stage are complete!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION F: PERSONAL ACHIEVEMENTS (INTERACTIVE CARDS) */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E3A5F] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Personal Achievements &amp; Milestones</span>
          </h2>
          <p className="text-xs text-[#64748B]">
            Click any achievement card to inspect your earned milestones or jump directly to the activity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = achievementIcon(ach.id);
            const isOpen = expandedAchievement === ach.id;
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-4 transition ${
                  ach.unlocked
                    ? 'bg-gradient-to-br from-[#F8FCFF] to-[#EAF7FF]/50 border-[#BDE0FE]'
                    : 'bg-[#F8FCFF]/60 border-[#D8ECFA]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedAchievement(isOpen ? null : ach.id)}
                  className="w-full text-left flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 ${
                        ach.unlocked
                          ? 'bg-white text-[#3B9EE8] border border-[#BDE0FE]'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1E3A5F]">{ach.title}</p>
                      <p className="text-xl font-extrabold text-[#1E3A5F] mt-0.5">{ach.count}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{ach.subtitle}</p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#64748B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-[#D8ECFA] space-y-2">
                    {ach.items?.length > 0 ? (
                      <ul className="space-y-1 text-[11px] text-[#334155]">
                        {ach.items.map((item: string, idx: number) => (
                          <li key={idx} className="truncate">• {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-[#64748B]">
                        Complete your first milestone to unlock this badge.
                      </p>
                    )}
                    <Link
                      to={ach.route}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2589D6] hover:underline"
                    >
                      <span>Open section</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Actionable Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-3">
          <h2 className="text-base font-bold text-[#1E3A5F]">Data-Backed Recommendations</h2>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#EAF7FF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <span className="text-[#334155]">{ins.message}</span>
                {ins.route && (
                  <Link
                    to={ins.route}
                    className="inline-flex items-center gap-1 text-[#2589D6] font-bold shrink-0 hover:underline"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
