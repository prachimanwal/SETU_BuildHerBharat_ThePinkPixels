import React, { useEffect, useState } from 'react';
import { Bell, Lock, Eye, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, unwrapData } from '../../utils/api';

export const EmployerSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isPublicProfileVisible, setIsPublicProfileVisible] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({
    newApplications: true,
    candidateResponses: true,
    interviewReminders: true,
    verificationUpdates: true,
    jobExpirationReminders: true,
    offerResponses: true
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const [compRes, notifRes] = await Promise.all([
      apiFetch('/api/employer/company'),
      apiFetch('/api/employer/notifications')
    ]);
    if (compRes.ok && compRes.data) {
      const c = unwrapData(compRes.data)?.company;
      if (c) {
        setIsPublicProfileVisible(c.isPublicProfileVisible !== false);
        if (c.notificationPreferences) setNotifPrefs(c.notificationPreferences);
      }
    }
    if (notifRes.ok && notifRes.data) {
      const nd = unwrapData(notifRes.data);
      setNotifications(Array.isArray(nd?.notifications) ? nd.notifications : []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    const res = await apiFetch('/api/employer/settings', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        isPublicProfileVisible,
        notificationPreferences: notifPrefs,
        ...(newPassword ? { currentPassword, newPassword } : {})
      })
    });
    setSaving(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Could not update settings.' });
    } else {
      setCurrentPassword('');
      setNewPassword('');
      await refreshUser();
      setNotice({ type: 'success', text: 'Employer settings updated successfully!' });
    }
  };

  const markAllRead = async () => {
    await apiFetch('/api/employer/notifications/read-all', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm">
        <h1 className="text-xl font-bold text-[#1E3A5F]">Employer Account & Notification Settings</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Manage your account credentials, public company visibility, and recruitment alert preferences.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#3B9EE8]" /> Account & Public Visibility
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Account Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Registered Login Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 rounded-xl border border-[#EAF7FF] bg-slate-50 text-sm text-[#64748B]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs text-[#1E3A5F]">
            <input
              type="checkbox"
              checked={isPublicProfileVisible}
              onChange={(e) => setIsPublicProfileVisible(e.target.checked)}
            />
            <span>
              Allow job seekers to view our approved public company profile (verification documents always stay private)
            </span>
          </label>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-3">
          <h2 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#3B9EE8]" /> Recruitment Notification Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#334155]">
            {([
              ['newApplications', 'New candidate applications'],
              ['candidateResponses', 'Candidate responses & withdrawals'],
              ['interviewReminders', 'Upcoming interviews & cancellations'],
              ['verificationUpdates', 'Company verification status updates'],
              ['jobExpirationReminders', 'Job posting expiration reminders'],
              ['offerResponses', 'Offer status updates']
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 p-3 rounded-2xl bg-[#F8FCFF] border border-[#EAF7FF]">
                <input
                  type="checkbox"
                  checked={notifPrefs[key]}
                  onChange={(e) => setNotifPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <h2 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#3B9EE8]" /> Change Password (Optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password (min 6 chars)"
              className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-bold shadow-xs"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Notification History */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1E3A5F]">Recent Notifications ({notifications.length})</h2>
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2589D6] hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-xs text-[#64748B] text-center py-6">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 15).map((n) => (
              <div
                key={n._id}
                className={`p-3.5 rounded-2xl border text-xs ${
                  n.isRead
                    ? 'bg-[#F8FCFF] border-[#EAF7FF] text-[#64748B]'
                    : 'bg-[#EAF7FF]/60 border-[#BDE0FE] text-[#1E3A5F]'
                }`}
              >
                <p className="font-bold">{n.title}</p>
                <p className="mt-0.5">{n.message}</p>
                <p className="text-[10px] text-[#94A3B8] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
