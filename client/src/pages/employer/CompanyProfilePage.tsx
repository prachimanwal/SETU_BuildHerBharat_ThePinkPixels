import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Users,
  SlidersHorizontal
} from 'lucide-react';
import { apiFetch, unwrapData } from '../../utils/api';

export const CompanyProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationLabel, setVerificationLabel] = useState('Pending');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [registeredName, setRegisteredName] = useState('');
  const [publicName, setPublicName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [companySize, setCompanySize] = useState('11-50');
  const [yearEstablished, setYearEstablished] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [hqCity, setHqCity] = useState('');
  const [hqState, setHqState] = useState('');
  const [hqAddress, setHqAddress] = useState('');
  const [officeAddresses, setOfficeAddresses] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [description, setDescription] = useState('');
  const [cultureDescription, setCultureDescription] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState('');
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recDesig, setRecDesig] = useState('Recruiter');
  const [recDept, setRecDept] = useState('Human Resources');

  const load = async () => {
    const res = await apiFetch('/api/employer/company');
    if (res.ok && res.data) {
      const data = unwrapData(res.data);
      const c = data?.company || {};
      setCompanyId(c._id || '');
      setIsVerified(Boolean(data?.isVerified));
      setVerificationLabel(data?.verificationLabel || 'Pending');
      setRegisteredName(c.registeredName || c.companyName || '');
      setPublicName(c.publicName || c.companyName || '');
      setLogoDataUrl(c.logoDataUrl || '');
      setIndustry(c.industry || '');
      setBusinessCategory(c.businessCategory || '');
      setCompanySize(c.companySize || '11-50');
      setYearEstablished(c.yearEstablished ? String(c.yearEstablished) : '');
      setWebsite(c.website || '');
      setLinkedinUrl(c.linkedinUrl || '');
      setOfficialEmail(c.officialEmail || '');
      setContactNumber(c.contactNumber || '');
      setHqCity(c.headquartersLocation?.city || '');
      setHqState(c.headquartersLocation?.state || '');
      setHqAddress(c.headquartersLocation?.address || '');
      setOfficeAddresses(Array.isArray(c.officeAddresses) ? c.officeAddresses : []);
      setDescription(c.description || '');
      setCultureDescription(c.cultureDescription || '');
      setBenefits(Array.isArray(c.benefits) ? c.benefits : []);
      setAchievements(Array.isArray(c.achievements) ? c.achievements : []);
      setRecruiters(Array.isArray(c.authorizedRecruiters) ? c.authorizedRecruiters : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Logo must be under 1.5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    const res = await apiFetch('/api/employer/company', {
      method: 'PUT',
      body: JSON.stringify({
        registeredName,
        publicName: publicName || registeredName,
        companyName: publicName || registeredName,
        logoDataUrl,
        industry,
        businessCategory,
        companySize,
        yearEstablished: yearEstablished ? Number(yearEstablished) : null,
        website,
        linkedinUrl,
        officialEmail,
        contactNumber,
        headquartersLocation: { city: hqCity, state: hqState, address: hqAddress },
        officeAddresses,
        description,
        cultureDescription,
        benefits,
        achievements,
        authorizedRecruiters: recruiters
      })
    });

    setSaving(false);
    if (!res.ok) {
      setNotice({ type: 'error', text: res.error || 'Failed to update company profile.' });
    } else {
      setNotice({ type: 'success', text: 'Company profile saved cleanly to MongoDB!' });
      await load();
    }
  };

  const addRecruiter = () => {
    if (!recName.trim() || !recEmail.trim()) return;
    setRecruiters((prev) => [
      ...prev,
      {
        name: recName.trim(),
        email: recEmail.trim().toLowerCase(),
        designation: recDesig.trim() || 'Recruiter',
        department: recDept.trim() || 'Human Resources',
        canPublishJobs: true
      }
    ]);
    setRecName('');
    setRecEmail('');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              alt="Company logo"
              className="w-16 h-16 rounded-2xl object-cover border border-[#BDE0FE]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE] flex items-center justify-center text-[#3B9EE8]">
              <Building2 className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1E3A5F]">
                {publicName || registeredName || 'Company Profile'}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {verificationLabel}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Public profiles display only approved company details. Verification documents remain strictly private.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {companyId && (
            <Link
              to={`/companies/${companyId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE] hover:bg-[#D6EEFF]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview Public Profile</span>
            </Link>
          )}
          <Link
            to="/employer/hiring-preferences"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-[#1E3A5F] text-xs font-semibold border border-[#D8ECFA] hover:bg-[#F8FCFF]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Hiring Preferences</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Identity & Contact */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1E3A5F]">Brand Identity & Contact</h2>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE] cursor-pointer hover:bg-[#D6EEFF]">
              <Upload className="w-3.5 h-3.5" />
              <span>Update Logo</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Registered Company Name</label>
              <input
                type="text"
                value={registeredName}
                onChange={(e) => setRegisteredName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Public Display Name</label>
              <input
                type="text"
                required
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Business Category</label>
              <input
                type="text"
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Company Size</label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              >
                {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map((sz) => (
                  <option key={sz} value={sz}>{sz} employees</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Year Established</label>
              <input
                type="number"
                value={yearEstablished}
                onChange={(e) => setYearEstablished(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Official Email</label>
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Contact Number</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#334155] mb-1">Company Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <h2 className="text-base font-bold text-[#1E3A5F]">Headquarters & Office Locations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="HQ City"
              value={hqCity}
              onChange={(e) => setHqCity(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
            <input
              type="text"
              placeholder="HQ State"
              value={hqState}
              onChange={(e) => setHqState(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
            <input
              type="text"
              placeholder="Street Address"
              value={hqAddress}
              onChange={(e) => setHqAddress(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add branch / regional office location"
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!newLocation.trim()) return;
                setOfficeAddresses((prev) => [...prev, newLocation.trim()]);
                setNewLocation('');
              }}
              className="px-4 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
            >
              Add Location
            </button>
          </div>
          {officeAddresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {officeAddresses.map((loc, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7FF] text-xs text-[#1E3A5F] border border-[#BDE0FE]">
                  {loc}
                  <button type="button" onClick={() => setOfficeAddresses((p) => p.filter((_, idx) => idx !== i))} className="text-rose-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Culture, Benefits & Achievements */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <h2 className="text-base font-bold text-[#1E3A5F]">Culture, Benefits & Achievements</h2>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Company Culture</label>
            <textarea
              rows={3}
              value={cultureDescription}
              onChange={(e) => setCultureDescription(e.target.value)}
              placeholder="Describe team values, flexibility, mentorship, and career-restart inclusivity..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#334155]">Employee Benefits</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="e.g., Health Insurance, Flexible Hours"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newBenefit.trim()) return;
                    setBenefits((prev) => [...prev, newBenefit.trim()]);
                    setNewBenefit('');
                  }}
                  className="px-3 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {benefits.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                    {b}
                    <button type="button" onClick={() => setBenefits((p) => p.filter((_, idx) => idx !== i))}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#334155]">Company Achievements</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="e.g., DPIIT Recognized Startup, ISO 9001"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAchievement.trim()) return;
                    setAchievements((prev) => [...prev, newAchievement.trim()]);
                    setNewAchievement('');
                  }}
                  className="px-3 py-2 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {achievements.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs">
                    {a}
                    <button type="button" onClick={() => setAchievements((p) => p.filter((_, idx) => idx !== i))}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Authorized Recruiters */}
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B9EE8]" />
            <h2 className="text-base font-bold text-[#1E3A5F]">Authorized Recruiters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              value={recName}
              onChange={(e) => setRecName(e.target.value)}
              placeholder="Recruiter Name"
              className="px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
            />
            <input
              type="email"
              value={recEmail}
              onChange={(e) => setRecEmail(e.target.value)}
              placeholder="Official Work Email"
              className="px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
            />
            <input
              type="text"
              value={recDesig}
              onChange={(e) => setRecDesig(e.target.value)}
              placeholder="Designation"
              className="px-3 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
            />
            <button
              type="button"
              onClick={addRecruiter}
              className="px-4 py-2 rounded-xl bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#152B47]"
            >
              Add Recruiter
            </button>
          </div>

          {recruiters.length > 0 && (
            <div className="divide-y divide-[#EAF7FF] border border-[#D8ECFA] rounded-2xl overflow-hidden">
              {recruiters.map((r, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between bg-[#F8FCFF] text-xs">
                  <div>
                    <p className="font-bold text-[#1E3A5F]">{r.name}</p>
                    <p className="text-[#64748B]">{r.designation} • {r.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecruiters((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-sm font-bold shadow-sm transition disabled:opacity-60"
          >
            {saving ? 'Saving Changes...' : 'Save Company Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
