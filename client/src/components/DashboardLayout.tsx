import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  User as UserIcon,
  Award,
  Settings,
  LogOut,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { UserAvatar } from './UserAvatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, successNotice, clearSuccessNotice } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!successNotice) return;
    const timer = window.setTimeout(() => {
      clearSuccessNotice();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [successNotice, clearSuccessNotice]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return 'Dashboard Overview';
    if (p.startsWith('/onboarding')) return 'Career Profile Builder';
    if (p.startsWith('/opportunities')) return 'Opportunities';
    if (p.startsWith('/schemes')) return 'Government Schemes';
    if (p.startsWith('/build-her')) return 'Build Her Sanctuary';
    if (p.startsWith('/assess')) return 'Skill Assessments';
    if (p.startsWith('/learn')) return 'Learn & Practice';
    if (p.startsWith('/portfolio')) return 'My Portfolio';
    if (p.startsWith('/applications')) return 'Applications Desk';
    if (p.startsWith('/progress')) return 'My Progress & Journey';
    if (p.startsWith('/profile')) return 'My Career Profile';
    if (p.startsWith('/employer')) return 'Employer Desk';
    if (p.startsWith('/admin')) return 'Administrator Console';
    return 'SETU Platform';
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'employer') {
      return { text: 'Employer', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (role === 'admin') {
      return { text: 'Admin', bg: 'bg-[#D6EEFF] text-[#1E3A5F] border-[#A2D2FF]' };
    }
    return { text: 'Job Seeker', bg: 'bg-[#EAF7FF] text-[#1E3A5F] border-[#BDE0FE]' };
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-[#F8FCFF] text-[#334155] flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-h-screen transition-all bg-[#F8FCFF]">
        {/* Top Header Bar */}
        <header className="h-16 lg:h-20 bg-white/90 backdrop-blur-md border-b border-[#D8ECFA] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-2xl text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#334155] tracking-tight font-display">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-[#64748B] hidden sm:block">
                Your next opportunity is closer than you think
              </p>
            </div>
          </div>

          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#F8FCFF] hover:bg-[#EAF7FF] border border-[#D8ECFA] hover:border-[#A2D2FF] transition-all focus:outline-none"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <UserAvatar
                name={user?.name}
                src={user?.profilePicture || user?.avatar}
                size="md"
              />

              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-[#334155] leading-tight">
                  {user?.name || 'SETU Member'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${roleInfo.bg}`}
                  >
                    {roleInfo.text}
                  </span>
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-[#64748B] transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-baby border border-[#D8ECFA] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#EAF7FF] flex items-center gap-3">
                  <UserAvatar
                    name={user?.name}
                    src={user?.profilePicture || user?.avatar}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#334155] truncate">{user?.name}</p>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.bg}`}
                      >
                        {roleInfo.text}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1.5 px-2 space-y-0.5">
                  {user?.role === 'seeker' && (
                    <Link
                      to="/onboarding"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF] transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-[#3B9EE8]" />
                      <span>Guided Profile Builder</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#3B9EE8]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/assess"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                  >
                    <Award className="w-4 h-4 text-[#3B9EE8]" />
                    <span>Skill Assessments</span>
                  </Link>

                  <Link
                    to="/profile?tab=settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#64748B]" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="pt-1.5 px-2 border-t border-[#EAF7FF]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-[#F8FCFF]">
          {successNotice && (
            <div
              role="status"
              className="mb-6 max-w-6xl mx-auto p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-baby-sm"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successNotice}</span>
              </div>
              <button
                type="button"
                onClick={clearSuccessNotice}
                className="text-emerald-600 hover:text-emerald-800 transition"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};
