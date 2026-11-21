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
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { UserAvatar } from '../components/UserAvatar';

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [progressData, setProgressData] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [learningItems, setLearningItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProgressData(null);

    const fetchDashboard = async () => {
      try {
        const [progressRes, oppsRes, learnRes] = await Promise.all([
          apiFetch('/api/dashboard'),
          apiFetch('/api/opportunities?limit=3'),
          apiFetch('/api/learning')
        ]);

        if (!active) return;

        if (progressRes.ok && progressRes.data) {
          setProgressData(progressRes.data.data || progressRes.data);
        }

        if (oppsRes.ok && oppsRes.data) {
          const oData = oppsRes.data.data || oppsRes.data;
          setOpportunities((oData.results || []).slice(0, 3));
        }

        if (learnRes.ok && learnRes.data) {
          const lData = learnRes.data.data || learnRes.data;
          const inProgressOrTop = (lData || []).slice(0, 2);
          setLearningItems(inProgressOrTop);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (user?.id) {
      fetchDashboard();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user?.id]);

  // Compute profile completion percentage dynamically
  const calculateProfilePct = () => {
    if (progressData?.profileCompletionPercentage !== undefined) {
      return progressData.profileCompletionPercentage;
    }
    if (user?.profileCompletion !== undefined) {
      return user.profileCompletion;
    }
    const profile = user?.seekerProfile;
    let score = 0;
    if (user?.name) score += 10;
    if (user?.profilePicture || user?.avatar) score += 5;
    if (profile?.headline && profile.headline.trim()) score += 15;
    if (profile?.location?.city && profile.location.city.trim()) score += 15;
    if (profile?.educationLevel && profile.educationLevel !== 'No formal degree') score += 15;
    if (profile?.skills && profile.skills.length > 0) score += 15;
    if (profile?.experienceLevel) score += 10;
    if (profile?.languages && profile.languages.length > 0) score += 5;
    if ((profile?.phone && profile.phone.trim()) || (profile?.resumeUrl && profile.resumeUrl.trim())) {
      score += 10;
    }
    return Math.min(100, Math.max(10, score));
  };

  const profilePct = calculateProfilePct();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Database Overview Counts (strictly scoped to the currently authenticated user)
  const skillsVerified = progressData?.skillsVerifiedCount ?? (progressData?.assessments?.skillsVerifiedCount ?? 0);
  const learningCompleted = progressData?.learning?.completedCount ?? 0;
  const learningStarted = progressData?.learning?.startedCount ?? 0;
  const portfolioProjects = progressData?.portfolio?.totalCount ?? 0;
  const activeApplications = progressData?.applications?.total ?? 0;
  const savedSkills: string[] =
    progressData?.savedSkills ?? user?.seekerProfile?.skills ?? [];
  const verifiedSkills: string[] = progressData?.verifiedSkills ?? [];

  // Recent Activity Feed
  const recentActivities = progressData?.recentActivity || [];

  const roleLabel =
    user?.role === 'employer'
      ? 'Employer'
      : user?.role === 'admin'
      ? 'Administrator'
      : 'Job Seeker';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8">
      {/* SECTION A: Welcome Section with Real Authenticated User Identity */}
      <section className="bg-[#151515] rounded-2xl p-6 sm:p-7 border border-[#292929] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <UserAvatar
            name={user?.name}
            src={user?.profilePicture || user?.avatar}
            size="xl"
          />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight truncate">
              Welcome back, {user?.name || 'Member'}!
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#A3A3A3]">
              <span className="inline-flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                <span className="truncate">{user?.email}</span>
              </span>
              {user?.emailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1C1C1C] border border-[#292929] text-[#FF7847] text-[10px] font-semibold">
                {roleLabel}
              </span>
              {user?.authProvider === 'google' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-800/50 text-blue-300 text-[10px] font-semibold">
                  Google Account
                </span>
              )}
            </div>
            <p className="text-xs text-[#737373] mt-1.5">
              Your journey towards better opportunities starts here.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A1F] hover:bg-[#FF7847] text-white shadow-[0_2px_12px_rgba(255,90,31,0.35)] text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION B: Complete Your Profile & Saved Skills */}
      <section className="bg-[#151515] rounded-2xl p-6 sm:p-7 border border-[#292929] shadow-xl space-y-5">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F5F5F5]">Complete Your Profile</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-800/50 text-[#FF7847]">
                  {profilePct}% Done
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-1">
                {profilePct < 100
                  ? `Your profile is ${profilePct}% complete. Add your headline, location, education, and skills to unlock personalized job matches.`
                  : 'Your SETU profile is 100% complete and ready for employer discovery!'}
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] text-[#F5F5F5] border border-[#292929] text-xs font-medium rounded-xl transition shadow-xs shrink-0"
            >
              <span>{profilePct < 100 ? 'Complete Profile' : 'Edit Profile'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full bg-[#1C1C1C] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${profilePct}%` }}
            />
          </div>
        </div>

        {/* Saved Skills Row */}
        <div className="pt-4 border-t border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#D4D4D4]">Saved Skills</span>
              <span className="text-[11px] text-[#737373]">({savedSkills.length})</span>
            </div>
            {savedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {savedSkills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#1C1C1C] border border-[#292929] text-[#E5E5E5]"
                  >
                    {verifiedSkills.some((v) => v.toLowerCase() === skill.toLowerCase()) && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#737373]">
                No skills saved yet. Add your practical skills so SETU can match you with verified opportunities.
              </p>
            )}
          </div>
          <Link
            to="/profile?tab=skills"
            className="text-xs font-semibold text-[#FF5A1F] hover:text-[#FF7847] inline-flex items-center gap-1 shrink-0"
          >
            <span>{savedSkills.length > 0 ? 'Manage Skills' : 'Add Skills'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION C: Quick Overview (4 small cards) */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Skills Verified */}
          <Link
            to="/assess"
            className="bg-[#151515] p-5 rounded-2xl border border-[#292929] hover:border-[#383838] shadow-md card-hover-effect block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#737373]">Skills Verified</span>
              <div className="w-8 h-8 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#FF5A1F]">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#F5F5F5]">{skillsVerified}</span>
              <span className="text-[11px] text-[#555555]">assessments passed</span>
            </div>
          </Link>

          {/* Card 2: Learning Progress */}
          <Link
            to="/learn"
            className="bg-[#151515] p-5 rounded-2xl border border-[#292929] hover:border-[#383838] shadow-md card-hover-effect block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#737373]">Learning Progress</span>
              <div className="w-8 h-8 rounded-xl bg-blue-950/50 flex items-center justify-center text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#F5F5F5]">{learningCompleted}</span>
              <span className="text-[11px] text-[#555555]">
                completed{learningStarted > 0 ? ` • ${learningStarted} active` : ''}
              </span>
            </div>
          </Link>

          {/* Card 3: Portfolio Projects */}
          <Link
            to="/portfolio"
            className="bg-[#151515] p-5 rounded-2xl border border-[#292929] hover:border-[#383838] shadow-md card-hover-effect block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#737373]">Portfolio Projects</span>
              <div className="w-8 h-8 rounded-xl bg-purple-950/50 flex items-center justify-center text-purple-400">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#F5F5F5]">{portfolioProjects}</span>
              <span className="text-[11px] text-[#555555]">published projects</span>
            </div>
          </Link>

          {/* Card 4: Job Applications */}
          <Link
            to="/applications"
            className="bg-[#151515] p-5 rounded-2xl border border-[#292929] hover:border-[#383838] shadow-md card-hover-effect block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#737373]">Job Applications</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950/50 flex items-center justify-center text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#F5F5F5]">{activeApplications}</span>
              <span className="text-[11px] text-[#555555]">live submissions</span>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION D: Recommended Opportunities (2-3 cards max) */}
      <section className="bg-[#151515] rounded-2xl p-6 sm:p-7 border border-[#292929] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Recommended Opportunities</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Verified roles matching your profile and verified strengths
            </p>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-semibold text-[#FF5A1F] hover:text-[#FF7847] flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <p className="text-xs text-[#737373] py-4 text-center">
            No recommended opportunities available right now. Explore the Opportunities directory!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp._id}
                className="flex flex-col justify-between p-4 rounded-xl border border-[#292929] bg-[#101010] hover:bg-[#181818] hover:border-[#383838] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#222222] text-[#D4D4D4] capitalize">
                      {opp.workMode || 'Hybrid'}
                    </span>
                    <span className="text-[11px] font-bold text-[#D4D4D4]">
                      {opp.stipendOrSalary || 'Competitive'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#F5F5F5] line-clamp-1 mb-1">
                    {opp.title}
                  </h4>
                  <p className="text-xs text-[#A3A3A3] font-medium line-clamp-1 mb-2">
                    {opp.organisationName}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-[#737373] mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{opp.location?.city || 'India'}</span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(opp.requiredSkills || []).slice(0, 3).map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white border border-[#292929] text-[#A3A3A3] px-2 py-0.5 rounded"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to="/opportunities"
                  className="w-full text-center py-2 px-3 bg-white hover:bg-[#1C1C1C] hover:border-orange-200 hover:text-[#FF5A1F] border border-[#292929] text-[#E5E5E5] text-xs font-semibold rounded-lg transition"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: Continue Learning (2 cards max) */}
      <section className="bg-[#151515] rounded-2xl p-6 sm:p-7 border border-[#292929] shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#F5F5F5]">Continue Learning</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Practical modules and assignments to sharpen your employment portfolio
            </p>
          </div>
          <Link
            to="/learn"
            className="text-xs font-semibold text-[#FF5A1F] hover:text-[#FF7847] flex items-center gap-1"
          >
            <span>Browse Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {learningItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#292929] rounded-xl">
            <BookOpen className="w-8 h-8 text-[#444444] mx-auto mb-2" />
            <p className="text-xs text-[#737373]">No learning in progress.</p>
            <Link
              to="/learn"
              className="mt-2 inline-block text-xs font-semibold text-[#FF5A1F] hover:underline"
            >
              Start learning practical skills →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningItems.map((item, idx) => (
              <div
                key={item.id || item._id || idx}
                className="flex items-center justify-between p-4 rounded-xl border border-[#292929] bg-[#101010] hover:bg-[#181818] transition"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {item.type === 'practical_assignment' ? 'Practical Project' : 'Learning Module'}
                    </span>
                    <span className="text-[10px] text-[#737373]">{item.duration || '20 mins'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#F5F5F5] line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-[#737373] line-clamp-1">Skill: {item.skillTag || 'Operations'}</p>
                </div>
                <Link
                  to="/learn"
                  className="shrink-0 px-3 py-1.5 bg-[#FF5A1F] hover:bg-[#FF7847] text-white shadow-[0_2px_12px_rgba(255,90,31,0.35)] text-xs font-medium rounded-lg transition"
                >
                  Continue
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION F: Recent Activity */}
      <section className="bg-[#151515] rounded-2xl p-6 sm:p-7 border border-[#292929] shadow-xl">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#F5F5F5]">Recent Activity</h3>
          <p className="text-xs text-[#737373] mt-0.5">
            Real-time milestones from your applications, assessments, and learning journey
          </p>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#292929] rounded-xl">
            <Sparkles className="w-8 h-8 text-[#444444] mx-auto mb-2" />
            <p className="text-xs text-[#737373]">
              No recent activity yet. Start by assessing your skills!
            </p>
            <Link
              to="/assess"
              className="mt-2 inline-block text-xs font-semibold text-[#FF5A1F] hover:underline"
            >
              Take Skill Assessment →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#222222]">
            {recentActivities.map((act: any) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[#A3A3A3] shrink-0">
                    {act.type === 'assessment' ? (
                      <Award className="w-4 h-4 text-[#FF5A1F]" />
                    ) : act.type === 'application' ? (
                      <FileText className="w-4 h-4 text-emerald-600" />
                    ) : act.type === 'portfolio' ? (
                      <FolderGit2 className="w-4 h-4 text-purple-600" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F5F5F5]">{act.title}</p>
                    <p className="text-[11px] text-[#737373]">{act.subtitle}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {act.badgeText && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        act.badgeColor === 'emerald'
                          ? 'bg-emerald-100 text-emerald-700'
                          : act.badgeColor === 'purple'
                          ? 'bg-purple-100 text-purple-700'
                          : act.badgeColor === 'amber'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#1C1C1C] text-[#D4D4D4]'
                      }`}
                    >
                      {act.badgeText}
                    </span>
                  )}
                  <p className="text-[10px] text-[#555555] mt-0.5">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
