import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Plus,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { apiFetch, ensureBackendAwake, unwrapData } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface ResumeUploadReviewModalProps {
  onClose: () => void;
  onConfirmed?: () => void;
  onCreateWithSetu?: () => void;
  showSkipOption?: boolean;
  title?: string;
}

export const ResumeUploadReviewModal: React.FC<ResumeUploadReviewModalProps> = ({
  onClose,
  onConfirmed,
  onCreateWithSetu,
  showSkipOption = false,
  title = 'Upload Your Resume'
}) => {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [uploadId, setUploadId] = useState<string>('');
  const [filename, setFilename] = useState<string>('');

  // Editable extracted review state
  const [extracted, setExtracted] = useState<any>(null);
  const [newSkill, setNewSkill] = useState('');

  const pollParseStatus = async (id: string, fallbackFilename: string) => {
    setStatusMessage('Parsing your resume...');
    const maxPolls = 20; // up to ~30 seconds
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((r) => window.setTimeout(r, 1500));
      const statusRes = await apiFetch(`/api/resumes/upload/${id}/status`, { timeoutMs: 12000 });
      if (!statusRes.ok) {
        if (statusRes.status === 401 || statusRes.status === 403 || statusRes.status === 404) {
          setError(statusRes.error || 'Could not verify resume parse status.');
          setCanRetry(false);
          return;
        }
        continue;
      }
      const d = unwrapData(statusRes.data);
      if (d?.parseStatus === 'completed') {
        setUploadId(d.uploadId || id);
        setFilename(d.originalFilename || fallbackFilename);
        setExtracted(d.extractedData || {});
        if (d.parseWarning) setWarning(d.parseWarning);
        setCanRetry(false);
        return;
      }
      if (d?.parseStatus === 'failed') {
        setError(
          d.parseError ||
            'Could not extract text from this file. Please try re-exporting it as a valid PDF or DOCX.'
        );
        setCanRetry(false);
        return;
      }
    }
    setError('Resume parsing is taking longer than expected. Tap Retry to check status again.');
    setCanRetry(true);
  };

  const performUpload = async (file: File, stableKey: string) => {
    setUploading(true);
    setError('');
    setWarning('');
    setCanRetry(false);
    setStatusMessage('Preparing upload...');

    try {
      // 1. On-demand server readiness check (detects Render cold start cleanly before sending file bytes)
      const awake = await ensureBackendAwake((msg) => setStatusMessage(msg));
      if (!awake.ready) {
        setError(awake.error || 'Unable to connect to SETU server right now.');
        setCanRetry(awake.retryable);
        return;
      }

      // 2. Transmit multipart/form-data cleanly (NO manual Content-Type; browser supplies boundary)
      setStatusMessage('Uploading & reading your resume...');
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/resumes/upload', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': stableKey },
        body: formData,
        timeoutMs: 60000
      });

      if (!res.ok) {
        // Never auto-retry or encourage retrying invalid files, >5 MB files, corrupted docs, or 401/403
        const retryableFailure =
          res.status === 0 || res.status === 502 || res.status === 503 || res.status === 504 || res.status >= 500;
        setCanRetry(retryableFailure);
        setError(
          res.timedOut
            ? 'Upload timed out before completing. Please check your connection and tap Retry.'
            : res.error || 'Could not upload and parse resume.'
        );
        return;
      }

      const data = unwrapData(res.data);
      if (res.status === 202 || data?.parseStatus === 'processing') {
        await pollParseStatus(data.uploadId, file.name);
      } else {
        setUploadId(data.uploadId);
        setFilename(data.originalFilename || file.name);
        setExtracted(data.extractedData || {});
        if (data.parseWarning) setWarning(data.parseWarning);
        setCanRetry(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Network connection interrupted during upload. Please tap Retry.');
      setCanRetry(true);
    } finally {
      setUploading(false);
      setStatusMessage('');
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setError('');
    setWarning('');
    setCanRetry(false);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    if (file.size === 0) {
      setError('The selected file is empty. Please choose a valid PDF or DOCX resume.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB limit. Please upload a smaller PDF or DOCX.');
      return;
    }

    const stableKey = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
    setPendingFile(file);
    setIdempotencyKey(stableKey);
    await performUpload(file, stableKey);
  };

  const handleRetryUpload = async () => {
    if (!pendingFile || uploading) return;
    await performUpload(pendingFile, idempotencyKey || `${pendingFile.name}-${Date.now()}`);
  };

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean || !extracted) return;
    if (!extracted.skills?.some((s: string) => s.toLowerCase() === clean.toLowerCase())) {
      setExtracted({ ...extracted, skills: [...(extracted.skills || []), clean] });
    }
    setNewSkill('');
  };

  const handleConfirmSave = async () => {
    if (!uploadId) return;
    setConfirming(true);
    setError('');
    try {
      const res = await apiFetch(`/api/resumes/upload/${uploadId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ extractedData: extracted })
      });
      if (!res.ok) {
        setError(res.error || 'Could not save confirmed resume details.');
      } else {
        await refreshUser();
        if (onConfirmed) onConfirmed();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while saving profile details.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E3A5F]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#EAF7FF] to-[#FCE7F3]/40 border-b border-[#D8ECFA] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Private &amp; Secure Resume Import</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#334155] font-display truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#64748B] hover:bg-white shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
              {canRetry && pendingFile && (
                <button
                  type="button"
                  onClick={handleRetryUpload}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          {warning && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs break-words">
              {warning}
            </div>
          )}

          {!extracted ? (
            /* Upload Dropzone View */
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Already have a resume? Upload your <strong>PDF</strong> or <strong>DOCX</strong>{' '}
                file (up to 5 MB) to help SETU understand your education, skills, projects, and
                experience. You will review and confirm every extracted detail before anything is
                saved to your profile.
              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 sm:p-8 rounded-3xl border-2 border-dashed border-[#A2D2FF] bg-[#F8FCFF] hover:bg-[#EAF7FF]/60 active:bg-[#EAF7FF] transition cursor-pointer text-center space-y-3 disabled:opacity-75"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    e.target.value = '';
                    handleFileSelected(picked);
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#BDE0FE] flex items-center justify-center mx-auto text-[#3B9EE8] shadow-baby-sm">
                  {uploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#334155]">
                    {uploading
                      ? statusMessage || 'Uploading & Reading Resume...'
                      : 'Tap or Click to Upload Resume (PDF / DOCX)'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {uploading && statusMessage.includes('Connecting')
                      ? 'Waking up the SETU backend server — please keep this screen open...'
                      : 'Maximum file size: 5 MB • Works on mobile & desktop'}
                  </p>
                </div>
              </button>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Your uploaded resume is strictly private. SETU never shares your resume publicly or
                  with employers unless you explicitly turn on sharing.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {onCreateWithSetu && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCreateWithSetu();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#EAF7FF] hover:bg-[#D6EEFF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Resume with SETU</span>
                  </button>
                )}
                {showSkipOption && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-2xl bg-white border border-[#D8ECFA] text-[#64748B] text-xs font-bold ml-auto"
                  >
                    Skip for Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Review & Confirm Extracted Information */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#EAF7FF] border border-[#BDE0FE] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A5F]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>We found the following information in {filename}.</span>
                </div>
                <span className="text-[10px] font-semibold text-[#2589D6]">Review before saving</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={extracted.fullName || ''}
                    onChange={(e) => setExtracted({ ...extracted, fullName: e.target.value })}
                    placeholder="Not found in resume"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Email</label>
                  <input
                    type="email"
                    value={extracted.email || ''}
                    onChange={(e) => setExtracted({ ...extracted, email: e.target.value })}
                    placeholder="Not found in resume"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Phone</label>
                  <input
                    type="text"
                    value={extracted.phone || ''}
                    onChange={(e) => setExtracted({ ...extracted, phone: e.target.value })}
                    placeholder="Not found in resume"
                    className="w-full px-3 py-2 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                </div>
              </div>

              {/* Extracted Skills */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#334155]">
                  Extracted Skills ({(extracted.skills || []).length})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(extracted.skills || []).map((sk: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F8FCFF] border border-[#BDE0FE] text-xs font-semibold text-[#1E3A5F]"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            skills: extracted.skills.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add another skill..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#D8ECFA] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] border border-[#BDE0FE] text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Extracted Education */}
              {Array.isArray(extracted.education) && extracted.education.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Education ({extracted.education.length})
                  </label>
                  {extracted.education.map((ed: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate">
                        <strong>{ed.level}</strong> — {ed.degree}{' '}
                        {ed.graduationYear ? `(${ed.graduationYear})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            education: extracted.education.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Projects */}
              {Array.isArray(extracted.projects) && extracted.projects.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Projects ({extracted.projects.length})
                  </label>
                  {extracted.projects.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate font-semibold">{p.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            projects: extracted.projects.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Work Experience */}
              {Array.isArray(extracted.workExperience) && extracted.workExperience.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Work Experience ({extracted.workExperience.length})
                  </label>
                  {extracted.workExperience.map((exp: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={exp.jobTitle || ''}
                        onChange={(e) => {
                          const next = [...extracted.workExperience];
                          next[idx] = { ...next[idx], jobTitle: e.target.value };
                          setExtracted({ ...extracted, workExperience: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs font-semibold"
                        placeholder="Role"
                      />
                      <input
                        type="text"
                        value={exp.organization || ''}
                        onChange={(e) => {
                          const next = [...extracted.workExperience];
                          next[idx] = { ...next[idx], organization: e.target.value };
                          setExtracted({ ...extracted, workExperience: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs"
                        placeholder="Organization"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            workExperience: extracted.workExperience.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Internships */}
              {Array.isArray(extracted.internships) && extracted.internships.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Internships ({extracted.internships.length})
                  </label>
                  {extracted.internships.map((intern: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={intern.role || ''}
                        onChange={(e) => {
                          const next = [...extracted.internships];
                          next[idx] = { ...next[idx], role: e.target.value };
                          setExtracted({ ...extracted, internships: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs font-semibold"
                        placeholder="Internship Role"
                      />
                      <input
                        type="text"
                        value={intern.organization || ''}
                        onChange={(e) => {
                          const next = [...extracted.internships];
                          next[idx] = { ...next[idx], organization: e.target.value };
                          setExtracted({ ...extracted, internships: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs"
                        placeholder="Organization"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            internships: extracted.internships.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Certifications */}
              {Array.isArray(extracted.certifications) && extracted.certifications.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Certifications ({extracted.certifications.length})
                  </label>
                  {extracted.certifications.map((cert: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => {
                          const next = [...extracted.certifications];
                          next[idx] = e.target.value;
                          setExtracted({ ...extracted, certifications: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            certifications: extracted.certifications.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Achievements */}
              {Array.isArray(extracted.achievements) && extracted.achievements.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Extracted Achievements ({extracted.achievements.length})
                  </label>
                  {extracted.achievements.map((ach: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#F8FCFF] border border-[#D8ECFA] flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={ach}
                        onChange={(e) => {
                          const next = [...extracted.achievements];
                          next[idx] = e.target.value;
                          setExtracted({ ...extracted, achievements: next });
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-white border border-[#EAF7FF] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtracted({
                            ...extracted,
                            achievements: extracted.achievements.filter((_: any, i: number) => i !== idx)
                          })
                        }
                        className="text-[#64748B] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Career Interests */}
              {Array.isArray(extracted.careerInterests) && extracted.careerInterests.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#334155]">
                    Detected Career Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {extracted.careerInterests.map((intr: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-[#FCE7F3]/50 border border-pink-200 text-xs font-semibold text-[#334155]"
                      >
                        {intr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-[#64748B]">
                Note: Confirmed details merge safely with your SETU profile without deleting existing
                verified badges. Government scheme eligibility will still ask for any additional
                criteria needed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {extracted && (
          <div className="p-4 border-t border-[#EAF7FF] bg-[#F8FCFF] flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-2xl bg-white border border-[#D8ECFA] text-[#64748B] text-xs font-bold"
            >
              Keep File Only (Don&apos;t Update Profile)
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirmSave}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirming ? 'Saving...' : 'Confirm & Merge Into My Profile'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
