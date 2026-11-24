import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { apiFetch, unwrapData } from '../utils/api';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_RECOVERY_URL = 'https://accounts.google.com/signin/recovery';

export const LoginPage: React.FC = () => {
  const { login, loginWithSession, sessionNotice, clearSessionNotice } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  const displayedError = error || sessionNotice;

  const redirectByRole = (userObj?: any) => {
    const role = userObj?.role;
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'employer') {
      navigate('/employer');
    } else {
      const needsOnboarding =
        !userObj?.seekerProfile?.onboardingCompleted &&
        !userObj?.seekerProfile?.onboardingSkipped &&
        (userObj?.profileCompletion ?? 0) < 40;
      navigate(needsOnboarding ? '/onboarding' : '/dashboard');
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const handleCredentialResponse = async (response: { credential?: string }) => {
      if (!response?.credential) return;
      setGoogleLoading(true);
      setError('');
      clearSessionNotice();
      try {
        const res = await apiFetch('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential: response.credential, rememberMe })
        });
        if (!res.ok) {
          const msg = res.error || 'Google Sign-In could not be completed.';
          setError(msg);
          toast.error(msg);
          return;
        }
        const payload = unwrapData(res.data) || {};
        if (payload.user) {
          loginWithSession(payload.user, payload.token);
          toast.success(`Welcome back, ${payload.user.name || 'SETU Member'}!`);
          redirectByRole(payload.user);
        }
      } catch {
        toast.error('Network error while verifying Google sign-in.');
      } finally {
        setGoogleLoading(false);
      }
    };

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 340,
        text: 'continue_with',
        shape: 'pill'
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);
  }, [googleClientId, rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    clearSessionNotice();
    setLoading(true);

    const res = await login(cleanedEmail, password, rememberMe);
    setLoading(false);

    if (res.success) {
      toast.success(`Welcome back, ${res.user?.name || 'SETU Member'}!`);
      redirectByRole(res.user);
    } else {
      const msg = res.error || 'Invalid email or password. Please try again.';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCFF] dark:bg-[#0B1120] flex relative">
      {/* Top-Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggleButton />
      </div>

      {/* DESKTOP LEFT COLUMN: Cheerful Baby-Blue / Dark Navy Welcome Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#EAF7FF] via-[#D6EEFF] to-[#BDE0FE]/70 border-r border-[#D8ECFA] dark:border-[#334155] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-white/50 dark:bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#A2D2FF]/45 dark:bg-[#F472B6]/10 rounded-full blur-3xl pointer-events-none animate-float-gentle" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="p-2 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] shadow-baby-sm">
              <img src="/setu-logo.png" alt="SETU" className="h-8 w-auto object-contain" />
            </div>
            <span className="text-2xl font-extrabold text-[#334155] dark:text-[#F1F5F9] font-display tracking-tight">
              SETU
              <span className="inline-block w-2 h-2 rounded-full bg-[#3B9EE8] dark:bg-[#60A5FA] ml-1.5" />
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] text-xs font-semibold text-[#1E3A5F] dark:text-[#F1F5F9] shadow-baby-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8] dark:text-[#60A5FA]" />
            <span>Welcome Back</span>
          </div>

          <h1 className="text-4xl font-extrabold text-[#334155] dark:text-[#F1F5F9] tracking-tight font-display leading-tight">
            Small progress today, big achievements tomorrow!
          </h1>

          <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Sign in with your password or one-time email verification code to access your career profile, skill assessments, job matches, and CANE AI Career Companion.
          </p>

          <div className="p-5 rounded-3xl bg-white/85 dark:bg-[#1E293B]/90 backdrop-blur-xs border border-[#D8ECFA] dark:border-[#334155] shadow-baby-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#334155] dark:text-[#F1F5F9]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-[#34D399]" />
              <span>Protected Multi-Factor Sign-In</span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Supports password sign-in, single-use Email OTP codes, and encrypted password recovery with device session controls.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p>© 2026 SETU Platform. Bridging Skills, Opportunities &amp; Employment.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Redesigned Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 pt-16 lg:pt-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="p-1.5 rounded-2xl bg-[#EAF7FF] dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155]">
                <img src="/setu-logo.png" alt="SETU" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-xl font-extrabold text-[#334155] dark:text-[#F1F5F9] font-display">
                SETU
              </span>
            </Link>
          </div>

          <div className="bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] rounded-3xl p-6 sm:p-8 shadow-baby space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-[#334155] dark:text-[#F1F5F9] font-display tracking-tight">
                Sign In
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Access your SETU Job Seeker, Employer, or Admin dashboard
              </p>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-rose-700 dark:text-[#F87171] text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:border-[#60B6F8] outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:border-[#60B6F8] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remember Me + Forgot Password row directly below Password */}
                <div className="flex items-center justify-between gap-2 mt-2.5">
                  <label className="inline-flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#A2D2FF]"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#3B9EE8] dark:text-[#60A5FA] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Alternative Sign-In Methods */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#EAF7FF] dark:border-[#334155]" />
              <span className="shrink-0 mx-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Or continue with
              </span>
              <div className="flex-grow border-t border-[#EAF7FF] dark:border-[#334155]" />
            </div>

            <div className="space-y-2.5">
              <Link
                to="/otp-login"
                className="w-full py-3 px-4 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] bg-[#F8FCFF] dark:bg-[#263449] hover:bg-[#EAF7FF] dark:hover:bg-[#334155] text-[#1E3A5F] dark:text-[#F1F5F9] font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Mail className="w-4 h-4 text-[#3B9EE8] dark:text-[#60A5FA]" />
                <span>Sign In with Email OTP</span>
              </Link>

              {googleClientId ? (
                <div className="space-y-1.5">
                  <div
                    ref={googleBtnRef}
                    className={`w-full flex justify-center min-h-[42px] ${
                      googleLoading ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  />
                </div>
              ) : null}

              <div className="text-center pt-0.5">
                <a
                  href={GOOGLE_RECOVERY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#2589D6] dark:hover:text-[#60A5FA] hover:underline"
                >
                  <span>Forgot your Google account password?</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] pt-3 border-t border-[#EAF7FF] dark:border-[#334155]">
              Don&apos;t have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[#3B9EE8] dark:text-[#60A5FA] hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
