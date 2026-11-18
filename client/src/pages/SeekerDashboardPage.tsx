import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bookmark,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { JourneyBridge } from '../components/JourneyBridge';

export const SeekerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [progressData, setProgressData] = useState<any>(null);
  const [matchedOpportunities, setMatchedOpportunities] = useState<any[]>([]);
  const [learningRecommendations, setLearningRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [progressRes, oppsRes, learnRes] = await Promise.all([
          fetch('/api/analytics/seeker/progress', { credentials: 'include' }),
          fetch('/api/public/opportunities?limit=4', { credentials: 'include' }),
          fetch('/api/seeker/learning', { credentials: 'include' })
        ]);

        if (progressRes.ok) {
          const pData = await progressRes.json();
          setProgressData(pData);
        }

        if (oppsRes.ok) {
          const oData = await oppsRes.json();
          setMatchedOpportunities(oData.results || []);
        }

        if (learnRes.ok) {
          const lData = await learnRes.json();
          setLearningRecommendations((lData || []).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-stone-600">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">{t('loading')}</p>
      </div>
    );
  }

  // Derive Next Suggested Action
  let nextAction = {
    title: 'Complete your first Skill Assessment',
    desc: 'Verify your practical capabilities in Graphic Design, Web Development, or Digital Office Operations.',
    cta: 'Take an Assessment',
    path: '/assess'
  };

  const completedStages = progressData?.journeyStages
    ?.filter((s: any) => s.completed)
    ?.map((s: any) => s.id) || ['discover'];

  const scheduledInterviewApp = progressData?.applications?.recent?.find(
    (app: any) => app.status === 'Interview Scheduled' && app.interviewDetails?.date
  );

  if (scheduledInterviewApp) {
    nextAction = {
      title: `Upcoming Interview: ${scheduledInterviewApp.opportunityId?.title || 'Creative Role'}`,
      desc: `Scheduled for ${scheduledInterviewApp.interviewDetails.date} at ${scheduledInterviewApp.interviewDetails.time}. Review the employer instructions.`,
      cta: 'View Interview Details',
      path: '/applications'
    };
  } else if (!completedStages.includes('assess')) {
    nextAction = {
      title: 'Step 2: Take a Skill Assessment',
      desc: 'Discover your strengths and identify any skill gaps in 10-15 minutes.',
      cta: 'Assess My Skills',
      path: '/assess'
    };
  } else if (!completedStages.includes('practice')) {
    nextAction = {
      title: 'Step 3 & 4: Complete a Practical Assignment',
      desc: 'Build real-world work (like a Canva flyer or spreadsheet) and add it directly to your portfolio.',
      cta: 'Start Practice Assignment',
      path: '/learn?tab=assignments'
    };
  } else if (!completedStages.includes('portfolio')) {
    nextAction = {
      title: 'Step 5: Publish your Portfolio Project',
      desc: 'Showcase your work samples to employers to unlock matched job applications.',
      cta: 'Manage Portfolio',
      path: '/portfolio'
    };
  } else {
    nextAction = {
      title: 'Step 6 & 7: Explore Matched Opportunities',
      desc: 'Apply directly to verified employers with transparent skill matching and interview tracking.',
      cta: 'Browse Matched Roles',
      path: '/opportunities'
    };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
              {language === 'hi' ? `नमस्ते, ${user?.name}` : `Welcome, ${user?.name}`}
            </h1>
            {user?.seekerProfile?.isCareerRestart && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                Build Her Returnee
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {user?.seekerProfile?.headline || 'SETU Skilled Candidate'} •{' '}
            {user?.seekerProfile?.location?.city || 'India'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/profile"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 transition"
          >
            {language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile & Skills'}
          </Link>
          <Link
            to="/progress"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#E65100] hover:bg-orange-700 text-white transition flex items-center space-x-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('navProgress')}</span>
          </Link>
        </div>
      </div>

      {/* 7-Stage Visual Journey Bridge */}
      <JourneyBridge
        currentStage={scheduledInterviewApp ? 'earn' : completedStages[completedStages.length - 1] || 'discover'}
        completedStages={completedStages}
      />

      {/* Next Suggested Action Alert Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Next Suggested Action</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold">{nextAction.title}</h3>
          <p className="text-xs sm:text-sm text-orange-100 max-w-2xl">{nextAction.desc}</p>
        </div>
        <Link
          to={nextAction.path}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white text-orange-800 font-bold text-xs sm:text-sm hover:bg-orange-50 transition shadow-sm shrink-0 flex items-center space-x-1.5"
        >
          <span>{nextAction.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Scheduled Interview Highlight (if any) */}
      {scheduledInterviewApp && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Active Scheduled Interview</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Stage 7: Earn
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <span className="text-xs text-emerald-700 font-medium">Position & Employer</span>
              <h4 className="font-bold text-slate-900 text-base">
                {scheduledInterviewApp.opportunityId?.title || 'Selected Role'}
              </h4>
              <p className="text-xs text-stone-600">
                {scheduledInterviewApp.opportunityId?.organisationName}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-emerald-700 font-medium">Date & Time</span>
              <p className="font-bold text-slate-900 text-sm">
                {scheduledInterviewApp.interviewDetails.date} at {scheduledInterviewApp.interviewDetails.time}
              </p>
              {scheduledInterviewApp.interviewDetails.meetLinkOrLocation && (
                <a
                  href={scheduledInterviewApp.interviewDetails.meetLinkOrLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-800 hover:underline flex items-center space-x-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Video Meeting</span>
                </a>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs text-emerald-700 font-medium">Instructions</span>
              <p className="text-xs text-slate-700 line-clamp-3">
                {scheduledInterviewApp.interviewDetails.instructions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Matched Opportunities & Skill Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Matched Opportunities (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                {language === 'hi' ? 'आपके हुनर से मेल खाते अवसर' : 'Matched Opportunities For You'}
              </h3>
              <p className="text-xs text-stone-600">
                Transparent ranking based on your verified skills, work mode, and goals
              </p>
            </div>
            <Link
              to="/opportunities"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {matchedOpportunities.map((res: any, idx: number) => {
              const opp = res.opportunity;
              return (
                <div
                  key={opp._id || idx}
                  className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-sm hover:border-orange-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{opp.title}</h4>
                      <p className="text-xs text-stone-600 font-medium">
                        {opp.organisationName} • {opp.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {res.matchScore}% Match
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {opp.workMode.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Explainability Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {res.matchReasons?.map((reason: string, rIdx: number) => (
                      <span
                        key={rIdx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{reason}</span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="font-semibold text-slate-700">{opp.salaryOrStipend}</span>
                    <Link
                      to="/opportunities"
                      className="font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                    >
                      <span>View & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Skill Gaps & Recommended Learning */}
        <div className="space-y-6">
          {/* Recent Assessment Gaps */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm font-serif">
                Skill Strengths & Gaps
              </h4>
              <Link to="/assess" className="text-xs font-semibold text-orange-600 hover:underline">
                Assess More
              </Link>
            </div>

            {progressData?.assessments?.totalAttempts > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block mb-1">Demonstrated Strengths:</span>
                  <div className="flex flex-wrap gap-1">
                    {user?.seekerProfile?.skills?.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold block mb-1">Recommended Skill Focus:</span>
                  <p className="text-[11px] text-amber-800 mb-2">
                    Complete practical assignments in these topics to elevate your match scores:
                  </p>
                  <Link
                    to="/learn?tab=assignments"
                    className="inline-flex items-center text-xs font-bold text-amber-900 hover:underline"
                  >
                    <span>View Hands-on Assignments</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl text-center space-y-2">
                <Award className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-xs text-stone-600">No assessments taken yet.</p>
                <Link
                  to="/assess"
                  className="inline-block px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold"
                >
                  Take 1st Assessment
                </Link>
              </div>
            )}
          </div>

          {/* Quick Learning Recommendations */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm font-serif">
                Recommended Practice
              </h4>
              <Link to="/learn" className="text-xs font-semibold text-orange-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {learningRecommendations.map((r, idx) => (
                <Link
                  key={r._id || idx}
                  to="/learn"
                  className="block p-3 rounded-xl border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition space-y-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                    {r.type.replace('_', ' ')}
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{r.title}</h5>
                  <p className="text-[11px] text-stone-600 line-clamp-1">{r.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
