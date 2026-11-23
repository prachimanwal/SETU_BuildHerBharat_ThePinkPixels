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
  ShieldCheck
} from 'lucide-react';
import { apiFetch, unwrapData } from '../utils/api';
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
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [uploadId, setUploadId] = useState<string>('');
  const [filename, setFilename] = useState<string>('');

  // Editable extracted review state
  const [extracted, setExtracted] = useState<any>(null);
  const [newSkill, setNewSkill] = useState('');

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setError('');
    setWarning('');

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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/resumes/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        setError(res.error || 'Could not upload and parse resume.');
      } else {
        const data = unwrapData(res.data);
        setUploadId(data.uploadId);
        setFilename(data.originalFilename || file.name);
        setExtracted(data.extractedData || {});
        if (data.parseWarning) setWarning(data.parseWarning);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while uploading resume.');
    } finally {
      setUploading(false);
    }
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
    <div className="fixed inset-0 z-50 bg-[#1E3A5F]/35 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-baby-lg border border-[#BDE0FE] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#EAF7FF] to-[#FCE7F3]/40 border-b border-[#D8ECFA] flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2589D6]">
              <FileText className="w-3.5 h-3.5" />
              <span>Private &amp; Secure Resume Import</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#334155] font-display">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:bg-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {warning && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
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

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-3xl border-2 border-dashed border-[#A2D2FF] bg-[#F8FCFF] hover:bg-[#EAF7FF]/60 transition cursor-pointer text-center space-y-3"
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
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#334155]">
                    {uploading ? 'Uploading & Reading Resume...' : 'Click to Upload Resume (PDF / DOCX)'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">Maximum file size: 5 MB</p>
                </div>
              </div>

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
          <div className="p-4 border-t border-[#EAF7FF] bg-[#F8FCFF] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white border border-[#D8ECFA] text-[#64748B] text-xs font-bold"
            >
              Keep File Only (Don&apos;t Update Profile)
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirmSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] hover:from-[#8CC6FA] hover:to-[#A2D2FF] text-[#1E3A5F] text-xs font-bold shadow-baby-sm disabled:opacity-50"
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
