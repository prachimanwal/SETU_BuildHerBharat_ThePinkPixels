import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#12102E] text-stone-300 py-8 border-t border-indigo-950/60 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-indigo-900/40">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link to="/" className="inline-block bg-white/95 px-3 py-1.5 rounded-xl shadow-xs">
              <img
                src="/setu-logo.png"
                alt="SETU"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="text-xs text-indigo-200/80 font-medium">
              Bridging Skills, Opportunities & Employment
            </span>
          </div>

          {/* Useful Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-stone-300">
            <Link to="/opportunities" className="hover:text-white transition-colors">
              Opportunities
            </Link>
            <Link to="/schemes" className="hover:text-white transition-colors">
              Government Schemes
            </Link>
            <Link to="/build-her" className="hover:text-pink-300 transition-colors">
              Build Her
            </Link>
            <Link to="/learn" className="hover:text-white transition-colors">
              Learn & Practice
            </Link>
            <a
              href="mailto:contact@setu.gov.in"
              className="hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 text-center sm:text-left">
          <p>© 2026 SETU. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-stone-200 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-stone-200 transition-colors">
              Terms & Conditions
            </a>
            <span className="text-[11px] text-stone-500">
              K.R. Mangalam University
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
