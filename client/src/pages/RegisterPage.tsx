import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  User,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password strength calculator
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Too Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    const res = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role
    });

    setLoading(false);

    if (res.success) {
      if (role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error || 'Registration was unsuccessful. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle({
      email: email && email.includes('@') ? email : 'new.member.google@setu.demo',
      name: name.trim() || 'New SETU Member',
      role
    });
    setGoogleLoading(false);

    if (res.success) {
      if (role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error || 'Google registration was unsuccessful. Please try again.');
    }
  };

  const fillDemoCandidate = (demoRole: 'seeker' | 'employer') => {
    setRole(demoRole);
    if (demoRole === 'seeker') {
      setName('Aarti Verma');
      setEmail('aarti.verma@example.com');
      setPassword('SetuPass@2026');
      setConfirmPassword('SetuPass@2026');
    } else {
      setName('Rajesh Khanna');
      setEmail('rajesh.khanna@innovatecorp.in');
      setPassword('SetuPass@2026');
      setConfirmPassword('SetuPass@2026');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* DESKTOP LEFT COLUMN: Inspirational Branding & Abstract Art */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0C0C0C] border-r border-[#222222] p-12 flex-col justify-between overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#FF5A1F]/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none"></div>

        {/* Brand Header */}
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

        {/* Central Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151515] border border-[#292929] text-xs font-semibold text-[#FF7847]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Employment & Skilling Ecosystem</span>
          </div>

          <h1 className="text-4xl font-extrabold text-[#F5F5F5] tracking-tight font-display leading-tight">
            Start your journey toward verified skills and credible employment.
          </h1>

          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            Join thousands of job seekers, career restarters, and verified employers across India. Demonstrate what you can do through real practical work.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-[#D4D4D4]">
              <div className="w-5 h-5 rounded-full bg-[#1C1C1C] border border-[#292929] flex items-center justify-center text-[#FF5A1F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Objective, server-verified skill tests with instant feedback</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#D4D4D4]">
              <div className="w-5 h-5 rounded-full bg-[#1C1C1C] border border-[#292929] flex items-center justify-center text-[#FF5A1F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Auto-generated portfolio from real practical assignments</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#D4D4D4]">
              <div className="w-5 h-5 rounded-full bg-[#1C1C1C] border border-[#292929] flex items-center justify-center text-[#FF5A1F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Direct application and interview scheduling with verified employers</span>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="relative z-10 text-xs text-[#737373]">
          <p>© 2026 SETU. Built for Builder Bharat 2026 — Build Her Bharat.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Dark Registration Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/setu-logo.png" alt="SETU" className="h-9 w-auto object-contain brightness-110" />
              <span className="text-xl font-bold text-[#F5F5F5] font-display">SETU</span>
            </Link>
          </div>

          <div className="bg-[#151515] border border-[#292929] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] font-display tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-[#A3A3A3] mt-1">
                Choose your account type and unlock your career pathway
              </p>
            </div>

            {/* Quick Demo Fill Buttons (Helpful for Judges/Testing) */}
            <div className="p-2.5 rounded-xl bg-[#101010] border border-[#242424] flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-[#737373] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF5A1F]" />
                Demo Fill:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemoCandidate('seeker')}
                  className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-[#D4D4D4] hover:text-[#FF5A1F] text-[11px] font-medium border border-[#292929] transition"
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCandidate('employer')}
                  className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#202020] text-[#D4D4D4] hover:text-[#FF5A1F] text-[11px] font-medium border border-[#292929] transition"
                >
                  Employer
                </button>
              </div>
            </div>

            {/* Account Type Selector (Seeker / Employer) */}
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#101010] rounded-xl border border-[#222222]">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    role === 'seeker'
                      ? 'bg-[#FF5A1F] text-white shadow-[0_2px_10px_rgba(255,90,31,0.4)]'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    role === 'employer'
                      ? 'bg-[#FF5A1F] text-white shadow-[0_2px_10px_rgba(255,90,31,0.4)]'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Employer</span>
                </button>
              </div>
            </div>

            {/* Accessible Error Banner */}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#101010] hover:bg-[#1C1C1C] border border-[#292929] hover:border-[#383838] text-xs font-semibold text-[#F5F5F5] transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Subtle Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#292929]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#151515] px-3 text-[#737373] font-bold tracking-wider">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarti Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#292929] text-sm text-[#FFFFFF] placeholder-[#777777] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition"
                />
              </div>

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

              {/* Password Field with Visibility Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

                {/* Password Strength Indicator (Task 5 requirement) */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#737373]">Strength:</span>
                      <span className="font-semibold text-[#D4D4D4]">
                        {strength > 0 ? strengthLabels[strength - 1] : 'Too Weak'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full h-full transition-all ${
                            step < strength ? strengthColors[strength - 1] : 'bg-[#222222]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field with Visibility Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#101010] border border-[#292929] text-sm text-[#FFFFFF] placeholder-[#777777] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF5A1F] hover:bg-[#FF7847] text-white font-bold rounded-xl transition text-sm shadow-[0_4px_20px_rgba(255,90,31,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-[#737373] pt-2">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#FF5A1F] hover:text-[#FF7847] underline-offset-2 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
