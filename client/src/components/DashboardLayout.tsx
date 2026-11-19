import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, ChevronDown, User as UserIcon, Award, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
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

  // Derive page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return 'Dashboard Overview';
    if (p.startsWith('/opportunities')) return 'Opportunities';
    if (p.startsWith('/schemes')) return 'Government Schemes';
    if (p.startsWith('/build-her')) return 'Build Her Sanctuary';
    if (p.startsWith('/assess')) return 'Skill Assessments';
    if (p.startsWith('/learn')) return 'Learn & Practice';
    if (p.startsWith('/portfolio')) return 'My Portfolio';
    if (p.startsWith('/applications')) return 'Applications Desk';
    if (p.startsWith('/progress')) return 'My Progress & Journey';
    if (p.startsWith('/profile')) return 'Profile & Skills';
    if (p.startsWith('/employer')) return 'Employer Desk';
    if (p.startsWith('/admin')) return 'Administrator Console';
    return 'SETU Platform';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'employer') {
      return { text: 'Employer', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (role === 'admin') {
      return { text: 'Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    return { text: 'Job Seeker', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* 20% Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 80% Main Content Column */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-h-screen transition-all">
        {/* Top Header Bar */}
        <header className="h-16 lg:h-20 bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block">
                Connecting talent with verified career pathways
              </p>
            </div>
          </div>

          {/* Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-2xl hover:bg-stone-50 border border-stone-200/80 transition-all focus:outline-none"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {/* Circular Avatar */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-stone-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-stone-200 shadow-xs">
                  {getInitials(user?.name)}
                </div>
              )}

              {/* Name & Role Badge (Desktop) */}
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-stone-800 leading-tight">
                  {user?.name || 'SETU User'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}
                  >
                    {roleInfo.text}
                  </span>
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Card inside Dropdown */}
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${roleInfo.bg}`}
                    >
                      {roleInfo.text}
                    </span>
                  </div>
                </div>

                {/* Dropdown Links */}
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-stone-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/profile?tab=skills"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <Award className="w-4 h-4 text-stone-400" />
                    <span>My Skills</span>
                  </Link>

                  <Link
                    to="/profile?tab=settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-stone-400" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-stone-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic 80% Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Minimal Indigo Footer */}
        <Footer />
      </div>
    </div>
  );
};
