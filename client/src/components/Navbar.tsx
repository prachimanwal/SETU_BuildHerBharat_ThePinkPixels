import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useAuth, isBuildHerEligible } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';
import { ThemeToggleButton } from './ThemeToggleButton';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
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

  const showBuildHer = isBuildHerEligible(user);

  const navLinks = [
    { label: language === 'hi' ? 'मुख्य पृष्ठ' : 'Home', path: '/' },
    { label: language === 'hi' ? 'अवसर खोजें' : 'Opportunities', path: '/opportunities' },
    { label: language === 'hi' ? 'सीखें' : 'Learn', path: '/learn' },
    ...(showBuildHer
      ? [{ label: language === 'hi' ? 'मेंटरशिप' : 'Mentorship', path: '/build-her' }]
      : []),
    { label: language === 'hi' ? 'योजनाएं' : 'Schemes', path: '/schemes' },
    { label: language === 'hi' ? 'परिचय' : 'About', path: '/#about' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#D8ECFA] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* LEFT SECTION: Logo and Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-1.5 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA] group-hover:bg-[#D6EEFF] transition-colors">
                <img
                  src="/setu-logo.png"
                  alt="SETU Logo"
                  className="h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#334155] font-display flex items-center gap-1.5">
                  SETU
                  <span className="inline-block w-2 h-2 rounded-full bg-[#A2D2FF]"></span>
                </span>
                <span className="text-[10px] text-[#64748B] font-medium tracking-wide hidden sm:block">
                  {language === 'hi' ? 'हुनर से हक़ की कमाई तक' : 'Empowering Futures'}
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER SECTION: Clean rounded navigation links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#EAF7FF] text-[#1E3A5F] font-semibold border border-[#BDE0FE]'
                      : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FCFF]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT SECTION: Theme Toggle, Language Selector & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            <ThemeToggleButton />
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#D8ECFA] bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] text-xs font-semibold transition"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#3B9EE8]" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2 pr-3.5 rounded-full bg-[#F8FCFF] border border-[#D8ECFA] hover:border-[#A2D2FF] hover:bg-[#EAF7FF] transition focus:outline-none"
                >
                  <UserAvatar
                    name={user.name}
                    src={user.profilePicture || user.avatar}
                    size="sm"
                  />
                  <span className="text-xs font-semibold text-[#334155] max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${
                      userDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-white border border-[#D8ECFA] shadow-baby py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#EAF7FF] flex items-center gap-3">
                      <UserAvatar
                        name={user.name}
                        src={user.profilePicture || user.avatar}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#334155] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                          {user.role === 'seeker' ? 'Job Seeker' : user.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5 px-2 space-y-0.5">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#334155] hover:bg-[#EAF7FF] transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#3B9EE8]" />
                        <span>Go to Dashboard</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition"
                      >
                        <UserIcon className="w-4 h-4 text-[#64748B]" />
                        <span>My Profile</span>
                      </Link>
                    </div>

                    <div className="pt-1.5 px-2 border-t border-[#EAF7FF]">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
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
                  className="px-4 py-2 text-xs font-semibold text-[#334155] hover:bg-[#EAF7FF] rounded-full transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-xs font-bold text-[#1E3A5F] bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] rounded-full transition shadow-baby-sm flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggleButton className="!p-2 rounded-full" />
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-full border border-[#D8ECFA] bg-[#F8FCFF] text-[#334155] text-xs font-semibold"
            >
              {language === 'en' ? 'हि' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-[#334155] hover:bg-[#EAF7FF] transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#D8ECFA] px-4 pt-3 pb-6 space-y-4 shadow-baby">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition ${
                    active
                      ? 'bg-[#EAF7FF] text-[#1E3A5F] font-semibold border border-[#BDE0FE]'
                      : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FCFF]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#EAF7FF] space-y-2">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-baby-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-semibold"
                >
                  Sign Out ({user.name})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs font-semibold text-[#334155] hover:bg-[#EAF7FF]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
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
