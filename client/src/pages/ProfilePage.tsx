import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  User,
  Award,
  Settings,
  CheckCircle2,
  Save,
  ShieldCheck,
  Mail,
  Sparkles,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  ArrowRight,
  Heart,
  AlertCircle
} from 'lucide-react';
import {
  useAuth,
  GenderOption,
  EducationEntry,
  DetailedSkill,
  ExperienceEntry
} from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserAvatar } from '../components/UserAvatar';
import { EducationManager } from '../components/EducationManager';
import {
  GENDER_OPTIONS,
  PROFICIENCY_LEVELS,
  CAREER_INTERESTS,
  CAREER_GOALS,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  PREFERRED_LANGUAGES,
  AVAILABILITY_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS
} from '../constants/profileOptions';

type ProfileTab = 'profile' | 'skills' | 'preferences' | 'settings';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    tabParam === 'skills'
      ? 'skills'
      : tabParam === 'preferences'
      ? 'preferences'
      : tabParam === 'settings'
      ? 'settings'
      : 'profile'
  );

  useEffect(() => {
    if (
      tabParam === 'skills' ||
      tabParam === 'preferences' ||
      tabParam === 'settings' ||
      tabParam === 'profile'
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Personal & Education
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderOption>('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isRural, setIsRural] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [accessibilityPreferences, setAccessibilityPreferences] = useState('');
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);

  // Skills & Experience
  const [skillsList, setSkillsList] = useState<DetailedSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] =
    useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newSkillSupportTitle, setNewSkillSupportTitle] = useState('');
  const [newSkillSupportUrl, setNewSkillSupportUrl] = useState('');
  const [hasExperience, setHasExperience] = useState(false);
  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([]);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpOrg, setNewExpOrg] = useState('');
  const [newExpType, setNewExpType] = useState('Full-time');
  const [newExpResp, setNewExpResp] = useState('');

  // Interests & Employment Preferences
  const [interests, setInterests] = useState<string[]>([]);
  const [careerGoalsList, setCareerGoalsList] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [preferredLocationsText, setPreferredLocationsText] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availableHours, setAvailableHours] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('Fresher / 0 years');
  const [availability, setAvailability] = useState('Immediate');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [isCareerRestart, setIsCareerRestart] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form fields from authenticated MongoDB user
  useEffect(() => {
    if (!user) return;
    const sp = user.seekerProfile || {};
    setName(user.name || '');
    setGender((user.gender as GenderOption) || '');
    setProfilePhoto(user.profilePicture || user.avatar || '');
    setHeadline(sp.headline || '');
    setBio(sp.bio || '');
    setPhone(sp.phone || '');
    setCity(sp.location?.city || '');
    setStateName(sp.location?.state || '');
    setCountry(sp.location?.country || 'India');
    setPreferredLanguage(sp.preferredLanguage || sp.languages?.[0] || 'English');
    setIsRural(Boolean(sp.location?.isRural));
    setResumeUrl(sp.resumeUrl || '');
    setDateOfBirth(sp.dateOfBirth || '');
    setAccessibilityPreferences(sp.accessibilityPreferences || '');

    if (Array.isArray(sp.education) && sp.education.length > 0) {
      setEducationList(sp.education);
    } else if (sp.educationLevel && sp.educationLevel !== 'No formal degree') {
      setEducationList([{ level: sp.educationLevel }]);
    } else {
      setEducationList([]);
    }

    if (Array.isArray(sp.detailedSkills) && sp.detailedSkills.length > 0) {
      setSkillsList(sp.detailedSkills);
    } else if (Array.isArray(sp.skills) && sp.skills.length > 0) {
      setSkillsList(
        sp.skills.map((s) => ({
          name: s,
          category: 'General',
          proficiency: 'Intermediate',
          verified: false,
          source: 'self_reported'
        }))
      );
    } else {
      setSkillsList([]);
    }

    const exps = Array.isArray(sp.experience) ? sp.experience : [];
    setExperienceList(exps);
    setHasExperience(Boolean(sp.hasExperience || exps.length > 0));

    setInterests(Array.isArray(sp.interests) ? sp.interests : []);
    setCareerGoalsList(
      Array.isArray(sp.careerGoalsList) && sp.careerGoalsList.length > 0
        ? sp.careerGoalsList
        : sp.careerGoals
        ? sp.careerGoals
            .split(',')
            .map((g) => g.trim())
            .filter(Boolean)
        : []
    );

    const prefs = sp.employmentPreferences || {};
    setJobTypes(Array.isArray(prefs.jobTypes) ? prefs.jobTypes : []);
    setWorkModes(Array.isArray(prefs.workModes) ? prefs.workModes : []);
    setPreferredLocationsText((prefs.preferredLocations || []).join(', '));
    setExpectedSalary(prefs.expectedSalary || '');
    setAvailableHours(prefs.availableHours || '');
    setYearsOfExperience(prefs.yearsOfExperience || 'Fresher / 0 years');
    setAvailability(prefs.availability || 'Immediate');
    setWillingToRelocate(Boolean(prefs.willingToRelocate));
    setIsCareerRestart(Boolean(sp.isCareerRestart));
  }, [user]);

  const toggleItem = (list: string[], setter: (v: string[]) => void, value: string) => {
    if (list.includes(value)) setter(list.filter((i) => i !== value));
    else setter([...list, value]);
  };

  const handleAddSkill = () => {
    const clean = newSkillName.trim();
    if (!clean) return;
    if (skillsList.some((s) => s.name.toLowerCase() === clean.toLowerCase())) return;
    setSkillsList([
      ...skillsList,
      {
        name: clean,
        category: 'General',
        proficiency: newSkillProf,
        verified: false,
        source: 'self_reported',
        supportingTitle: newSkillSupportTitle.trim(),
        supportingUrl: newSkillSupportUrl.trim()
      }
    ]);
    setNewSkillName('');
    setNewSkillSupportTitle('');
    setNewSkillSupportUrl('');
  };

  const handleAddExperience = () => {
    if (!newExpTitle.trim() || !newExpOrg.trim()) return;
    setExperienceList([
      ...experienceList,
      {
        jobTitle: newExpTitle.trim(),
        organization: newExpOrg.trim(),
        employmentType: newExpType,
        responsibilities: newExpResp.trim()
      }
    ]);
    setHasExperience(true);
    setNewExpTitle('');
    setNewExpOrg('');
    setNewExpResp('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      gender,
      profilePicture: profilePhoto.trim(),
      seekerProfile: {
        headline: headline.trim() || bio.trim().slice(0, 120),
        bio: bio.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth.trim(),
        accessibilityPreferences: accessibilityPreferences.trim(),
        preferredLanguage,
        languages: Array.from(new Set([preferredLanguage, 'English'].filter(Boolean))),
        location: { city: city.trim(), state: stateName.trim(), country: country.trim() || 'India', isRural },
        education: educationList,
        detailedSkills: skillsList.map((s) => ({
          name: s.name,
          category: s.category || 'General',
          proficiency: s.proficiency || 'Beginner',
          supportingTitle: s.supportingTitle || '',
          supportingUrl: s.supportingUrl || ''
        })),
        hasExperience,
        experience: hasExperience ? experienceList : [],
        interests,
        careerGoalsList,
        employmentPreferences: {
          jobTypes,
          workModes,
          preferredLocations: preferredLocationsText
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean),
          expectedSalary: expectedSalary.trim(),
          availableHours: availableHours.trim(),
          yearsOfExperience,
          availability,
          willingToRelocate
        },
        resumeUrl: resumeUrl.trim(),
        isCareerRestart
      }
    };

    const res = await updateProfile(payload);
    setSaving(false);
    if (res.success) {
      setSuccessMsg('Your career profile has been saved and updated!');
      toast.success('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      const msg = res.error || 'Failed to update profile';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const completionPct = user?.profileCompletion ?? 15;
  const missingSections = Array.isArray(user?.missingSections) ? user.missingSections : [];
  const roleLabel =
    user?.role === 'employer'
      ? 'Employer'
      : user?.role === 'admin'
      ? 'Administrator'
      : 'Job Seeker';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header + Completion Banner */}
      <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#D6EEFF]/60 rounded-3xl border border-[#BDE0FE] p-6 shadow-baby space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar name={user?.name} src={profilePhoto || user?.profilePicture || user?.avatar} size="xl" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#334155] font-display truncate">
                {user?.name || 'My Career Profile'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#64748B]">
                <span className="inline-flex items-center gap-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-[#3B9EE8]" />
                  <span>{user?.email}</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1E3A5F] border border-[#BDE0FE]">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/onboarding"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Guided 7-Step Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Profile Completion Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#D8ECFA]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
            <span>Profile Completion</span>
            <span className="text-[#1E3A5F] font-bold">{completionPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#D8ECFA]">
            <div
              className="h-full bg-gradient-to-r from-[#60B6F8] to-[#3B9EE8] rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {missingSections.length > 0 && (
            <p className="text-[11px] text-[#64748B]">
              Missing sections: <strong className="text-[#334155]">{missingSections.join(' • ')}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'profile' as ProfileTab, label: 'Personal & Education', icon: User },
          { id: 'skills' as ProfileTab, label: 'Skills & Experience', icon: Award },
          { id: 'preferences' as ProfileTab, label: 'Interests & Preferences', icon: Briefcase },
          { id: 'settings' as ProfileTab, label: 'Account Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl border transition ${
                active
                  ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] border-[#60B6F8] shadow-baby-sm'
                  : 'bg-white text-[#64748B] border-[#D8ECFA] hover:text-[#334155] hover:bg-[#EAF7FF]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby space-y-6"
      >
        {/* TAB 1: Personal & Education */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider pb-2 border-b border-[#EAF7FF]">
              Personal & Location Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Preferred Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                >
                  {PREFERRED_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Gurugram, Jaipur"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Haryana, Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. B.Tech Student | Aspiring Data Analyst"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-gender"
                  className="block text-xs font-semibold text-[#334155] mb-1.5"
                >
                  Gender <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <select
                  id="profile-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderOption)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                >
                  <option value="">Prefer not specified</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Optional. Determines eligibility for women-centric initiatives like Build Her.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Short Professional Introduction
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell employers about your background, strengths, and career aspirations..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Date of Birth <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Resume / Portfolio Link <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none"
                />
              </div>
            </div>

            {/* Education Section */}
            <div className="pt-4 border-t border-[#EAF7FF] space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#3B9EE8]" />
                  <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider">
                    Educational Qualifications ({educationList.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#64748B]">
                  Supports Percentage, CGPA &amp; Grade • Click Save Changes below after updating
                </span>
              </div>

              <EducationManager
                educationList={educationList}
                onChange={setEducationList}
                compactLevelSelector
              />
            </div>
          </div>
        )}

        {/* TAB 2: Skills & Experience */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider pb-2 border-b border-[#EAF7FF]">
              Skills & Proficiency ({skillsList.length})
            </h3>

            <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Skill name (e.g. Python, SQL, Canva)"
                  className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                />
                <select
                  value={newSkillProf}
                  onChange={(e) => setNewSkillProf(e.target.value as any)}
                  className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                >
                  {PROFICIENCY_LEVELS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newSkillSupportTitle}
                  onChange={(e) => setNewSkillSupportTitle(e.target.value)}
                  placeholder="Supporting project/certificate title (optional)"
                  className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                />
                <input
                  type="url"
                  value={newSkillSupportUrl}
                  onChange={(e) => setNewSkillSupportUrl(e.target.value)}
                  placeholder="Supporting URL (optional)"
                  className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                />
              </div>
            </div>

            {skillsList.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-[#BDE0FE] bg-[#F8FCFF] text-center text-xs text-[#64748B]">
                Your skills tell your story. Let's add your first one!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skillsList.map((s, idx) => (
                  <div
                    key={`${s.name}-${idx}`}
                    className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#334155]">{s.name}</span>
                        {s.verified || s.source === 'assessment_verified' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Assessment-Verified</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#1E3A5F] border border-[#BDE0FE]">
                            Self-Reported
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B]">Proficiency: {s.proficiency}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSkillsList(skillsList.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Professional Experience */}
            <div className="pt-4 border-t border-[#EAF7FF] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider">
                  Professional Experience
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExperience}
                    onChange={(e) => setHasExperience(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#3B9EE8]"
                  />
                  <span>I have work / internship experience</span>
                </label>
              </div>

              {!hasExperience ? (
                <div className="p-6 rounded-2xl bg-[#EAF7FF]/70 border border-[#BDE0FE] text-center space-y-1.5">
                  <Heart className="w-5 h-5 text-[#3B9EE8] fill-[#BDE0FE] mx-auto" />
                  <p className="text-xs font-bold text-[#334155]">
                    Everyone starts somewhere! Your skills and potential matter here. 🩵
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={newExpTitle}
                      onChange={(e) => setNewExpTitle(e.target.value)}
                      placeholder="Job Title"
                      className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                    />
                    <input
                      type="text"
                      value={newExpOrg}
                      onChange={(e) => setNewExpOrg(e.target.value)}
                      placeholder="Organization"
                      className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                    />
                    <select
                      value={newExpType}
                      onChange={(e) => setNewExpType(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newExpResp}
                        onChange={(e) => setNewExpResp(e.target.value)}
                        placeholder="Key responsibilities"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="px-3 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {experienceList.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#334155]">
                          {exp.jobTitle} • {exp.organization}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          {exp.employmentType}
                          {exp.responsibilities ? ` — ${exp.responsibilities}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Interests & Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider pb-2 border-b border-[#EAF7FF] mb-3">
                Career Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {CAREER_INTERESTS.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(interests, setInterests, item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                        selected
                          ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F]'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider pb-2 border-b border-[#EAF7FF] mb-3">
                Career Goals
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CAREER_GOALS.map((goal) => {
                  const selected = careerGoalsList.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleItem(careerGoalsList, setCareerGoalsList, goal)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border text-left transition ${
                        selected
                          ? 'bg-[#EAF7FF] border-[#60B6F8] text-[#1E3A5F]'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]/70'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#EAF7FF]">
              <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider">
                Employment Preferences
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#64748B]">Employment Types</label>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((t) => {
                    const selected = jobTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleItem(jobTypes, setJobTypes, t)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                          selected
                            ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F]'
                            : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155]'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#64748B]">Work Modes</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((m) => {
                    const selected = workModes.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleItem(workModes, setWorkModes, m)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                          selected
                            ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F]'
                            : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Preferred Locations (comma separated)
                  </label>
                  <input
                    type="text"
                    value={preferredLocationsText}
                    onChange={(e) => setPreferredLocationsText(e.target.value)}
                    placeholder="Remote, Delhi NCR, Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Expected Salary / Stipend
                  </label>
                  <input
                    type="text"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="e.g. ₹20,000 / month"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Years of Experience
                  </label>
                  <select
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  >
                    {YEARS_OF_EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">
                    Available Working Hours
                  </label>
                  <input
                    type="text"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="e.g. 40 hrs/week"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={willingToRelocate}
                      onChange={(e) => setWillingToRelocate(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#3B9EE8]"
                    />
                    <span>Willing to relocate</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Account Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-[#334155] uppercase tracking-wider pb-2 border-b border-[#EAF7FF]">
              Account & Support Settings
            </h3>

            <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#334155]">Account Email: {user?.email}</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Role: <strong className="text-[#1E3A5F]">{roleLabel}</strong>
                </p>
              </div>
              {user?.lastLogin && (
                <p className="text-[11px] text-[#64748B]">
                  Last Sign-In: {new Date(user.lastLogin).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Accessibility / Accommodation Preferences (Optional)
              </label>
              <input
                type="text"
                value={accessibilityPreferences}
                onChange={(e) => setAccessibilityPreferences(e.target.value)}
                placeholder="Share any workplace accessibility preferences if applicable"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rural-setting"
                checked={isRural}
                onChange={(e) => setIsRural(e.target.checked)}
                className="w-4 h-4 rounded accent-[#3B9EE8]"
              />
              <label htmlFor="rural-setting" className="text-xs text-[#334155] cursor-pointer">
                I reside in a rural or semi-urban area (helps surface regional livelihood schemes)
              </label>
            </div>

            {user?.role === 'seeker' && gender === 'Female' && (
              <div className="p-4 bg-pink-50/70 rounded-2xl border border-pink-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="restart-setting"
                  checked={isCareerRestart}
                  onChange={(e) => setIsCareerRestart(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-pink-500"
                />
                <div>
                  <label htmlFor="restart-setting" className="text-xs font-bold text-pink-900 cursor-pointer block">
                    Build Her Participant: Women Returning to Work / Financial Independence
                  </label>
                  <p className="text-[11px] text-pink-700 mt-0.5 leading-relaxed">
                    Enables curated career-restart opportunities with flexible hours and returnee mentorship.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-5 border-t border-[#EAF7FF] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold rounded-2xl transition text-xs shadow-baby-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
