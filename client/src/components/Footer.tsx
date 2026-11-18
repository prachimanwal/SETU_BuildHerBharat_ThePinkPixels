import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart, Landmark, PhoneCall, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-[#12102F] text-slate-300 pt-12 pb-8 border-t border-indigo-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold font-serif text-lg">
                स
              </div>
              <span className="text-xl font-bold font-serif text-white tracking-wide">
                SETU
              </span>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed font-serif">
              हुनर से हक़ की कमाई तक।
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bridging skills, practical practice, and credible opportunities for students, graduates, women returning to work, rural job seekers, and hands-on talent across India.
            </p>
            <div className="pt-1">
              <span className="inline-block text-[11px] bg-indigo-900/60 border border-indigo-800 text-indigo-200 px-2.5 py-1 rounded-md">
                Builder Bharat 2026 • K.R. Mangalam University
              </span>
            </div>
          </div>

          {/* Core Journey Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">
              {language === 'hi' ? '7-चरणीय सेतु यात्रा' : 'The 7-Stage Journey'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/profile" className="hover:text-amber-300 transition">
                  1. Discover: Profile & Talents
                </Link>
              </li>
              <li>
                <Link to="/assess" className="hover:text-amber-300 transition">
                  2. Assess: Skill Strengths & Gaps
                </Link>
              </li>
              <li>
                <Link to="/learn" className="hover:text-amber-300 transition">
                  3. Learn: Tutorials & Guidance
                </Link>
              </li>
              <li>
                <Link to="/learn" className="hover:text-amber-300 transition">
                  4. Practice: Real Assignments
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-amber-300 transition">
                  5. Build Portfolio: Work Samples
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-amber-300 transition">
                  6. Find Opportunities: Matched Jobs
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-amber-300 transition">
                  7. Earn: Direct Selection & Work
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Initiatives */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">
              Portals & Programs
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/build-her" className="text-pink-300 hover:text-pink-200 flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>Build Her – Women Returnees Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-amber-300 flex items-center space-x-1">
                  <Landmark className="w-3 h-3" />
                  <span>Verified Govt Schemes (PMKVY, NAPS)</span>
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-amber-300">
                  Search Jobs & Apprenticeships
                </Link>
              </li>
              <li>
                <Link to="/employer" className="hover:text-amber-300">
                  Employer Verification & Hiring
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-300">
                  Platform Moderation Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & National Helplines */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Safety & POSH Support</span>
            </h4>
            <p className="text-xs text-slate-400">
              SETU is committed to safe, dignified work environments. Confirmed official helplines:
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between bg-indigo-950/80 p-1.5 rounded border border-indigo-900">
                <span className="text-slate-300">Women Helpline (NCW):</span>
                <span className="text-amber-400 font-mono font-bold">7827170170</span>
              </div>
              <div className="flex items-center justify-between bg-indigo-950/80 p-1.5 rounded border border-indigo-900">
                <span className="text-slate-300">Emergency Response:</span>
                <span className="text-amber-400 font-mono font-bold">112 / 1091</span>
              </div>
              <div className="flex items-center justify-between bg-indigo-950/80 p-1.5 rounded border border-indigo-900">
                <span className="text-slate-300">Domestic & Workplace Support:</span>
                <span className="text-amber-400 font-mono font-bold">181</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © 2026 SETU. Built for Builder Bharat 2026 – Build Her Bharat at K.R. Mangalam University, Gurugram.
          </p>
          <div className="flex items-center space-x-4">
            <Link to="/build-her" className="hover:text-slate-300">
              Workplace Safety & POSH
            </Link>
            <span>•</span>
            <Link to="/schemes" className="hover:text-slate-300">
              Official Portals
            </Link>
            <span>•</span>
            <span className="text-slate-400">Demo Stack: React + Express + MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
