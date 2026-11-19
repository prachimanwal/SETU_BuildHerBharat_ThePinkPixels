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
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { JourneyBridge } from '../components/JourneyBridge';

export const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/opportunities?limit=3')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setOpportunities(data.results || data.data || []))
      .catch(() => {
        // Fallback default featured opportunities for instant visual presentation
        setOpportunities([
          {
            _id: '1',
            title: 'Digital Graphic Associate',
            company: 'Gramin Digital Services Pvt Ltd',
            location: { city: 'Gurugram', state: 'Haryana', isRural: false },
            workMode: 'hybrid',
            stipendOrSalary: '₹22,000 / month',
            employmentType: 'full-time',
            requiredSkills: ['Canva', 'Social Media', 'Content Formatting']
          },
          {
            _id: '2',
            title: 'Hindi & Regional Content Creator',
            company: 'Bharat Vani Media',
            location: { city: 'Remote', state: 'Pan India', isRural: true },
            workMode: 'remote',
            stipendOrSalary: '₹18,000 / month',
            employmentType: 'part-time',
            requiredSkills: ['Hindi Typing', 'Creative Writing', 'Canva']
          },
          {
            _id: '3',
            title: 'Operations & Community Facilitator',
            company: 'Pratham Skilling Initiative',
            location: { city: 'Nuh', state: 'Haryana', isRural: true },
            workMode: 'onsite',
            stipendOrSalary: '₹25,000 / month',
            employmentType: 'full-time',
            requiredSkills: ['Community Outreach', 'Basic Excel', 'Hindi Communication']
          }
        ]);
      });

    fetch('/api/public/schemes')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setSchemes((data.data || data || []).slice(0, 3)))
      .catch(() => {
        setSchemes([
          {
            _id: 's1',
            title: 'PM Vishwakarma Yojana',
            ministryOrDepartment: 'Ministry of MSME',
            targetBeneficiary: 'Artisans & Craftsmen',
            benefits: '₹15,000 tool kit incentive & collateral-free credit support up to ₹3 Lakhs.'
          },
          {
            _id: 's2',
            title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
            ministryOrDepartment: 'Ministry of Skill Development & Entrepreneurship',
            targetBeneficiary: 'Youth & Job Seekers',
            benefits: 'Free industry-aligned skill certification, assessment vouchers & stipend.'
          },
          {
            _id: 's3',
            title: 'Mahila Samriddhi Yojana',
            ministryOrDepartment: 'Ministry of Social Justice & Empowerment',
            targetBeneficiary: 'Women Entrepreneurs & Returnees',
            benefits: 'Microfinance up to ₹1,40,000 at highly subsidized 4% interest rate.'
          }
        ]);
      });
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 bg-[#080808] text-[#F5F5F5] min-h-screen">
      {/* 1. HERO SECTION (TASK 4) */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#222222]">
        {/* Subtle Ambient Tech Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#292929_1px,transparent_1px)] [background-size:32px_32px] opacity-25"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FF5A1F]/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Subtle Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#151515] border border-[#292929] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF5A1F] shadow-[0_0_8px_rgba(255,90,31,0.8)]"></span>
            <span className="text-xs font-semibold text-[#A3A3A3] tracking-wide">
              {language === 'hi' ? 'हुनर से हक़ की कमाई तक।' : 'Bridging Skills, Opportunities & Employment'}
            </span>
          </div>

          {/* Large Bold Headline (Task 4 requirement) */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display text-[#F5F5F5] leading-[1.1]">
              Your Potential.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A1F] via-[#FF7847] to-[#FFA07A]">
                Your Path.
              </span>{' '}
              Your Future.
            </h1>
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-[#A3A3A3] font-normal leading-relaxed">
              Discover opportunities, build valuable skills, connect with mentors, and take the next step toward meaningful employment.
            </p>
          </div>

          {/* Primary & Secondary CTAs (Task 4 requirement) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/opportunities"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7847] text-white font-bold text-sm sm:text-base shadow-[0_4px_24px_rgba(255,90,31,0.4)] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#discover-setu"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#151515] hover:bg-[#1C1C1C] text-[#F5F5F5] font-semibold text-sm sm:text-base border border-[#292929] hover:border-[#383838] transition flex items-center justify-center gap-2"
            >
              <span>Discover SETU</span>
              <ChevronRight className="w-4 h-4 text-[#A3A3A3]" />
            </a>
          </div>

          {/* Secondary Persona Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#737373]">
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#222222]">College Graduates</span>
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#222222]">Women Returning to Work</span>
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#222222]">Rural Talent</span>
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#222222]">Freelancers</span>
            <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#222222]">Practical Skilled Workers</span>
          </div>
        </div>
      </section>

      {/* 2. IMPACT METRICS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect">
            <div className="flex items-center gap-2 text-[#FF5A1F] mb-2">
              <Briefcase className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#A3A3A3]">Active Roles</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-display">10,000+</div>
            <p className="text-xs text-[#737373] mt-1">Verified micro-jobs, internships & full-time positions</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#A3A3A3]">Skill Scoring</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-display">92%</div>
            <p className="text-xs text-[#737373] mt-1">Practical assessment accuracy with instant gap analysis</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Landmark className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#A3A3A3]">Welfare Bridge</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-display">35+</div>
            <p className="text-xs text-[#737373] mt-1">Government schemes directly matched to eligibility</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider text-[#A3A3A3]">Trust & Safety</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] font-display">100%</div>
            <p className="text-xs text-[#737373] mt-1">Admin-verified employers & moderated safe listings</p>
          </div>
        </div>
      </section>

      {/* 3. 7-STAGE JOURNEY BRIDGE */}
      <section id="discover-setu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <JourneyBridge currentStage="discover" completedStages={[]} />
      </section>

      {/* 4. FEATURED OPPORTUNITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#FF5A1F] text-xs font-bold tracking-wider uppercase mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Verified Employment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5] font-display">
              Latest Verified Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
              Hand-picked listings designed for practical capabilities and verified skills
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#FF5A1F] hover:text-[#FF7847] transition"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp._id}
              className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#1C1C1C] text-[#FF5A1F] border border-[#292929]">
                    {opp.employmentType || 'Opportunity'}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {opp.stipendOrSalary || 'Competitive'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5] line-clamp-1">{opp.title}</h3>
                <p className="text-xs text-[#A3A3A3] mt-1">{opp.company}</p>

                <div className="flex items-center gap-3 mt-4 text-xs text-[#737373]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {opp.location?.city || 'Flexible'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {opp.workMode || 'Hybrid'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(opp.requiredSkills || []).slice(0, 3).map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#101010] text-[#A3A3A3] border border-[#242424]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#222222]">
                <Link
                  to="/opportunities"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-[#F5F5F5] text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <span>View Details & Match</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF5A1F]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BUILD HER SANCTUARY & MENTORSHIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-[#181216] via-[#151515] to-[#121212] border border-rose-950/60 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>Build Her Sanctuary & Mentorship</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight font-display">
              Dedicated Support for Women Returning to Work
            </h2>
            <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
              Safe spaces, confidential employer verification, 1-on-1 mentorship, and structured flexible roles tailored for women restarting their professional journey after a career break.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                to="/build-her"
                className="px-6 py-3.5 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7847] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,90,31,0.35)] transition"
              >
                <span>Enter Build Her Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register?role=seeker"
                className="px-6 py-3.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-[#F5F5F5] text-xs sm:text-sm font-semibold border border-[#292929] flex items-center justify-center gap-2 transition"
              >
                <span>Get Matched with a Mentor</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GOVERNMENT SCHEMES DIRECTORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
              <Landmark className="w-4 h-4" />
              <span>Public Welfare & Grants</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5] font-display">
              Government Schemes & Subsidies
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
              Direct access to government skill training, financial assistance, and entrepreneurship toolkits
            </p>
          </div>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#FF5A1F] hover:text-[#FF7847] transition"
          >
            <span>Explore All Schemes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schemes.map((s) => (
            <div
              key={s._id}
              className="p-6 rounded-2xl bg-[#151515] border border-[#292929] card-hover-effect flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-2">
                  {s.ministryOrDepartment}
                </span>
                <h3 className="text-base font-bold text-[#F5F5F5] line-clamp-1">{s.title}</h3>
                <p className="text-xs text-[#A3A3A3] mt-1 font-medium">Target: {s.targetBeneficiary}</p>
                <p className="text-xs text-[#737373] mt-3 line-clamp-2 leading-relaxed">{s.benefits}</p>
              </div>

              <div className="pt-5 mt-5 border-t border-[#222222]">
                <Link
                  to="/schemes"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#101010] hover:bg-[#1C1C1C] text-[#F5F5F5] text-xs font-semibold flex items-center justify-center gap-2 border border-[#242424] transition"
                >
                  <span>Check Eligibility</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. ABOUT SETU (MISSION SECTION) */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#101010] border border-[#292929]">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F]">Our Mission</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight font-display">
              Democratizing Opportunities for Every Indian
            </h2>
            <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
              Traditional hiring systems over-index on formal degrees and legacy credentials, leaving millions of capable Indians behind. SETU reconstructs the hiring lifecycle: discover raw potential through adaptive tests, cultivate hands-on skills through real deliverables, and match directly with employers who value demonstrated ability.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#151515] border border-[#242424]">
                <CheckCircle2 className="w-5 h-5 text-[#FF5A1F] mb-2" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Merit First</h4>
                <p className="text-xs text-[#737373] mt-1">Evaluated on real practical performance, not pedigree</p>
              </div>
              <div className="p-4 rounded-xl bg-[#151515] border border-[#242424]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Bilingual & Accessible</h4>
                <p className="text-xs text-[#737373] mt-1">Full English and Hindi support across every feature</p>
              </div>
              <div className="p-4 rounded-xl bg-[#151515] border border-[#242424]">
                <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-[#F5F5F5]">Zero Platform Fees</h4>
                <p className="text-xs text-[#737373] mt-1">100% free discovery and application for job seekers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CONVERSION CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#151515] to-[#1A1A1A] border border-[#292929] p-8 sm:p-14 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#FF5A1F_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F5] font-display tracking-tight">
            Start Your Journey with SETU Today
          </h2>
          <p className="text-sm sm:text-base text-[#A3A3A3] max-w-2xl mx-auto">
            Whether you are taking your first career step, returning after a pause, or hiring proven talent for your organization, SETU provides the bridge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register?role=seeker"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7847] text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,90,31,0.35)] transition flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register?role=employer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#101010] hover:bg-[#1C1C1C] text-[#F5F5F5] font-semibold text-sm border border-[#292929] transition"
            >
              <span>Hire on SETU</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
