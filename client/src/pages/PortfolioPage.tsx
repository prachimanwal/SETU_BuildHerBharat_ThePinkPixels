import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Upload,
  Download,
  Star,
  Lock,
  Unlock,
  Code2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, extractArray, unwrapData } from '../utils/api';
import { ResumeBuilderModal } from '../components/ResumeBuilderModal';
import { ResumeUploadReviewModal } from '../components/ResumeUploadReviewModal';

export const PortfolioPage: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Resume Builder & Upload Modals
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [editingResume, setEditingResume] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSavedResumes, setShowSavedResumes] = useState(
    searchParams.get('tab') === 'resume'
  );

  // Project Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [projectType, setProjectType] = useState<'Individual' | 'Team'>('Individual');
  const [role, setRole] = useState('');
  const [duration, setDuration] = useState('');
  const [workSampleUrl, setWorkSampleUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [improvingDesc, setImprovingDesc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [projRes, resRes] = await Promise.all([
        apiFetch('/api/portfolio'),
        apiFetch('/api/resumes')
      ]);

      if (projRes.ok) {
        setProjects(extractArray(projRes.data, ['projects', 'results']));
      } else {
        setProjects([]);
        setLoadError(projRes.error || 'Could not load your portfolio right now.');
      }

      if (resRes.ok && resRes.data) {
        const payload = unwrapData(resRes.data) || {};
        setResumes(Array.isArray(payload.resumes) ? payload.resumes : []);
        setUploadedFiles(Array.isArray(payload.uploadedFiles) ? payload.uploadedFiles : []);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to connect to SETU Portfolio service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'build') {
      setEditingResume(null);
      setShowResumeBuilder(true);
    } else if (searchParams.get('action') === 'upload') {
      setShowUploadModal(true);
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setSkills('');
    setTechnologies('');
    setProjectType('Individual');
    setRole('');
    setDuration('');
    setWorkSampleUrl('');
    setGithubUrl('');
    setDocumentUrl('');
    setFeatured(false);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setTitle(p.title || '');
    setDescription(p.description || '');
    setSkills((Array.isArray(p.skills) ? p.skills : []).join(', '));
    setTechnologies((Array.isArray(p.technologies) ? p.technologies : []).join(', '));
    setProjectType(p.projectType === 'Team' ? 'Team' : 'Individual');
    setRole(p.role || '');
    setDuration(p.duration || '');
    setWorkSampleUrl(p.workSampleUrl || '');
    setGithubUrl(p.githubUrl || '');
    setDocumentUrl(p.documentUrl || '');
    setFeatured(Boolean(p.featured));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleImproveProjectDesc = async () => {
    if (!title.trim() && !description.trim()) {
      setErrorMsg('Enter a project title and brief draft description first.');
      return;
    }
    setImprovingDesc(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/resumes/improve-project', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          technologies: technologies
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          role: role.trim()
        })
      });
      if (res.ok) {
        const data = unwrapData(res.data);
        if (data?.improvedDescription) {
          setDescription(data.improvedDescription);
        }
      } else {
        setErrorMsg(res.error || 'Could not improve description right now.');
      }
    } finally {
      setImprovingDesc(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      technologies: technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      projectType,
      role: role.trim(),
      duration: duration.trim(),
      workSampleUrl: workSampleUrl.trim(),
      githubUrl: githubUrl.trim(),
      documentUrl: documentUrl.trim(),
      featured
    };

    try {
      const res = editingProject
        ? await apiFetch(`/api/portfolio/${editingProject._id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiFetch('/api/portfolio', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to save project');
      } else {
        setModalOpen(false);
        await loadAll();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Remove this project from your portfolio?')) return;
    const res = await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    if (res.ok) await loadAll();
  };

  const handleSetDefaultResume = async (id: string) => {
    const res = await apiFetch(`/api/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isDefault: true })
    });
    if (res.ok) await loadAll();
  };

  const handleDeleteResume = async (id: string) => {
    if (!window.confirm('Delete this saved resume version?')) return;
    const res = await apiFetch(`/api/resumes/${id}`, { method: 'DELETE' });
    if (res.ok) await loadAll();
  };

  const handleToggleUploadShare = async (id: string, nextVal: boolean) => {
    const res = await apiFetch(`/api/resumes/upload/${id}/sharing`, {
      method: 'PATCH',
      body: JSON.stringify({ shareWithEmployers: nextVal })
    });
    if (res.ok) await loadAll();
  };

  const handleDeleteUpload = async (id: string) => {
    if (!window.confirm('Delete this uploaded resume file permanently?')) return;
    const res = await apiFetch(`/api/resumes/upload/${id}`, { method: 'DELETE' });
    if (res.ok) await loadAll();
  };

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 2.1 Prominent Resume Builder Hero Card */}
      <section className="bg-gradient-to-r from-[#EAF7FF] via-white to-[#FCE7F3]/50 rounded-3xl border border-[#BDE0FE] p-6 sm:p-8 shadow-baby space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2589D6] bg-white px-3 py-1 rounded-full border border-[#BDE0FE]">
              <FileText className="w-3.5 h-3.5" />
              <span>SETU Resume Studio &amp; Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#334155] font-display">
              Build Your Professional Resume
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Create a professional, job-ready resume using your SETU profile, skills, education,
              and projects. Export selectable-text PDF &amp; DOCX files or manage your uploaded
              resumes securely.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingResume(null);
                setShowResumeBuilder(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-extrabold shadow-baby-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create My Resume</span>
            </button>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white hover:bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold transition"
            >
              <Upload className="w-4 h-4 text-[#3B9EE8]" />
              <span>Upload Existing Resume</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSavedResumes((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#F8FCFF] hover:bg-[#EAF7FF] text-[#334155] border border-[#D8ECFA] text-xs font-bold transition"
            >
              <FileText className="w-4 h-4 text-[#3B9EE8]" />
              <span>View Saved Resumes ({resumes.length + uploadedFiles.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Saved Resumes & Uploaded Resume Manager */}
      {(showSavedResumes || resumes.length > 0 || uploadedFiles.length > 0) && (
        <section className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-[#334155] font-display">
              My Saved &amp; Uploaded Resumes
            </h2>
            <span className="text-[11px] text-[#64748B]">
              Private by default — never shared with recruiters without your permission
            </span>
          </div>

          {resumes.length === 0 && uploadedFiles.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-center text-xs text-[#64748B]">
              No resumes created or uploaded yet. Click <strong>Create My Resume</strong> or{' '}
              <strong>Upload Existing Resume</strong> above to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-bold text-[#334155]">{r.versionName}</h3>
                        {r.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Star className="w-3 h-3" /> Default
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#BDE0FE] text-[#1E3A5F] capitalize">
                          {r.status || 'draft'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Template: {String(r.template || 'ats_professional').replace(/_/g, ' ')} •
                        Updated {new Date(r.updatedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAF7FF]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingResume(r);
                        setShowResumeBuilder(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF7FF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F]"
                    >
                      Edit
                    </button>
                    <a
                      href={`${apiBase}/api/resumes/${r._id}/download/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] hover:bg-[#D6EEFF] border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F]"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                    <a
                      href={`${apiBase}/api/resumes/${r._id}/download/docx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF7FF] border border-[#D8ECFA] text-xs font-bold text-[#334155]"
                    >
                      <Download className="w-3.5 h-3.5" /> DOCX
                    </a>
                    {!r.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultResume(r._id)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#D8ECFA] text-[11px] font-semibold text-[#64748B] hover:text-[#1E3A5F]"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteResume(r._id)}
                      className="p-1.5 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 ml-auto"
                      aria-label="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {uploadedFiles.map((uf) => (
                <div
                  key={uf._id}
                  className="p-4 rounded-2xl bg-[#FCE7F3]/25 border border-pink-200/70 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-pink-200 text-pink-700 mb-1">
                        Uploaded Resume File
                      </span>
                      <h3 className="text-sm font-bold text-[#334155] truncate">
                        {uf.originalFilename}
                      </h3>
                      <p className="text-[11px] text-[#64748B]">
                        {(uf.sizeBytes / 1024).toFixed(0)} KB • Uploaded{' '}
                        {new Date(uf.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-pink-200/50">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('setu_auth_token');
                          const res = await fetch(`${apiBase}/api/resumes/upload/${uf._id}/download`, {
                            credentials: 'include',
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                          });
                          if (!res.ok) return;
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = uf.originalFilename || 'SETU_Resume';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          // ignore
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#BDE0FE] text-xs font-bold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleUploadShare(uf._id, !uf.shareWithEmployers)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        uf.shareWithEmployers
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-[#D8ECFA] text-[#64748B]'
                      }`}
                    >
                      {uf.shareWithEmployers ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Shared w/ Employers
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Private
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#D8ECFA] text-[11px] font-semibold text-[#334155]"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUpload(uf._id)}
                      className="p-1.5 rounded-xl text-[#64748B] hover:text-rose-600 hover:bg-rose-50 ml-auto"
                      aria-label="Delete uploaded file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Portfolio Projects Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2589D6]">
              <Layers className="w-4 h-4" />
              <span>Stage 5: Practical Projects</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#334155] font-display">
              {language === 'hi' ? 'मेरा व्यावहारिक पोर्टफोलियो' : 'My Practical Work Portfolio'}
            </h2>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] font-bold text-xs shadow-baby-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-52 bg-white rounded-3xl border border-[#D8ECFA]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3">
            <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-[#334155]">{loadError}</p>
            <button
              type="button"
              onClick={loadAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-[#BDE0FE] p-10 text-center space-y-3">
            <Layers className="w-10 h-10 text-[#3B9EE8] mx-auto" />
            <h3 className="text-base font-bold text-[#334155]">No Portfolio Projects Yet</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Add academic, personal, or freelance projects manually — or complete a Practical
              Assignment in Learn &amp; Practice to automatically add deliverables here!
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm"
              >
                Add Project Manually
              </button>
              <Link
                to="/learn"
                className="px-4 py-2 rounded-2xl bg-white border border-[#BDE0FE] text-[#334155] text-xs font-bold"
              >
                Try a Practice Assignment
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-3xl border border-[#D8ECFA] p-5 shadow-baby-sm hover:border-[#60B6F8] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE]">
                      {p.source === 'practice_assignment'
                        ? 'SETU Assignment'
                        : p.projectType || 'Project'}
                    </span>
                    {p.featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Featured ★
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-[#334155] text-base leading-snug">{p.title}</h3>
                    {(p.role || p.duration) && (
                      <p className="text-[11px] text-[#2589D6] font-semibold mt-0.5">
                        {[p.role, p.duration].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="text-xs text-[#64748B] mt-1.5 line-clamp-3 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set([...(p.technologies || []), ...(p.skills || [])])
                    )
                      .slice(0, 5)
                      .map((sk: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FCFF] border border-[#D8ECFA] text-[#475569]"
                        >
                          {sk}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAF7FF] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {p.workSampleUrl && (
                      <a
                        href={p.workSampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2589D6] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Demo
                      </a>
                    )}
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#334155] hover:underline"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Code
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-xl text-[#64748B] hover:bg-[#EAF7FF] hover:text-[#1E3A5F]"
                      aria-label="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p._id)}
                      className="p-1.5 rounded-xl text-[#64748B] hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#F8FCFF] border-b border-[#D8ECFA] flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#334155] font-display">
                {editingProject ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-[#64748B] hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Budget KPI Dashboard"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Your Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Developer"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 4 weeks"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#334155]">Description *</label>
                  <button
                    type="button"
                    disabled={improvingDesc}
                    onClick={handleImproveProjectDesc}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-[#EAF7FF] to-[#FCE7F3] text-[#1E3A5F] border border-[#BDE0FE] text-[11px] font-bold"
                  >
                    <Sparkles className="w-3 h-3 text-[#3B9EE8]" />
                    <span>{improvingDesc ? 'Polishing...' : 'Improve My Project Description'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you built, the tools you used, and what it achieved..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Technologies / Tools (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="e.g. React, Python, Excel, Canva"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Skills Demonstrated (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Data Analysis, UI/UX"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Project / Live Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={workSampleUrl}
                    onChange={(e) => setWorkSampleUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    GitHub Repository Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-[#A2D2FF]"
                />
                <span>Feature this project on my profile &amp; resume prefill</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAF7FF]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] text-xs font-bold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] text-xs font-bold shadow-baby-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full 9-Step Resume Builder Modal */}
      {showResumeBuilder && (
        <ResumeBuilderModal
          existingResume={editingResume}
          onClose={() => setShowResumeBuilder(false)}
          onSaved={loadAll}
        />
      )}

      {/* Upload Existing Resume & Review Modal */}
      {showUploadModal && (
        <ResumeUploadReviewModal
          onClose={() => setShowUploadModal(false)}
          onConfirmed={loadAll}
          onCreateWithSetu={() => {
            setEditingResume(null);
            setShowResumeBuilder(true);
          }}
        />
      )}
    </div>
  );
};
