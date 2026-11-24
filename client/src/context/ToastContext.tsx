import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  showToast: (variant: ToastVariant, message: string, title?: string, durationMs?: number) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, message: string, title?: string, durationMs?: number) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const cleanMessage = String(message || '').trim();
      if (!cleanMessage) return;

      setToasts((prev) => [...prev.slice(-3), { id, variant, title, message: cleanMessage }]);

      const ttl = durationMs ?? (variant === 'error' ? 6000 : 4500);
      window.setTimeout(() => {
        dismissToast(id);
      }, ttl);
    },
    [dismissToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string, title?: string) => showToast('success', message, title),
      error: (message: string, title?: string) => showToast('error', message, title),
      warning: (message: string, title?: string) => showToast('warning', message, title),
      info: (message: string, title?: string) => showToast('info', message, title)
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, dismissToast, showToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
