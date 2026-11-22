import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Sparkles,
  Compass,
  Briefcase,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  Edit3,
  Heart,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  useAuth,
  EducationEntry,
  DetailedSkill,
  ExperienceEntry
} from '../context/AuthContext';
import { UserAvatar } from '../components/UserAvatar';
import { EducationManager } from '../components/EducationManager';
import { ResumeUploadReviewModal } from '../components/ResumeUploadReviewModal';
import {
  formatAcademicScore,
  formatEducationTitle,
  getDisplayEducationStatus
} from '../utils/educationHelpers';
import {
  SUGGESTED_SKILLS,
  PROFICIENCY_LEVELS,
  CAREER_INTERESTS,
  CAREER_GOALS,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  PREFERRED_LANGUAGES,
  AVAILABILITY_OPTIONS,
  YEARS_OF_EXPERIENCE_OPTIONS
} from '../constants/profileOptions';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Education', icon: GraduationCap },
  { id: 3, title: 'Skills', icon: Sparkles },
  { id: 4, title: 'Interests', icon: Compass },
  { id: 5, title: 'Preferences', icon: Briefcase },
  { id: 6, title: 'Experience', icon: Award },
  { id: 7, title: 'Summary', icon: CheckCircle2 }
];

const emptyExperienceDraft = (): ExperienceEntry => ({
  jobTitle: '',
  organization: '',
  employmentType: 'Full-time',
  startDate: '',
  endDate: '',
  isCurrent: false,
  responsibilities: '',
  achievements: ''
});

export const ProfileOnboardingPage: React.FC = () => {
  const { user, updateProfile, setSuccessNotice } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showResumeUpload, setShowResumeUpload] = useState<boolean>(false);
  const [hideResumeCard, setHideResumeCard] = useState<boolean>(false);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [bio, setBio] = useState('');
  const [showOptionalPersonal, setShowOptionalPersonal] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [accessibilityPreferences, setAccessibilityPreferences] = useState('');

  // Step 2: Educational Background
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);

  // Step 3: Skills
  const [skillsList, setSkillsList] = useState<DetailedSkill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillCategory, setCustomSkillCategory] = useState('Technical');
  const [customProficiency, setCustomProficiency] =
    useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [customSupportTitle, setCustomSupportTitle] = useState('');
  const [customSupportUrl, setCustomSupportUrl] = useState('');

  // Step 4: Career Interests & Goals
  const [interests, setInterests] = useState<string[]>([]);
  const [careerGoalsList, setCareerGoalsList] = useState<string[]>([]);

  // Step 5: Employment Preferences
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availableHours, setAvailableHours] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('Fresher / 0 years');
  const [availability, setAvailability] = useState('Immediate');

  // Step 6: Professional Experience
  const [hasExperience, setHasExperience] = useState<boolean>(false);
  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([]);
  const [expDraft, setExpDraft] = useState<ExperienceEntry>(emptyExperienceDraft());
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);

  // Hydrate state from saved MongoDB user profile
  useEffect(() => {
    if (!user) return;
    const sp = user.seekerProfile || {};
    setFullName(user.name || user.fullName || '');
    setProfilePhoto(user.profilePicture || user.avatar || '');
    setCity(sp.location?.city || '');
    setStateName(sp.location?.state || '');
    setCountry(sp.location?.country || 'India');
    setPreferredLanguage(sp.preferredLanguage || sp.languages?.[0] || 'English');
    setPreferredLocations(sp.employmentPreferences?.preferredLocations || []);
    setWillingToRelocate(Boolean(sp.employmentPreferences?.willingToRelocate));
    setBio(sp.bio || sp.headline || '');
    setDateOfBirth(sp.dateOfBirth || '');
    setAccessibilityPreferences(sp.accessibilityPreferences || '');

    if (Array.isArray(sp.education) && sp.education.length > 0) {
      setEducationList(sp.education);
    } else if (sp.educationLevel && sp.educationLevel !== 'No formal degree') {
      setEducationList([{ level: sp.educationLevel }]);
    }

    if (Array.isArray(sp.detailedSkills) && sp.detailedSkills.length > 0) {
      setSkillsList(sp.detailedSkills);
    } else if (Array.isArray(sp.skills) && sp.skills.length > 0) {
      setSkillsList(
        sp.skills.map((name) => ({
          name,
          category: 'General',
          proficiency: 'Intermediate',
          verified: false,
          source: 'self_reported'
        }))
      );
    }

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
    setExpectedSalary(prefs.expectedSalary || '');
    setAvailableHours(prefs.availableHours || '');
    setYearsOfExperience(prefs.yearsOfExperience || 'Fresher / 0 years');
    setAvailability(prefs.availability || 'Immediate');

    const exps = Array.isArray(sp.experience) ? sp.experience : [];
    setExperienceList(exps);
    setHasExperience(Boolean(sp.hasExperience || exps.length > 0));
  }, [user]);

  // Live preview of completion percentage matching backend weights
  const liveCompletion = useMemo(() => {
    let score = 0;
    if (fullName.trim()) score += 8;
    if (city.trim() && stateName.trim()) score += 7;
    if (bio.trim()) score += 5;
    if (educationList.length > 0) score += 20;
    if (skillsList.length > 0) score += 20;
    if (interests.length > 0) score += 8;
    if (careerGoalsList.length > 0) score += 7;
    if (jobTypes.length > 0) score += 6;
    if (workModes.length > 0) score += 5;
    if (preferredLocations.length > 0 || expectedSalary.trim() || availability.trim()) score += 4;
    if (experienceList.length > 0 || !hasExperience) score += 10;
    return Math.min(100, Math.max(0, score));
  }, [
    fullName,
    city,
    stateName,
    bio,
    educationList,
    skillsList,
    interests,
    careerGoalsList,
    jobTypes,
    workModes,
    preferredLocations,
    expectedSalary,
    availability,
    experienceList,
    hasExperience
  ]);

  const buildProfilePayload = (extraFlags: {
    onboardingCompleted?: boolean;
    onboardingSkipped?: boolean;
  } = {}) => ({
    name: fullName.trim() || user?.name || 'SETU Member',
    profilePicture: profilePhoto.trim(),
    seekerProfile: {
      headline: bio.trim().slice(0, 120),
      bio: bio.trim(),
      dateOfBirth: dateOfBirth.trim(),
      accessibilityPreferences: accessibilityPreferences.trim(),
      preferredLanguage,
      languages: Array.from(new Set([preferredLanguage, 'English'].filter(Boolean))),
      location: {
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim() || 'India',
        isRural: user?.seekerProfile?.location?.isRural || false
      },
      education: educationList,
      detailedSkills: skillsList.map((s) => ({
        name: s.name,
        category: s.category || 'General',
        proficiency: s.proficiency || 'Beginner',
        supportingTitle: s.supportingTitle || '',
        supportingUrl: s.supportingUrl || ''
      })),
      interests,
      careerGoalsList,
      employmentPreferences: {
        jobTypes,
        workModes,
        preferredLocations,
        expectedSalary: expectedSalary.trim(),
        availableHours: availableHours.trim(),
        yearsOfExperience,
        availability,
        willingToRelocate
      },
      hasExperience,
      experience: hasExperience ? experienceList : [],
      ...extraFlags
    }
  });

  const persistProgress = async (
    extraFlags: { onboardingCompleted?: boolean; onboardingSkipped?: boolean } = {}
  ): Promise<boolean> => {
    setErrorMsg('');
    setSaving(true);
    const res = await updateProfile(buildProfilePayload(extraFlags));
    setSaving(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Could not save your profile right now. Please try again.');
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    const ok = await persistProgress();
    if (ok && step < 7) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipForNow = async () => {
    await persistProgress({ onboardingSkipped: true });
    navigate('/dashboard');
  };

  const handleCompleteProfile = async (destination: '/dashboard' | '/opportunities') => {
    const ok = await persistProgress({ onboardingCompleted: true, onboardingSkipped: false });
    if (ok) {
      setSuccessNotice(
        'Your career profile is saved! SETU will personalize your recommendations around your strengths 🩵'
      );
      navigate(destination);
    }
  };

  // Location tag helpers
  const addPreferredLocation = () => {
    const val = locationInput.trim();
    if (!val) return;
    if (!preferredLocations.some((loc) => loc.toLowerCase() === val.toLowerCase())) {
      setPreferredLocations([...preferredLocations, val]);
    }
    setLocationInput('');
  };

  // Skill helpers
  const addSkill = (
    skillName: string,
    category = 'General',
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate',
    supportingTitle = '',
    supportingUrl = ''
  ) => {
    const clean = skillName.trim();
    if (!clean) return;
    if (skillsList.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      return;
    }
    setSkillsList([
      ...skillsList,
      {
        name: clean,
        category,
        proficiency,
        verified: false,
        source: 'self_reported',
        supportingTitle: supportingTitle.trim(),
        supportingUrl: supportingUrl.trim()
      }
    ]);
  };

  const handleAddCustomSkill = () => {
    if (!customSkillName.trim()) return;
    addSkill(
      customSkillName,
      customSkillCategory,
      customProficiency,
      customSupportTitle,
      customSupportUrl
    );
    setCustomSkillName('');
    setCustomSupportTitle('');
    setCustomSupportUrl('');
  };

  const updateSkillProficiency = (
    idx: number,
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced'
  ) => {
    const next = [...skillsList];
    next[idx] = { ...next[idx], proficiency };
    setSkillsList(next);
  };

  const removeSkill = (idx: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== idx));
  };

  // Multi-select toggle helper
  const toggleItem = (list: string[], setter: (v: string[]) => void, value: string) => {
    if (list.includes(value)) setter(list.filter((i) => i !== value));
    else setter([...list, value]);
  };

  // Experience helpers
  const handleAddOrUpdateExperience = () => {
    if (!expDraft.jobTitle.trim() || !expDraft.organization.trim()) {
      setErrorMsg('Please enter both Job Title and Organization to add an experience entry.');
      return;
    }
    setErrorMsg('');
    if (editingExpIdx !== null) {
      const updated = [...experienceList];
      updated[editingExpIdx] = expDraft;
      setExperienceList(updated);
      setEditingExpIdx(null);
    } else {
      setExperienceList([...experienceList, expDraft]);
    }
    setExpDraft(emptyExperienceDraft());
  };

  const filteredSuggestedSkills = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [category, items] of Object.entries(SUGGESTED_SKILLS)) {
      const matched = q
        ? items.filter((item) => item.toLowerCase().includes(q))
        : items;
      if (matched.length > 0) result[category] = matched;
    }
    return result;
  }, [skillSearch]);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EAF7FF] via-[#D6EEFF] to-[#EAF7FF] border border-[#BDE0FE] p-6 sm:p-8 shadow-baby">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/50 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#334155] font-display tracking-tight">
              Let's Build Your Career Profile! 🩵
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] max-w-xl">
              Tell us a little about yourself so SETU can discover opportunities made for you.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkipForNow}
            disabled={saving}
            className="self-start sm:self-center px-4 py-2 rounded-full bg-white hover:bg-[#F8FCFF] text-[#64748B] hover:text-[#334155] border border-[#D8ECFA] text-xs font-semibold transition shrink-0"
          >
            Skip for now
          </button>
        </div>

        {/* Live Progress Indicator */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
            <span>
              Step {step} of {STEPS.length}: {STEPS[step - 1].title}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F]">
              {liveCompletion}% Profile Complete
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-[#D8ECFA]">
            <div
              className="h-full bg-gradient-to-r from-[#60B6F8] to-[#3B9EE8] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(12, Math.round((step / STEPS.length) * 100))}%` }}
            />
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isPast = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border text-[10px] sm:text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-white border-[#3B9EE8] text-[#1E3A5F] shadow-baby-sm'
                    : isPast
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700'
                    : 'bg-white/60 border-[#D8ECFA] text-[#64748B] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                <span className="hidden sm:inline truncate max-w-full">{s.title}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Initial Setup Resume Upload Card (Step 1) */}
      {step === 1 && !hideResumeCard && (
        <div className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/40 rounded-3xl border border-[#BDE0FE] p-5 shadow-baby-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#334155] font-display">
              Upload Your Resume (Optional Quick Start)
            </h3>
            <p className="text-xs text-[#64748B] max-w-xl">
              Already have a resume? Upload a PDF or DOCX (max 5 MB) to help SETU extract your
              education, skills, projects, and experience — you&apos;ll confirm everything before
              saving.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowResumeUpload(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
            >
              Upload Resume
            </button>
            <button
              type="button"
              onClick={() => navigate('/portfolio?action=build')}
              className="px-3.5 py-2 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
            >
              Create Resume with SETU
            </button>
            <button
              type="button"
              onClick={() => setHideResumeCard(true)}
              className="px-3 py-2 rounded-2xl text-[#64748B] hover:text-[#334155] text-xs font-semibold"
            >
              Skip for Now
            </button>
          </div>
        </div>
      )}

      {showResumeUpload && (
        <ResumeUploadReviewModal
          showSkipOption
          onClose={() => setShowResumeUpload(false)}
          onConfirmed={() => {
            setStatusMsg('Confirmed resume details merged into your SETU profile! 🩵');
            setHideResumeCard(true);
          }}
          onCreateWithSetu={() => navigate('/portfolio?action=build')}
        />
      )}

      {/* Error & Status Alerts */}
      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Step Card */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] shadow-baby p-6 sm:p-8 space-y-6">
        {/* ================= STEP 1: PERSONAL INFORMATION ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                Personal Information
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Basic details help SETU localize jobs, government schemes, and language support for you.
              </p>
            </div>

            {/* Avatar Preview + Optional Photo URL */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
              <UserAvatar name={fullName || user?.name} src={profilePhoto} size="xl" />
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-semibold text-[#334155]">
                  Profile Photograph URL <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg (leave blank for initials avatar)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                >
                  {PREFERRED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
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
                  placeholder="e.g. Gurugram, Pune, Jaipur"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Haryana, Maharashtra, Rajasthan"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={willingToRelocate}
                    onChange={(e) => setWillingToRelocate(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#3B9EE8]"
                  />
                  <span className="text-xs font-semibold text-[#334155]">
                    I am open to relocating for the right role
                  </span>
                </label>
              </div>
            </div>

            {/* Preferred Job Locations */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Preferred Job Locations
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPreferredLocation();
                    }
                  }}
                  placeholder="Add city or 'Remote' and press Add"
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
                <button
                  type="button"
                  onClick={addPreferredLocation}
                  className="px-4 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
              {preferredLocations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {preferredLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7FF] border border-[#BDE0FE] text-xs font-semibold text-[#1E3A5F]"
                    >
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreferredLocations(preferredLocations.filter((l) => l !== loc))
                        }
                        className="text-[#64748B] hover:text-rose-500"
                        aria-label={`Remove ${loc}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Short Professional Introduction */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Short Professional Introduction
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write 2–3 friendly sentences about who you are, what you enjoy working on, and what you're aiming for..."
                className="w-full px-4 py-3 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
              />
            </div>

            {/* Optional Sensitive/Support Fields (Collapsible) */}
            <div className="rounded-2xl border border-[#D8ECFA] bg-[#F8FCFF] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptionalPersonal(!showOptionalPersonal)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-[#334155]"
              >
                <span>Optional Details (Date of Birth for Age-Based Schemes & Accessibility)</span>
                {showOptionalPersonal ? (
                  <ChevronUp className="w-4 h-4 text-[#64748B]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#64748B]" />
                )}
              </button>
              {showOptionalPersonal && (
                <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#EAF7FF]">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Date of Birth <span className="text-[#64748B] font-normal">(Optional — used only for age-based scheme eligibility)</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Accessibility / Workplace Accommodation Preferences <span className="text-[#64748B] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={accessibilityPreferences}
                      onChange={(e) => setAccessibilityPreferences(e.target.value)}
                      placeholder="e.g. Flexible hours, screen-reader friendly tools"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] text-xs outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: EDUCATIONAL BACKGROUND ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                Tell Us About Your Education 🎓
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Add one or more qualifications — from Class 10, Class 12, and Diploma/ITI to college degrees, along with your Percentage, CGPA, or Grade.
              </p>
            </div>

            <EducationManager
              educationList={educationList}
              onChange={(next) => {
                setEducationList(next);
                setStatusMsg('Education qualifications updated!');
                setTimeout(() => setStatusMsg(''), 2500);
              }}
            />
          </div>
        )}

        {/* ================= STEP 3: SKILLS ================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                What Are You Good At? ✨
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Search suggested skills or add your own with proficiency levels. Skills you add here are marked <strong>Self-Reported</strong> until verified via SETU assessments.
              </p>
            </div>

            {/* Search Skills */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills (e.g. Python, SQL, Communication, Graphic Design, Accounting)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
              />
            </div>

            {/* Suggested Skills by Category */}
            <div className="space-y-4">
              {Object.entries(filteredSuggestedSkills).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => {
                      const selected = skillsList.some(
                        (s) => s.name.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            selected
                              ? setSkillsList(
                                  skillsList.filter(
                                    (s) => s.name.toLowerCase() !== skill.toLowerCase()
                                  )
                                )
                              : addSkill(skill, cat, 'Intermediate')
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                            selected
                              ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                              : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF] hover:border-[#A2D2FF]'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Skill + Supporting Project/Certificate */}
            <div className="p-5 rounded-3xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-3.5">
              <p className="text-xs font-bold text-[#334155]">
                Add a Custom Skill (with optional project or certificate)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  placeholder="Skill name (e.g. Tally, Figma)"
                  className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
                <select
                  value={customSkillCategory}
                  onChange={(e) => setCustomSkillCategory(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                >
                  <option value="Technical">Technical</option>
                  <option value="Professional">Professional</option>
                  <option value="Creative">Creative</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={customProficiency}
                  onChange={(e) => setCustomProficiency(e.target.value as any)}
                  className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                >
                  {PROFICIENCY_LEVELS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={customSupportTitle}
                  onChange={(e) => setCustomSupportTitle(e.target.value)}
                  placeholder="Supporting project or certificate title (optional)"
                  className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
                <input
                  type="url"
                  value={customSupportUrl}
                  onChange={(e) => setCustomSupportUrl(e.target.value)}
                  placeholder="Project / certificate link (optional)"
                  className="px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>
            </div>

            {/* Your Selected Skills */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Your Skills ({skillsList.length})
              </h3>
              {skillsList.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-[#BDE0FE] bg-[#F8FCFF] text-center text-xs text-[#64748B]">
                  Your skills tell your story. Let's add your first one!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillsList.map((s, idx) => (
                    <div
                      key={`${s.name}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white border border-[#D8ECFA] flex items-start justify-between gap-3 shadow-baby-sm"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#334155]">{s.name}</span>
                          {s.verified || s.source === 'assessment_verified' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Assessment-Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                              Self-Reported
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={s.proficiency}
                            onChange={(e) => updateSkillProficiency(idx, e.target.value as any)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF]"
                          >
                            {PROFICIENCY_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                          {s.supportingUrl && (
                            <a
                              href={s.supportingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#3B9EE8] hover:underline truncate"
                            >
                              <span>{s.supportingTitle || 'Proof'}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSkill(idx)}
                        className="p-1.5 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50 shrink-0"
                        aria-label={`Remove ${s.name}`}
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

        {/* ================= STEP 4: CAREER INTERESTS & GOALS ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                What Would You Love to Do? 🌈
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Pick as many career fields and goals as feel right — you can update them anytime!
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Career Interest Categories
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {CAREER_INTERESTS.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(interests, setInterests, item)}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition text-center ${
                        selected
                          ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#EAF7FF]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Your Career Goals
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CAREER_GOALS.map((goal) => {
                  const selected = careerGoalsList.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleItem(careerGoalsList, setCareerGoalsList, goal)}
                      className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                        selected
                          ? 'bg-[#EAF7FF] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]/70'
                      }`}
                    >
                      <span>{goal}</span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-[#3B9EE8] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: EMPLOYMENT PREFERENCES ================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                Employment Preferences
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Tell SETU how and where you prefer to work so we highlight the best-fitting roles.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Preferred Employment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {EMPLOYMENT_TYPES.map((type) => {
                  const selected = jobTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleItem(jobTypes, setJobTypes, type)}
                      className={`px-4 py-2 rounded-full border text-xs font-semibold transition ${
                        selected
                          ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Preferred Work Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {WORK_MODES.map((mode) => {
                  const selected = workModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleItem(workModes, setWorkModes, mode)}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold transition ${
                        selected
                          ? 'bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                          : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]'
                      }`}
                    >
                      {selected ? '✓ ' : ''}
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Expected Salary or Stipend
                </label>
                <input
                  type="text"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="e.g. ₹15,000 – ₹25,000 / month"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Available Working Hours
                </label>
                <input
                  type="text"
                  value={availableHours}
                  onChange={(e) => setAvailableHours(e.target.value)}
                  placeholder="e.g. Full-time (40 hrs/wk), Part-time (20 hrs/wk)"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Years of Experience
                </label>
                <select
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                >
                  {YEARS_OF_EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#D8ECFA] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: PROFESSIONAL EXPERIENCE ================= */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#334155] font-display">
                Professional Experience
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Do you have any previous jobs, internships, freelance projects, or volunteer roles?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasExperience(false)}
                className={`p-4 rounded-2xl border text-left transition ${
                  !hasExperience
                    ? 'bg-[#EAF7FF] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                    : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]/50'
                }`}
              >
                <p className="text-sm font-bold">No, I'm a fresher / starting out</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Looking for my first opportunity or internship
                </p>
              </button>

              <button
                type="button"
                onClick={() => setHasExperience(true)}
                className={`p-4 rounded-2xl border text-left transition ${
                  hasExperience
                    ? 'bg-[#EAF7FF] border-[#60B6F8] text-[#1E3A5F] shadow-baby-sm'
                    : 'bg-[#F8FCFF] border-[#D8ECFA] text-[#334155] hover:bg-[#EAF7FF]/50'
                }`}
              >
                <p className="text-sm font-bold">Yes, I have previous experience</p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Add full-time, part-time, internship, or freelance roles
                </p>
              </button>
            </div>

            {!hasExperience ? (
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#EAF7FF] via-[#F8FCFF] to-white border border-[#BDE0FE] text-center space-y-3 shadow-baby-sm">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8ECFA] text-[#3B9EE8] flex items-center justify-center mx-auto shadow-baby-sm">
                  <Heart className="w-6 h-6 fill-[#BDE0FE] text-[#3B9EE8]" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#334155] font-display">
                  Everyone starts somewhere! Your skills and potential matter here. 🩵
                </h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                  SETU will prioritize fresher-friendly roles, internships, apprenticeships, and beginner skill assessments tailored to your profile.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-5 rounded-3xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        value={expDraft.jobTitle}
                        onChange={(e) => setExpDraft({ ...expDraft, jobTitle: e.target.value })}
                        placeholder="e.g. Junior Data Analyst, Social Media Intern"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Organization *
                      </label>
                      <input
                        type="text"
                        value={expDraft.organization}
                        onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })}
                        placeholder="Company or organization name"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1">
                        Employment Type
                      </label>
                      <select
                        value={expDraft.employmentType || 'Full-time'}
                        onChange={(e) =>
                          setExpDraft({ ...expDraft, employmentType: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                      >
                        {EMPLOYMENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={expDraft.startDate || ''}
                          onChange={(e) => setExpDraft({ ...expDraft, startDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl border border-[#D8ECFA] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1">
                          End Date
                        </label>
                        <input
                          type="month"
                          disabled={expDraft.isCurrent}
                          value={expDraft.isCurrent ? '' : expDraft.endDate || ''}
                          onChange={(e) => setExpDraft({ ...expDraft, endDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-2xl border border-[#D8ECFA] text-xs disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(expDraft.isCurrent)}
                      onChange={(e) => setExpDraft({ ...expDraft, isCurrent: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#3B9EE8]"
                    />
                    <span>I currently work here</span>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Responsibilities
                    </label>
                    <textarea
                      rows={2}
                      value={expDraft.responsibilities || ''}
                      onChange={(e) =>
                        setExpDraft({ ...expDraft, responsibilities: e.target.value })
                      }
                      placeholder="Key tasks and projects you handled..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Relevant Achievements
                    </label>
                    <input
                      type="text"
                      value={expDraft.achievements || ''}
                      onChange={(e) => setExpDraft({ ...expDraft, achievements: e.target.value })}
                      placeholder="e.g. Increased campaign reach by 35%, automated monthly reports"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddOrUpdateExperience}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingExpIdx !== null ? 'Update Experience' : 'Add Experience'}</span>
                    </button>
                  </div>
                </div>

                {experienceList.length > 0 && (
                  <div className="space-y-2.5">
                    {experienceList.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-[#D8ECFA] flex items-start justify-between gap-4 shadow-baby-sm"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-[#334155]">
                            {exp.jobTitle} • <span className="text-[#3B9EE8]">{exp.organization}</span>
                          </p>
                          <p className="text-xs text-[#64748B]">
                            {exp.employmentType} • {exp.startDate || 'Start'} –{' '}
                            {exp.isCurrent ? 'Present' : exp.endDate || 'End'}
                          </p>
                          {exp.responsibilities && (
                            <p className="text-xs text-[#64748B]">{exp.responsibilities}</p>
                          )}
                          {exp.achievements && (
                            <p className="text-xs text-emerald-700 font-medium">
                              ★ {exp.achievements}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setExpDraft(exp);
                              setEditingExpIdx(idx);
                            }}
                            className="p-2 rounded-xl text-[#64748B] hover:bg-[#EAF7FF]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setExperienceList(experienceList.filter((_, i) => i !== idx))
                            }
                            className="p-2 rounded-xl text-[#64748B] hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 7: PROFILE SUMMARY ================= */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAF7FF]">
              <div className="flex items-center gap-4">
                <UserAvatar name={fullName || user?.name} src={profilePhoto} size="xl" />
                <div>
                  <h2 className="text-xl font-bold text-[#334155] font-display">
                    {fullName || user?.name}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    {[city, stateName, country].filter(Boolean).join(', ') || 'Location not set'} •{' '}
                    {preferredLanguage}
                  </p>
                  {bio && <p className="text-xs text-[#475569] mt-1.5 max-w-lg">{bio}</p>}
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE] text-center shrink-0">
                <p className="text-2xl font-extrabold text-[#1E3A5F] font-display">
                  {liveCompletion}%
                </p>
                <p className="text-[11px] font-semibold text-[#64748B]">Profile Complete</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Education Summary */}
              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155]">Education 🎓</span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] font-semibold text-[#3B9EE8] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                {educationList.length === 0 ? (
                  <p className="text-xs text-[#64748B]">Not added yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {educationList.map((ed, idx) => {
                      const scoreStr = formatAcademicScore(ed);
                      const statusStr = getDisplayEducationStatus(ed);
                      return (
                        <div key={idx} className="text-xs text-[#334155]">
                          <p>
                            • <strong>{formatEducationTitle(ed)}</strong>{' '}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#D8ECFA] text-[#64748B]">
                              {statusStr}
                            </span>
                          </p>
                          {scoreStr && (
                            <p className="text-[11px] font-semibold text-[#1E3A5F] pl-3">
                              {scoreStr}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Skills Summary */}
              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155]">Skills ✨</span>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[11px] font-semibold text-[#3B9EE8] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                {skillsList.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No skills added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((sk, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          sk.verified || sk.source === 'assessment_verified'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-[#D8ECFA] text-[#334155]'
                        }`}
                      >
                        {sk.name} ({sk.proficiency})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Career Interests & Goals Summary */}
              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155]">Career Interests & Goals 🌈</span>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-[11px] font-semibold text-[#3B9EE8] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-[#334155]">
                  <strong>Interests:</strong> {interests.join(', ') || 'Not selected yet'}
                </p>
                <p className="text-xs text-[#64748B]">
                  <strong>Goals:</strong> {careerGoalsList.join(', ') || 'Not selected yet'}
                </p>
              </div>

              {/* Employment Preferences & Experience */}
              <div className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#334155]">
                    Preferences & Experience 💼
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="text-[11px] font-semibold text-[#3B9EE8] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-[#334155]">
                  <strong>Types:</strong> {jobTypes.join(', ') || 'Any'} •{' '}
                  <strong>Mode:</strong> {workModes.join(', ') || 'Flexible'}
                </p>
                <p className="text-xs text-[#64748B]">
                  <strong>Experience:</strong>{' '}
                  {hasExperience && experienceList.length > 0
                    ? `${experienceList.length} role(s) added`
                    : 'Fresher / Ready to start 🩵'}
                </p>
              </div>
            </div>

            {/* Step 7 Action Buttons */}
            <div className="pt-4 border-t border-[#EAF7FF] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition"
              >
                Edit Information
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteProfile('/dashboard')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Complete My Profile'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCompleteProfile('/opportunities')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Explore My Opportunities</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer for Steps 1–6 */}
        {step < 7 && (
          <div className="pt-5 border-t border-[#EAF7FF] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : navigate('/dashboard'))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#64748B] hover:text-[#334155] border border-[#D8ECFA] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{step > 1 ? 'Back' : 'Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm transition disabled:opacity-50"
            >
              <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
