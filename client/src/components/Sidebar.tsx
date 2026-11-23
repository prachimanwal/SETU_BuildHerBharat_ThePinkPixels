import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Landmark,
  Sparkles,
  Award,
  BookOpen,
  FolderGit2,
  FileText,
  TrendingUp,
  LogOut,
  Building2,
  ShieldCheck,
  UserCheck,
  X,
  LayoutDashboard,
  Users,
  ClipboardList,
  SlidersHorizontal,
  CalendarClock,
  BarChart3,
  Bot,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  // Preserved intact for Job Seeker accounts
  const seekerNavItems: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'My Profile', path: '/profile', icon: UserCheck },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Government Schemes', path: '/schemes', icon: Landmark },
    { label: 'Build Her', path: '/build-her', icon: Sparkles },
    { label: 'Assessments', path: '/assess', icon: Award },
    { label: 'Learn & Practice', path: '/learn', icon: BookOpen },
    { label: 'Portfolio', path: '/portfolio', icon: FolderGit2 },
    { label: 'Applications', path: '/applications', icon: FileText },
    { label: 'My Progress', path: '/progress', icon: TrendingUp }
  ];

  // Dedicated 11-section Employer Recruitment Platform sidebar (employer role ONLY)
  const employerNavItems: NavItem[] = [
    { label: 'Employer Dashboard', path: '/employer', icon: LayoutDashboard },
    { label: 'Company Profile', path: '/employer/company-profile', icon: Building2 },
    { label: 'Company Verification', path: '/employer/verification', icon: ShieldCheck },
    { label: 'Job Management', path: '/employer/jobs', icon: Briefcase },
    { label: 'Candidate Search', path: '/employer/candidates', icon: Users },
    { label: 'Applications', path: '/employer/applications', icon: ClipboardList },
    { label: 'Hiring Preferences', path: '/employer/hiring-preferences', icon: SlidersHorizontal },
    { label: 'Interview Management', path: '/employer/interviews', icon: CalendarClock },
    { label: 'Recruitment Analytics', path: '/employer/analytics', icon: BarChart3 },
    { label: 'CANE AI Recruiter', path: '/employer/cane', icon: Bot, badge: 'AI' },
    { label: 'Settings', path: '/employer/settings', icon: Settings }
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Admin Console', path: '/admin', icon: ShieldCheck },
    { label: 'Explore Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Government Schemes', path: '/schemes', icon: Landmark },
    { label: 'Build Her Network', path: '/build-her', icon: Sparkles },
    { label: 'Assessments', path: '/assess', icon: Award }
  ];

  const navItems =
    user?.role === 'employer'
      ? employerNavItems
      : user?.role === 'admin'
      ? adminNavItems
      : seekerNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Baby-Blue Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 xl:w-72 bg-white border-r border-[#D8ECFA] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-baby-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Official Logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#EAF7FF]">
          <NavLink
            to={
              user?.role === 'employer'
                ? '/employer'
                : user?.role === 'admin'
                ? '/admin'
                : '/dashboard'
            }
            className="flex items-center gap-3"
          >
            <div className="p-1.5 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA]">
              <img
                src="/setu-logo.png"
                alt="SETU"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-[#334155] font-display tracking-tight flex items-center gap-1.5">
                SETU
                <span className="w-2 h-2 rounded-full bg-[#A2D2FF]"></span>
              </span>
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                {user?.role === 'employer'
                  ? 'Employer Portal'
                  : user?.role === 'admin'
                  ? 'Admin Portal'
                  : 'Career Workspace'}
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {user?.role === 'employer'
              ? 'Recruitment Platform'
              : user?.role === 'admin'
              ? 'Administration'
              : 'Main Navigation'}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EAF7FF] text-[#1E3A5F] font-semibold border border-[#BDE0FE] shadow-baby-sm'
                    : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FCFF]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-[#3B9EE8]' : 'text-[#94A3B8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section: Sign Out */}
        <div className="p-4 border-t border-[#EAF7FF]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
