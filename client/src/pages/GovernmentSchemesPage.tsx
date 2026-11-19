import React, { useEffect, useState } from 'react';
import {
  Landmark,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const GovernmentSchemesPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  // Admin Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [ministry, setMinistry] = useState('');
  const [category, setCategory] = useState<any>('skill_training');
  const [targetAudience, setTargetAudience] = useState('all, youth');
  const [benefitsSummary, setBenefitsSummary] = useState('');
  const [eligibilitySummary, setEligibilitySummary] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [lastReviewedDate, setLastReviewedDate] = useState('2026-02-15');
  const [submitting, setSubmitting] = useState(false);

  const loadSchemes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (audienceFilter !== 'all') params.append('audience', audienceFilter);

      const res = await fetch(`/api/public/schemes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSchemes(data || []);
      }
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [categoryFilter, audienceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadSchemes();
  };

  const openAddModal = () => {
    setEditingScheme(null);
    setTitle('');
    setHindiTitle('');
    setMinistry('');
    setCategory('skill_training');
    setTargetAudience('all, youth');
    setBenefitsSummary('');
    setEligibilitySummary('');
    setOfficialUrl('');
    setLastReviewedDate(new Date().toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingScheme(s);
    setTitle(s.title);
    setHindiTitle(s.hindiTitle || '');
    setMinistry(s.ministryOrDepartment);
    setCategory(s.category);
    setTargetAudience(s.targetAudience?.join(', ') || 'all');
    setBenefitsSummary(s.benefitsSummary);
    setEligibilitySummary(s.eligibilitySummary);
    setOfficialUrl(s.officialUrl);
    setLastReviewedDate(s.lastReviewedDate || '2026-02-15');
    setModalOpen(true);
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      hindiTitle,
      ministryOrDepartment: ministry,
      category,
      targetAudience: targetAudience.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean),
      benefitsSummary,
      eligibilitySummary,
      officialUrl,
      lastReviewedDate
    };

    try {
      let res;
      if (editingScheme) {
        res = await fetch(`/api/admin/schemes/${editingScheme._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/schemes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setModalOpen(false);
        await loadSchemes();
      }
    } catch (err) {
      console.error('Failed to save scheme:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    if (!window.confirm('Delete this government scheme entry?')) return;
    try {
      const res = await fetch(`/api/admin/schemes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await loadSchemes();
      }
    } catch (err) {
      console.error('Failed to delete scheme:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#292929] gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Landmark className="w-4 h-4" />
            <span>Verified Public Resources</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
            {language === 'hi' ? 'सरकारी कौशल एवं रोजगार योजनाएं' : 'Government Skilling & Employment Schemes'}
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-2xl mt-0.5">
            Curated directory of Central & State initiatives (PMKVY, NAPS, PM Vishwakarma, Stand-Up India) with confirmed official government links.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scheme (Admin)</span>
          </button>
        )}
      </div>

      {/* Official Disclaimer Alert */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
        <div className="flex items-center space-x-2 font-bold">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Important Advisory & Transparency Notice:</span>
        </div>
        <p className="text-amber-800 text-[11px] leading-relaxed pl-6">
          SETU does not claim that a user automatically qualifies for any scheme based solely on their profile. Scheme criteria, verification, and funding disbursement are strictly managed by respective Union or State ministries. We provide verified official links (.gov.in) to protect citizens from phishing scams.
        </p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="bg-[#151515] rounded-2xl border border-[#292929] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#555555] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scheme name, ministry, or benefits..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#333333] text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#333333] bg-[#151515] text-xs sm:text-sm text-[#D4D4D4] font-medium outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="skill_training">Skill Training</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="self_employment">Self-Employment</option>
              <option value="financial_assistance">Financial Assistance</option>
              <option value="women_empowerment">Women Empowerment</option>
            </select>
          </div>

          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#333333] bg-[#151515] text-xs sm:text-sm text-[#D4D4D4] font-medium outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Audiences</option>
              <option value="women">Women</option>
              <option value="youth">Youth</option>
              <option value="rural">Rural</option>
              <option value="artisans">Artisans / Craftspeople</option>
              <option value="entrepreneurs">Entrepreneurs</option>
            </select>
          </div>
        </div>
      </form>

      {/* Schemes Grid */}
      {loading ? (
        <div className="text-center py-16 text-[#737373]">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm">Loading verified government schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373]">
          No schemes found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((s) => (
            <div
              key={s._id}
              className="bg-[#151515] rounded-2xl border border-[#292929] p-6 shadow-sm hover:border-amber-300 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                    {s.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#A3A3A3]">
                    Reviewed: {s.lastReviewedDate || 'Confirmed Active'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold font-serif text-[#F5F5F5] leading-snug">
                    {s.title}
                  </h3>
                  {s.hindiTitle && (
                    <p className="text-xs text-amber-900 font-serif mt-0.5">{s.hindiTitle}</p>
                  )}
                  <p className="text-xs text-[#A3A3A3] mt-1">{s.ministryOrDepartment}</p>
                </div>

                {/* Target Audience Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {s.targetAudience?.map((aud: string, aIdx: number) => (
                    <span
                      key={aIdx}
                      className="bg-[#1C1C1C] text-[#D4D4D4] px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                    >
                      {aud}
                    </span>
                  ))}
                </div>

                <div className="p-3 bg-[#101010] rounded-xl border border-[#222222] text-xs space-y-2">
                  <div>
                    <span className="font-bold text-[#F5F5F5] block mb-0.5">Benefits:</span>
                    <p className="text-[#D4D4D4] leading-relaxed text-[11px]">{s.benefitsSummary}</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#F5F5F5] block mb-0.5">Eligibility:</span>
                    <p className="text-[#D4D4D4] leading-relaxed text-[11px]">{s.eligibilitySummary}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
                <a
                  href={s.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm"
                >
                  <span>Official Portal (.gov.in)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-[#737373] hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                      title="Edit Scheme"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteScheme(s._id)}
                      className="p-1.5 text-[#737373] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Scheme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-xl w-full shadow-2xl border border-[#292929] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <h3 className="font-bold text-[#F5F5F5] text-base font-serif">
                {editingScheme ? 'Edit Government Scheme' : 'Add Government Scheme (Admin)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Scheme Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Hindi Title</label>
                <input
                  type="text"
                  value={hindiTitle}
                  onChange={(e) => setHindiTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Ministry / Dept *</label>
                <input
                  type="text"
                  required
                  value={ministry}
                  onChange={(e) => setMinistry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] bg-[#151515] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="skill_training">Skill Training</option>
                    <option value="apprenticeship">Apprenticeship</option>
                    <option value="self_employment">Self-Employment</option>
                    <option value="financial_assistance">Financial Assistance</option>
                    <option value="women_empowerment">Women Empowerment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#D4D4D4] mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. women, youth, rural"
                    className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Official URL (.gov.in) *</label>
                <input
                  type="url"
                  required
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Benefits Summary *</label>
                <textarea
                  required
                  rows={2}
                  value={benefitsSummary}
                  onChange={(e) => setBenefitsSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#D4D4D4] mb-1">Eligibility Summary *</label>
                <textarea
                  required
                  rows={2}
                  value={eligibilitySummary}
                  onChange={(e) => setEligibilitySummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#292929]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#333333] font-semibold hover:bg-[#1C1C1C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
