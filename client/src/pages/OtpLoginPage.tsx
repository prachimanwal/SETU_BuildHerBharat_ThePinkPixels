import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Mail,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { apiFetch, unwrapData } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

export const OtpLoginPage: React.FC = () => {
  const { loginWithSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [expiresSecondsLeft, setExpiresSecondsLeft] = useState(300);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 'otp') return;
    const interval = window.setInterval(() => {
      setExpiresSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

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

  const requestCode = async (isResend = false) => {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setError('');
    if (isResend) setResending(true);
    else setLoading(true);

    try {
      const res = await apiFetch('/api/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email: cleaned })
      });

      if (!res.ok) {
        const msg = res.error || 'Could not send verification code right now.';
        setError(msg);
        toast.error(msg);
        return;
      }

      const payload = unwrapData(res.data) || {};
      setExpiresSecondsLeft(Number(payload.expiresInSeconds || 300));
      setCooldownSecondsLeft(Number(payload.cooldownSeconds || 60));
      setDigits(['', '', '', '', '', '']);
      setInfoMessage(
        (res.data as any)?.message ||
          'If an account is registered with this email address, a 6-digit verification code has been sent.'
      );
      setStep('otp');
      toast.info(isResend ? 'A fresh 6-digit OTP has been sent.' : 'Verification code sent to your email.');
      window.setTimeout(() => boxRefs.current[0]?.focus(), 80);
    } catch {
      const msg = 'Network error while requesting verification code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleDigitChange = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[idx] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = [...digits];
      clean
        .slice(0, 6 - idx)
        .split('')
        .forEach((ch, offset) => {
          next[idx + offset] = ch;
        });
      setDigits(next);
      const focusIdx = Math.min(5, idx + clean.length);
      boxRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (idx < 5) {
      boxRefs.current[idx + 1]?.focus();
    }
  };

  const handleBoxKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      boxRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      boxRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      boxRefs.current[idx + 1]?.focus();
    }
  };

  const handleBoxPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, idx) => {
      next[idx] = ch;
    });
    setDigits(next);
    const focusIdx = Math.min(5, pasted.length - 1);
    boxRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    if (expiresSecondsLeft <= 0) {
      setError('This verification code has expired. Please request a new code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
          rememberMe
        })
      });

      if (!res.ok) {
        const msg = res.error || 'Verification failed. Please check your code and try again.';
        setError(msg);
        toast.error(msg);
        return;
      }

      const payload = unwrapData(res.data) || {};
      if (payload.user) {
        loginWithSession(payload.user, payload.token);
        toast.success(`Welcome back, ${payload.user.name || 'SETU Member'}!`);
        redirectByRole(payload.user);
      } else {
        toast.error('Unexpected server response. Please sign in again.');
      }
    } catch {
      const msg = 'Network error during OTP verification. Please try again.';
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#334155] dark:text-[#F1F5F9] font-display tracking-tight">
                Sign In with Email OTP
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                {step === 'email'
                  ? 'Receive a secure 6-digit verification code on your registered SETU email.'
                  : `Enter the 6-digit code sent to ${email.trim().toLowerCase()}`}
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

          {step === 'email' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestCode(false);
              }}
              className="space-y-4"
            >
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
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155] text-sm text-[#334155] dark:text-[#F1F5F9] outline-none"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#A2D2FF]"
                />
                <span>Keep me signed in for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {infoMessage && (
                <div className="p-3 rounded-2xl bg-[#EAF7FF] dark:bg-[#263449] border border-[#BDE0FE] dark:border-[#334155] text-[11px] text-[#1E3A5F] dark:text-[#F1F5F9] leading-relaxed">
                  {infoMessage}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#334155] dark:text-[#F1F5F9]">
                    6-Digit Verification Code
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      expiresSecondsLeft > 30
                        ? 'text-[#2589D6] dark:text-[#60A5FA]'
                        : 'text-rose-600 dark:text-[#F87171]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{expiresSecondsLeft > 0 ? formatTimer(expiresSecondsLeft) : 'Expired'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        boxRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleBoxKeyDown(idx, e)}
                      onPaste={handleBoxPaste}
                      aria-label={`Verification code digit ${idx + 1}`}
                      className="h-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold rounded-2xl border border-[#D8ECFA] dark:border-[#334155] bg-[#F8FCFF] dark:bg-[#263449] text-[#1E3A5F] dark:text-[#F1F5F9] focus:border-[#3B9EE8] dark:focus:border-[#60A5FA] outline-none transition"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || digits.join('').length < 6 || expiresSecondsLeft <= 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError('');
                    setDigits(['', '', '', '', '', '']);
                  }}
                  className="font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E3A5F] dark:hover:text-[#F1F5F9] underline-offset-2 hover:underline"
                >
                  Change email address
                </button>

                <button
                  type="button"
                  disabled={cooldownSecondsLeft > 0 || resending}
                  onClick={() => void requestCode(true)}
                  className="inline-flex items-center gap-1 font-bold text-[#2589D6] dark:text-[#60A5FA] disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {cooldownSecondsLeft > 0 ? `Resend in ${cooldownSecondsLeft}s` : 'Resend OTP'}
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-3 border-t border-[#EAF7FF] dark:border-[#334155] flex items-center justify-between text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#3B9EE8] dark:text-[#60A5FA] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
            <Link
              to="/register"
              className="font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E3A5F] dark:hover:text-[#F1F5F9]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
