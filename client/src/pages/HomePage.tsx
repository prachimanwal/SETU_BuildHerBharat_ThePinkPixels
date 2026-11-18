import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  Landmark,
  Briefcase,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
  Layers,
  TrendingUp,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { JourneyBridge } from '../components/JourneyBridge';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/opportunities?limit=3')
      .then((res) => res.json())
      .then((data) => setOpportunities(data.results || []))
      .catch(() => {});

    fetch('/api/public/schemes')
      .then((res) => res.json())
      .then((data) => setSchemes((data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleDemoLogin = async (email: string, pass: string) => {
    const res = await login(email, pass);
    if (res.success) {
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('employer') || email.includes('pending')) navigate('/employer');
      else navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1E1B4B] via-[#1E1B4B] to-indigo-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(#e65100_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-orange-500/20 border border-orange-400/40 px-3.5 py-1 rounded-full text-xs sm:text-sm text-orange-200 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-orange-300" />
            <span className="font-semibold">Builder Bharat 2026 – Build Her Bharat</span>
            <span className="text-orange-400">•</span>
            <span>K.R. Mangalam University, Gurugram</span>
          </div>

          {/* Main Title & Tagline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black font-serif tracking-tight text-white leading-tight">
              {language === 'hi' ? 'हुनर से हक़ की कमाई तक।' : 'Bridging Skills, Opportunities & Employment'}
            </h1>
            <p className="text-xl sm:text-2xl font-medium text-amber-300 font-serif max-w-3xl mx-auto">
              {language === 'hi'
                ? 'कौशल खोजिए, व्यावहारिक काम से सीखिए, पोर्टफोलियो बनाइए और कमाई की ओर बढ़िए।'
                : 'Discover your skills, learn through practical work, build a portfolio, and move toward earning.'}
            </p>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            {language === 'hi'
              ? 'विद्यार्थियों, स्नातकों, काम पर लौटने वाली महिलाओं, ग्रामीण नौकरी चाहने वालों, फ्रीलांसरों और व्यावहारिक हुनर वाले साथियों के लिए एक पारदर्शी मंच।'
              : 'Designed for students, graduates, women returning to work, rural job seekers, freelancers, and people with practical skills or limited formal qualifications.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/opportunities"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-950/40 transition flex items-center justify-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>{language === 'hi' ? 'अवसर खोजें' : 'Explore Opportunities'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/build-her"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-pink-600/90 hover:bg-pink-600 text-white font-semibold text-sm sm:text-base border border-pink-400/40 shadow-sm transition flex items-center justify-center space-x-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{language === 'hi' ? 'बिल्ड हर (महिला हब)' : 'Build Her Initiative'}</span>
            </Link>

            {!user && (
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition"
              >
                {t('navRegister')}
              </Link>
            )}
          </div>

          {/* Quick Demo Credentials Panel for Hackathon Judges */}
          <div className="pt-6">
            <div className="max-w-3xl mx-auto bg-indigo-900/60 border border-indigo-700/60 rounded-xl p-4 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluation & Judge Quick Access</span>
                </span>
                <span className="text-[11px] text-indigo-300">Click any role to test flow immediately:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={() => handleDemoLogin('seeker@setu.demo', 'SetuDemo@2026')}
                  className="p-2 bg-white/10 hover:bg-orange-500/30 border border-white/15 rounded-lg text-left transition flex flex-col"
                >
                  <span className="font-bold text-white">1. Job Seeker</span>
                  <span className="text-[10px] text-indigo-200">Priya Sharma (Returnee)</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('pending@startup.demo', 'SetuDemo@2026')}
                  className="p-2 bg-white/10 hover:bg-amber-500/30 border border-white/15 rounded-lg text-left transition flex flex-col"
                >
                  <span className="font-bold text-white">2. Pending Employer</span>
                  <span className="text-[10px] text-amber-300">Publishing Blocked</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('employer@techcorp.demo', 'SetuDemo@2026')}
                  className="p-2 bg-white/10 hover:bg-emerald-500/30 border border-white/15 rounded-lg text-left transition flex flex-col"
                >
                  <span className="font-bold text-white">3. Approved Employer</span>
                  <span className="text-[10px] text-emerald-300">Review Applicants</span>
                </button>
                <button
                  onClick={() => handleDemoLogin('admin@setu.gov.in', 'SetuAdmin@2026')}
                  className="p-2 bg-white/10 hover:bg-purple-500/30 border border-white/15 rounded-lg text-left transition flex flex-col"
                >
                  <span className="font-bold text-white">4. Administrator</span>
                  <span className="text-[10px] text-indigo-200">Verification & Moderation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Interactive 7-Stage Journey Bridge */}
        <JourneyBridge currentStage="discover" completedStages={['discover']} />

        {/* 3 Core Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 hover:border-orange-300 transition">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'hi' ? '1. हुनर खोज और मूल्यांकन' : '1. Discover & Assess Skills'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Take short, interactive skill assessments scored on the server. Identify your real strengths, pinpoint skill gaps, and automatically link gaps to bite-sized tutorials.
            </p>
            <Link
              to="/assess"
              className="inline-flex items-center text-xs font-semibold text-orange-600 hover:text-orange-700 pt-1"
            >
              <span>{language === 'hi' ? 'कौशल परीक्षा दें' : 'Take Skill Assessments'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 hover:border-indigo-300 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'hi' ? '2. व्यावहारिक काम और पोर्टफोलियो' : '2. Practical Work & Portfolio'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              No formal degree? No problem. Complete real practical assignments (Canva flyers, spreadsheets, responsive cards) and add them directly to your verified portfolio.
            </p>
            <Link
              to="/learn"
              className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
            >
              <span>{language === 'hi' ? 'प्रैक्टिकल कार्य देखें' : 'View Practice Assignments'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 hover:border-pink-300 transition">
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'hi' ? '3. बिल्ड हर (Build Her)' : '3. Build Her Returnee Hub'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              A dedicated sanctuary for women resuming careers or starting micro-enterprises. Includes flexible career restart roles, POSH Act safety rights, and a confidential support desk.
            </p>
            <Link
              to="/build-her"
              className="inline-flex items-center text-xs font-semibold text-pink-600 hover:text-pink-700 pt-1"
            >
              <span>{language === 'hi' ? 'बिल्ड हर हब खोलें' : 'Open Build Her Hub'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </section>

        {/* Featured Opportunities Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-950 font-serif">
                {language === 'hi' ? 'सत्यापित अवसर' : 'Credible Verified Opportunities'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                {language === 'hi'
                  ? 'केवल प्रशासनिक रूप से सत्यापित नियोक्ताओं के प्रकाशित पद'
                  : 'Published only by administratively verified employers'}
              </p>
            </div>
            <Link
              to="/opportunities"
              className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'सभी अवसर देखें' : 'View All'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {opportunities.map((item, idx) => {
              const opp = item.opportunity;
              return (
                <div
                  key={opp._id || idx}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                      {opp.isCareerRestart && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                          Career Restart
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {opp.title}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium">{opp.organisationName}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs text-stone-600 pt-1">
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                        {opp.workMode.toUpperCase()}
                      </span>
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                        {opp.salaryOrStipend}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">{opp.description}</p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-stone-600">{opp.location}</span>
                    <Link
                      to="/opportunities"
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      {language === 'hi' ? 'विवरण देखें' : 'View & Apply'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Government Schemes */}
        <section className="bg-stone-100/70 rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                  {language === 'hi' ? 'आधिकारिक सरकारी योजनाएं' : 'Verified Government Schemes'}
                </h3>
                <p className="text-xs text-stone-600">
                  PMKVY 4.0, NAPS, PM Vishwakarma, Stand-Up India with verified .gov.in links
                </p>
              </div>
            </div>
            <Link
              to="/schemes"
              className="text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center space-x-1"
            >
              <span>{language === 'hi' ? 'सभी योजनाएं' : 'All Schemes'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schemes.map((s, idx) => (
              <div
                key={s._id || idx}
                className="bg-white rounded-xl border border-stone-200 p-4 space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {s.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-stone-600">Reviewed {s.lastReviewedDate}</span>
                </div>
                <h5 className="font-bold text-slate-900 text-sm">{s.title}</h5>
                <p className="text-xs text-stone-600 line-clamp-2">{s.benefitsSummary}</p>
                <a
                  href={s.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1"
                >
                  <span>Official Portal (.gov.in)</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
