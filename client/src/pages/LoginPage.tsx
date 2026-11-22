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

  const redirectByRole = (role?: string) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'employer') navigate('/employer');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearSessionNotice();
    setLoading(true);

    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res.success) {
      redirectByRole(res.user?.role);
    } else {
      setError(res.error || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* DESKTOP LEFT COLUMN: Inspirational Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0C0C0C] border-r border-[#222222] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#FF5A1F]/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none"></div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/setu-logo.png"
              alt="SETU"
              className="h-10 w-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(255,90,31,0.3)]"
            />
            <span className="text-2xl font-black text-[#F5F5F5] font-display tracking-tight">
              SETU
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5A1F] ml-1"></span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151515] border border-[#292929] text-xs font-semibold text-[#FF7847]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome Back</span>
          </div>

          <h1 className="text-4xl font-extrabold text-[#F5F5F5] tracking-tight font-display leading-tight">
            Continue building your path toward meaningful employment.
          </h1>

          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            Access your verified skill assessments, practice assignments, application statuses, and interview schedules.
          </p>

          <div className="p-4 rounded-2xl bg-[#151515] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F5F5F5]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Enterprise Network</span>
            </div>
            <p className="text-xs text-[#737373]">
              All employers on SETU are reviewed and verified before their opportunities appear in public discovery.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#737373]">
          <p>© 2026 SETU Platform. Bridging Skills, Opportunities & Employment.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Dark Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/setu-logo.png" alt="SETU" className="h-9 w-auto object-contain brightness-110" />
              <span className="text-xl font-bold text-[#F5F5F5] font-display">SETU</span>
            </Link>
          </div>

          <div className="bg-[#151515] border border-[#292929] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Sign In
              </h2>
              <p className="text-xs text-[#A3A3A3] mt-1">
                Enter your registered email address and password to access your SETU dashboard
              </p>
            </div>

            {/* Error Banner */}
            {displayedError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#292929] text-sm text-[#FFFFFF] placeholder-[#777777] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3]">
                    Password
                  </label>
                  <span className="text-[11px] text-[#737373]">Case-sensitive</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#101010] border border-[#292929] text-sm text-[#FFFFFF] placeholder-[#777777] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF5A1F] hover:bg-[#FF7847] text-white font-bold rounded-xl transition text-sm shadow-[0_4px_20px_rgba(255,90,31,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

            <p className="text-center text-xs text-[#737373] pt-2 border-t border-[#242424]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#FF5A1F] hover:text-[#FF7847] underline-offset-2 hover:underline"
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
