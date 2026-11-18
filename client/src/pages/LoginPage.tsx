import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-serif font-black text-2xl mb-2">
            स
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">
            {language === 'hi' ? 'सेतु में लॉग इन करें' : 'Sign in to SETU'}
          </h2>
          <p className="text-xs text-stone-600 font-serif">
            {language === 'hi' ? 'हुनर से हक़ की कमाई तक।' : 'Bridging Skills, Opportunities & Employment'}
          </p>
        </div>

        {/* Judge Demo Quick Logins Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Judge Quick Fill</span>
            </span>
            <span className="text-[10px] text-amber-700 font-medium">1-Click Auto Fill</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount('seeker@setu.demo', 'SetuDemo@2026')}
              className="p-1.5 bg-white border border-amber-200 rounded text-left hover:bg-amber-100/60 transition"
            >
              <div className="font-semibold text-slate-800">Job Seeker</div>
              <div className="text-[10px] text-stone-600">Priya Sharma</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('employer@techcorp.demo', 'SetuDemo@2026')}
              className="p-1.5 bg-white border border-amber-200 rounded text-left hover:bg-amber-100/60 transition"
            >
              <div className="font-semibold text-slate-800">Approved Employer</div>
              <div className="text-[10px] text-stone-600">Gramin Digital</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('pending@startup.demo', 'SetuDemo@2026')}
              className="p-1.5 bg-white border border-amber-200 rounded text-left hover:bg-amber-100/60 transition"
            >
              <div className="font-semibold text-slate-800">Pending Employer</div>
              <div className="text-[10px] text-stone-600">BharatTech</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@setu.gov.in', 'SetuAdmin@2026')}
              className="p-1.5 bg-white border border-amber-200 rounded text-left hover:bg-amber-100/60 transition"
            >
              <div className="font-semibold text-slate-800">Administrator</div>
              <div className="text-[10px] text-stone-600">Platform Admin</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. seeker@setu.demo"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E65100] hover:bg-orange-700 text-white font-bold rounded-lg transition text-sm shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? t('loading') : t('navLogin')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-600">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('navRegister')}
          </Link>
        </div>
      </div>
    </div>
  );
};
