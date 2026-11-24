import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LogOut,
  MailCheck,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { useAuth, NotificationPreferences } from '../context/AuthContext';
import { ThemePreference, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, unwrapData } from '../utils/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { PasswordStrengthChecklist } from '../components/PasswordStrengthChecklist';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

const GOOGLE_RECOVERY_URL = 'https://accounts.google.com/signin/recovery';

interface SecurityActivityItem {
  action: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export const AccountSecuritySettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [securityActivity, setSecurityActivity] = useState<SecurityActivityItem[]>([]);
  const [googleLinked, setGoogleLinked] = useState(Boolean(user?.googleLinked));
  const [activeLastLogin, setActiveLastLogin] = useState<string>(user?.lastLogin || '');

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    jobApplicationUpdates: user?.notificationPreferences?.jobApplicationUpdates ?? true,
    interviewNotifications: user?.notificationPreferences?.interviewNotifications ?? true,
    learningReminders: user?.notificationPreferences?.learningReminders ?? true,
    accountSecurityAlerts: user?.notificationPreferences?.accountSecurityAlerts ?? true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Email verification
  const [sendingVerify, setSendingVerify] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Sign out all devices modal
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const loadSecurityOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await apiFetch('/api/auth/security');
      if (res.ok && res.data) {
        const data = unwrapData(res.data) || {};
        setGoogleLinked(Boolean(data.googleLinked));
        setActiveLastLogin(data.activeSession?.lastLogin || user?.lastLogin || '');
        if (Array.isArray(data.securityActivity)) {
          setSecurityActivity(data.securityActivity);
        }
        if (data.notificationPreferences) {
          setNotifPrefs(data.notificationPreferences);
        }
      }
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    void loadSecurityOverview();
  }, [user?.id]);

  const handleSelectTheme = async (pref: ThemePreference) => {
    await setThemePreference(pref);
    const label = pref === 'system' ? 'System Default' : pref === 'dark' ? 'Dark Mode' : 'Light Mode';
    toast.success(`Appearance updated to ${label}.`);
  };

  const handleToggleNotifPref = async (key: keyof NotificationPreferences) => {
    const nextPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(nextPrefs);
    setSavingPrefs(true);
    try {
      const res = await apiFetch('/api/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify({ notificationPreferences: nextPrefs })
      });
      if (!res.ok) {
        setNotifPrefs(notifPrefs);
        toast.error(res.error || 'Could not save notification preferences.');
        return;
      }
      toast.success('Notification preferences saved.');
      void refreshUser();
    } catch {
      setNotifPrefs(notifPrefs);
      toast.error('Network error while saving preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setSendingVerify(true);
    try {
      const res = await apiFetch('/api/auth/verify-email/request', { method: 'POST' });
      if (!res.ok) {
        toast.error(res.error || 'Could not send verification email right now.');
        return;
      }
      toast.success(
        (res.data as any)?.message || 'Verification link sent to your email address.'
      );
    } catch {
      toast.error('Network error while sending verification email.');
    } finally {
      setSendingVerify(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const strength = evaluatePasswordStrength(newPassword);
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!strength.allMet) {
      setPasswordError('New password must meet all strength requirements listed below.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      if (!res.ok) {
        const msg = res.error || 'Unable to change password.';
        setPasswordError(msg);
        toast.error(msg);
        return;
      }

      const payload = unwrapData(res.data);
      if (payload?.token) {
        localStorage.setItem('setu_auth_token', payload.token);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully. Other sessions have been signed out.');
      void loadSecurityOverview();
    } catch {
      setPasswordError('Network error while updating password.');
      toast.error('Network error while updating password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setSigningOutAll(true);
    try {
      const res = await apiFetch('/api/auth/sign-out-all', { method: 'POST' });
      if (!res.ok) {
        toast.error(res.error || 'Could not revoke sessions right now.');
        setSigningOutAll(false);
        return;
      }
      setConfirmSignOutAll(false);
      await logout();
      toast.info('Signed out from all devices. Please sign in again.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Network error while signing out sessions.');
      setSigningOutAll(false);
    }
  };

  const themeCards: Array<{
    id: ThemePreference;
    title: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'light',
      title: 'Light Mode',
      subtitle: 'Crisp baby-blue & white daylight palette',
      icon: Sun
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      subtitle: 'Comfortable low-glare deep navy workspace',
      icon: Moon
    },
    {
      id: 'system',
      title: 'System Default',
      subtitle: 'Automatically follows your device setting',
      icon: Monitor
    }
  ];

  const notifItems: Array<{
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }> = [
    {
      key: 'jobApplicationUpdates',
      label: 'Job Application Updates',
      description: 'Receive alerts when employers review, shortlist, or update your applications.'
    },
    {
      key: 'interviewNotifications',
      label: 'Interview Notifications',
      description: 'Get timely reminders for scheduled interviews and joining links.'
    },
    {
      key: 'learningReminders',
      label: 'Learning & Skill Reminders',
      description: 'Stay notified on new assessments, modules, and progress milestones.'
    },
    {
      key: 'accountSecurityAlerts',
      label: 'Account Security Alerts',
      description: 'Important notices about password resets, OTP logins, and new device sign-ins.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/50 rounded-3xl border border-[#BDE0FE] dark:border-[#334155] p-6 sm:p-7 shadow-baby-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2589D6] dark:text-[#60A5FA] bg-white dark:bg-[#263449] px-3 py-1 rounded-full border border-[#BDE0FE] dark:border-[#334155]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Preferences &amp; Security</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#334155] dark:text-[#F1F5F9] font-display">
              Account &amp; Security Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              Manage your SETU appearance theme, verified credentials, session security, and notification preferences.
            </p>
          </div>
        </div>
      </section>

      {/* 1. APPEARANCE */}
      <section className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Sun className="w-5 h-5 text-[#3B9EE8] dark:text-[#60A5FA]" />
          <div>
            <h2 className="text-base font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">Appearance</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Saved across your browser and synced to your SETU account across sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeCards.map((opt) => {
            const Icon = opt.icon;
            const selected = themePreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => void handleSelectTheme(opt.id)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2.5 ${
                  selected
                    ? 'bg-[#EAF7FF] dark:bg-[#263449] border-[#3B9EE8] dark:border-[#60A5FA] ring-2 ring-[#3B9EE8]/25'
                    : 'bg-[#F8FCFF] dark:bg-[#0B1120]/40 border-[#D8ECFA] dark:border-[#334155] hover:border-[#A2D2FF]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] text-[#2589D6] dark:text-[#60A5FA]">
                    <Icon className="w-4 h-4" />
                  </div>
                  {selected && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#3B9EE8] text-white">
                      Active
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">{opt.title}</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                    {opt.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. ACCOUNT INFORMATION */}
      <section className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-5 h-5 text-[#3B9EE8] dark:text-[#60A5FA]" />
          <h2 className="text-base font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
            Account Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155]">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Full Name</p>
            <p className="text-sm font-bold text-[#334155] dark:text-[#F1F5F9] mt-0.5 truncate">
              {user?.name || 'SETU Member'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155]">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Registered Email
            </p>
            <p className="text-sm font-bold text-[#334155] dark:text-[#F1F5F9] mt-0.5 truncate">
              {user?.email}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155]">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Email Verification Status
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-[#34D399]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  type="button"
                  disabled={sendingVerify}
                  onClick={() => void handleSendVerificationEmail()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2589D6] dark:text-[#60A5FA] hover:underline disabled:opacity-50"
                >
                  <MailCheck className="w-3.5 h-3.5" />
                  <span>{sendingVerify ? 'Sending...' : 'Verify Email'}</span>
                </button>
              )}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155]">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Account Role
            </p>
            <p className="text-sm font-bold text-[#334155] dark:text-[#F1F5F9] mt-0.5 capitalize">
              {user?.role === 'seeker' ? 'Job Seeker' : user?.role || 'Member'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. SECURITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Change SETU Password */}
        <section className="lg:col-span-7 bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#3B9EE8] dark:text-[#60A5FA]" />
            <div>
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
                Change SETU Password
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Reauthentication with your current password is required. Changing your password signs out all other devices.
              </p>
            </div>
          </div>

          {passwordError && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-rose-700 dark:text-[#F87171] text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  aria-label="Toggle new password visibility"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && <PasswordStrengthChecklist password={newPassword} />}

            <div>
              <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] font-bold text-xs shadow-baby-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </section>

        {/* Right: Google Account, Active Sessions & Recent Security Activity */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-4">
            <h2 className="text-base font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
              Sessions &amp; Linked Accounts
            </h2>

            <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#334155] dark:text-[#F1F5F9]">
                  Google Account Link
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    googleLinked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-[#64748B] border-[#D8ECFA]'
                  }`}
                >
                  {googleLinked ? 'Linked' : 'Not Linked'}
                </span>
              </div>
              <a
                href={GOOGLE_RECOVERY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2589D6] dark:text-[#60A5FA] hover:underline"
              >
                <span>Forgot your Google account password?</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#334155] dark:text-[#F1F5F9]">
                    Active Sessions
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Last sign-in:{' '}
                    {activeLastLogin
                      ? new Date(activeLastLogin).toLocaleString('en-IN')
                      : 'Current session'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Now
                </span>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSignOutAll(true)}
                className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 dark:border-rose-500/35 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-[#F87171] hover:bg-rose-100 dark:hover:bg-rose-500/25 font-bold text-xs inline-flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out From All Devices</span>
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#3B9EE8] dark:text-[#60A5FA]" />
              <h2 className="text-sm font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
                Recent Security Activity
              </h2>
            </div>

            {loadingOverview ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 rounded-xl skeleton-baby" />
                ))}
              </div>
            ) : securityActivity.length === 0 ? (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                No recent security events recorded yet. Future logins, OTP verifications, and password changes will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-[#EAF7FF] dark:divide-[#334155] max-h-60 overflow-y-auto">
                {securityActivity.slice(0, 8).map((ev, idx) => (
                  <li key={idx} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#334155] dark:text-[#F1F5F9]">
                        {ev.action}
                      </p>
                      {ev.ipAddress && (
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                          IP: {ev.ipAddress}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] shrink-0">
                      {new Date(ev.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* 4. NOTIFICATION PREFERENCES */}
      <section className="bg-white dark:bg-[#1E293B] rounded-3xl border border-[#D8ECFA] dark:border-[#334155] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#3B9EE8] dark:text-[#60A5FA]" />
            <div>
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
                Notification Preferences
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Choose which career and security alerts SETU should send you.
              </p>
            </div>
          </div>
          {savingPrefs && (
            <span className="text-[11px] font-semibold text-[#2589D6] dark:text-[#60A5FA]">
              Saving...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notifItems.map((item) => {
            const enabled = notifPrefs[item.key];
            return (
              <div
                key={item.key}
                className="p-4 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-[#334155] dark:text-[#F1F5F9]">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={item.label}
                  onClick={() => void handleToggleNotifPref(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    enabled ? 'bg-[#3B9EE8] dark:bg-[#60A5FA]' : 'bg-slate-300 dark:bg-[#334155]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmModal
        open={confirmSignOutAll}
        title="Sign Out From All Devices?"
        description="This will immediately invalidate all active SETU sessions across every browser and device. You will need to sign in again."
        confirmLabel="Sign Out Everywhere"
        variant="danger"
        iconType="warning"
        loading={signingOutAll}
        onConfirm={() => void handleSignOutAllDevices()}
        onCancel={() => {
          if (!signingOutAll) setConfirmSignOutAll(false);
        }}
      />
    </div>
  );
};
