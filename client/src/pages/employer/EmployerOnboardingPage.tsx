import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  Upload,
  FileText,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, getApiUrl, unwrapData } from '../../utils/api';

const DOC_TYPES = [
  'Business Registration Certificate',
  'GST Registration Certificate',
  'CIN Certificate',
  'Business PAN',
  'Authorization Letter',
  'Other Business Proof'
];

const LEGAL_STRUCTURES = [
  'Private Limited',
  'LLP',
  'Partnership',
  'Sole Proprietorship',
  'Public Limited',
  'Startup / MSME',
  'NGO / Trust',
  'Other'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Freelance',
  'Contract',
  'Remote'
] as const;

export const EmployerOnboardingPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step 1: Company Info
  const [registeredName, setRegisteredName] = useState('');
  const [publicName, setPublicName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [businessCategory, setBusinessCategory] = useState('');
  const [legalStructure, setLegalStructure] = useState('Private Limited');
  const [description, setDescription] = useState('');
  const [yearEstablished, setYearEstablished] = useState('');
  const [companySize, setCompanySize] = useState('11-50');
  const [website, setWebsite] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [hqCity, setHqCity] = useState('');
  const [hqState, setHqState] = useState('');
  const [hqAddress, setHqAddress] = useState('');
  const [officeAddresses, setOfficeAddresses] = useState<string[]>([]);
  const [newOffice, setNewOffice] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Step 2: Business Representative
  const [repName, setRepName] = useState('');
  const [repDesignation, setRepDesignation] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repDept, setRepDept] = useState('Human Resources');
  const [repRelation, setRepRelation] = useState('HR / Talent Acquisition Lead');
  const [repAuthorized, setRepAuthorized] = useState(true);

  // Step 3: Verification Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [verificationLabel, setVerificationLabel] = useState('Pending');
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Step 4: Hiring Preferences (Multiple)
  const [preferences, setPreferences] = useState<any[]>([]);
  const [prefTitle, setPrefTitle] = useState('');
  const [prefDept, setPrefDept] = useState('Engineering');
  const [prefVacancies, setPrefVacancies] = useState(1);
  const [prefEdu, setPrefEdu] = useState('Any Graduate / Relevant Skills');
  const [prefSkills, setPrefSkills] = useState('');
  const [prefExp, setPrefExp] = useState('0-2 Years / Fresher Friendly');
  const [prefMinSalary, setPrefMinSalary] = useState('');
  const [prefMaxSalary, setPrefMaxSalary] = useState('');
  const [prefLocation, setPrefLocation] = useState('Pan-India');
  const [prefEmpType, setPrefEmpType] = useState<(typeof EMPLOYMENT_TYPES)[number]>('Full-time');
  const [prefWorkArr, setPrefWorkArr] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [prefJoinDate, setPrefJoinDate] = useState('');
  const [prefCerts, setPrefCerts] = useState('');
  const [prefInterviewProcess, setPrefInterviewProcess] = useState(
    'Profile Screening -> Skill Assessment / Practical Task -> Final Interview'
  );
  const [savingPref, setSavingPref] = useState(false);

  // Completion state
  const [completionPct, setCompletionPct] = useState(0);
  const [onboardingSteps, setOnboardingSteps] = useState<any>({});

  const loadCompanyData = async () => {
    try {
      const res = await apiFetch('/api/employer/company');
      if (res.ok && res.data) {
        const data = unwrapData(res.data);
        const c = data?.company || {};
        setRegisteredName(c.registeredName || c.companyName || '');
        setPublicName(c.publicName || c.companyName || '');
        setLogoDataUrl(c.logoDataUrl || '');
        setIndustry(c.industry || 'Information Technology');
        setBusinessCategory(c.businessCategory || '');
        setLegalStructure(c.legalStructure || 'Private Limited');
        setDescription(c.description || '');
        setYearEstablished(c.yearEstablished ? String(c.yearEstablished) : '');
        setCompanySize(c.companySize || '11-50');
        setWebsite(c.website || '');
        setOfficialEmail(c.officialEmail || '');
        setContactNumber(c.contactNumber || '');
        setHqCity(c.headquartersLocation?.city || '');
        setHqState(c.headquartersLocation?.state || '');
        setHqAddress(c.headquartersLocation?.address || '');
        setOfficeAddresses(Array.isArray(c.officeAddresses) ? c.officeAddresses : []);
        setLinkedinUrl(c.linkedinUrl || '');

        if (c.representative) {
          setRepName(c.representative.fullName || '');
          setRepDesignation(c.representative.designation || '');
          setRepEmail(c.representative.workEmail || '');
          setRepPhone(c.representative.contactNumber || '');
          setRepDept(c.representative.department || 'Human Resources');
          setRepRelation(c.representative.relationshipToCompany || 'Authorized Representative');
          setRepAuthorized(Boolean(c.representative.authorizedToRecruit));
        }

        setDocuments(Array.isArray(data?.documents) ? data.documents : []);
        setPreferences(Array.isArray(data?.hiringPreferences) ? data.hiringPreferences : []);
        setVerificationLabel(data?.verificationLabel || 'Pending');
        setCompletionPct(c.completionPercentage || 0);
        setOnboardingSteps(c.onboardingSteps || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFeedback({ type: 'error', text: 'Logo must be PNG, JPG, or WebP.' });
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Logo file must be under 1.5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveStep1AndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await apiFetch('/api/employer/company', {
      method: 'PUT',
      body: JSON.stringify({
        registeredName,
        publicName: publicName || registeredName,
        companyName: publicName || registeredName,
        logoDataUrl,
        industry,
        businessCategory,
        legalStructure,
        description,
        yearEstablished: yearEstablished ? Number(yearEstablished) : null,
        companySize,
        website,
        officialEmail,
        contactNumber,
        headquartersLocation: { city: hqCity, state: hqState, address: hqAddress },
        officeAddresses,
        linkedinUrl
      })
    });
    setSaving(false);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Could not save company information.' });
      return;
    }
    await loadCompanyData();
    setFeedback({ type: 'success', text: 'Step 1 saved to MongoDB.' });
    setStep(2);
  };

  const saveStep2AndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await apiFetch('/api/employer/company', {
      method: 'PUT',
      body: JSON.stringify({
        representative: {
          fullName: repName,
          designation: repDesignation,
          workEmail: repEmail,
          contactNumber: repPhone,
          department: repDept,
          relationshipToCompany: repRelation,
          authorizedToRecruit: repAuthorized
        }
      })
    });
    setSaving(false);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Could not save representative info.' });
      return;
    }
    await loadCompanyData();
    setFeedback({ type: 'success', text: 'Step 2 saved.' });
    setStep(3);
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Please select a PDF, JPG, or PNG file.' });
      return;
    }
    setUploadingDoc(true);
    setUploadProgress(25);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', docType);
      formData.append('documentNumber', docNumber);
      formData.append('notes', docNotes);

      const token = localStorage.getItem('setu_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      setUploadProgress(65);
      const res = await fetch(getApiUrl('/api/employer/verification/documents'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData
      });
      const json = await res.json();
      setUploadProgress(100);

      if (!res.ok || json.success === false) {
        setFeedback({ type: 'error', text: json.message || 'Document upload failed.' });
      } else {
        setSelectedFile(null);
        setDocNumber('');
        setDocNotes('');
        await loadCompanyData();
        setFeedback({
          type: 'success',
          text: 'Document uploaded securely! A SETU administrator will review and verify your company.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Upload error' });
    } finally {
      setUploadingDoc(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handlePreviewDoc = async (doc: any) => {
    try {
      const token = localStorage.getItem('setu_auth_token');
      const res = await fetch(getApiUrl(`/api/employer/verification/documents/${doc._id}/file`), {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignore
    }
  };

  const handleAddHiringPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefTitle.trim()) return;
    setSavingPref(true);
    setFeedback(null);

    const res = await apiFetch('/api/employer/hiring-preferences', {
      method: 'POST',
      body: JSON.stringify({
        jobTitle: prefTitle,
        department: prefDept,
        vacancies: Number(prefVacancies) || 1,
        requiredEducation: prefEdu,
        requiredSkills: prefSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceLevel: prefExp,
        minSalary: prefMinSalary ? Number(prefMinSalary) : null,
        maxSalary: prefMaxSalary ? Number(prefMaxSalary) : null,
        jobLocation: prefLocation,
        employmentType: prefEmpType,
        workArrangement: prefWorkArr,
        preferredJoiningDate: prefJoinDate,
        requiredCertifications: prefCerts.split(',').map((s) => s.trim()).filter(Boolean),
        interviewProcess: prefInterviewProcess
      })
    });

    setSavingPref(false);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.error || 'Could not save hiring preference.' });
      return;
    }

    setPrefTitle('');
    setPrefSkills('');
    setPrefMinSalary('');
    setPrefMaxSalary('');
    setPrefCerts('');
    await loadCompanyData();
    setFeedback({ type: 'success', text: 'Hiring preference saved! You can add more or continue.' });
  };

  const handleDeletePref = async (id: string) => {
    const res = await apiFetch(`/api/employer/hiring-preferences/${id}`, { method: 'DELETE' });
    if (res.ok) await loadCompanyData();
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    const res = await apiFetch('/api/employer/company/complete-onboarding', { method: 'POST' });
    setSaving(false);
    if (res.ok) {
      await refreshUser();
      navigate('/employer');
    } else {
      setFeedback({ type: 'error', text: res.error || 'Could not finalize onboarding.' });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading company onboarding workspace...</p>
      </div>
    );
  }

  const stepsMeta = [
    { id: 1, title: 'Company Info', icon: Building2, done: Boolean(onboardingSteps.companyInfo) },
    { id: 2, title: 'Representative', icon: UserCheck, done: Boolean(onboardingSteps.representative) },
    { id: 3, title: 'Verification', icon: ShieldCheck, done: Boolean(onboardingSteps.verification) },
    { id: 4, title: 'Hiring Needs', icon: SlidersHorizontal, done: Boolean(onboardingSteps.hiringPreferences) },
    { id: 5, title: 'Review & Finish', icon: CheckCircle2, done: Boolean(onboardingSteps.completed) }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Progress Bar */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2589D6]">
              Employer Company Onboarding
            </span>
            <h1 className="text-2xl font-bold text-[#1E3A5F] font-display mt-0.5">
              Set Up Your Company on SETU
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Complete all 5 steps so SETU administrators can verify your organization and unlock live job publishing.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-[#2589D6]">{completionPct}% Complete</span>
            <div className="w-40 h-2.5 bg-[#EAF7FF] rounded-full overflow-hidden mt-1 border border-[#D8ECFA]">
              <div
                className="h-full bg-[#3B9EE8] rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {stepsMeta.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold border transition ${
                  active
                    ? 'bg-[#EAF7FF] text-[#1E3A5F] border-[#60B6F8] shadow-xs'
                    : s.done
                    ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                    : 'bg-[#F8FCFF] text-[#64748B] border-[#D8ECFA] hover:bg-[#EAF7FF]/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.id}. {s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* STEP 1: COMPANY INFORMATION */}
      {step === 1 && (
        <form
          onSubmit={saveStep1AndContinue}
          className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm space-y-5"
        >
          <h2 className="text-lg font-bold text-[#1E3A5F]">Step 1: Company Information</h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Company Logo"
                className="w-16 h-16 rounded-2xl object-cover border border-[#BDE0FE] bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE] flex items-center justify-center text-[#3B9EE8]">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs font-bold text-[#1E3A5F]">Company Logo</p>
              <p className="text-[11px] text-[#64748B]">PNG, JPG, or WebP (max 1.5 MB)</p>
              <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#BDE0FE] text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoPick} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Registered Company Name *</label>
              <input
                type="text"
                required
                value={registeredName}
                onChange={(e) => setRegisteredName(e.target.value)}
                placeholder="e.g., Shakti Tech Solutions Pvt. Ltd."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Public Display Name *</label>
              <input
                type="text"
                required
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                placeholder="e.g., Shakti Tech"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Industry *</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Information Technology, Healthcare, Retail"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Business Category</label>
              <input
                type="text"
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                placeholder="e.g., SaaS, B2B Services, Social Enterprise"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Legal Structure</label>
              <select
                value={legalStructure}
                onChange={(e) => setLegalStructure(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              >
                {LEGAL_STRUCTURES.map((ls) => (
                  <option key={ls} value={ls}>{ls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Year Established</label>
              <input
                type="number"
                min={1850}
                max={new Date().getFullYear()}
                value={yearEstablished}
                onChange={(e) => setYearEstablished(e.target.value)}
                placeholder="e.g., 2019"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              >
                {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((sz) => (
                  <option key={sz} value={sz}>{sz} employees</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Official Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="careers@yourcompany.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Contact Number *</label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Headquarters City *</label>
              <input
                type="text"
                required
                value={hqCity}
                onChange={(e) => setHqCity(e.target.value)}
                placeholder="e.g., Bengaluru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Headquarters State *</label>
              <input
                type="text"
                required
                value={hqState}
                onChange={(e) => setHqState(e.target.value)}
                placeholder="e.g., Karnataka"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">Headquarters Street Address</label>
              <input
                type="text"
                value={hqAddress}
                onChange={(e) => setHqAddress(e.target.value)}
                placeholder="Full registered office address"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">Additional Office Locations</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOffice}
                  onChange={(e) => setNewOffice(e.target.value)}
                  placeholder="e.g., Pune Branch Office, Hinjewadi Phase 2"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newOffice.trim()) return;
                    setOfficeAddresses((prev) => [...prev, newOffice.trim()]);
                    setNewOffice('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
                >
                  Add
                </button>
              </div>
              {officeAddresses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {officeAddresses.map((addr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] text-xs border border-[#BDE0FE]"
                    >
                      {addr}
                      <button
                        type="button"
                        onClick={() => setOfficeAddresses((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">LinkedIn Company Profile (Optional)</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/company/your-company"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">Company Description *</label>
              <textarea
                rows={4}
                required
                minLength={15}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell candidates about your mission, products, workplace inclusivity, and growth opportunities..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
            >
              <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: BUSINESS REPRESENTATIVE */}
      {step === 2 && (
        <form
          onSubmit={saveStep2AndContinue}
          className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm space-y-5"
        >
          <h2 className="text-lg font-bold text-[#1E3A5F]">Step 2: Business Representative</h2>
          <p className="text-xs text-[#64748B]">
            Provide details of the authorized person representing your organization for recruitment on SETU.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Representative Full Name *</label>
              <input
                type="text"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="e.g., Meera Nair"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Job Designation *</label>
              <input
                type="text"
                required
                value={repDesignation}
                onChange={(e) => setRepDesignation(e.target.value)}
                placeholder="e.g., Talent Acquisition Manager"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Official Work Email *</label>
              <input
                type="email"
                required
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
                placeholder="meera@yourcompany.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Contact Number *</label>
              <input
                type="tel"
                required
                value={repPhone}
                onChange={(e) => setRepPhone(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Department</label>
              <input
                type="text"
                value={repDept}
                onChange={(e) => setRepDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Relationship to Company</label>
              <select
                value={repRelation}
                onChange={(e) => setRepRelation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              >
                <option value="Founder / Director">Founder / Director</option>
                <option value="HR / Talent Acquisition Lead">HR / Talent Acquisition Lead</option>
                <option value="Authorized Representative">Authorized Representative</option>
                <option value="Hiring Manager">Hiring Manager</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#EAF7FF]/60 border border-[#BDE0FE] cursor-pointer">
            <input
              type="checkbox"
              required
              checked={repAuthorized}
              onChange={(e) => setRepAuthorized(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span className="text-xs text-[#1E3A5F] leading-relaxed">
              I confirm that I am formally authorized by this organization to recruit employees, review candidate profiles, and publish genuine vacancies on SETU.
            </span>
          </label>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#D8ECFA] text-xs font-semibold text-[#475569] hover:bg-[#F8FCFF]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
            >
              <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: COMPANY VERIFICATION */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[#1E3A5F]">Step 3: Company Verification</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Upload proof of business existence (PDF, JPG, or PNG, max 5 MB). Documents remain private and are reviewed only by authorized SETU administrators.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] self-start">
              Status: {verificationLabel}
            </span>
          </div>

          <form onSubmit={handleUploadDoc} className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                >
                  {DOC_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Registration / GST / CIN / PAN Number</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Optional reference number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">Select Document File (PDF, JPG, PNG) *</label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#EAF7FF] file:text-[#1E3A5F] file:font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Optional notes for SETU verification team"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-white text-xs"
                />
              </div>
            </div>

            {uploadProgress > 0 && (
              <div className="w-full h-2 bg-[#EAF7FF] rounded-full overflow-hidden">
                <div className="h-full bg-[#3B9EE8] transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <button
              type="submit"
              disabled={uploadingDoc}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#1E3A5F] hover:bg-[#152B47] text-white text-xs font-semibold transition disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              <span>{uploadingDoc ? 'Uploading Securely...' : 'Upload Document for Admin Review'}</span>
            </button>
          </form>

          {/* Uploaded Documents List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Submitted Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-[#64748B] p-4 rounded-2xl border border-dashed border-[#BDE0FE] text-center">
                No documents uploaded yet. You can continue onboarding and save job drafts, or upload now to begin verification.
              </p>
            ) : (
              documents.map((d) => (
                <div
                  key={d._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA]"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#3B9EE8] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#1E3A5F]">{d.documentType}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {d.originalFilename} • {(d.sizeBytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {d.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePreviewDoc(d)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[#D8ECFA] text-[11px] font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#D8ECFA] text-xs font-semibold text-[#475569]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-semibold shadow-sm"
            >
              <span>Continue to Hiring Requirements</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: HIRING REQUIREMENTS */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F]">
              Step 4: What type of employees are you looking to hire?
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Save one or more hiring preference templates. You can turn any saved preference into a job posting later.
            </p>
          </div>

          <form onSubmit={handleAddHiringPreference} className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={prefTitle}
                  onChange={(e) => setPrefTitle(e.target.value)}
                  placeholder="e.g., Business Analyst"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Department</label>
                <input
                  type="text"
                  value={prefDept}
                  onChange={(e) => setPrefDept(e.target.value)}
                  placeholder="e.g., Operations, Tech, Marketing"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Vacancies</label>
                <input
                  type="number"
                  min={1}
                  value={prefVacancies}
                  onChange={(e) => setPrefVacancies(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Employment Type</label>
                <select
                  value={prefEmpType}
                  onChange={(e) => setPrefEmpType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Work Arrangement</label>
                <select
                  value={prefWorkArr}
                  onChange={(e) => setPrefWorkArr(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Job Location</label>
                <input
                  type="text"
                  value={prefLocation}
                  onChange={(e) => setPrefLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Required Education</label>
                <input
                  type="text"
                  value={prefEdu}
                  onChange={(e) => setPrefEdu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Experience Level</label>
                <input
                  type="text"
                  value={prefExp}
                  onChange={(e) => setPrefExp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Preferred Joining Date</label>
                <input
                  type="date"
                  value={prefJoinDate}
                  onChange={(e) => setPrefJoinDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Min Salary (₹/year)</label>
                <input
                  type="number"
                  min={0}
                  value={prefMinSalary}
                  onChange={(e) => setPrefMinSalary(e.target.value)}
                  placeholder="e.g., 300000"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Max Salary (₹/year)</label>
                <input
                  type="number"
                  min={0}
                  value={prefMaxSalary}
                  onChange={(e) => setPrefMaxSalary(e.target.value)}
                  placeholder="e.g., 600000"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={prefSkills}
                  onChange={(e) => setPrefSkills(e.target.value)}
                  placeholder="Excel, SQL, Communication"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">Required Certifications</label>
                <input
                  type="text"
                  value={prefCerts}
                  onChange={(e) => setPrefCerts(e.target.value)}
                  placeholder="Optional certifications"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1">Interview Process</label>
                <input
                  type="text"
                  value={prefInterviewProcess}
                  onChange={(e) => setPrefInterviewProcess(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] bg-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#152B47]"
            >
              <Plus className="w-4 h-4" />
              <span>{savingPref ? 'Saving...' : 'Save Hiring Preference'}</span>
            </button>
          </form>

          {/* Saved Hiring Preferences */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Saved Hiring Preferences ({preferences.length})
            </h3>
            {preferences.length === 0 ? (
              <p className="text-xs text-[#64748B] p-4 rounded-2xl border border-dashed border-[#BDE0FE] text-center">
                No hiring preferences saved yet. Add at least one hiring requirement above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {preferences.map((p) => (
                  <div
                    key={p._id}
                    className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1E3A5F]">{p.jobTitle}</p>
                      <p className="text-xs text-[#64748B]">
                        {p.department} • {p.vacancies} vacancy(s) • {p.employmentType} ({p.workArrangement})
                      </p>
                      {Array.isArray(p.requiredSkills) && p.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.requiredSkills.map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-[#1E3A5F] border border-[#D8ECFA]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePref(p._id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                      aria-label="Delete preference"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#D8ECFA] text-xs font-semibold text-[#475569]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-semibold shadow-sm"
            >
              <span>Review & Complete</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: FINAL REVIEW & COMPLETION INDICATOR */}
      {step === 5 && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm space-y-6">
          <h2 className="text-lg font-bold text-[#1E3A5F]">Step 5: Final Review & Save</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stepsMeta.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  s.done
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{s.title}</p>
                  <p className="text-[11px] mt-0.5">
                    {s.done ? 'Completed and saved' : 'Incomplete — click Edit to fill'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className="px-3 py-1 rounded-xl bg-white text-xs font-semibold border border-current/20"
                >
                  {s.done ? 'Edit' : 'Complete'}
                </button>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs text-[#475569] space-y-2">
            <p><strong>Company:</strong> {publicName || registeredName || 'Not set'} ({industry})</p>
            <p><strong>Headquarters:</strong> {[hqCity, hqState].filter(Boolean).join(', ') || 'Not set'}</p>
            <p><strong>Authorized Representative:</strong> {repName ? `${repName} (${repDesignation})` : 'Not set'}</p>
            <p><strong>Verification Status:</strong> {verificationLabel} ({documents.length} document(s) uploaded)</p>
            <p><strong>Saved Hiring Preferences:</strong> {preferences.length}</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#D8ECFA] text-xs font-semibold text-[#475569]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCompleteOnboarding}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Complete Company Onboarding'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
