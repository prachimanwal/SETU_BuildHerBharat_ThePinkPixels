import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-[#EAF7FF] to-[#F8FCFF] text-[#64748B] py-10 border-t border-[#D8ECFA] mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#D8ECFA]">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link
              to="/"
              className="inline-block p-2 rounded-2xl bg-white border border-[#D8ECFA] shadow-baby-sm hover:opacity-90 transition"
            >
              <img
                src="/setu-logo.png"
                alt="SETU"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div>
              <p className="text-sm font-bold text-[#334155] font-display">SETU Platform</p>
              <p className="text-xs text-[#64748B]">
                Bridging Skills, Opportunities & Employment
              </p>
            </div>
          </div>

          {/* Useful Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#64748B]">
            <Link to="/" className="hover:text-[#334155] transition-colors">
              Home
            </Link>
            <Link to="/opportunities" className="hover:text-[#334155] transition-colors">
              Opportunities
            </Link>
            <Link to="/learn" className="hover:text-[#334155] transition-colors">
              Learn
            </Link>
            <Link to="/build-her" className="hover:text-[#3B9EE8] transition-colors">
              Mentorship
            </Link>
            <Link to="/schemes" className="hover:text-[#334155] transition-colors">
              Schemes
            </Link>
            <a
              href="mailto:contact@setu.gov.in"
              className="hover:text-[#334155] transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B] text-center sm:text-left">
          <p>© 2026 SETU. All Rights Reserved. हुनर से हक़ की कमाई तक।</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#334155] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#334155] transition-colors">
              Terms & Conditions
            </a>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D8ECFA] text-[11px] font-semibold text-[#3B9EE8]">
              SETU 2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
