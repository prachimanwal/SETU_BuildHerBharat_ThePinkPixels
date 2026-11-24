import React, { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';

interface PromptModalProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  open,
  title,
  description,
  label,
  placeholder = 'Enter note...',
  defaultValue = '',
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, defaultValue, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] modal-backdrop-soft flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(value.trim() || defaultValue);
        }}
        className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] rounded-3xl shadow-baby p-6 space-y-4 relative animate-toast-in"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:bg-[#EAF7FF] dark:hover:bg-[#263449] transition"
          aria-label="Close input dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF7FF] dark:bg-[#263449] border border-[#BDE0FE] dark:border-[#334155] text-[#2589D6] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="prompt-modal-title"
              className="text-base sm:text-lg font-extrabold text-[#1E3A5F] dark:text-[#F1F5F9] font-display"
            >
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#334155] dark:text-[#F1F5F9] mb-1.5">
            {label}
          </label>
          <textarea
            ref={inputRef}
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] bg-[#F8FCFF] dark:bg-[#263449] text-sm text-[#334155] dark:text-[#F1F5F9] outline-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl border border-[#D8ECFA] dark:border-[#334155] bg-[#F8FCFF] dark:bg-[#263449] text-xs font-bold text-[#334155] dark:text-[#F1F5F9]"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-[#3B9EE8] hover:bg-[#2589D6] text-white text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
