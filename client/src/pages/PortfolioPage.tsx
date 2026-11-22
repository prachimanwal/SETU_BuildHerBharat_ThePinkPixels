import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, extractArray } from '../utils/api';

export const PortfolioPage: React.FC = () => {
  const { language } = useLanguage();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [workSampleUrl, setWorkSampleUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProjects = async () => {
    try {
      const res = await apiFetch('/api/seeker/portfolio');
      if (res.ok) {
        setProjects(extractArray(res.data, ['projects', 'results']));
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setSkills('');
    setWorkSampleUrl('');
    setFeatured(false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setTitle(p.title);
    setDescription(p.description);
    setSkills((Array.isArray(p.skills) ? p.skills : []).join(', '));
    setWorkSampleUrl(p.workSampleUrl || '');
    setFeatured(!!p.featured);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      title,
      description,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      workSampleUrl,
      featured
    };

    try {
      const res = editingProject
        ? await apiFetch(`/api/seeker/portfolio/${editingProject._id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiFetch('/api/seeker/portfolio', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to save project');
      } else {
        setModalOpen(false);
        await loadProjects();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this portfolio project?')) return;

    try {
      const res = await apiFetch(`/api/seeker/portfolio/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadProjects();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium">Loading portfolio projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D8ECFA] gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2589D6]">
            <Layers className="w-4 h-4" />
            <span>Stage 5: Build Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#334155]">
            {language === 'hi' ? 'मेरा व्यावहारिक पोर्टफोलियो' : 'My Practical Work Portfolio'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl mt-0.5">
            Demonstrate your capabilities through real projects and completed assignments. Employers review these directly when you apply on SETU.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#BDE0FE] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EAF7FF] text-[#3B9EE8] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-[#334155] text-base">Your portfolio is currently empty</h4>
            <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
              Complete a practical assignment in the Learn section or manually add work you've created outside SETU.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-[#E65100] text-white font-semibold text-xs"
            >
              Add Project Manually
            </button>
            <a
              href="/learn?tab=assignments"
              className="px-4 py-2 rounded-lg border border-[#BDE0FE] text-[#475569] font-semibold text-xs hover:bg-[#F8FCFF]"
            >
              Take Practical Assignment
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl border border-[#D8ECFA] p-5 shadow-sm hover:border-[#A2D2FF] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.source === 'practice_assignment'
                        ? 'bg-[#EAF7FF] text-[#2589D6] border border-[#BDE0FE]'
                        : 'bg-[#EAF7FF] text-[#475569]'
                    }`}
                  >
                    {p.source === 'practice_assignment' ? 'Practice Deliverable' : 'Self Created'}
                  </span>
                  {p.featured && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ★ Featured
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-[#334155] text-base leading-snug">{p.title}</h4>

                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-4">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.skills?.map((s: string, sIdx: number) => (
                    <span
                      key={sIdx}
                      className="bg-[#EAF7FF] text-[#475569] px-2 py-0.5 rounded text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAF7FF] flex items-center justify-between text-xs">
                {p.workSampleUrl ? (
                  <a
                    href={p.workSampleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#2589D6] hover:underline flex items-center space-x-1"
                  >
                    <span>View Work Sample</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-[#64748B] italic">No link attached</span>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-[#64748B] hover:text-[#334155] hover:bg-[#EAF7FF] rounded-lg transition"
                    title="Edit Project"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#EAF7FF]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#D8ECFA] animate-in zoom-in-95">
            <div className="p-5 border-b border-[#D8ECFA] flex items-center justify-between">
              <h3 className="font-bold text-[#334155] text-base font-serif">
                {editingProject ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EAF7FF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Canva Recruitment Campaign Poster"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Skills & Tools Used (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Canva, Graphic Design, Social Media"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Work Sample Link (Canva, Drive, GitHub, Figma, etc.)
                </label>
                <input
                  type="url"
                  value={workSampleUrl}
                  onChange={(e) => setWorkSampleUrl(e.target.value)}
                  placeholder="e.g. https://www.canva.com/design/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Project Description & Outcomes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you built, the audience, and key highlights..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#BDE0FE] text-sm outline-none focus:ring-2 focus:ring-[#BDE0FE]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="feat"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-[#3B9EE8] focus:ring-[#BDE0FE] w-4 h-4"
                />
                <label htmlFor="feat" className="text-xs text-[#475569] font-medium cursor-pointer">
                  Feature this project prominently on top of my applications
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D8ECFA]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#BDE0FE] text-xs font-semibold text-[#475569] hover:bg-[#EAF7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#E65100] hover:bg-[#8CC6FA] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
