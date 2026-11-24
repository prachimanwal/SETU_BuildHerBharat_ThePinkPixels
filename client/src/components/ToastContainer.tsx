import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastVariant, useToast } from '../context/ToastContext';

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    wrapper: string;
    icon: React.FC<{ className?: string }>;
    iconClass: string;
    titleClass: string;
  }
> = {
  success: {
    wrapper:
      'bg-white dark:bg-[#1E293B] border-emerald-200 dark:border-emerald-500/40 text-[#334155] dark:text-[#F1F5F9]',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500 dark:text-[#34D399]',
    titleClass: 'text-emerald-800 dark:text-[#34D399]'
  },
  error: {
    wrapper:
      'bg-white dark:bg-[#1E293B] border-rose-200 dark:border-rose-500/40 text-[#334155] dark:text-[#F1F5F9]',
    icon: AlertCircle,
    iconClass: 'text-rose-500 dark:text-[#F87171]',
    titleClass: 'text-rose-800 dark:text-[#F87171]'
  },
  warning: {
    wrapper:
      'bg-white dark:bg-[#1E293B] border-amber-200 dark:border-amber-500/40 text-[#334155] dark:text-[#F1F5F9]',
    icon: AlertTriangle,
    iconClass: 'text-amber-500 dark:text-[#FBBF24]',
    titleClass: 'text-amber-800 dark:text-[#FBBF24]'
  },
  info: {
    wrapper:
      'bg-white dark:bg-[#1E293B] border-[#BDE0FE] dark:border-[#60A5FA]/40 text-[#334155] dark:text-[#F1F5F9]',
    icon: Info,
    iconClass: 'text-[#3B9EE8] dark:text-[#60A5FA]',
    titleClass: 'text-[#1E3A5F] dark:text-[#60A5FA]'
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-full sm:max-w-sm z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((item) => {
        const cfg = VARIANT_STYLES[item.variant];
        const Icon = cfg.icon;
        return (
          <div
            key={item.id}
            role={item.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto animate-toast-in rounded-2xl border p-3.5 shadow-baby flex items-start gap-3 ${cfg.wrapper}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconClass}`} />
            <div className="min-w-0 flex-1">
              {item.title && (
                <p className={`text-xs font-bold leading-snug mb-0.5 ${cfg.titleClass}`}>
                  {item.title}
                </p>
              )}
              <p className="text-xs leading-relaxed text-[#334155] dark:text-[#F1F5F9]">
                {item.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#334155] dark:hover:text-[#F1F5F9] transition shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
