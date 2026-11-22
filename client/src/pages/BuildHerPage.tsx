import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Briefcase,
  BookOpen,
  Shield,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Coins,
  Compass,
  Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, unwrapData } from '../utils/api';

export const BuildHerPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Confidential Form State
  const [name, setName] = useState(user?.name || '');
  const [contact, setContact] = useState(user?.email || '');
  const [category, setCategory] = useState<any>('workplace_safety_posh');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    apiFetch('/api/public/build-her')
      .then((res) => {
        if (res.ok && res.data) {
          setResources(unwrapData(res.data));
        }
      })
      .catch((err) => console.error('Failed to load Build Her resources:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const res = await apiFetch('/api/seeker/support-ticket', {
        method: 'POST',
        body: JSON.stringify({
          name,
          contactEmailOrPhone: contact,
          category,
          subject,
          message,
          isConfidential: true
        })
      });

      if (!res.ok) {
        setFormError(res.error || 'Failed to submit message');
      } else {
        setFormSuccess(
          'Your confidential message has been received by SETU administrators. We treat safety reports with strict discretion.'
        );
        setSubject('');
        setMessage('');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#A3A3A3]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading Build Her sanctuary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Build Her Hero */}
      <section className="bg-gradient-to-r from-pink-900 via-purple-950 to-[#1E1B4B] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-pink-900">
        <div className="max-w-5xl mx-auto space-y-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-pink-500/20 border border-pink-400/30 px-3 py-1 rounded-full text-xs text-pink-200">
              <Heart className="w-3.5 h-3.5 fill-pink-300 text-pink-300" />
              <span>SETU Women Career Restart Initiative</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight">
              Build Her: हुनर से स्वावलंबन तक
            </h1>
            <p className="text-sm sm:text-base text-pink-100/90 leading-relaxed">
              A dedicated hub for women returning to the workforce after a family break, aspiring entrepreneurs, and women seeking financial independence with dignity and safety.
            </p>
          </div>

          <a
            href="#support-desk"
            className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg transition self-center sm:self-auto shrink-0 flex items-center space-x-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Confidential Support Desk</span>
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section 1: Career Restart Opportunities */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#292929]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#F5F5F5] flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-pink-600" />
                <span>Career Restart Opportunities</span>
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Verified listings specifically designed for career transitions, flexible hours, and returnee mentorship.
              </p>
            </div>
            <Link
              to="/opportunities"
              className="text-xs font-semibold text-pink-700 hover:text-pink-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Array.isArray(resources?.restartOpportunities) ? resources.restartOpportunities : []).map((opp: any, idx: number) => (
              <div
                key={opp._id || idx}
                className="bg-[#151515] rounded-2xl border border-pink-100 p-5 shadow-sm hover:border-pink-300 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                    {(opp.workMode || 'hybrid').toUpperCase()} • {(opp.opportunityType || 'job').replace('_', ' ')}
                  </span>
                  <h4 className="font-bold text-[#F5F5F5] text-base">{opp.title}</h4>
                  <p className="text-xs text-[#A3A3A3] font-medium">{opp.organisationName}</p>
                  <p className="text-xs text-[#A3A3A3] line-clamp-2">{opp.description}</p>
                </div>

                <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">
                    {opp.stipendOrSalary || opp.salaryOrStipend || 'Competitive'}
                  </span>
                  <Link
                    to="/opportunities"
                    className="font-bold text-pink-700 hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Refreshers & Digital Confidence */}
        <section className="space-y-4">
          <div className="pb-2 border-b border-[#292929]">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#F5F5F5] flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>Skill Refreshers & Digital Workplace Confidence</span>
            </h2>
            <p className="text-xs text-[#A3A3A3]">
              Short, empowering modules on remote collaboration, async communication, and translating family caregiving into valuable management assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(Array.isArray(resources?.refreshers) ? resources.refreshers : []).map((ref: any, idx: number) => (
              <div
                key={ref._id || idx}
                className="bg-[#151515] rounded-2xl border border-[#292929] p-5 shadow-sm space-y-3 hover:border-purple-300 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {ref.skillTag}
                  </span>
                  <span className="text-[#737373]">{ref.durationMinutes} mins</span>
                </div>
                <h4 className="font-bold text-[#F5F5F5] text-base">{ref.title}</h4>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{ref.summary}</p>
                <div className="pt-2">
                  <Link
                    to="/learn"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-800 hover:underline"
                  >
                    <span>Open Refresher Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Financial Independence & Micro-Enterprises */}
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 sm:p-8 border border-amber-200 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <Coins className="w-4 h-4" />
              <span>Financial Independence & Self-Reliance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#F5F5F5]">
              Micro-Credit, Mudra Loans & Self-Help Group Schemes
            </h2>
            <p className="text-xs sm:text-sm text-amber-900/80 max-w-2xl">
              Verified national initiatives supporting women setting up home enterprises, handicraft collectives, or independent digital services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#151515] p-4 rounded-xl border border-amber-200/80 space-y-2">
              <span className="font-bold text-amber-900 text-sm block">Stand-Up India Scheme</span>
              <p className="text-[#D4D4D4] leading-relaxed">
                Bank loans from ₹10 Lakh to ₹1 Crore for at least one woman entrepreneur per bank branch for manufacturing, service, or agri-allied trading ventures.
              </p>
              <a
                href="https://www.standupmitra.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-800 hover:underline inline-block pt-1"
              >
                Learn more on standupmitra.in →
              </a>
            </div>

            <div className="bg-[#151515] p-4 rounded-xl border border-amber-200/80 space-y-2">
              <span className="font-bold text-amber-900 text-sm block">Mahila Samriddhi Yojana (MSY)</span>
              <p className="text-[#D4D4D4] leading-relaxed">
                Micro-finance loans up to ₹1,40,000 provided through women Self Help Groups (SHGs) at a low 4% annual interest rate for income-generating micro-enterprises.
              </p>
              <a
                href="https://nbcfdc.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-800 hover:underline inline-block pt-1"
              >
                Learn more on nbcfdc.gov.in →
              </a>
            </div>
          </div>
        </section>

        {/* Section 4: Workplace Safety & POSH Act Rights */}
        <section className="bg-[#151515] rounded-2xl border border-[#292929] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#F5F5F5]">
                Workplace Safety, Dignity & The POSH Act 2013
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Your legal rights and protections in professional physical and remote workspaces across India.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <span className="font-bold text-[#F5F5F5] text-sm block">Key Legal Protections:</span>
              <ul className="space-y-2 text-[#D4D4D4]">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mandatory ICC:</strong> Every organization with 10+ employees must maintain an Internal Complaints Committee (ICC) presided by a senior woman.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Remote Workplace Protection:</strong> Virtual communication (video calls, WhatsApp, emails) is fully governed under workplace harassment definitions.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Non-Retaliation Guarantee:</strong> Employers cannot terminate or adversely affect compensation during or after a report inquiry.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Equal Remuneration Act:</strong> Strict entitlement to equal pay for equal work without gender bias.
                  </span>
                </li>
              </ul>
            </div>

            {/* Helplines Box */}
            <div className="bg-[#101010] rounded-xl p-5 border border-[#292929] space-y-3">
              <span className="font-bold text-[#F5F5F5] text-sm block flex items-center space-x-1.5">
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <span>Confirmed National Emergency & Support Numbers:</span>
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[#151515] border border-[#292929]">
                  <span className="font-medium text-[#D4D4D4]">National Commission for Women (NCW):</span>
                  <span className="font-mono font-bold text-rose-700">7827170170</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#151515] border border-[#292929]">
                  <span className="font-medium text-[#D4D4D4]">Women Helpline (Pan-India):</span>
                  <span className="font-mono font-bold text-rose-700">1091</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#151515] border border-[#292929]">
                  <span className="font-medium text-[#D4D4D4]">National Emergency Response (Police/Ambulance):</span>
                  <span className="font-mono font-bold text-rose-700">112</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#151515] border border-[#292929]">
                  <span className="font-medium text-[#D4D4D4]">Domestic & Workplace Distress:</span>
                  <span className="font-mono font-bold text-rose-700">181</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Mentorship Frameworks (No complex bookings needed) */}
        <section className="bg-[#151515] rounded-2xl border border-[#292929] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-700" />
            <h3 className="text-lg font-bold font-serif text-[#F5F5F5]">
              Returnee Mentorship Framework & Community Circles
            </h3>
          </div>
          <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-3xl">
            We partner with regional self-help groups, certified industry mentorship circles, and professional peer collectives. Follow these structured frameworks to connect with returning women professionals in your district.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3.5 bg-[#101010] rounded-xl border border-[#292929] space-y-1">
              <span className="font-bold text-[#F5F5F5] block">1. 30-Day Transition Circle</span>
              <p className="text-[#A3A3A3]">Weekly structured check-ins on goal setting and interview prep.</p>
            </div>
            <div className="p-3.5 bg-[#101010] rounded-xl border border-[#292929] space-y-1">
              <span className="font-bold text-[#F5F5F5] block">2. Peer Portfolio Reviews</span>
              <p className="text-[#A3A3A3]">Constructive feedback on Canva flyers and spreadsheet samples.</p>
            </div>
            <div className="p-3.5 bg-[#101010] rounded-xl border border-[#292929] space-y-1">
              <span className="font-bold text-[#F5F5F5] block">3. District Artisan Collectives</span>
              <p className="text-[#A3A3A3]">Direct links with Haryana and NCR women-led MSME clusters.</p>
            </div>
          </div>
        </section>

        {/* Section 6: Confidential Support & Complaint Desk */}
        <section id="support-desk" className="bg-[#151515] rounded-2xl border border-[#292929] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Admin Moderation Desk</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#F5F5F5]">
              Confidential Support & Complaint Desk
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-2xl">
              Need guidance, faced workplace misconduct, or have concerns about an employer? This message is encrypted, private, and delivered straight to the SETU administrator desk.
            </p>
          </div>

          {formSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSupportSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                  Confidential Contact (Email or Phone) *
                </label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9876543210 or name@example.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">Category of Inquiry</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="workplace_safety_posh">Workplace Safety & POSH Act Inquiry</option>
                <option value="career_guidance">Career Transition & Restart Guidance</option>
                <option value="wage_payment_issue">Payment / Stipend Discrepancy</option>
                <option value="discrimination">Bias or Discrimination Report</option>
                <option value="general_support">General Confidential Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of what you would like to discuss"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                Your Private Message *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your experience or question in complete confidence. Only vetted SETU administrators have access to this desk."
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Confidentially...' : 'Submit Message Privately'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
