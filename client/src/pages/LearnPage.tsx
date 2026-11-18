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

export const LearnPage: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>(
    searchParams.get('tab') === 'assignments' ? 'practical_assignment' : 'all'
  );
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Active assignment modal state
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [workLink, setWorkLink] = useState('');
  const [notes, setNotes] = useState('');
  const [addToPortfolio, setAddToPortfolio] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [resRes, progRes] = await Promise.all([
        fetch('/api/seeker/learning', { credentials: 'include' }),
        fetch('/api/seeker/learning/progress', { credentials: 'include' })
      ]);

      if (resRes.ok) {
        const rData = await resRes.json();
        setResources(rData || []);
      }

      if (progRes.ok) {
        const pData = await progRes.json();
        setUserProgress(pData || []);
      }
    } catch (err) {
      console.error('Failed to load learning resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignmentModal = (r: any) => {
    setSelectedResource(r);
    const existingProg = userProgress.find((p) => p.resourceId?._id === r._id || p.resourceId === r._id);
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
      const res = await fetch('/api/seeker/learning/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resourceId: selectedResource._id,
          status: 'completed',
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
      <div className="space-y-1 pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-700">
          <BookOpen className="w-4 h-4" />
          <span>Stage 3 & 4: Learn & Practice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          {language === 'hi' ? 'सीखें और व्यावहारिक अभ्यास करें' : 'Learn & Hands-on Practice'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-3xl">
          Build practical proof-of-work. Complete guided assignments, submit your work sample links, and publish deliverables directly to your portfolio.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex items-center space-x-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => setFilterType('practical_assignment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
              filterType === 'practical_assignment' ? 'bg-white text-orange-700 shadow-sm' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Practice Assignments</span>
          </button>
          <button
            onClick={() => setFilterType('tutorial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'tutorial' ? 'bg-white text-slate-900 shadow-sm' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            Tutorials
          </button>
          <button
            onClick={() => setFilterType('refresher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'refresher' ? 'bg-white text-pink-700 shadow-sm' : 'text-stone-600 hover:text-slate-900'
            }`}
          >
            Build Her Refreshers
          </button>
        </div>

        {/* Domain Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-stone-600 font-medium">Domain:</span>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 font-medium outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Domains</option>
            <option value="graphic_design">Graphic Design</option>
            <option value="web_development">Web Development</option>
            <option value="practical_vocational">Practical / Vocational</option>
            <option value="build_her_refresher">Build Her Refreshers</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r) => {
          const prog = userProgress.find((p) => p.resourceId?._id === r._id || p.resourceId === r._id);
          const isCompleted = prog?.status === 'completed';

          return (
            <div
              key={r._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between space-y-4 ${
                isCompleted ? 'border-emerald-300 bg-emerald-50/10' : 'border-stone-200 hover:border-orange-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase">
                    {r.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-stone-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{r.durationMinutes} mins</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                    {r.skillTag}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base leading-snug mt-1.5">
                    {r.title}
                  </h4>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {r.summary}
                </p>

                {r.assignmentBrief && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-700 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Assignment Goal:</span>
                    </span>
                    <p className="line-clamp-2 text-[11px]">{r.assignmentBrief}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2">
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
                    className="w-full py-2.5 rounded-xl bg-[#E65100] hover:bg-orange-700 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
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

      {/* Assignment Completion Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                  {selectedResource.type === 'practical_assignment' ? 'Practical Assignment' : 'Learning Guide'}
                </span>
                <h3 className="font-bold text-slate-900 text-lg font-serif">
                  {selectedResource.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
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
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-2 whitespace-pre-line">
                <span className="font-bold text-slate-900 block text-sm">Brief & Instructions:</span>
                {selectedResource.contentMarkdown}
              </div>

              {selectedResource.externalUrl && (
                <div>
                  <a
                    href={selectedResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-orange-600 hover:underline"
                  >
                    <span>Open external learning reference / tool</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleCompleteAssignment} className="space-y-4 pt-2 border-t border-stone-200">
                <h4 className="font-bold text-slate-900 text-sm">
                  Record Deliverable & Proof of Practical Work:
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Deliverable Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                    placeholder="e.g. Rural Artisan Recruitment Poster Design"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Work Sample Link (Canva, Google Sheets, GitHub, Figma, etc.)
                  </label>
                  <input
                    type="url"
                    value={workLink}
                    onChange={(e) => setWorkLink(e.target.value)}
                    placeholder="e.g. https://www.canva.com/design/DAF.../view"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Notes & Deliverable Description
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Applied 60-30-10 color rule with high contrast cards for mobile phone readability."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="addPort"
                    checked={addToPortfolio}
                    onChange={(e) => setAddToPortfolio(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <label htmlFor="addPort" className="text-xs font-bold text-orange-950 cursor-pointer">
                    Stage 5: Automatically add this completed deliverable to my Public Portfolio
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResource(null)}
                    className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProgress}
                    className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
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
