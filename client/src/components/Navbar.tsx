import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  Sparkles,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setDemoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setDemoMenuOpen(false);
    const res = await login(email, pass);
    if (res.success) {
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('employer') || email.includes('pending')) navigate('/employer');
      else navigate('/dashboard');
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'employer') return '/employer';
    return '/dashboard';
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: language === 'hi' ? 'मुख्य पृष्ठ' : 'Home', path: '/' },
    { label: language === 'hi' ? 'अवसर खोजें' : 'Explore Opportunities', path: '/opportunities' },
    { label: language === 'hi' ? 'सीखें' : 'Learn', path: '/learn' },
    { label: language === 'hi' ? 'मेंटरशिप' : 'Mentorship', path: '/build-her' },
    { label: language === 'hi' ? 'समुदाय' : 'Community', path: '/schemes' },
    { label: language === 'hi' ? 'परिचय' : 'About', path: '/#about' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-md border-b border-[#292929] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* LEFT SECTION: Logo and Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/setu-logo.png"
                  alt="SETU Logo"
                  className="h-10 w-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(255,90,31,0.25)] group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-[#F5F5F5] font-display flex items-center gap-1.5">
                  SETU
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5A1F]"></span>
                </span>
                <span className="text-[10px] text-[#A3A3A3] font-medium tracking-wide hidden sm:block">
                  {language === 'hi' ? 'हुनर से हक़ की कमाई तक' : 'Empowering Futures'}
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER SECTION: Clean, minimal navigation links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    active
                      ? 'text-[#F5F5F5] font-semibold'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#151515]'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-3.5 right-3.5 h-[2px] bg-[#FF5A1F] rounded-full shadow-[0_0_8px_rgba(255,90,31,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT SECTION: Controls, Language, Demo switcher, Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292929] bg-[#101010] hover:bg-[#151515] text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-semibold transition"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Quick Demo Logins Dropdown (For Evaluators) */}
            <div className="relative" ref={demoRef}>
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#292929] bg-[#151515] hover:border-[#FF5A1F]/50 text-xs font-semibold text-[#F5F5F5] transition"
                aria-label="Quick Demo Logins"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>Demo Access</span>
                <ChevronDown className={`w-3 h-3 text-[#A3A3A3] transition-transform ${demoMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#151515] border border-[#292929] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#292929] mb-1">
                    <p className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider">
                      1-Click Evaluator Profiles
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickDemoLogin('seeker@setu.demo', 'SetuDemo@2026')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#1C1C1C] rounded-xl text-xs flex flex-col gap-0.5 group transition"
                  >
                    <span className="font-semibold text-[#F5F5F5] group-hover:text-[#FF5A1F]">Job Seeker: Priya Sharma</span>
                    <span className="text-[11px] text-[#A3A3A3]">Career restart, verified Canva skill, scheduled interview</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('employer@techcorp.demo', 'SetuDemo@2026')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#1C1C1C] rounded-xl text-xs flex flex-col gap-0.5 group transition"
                  >
                    <span className="font-semibold text-[#F5F5F5] group-hover:text-emerald-400">Approved Employer: Gramin Digital</span>
                    <span className="text-[11px] text-[#A3A3A3]">Verified enterprise, publish jobs & review applicants</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('pending@startup.demo', 'SetuDemo@2026')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#1C1C1C] rounded-xl text-xs flex flex-col gap-0.5 group transition"
                  >
                    <span className="font-semibold text-[#F5F5F5] group-hover:text-amber-400">Pending Employer: BharatTech</span>
                    <span className="text-[11px] text-[#A3A3A3]">Awaiting platform admin verification</span>
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('admin@setu.gov.in', 'SetuAdmin@2026')}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#1C1C1C] rounded-xl text-xs flex flex-col gap-0.5 group transition border-t border-[#292929] mt-1 pt-2"
                  >
                    <span className="font-semibold text-[#F5F5F5] group-hover:text-blue-400">Platform Administrator</span>
                    <span className="text-[11px] text-[#A3A3A3]">Full moderation, verification & safety reports</span>
                  </button>
                </div>
              )}
            </div>

            {/* Authentication Buttons / Profile */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-full bg-[#151515] border border-[#292929] hover:border-[#383838] transition focus:outline-none"
                >
                  <UserAvatar
                    name={user.name}
                    src={user.profilePicture || user.avatar}
                    size="sm"
                  />
                  <span className="text-xs font-semibold text-[#F5F5F5] max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#A3A3A3] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#151515] border border-[#292929] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-[#292929] flex items-center gap-3">
                      <UserAvatar
                        name={user.name}
                        src={user.profilePicture || user.avatar}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#F5F5F5] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#A3A3A3] truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#1C1C1C] text-[#FF5A1F] border border-[#292929]">
                          {user.role === 'seeker' ? 'Job Seeker' : user.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#F5F5F5] hover:bg-[#1C1C1C] transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#FF5A1F]" />
                        <span>Go to Dashboard</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] transition"
                      >
                        <UserIcon className="w-4 h-4 text-[#A3A3A3]" />
                        <span>My Profile</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#292929]">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-[#F5F5F5] hover:text-white hover:bg-[#151515] rounded-xl transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#FF7847] rounded-xl transition shadow-[0_2px_12px_rgba(255,90,31,0.35)] flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl border border-[#292929] bg-[#101010] text-[#A3A3A3] text-xs font-semibold"
            >
              {language === 'en' ? 'हि' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-[#292929] bg-[#101010] text-[#F5F5F5] hover:bg-[#151515] transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0A0A] border-b border-[#292929] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-[#151515] text-[#FF5A1F] font-semibold border border-[#292929]'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#292929] space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 bg-[#FF5A1F] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl border border-red-900/40 text-red-400 text-xs font-semibold"
                >
                  Sign Out ({user.name})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl border border-[#292929] text-xs font-semibold text-[#F5F5F5] hover:bg-[#151515]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-[#FF5A1F] text-white text-xs font-bold shadow-[0_2px_12px_rgba(255,90,31,0.35)]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
