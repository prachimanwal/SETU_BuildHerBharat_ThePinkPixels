import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileEdit,
  Users,
  UserCheck,
  CalendarClock,
  Award,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
  Bot,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { apiFetch, unwrapData } from '../utils/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EmptyChartState: React.FC<{ title: string; subtitle: string; ctaTo?: string; ctaLabel?: string }> = ({
  title,
  subtitle,
  ctaTo,
  ctaLabel
}) => (
  <div className="h-56 flex flex-col items-center justify-center text-center px-4 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE]">
    <BarChart3 className="w-8 h-8 text-[#94A3B8] mb-2" />
    <p className="text-xs font-bold text-[#334155]">{title}</p>
    <p className="text-[11px] text-[#64748B] max-w-xs mt-1">{subtitle}</p>
    {ctaTo && ctaLabel && (
      <Link
        to={ctaTo}
        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-[11px] font-semibold border border-[#BDE0FE] hover:bg-[#D6EEFF]"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    )}
  </div>
);

export const EmployerDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiFetch('/api/employer/analytics?range=90d');
        if (!active) return;
        if (res.ok && res.data) {
          setAnalytics(unwrapData(res.data));
        } else {
          setError(res.error || 'Unable to load employer dashboard analytics.');
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Network error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading live recruitment dashboard...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-2">
        <p className="text-sm font-bold text-rose-700">{error || 'Could not load dashboard.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#3B9EE8] text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = analytics.kpis || {};
  const graphs = analytics.graphs || {};
  const isVerified = Boolean(analytics.isVerified);
  const verificationLabel = analytics.verificationLabel || 'Pending';
  const completionPct = Number(analytics.completionPercentage || 0);

  const appsOverTime = Array.isArray(graphs.applicationsOverTime) ? graphs.applicationsOverTime : [];
  const funnel = Array.isArray(graphs.recruitmentFunnel) ? graphs.recruitmentFunnel : [];
  const appsByJob = Array.isArray(graphs.applicationsByJob) ? graphs.applicationsByJob : [];
  const monthlyProgress = Array.isArray(graphs.hiringProgressByMonth)
    ? graphs.hiringProgressByMonth
    : [];
  const skillDist = Array.isArray(graphs.candidateSkillDistribution)
    ? graphs.candidateSkillDistribution
    : [];

  const hasFunnelData = funnel.some((f: any) => f.count > 0);

  const kpiCards = [
    {
      label: 'Total Published Jobs',
      value: kpis.publishedJobs ?? 0,
      icon: Briefcase,
      color: 'bg-[#EAF7FF] text-[#2589D6]',
      to: '/employer/jobs'
    },
    {
      label: 'Draft Job Postings',
      value: kpis.draftJobs ?? 0,
      icon: FileEdit,
      color: 'bg-slate-100 text-slate-600',
      to: '/employer/jobs'
    },
    {
      label: 'Total Applications',
      value: kpis.totalApplications ?? 0,
      icon: Users,
      color: 'bg-sky-50 text-sky-600',
      to: '/employer/applications'
    },
    {
      label: 'Candidates Shortlisted',
      value: kpis.shortlisted ?? 0,
      icon: UserCheck,
      color: 'bg-indigo-50 text-indigo-600',
      to: '/employer/applications'
    },
    {
      label: 'Interviews Scheduled',
      value: kpis.interviewsScheduled ?? 0,
      icon: CalendarClock,
      color: 'bg-amber-50 text-amber-600',
      to: '/employer/interviews'
    },
    {
      label: 'Offers Sent',
      value: kpis.offersSent ?? 0,
      icon: Award,
      color: 'bg-purple-50 text-purple-600',
      to: '/employer/applications'
    },
    {
      label: 'Employees Hired',
      value: kpis.hired ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
      to: '/employer/analytics'
    },
    {
      label: 'Company Verification',
      value: verificationLabel,
      icon: isVerified ? ShieldCheck : ShieldAlert,
      color: isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      to: '/employer/verification'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2589D6]">
            Live Recruitment Command Center
          </span>
          <h1 className="text-2xl font-bold text-[#1E3A5F] font-display mt-0.5">
            Employer Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            All metrics and charts reflect live records from your SETU MongoDB database (last 90 days).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/employer/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isVerified ? 'Post New Job' : 'Create Job Draft'}</span>
          </Link>
          <Link
            to="/employer/candidates"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE] transition"
          >
            <Users className="w-4 h-4" />
            <span>Search Candidates</span>
          </Link>
          <Link
            to="/employer/cane"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F8FCFF] text-[#1E3A5F] text-xs font-semibold border border-[#D8ECFA] transition"
          >
            <Bot className="w-4 h-4 text-[#3B9EE8]" />
            <span>CANE AI Recruiter</span>
          </Link>
        </div>
      </div>

      {/* Onboarding & Verification Banners */}
      {(!analytics.onboardingCompleted || completionPct < 100) && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#EAF7FF] to-white border border-[#BDE0FE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-white border border-[#D8ECFA] text-[#3B9EE8]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E3A5F]">
                Complete Your Company Onboarding ({completionPct}%)
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Finish setting up your company profile, representative details, verification documents, and hiring preferences.
              </p>
            </div>
          </div>
          <Link
            to="/employer/onboarding"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#152B47] shrink-0 self-start sm:self-auto"
          >
            <span>Continue Onboarding</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!isVerified && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">Company Verification: {verificationLabel}</p>
              <p className="mt-0.5">
                You can create and save job drafts right now. Publishing live jobs unlocks automatically once a SETU administrator verifies your business documents.
              </p>
            </div>
          </div>
          <Link
            to="/employer/verification"
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 self-start sm:self-auto"
          >
            Manage Verification
          </Link>
        </div>
      )}

      {/* 8 Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm hover:border-[#60B6F8] hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-2xl ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#3B9EE8] transition" />
              </div>
              <p className="mt-4 text-xl sm:text-2xl font-extrabold text-[#1E3A5F] truncate">
                {card.value}
              </p>
              <p className="text-xs font-medium text-[#64748B] mt-0.5">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* 5 INTERACTIVE REAL-DATA CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 1: Applications Received Over Time */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">Applications Received Over Time</h3>
              <p className="text-[11px] text-[#64748B]">Daily applicant submissions from MongoDB</p>
            </div>
            <Link to="/employer/analytics" className="text-xs font-semibold text-[#2589D6] hover:underline">
              Full Analytics
            </Link>
          </div>
          {appsOverTime.length === 0 ? (
            <EmptyChartState
              title="No application trend data yet"
              subtitle="Once candidates apply to your published jobs, daily application volumes will appear here."
              ctaTo="/employer/jobs"
              ctaLabel="Manage Jobs"
            />
          ) : (
            <div className="h-60">
              <Line
                data={{
                  labels: appsOverTime.map((d: any) => d.date),
                  datasets: [
                    {
                      label: 'Applications',
                      data: appsOverTime.map((d: any) => d.count),
                      borderColor: '#3B9EE8',
                      backgroundColor: 'rgba(59, 158, 232, 0.14)',
                      fill: true,
                      tension: 0.35
                    }
                  ]
                }}
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

        {/* GRAPH 2: Recruitment Funnel */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#1E3A5F]">Recruitment Funnel</h3>
            <p className="text-[11px] text-[#64748B]">
              Applied → Screening → Shortlisted → Interview → Offered → Hired
            </p>
          </div>
          {!hasFunnelData ? (
            <EmptyChartState
              title="Recruitment funnel awaiting applicants"
              subtitle="Track candidate progression through every hiring stage as applications arrive."
              ctaTo="/employer/applications"
              ctaLabel="Open Applications"
            />
          ) : (
            <div className="h-60">
              <Bar
                data={{
                  labels: funnel.map((f: any) => f.stage),
                  datasets: [
                    {
                      label: 'Candidates',
                      data: funnel.map((f: any) => f.count),
                      backgroundColor: [
                        '#93C5FD',
                        '#60A5FA',
                        '#3B82F6',
                        '#6366F1',
                        '#8B5CF6',
                        '#10B981'
                      ],
                      borderRadius: 10
                    }
                  ]
                }}
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

        {/* GRAPH 3: Applications by Job Position */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#1E3A5F]">Applications by Job Position</h3>
            <p className="text-[11px] text-[#64748B]">Applicant distribution across your vacancies</p>
          </div>
          {appsByJob.length === 0 ? (
            <EmptyChartState
              title="No position-level applications yet"
              subtitle="Publish a verified job posting to compare applicant interest across open roles."
              ctaTo="/employer/jobs"
              ctaLabel="Open Job Management"
            />
          ) : (
            <div className="h-60">
              <Bar
                data={{
                  labels: appsByJob.map((j: any) =>
                    j.title.length > 22 ? `${j.title.slice(0, 22)}…` : j.title
                  ),
                  datasets: [
                    {
                      label: 'Applications',
                      data: appsByJob.map((j: any) => j.count),
                      backgroundColor: '#3B9EE8',
                      borderRadius: 10
                    }
                  ]
                }}
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

        {/* GRAPH 4: Hiring Progress by Month */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#1E3A5F]">Hiring Progress by Month</h3>
            <p className="text-[11px] text-[#64748B]">Monthly applications, interviews, and confirmed hires</p>
          </div>
          {monthlyProgress.length === 0 ? (
            <EmptyChartState
              title="No monthly hiring history yet"
              subtitle="Monthly trends populate automatically from real applications, interviews, and hires."
            />
          ) : (
            <div className="h-60">
              <Bar
                data={{
                  labels: monthlyProgress.map((m: any) => m.month),
                  datasets: [
                    {
                      label: 'Applications',
                      data: monthlyProgress.map((m: any) => m.applications),
                      backgroundColor: '#93C5FD',
                      borderRadius: 6
                    },
                    {
                      label: 'Interviews',
                      data: monthlyProgress.map((m: any) => m.interviews),
                      backgroundColor: '#6366F1',
                      borderRadius: 6
                    },
                    {
                      label: 'Hired',
                      data: monthlyProgress.map((m: any) => m.hires),
                      backgroundColor: '#10B981',
                      borderRadius: 6
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* GRAPH 5: Candidate Skill Distribution */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#1E3A5F]">Candidate Skill Distribution</h3>
          <p className="text-[11px] text-[#64748B]">
            Aggregated strictly from candidate-provided skills across your real applicant pool
          </p>
        </div>
        {skillDist.length === 0 ? (
          <EmptyChartState
            title="No applicant skills recorded yet"
            subtitle="As candidates apply to your roles, their declared and verified SETU skills will be visualized here."
            ctaTo="/employer/candidates"
            ctaLabel="Discover Consenting Candidates"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: skillDist.map((s: any) => s.skill),
                  datasets: [
                    {
                      data: skillDist.map((s: any) => s.count),
                      backgroundColor: [
                        '#3B9EE8',
                        '#6366F1',
                        '#10B981',
                        '#F59E0B',
                        '#EC4899',
                        '#06B6D4',
                        '#8B5CF6',
                        '#14B8A6',
                        '#F97316',
                        '#64748B'
                      ]
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right' } }
                }}
              />
            </div>
            <div className="space-y-2">
              {skillDist.map((item: any) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs"
                >
                  <span className="font-semibold text-[#1E3A5F]">{item.skill}</span>
                  <span className="font-bold text-[#2589D6]">{item.count} candidate(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
