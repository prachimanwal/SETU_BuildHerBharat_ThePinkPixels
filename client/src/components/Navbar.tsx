import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Heart,
  Landmark,
  TrendingUp,
  Menu,
  X,
  Globe,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  ChevronDown,
  Building,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top institution & builder announcement strip */}
      <div className="bg-[#1E1B4B] text-slate-100 text-[11px] sm:text-xs py-1.5 px-4 font-medium flex items-center justify-between border-b border-indigo-950">
        <div className="flex items-center space-x-2 truncate">
          <span className="bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">
            Builder Bharat 2026
          </span>
          <span className="hidden md:inline text-indigo-200">|</span>
          <span className="truncate text-indigo-100 font-semibold">
            Build Her Bharat – K.R. Mangalam University, Gurugram
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="hidden sm:inline text-amber-300 font-serif">
            {language === 'hi' ? 'हुनर से हक़ की कमाई तक।' : 'हुनर से हक़ की कमाई तक।'}
          </span>
          {/* Quick Demo Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded text-xs transition"
              aria-label="Quick Demo Logins for judges"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Demo Logins</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 text-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] font-bold text-stone-600 px-2 py-1 uppercase tracking-wider border-b border-stone-100 mb-1">
                  1-Click Demo Profiles (Judges)
                </div>
                <button
                  onClick={() => handleQuickDemoLogin('seeker@setu.demo', 'SetuDemo@2026')}
                  className="w-full text-left px-2.5 py-2 hover:bg-orange-50 rounded-lg text-xs flex flex-col"
                >
                  <span className="font-semibold text-slate-900">Job Seeker: Priya Sharma</span>
                  <span className="text-[11px] text-stone-600">Career restart, assessment completed</span>
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('pending@startup.demo', 'SetuDemo@2026')}
                  className="w-full text-left px-2.5 py-2 hover:bg-amber-50 rounded-lg text-xs flex flex-col"
                >
                  <span className="font-semibold text-slate-900">Pending Employer: BharatTech</span>
                  <span className="text-[11px] text-amber-700">Verification pending admin approval</span>
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('employer@techcorp.demo', 'SetuDemo@2026')}
                  className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 rounded-lg text-xs flex flex-col"
                >
                  <span className="font-semibold text-slate-900">Approved Employer: Gramin Digital</span>
                  <span className="text-[11px] text-emerald-700">Verified badge, active job postings</span>
                </button>
                <button
                  onClick={() => handleQuickDemoLogin('admin@setu.gov.in', 'SetuAdmin@2026')}
                  className="w-full text-left px-2.5 py-2 hover:bg-indigo-50 rounded-lg text-xs flex flex-col border-t border-stone-100 mt-1 pt-1.5"
                >
                  <span className="font-semibold text-indigo-900">Platform Administrator</span>
                  <span className="text-[11px] text-indigo-600">Verification & moderation desk</span>
                </button>
              </div>
            )}
          </div>

          {/* English / Hindi Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded text-xs transition font-semibold"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-3 h-3 text-amber-300" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with official SETU brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <img
              src="/setu-logo.png"
              alt="SETU – Connect • Empower • Grow"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              to="/opportunities"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/opportunities')
                  ? 'bg-orange-50 text-orange-900 font-semibold'
                  : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
              }`}
            >
              {t('navOpportunities')}
            </Link>

            <Link
              to="/schemes"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/schemes')
                  ? 'bg-orange-50 text-orange-900 font-semibold'
                  : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
              }`}
            >
              {t('navSchemes')}
            </Link>

            <Link
              to="/build-her"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${
                isActive('/build-her')
                  ? 'bg-pink-50 text-pink-900 font-semibold border border-pink-200'
                  : 'text-pink-700 hover:bg-pink-50/70'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
              <span>{t('navBuildHer')}</span>
            </Link>

            {user?.role === 'seeker' && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navDashboard')}
                </Link>

                <Link
                  to="/assess"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/assess')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navAssess')}
                </Link>

                <Link
                  to="/learn"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/learn')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navLearn')}
                </Link>

                <Link
                  to="/portfolio"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/portfolio')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navPortfolio')}
                </Link>

                <Link
                  to="/applications"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/applications')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navApplications')}
                </Link>

                <Link
                  to="/progress"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isActive('/progress')
                      ? 'bg-orange-50 text-orange-900 font-semibold'
                      : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                  }`}
                >
                  {t('navProgress')}
                </Link>
              </>
            )}

            {user?.role === 'employer' && (
              <Link
                to="/employer"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/employer')
                    ? 'bg-indigo-50 text-indigo-900 font-semibold'
                    : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                }`}
              >
                Employer Portal
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/admin')
                    ? 'bg-purple-50 text-purple-900 font-semibold'
                    : 'text-stone-700 hover:text-slate-950 hover:bg-stone-50'
                }`}
              >
                Admin Control
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 py-1.5 px-3 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 transition text-sm font-medium text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1E1B4B] text-amber-300 font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-stone-200 text-stone-700 uppercase">
                    {user.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-600" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-600 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
                    </div>

                    {user.role === 'seeker' && (
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <UserIcon className="w-4 h-4 mr-2 text-stone-600" />
                        My Profile & Resume
                      </Link>
                    )}

                    {user.role === 'employer' && (
                      <Link
                        to="/employer"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <Building className="w-4 h-4 mr-2 text-stone-600" />
                        Company & Applicants
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2 text-stone-600" />
                        Admin Moderation Desk
                      </Link>
                    )}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('navLogout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-stone-700 hover:text-slate-900 transition"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold bg-[#E65100] hover:bg-orange-700 text-white rounded-lg shadow-sm transition"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top">
          <Link
            to="/opportunities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
          >
            {t('navOpportunities')}
          </Link>
          <Link
            to="/schemes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
          >
            {t('navSchemes')}
          </Link>
          <Link
            to="/build-her"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-pink-700 hover:bg-pink-50"
          >
            {t('navBuildHer')}
          </Link>

          {user?.role === 'seeker' && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navDashboard')}
              </Link>
              <Link
                to="/assess"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navAssess')}
              </Link>
              <Link
                to="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navLearn')}
              </Link>
              <Link
                to="/portfolio"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navPortfolio')}
              </Link>
              <Link
                to="/applications"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navApplications')}
              </Link>
              <Link
                to="/progress"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                {t('navProgress')}
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-stone-100"
              >
                My Profile & Skills
              </Link>
            </>
          )}

          {user?.role === 'employer' && (
            <Link
              to="/employer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Employer Dashboard
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 hover:bg-purple-50"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-stone-200">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                {t('navLogout')} ({user.name})
              </button>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-stone-300 font-medium text-slate-800"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-[#E65100] text-white font-medium"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
