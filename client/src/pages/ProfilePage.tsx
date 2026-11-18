import React, { useState } from 'react';
import { User, MapPin, Briefcase, Award, BookOpen, CheckCircle, Save, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { language, t } = useLanguage();

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
  const [interests, setInterests] = useState((seeker.interests || []).join(', '));
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
        interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
        preferredWorkMode,
        resumeUrl,
        isCareerRestart
      }
    };

    const res = await updateProfile(payload);
    setSaving(false);
    if (res.success) {
      setSuccessMsg('Profile and preferences updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            {language === 'hi' ? 'मेरी प्रोफ़ाइल और हुनर' : 'My Profile & Career Preferences'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Your details help our transparent engine match you with credible opportunities without formal degree barriers.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Personal & Headline */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            1. Personal & Contact Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email (Account ID)</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 text-stone-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Professional Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Canva Creative Designer | Social Media Support"
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Location & Geography */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            2. Location & Geographic Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">City / District</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Sonipat, Gurugram"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Haryana"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rural"
              checked={isRural}
              onChange={(e) => setIsRural(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
            />
            <label htmlFor="rural" className="text-xs text-stone-700 cursor-pointer">
              I reside in a rural or semi-urban area (Enhances matching for rural development roles and remote projects)
            </label>
          </div>
        </div>

        {/* Skills & Background */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
            3. Skills, Education & Experience
          </h3>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Skills & Practical Competencies (comma separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Canva, Graphic Design, Hindi Typing, Social Media, Spreadsheet Formulas"
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="No previous experience / Fresher">No previous experience / Fresher</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3+ years">3+ years</option>
                <option value="Career break / Returning to work">Career break / Returning to work</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Languages (comma separated)</label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="e.g. Hindi, English, Haryanvi"
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Work Mode</label>
              <select
                value={preferredWorkMode}
                onChange={(e: any) => setPreferredWorkMode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="any">Any (Flexible)</option>
                <option value="remote">100% Remote / Work from Home</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site Local Work</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Career Goals & Aspirations</label>
            <textarea
              rows={2}
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="e.g. Seeking flexible remote graphic design roles or digital freelance contracts."
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Optional Resume / Portfolio URL</label>
            <input
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="e.g. https://setu.demo/resumes/my_resume.pdf"
              className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Build Her Career Restart Flag */}
          <div className="p-4 bg-pink-50 rounded-xl border border-pink-200 flex items-start space-x-3">
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
                Check this box to highlight career restart friendly listings and enable curated returnee mentorship resources on your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#E65100] hover:bg-orange-700 text-white font-bold rounded-lg transition text-sm shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
