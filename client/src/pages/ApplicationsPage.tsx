import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, extractArray } from '../utils/api';

export const ApplicationsPage: React.FC = () => {
  const { language } = useLanguage();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      const res = await apiFetch('/api/seeker/applications');
      if (res.ok) {
        setApplications(extractArray(res.data, ['applications', 'results']));
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Under Review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Shortlisted':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Interview Scheduled':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'Selected':
        return 'bg-green-600 text-white font-bold';
      case 'Rejected':
        return 'bg-[#1C1C1C] text-[#A3A3A3] border-[#292929]';
      default:
        return 'bg-[#1C1C1C] text-[#D4D4D4]';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#A3A3A3]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#FF5A1F] border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#292929]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#FF7847]">
          <Briefcase className="w-4 h-4" />
          <span>Stage 7: Earn & Track Applications</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
          {language === 'hi' ? 'मेरे आवेदन और साक्षात्कार' : 'Application Tracking & Status History'}
        </h1>
        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-2xl">
          Follow your active direct applications, track recruiter updates step-by-step, and access scheduled interview meeting links.
        </p>
      </div>

      {/* External Applications Transparency Notice */}
      <div className="p-3.5 bg-stone-100/80 rounded-xl border border-[#292929] text-xs text-[#A3A3A3] flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-[#737373] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Notice on External Applications:</strong> Clicks on external job links (such as official government portals or third-party careers sites) are not recorded as confirmed applications on SETU. Only direct applications submitted through SETU have automated status tracking and scheduled interview notifications.
        </p>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-[#555555] mx-auto" />
          <h4 className="font-bold text-[#F5F5F5] text-base">No active applications yet</h4>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            You haven't submitted direct applications yet. Explore matched opportunities to submit your profile and portfolio.
          </p>
          <div className="pt-2">
            <Link
              to="/opportunities"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#E65100] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#FF7847] transition"
            >
              <span>Explore Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const opp = app.opportunityId || {};
            const isInterview = app.status === 'Interview Scheduled' && app.interviewDetails?.date;
            const isSelected = app.status === 'Selected';

            return (
              <div
                key={app._id}
                className="bg-[#151515] rounded-2xl border border-[#292929] p-6 shadow-sm space-y-5"
              >
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif text-[#F5F5F5]">
                      {opp.title || 'Role'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A3A3A3] font-medium">
                      {opp.organisationName || app.employerId?.employerProfile?.companyName || 'Employer'} •{' '}
                      {opp.location || 'Location'}
                    </p>
                    <span className="text-[11px] text-[#A3A3A3]">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      app.status
                    )} self-start sm:self-auto`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Scheduled Interview Highlight Card */}
                {isInterview && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <span>Interview Scheduled by Recruiter</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-800">
                        {app.interviewDetails.date} at {app.interviewDetails.time}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="font-semibold text-emerald-900 block mb-0.5">
                          Instructions:
                        </span>
                        <p className="text-emerald-800 leading-relaxed">
                          {app.interviewDetails.instructions || 'Be ready on time.'}
                        </p>
                      </div>

                      {app.interviewDetails.meetLinkOrLocation && (
                        <div className="sm:text-right">
                          <span className="font-semibold text-emerald-900 block mb-1">
                            Meeting Link / Location:
                          </span>
                          <a
                            href={app.interviewDetails.meetLinkOrLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Interview Meeting</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Status Notice */}
                {isSelected && (
                  <div className="bg-emerald-600 text-white rounded-xl p-4 text-xs space-y-1 shadow-sm">
                    <span className="font-bold text-sm block">🎉 Congratulations! You have been selected!</span>
                    <p className="text-emerald-100">
                      The employer has chosen you for this role. Remember: Employers or clients pay workers directly outside the SETU platform according to agreed terms.
                    </p>
                  </div>
                )}

                {/* Status Timeline History */}
                <div className="space-y-2 pt-2 border-t border-[#222222]">
                  <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider block">
                    Status History & Activity Audit:
                  </span>

                  <div className="space-y-2 pl-2 border-l-2 border-[#292929]">
                    {app.timeline?.map((step: any, sIdx: number) => (
                      <div key={sIdx} className="relative pl-3 space-y-0.5">
                        <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1C1C1C]0 ring-4 ring-white" />
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#F5F5F5]">{step.status}</span>
                          <span className="text-[10px] text-[#A3A3A3]">
                            {new Date(step.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {step.note && (
                          <p className="text-xs text-[#A3A3A3] italic">"{step.note}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Snapshot */}
                {app.portfolioProjectsSnapshot?.length > 0 && (
                  <div className="pt-2 border-t border-[#222222] text-xs">
                    <span className="font-semibold text-[#A3A3A3] block mb-1">
                      Portfolio Projects Shared:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {app.portfolioProjectsSnapshot.map((proj: any, pIdx: number) => (
                        <span
                          key={pIdx}
                          className="px-2.5 py-1 rounded-md bg-[#1C1C1C] text-[#E5E5E5] font-medium flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-[#A3A3A3]" />
                          <span>{proj.title}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
