import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Mail,
  Send,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

export const ForgotPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setError('');
    setSentMessage('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleaned })
      });

      if (!res.ok) {
        const msg =
          res.error || 'Could not process your password reset request right now. Please try again.';
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg =
        (res.data as any)?.message ||
        'If an account exists with this email address, you will receive password reset instructions shortly.';
      setSentMessage(msg);
      toast.info('Check your inbox for password reset instructions.');
    } catch {
      const msg = 'Network connection failed. Please check your connection and try again.';
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
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#334155] dark:text-[#F1F5F9] font-display tracking-tight">
                Forgot Your Password?
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
                Enter your registered SETU email address and we&apos;ll send you a secure, single-use link to reset your password.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-rose-700 dark:text-[#F87171] text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {sentMessage ? (
            <div
              role="status"
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-emerald-800 dark:text-[#34D399] space-y-2.5"
            >
              <div className="flex items-start gap-2.5 text-xs leading-relaxed font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{sentMessage}</span>
              </div>
              <p className="text-[11px] opacity-90 pl-6">
                Reset links expire in 15 minutes for security. Remember to check your spam folder if you don&apos;t see it soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:border-[#60B6F8] outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Official Google Account Recovery Help */}
          <div className="p-3.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A5F] dark:text-[#F1F5F9]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B9EE8] dark:text-[#60A5FA]" />
              <span>Signed up with Google?</span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Google manages passwords for Google-linked logins directly.{' '}
              <a
                href="https://accounts.google.com/signin/recovery"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-[#2589D6] dark:text-[#60A5FA] hover:underline"
              >
                <span>Forgot your Google account password?</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="pt-3 border-t border-[#EAF7FF] dark:border-[#334155] flex items-center justify-between text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#3B9EE8] dark:text-[#60A5FA] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
            <Link
              to="/otp-login"
              className="font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E3A5F] dark:hover:text-[#F1F5F9]"
            >
              Try Email OTP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
