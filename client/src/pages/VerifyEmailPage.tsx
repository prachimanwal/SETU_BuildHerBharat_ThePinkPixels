import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from '../components/ThemeToggleButton';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const { user, refreshUser } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from this link.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/auth/verify-email/confirm', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        if (cancelled) return;
        if (res.ok) {
          setStatus('success');
          setMessage((res.data as any)?.message || 'Your email address has been verified.');
          if (user) {
            void refreshUser();
          }
        } else {
          setStatus('error');
          setMessage(res.error || 'This email verification link is invalid or has expired.');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Network error while verifying email.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F8FCFF] dark:bg-[#0B1120] flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] border border-[#D8ECFA] dark:border-[#334155] rounded-3xl p-7 shadow-baby text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EAF7FF] dark:bg-[#263449] flex items-center justify-center text-[#3B9EE8] dark:text-[#60A5FA]">
          {status === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-[#34D399]" />
          ) : status === 'error' ? (
            <AlertCircle className="w-6 h-6 text-rose-500 dark:text-[#F87171]" />
          ) : (
            <MailCheck className="w-6 h-6 animate-pulse" />
          )}
        </div>

        <h1 className="text-xl font-extrabold text-[#1E3A5F] dark:text-[#F1F5F9] font-display">
          {status === 'success'
            ? 'Email Verified'
            : status === 'error'
              ? 'Verification Link Invalid'
              : 'Verifying Email...'}
        </h1>

        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{message}</p>

        <div className="pt-2">
          <Link
            to={user ? '/settings' : '/login'}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#A2D2FF] to-[#BDE0FE] text-[#1E3A5F] font-bold text-xs shadow-baby-sm"
          >
            {user ? 'Return to Account Settings' : 'Go to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};
