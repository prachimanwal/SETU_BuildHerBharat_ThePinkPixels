import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  iconType?: 'trash' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  itemName,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  iconType = 'trash',
  loading = false,
  onConfirm,
  onCancel
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the Cancel button by default for destructive confirmation safety
    const raf = window.requestAnimationFrame(() => {
      cancelBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger
    ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-[#F87171]'
    : isWarning
      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-[#FBBF24]'
      : 'bg-[#EAF7FF] dark:bg-[#263449] border-[#BDE0FE] dark:border-[#334155] text-[#2589D6] dark:text-[#60A5FA]';

  const confirmBtnClass = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
    : isWarning
      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
      : 'bg-[#3B9EE8] hover:bg-[#2589D6] text-white shadow-sm';

  const IconComp = iconType === 'trash' ? Trash2 : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[90] modal-backdrop-soft flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] rounded-3xl shadow-baby p-6 space-y-5 relative animate-toast-in"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EAF7FF] dark:hover:bg-[#263449] transition disabled:opacity-40"
          aria-label="Close confirmation dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <IconComp className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <h3
              id="confirm-modal-title"
              className="text-lg font-extrabold text-[#1E3A5F] dark:text-[#F1F5F9] font-display leading-snug"
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        {itemName && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] border border-[#D8ECFA] dark:border-[#334155]">
            <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Selected Item
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#334155] dark:text-[#F1F5F9] truncate mt-0.5">
              {itemName}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] bg-[#F8FCFF] dark:bg-[#263449] hover:bg-[#EAF7FF] dark:hover:bg-[#334155] text-xs font-bold text-[#334155] dark:text-[#F1F5F9] transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold transition inline-flex items-center justify-center gap-2 disabled:opacity-60 ${confirmBtnClass}`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
