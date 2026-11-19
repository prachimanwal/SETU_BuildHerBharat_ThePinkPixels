import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0A0A] text-[#A3A3A3] py-10 border-t border-[#292929] mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#222222]">
          {/* Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link to="/" className="inline-block p-1 rounded-xl hover:opacity-90 transition">
              <img
                src="/setu-logo.png"
                alt="SETU"
                className="h-9 w-auto object-contain brightness-105"
              />
            </Link>
            <div>
              <p className="text-sm font-semibold text-[#F5F5F5]">SETU Platform</p>
              <p className="text-xs text-[#737373]">
                Bridging Skills, Opportunities & Employment
              </p>
            </div>
          </div>

          {/* Useful Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#A3A3A3]">
            <Link to="/" className="hover:text-[#F5F5F5] transition-colors">
              Home
            </Link>
            <Link to="/opportunities" className="hover:text-[#F5F5F5] transition-colors">
              Opportunities
            </Link>
            <Link to="/learn" className="hover:text-[#F5F5F5] transition-colors">
              Learn
            </Link>
            <Link to="/build-her" className="hover:text-[#FF5A1F] transition-colors">
              Mentorship
            </Link>
            <Link to="/schemes" className="hover:text-[#F5F5F5] transition-colors">
              Schemes
            </Link>
            <a
              href="mailto:contact@setu.gov.in"
              className="hover:text-[#F5F5F5] transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373] text-center sm:text-left">
          <p>© 2026 SETU. All Rights Reserved. हुनर से हक़ की कमाई तक।</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#A3A3A3] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#A3A3A3] transition-colors">
              Terms & Conditions
            </a>
            <span className="text-[#555555]">
              v2.0 (Premium)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
