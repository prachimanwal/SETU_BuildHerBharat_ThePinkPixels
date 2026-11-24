import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { PasswordStrengthChecklist } from '../components/PasswordStrengthChecklist';
import { evaluatePasswordStrength } from '../utils/passwordStrength';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strength = evaluatePasswordStrength(password);
  const passwordsMatch = Boolean(password && password === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing from the URL. Please request a new reset link.');
      return;
    }

    if (!strength.allMet) {
      setError('Please choose a strong password meeting all security requirements listed below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      });

      if (!res.ok) {
        const msg =
          res.error ||
          'This password reset link is invalid or has expired. Please request a new reset link.';
        setError(msg);
        toast.error(msg);
        return;
      }

      setDone(true);
      toast.success('Your password has been reset! Please sign in with your new password.');
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch {
      const msg = 'Network error while updating password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCFF] dark:bg-[#0B1120] flex flex-col justify-center items-center p-4 sm:p-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#EAF7FF] dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155]">
              <img src="/setu-logo.png" alt="SETU" className="h-8 w-auto object-contain" />
            </div>
            <span className="text-2xl font-extrabold text-[#334155] dark:text-[#F1F5F9] font-display">
              SETU
            </span>
          </Link>
        </div>

        <div className="bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] rounded-3xl p-6 sm:p-8 shadow-baby space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EAF7FF] dark:bg-[#263449] border border-[#BDE0FE] dark:border-[#334155] flex items-center justify-center shrink-0 text-[#2589D6] dark:text-[#60A5FA]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#334155] dark:text-[#F1F5F9] font-display tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Create a strong new password for your SETU account.
              </p>
            </div>
          </div>

          {!token ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/35 text-amber-900 dark:text-[#FBBF24] space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This reset link appears incomplete or expired. Please request a fresh password reset email.
                </span>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : done ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-emerald-800 dark:text-[#34D399] space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
              <p>Redirecting you to Sign In...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-rose-700 dark:text-[#F87171] text-xs space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="inline-block pl-6 font-bold underline hover:opacity-80"
                  >
                    Request a new reset link
                  </Link>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8]"
                    aria-label={showPass ? 'Hide new password' : 'Show new password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <PasswordStrengthChecklist password={password} />

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8]"
                    aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      passwordsMatch
                        ? 'text-emerald-600 dark:text-[#34D399]'
                        : 'text-rose-600 dark:text-[#F87171]'
                    }`}
                  >
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-[#EAF7FF] dark:border-[#334155] text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#3B9EE8] dark:text-[#60A5FA] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
