import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Award,
  BookOpen,
  FolderGit2,
  FileText,
  ArrowRight,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Mail,
  ShieldCheck,
  Landmark,
  Briefcase,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Compass,
  Clock
} from 'lucide-react';
import { useAuth, isBuildHerEligible } from '../context/AuthContext';
import { apiFetch, extractArray, formatLocation, unwrapData } from '../utils/api';
import { UserAvatar } from '../components/UserAvatar';
import { formatAcademicScore, formatEducationTitle } from '../utils/educationHelpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const CANE_QUICK_PROMPTS = [
  { label: 'What career suits me?', mode: 'career_discovery' },
  { label: 'Find jobs matching my skills', mode: 'job_search' },
  { label: 'Help me build my resume', mode: 'resume' },
  { label: 'What should I learn next?', mode: 'skill_gap' },
  { label: 'Prepare me for an interview', mode: 'interview' }
];

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchDashboard = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiFetch('/api/dashboard');
      if (res.ok && res.data) {
        setDashboard(unwrapData(res.data));
      } else {
        setDashboard(null);
        setLoadError(res.error || 'Could not load your personalized dashboard right now.');
      }
    } catch (err: any) {
      setDashboard(null);
      setLoadError(err?.message || 'Unable to connect to SETU Dashboard API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id, user?.profileCompletion]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-8 animate-pulse">
        <div className="h-32 bg-white rounded-3xl border border-[#D8ECFA]" />
        <div className="h-44 bg-white rounded-3xl border border-[#D8ECFA]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-[#D8ECFA]" />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-baby-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#334155]">Could Not Load Dashboard</h2>
        <p className="text-xs text-[#64748B]">{loadError}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const sp = user?.seekerProfile || {};
  const profilePct = dashboard?.profileCompletionPercentage ?? user?.profileCompletion ?? 15;
  const careerGoalText =
    (Array.isArray(sp.careerGoalsList) && sp.careerGoalsList.length > 0
      ? sp.careerGoalsList.join(' • ')
      : sp.careerGoals) || 'Build skills & discover verified career opportunities';

  const skillsVerified = dashboard?.skillsVerifiedCount ?? 0;
  const learningCompleted = dashboard?.learningCompletedCount ?? 0;
  const portfolioProjects = dashboard?.portfolioProjectsCount ?? 0;
  const activeApplications = dashboard?.activeApplicationsCount ?? 0;

  const resumeStatus = dashboard?.resumeStatus || {
    state: 'incomplete',
    label: 'Resume Incomplete',
    savedCount: 0,
    uploadedCount: 0,
    lastUpdated: null
  };
  const suggestedNextStep = dashboard?.suggestedNextStep || {
    title: 'Complete Your First Skill Assessment',
    description: 'Benchmark your strengths and earn verified skill badges.',
    actionLabel: 'Start Assessment',
    route: '/assess'
  };

  const compactPoints: Array<{ label: string; value: number }> = Array.isArray(
    dashboard?.compactProgressPoints
  )
    ? dashboard.compactProgressPoints
    : [];
  const continueLearning = extractArray(dashboard?.continueLearning);
  const savedRoadmaps = extractArray(dashboard?.savedRoadmaps);
  const recommendedJobs = extractArray(dashboard?.recommendedOpportunities);
  const recommendedSchemes = extractArray(dashboard?.recommendedSchemes);
  const recommendedAssessments = extractArray(dashboard?.recommendedAssessments);
  const recommendedLearning = extractArray(dashboard?.recommendedLearning);
  const educationList = Array.isArray(sp.education) ? sp.education : [];

  const compactChartData = {
    labels: compactPoints.map((p) => p.label),
    datasets: [
      {
        label: 'Score %',
        data: compactPoints.map((p) => p.value),
        borderColor: '#3B9EE8',
        backgroundColor: 'rgba(162, 210, 255, 0.3)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#2589D6'
      }
    ]
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Welcome Section */}
      <section className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl p-6 sm:p-8 border border-[#BDE0FE] shadow-baby flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar
            name={user?.name}
            src={user?.profilePicture || user?.avatar}
            size="xl"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#334155] font-display truncate">
              Welcome back, {user?.name || 'Member'}! 🩵
            </h1>
            <p className="text-xs text-[#1E3A5F] font-semibold line-clamp-1">
              Career Goal: <span className="text-[#475569] font-normal">{careerGoalText}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F] font-bold">
                {profilePct}% Profile Complete
              </span>
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="w-3.5 h-3.5 text-[#3B9EE8]" />
                {user?.email}
              </span>
              {sp.location?.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  {[sp.location.city, sp.location.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to={profilePct < 100 ? '/onboarding' : '/profile'}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
          >
            {profilePct < 100 ? 'Complete Profile' : 'Edit Profile'}
          </Link>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] shadow-baby-sm text-xs font-bold rounded-2xl transition"
          >
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 2. Prominent CANE AI Assistant Card */}
      <section className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/60 rounded-3xl p-6 sm:p-7 border border-[#BDE0FE] shadow-baby space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#60B6F8] to-[#F472B6] text-white flex items-center justify-center shadow-baby-sm shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
                Ask CANE Anything About Your Career
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#334155] font-display">
                Meet CANE — Your Personal AI Career Companion
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Confused about your career? CANE is here to guide you from skills to success.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/cane"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-extrabold shadow-baby-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with CANE</span>
            </Link>
            <Link
              to="/cane?mode=career_discovery&prompt=What%20career%20paths%20suit%20my%20profile%3F"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
            >
              <Compass className="w-3.5 h-3.5 text-[#3B9EE8]" />
              <span>Explore Career Paths</span>
            </Link>
            <Link
              to="/cane?mode=roadmap&prompt=Help%20me%20find%20my%20next%20career%20step."
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#FCE7F3]/60 hover:bg-[#FCE7F3] text-[#1E3A5F] border border-pink-200 text-xs font-bold transition"
            >
              <span>Find My Next Step</span>
            </Link>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#D8ECFA]/70">
          {CANE_QUICK_PROMPTS.map((item) => (
            <Link
              key={item.label}
              to={`/cane?mode=${item.mode}&prompt=${encodeURIComponent(item.label)}`}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] transition"
            >
              ✨ {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Compact Career Progress + 6. Resume Status + 7. Suggested Next Step */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Compact My Career Progress */}
        <section className="bg-white rounded-3xl p-5 border border-[#D8ECFA] shadow-baby-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#334155] font-display flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#3B9EE8]" />
                <span>My Career Progress</span>
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Journey: <strong className="text-[#1E3A5F]">{dashboard?.journeyPercentage ?? 0}%</strong>
              </p>
            </div>
            <Link
              to="/progress"
              className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]"
            >
              View Full Analytics
            </Link>
          </div>

          {compactPoints.length > 0 ? (
            <div className="h-32">
              <Line
                data={compactChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 100, ticks: { stepSize: 50 } }
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center text-[11px] text-[#64748B]">
              Complete an assessment or learning module to visualize your growth graph here.
            </div>
          )}
        </section>

        {/* Resume Status Card */}
        <section className="bg-white rounded-3xl p-5 border border-[#D8ECFA] shadow-baby-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#334155] font-display flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#3B9EE8]" />
                <span>Resume Status</span>
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  resumeStatus.state === 'ready'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : resumeStatus.state === 'uploaded'
                    ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#BDE0FE]'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {resumeStatus.label}
              </span>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              {resumeStatus.savedCount > 0 || resumeStatus.uploadedCount > 0
                ? `${resumeStatus.savedCount} built version(s) • ${resumeStatus.uploadedCount} uploaded file(s)`
                : 'No resume ready yet. Create an ATS-friendly PDF/DOCX resume directly from your SETU profile.'}
            </p>
            {resumeStatus.lastUpdated && (
              <p className="text-[11px] text-[#64748B] inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#3B9EE8]" />
                Last updated {new Date(resumeStatus.lastUpdated).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>

          <Link
            to="/portfolio?tab=resume"
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold text-center shadow-baby-sm transition"
          >
            Build or Update Resume
          </Link>
        </section>

        {/* Suggested Next Step Card */}
        <section className="bg-gradient-to-b from-[#EAF7FF]/80 to-white rounded-3xl p-5 border border-[#BDE0FE] shadow-baby-sm flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
              Suggested Next Step
            </span>
            <h3 className="text-sm font-extrabold text-[#1E3A5F] font-display">
              {suggestedNextStep.title}
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              {suggestedNextStep.description}
            </p>
          </div>
          <Link
            to={suggestedNextStep.route}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
          >
            <span>{suggestedNextStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </div>

      {/* 4 Key Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/assess"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Verified Skills</span>
            <Award className="w-4 h-4 text-[#3B9EE8]" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-2">{skillsVerified}</p>
          <p className="text-[11px] text-[#64748B]">earned via assessments</p>
        </Link>

        <Link
          to="/learn"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Courses Completed</span>
            <BookOpen className="w-4 h-4 text-[#2589D6]" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-2">{learningCompleted}</p>
          <p className="text-[11px] text-[#64748B]">tutorials &amp; assignments</p>
        </Link>

        <Link
          to="/portfolio"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Portfolio Projects</span>
            <FolderGit2 className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-2">{portfolioProjects}</p>
          <p className="text-[11px] text-[#64748B]">published work samples</p>
        </Link>

        <Link
          to="/applications"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Applications</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-2">{activeApplications}</p>
          <p className="text-[11px] text-[#64748B]">live submissions</p>
        </Link>
      </section>

      {/* 5. Continue Learning (Unfinished courses & assignments) + Saved CANE Roadmaps */}
      {(continueLearning.length > 0 || savedRoadmaps.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {continueLearning.length > 0 && (
            <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#334155] font-display">
                  Continue Learning 📚
                </h2>
                <Link to="/learn" className="text-xs font-bold text-[#2589D6] hover:underline">
                  View All →
                </Link>
              </div>
              <div className="space-y-2.5">
                {continueLearning.map((item: any) => (
                  <Link
                    key={item._id}
                    to={`/learn?resource=${item.resourceId?._id || item.resourceId}`}
                    className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#334155] truncate">
                        {item.resourceId?.title || 'Learning Module'}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        {item.resourceId?.skillTag || 'Skill'} • In Progress
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                      Resume
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {savedRoadmaps.length > 0 && (
            <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#334155] font-display">
                  Saved CANE Roadmaps 🗺️
                </h2>
                <Link to="/cane?mode=roadmap" className="text-xs font-bold text-[#2589D6] hover:underline">
                  New Roadmap →
                </Link>
              </div>
              <div className="space-y-2.5">
                {savedRoadmaps.map((rm: any) => (
                  <div
                    key={rm._id}
                    className="p-3.5 rounded-2xl bg-[#FCE7F3]/30 border border-pink-200/70 space-y-1"
                  >
                    <p className="text-xs font-bold text-[#334155]">{rm.title}</p>
                    <p className="text-[11px] text-[#64748B] line-clamp-2">{rm.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Personalized Build Her Sanctuary Card (Exclusively for Female Job Seekers) */}
      {isBuildHerEligible(user) && (
        <section className="rounded-3xl bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/60 border border-pink-200/80 p-6 shadow-baby-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-pink-200 text-[11px] font-bold text-pink-700">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Build Her Exclusive Hub</span>
            </div>
            <h2 className="text-lg font-extrabold text-[#1E3A5F] font-display">
              Women Career Restart, Entrepreneurship &amp; Flexible Roles
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Access verified career-restart jobs, flexible remote options, women entrepreneurship schemes, mentorship circles, and POSH workplace safety support.
            </p>
          </div>
          <Link
            to="/build-her"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm shrink-0"
          >
            <span>Open Build Her</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* 4. Recommended Opportunities */}
      <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#3B9EE8]" />
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Recommended Opportunities 💼
            </h2>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendedJobs.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#64748B]">
              No live SETU employer vacancies posted right now. Browse verified Government of India
              career &amp; apprenticeship portals (NCS, NATS, NAPS, PM Internship) on Opportunities.
            </p>
            <Link
              to="/opportunities"
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shrink-0 text-center"
            >
              Explore Portals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedJobs.map((opp: any) => (
              <Link
                key={opp._id}
                to="/opportunities"
                className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F] uppercase">
                      {opp.opportunityType || 'Job'}
                    </span>
                    {typeof opp.matchScore === 'number' && (
                      <span className="text-[11px] font-extrabold text-[#2589D6]">
                        {opp.matchScore}% Match
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#334155] line-clamp-1">{opp.title}</h3>
                  <p className="text-xs text-[#64748B] truncate">
                    {opp.organisationName} • {formatLocation(opp.location)}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#2589D6] inline-flex items-center gap-1">
                  <span>View &amp; Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Schemes + Assessments + Learning + Education Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#334155] font-display flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-[#3B9EE8]" />
              <span>Government Schemes For You</span>
            </h2>
            <Link to="/schemes" className="text-xs font-bold text-[#2589D6] hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2.5">
            {recommendedSchemes.map((scheme: any) => (
              <div
                key={scheme._id}
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#334155] truncate">{scheme.title}</p>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {scheme.eligibilityStatus} • {scheme.ministry}
                  </p>
                </div>
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#334155] font-display flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#3B9EE8]" />
              <span>Recommended Assessments &amp; Learning</span>
            </h2>
            <Link to="/assess" className="text-xs font-bold text-[#2589D6] hover:underline">
              Assessments →
            </Link>
          </div>
          <div className="space-y-2.5">
            {recommendedAssessments.slice(0, 2).map((a: any) => (
              <Link
                key={a._id}
                to="/assess"
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#334155] truncate">{a.title}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{a.recommendationReason}</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] shrink-0">
                  Assess
                </span>
              </Link>
            ))}
            {recommendedLearning.slice(0, 2).map((lr: any) => (
              <Link
                key={lr._id}
                to={`/learn?resource=${lr._id}`}
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#334155] truncate">{lr.title}</p>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {lr.recommendationReason || lr.duration}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Learn
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Education & Verified Skills Quick Bar */}
      {educationList.length > 0 && (
        <section className="bg-white rounded-3xl p-5 border border-[#D8ECFA] shadow-baby-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <GraduationCap className="w-5 h-5 text-[#3B9EE8] shrink-0" />
            <div className="text-xs text-[#334155] truncate">
              <strong className="mr-1.5">{formatEducationTitle(educationList[0])}</strong>
              {formatAcademicScore(educationList[0]) && (
                <span className="px-2 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] font-bold text-[11px]">
                  {formatAcademicScore(educationList[0])}
                </span>
              )}
            </div>
          </div>
          <Link to="/profile" className="text-xs font-bold text-[#2589D6] hover:underline">
            Manage Education &amp; Skills →
          </Link>
        </section>
      )}
    </div>
  );
};
