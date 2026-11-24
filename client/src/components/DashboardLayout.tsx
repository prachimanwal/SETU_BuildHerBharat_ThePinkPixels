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
  X,
  Bell,
  Building2,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { UserAvatar } from './UserAvatar';
import { CaneFloatingWidget } from './CaneChatWidget';
import { ThemeToggleButton } from './ThemeToggleButton';
import { apiFetch, unwrapData } from '../utils/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, successNotice, clearSuccessNotice } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    const endpoint =
      user.role === 'employer' ? '/api/employer/notifications' : '/api/notifications';
    const res = await apiFetch(endpoint);
    if (res.ok && res.data) {
      const data = unwrapData(res.data);
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(Number(data.unreadCount || 0));
      }
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id, location.pathname]);

  const handleMarkRead = async (notif: any) => {
    if (!notif.isRead) {
      const endpoint =
        user?.role === 'employer'
          ? `/api/employer/notifications/${notif._id}/read`
          : `/api/notifications/${notif._id}/read`;
      await apiFetch(endpoint, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    const endpoint =
      user?.role === 'employer'
        ? '/api/employer/notifications/read-all'
        : '/api/notifications/read-all';
    const res = await apiFetch(endpoint, { method: 'PATCH' });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/employer/onboarding')) return 'Company Onboarding';
    if (p.startsWith('/employer/company-profile')) return 'Company Profile';
    if (p.startsWith('/employer/verification')) return 'Company Verification';
    if (p.startsWith('/employer/jobs')) return 'Job Management';
    if (p.startsWith('/employer/candidates')) return 'Candidate Search';
    if (p.startsWith('/employer/applications')) return 'Applications Pipeline';
    if (p.startsWith('/employer/hiring-preferences')) return 'Hiring Preferences';
    if (p.startsWith('/employer/interviews')) return 'Interview Management';
    if (p.startsWith('/employer/analytics')) return 'Recruitment Analytics';
    if (p.startsWith('/employer/settings')) return 'Employer Settings';
    if (p.startsWith('/employer')) return 'Employer Dashboard';
    if (p.startsWith('/companies/')) return 'Company Profile';
    if (p.startsWith('/dashboard')) return 'Dashboard Overview';
    if (p.startsWith('/onboarding')) return 'Career Profile Builder';
    if (p.startsWith('/opportunities')) return 'Opportunities';
    if (p.startsWith('/schemes')) return 'Government Schemes';
    if (p.startsWith('/build-her')) return 'Build Her';
    if (p.startsWith('/assess')) return 'Skill Assessments';
    if (p.startsWith('/learn')) return 'Learn & Practice';
    if (p.startsWith('/portfolio')) return 'My Portfolio';
    if (p.startsWith('/applications')) return 'Applications Desk';
    if (p.startsWith('/progress')) return 'My Progress & Journey';
    if (p.startsWith('/cane')) return 'CANE AI Career Companion';
    if (p.startsWith('/profile')) return 'My Career Profile';
    if (p.startsWith('/settings')) return 'Account & Security Settings';
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
                {user?.role === 'employer'
                  ? 'SETU Company Management & Ethical Recruitment Platform'
                  : 'Your next opportunity is closer than you think'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle (immediately before Notification Bell and User Profile) */}
            <ThemeToggleButton />

            {/* Interactive Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  if (!notifOpen) loadNotifications();
                }}
                className="relative p-2.5 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] border border-[#D8ECFA] text-[#475569] hover:text-[#1E3A5F] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3B9EE8] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-baby border border-[#D8ECFA] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#EAF7FF] flex items-center justify-between bg-[#F8FCFF]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1E3A5F]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2589D6] hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#EAF7FF]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#64748B]">
                        No notifications yet. Updates about applications, interviews, and verification will appear here.
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => handleMarkRead(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-[#F8FCFF] transition flex items-start gap-2.5 ${
                            !n.isRead ? 'bg-[#EAF7FF]/45' : ''
                          }`}
                        >
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              !n.isRead ? 'bg-[#3B9EE8]' : 'bg-[#CBD5E1]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1E3A5F] leading-snug">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-[#94A3B8] mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                    {user?.role === 'employer' ? (
                      <>
                        <Link
                          to="/employer/onboarding"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-[#3B9EE8]" />
                          <span>Company Onboarding</span>
                        </Link>
                        <Link
                          to="/employer/company-profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <Building2 className="w-4 h-4 text-[#3B9EE8]" />
                          <span>Company Profile</span>
                        </Link>
                        <Link
                          to="/employer/verification"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#3B9EE8]" />
                          <span>Verification Status</span>
                        </Link>
                        <Link
                          to="/employer/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#64748B]" />
                          <span>Employer Settings</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#3B9EE8]" />
                          <span>Account &amp; Security</span>
                        </Link>
                      </>
                    ) : (
                      <>
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
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] transition-colors"
                        >
                          <Settings className="w-4 h-4 text-[#64748B]" />
                          <span>Account Settings</span>
                        </Link>
                      </>
                    )}
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

      {/* Floating CANE AI Assistant reserved strictly for authenticated Job Seekers */}
      {user?.role === 'seeker' && !location.pathname.startsWith('/cane') && (
        <CaneFloatingWidget />
      )}
    </div>
  );
};
