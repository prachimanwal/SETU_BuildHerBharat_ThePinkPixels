import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building, ArrowRight, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Seeker specific fields
  const [headline, setHeadline] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Haryana');
  const [isRural, setIsRural] = useState(false);
  const [educationLevel, setEducationLevel] = useState('No formal degree');
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('No previous experience / Fresher');
  const [preferredWorkMode, setPreferredWorkMode] = useState<'remote' | 'hybrid' | 'onsite' | 'any'>('any');
  const [isCareerRestart, setIsCareerRestart] = useState(false);

  // Employer specific fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('1-10');
  const [docNumber, setDocNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload: any = {
      name,
      email,
      password,
      role
    };

    if (role === 'seeker') {
      payload.headline = headline;
      payload.location = { city, state, isRural };
      payload.educationLevel = educationLevel;
      payload.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      payload.experienceLevel = experienceLevel;
      payload.preferredWorkMode = preferredWorkMode;
      payload.isCareerRestart = isCareerRestart;
    } else {
      payload.companyName = companyName || name;
      payload.industry = industry || 'General Services';
      payload.companySize = companySize;
      payload.verificationDocs = {
        docType: 'GSTIN / Registration',
        docNumber: docNumber || 'PENDING_SUBMISSION',
        notes: 'Submitted during initial registration.',
        submittedAt: new Date()
      };
    }

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      if (role === 'employer') navigate('/employer');
      else navigate('/dashboard');
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-serif font-black text-2xl mb-1">
            स
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">
            {language === 'hi' ? 'सेतु पर खाता बनाएं' : 'Create your SETU Account'}
          </h2>
          <p className="text-xs text-stone-600 font-serif">
            {language === 'hi'
              ? 'बिना औपचारिक डिग्री या पूर्व अनुभव की बंदिश के शुरुआत करें'
              : 'Discover your skills, build your portfolio, and find credible work'}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('seeker')}
            className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
              role === 'seeker'
                ? 'bg-white text-orange-700 shadow-sm'
                : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === 'hi' ? 'नौकरी / हुनर चाहने वाले' : 'Job Seeker / Talent'}</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
              role === 'employer'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{language === 'hi' ? 'नियोक्ता / कंपनी' : 'Employer / Recruiter'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>

          {/* Seeker Fields */}
          {role === 'seeker' && (
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Headline / Role Objective
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Aspiring Digital Designer | Returning to Professional Work"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    City / District
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Sonipat, Gurugram, Jaipur"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Haryana"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ruralCheck"
                  checked={isRural}
                  onChange={(e) => setIsRural(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <label htmlFor="ruralCheck" className="text-xs text-stone-700 font-medium cursor-pointer">
                  I live in a rural / semi-urban area (Helps match local practical and remote opportunities)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Formal Education
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="No formal degree">No Formal Degree / Self-Taught</option>
                    <option value="10th Pass">10th Standard Pass</option>
                    <option value="12th Pass">12th Standard Pass</option>
                    <option value="ITI / Vocational Diploma">ITI / Vocational Diploma</option>
                    <option value="Graduate">Graduate (Any Stream)</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Work Experience
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="No previous experience / Fresher">No Previous Experience / Fresher</option>
                    <option value="1-2 years">1-2 Years Experience</option>
                    <option value="3+ years">3+ Years Experience</option>
                    <option value="Career break / Returning to work">Career Break / Returning to Work</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Skills & Practical Abilities (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Canva, Graphic Design, Hindi Typing, Wiring, Excel"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-stone-600 mt-1">
                  Add whatever skills you know! You can also take our short assessments to verify them.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Preferred Work Mode
                  </label>
                  <select
                    value={preferredWorkMode}
                    onChange={(e: any) => setPreferredWorkMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="any">Any (Flexible)</option>
                    <option value="remote">100% Remote / Work from Home</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site Local Work</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="restartCheck"
                      checked={isCareerRestart}
                      onChange={(e) => setIsCareerRestart(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 mt-0.5"
                    />
                    <label htmlFor="restartCheck" className="text-xs text-stone-700 font-medium cursor-pointer">
                      <span className="font-semibold text-pink-800">Build Her Initiative: </span>
                      I am a woman returning to work or seeking flexible economic independence
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employer Fields */}
          {role === 'employer' && (
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Company / Organisation Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Gramin Digital Services"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. IT, Agritech, Handicrafts"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="1-10">1-10 Employees (Micro / Startup)</option>
                    <option value="11-50">11-50 Employees (Small)</option>
                    <option value="51-200">51-200 Employees (Medium)</option>
                    <option value="200+">200+ Employees (Large)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Registration / GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. 06AAACB1234F1Z8"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Verification Notice:</strong> New employers are placed in "Pending" status until verified by SETU administrators. You can create and save draft opportunities immediately, and they can be published once your account is verified.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-lg transition text-sm shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 ${
              role === 'seeker' ? 'bg-[#E65100] hover:bg-orange-700' : 'bg-indigo-900 hover:bg-indigo-950'
            }`}
          >
            <span>{loading ? t('loading') : t('navRegister')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-stone-600">
          <span>Already registered on SETU? </span>
          <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t('navLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};
