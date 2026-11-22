import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray, formatLocation, unwrapData } from '../utils/api';
import { UserAvatar } from '../components/UserAvatar';
import { formatAcademicScore, formatEducationTitle } from '../utils/educationHelpers';

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-[#D8ECFA]" />
          ))}
        </div>
        <div className="h-56 bg-white rounded-3xl border border-[#D8ECFA]" />
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
  const profilePct =
    dashboard?.profileCompletionPercentage ?? user?.profileCompletion ?? 15;
  const missingSections: string[] = Array.isArray(dashboard?.missingSections)
    ? dashboard.missingSections
    : Array.isArray(user?.missingSections)
    ? user.missingSections
    : [];

  const skillsVerified = dashboard?.skillsVerifiedCount ?? 0;
  const learningCompleted = dashboard?.learningCompletedCount ?? 0;
  const learningStarted = dashboard?.learning?.startedCount ?? 0;
  const portfolioProjects = dashboard?.portfolioProjectsCount ?? 0;
  const activeApplications = dashboard?.activeApplicationsCount ?? 0;
  const savedTotal =
    (dashboard?.savedOpportunitiesCount ?? 0) + (dashboard?.savedSchemesCount ?? 0);

  const detailedSkills = Array.isArray(sp.detailedSkills) ? sp.detailedSkills : [];
  const fallbackSkills: string[] = Array.isArray(sp.skills) ? sp.skills : [];
  const educationList = Array.isArray(sp.education) ? sp.education : [];
  const interests = Array.isArray(sp.interests) ? sp.interests : [];
  const prefs = sp.employmentPreferences || {};

  const recommendedJobs = extractArray(dashboard?.recommendedOpportunities);
  const recommendedSchemes = extractArray(dashboard?.recommendedSchemes);
  const recommendedAssessments = extractArray(dashboard?.recommendedAssessments);
  const recommendedLearning = extractArray(dashboard?.recommendedLearning);
  const journeyStages = extractArray(dashboard?.journeyStages);
  const recentActivities = extractArray(dashboard?.recentActivity);
  const readiness = dashboard?.careerReadiness || {
    score: Math.round(profilePct * 0.35),
    label: 'Getting Started',
    note: 'Guidance indicator combining your profile completeness, verified skills, learning, and portfolio.'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/70 rounded-3xl p-6 sm:p-8 border border-[#BDE0FE] shadow-baby flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar
            name={user?.name}
            src={user?.profilePicture || user?.avatar}
            size="xl"
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#334155] font-display truncate">
              Welcome Back, {user?.name || 'Member'}! 🩵
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] mt-0.5 font-medium">
              Your next opportunity is closer than you think.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1 truncate">
                <Mail className="w-3.5 h-3.5 text-[#3B9EE8] shrink-0" />
                <span className="truncate">{user?.email}</span>
              </span>
              {sp.location?.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  <span>
                    {[sp.location.city, sp.location.state].filter(Boolean).join(', ')}
                  </span>
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

      {/* Profile Completion + Explainable Career Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#334155]">Your Career Overview</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                  {profilePct}% Profile Complete
                </span>
              </div>
              {missingSections.length > 0 && (
                <p className="text-[11px] text-[#64748B] mt-1">
                  Add <strong className="text-[#334155]">{missingSections.join(' • ')}</strong> to
                  sharpen your matches.
                </p>
              )}
            </div>
            <Link
              to="/profile"
              className="text-xs font-bold text-[#2589D6] hover:underline shrink-0"
            >
              Update Profile →
            </Link>
          </div>

          <div className="w-full h-2.5 bg-[#EAF7FF] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#60B6F8] to-[#3B9EE8] rounded-full transition-all duration-500"
              style={{ width: `${profilePct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Education Snapshot */}
            <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F]">
                <GraduationCap className="w-4 h-4 text-[#3B9EE8]" />
                <span>Education</span>
              </div>
              {educationList.length > 0 ? (
                <div className="space-y-1">
                  {educationList.slice(0, 2).map((ed, idx) => {
                    const score = formatAcademicScore(ed);
                    return (
                      <div key={idx} className="text-xs text-[#334155]">
                        <p className="font-semibold truncate">{formatEducationTitle(ed)}</p>
                        {score && (
                          <p className="text-[11px] text-[#2589D6] font-semibold">{score}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">
                  Add your education &amp; percentage/CGPA in My Profile.
                </p>
              )}
            </div>

            {/* Interests & Preferences */}
            <div className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A5F]">
                <Sparkles className="w-4 h-4 text-[#3B9EE8]" />
                <span>Interests &amp; Preferences</span>
              </div>
              <p className="text-xs text-[#334155] line-clamp-2">
                {interests.length > 0 ? interests.join(' • ') : 'No career interests selected yet'}
              </p>
              <p className="text-[11px] text-[#64748B]">
                {(prefs.jobTypes || []).join(', ') || 'Open to opportunities'} •{' '}
                {(prefs.workModes || []).join(', ') || 'Flexible work mode'}
              </p>
            </div>
          </div>

          {/* Skills Chips (Verified vs Self-Reported) */}
          <div className="pt-2 border-t border-[#EAF7FF] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#334155]">Your Top Skills</span>
              <Link to="/assess" className="text-[11px] font-bold text-[#2589D6] hover:underline">
                Verify via Assessments →
              </Link>
            </div>
            {detailedSkills.length > 0 || fallbackSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(detailedSkills.length > 0
                  ? detailedSkills
                  : fallbackSkills.map((name) => ({ name, verified: false, source: 'self_reported' }))
                )
                  .slice(0, 10)
                  .map((sk: any, idx: number) => {
                    const isVerified = Boolean(sk.verified || sk.source === 'assessment_verified');
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#475569]'
                        }`}
                      >
                        {isVerified && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                        <span>{sk.name}</span>
                        <span className="text-[9px] opacity-75">
                          {isVerified ? 'Verified' : 'Self-Reported'}
                        </span>
                      </span>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">
                Add skills in your profile so SETU can personalize your assessments, learning, and job matches.
              </p>
            )}
          </div>
        </section>

        {/* Explainable Career Readiness Guidance Card */}
        <section className="bg-gradient-to-b from-[#EAF7FF] to-white rounded-3xl p-6 border border-[#BDE0FE] shadow-baby-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2589D6]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Career Readiness Guidance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#1E3A5F] font-display">
                {readiness.score}%
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F]">
                {readiness.label}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">{readiness.note}</p>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#D8ECFA] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Saved Bookmarks</span>
              <span className="font-bold text-[#1E3A5F] inline-flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-[#3B9EE8]" />
                {savedTotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Journey Progress</span>
              <span className="font-bold text-[#1E3A5F]">{dashboard?.journeyPercentage ?? 0}%</span>
            </div>
          </div>
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
            <div className="w-9 h-9 rounded-2xl bg-[#EAF7FF] flex items-center justify-center text-[#3B9EE8]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-3">{skillsVerified}</p>
          <p className="text-[11px] text-[#64748B]">earned via assessments</p>
        </Link>

        <Link
          to="/learn"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Courses Completed</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EAF7FF] flex items-center justify-center text-[#2589D6]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-3">{learningCompleted}</p>
          <p className="text-[11px] text-[#64748B]">
            {learningStarted > 0 ? `${learningStarted} in progress` : 'tutorials & assignments'}
          </p>
        </Link>

        <Link
          to="/portfolio"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Portfolio Projects</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EAF7FF] flex items-center justify-center text-[#1E3A5F]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-3">{portfolioProjects}</p>
          <p className="text-[11px] text-[#64748B]">published work samples</p>
        </Link>

        <Link
          to="/applications"
          className="bg-white p-5 rounded-3xl border border-[#D8ECFA] hover:border-[#60B6F8] shadow-baby-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Applications</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#334155] mt-3">{activeApplications}</p>
          <p className="text-[11px] text-[#64748B]">live submissions</p>
        </Link>
      </section>

      {/* 1. Jobs For You 💼 */}
      <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#3B9EE8]" />
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Jobs For You 💼
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
              career &amp; apprenticeship portals (NCS, NATS, NAPS, PM Internship) on the
              Opportunities page!
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
                  {opp.matchExplanation && (
                    <p className="text-[11px] text-[#475569] line-clamp-2">
                      {opp.matchExplanation}
                    </p>
                  )}
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

      {/* 2. Government Schemes For You 🏛️ */}
      <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#3B9EE8]" />
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Government Schemes For You 🏛️
            </h2>
          </div>
          <Link
            to="/schemes"
            className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedSchemes.map((scheme: any) => (
            <div
              key={scheme._id}
              className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1E3A5F] border border-[#BDE0FE]">
                  {scheme.eligibilityStatus || 'Official Scheme'}
                </span>
                <h3 className="text-sm font-bold text-[#334155] line-clamp-2">{scheme.title}</h3>
                <p className="text-[11px] text-[#64748B] line-clamp-2">{scheme.benefitsSummary}</p>
              </div>
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Assessments For You 🧠 & 4. Learn Something New 📚 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Assessments For You 🧠
            </h2>
            <Link
              to="/assess"
              className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recommendedAssessments.map((a: any) => (
              <Link
                key={a._id}
                to="/assess"
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#334155] truncate">{a.title}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {a.recommendationReason || `${a.category} • ${a.durationMinutes || 10} mins`}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] shrink-0">
                  Start
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              Learn Something New 📚
            </h2>
            <Link
              to="/learn"
              className="text-xs font-bold text-[#2589D6] hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recommendedLearning.map((res: any) => (
              <Link
                key={res._id}
                to={`/learn?resource=${res._id}`}
                className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#60B6F8] transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#334155] truncate">{res.title}</p>
                  <p className="text-[11px] text-[#64748B] truncate">
                    {res.recommendationReason || `${res.category} • ${res.duration}`}
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] shrink-0">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* 5. Your Career Progress 📈 */}
      <section className="bg-white rounded-3xl p-6 border border-[#D8ECFA] shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#334155] font-display">
            Your Career Progress 📈
          </h2>
          <span className="text-xs font-bold text-[#2589D6]">
            {journeyStages.filter((s: any) => s.completed).length} / {journeyStages.length || 7}{' '}
            Milestones
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {journeyStages.map((stage: any) => (
            <div
              key={stage.id}
              className={`p-3 rounded-2xl border text-center space-y-1 ${
                stage.completed
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#64748B]'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 mx-auto ${
                  stage.completed ? 'text-emerald-600' : 'text-[#BDE0FE]'
                }`}
              />
              <p className="text-[11px] font-bold">{stage.label}</p>
            </div>
          ))}
        </div>

        {recentActivities.length > 0 && (
          <div className="pt-3 border-t border-[#EAF7FF] space-y-2">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Recent Activity
            </p>
            <div className="space-y-2">
              {recentActivities.slice(0, 4).map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#334155] truncate">{act.title}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{act.subtitle}</p>
                  </div>
                  {act.badgeText && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F] shrink-0">
                      {act.badgeText}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
