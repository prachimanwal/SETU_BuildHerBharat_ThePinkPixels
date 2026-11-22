import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ExternalLink,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, extractArray } from '../utils/api';

export const LearnPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>(
    searchParams.get('tab') === 'assignments' ? 'practical_assignment' : 'all'
  );
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Active assignment modal state
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [workLink, setWorkLink] = useState('');
  const [notes, setNotes] = useState('');
  const [addToPortfolio, setAddToPortfolio] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoadError('');
    try {
      const [resRes, progRes] = await Promise.all([
        apiFetch('/api/seeker/learning'),
        user ? apiFetch('/api/seeker/learning/progress') : Promise.resolve(null)
      ]);

      if (resRes.ok) {
        setResources(extractArray(resRes.data, ['resources', 'results']));
      } else {
        setResources([]);
        setLoadError(resRes.error || 'Unable to load learning resources right now.');
      }

      if (progRes && progRes.ok) {
        setUserProgress(extractArray(progRes.data, ['progress', 'items']));
      } else if (!user) {
        setUserProgress([]);
      }
    } catch (err) {
      console.error('Failed to load learning resources:', err);
      setResources([]);
      setLoadError('Unable to load learning resources right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const openAssignmentModal = (r: any) => {
    setSelectedResource(r);
    const existingProg = (Array.isArray(userProgress) ? userProgress : []).find(
      (p) => p?.resourceId?._id === r._id || p?.resourceId === r._id
    );
    if (existingProg?.submittedWork) {
      setDeliverableTitle(existingProg.submittedWork.title || '');
      setWorkLink(existingProg.submittedWork.link || '');
      setNotes(existingProg.submittedWork.notes || '');
    } else {
      setDeliverableTitle(`${r.title} - Completed Deliverable`);
      setWorkLink('');
      setNotes('');
    }
    setAddToPortfolio(true);
    setSuccessMsg('');
  };

  const handleCompleteAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    setSavingProgress(true);

    try {
      const res = await apiFetch('/api/seeker/learning/progress', {
        method: 'POST',
        body: JSON.stringify({
          resourceId: selectedResource._id,
          status: 'completed',
          submissionUrl: workLink,
          notes,
          submittedWork: {
            title: deliverableTitle,
            link: workLink,
            notes
          },
          addToPortfolio
        })
      });

      if (res.ok) {
        setSuccessMsg(
          addToPortfolio
            ? 'Assignment completed & automatically added to your Portfolio!'
            : 'Assignment marked complete!'
        );
        await loadData();
        setTimeout(() => {
          setSelectedResource(null);
          setSuccessMsg('');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit learning progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterDomain !== 'all' && r.domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-[#292929]">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#FF7847]">
          <BookOpen className="w-4 h-4" />
          <span>Stage 3 & 4: Learn & Practice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#F5F5F5]">
          {language === 'hi' ? 'सीखें और व्यावहारिक अभ्यास करें' : 'Learn & Hands-on Practice'}
        </h1>
        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-3xl">
          Build practical proof-of-work. Complete guided assignments, submit your work sample links, and publish deliverables directly to your portfolio.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#1C1C1C] rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all' ? 'bg-[#151515] text-[#F5F5F5] shadow-sm' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => setFilterType('practical_assignment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              filterType === 'practical_assignment' ? 'bg-[#151515] text-[#FF7847] shadow-sm' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Practice Assignments</span>
          </button>
          <button
            onClick={() => setFilterType('tutorial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'tutorial' ? 'bg-[#151515] text-[#F5F5F5] shadow-sm' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            Tutorials
          </button>
          <button
            onClick={() => setFilterType('refresher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'refresher' ? 'bg-[#151515] text-pink-700 shadow-sm' : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            Build Her Refreshers
          </button>
        </div>

        {/* Domain Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#A3A3A3] font-medium">Domain:</span>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#292929] bg-[#151515] text-[#D4D4D4] font-medium outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          >
            <option value="all">All Domains</option>
            <option value="graphic_design">Graphic Design</option>
            <option value="web_development">Web Development</option>
            <option value="practical_vocational">Practical / Vocational</option>
            <option value="build_her_refresher">Build Her Refreshers</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
          {loadError}
        </div>
      )}

      {/* Resources Grid */}
      {filteredResources.length === 0 && !loadError ? (
        <div className="bg-[#151515] rounded-2xl border border-dashed border-[#333333] p-12 text-center text-[#737373] text-sm">
          No learning resources found for the selected filters.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r, idx) => {
          const prog = (Array.isArray(userProgress) ? userProgress : []).find(
            (p) => p?.resourceId?._id === r._id || p?.resourceId === r._id
          );
          const isCompleted = prog?.status === 'completed';

          return (
            <div
              key={r._id || idx}
              className={`bg-[#151515] rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between space-y-4 ${
                isCompleted ? 'border-emerald-300 bg-emerald-50/10' : 'border-[#292929] hover:border-orange-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1C1C1C] text-[#D4D4D4] uppercase">
                    {r.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-[#A3A3A3]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{r.durationMinutes} mins</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#FF7847] bg-[#1C1C1C] px-2 py-0.5 rounded">
                    {r.skillTag}
                  </span>
                  <h4 className="font-bold text-[#F5F5F5] text-base leading-snug mt-1.5">
                    {r.title}
                  </h4>
                </div>

                <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-3">
                  {r.summary}
                </p>

                {r.assignmentBrief && (
                  <div className="p-3 bg-[#101010] rounded-xl border border-[#292929]/60 text-xs text-[#D4D4D4] space-y-1">
                    <span className="font-bold text-[#F5F5F5] block flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Assignment Goal:</span>
                    </span>
                    <p className="line-clamp-2 text-[11px]">{r.assignmentBrief}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#222222] space-y-2">
                {isCompleted ? (
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-emerald-100 text-emerald-800 font-semibold">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Completed & In Portfolio</span>
                    </span>
                    <button
                      onClick={() => openAssignmentModal(r)}
                      className="text-[11px] text-emerald-950 underline hover:no-underline"
                    >
                      Update
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openAssignmentModal(r)}
                    className="w-full py-2.5 rounded-xl bg-[#E65100] hover:bg-[#FF7847] text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <span>
                      {r.type === 'practical_assignment' ? 'Complete Assignment & Add to Portfolio' : 'Open Tutorial'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Assignment Completion Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#151515] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#292929] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-[#292929] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7847]">
                  {selectedResource.type === 'practical_assignment' ? 'Practical Assignment' : 'Learning Guide'}
                </span>
                <h3 className="font-bold text-[#F5F5F5] text-lg font-serif">
                  {selectedResource.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Instructions / Markdown */}
              <div className="p-4 bg-[#101010] rounded-xl border border-[#292929] text-xs text-[#D4D4D4] space-y-2 whitespace-pre-line">
                <span className="font-bold text-[#F5F5F5] block text-sm">Brief & Instructions:</span>
                {selectedResource.contentMarkdown}
              </div>

              {selectedResource.externalUrl && (
                <div>
                  <a
                    href={selectedResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-[#FF5A1F] hover:underline"
                  >
                    <span>Open external learning reference / tool</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleCompleteAssignment} className="space-y-4 pt-2 border-t border-[#292929]">
                <h4 className="font-bold text-[#F5F5F5] text-sm">
                  Record Deliverable & Proof of Practical Work:
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                    Deliverable Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                    placeholder="e.g. Rural Artisan Recruitment Poster Design"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                    Work Sample Link (Canva, Google Sheets, GitHub, Figma, etc.)
                  </label>
                  <input
                    type="url"
                    value={workLink}
                    onChange={(e) => setWorkLink(e.target.value)}
                    placeholder="e.g. https://www.canva.com/design/DAF.../view"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4D4D4] mb-1">
                    Notes & Deliverable Description
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Applied 60-30-10 color rule with high contrast cards for mobile phone readability."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#333333] text-sm outline-none focus:ring-2 focus:ring-[#FF5A1F]"
                  />
                </div>

                <div className="p-3 bg-[#1C1C1C] rounded-xl border border-orange-200 flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="addPort"
                    checked={addToPortfolio}
                    onChange={(e) => setAddToPortfolio(e.target.checked)}
                    className="rounded text-[#FF5A1F] focus:ring-[#FF5A1F] w-4 h-4"
                  />
                  <label htmlFor="addPort" className="text-xs font-bold text-orange-950 cursor-pointer">
                    Stage 5: Automatically add this completed deliverable to my Public Portfolio
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResource(null)}
                    className="px-4 py-2 rounded-lg border border-[#333333] text-xs font-semibold text-[#D4D4D4] hover:bg-[#1C1C1C]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProgress}
                    className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#FF7847] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {savingProgress ? 'Saving...' : 'Mark Completed & Save to Portfolio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
