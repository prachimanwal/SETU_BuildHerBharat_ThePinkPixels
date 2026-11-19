import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('employer') || email.includes('pending')) navigate('/employer');
      else navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    // Google Sign-In flow: Connects to /api/auth/google
    const res = await loginWithGoogle({
      email: email && email.includes('@') ? email : 'priya.sharma.google@setu.demo',
      name: 'Priya Sharma (Google)',
      role: 'seeker'
    });
    setGoogleLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Google sign-in failed');
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Official SETU Logo */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <img
              src="/setu-logo.png"
              alt="SETU – Connect • Empower • Grow"
              className="h-14 w-auto object-contain drop-shadow-xs"
            />
          </Link>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-stone-900">
          Welcome Back
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          Sign in to your account to continue your journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-sm border border-stone-200/80 space-y-5">
          {/* Quick Demo Fill Pills */}
          <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Quick Login (Demo)
              </span>
              <span className="text-[10px] text-stone-400">1-Click</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('seeker@setu.demo', 'SetuDemo@2026')}
                className="py-1 px-2 bg-white border border-stone-200 rounded-lg text-stone-800 hover:border-orange-400 hover:text-orange-600 transition font-medium text-center text-[11px]"
              >
                Seeker
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('employer@techcorp.demo', 'SetuDemo@2026')}
                className="py-1 px-2 bg-white border border-stone-200 rounded-lg text-stone-800 hover:border-orange-400 hover:text-orange-600 transition font-medium text-center text-[11px]"
              >
                Employer
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@setu.gov.in', 'SetuAdmin@2026')}
                className="py-1 px-2 bg-white border border-stone-200 rounded-lg text-stone-800 hover:border-orange-400 hover:text-orange-600 transition font-medium text-center text-[11px]"
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-stone-300 rounded-xl bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition shadow-xs disabled:opacity-50"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-stone-400 font-semibold tracking-wider">
                Or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Password
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link has been dispatched to your email address.');
                  }}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-stone-500 pt-2">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-orange-600 hover:text-orange-700 underline-offset-2 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
