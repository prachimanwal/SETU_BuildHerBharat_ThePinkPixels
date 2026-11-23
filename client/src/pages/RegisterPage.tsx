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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Too Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-400', 'bg-amber-400', 'bg-[#60B6F8]', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (name.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }

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
      setSuccessMsg('Account created successfully! Taking you to your career profile...');
      if (res.user?.role === 'employer' || role === 'employer') {
        navigate('/employer/onboarding');
      } else {
        navigate('/onboarding');
      }
    } else {
      setError(res.error || 'Registration was unsuccessful. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FCFF] flex">
      {/* DESKTOP LEFT COLUMN: Cheerful Baby-Blue Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#EAF7FF] via-[#D6EEFF] to-[#BDE0FE]/70 border-r border-[#D8ECFA] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-white/50 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#A2D2FF]/45 rounded-full blur-3xl pointer-events-none animate-float-gentle" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="p-2 rounded-2xl bg-white border border-[#D8ECFA] shadow-baby-sm">
              <img src="/setu-logo.png" alt="SETU" className="h-8 w-auto object-contain" />
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
            <span>Let's discover what you're capable of! 🩵</span>
          </div>

          <h1 className="text-4xl font-extrabold text-[#334155] tracking-tight font-display leading-tight">
            Start your journey toward verified skills and credible employment.
          </h1>

          <p className="text-sm text-[#475569] leading-relaxed">
            Create your SETU account, build your personalized career profile, and unlock opportunities tailored to your strengths.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-[#334155] font-medium">
              <div className="w-6 h-6 rounded-full bg-white border border-[#D8ECFA] flex items-center justify-center text-[#3B9EE8] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Guided 7-step career profile tailored to your education & skills</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#334155] font-medium">
              <div className="w-6 h-6 rounded-full bg-white border border-[#D8ECFA] flex items-center justify-center text-[#3B9EE8] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Personalized jobs, government schemes & learning paths</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#334155] font-medium">
              <div className="w-6 h-6 rounded-full bg-white border border-[#D8ECFA] flex items-center justify-center text-[#3B9EE8] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Direct application tracking with verified employers</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#64748B]">
          <p>© 2026 SETU Platform. Bridging Skills, Opportunities & Employment.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Clean Baby-Blue Registration Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
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
                Create Account
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Choose your account type and begin your career journey
              </p>
            </div>

            {/* Account Type Selector (Seeker / Employer) */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F8FCFF] rounded-2xl border border-[#D8ECFA]">
                <button
                  type="button"
                  onClick={() => setRole('seeker')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                    role === 'seeker'
                      ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] shadow-baby-sm'
                      : 'text-[#64748B] hover:text-[#334155]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('employer')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                    role === 'employer'
                      ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] shadow-baby-sm'
                      : 'text-[#64748B] hover:text-[#334155]'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Employer</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div
                role="status"
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-sm text-[#334155] placeholder-[#94A3B8] focus:bg-white focus:border-[#60B6F8] focus:ring-2 focus:ring-[#BDE0FE]/60 outline-none transition"
                />
              </div>

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

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B]">Strength:</span>
                      <span className="font-semibold text-[#334155]">
                        {strength > 0 ? strengthLabels[strength - 1] : 'Too Weak'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full h-full transition-all ${
                            step < strength ? strengthColors[strength - 1] : 'bg-[#EAF7FF]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-sm text-[#334155] placeholder-[#94A3B8] focus:bg-white focus:border-[#60B6F8] focus:ring-2 focus:ring-[#BDE0FE]/60 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#334155] focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-sm shadow-baby-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
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

            <p className="text-center text-xs text-[#64748B] pt-3 border-t border-[#EAF7FF]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#3B9EE8] hover:text-[#2589D6] underline-offset-2 hover:underline"
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
