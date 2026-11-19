import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  FolderGit2,
  FileText,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [learningItems, setLearningItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [progressRes, oppsRes, learnRes] = await Promise.all([
          apiFetch('/api/dashboard'),
          apiFetch('/api/opportunities?limit=3'),
          apiFetch('/api/learning')
        ]);

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
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Compute profile completion percentage dynamically
  const calculateProfilePct = () => {
    if (progressData?.profileCompletionPercentage !== undefined) {
      return progressData.profileCompletionPercentage;
    }
    const profile = user?.seekerProfile;
    let score = 0;
    if (user?.name) score += 10;
    if (profile?.headline && profile.headline.trim()) score += 15;
    if (profile?.location?.city && profile.location.city.trim()) score += 15;
    if (profile?.educationLevel && profile.educationLevel !== 'No formal degree') score += 15;
    if (profile?.skills && profile.skills.length > 0) score += 15;
    if (profile?.experienceLevel) score += 10;
    if (profile?.phone && profile.phone.trim()) score += 10;
    if (profile?.resumeUrl && profile.resumeUrl.trim()) score += 10;
    return Math.min(100, Math.max(20, score));
  };

  const profilePct = calculateProfilePct();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Database Overview Counts
  const skillsVerified = progressData?.skillsVerifiedCount ?? (progressData?.assessments?.skillsVerifiedCount ?? 0);
  const learningCompleted = progressData?.learning?.completedCount ?? 0;
  const portfolioProjects = progressData?.portfolio?.totalCount ?? 0;
  const activeApplications = progressData?.applications?.total ?? 0;

  // Recent Activity Feed
  const recentActivities = progressData?.recentActivity || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8">
      {/* SECTION A: Welcome Section */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Welcome back, {user?.name || 'Seeker'}!
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Your journey towards better opportunities starts here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* SECTION B: Complete Your Profile */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">Complete Your Profile</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {profilePct}% Done
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Your profile is {profilePct}% complete. Complete your profile to receive better opportunity matches.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition shadow-xs shrink-0"
          >
            <span>Complete Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${profilePct}%` }}
          />
        </div>
      </section>

      {/* SECTION C: Quick Overview (4 small cards) */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Skills Verified */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Skills Verified</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{skillsVerified}</span>
              <span className="text-[11px] text-stone-400">assessments passed</span>
            </div>
          </div>

          {/* Card 2: Learning Completed */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Learning Completed</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{learningCompleted}</span>
              <span className="text-[11px] text-stone-400">modules completed</span>
            </div>
          </div>

          {/* Card 3: Portfolio Projects */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Portfolio Projects</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{portfolioProjects}</span>
              <span className="text-[11px] text-stone-400">published projects</span>
            </div>
          </div>

          {/* Card 4: Active Applications */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Active Applications</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">{activeApplications}</span>
              <span className="text-[11px] text-stone-400">live submissions</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: Recommended Opportunities (2-3 cards max) */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-stone-900">Recommended Opportunities</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified roles matching your profile and verified strengths
            </p>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">
            No recommended opportunities available right now. Explore the Opportunities directory!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp._id}
                className="flex flex-col justify-between p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 capitalize">
                      {opp.workMode || 'Hybrid'}
                    </span>
                    <span className="text-[11px] font-bold text-stone-700">
                      {opp.stipendOrSalary || 'Competitive'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1 mb-1">
                    {opp.title}
                  </h4>
                  <p className="text-xs text-stone-600 font-medium line-clamp-1 mb-2">
                    {opp.organisationName}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{opp.location?.city || 'India'}</span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(opp.requiredSkills || []).slice(0, 3).map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white border border-stone-200 text-stone-600 px-2 py-0.5 rounded"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to="/opportunities"
                  className="w-full text-center py-2 px-3 bg-white hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 border border-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: Continue Learning (2 cards max) */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-stone-900">Continue Learning</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Practical modules and assignments to sharpen your employment portfolio
            </p>
          </div>
          <Link
            to="/learn"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Browse Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {learningItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-stone-500">No learning in progress.</p>
            <Link
              to="/learn"
              className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline"
            >
              Start learning practical skills →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningItems.map((item, idx) => (
              <div
                key={item.id || item._id || idx}
                className="flex items-center justify-between p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {item.type === 'practical_assignment' ? 'Practical Project' : 'Learning Module'}
                    </span>
                    <span className="text-[10px] text-stone-500">{item.duration || '20 mins'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-stone-500 line-clamp-1">Skill: {item.skillTag || 'Operations'}</p>
                </div>
                <Link
                  to="/learn"
                  className="shrink-0 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition"
                >
                  Continue
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION F: Recent Activity */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200/90 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-stone-900">Recent Activity</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time milestones from your applications, assessments, and learning journey
          </p>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-stone-200 rounded-xl">
            <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-stone-500">
              No recent activity yet. Start by assessing your skills!
            </p>
            <Link
              to="/assess"
              className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline"
            >
              Take Skill Assessment →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentActivities.map((act: any) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                    {act.type === 'assessment' ? (
                      <Award className="w-4 h-4 text-orange-600" />
                    ) : act.type === 'application' ? (
                      <FileText className="w-4 h-4 text-emerald-600" />
                    ) : act.type === 'portfolio' ? (
                      <FolderGit2 className="w-4 h-4 text-purple-600" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{act.title}</p>
                    <p className="text-[11px] text-stone-500">{act.subtitle}</p>
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
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {act.badgeText}
                    </span>
                  )}
                  <p className="text-[10px] text-stone-400 mt-0.5">
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
