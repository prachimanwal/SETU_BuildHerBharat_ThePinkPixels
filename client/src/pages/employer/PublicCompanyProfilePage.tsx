import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Globe,
  Users,
  Award,
  Briefcase,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { apiFetch, unwrapData, formatLocation } from '../../utils/api';

export const PublicCompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await apiFetch(`/api/companies/${id}/public`);
      if (res.ok && res.data) {
        const data = unwrapData(res.data);
        setCompany(data?.company || null);
        setOpenJobs(Array.isArray(data?.openJobs) ? data.openJobs : []);
      } else {
        setError(res.error || 'Company profile could not be loaded.');
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading public company profile...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-3">
        <Building2 className="w-10 h-10 text-[#94A3B8] mx-auto" />
        <h2 className="text-lg font-bold text-[#1E3A5F]">{error || 'Company not found'}</h2>
        <Link to="/opportunities" className="text-xs font-semibold text-[#2589D6] hover:underline">
          Back to Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to={-1 as any}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E3A5F]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Public Hero */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 sm:p-8 shadow-baby-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {company.logoDataUrl ? (
          <img
            src={company.logoDataUrl}
            alt={company.companyName}
            className="w-20 h-20 rounded-3xl object-cover border border-[#BDE0FE]"
          />
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-[#EAF7FF] border border-[#BDE0FE] flex items-center justify-center text-[#3B9EE8]">
            <Building2 className="w-9 h-9" />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1E3A5F]">{company.companyName}</h1>
            <span
              className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${
                company.isVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {company.verificationBadge}
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            {company.industry}
            {company.businessCategory ? ` • ${company.businessCategory}` : ''}
            {company.yearEstablished ? ` • Est. ${company.yearEstablished}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#475569]">
            {company.headquartersLocation?.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#3B9EE8]" />
                {company.headquartersLocation.city}
                {company.headquartersLocation.state ? `, ${company.headquartersLocation.state}` : ''}
              </span>
            )}
            {company.companySize && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#3B9EE8]" />
                {company.companySize} employees
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#2589D6] hover:underline font-medium"
              >
                <Globe className="w-3.5 h-3.5" /> Official Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* About & Culture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E3A5F]">About {company.companyName}</h2>
            <p className="text-sm text-[#475569] leading-relaxed mt-2 whitespace-pre-line">
              {company.description || 'This employer has not added a company description yet.'}
            </p>
          </div>
          {company.cultureDescription && (
            <div className="pt-3 border-t border-[#EAF7FF]">
              <h3 className="text-sm font-bold text-[#1E3A5F]">Workplace Culture</h3>
              <p className="text-sm text-[#475569] leading-relaxed mt-1.5">
                {company.cultureDescription}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Array.isArray(company.benefits) && company.benefits.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-2.5">
              <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Benefits
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {company.benefits.map((b: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(company.achievements) && company.achievements.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm space-y-2.5">
              <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#3B9EE8]" /> Achievements
              </h3>
              <ul className="space-y-1.5 text-xs text-[#475569]">
                {company.achievements.map((a: string, i: number) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Published Open Jobs */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E3A5F] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#3B9EE8]" />
            Open Positions ({openJobs.length})
          </h2>
          <Link to="/opportunities" className="text-xs font-semibold text-[#2589D6] hover:underline">
            Browse All Opportunities
          </Link>
        </div>
        {openJobs.length === 0 ? (
          <p className="text-xs text-[#64748B] py-6 text-center bg-[#F8FCFF] rounded-2xl border border-dashed border-[#BDE0FE]">
            No active job openings published at this time.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openJobs.map((job) => (
              <div key={job._id} className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-2">
                <h3 className="text-sm font-bold text-[#1E3A5F]">{job.title}</h3>
                <p className="text-xs text-[#64748B]">
                  {formatLocation(job.location)} • {job.workMode} • {job.stipendOrSalary}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(job.requiredSkills || []).slice(0, 5).map((sk: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-[#1E3A5F] border border-[#D8ECFA]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
