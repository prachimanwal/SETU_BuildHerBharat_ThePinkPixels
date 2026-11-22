import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  Landmark,
  Briefcase,
  CheckCircle2,
  Award,
  BookOpen,
  Layers,
  MapPin,
  Clock,
  ExternalLink,
  Compass
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { JourneyBridge } from '../components/JourneyBridge';
import { apiFetch, extractArray, formatLocation, toStringArray } from '../utils/api';

export const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  useEffect(() => {
    let active = true;

    apiFetch('/api/public/opportunities?limit=3')
      .then((res) => {
        if (!active) return;
        const list = res.ok ? extractArray(res.data, ['results']) : [];
        setOpportunities(list.slice(0, 3));
      })
      .finally(() => {
        if (active) setLoadingOpps(false);
      });

    apiFetch('/api/public/schemes')
      .then((res) => {
        if (!active) return;
        const list = res.ok ? extractArray(res.data, ['schemes', 'results']) : [];
        setSchemes(list.slice(0, 3));
      })
      .finally(() => {
        if (active) setLoadingSchemes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 bg-[#F8FCFF] text-[#334155] min-h-screen">
      {/* 1. HERO SECTION — Soft Baby Blue Theme with Floating Pastel Shapes */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#EAF7FF] via-[#F8FCFF] to-[#F8FCFF] border-b border-[#D8ECFA]">
        {/* Decorative Floating Baby-Blue Shapes */}
        <div className="absolute -top-12 -left-16 w-72 h-72 rounded-full bg-[#BDE0FE]/55 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute top-1/4 -right-12 w-80 h-80 rounded-full bg-[#A2D2FF]/40 blur-3xl pointer-events-none animate-float-gentle" />
        <div className="absolute bottom-6 left-1/3 w-56 h-56 rounded-full bg-[#D6EEFF]/60 blur-2xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-7">
          {/* Cheerful Tagline Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-[#D8ECFA] shadow-baby-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A2D2FF] ring-4 ring-[#EAF7FF]" />
            <span className="text-xs font-semibold text-[#334155] tracking-wide">
              {language === 'hi'
                ? 'हुनर से हक़ की कमाई तक।'
                : 'Every great career begins with one small step! 🩵'}
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#334155] tracking-tight font-display leading-[1.15]">
            {language === 'hi' ? (
              <>
                कौशल, अवसर और रोजगार का{' '}
                <span className="text-[#3B9EE8]">विश्वसनीय सेतु</span>
              </>
            ) : (
              <>
                Discover Your Strengths.{' '}
                <span className="bg-gradient-to-r from-[#2589D6] to-[#3B9EE8] bg-clip-text text-transparent">
                  Unlock Career Opportunities.
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            {language === 'hi'
              ? 'अपनी शिक्षा, कौशल और रुचियों के आधार पर सही नौकरियां, सरकारी योजनाएं, कौशल परीक्षाएं और सीखने के मार्ग पाएं।'
              : 'Build your personalized career profile and let SETU guide you toward verified jobs, government schemes, skill assessments, and tailored learning pathways.'}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold text-sm shadow-baby transition flex items-center justify-center gap-2"
            >
              <span>Build Your Career Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/opportunities"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-[#EAF7FF] text-[#334155] font-semibold text-sm border border-[#D8ECFA] shadow-baby-sm transition flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-[#3B9EE8]" />
              <span>Explore Opportunities</span>
            </Link>
          </div>

          {/* Friendly Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-4xl mx-auto text-left">
            <div className="p-5 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby-sm flex items-start gap-3.5 card-hover-effect">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA] text-[#3B9EE8] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#334155]">Skill-First Matching</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Recommendations tailored to your real skills, education, and goals.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby-sm flex items-start gap-3.5 card-hover-effect">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA] text-[#3B9EE8] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#334155]">Guided Learning Paths</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Practical modules and assignments that turn learning into portfolio proof.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby-sm flex items-start gap-3.5 card-hover-effect">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA] text-[#3B9EE8] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#334155]">Verified Network</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Employer verification and curated government schemes in one safe space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 7-STAGE JOURNEY BRIDGE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <JourneyBridge currentStage="discover" />
      </section>

      {/* 3. FEATURED OPPORTUNITIES FROM DATABASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#3B9EE8] text-xs font-bold tracking-wider uppercase mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Verified Roles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#334155] font-display">
              Latest Verified Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Real openings from approved employers across remote, hybrid, and on-site roles
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#3B9EE8] hover:text-[#2589D6] transition"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingOpps ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 rounded-3xl border border-[#D8ECFA] skeleton-baby" />
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-dashed border-[#BDE0FE] text-center space-y-3 shadow-baby-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#EAF7FF] text-[#3B9EE8] flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#334155]">
              No matches just yet!
            </h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Create your account and complete your profile so SETU can match you as soon as verified opportunities are published.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
            >
              <span>Build My Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Array.isArray(opportunities) ? opportunities : []).map((opp, idx) => (
              <div
                key={opp._id || idx}
                className="p-6 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby-sm card-hover-effect flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] capitalize">
                      {opp.opportunityType || opp.employmentType || 'Opportunity'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {opp.stipendOrSalary || opp.salaryOrStipend || 'Competitive'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#334155] line-clamp-1">{opp.title}</h3>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    {opp.organisationName || opp.company || 'Verified Employer'}
                  </p>

                  <div className="flex items-center gap-3 mt-4 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {formatLocation(opp.location, 'Flexible')}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Clock className="w-3.5 h-3.5 text-[#3B9EE8]" />
                      {opp.workMode || 'Hybrid'}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {toStringArray(opp.requiredSkills).slice(0, 3).map((s: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F8FCFF] text-[#334155] border border-[#D8ECFA]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-[#EAF7FF]">
                  <Link
                    to="/opportunities"
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>View Details & Match</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. BUILD HER SANCTUARY & MENTORSHIP (Soft Pastel Sky & Blush) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#EAF7FF] via-white to-[#FFF1F5] border border-[#D8ECFA] p-8 sm:p-12 relative overflow-hidden shadow-baby">
          <div className="absolute right-0 top-0 w-72 h-72 bg-[#BDE0FE]/45 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-200 text-pink-600 text-xs font-semibold shadow-xs">
              <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
              <span>Build Her Sanctuary & Mentorship</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#334155] tracking-tight font-display">
              Dedicated Support for Women Returning to Work
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Welcoming spaces, verified employers, career-restart guidance, and flexible roles designed for women rebuilding financial independence after a career break.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <Link
                to="/build-her"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-baby-sm transition"
              >
                <span>Enter Build Her Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-white hover:bg-[#EAF7FF] text-[#334155] text-xs sm:text-sm font-semibold border border-[#D8ECFA] flex items-center justify-center gap-2 transition"
              >
                <span>Create Your Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GOVERNMENT SCHEMES DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#3B9EE8] text-xs font-bold tracking-wider uppercase mb-1">
              <Landmark className="w-4 h-4" />
              <span>Public Welfare & Grants</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#334155] font-display">
              Government Schemes & Subsidies
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Curated skill training, apprenticeship, and entrepreneurship support programs
            </p>
          </div>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#3B9EE8] hover:text-[#2589D6] transition"
          >
            <span>Explore All Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingSchemes ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 rounded-3xl border border-[#D8ECFA] skeleton-baby" />
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-dashed border-[#BDE0FE] text-center space-y-2 shadow-baby-sm">
            <p className="text-sm font-semibold text-[#334155]">
              Explore verified government schemes in our directory.
            </p>
            <Link
              to="/schemes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B9EE8] hover:underline"
            >
              <span>Open Schemes Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Array.isArray(schemes) ? schemes : []).map((s, idx) => (
              <div
                key={s._id || idx}
                className="p-6 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby-sm card-hover-effect flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#3B9EE8] block mb-2">
                    {s.ministry || s.ministryOrDepartment || 'Government of India'}
                  </span>
                  <h3 className="text-base font-bold text-[#334155] line-clamp-1">{s.title}</h3>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    Target:{' '}
                    {Array.isArray(s.targetAudience)
                      ? s.targetAudience.join(', ')
                      : s.targetAudience || s.targetBeneficiary || 'All Citizens'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-3 line-clamp-2 leading-relaxed">
                    {s.benefitsSummary || s.benefits || ''}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-[#EAF7FF]">
                  <Link
                    to="/schemes"
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>Check Eligibility</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. ABOUT SETU */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF7FF] border border-[#BDE0FE] text-xs font-semibold text-[#1E3A5F]">
                <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8]" />
                <span>Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#334155] font-display">
                Bridging Potential to Meaningful Livelihoods
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Your potential deserves the right opportunity. SETU connects learners, freshers, career returnees, and skilled workers directly with tailored assessments, practical portfolio projects, government welfare schemes, and verified employers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                <Layers className="w-5 h-5 text-[#3B9EE8]" />
                <p className="text-sm font-bold text-[#334155]">Profile-Driven</p>
                <p className="text-xs text-[#64748B]">
                  Every recommendation adapts to your skills & goals.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-bold text-[#334155]">Transparent</p>
                <p className="text-xs text-[#64748B]">
                  Clear explanations of why jobs & schemes match you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
