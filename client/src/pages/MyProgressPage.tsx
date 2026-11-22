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
  ChevronRight
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

type RangeKey = '7d' | '30d' | '3m' | '6m' | '12m';

const RANGE_OPTIONS: Array<{ id: RangeKey; label: string }> = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '3m', label: 'Last 3 months' },
  { id: '6m', label: 'Last 6 months' },
  { id: '12m', label: 'Last 12 months' }
];

export const MyProgressPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [range, setRange] = useState<RangeKey>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('discover');

  const loadAnalytics = async (selectedRange: RangeKey = range) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/analytics/progress?range=${selectedRange}`);
      if (res.ok && res.data) {
        const payload = unwrapData(res.data);
        setData(payload);
        // Auto-select first incomplete stage for helpful guidance
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
  const timeline: any[] = Array.isArray(data?.growthTimeline) ? data.growthTimeline : [];
  const assessedSkills: any[] = Array.isArray(data?.skillDevelopment?.assessedSkills)
    ? data.skillDevelopment.assessedSkills
    : [];
  const selfReportedSkills: any[] = Array.isArray(data?.skillDevelopment?.selfReportedSkills)
    ? data.skillDevelopment.selfReportedSkills
    : [];
  const strongestSkill = data?.skillDevelopment?.strongestSkill || null;
  const weakestSkill = data?.skillDevelopment?.weakestSkill || null;
  const assessmentPerformance: any[] = Array.isArray(data?.assessmentPerformance)
    ? data.assessmentPerformance
    : [];
  const learningDonut = data?.learningDonut || {
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    enrolledTotal: 0,
    completionPercentage: 0
  };
  const applicationFunnel: any[] = Array.isArray(data?.applications?.funnel)
    ? data.applications.funnel
    : [];
  const statusCounts: Record<string, number> = data?.applications?.statusCounts || {};
  const journeyStages: any[] = Array.isArray(data?.journeyStages) ? data.journeyStages : [];
  const insights: any[] = Array.isArray(data?.insights) ? data.insights : [];
  const activeStage =
    journeyStages.find((s) => s.id === selectedStageId) || journeyStages[0] || null;

  // 1.1 Career Growth Line Chart
  const growthChartData = {
    labels: timeline.map((pt) =>
      new Date(pt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    ),
    datasets: [
      {
        label: 'Overall Career Journey (%)',
        data: timeline.map((pt) => pt.overallJourneyPct),
        borderColor: '#3B9EE8',
        backgroundColor: 'rgba(162, 210, 255, 0.28)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: '#2589D6'
      },
      {
        label: 'Assessment Performance (%)',
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

  // 1.2 Skill Development Bar Chart (Current vs Previous from real assessments)
  const skillDevChartData = {
    labels: assessedSkills.map((s) => s.skill),
    datasets: [
      {
        label: 'Current Proficiency (%)',
        data: assessedSkills.map((s) => s.currentProficiency),
        backgroundColor: '#60B6F8',
        borderRadius: 10
      },
      {
        label: 'Previous Attempt (%)',
        data: assessedSkills.map((s) => s.previousProficiency ?? 0),
        backgroundColor: '#FBCFE8',
        borderRadius: 10
      }
    ]
  };

  // 1.3 Assessment Performance Chart
  const assessmentPerfChartData = {
    labels: assessmentPerformance.map((a, idx) => `${idx + 1}. ${a.domain}`),
    datasets: [
      {
        label: 'Score (%)',
        data: assessmentPerformance.map((a) => a.percentage),
        backgroundColor: assessmentPerformance.map((a) => (a.passed ? '#34D399' : '#93C5FD')),
        borderRadius: 10
      }
    ]
  };

  // 1.4 Learning Progress Donut Chart
  const learningDonutData = {
    labels: ['Completed', 'In Progress', 'Not Started (Catalog)'],
    datasets: [
      {
        data: [
          learningDonut.completed,
          learningDonut.inProgress,
          learningDonut.notStarted
        ],
        backgroundColor: ['#34D399', '#60B6F8', '#E2F1FC'],
        borderColor: '#FFFFFF',
        borderWidth: 3
      }
    ]
  };

  // 1.5 Job Application Funnel Chart
  const funnelChartData = {
    labels: [...applicationFunnel.map((f) => f.stage), 'Rejected'],
    datasets: [
      {
        label: 'Applications',
        data: [
          ...applicationFunnel.map((f) => f.count),
          statusCounts.Rejected || 0
        ],
        backgroundColor: [
          '#60B6F8',
          '#93C5FD',
          '#C4B5FD',
          '#F9A8D4',
          '#34D399',
          '#CBD5E1'
        ],
        borderRadius: 10
      }
    ]
  };

  const pctAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { callback: (val: any) => `${val}%` }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/50 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Career Progress Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#334155]">
          {language === 'hi' ? 'मेरी करियर प्रगति और एनालिटिक्स 📈' : 'My Career Analytics Dashboard 📈'}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl leading-relaxed">
          Every chart and milestone below is computed live from your actual MongoDB records —
          assessments, learning completions, practical assignments, portfolio deliverables, and
          applications.
        </p>

        {/* Range Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition ${
                range === opt.id
                  ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8] shadow-baby-sm'
                  : 'bg-white text-[#64748B] border-[#D8ECFA] hover:bg-[#EAF7FF] hover:text-[#334155]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Journey Completion</span>
            <Target className="w-4 h-4 text-[#3B9EE8]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1E3A5F]">
            {summary.journeyPercentage ?? 0}%
          </p>
          <p className="text-[11px] text-[#64748B]">
            {summary.completedStagesCount ?? 0} of 7 SETU stages completed
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Assessments Taken</span>
            <Award className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155]">
            {summary.totalAssessments ?? 0}
          </p>
          <p className="text-[11px] text-[#64748B]">
            {summary.totalAssessments > 0
              ? `Avg ${summary.averageAssessmentScore}% • ${summary.passedAssessments} passed`
              : 'Take your first assessment'}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Learning &amp; Practice</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155]">
            {summary.completedLearningCount ?? 0}
          </p>
          <p className="text-[11px] text-[#64748B]">
            {summary.completedAssignmentsCount ?? 0} assignments • {summary.portfolioProjectsCount ?? 0} projects
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Job Applications</span>
            <Briefcase className="w-4 h-4 text-[#3B9EE8]" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155]">
            {summary.applicationsCount ?? 0}
          </p>
          <p className="text-[11px] text-[#64748B]">
            {statusCounts['Interview Scheduled'] || 0} interviews • {statusCounts.Selected || 0} offers
          </p>
        </div>
      </div>

      {/* 1.1 My Career Growth Journey (Large Line Chart) */}
      <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-[#334155] font-display">
              My Career Growth Journey
            </h2>
            <p className="text-xs text-[#64748B]">
              Real recorded progress timeline across assessments, learning, assignments, portfolio, and job activity ({RANGE_OPTIONS.find((r) => r.id === range)?.label})
            </p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center space-y-3">
            <Sparkles className="w-8 h-8 text-[#3B9EE8] mx-auto" />
            <p className="text-sm font-bold text-[#334155]">
              No Recorded Activity in This Timeframe Yet
            </p>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              SETU never fabricates fake growth charts. Complete a skill assessment, finish a
              tutorial, submit a practice assignment, or add a portfolio project to watch your real
              growth curve appear!
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Link
                to="/assess"
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
              >
                Take Skill Assessment
              </Link>
              <Link
                to="/learn"
                className="px-4 py-2 rounded-2xl bg-white border border-[#BDE0FE] text-[#334155] text-xs font-bold"
              >
                Start a Tutorial
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-72 sm:h-80">
            <Line data={growthChartData} options={pctAxisOptions} />
          </div>
        )}
      </section>

      {/* 1.2 My Skill Development + 1.3 Assessment Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1.2 Skill Development */}
        <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              My Skill Development
            </h2>
            <p className="text-xs text-[#64748B]">
              Measured proficiency (0–100) strictly from completed SETU assessments (Current vs Previous attempt)
            </p>
          </div>

          {assessedSkills.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center space-y-2">
              <p className="text-xs font-bold text-[#334155]">No Assessed Skills Yet</p>
              <p className="text-xs text-[#64748B]">
                Self-reported profile skills are never treated as verified scores. Take an
                assessment to benchmark your measurable proficiency!
              </p>
              <Link
                to="/assess"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2589D6] hover:underline"
              >
                <span>Go to Skill Assessments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="h-64">
                <Bar data={skillDevChartData} options={pctAxisOptions} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {strongestSkill && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Strongest Assessed Skill
                    </span>
                    <span className="font-extrabold text-emerald-900">
                      {strongestSkill.skill} ({strongestSkill.currentProficiency}%)
                    </span>
                  </div>
                )}
                {weakestSkill && (
                  <div className="p-3 rounded-2xl bg-[#FCE7F3]/50 border border-pink-200 text-xs">
                    <span className="text-[10px] font-bold uppercase text-pink-700 block">
                      Focus Area to Improve
                    </span>
                    <span className="font-extrabold text-[#334155]">
                      {weakestSkill.skill} ({weakestSkill.currentProficiency}%)
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Self-Reported Skills Kept Clearly Separate */}
          {selfReportedSkills.length > 0 && (
            <div className="pt-3 border-t border-[#EAF7FF] space-y-2">
              <p className="text-[11px] font-bold text-[#64748B]">
                Self-Reported Profile Skills (Not Yet Assessed — Click to Verify):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selfReportedSkills.map((s, i) => (
                  <Link
                    key={i}
                    to="/assess"
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F8FCFF] hover:bg-[#EAF7FF] border border-[#D8ECFA] text-[#475569]"
                  >
                    {s.name} ({s.proficiency})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 1.3 Assessment Performance Graph */}
        <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Assessment Performance History
            </h2>
            <p className="text-xs text-[#64748B]">
              Score obtained, percentage, and improvement across recorded attempts
            </p>
          </div>

          {assessmentPerformance.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center space-y-2">
              <p className="text-xs font-bold text-[#334155]">No Assessment Attempts Recorded</p>
              <p className="text-xs text-[#64748B]">
                Complete your first assessment to see score breakdowns and attempt-by-attempt
                improvement here.
              </p>
            </div>
          ) : (
            <>
              <div className="h-56">
                <Bar data={assessmentPerfChartData} options={pctAxisOptions} />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pt-2 border-t border-[#EAF7FF]">
                {assessmentPerformance
                  .slice()
                  .reverse()
                  .slice(0, 6)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#334155] truncate">{a.assessmentName}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {new Date(a.date).toLocaleDateString('en-IN')} • {a.score}/{a.maxScore}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-extrabold text-[#1E3A5F]">{a.percentage}%</span>
                        {typeof a.improvement === 'number' && a.improvement !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.improvement > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {a.improvement > 0 ? `+${a.improvement}%` : `${a.improvement}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* 1.4 Learning Progress Donut + 1.5 Job Application Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1.4 Learning Donut */}
        <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#334155] font-display">
                Learning Progress
              </h2>
              <p className="text-xs text-[#64748B]">
                Enrolled: {learningDonut.enrolledTotal} • Completion Rate:{' '}
                <strong className="text-[#1E3A5F]">{learningDonut.completionPercentage}%</strong>
              </p>
            </div>
            <Link to="/learn" className="text-xs font-bold text-[#2589D6] hover:underline">
              Open Learn →
            </Link>
          </div>

          <div className="h-60 flex items-center justify-center">
            <Doughnut
              data={learningDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="font-extrabold text-emerald-800 text-base">{learningDonut.completed}</p>
              <p className="text-[11px] text-emerald-700">Completed</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE]">
              <p className="font-extrabold text-[#1E3A5F] text-base">{learningDonut.inProgress}</p>
              <p className="text-[11px] text-[#2589D6]">In Progress</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
              <p className="font-extrabold text-[#475569] text-base">{learningDonut.notStarted}</p>
              <p className="text-[11px] text-[#64748B]">Not Started</p>
            </div>
          </div>
        </section>

        {/* 1.5 Job Application Analytics & Funnel */}
        <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#334155] font-display">
                Job Application Analytics &amp; Funnel
              </h2>
              <p className="text-xs text-[#64748B]">
                Live conversion tracking from submission to interviews and offers
              </p>
            </div>
            <Link to="/applications" className="text-xs font-bold text-[#2589D6] hover:underline">
              My Applications →
            </Link>
          </div>

          {(data?.applications?.total || 0) === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center space-y-2">
              <p className="text-xs font-bold text-[#334155]">No Applications Submitted Yet</p>
              <p className="text-xs text-[#64748B]">
                Apply to opportunities on SETU to track your conversion funnel from Submitted →
                Shortlisted → Interview → Offer.
              </p>
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2589D6] hover:underline"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="h-56">
                <Bar
                  data={funnelChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                  }}
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                {applicationFunnel.map((stage) => (
                  <div
                    key={stage.stage}
                    className="p-2 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA]"
                  >
                    <p className="font-extrabold text-[#1E3A5F]">{stage.rate}%</p>
                    <p className="text-[10px] text-[#64748B] truncate">{stage.stage}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* 1.6 Interactive 7-Stage Career Journey */}
      <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Interactive 7-Stage SETU Career Journey
            </h2>
            <p className="text-xs text-[#64748B]">
              Click any stage to inspect completed activities, pending requirements, and your next step
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] self-start">
            {summary.journeyPercentage ?? 0}% Overall
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {journeyStages.map((stage, idx) => {
            const isSelected = activeStage?.id === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-3.5 rounded-2xl border text-left transition space-y-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#EAF7FF] to-[#D6EEFF] border-[#3B9EE8] shadow-baby-sm'
                    : stage.completed
                    ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400'
                    : 'bg-[#F8FCFF] border-[#D8ECFA] hover:border-[#A2D2FF]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#64748B]">Stage {idx + 1}</span>
                  {stage.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[#A2D2FF]" />
                  )}
                </div>
                <p className="text-xs font-extrabold text-[#334155]">{stage.label}</p>
                <p className="text-[10px] text-[#64748B]">
                  {stage.completed ? 'Completed' : 'In Progress'}
                </p>
              </button>
            );
          })}
        </div>

        {activeStage && (
          <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#BDE0FE] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1E3A5F]">{activeStage.label}</h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeStage.completed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]'
                    }`}
                  >
                    {activeStage.completed ? 'Completed ✓' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">{activeStage.requirements}</p>
              </div>

              {activeStage.nextAction && (
                <Link
                  to={activeStage.nextAction.route}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm shrink-0"
                >
                  <span>{activeStage.nextAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#D8ECFA] space-y-1.5">
                <p className="font-bold text-emerald-700">✓ Completed Activities</p>
                {activeStage.completedActivities?.length > 0 ? (
                  <ul className="space-y-1 text-[#475569]">
                    {activeStage.completedActivities.map((act: string, i: number) => (
                      <li key={i}>• {act}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#64748B]">None recorded yet for this stage.</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#D8ECFA] space-y-1.5">
                <p className="font-bold text-[#1E3A5F]">Next Requirements</p>
                {activeStage.pendingActivities?.length > 0 ? (
                  <ul className="space-y-1 text-[#475569]">
                    {activeStage.pendingActivities.map((act: string, i: number) => (
                      <li key={i}>• {act}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-emerald-700 font-medium">All stage requirements met! 🩵</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 1.7 Your Career Insights */}
      <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#3B9EE8]" />
          <h2 className="text-base font-extrabold text-[#334155] font-display">
            Your Career Insights
          </h2>
        </div>

        {insights.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            Keep completing activities on SETU to unlock personalized data-backed career insights.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                  item.type === 'positive'
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : 'bg-[#F8FCFF] border-[#BDE0FE] text-[#334155]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {item.type === 'positive' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-[#3B9EE8] shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed font-medium">{item.message}</span>
                </div>
                {item.route && (
                  <Link
                    to={item.route}
                    className="text-[#2589D6] font-bold hover:underline shrink-0 inline-flex items-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
