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
  X
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

  // The 9 ordered Seeker navigation items
  const seekerNavItems: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Government Schemes', path: '/schemes', icon: Landmark },
    { label: 'Build Her', path: '/build-her', icon: Sparkles, badge: 'Sanctuary', badgeColor: 'bg-rose-950/60 text-rose-300 border border-rose-800/40' },
    { label: 'Assessments', path: '/assess', icon: Award },
    { label: 'Learn & Practice', path: '/learn', icon: BookOpen },
    { label: 'Portfolio', path: '/portfolio', icon: FolderGit2 },
    { label: 'Applications', path: '/applications', icon: FileText },
    { label: 'My Progress', path: '/progress', icon: TrendingUp },
  ];

  const employerNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/employer', icon: Building2 },
    { label: 'Explore Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Government Schemes', path: '/schemes', icon: Landmark },
    { label: 'Build Her Network', path: '/build-her', icon: Sparkles },
    { label: 'Skill Assessments', path: '/assess', icon: Award },
    { label: 'Learning Catalog', path: '/learn', icon: BookOpen },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Admin Console', path: '/admin', icon: ShieldCheck },
    { label: 'Explore Opportunities', path: '/opportunities', icon: Briefcase },
    { label: 'Government Schemes', path: '/schemes', icon: Landmark },
    { label: 'Build Her Network', path: '/build-her', icon: Sparkles },
    { label: 'Assessments', path: '/assess', icon: Award },
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
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: 20% on Desktop (lg:w-64 xl:w-72) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 xl:w-72 bg-[#101010] border-r border-[#292929] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Official Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#242424]">
          <NavLink to={user?.role === 'employer' ? '/employer' : user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <img
              src="/setu-logo.png"
              alt="SETU"
              className="h-10 w-auto object-contain brightness-110 drop-shadow-[0_0_10px_rgba(255,90,31,0.25)]"
            />
            <div className="flex flex-col">
              <span className="text-lg font-black text-[#F5F5F5] font-display tracking-tight flex items-center gap-1">
                SETU
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]"></span>
              </span>
              <span className="text-[10px] text-[#737373] uppercase font-bold tracking-wider">
                {user?.role === 'employer' ? 'Employer Portal' : user?.role === 'admin' ? 'Admin Portal' : 'Member Workspace'}
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-[#1C1C1C]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#737373]">
            {user?.role === 'employer' ? 'Employer Desk' : user?.role === 'admin' ? 'Administration' : 'Main Navigation'}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1C1C1C] text-[#F5F5F5] font-semibold border border-[#292929] shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#151515]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-[#FF5A1F]' : 'text-[#737373]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-[#1C1C1C] text-[#A3A3A3] border border-[#292929]'
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
        <div className="p-4 border-t border-[#242424]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
