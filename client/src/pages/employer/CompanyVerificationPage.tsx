import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileText,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { apiFetch, getApiUrl, unwrapData } from '../../utils/api';

const DOC_TYPES = [
  'Business Registration Certificate',
  'GST Registration Certificate',
  'CIN Certificate',
  'Business PAN',
  'Authorization Letter',
  'Other Business Proof'
];

export const CompanyVerificationPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const res = await apiFetch('/api/employer/verification');
    if (res.ok && res.data) {
      setData(unwrapData(res.data));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setNotice({ type: 'error', text: 'Please select a PDF, JPG, or PNG file.' });
      return;
    }

    setUploading(true);
    setUploadProgress(30);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);
      formData.append('documentNumber', docNumber);
      formData.append('notes', notes);

      const token = localStorage.getItem('setu_auth_token');
      const url = replacingId
        ? getApiUrl(`/api/employer/verification/documents/${replacingId}`)
        : getApiUrl('/api/employer/verification/documents');

      setUploadProgress(70);
      const res = await fetch(url, {
        method: replacingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const json = await res.json();
      setUploadProgress(100);

      if (!res.ok || json.success === false) {
        setNotice({ type: 'error', text: json.message || 'Upload failed.' });
      } else {
        setFile(null);
        setDocNumber('');
        setNotes('');
        setReplacingId(null);
        setNotice({
          type: 'success',
          text: json.message || 'Document submitted for SETU administrator review.'
        });
        await load();
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Upload error' });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handlePreview = async (doc: any) => {
    const token = localStorage.getItem('setu_auth_token');
    const res = await fetch(getApiUrl(`/api/employer/verification/documents/${doc._id}/file`), {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      setNotice({ type: 'error', text: 'Could not preview document.' });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleRequestReverify = async () => {
    const res = await apiFetch('/api/employer/verification/request-review', {
      method: 'POST',
      body: JSON.stringify({ notes: 'Documents updated and ready for SETU admin re-verification.' })
    });
    if (res.ok) {
      setNotice({ type: 'success', text: 'Re-verification requested successfully.' });
      await load();
    } else {
      setNotice({ type: 'error', text: res.error || 'Could not request re-verification.' });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#64748B]">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#60B6F8] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading verification center...</p>
      </div>
    );
  }

  const isVerified = Boolean(data?.isVerified);
  const label = data?.verificationLabel || 'Pending';
  const docs = Array.isArray(data?.documents) ? data.documents : [];
  const auditTrail = Array.isArray(data?.auditTrail) ? data.auditTrail : [];

  const getBadgeStyle = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes('verif') || s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('reject')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s.includes('info')) return 'bg-orange-50 text-orange-800 border-orange-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Status Banner */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl ${
              isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1E3A5F]">Company Verification Center</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(label)}`}>
                {label}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              {isVerified
                ? 'Your organization is verified by SETU administrators. You can publish live jobs and invite candidates.'
                : 'Uploading documents submits your company for manual review by authorized SETU administrators. Only verified employers can publish live jobs (drafts are always available).'}
            </p>
            {data?.adminReviewNotes && (
              <div className="mt-3 p-3 rounded-2xl bg-[#F8FCFF] border border-[#BDE0FE] text-xs text-[#1E3A5F]">
                <strong>Administrator Feedback:</strong> {data.adminReviewNotes}
              </div>
            )}
          </div>
        </div>

        {!isVerified && docs.length > 0 && (
          <button
            type="button"
            onClick={handleRequestReverify}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE] hover:bg-[#D6EEFF] shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Request Re-verification</span>
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Upload / Replace Form */}
      <form
        onSubmit={handleUpload}
        className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E3A5F]">
            {replacingId ? 'Replace Rejected / Requested Document' : 'Upload Business Verification Document'}
          </h2>
          {replacingId && (
            <button
              type="button"
              onClick={() => setReplacingId(null)}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Cancel Replacement
            </button>
          )}
        </div>
        <p className="text-xs text-[#64748B]">
          Accepted formats: PDF, JPG, PNG (up to 5 MB). Protected with role-based access control — visible only to your account and authorized SETU administrators.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Document Type *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">Document Reference Number</label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g., GSTIN / CIN / PAN / Reg No."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#334155] mb-1">Select File (PDF, JPG, PNG) *</label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#EAF7FF] file:text-[#1E3A5F] file:font-semibold"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional clarifying note for SETU verification reviewers"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D8ECFA] bg-[#F8FCFF] text-xs"
            />
          </div>
        </div>

        {uploadProgress > 0 && (
          <div className="w-full h-2 bg-[#EAF7FF] rounded-full overflow-hidden">
            <div className="h-full bg-[#3B9EE8] transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold shadow-xs transition disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading Securely...' : replacingId ? 'Upload Replacement Document' : 'Submit Verification Document'}</span>
        </button>
      </form>

      {/* Submitted Documents Table */}
      <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-4">
        <h2 className="text-base font-bold text-[#1E3A5F]">Submitted Documents ({docs.length})</h2>
        {docs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#F8FCFF] border border-dashed border-[#BDE0FE] text-xs text-[#64748B]">
            No verification documents uploaded yet. Upload your registration certificate, GST, CIN, or PAN above.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div
                key={doc._id}
                className="p-4 rounded-2xl bg-[#F8FCFF] border border-[#D8ECFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#3B9EE8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#1E3A5F]">{doc.documentType}</p>
                    <p className="text-xs text-[#64748B]">
                      {doc.originalFilename} • {(doc.sizeBytes / 1024).toFixed(0)} KB
                      {doc.documentNumber ? ` • Ref: ${doc.documentNumber}` : ''}
                    </p>
                    {(doc.rejectionReason || doc.adminNotes) && (
                      <p className="text-xs text-rose-700 mt-1">
                        <strong>Reviewer Note:</strong> {doc.rejectionReason || doc.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(doc.status)}`}>
                    {doc.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#D8ECFA] text-xs font-semibold text-[#1E3A5F] hover:bg-[#EAF7FF]"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingId(doc._id);
                      setDocType(doc.documentType);
                      setDocNumber(doc.documentNumber || '');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF7FF] text-[#1E3A5F] text-xs font-semibold border border-[#BDE0FE]"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      {auditTrail.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#D8ECFA] p-6 shadow-baby-sm space-y-3">
          <h2 className="text-base font-bold text-[#1E3A5F] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3B9EE8]" /> Verification Audit Trail
          </h2>
          <div className="space-y-2">
            {auditTrail.map((entry: any, i: number) => (
              <div key={i} className="p-3 rounded-2xl bg-[#F8FCFF] border border-[#EAF7FF] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-bold text-[#1E3A5F]">{entry.actorName}</span>{' '}
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#D8ECFA] text-[#64748B]">
                    {entry.actorRole}
                  </span>
                  <p className="text-[#475569] mt-0.5">{entry.notes}</p>
                </div>
                <span className="text-[11px] text-[#94A3B8] shrink-0">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
