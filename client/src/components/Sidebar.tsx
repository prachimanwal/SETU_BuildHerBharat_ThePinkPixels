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
    { label: 'Build Her', path: '/build-her', icon: Sparkles, badge: 'Sanctuary', badgeColor: 'bg-pink-100 text-pink-700' },
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: 20% on Desktop (lg:w-64 xl:w-72) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 xl:w-72 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Official Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-stone-100">
          <NavLink to={user?.role === 'employer' ? '/employer' : user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <img
              src="/setu-logo.png"
              alt="SETU – Connect • Empower • Grow"
              className="h-11 w-auto max-w-[190px] object-contain"
            />
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (9 ordered items for seeker) */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {user?.role === 'employer' ? 'Employer Desk' : user?.role === 'admin' ? 'Administration' : 'Menu'}
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
                    ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-orange-600' : 'text-stone-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-stone-100 text-stone-600'
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
        <div className="p-4 border-t border-stone-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
