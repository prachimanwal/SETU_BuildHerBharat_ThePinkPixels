import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Award, Settings, CheckCircle, Save, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'settings'>(
    tabParam === 'skills' ? 'skills' : tabParam === 'settings' ? 'settings' : 'profile'
  );

  useEffect(() => {
    if (tabParam === 'skills' || tabParam === 'settings' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'profile' | 'skills' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const seeker = user?.seekerProfile || {};

  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(seeker.headline || '');
  const [phone, setPhone] = useState(seeker.phone || '');
  const [city, setCity] = useState(seeker.location?.city || '');
  const [state, setState] = useState(seeker.location?.state || 'Haryana');
  const [isRural, setIsRural] = useState(seeker.location?.isRural || false);
  const [educationLevel, setEducationLevel] = useState(seeker.educationLevel || 'No formal degree');
  const [languages, setLanguages] = useState((seeker.languages || ['Hindi', 'English']).join(', '));
  const [skills, setSkills] = useState((seeker.skills || []).join(', '));
  const [experienceLevel, setExperienceLevel] = useState(seeker.experienceLevel || 'No previous experience / Fresher');
  const [careerGoals, setCareerGoals] = useState(seeker.careerGoals || '');
  const [preferredWorkMode, setPreferredWorkMode] = useState<any>(seeker.preferredWorkMode || 'any');
  const [resumeUrl, setResumeUrl] = useState(seeker.resumeUrl || '');
  const [isCareerRestart, setIsCareerRestart] = useState(seeker.isCareerRestart || false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      name,
      seekerProfile: {
        headline,
        phone,
        location: { city, state, isRural },
        educationLevel,
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceLevel,
        careerGoals,
        preferredWorkMode,
        resumeUrl,
        isCareerRestart
      }
    };

    const res = await updateProfile(payload);
    setSaving(false);
    if (res.success) {
      setSuccessMsg('Your profile changes have been saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#292929]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] tracking-tight">
          Profile & Account Management
        </h1>
        <p className="text-xs sm:text-sm text-[#737373]">
          Manage your personal details, verified skill proficiencies, and career preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#292929] pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'profile'
              ? 'bg-[#1C1C1C] text-[#FF5A1F] border border-orange-200'
              : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#101010]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('skills')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'skills'
              ? 'bg-[#1C1C1C] text-[#FF5A1F] border border-orange-200'
              : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#101010]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>My Skills</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            activeTab === 'settings'
              ? 'bg-[#1C1C1C] text-[#FF5A1F] border border-orange-200'
              : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#101010]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Account Settings</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#151515] rounded-2xl border border-[#292929] p-6 sm:p-8 shadow-xs space-y-6">
        {/* TAB 1: My Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider pb-2 border-b border-[#222222]">
              Personal & Location Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#292929] bg-[#101010] text-[#737373] text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Canva Creative Designer | Social Media Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Gurugram, Sonipat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Haryana"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="rural"
                checked={isRural}
                onChange={(e) => setIsRural(e.target.checked)}
                className="rounded text-[#FF5A1F] focus:ring-[#FF5A1F] w-4 h-4"
              />
              <label htmlFor="rural" className="text-xs text-[#D4D4D4] cursor-pointer">
                I reside in a rural or semi-urban area (Enhances matching for rural development roles and regional initiatives)
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Optional Resume Link / Portfolio Document</label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://drive.google.com/... or resume URL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: My Skills */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider pb-2 border-b border-[#222222]">
              Skills & Education Background
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">
                Skills & Practical Competencies (comma separated)
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Canva, Hindi Typing, Social Media, Spreadsheet Formulas, Python, Tailwind"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
              />
              <p className="text-[11px] text-[#555555] mt-1">
                Tip: Skills verified by SETU assessments will automatically receive verified badges on your job applications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none bg-[#151515]"
                >
                  <option value="No formal degree">No formal degree / Self-taught</option>
                  <option value="10th Pass">10th Standard Pass</option>
                  <option value="12th Pass">12th Standard Pass</option>
                  <option value="ITI / Vocational Diploma">ITI / Vocational Diploma</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none bg-[#151515]"
                >
                  <option value="No previous experience / Fresher">No previous experience / Fresher</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3+ years">3+ years</option>
                  <option value="Career break / Returning to work">Career break / Returning to work</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Languages Known (comma separated)</label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="Hindi, English, Haryanvi, Punjabi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Career Goals & Aspirations</label>
              <textarea
                rows={3}
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                placeholder="Describe what kind of projects or employment opportunities you are looking for..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Account Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider pb-2 border-b border-[#222222]">
              Work Preferences & Support Options
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1.5">Preferred Work Mode</label>
              <select
                value={preferredWorkMode}
                onChange={(e: any) => setPreferredWorkMode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#333333] text-sm focus:ring-2 focus:ring-[#FF5A1F] outline-none bg-[#151515]"
              >
                <option value="any">Any (Flexible - Remote, Hybrid, or On-site)</option>
                <option value="remote">100% Remote / Work from Home</option>
                <option value="hybrid">Hybrid (Mix of office and home)</option>
                <option value="onsite">On-site Local Work</option>
              </select>
            </div>

            {/* Build Her Career Restart Flag */}
            <div className="p-4 bg-pink-50/70 rounded-xl border border-pink-200/80 flex items-start gap-3">
              <input
                type="checkbox"
                id="restart"
                checked={isCareerRestart}
                onChange={(e) => setIsCareerRestart(e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4 mt-0.5"
              />
              <div>
                <label htmlFor="restart" className="text-xs font-bold text-pink-900 cursor-pointer block">
                  Build Her Participant: Women Returning to Work / Financial Independence
                </label>
                <p className="text-[11px] text-pink-700 mt-0.5 leading-relaxed">
                  Enables curated career-restart listings with flexible hours and returnee mentorship support.
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#737373]">
              <p>Account Type: <strong className="text-[#E5E5E5] uppercase font-semibold">{user?.role}</strong></p>
              <p className="mt-1">For password changes or email updates, please contact platform support at contact@setu.gov.in.</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-[#292929] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#FF5A1F] hover:bg-[#FF7847] text-white font-semibold rounded-xl transition text-xs shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
