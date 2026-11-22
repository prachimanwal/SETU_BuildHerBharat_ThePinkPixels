import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearSessionNotice();
    setLoading(true);

    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      redirectByRole(res.user);
    } else {
      setError(res.error || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCFF] flex">
      {/* DESKTOP LEFT COLUMN: Cheerful Baby-Blue Welcome Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#EAF7FF] via-[#D6EEFF] to-[#BDE0FE]/70 border-r border-[#D8ECFA] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-white/50 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#A2D2FF]/45 rounded-full blur-3xl pointer-events-none animate-float-gentle" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="p-2 rounded-2xl bg-white border border-[#D8ECFA] shadow-baby-sm">
              <img
                src="/setu-logo.png"
                alt="SETU"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold text-[#334155] font-display tracking-tight">
              SETU
              <span className="inline-block w-2 h-2 rounded-full bg-[#3B9EE8] ml-1.5" />
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D8ECFA] text-xs font-semibold text-[#1E3A5F] shadow-baby-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#3B9EE8]" />
            <span>Welcome Back 🩵</span>
          </div>

          <h1 className="text-4xl font-extrabold text-[#334155] tracking-tight font-display leading-tight">
            Small progress today, big achievements tomorrow!
          </h1>

          <p className="text-sm text-[#475569] leading-relaxed">
            Sign in to access your career profile, personalized job recommendations, government schemes, skill assessments, and learning pathways.
          </p>

          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xs border border-[#D8ECFA] shadow-baby-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#334155]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified Career Ecosystem</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your profile stays secure and powers transparent recommendations tailored to your real skills and goals.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#64748B]">
          <p>© 2026 SETU Platform. Bridging Skills, Opportunities & Employment.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Baby-Blue Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="p-1.5 rounded-2xl bg-[#EAF7FF] border border-[#D8ECFA]">
                <img src="/setu-logo.png" alt="SETU" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-xl font-extrabold text-[#334155] font-display">SETU</span>
            </Link>
          </div>

          <div className="bg-white border border-[#D8ECFA] rounded-3xl p-6 sm:p-8 shadow-baby space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#334155] font-display tracking-tight">
                Sign In
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Enter your registered email address and password to access your SETU dashboard
              </p>
            </div>

            {/* Error Banner */}
            {displayedError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-sm text-[#334155] placeholder-[#94A3B8] focus:bg-white focus:border-[#60B6F8] focus:ring-2 focus:ring-[#BDE0FE]/60 outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#334155]">
                    Password
                  </label>
                  <span className="text-[11px] text-[#64748B]">Case-sensitive</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-sm text-[#334155] placeholder-[#94A3B8] focus:bg-white focus:border-[#60B6F8] focus:ring-2 focus:ring-[#BDE0FE]/60 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#334155] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

            <p className="text-center text-xs text-[#64748B] pt-3 border-t border-[#EAF7FF]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-bold text-[#3B9EE8] hover:text-[#2589D6] underline-offset-2 hover:underline"
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
