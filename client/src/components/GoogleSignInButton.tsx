import React, { useEffect, useRef, useState } from 'react';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  loading?: boolean;
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError: (message: string) => void;
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const PLACEHOLDER_CLIENT_IDS = [
  'your_google_client_id',
  'setu-demo-client-id',
  'example',
  'placeholder'
];

export const isGoogleClientConfigured = (clientId: string): boolean => {
  const trimmed = clientId.trim();
  if (!trimmed || !trimmed.endsWith('.apps.googleusercontent.com')) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  return !PLACEHOLDER_CLIENT_IDS.some((p) => lower.includes(p));
};

const waitForGoogleIdentityServices = (timeoutMs = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const start = Date.now();
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`
    );

    if (!script) {
      script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleScriptError = () => {
      clearInterval(interval);
      reject(
        new Error(
          'Unable to load Google Sign-In. Please check your internet connection and disable blockers for accounts.google.com.'
        )
      );
    };

    script.addEventListener('error', handleScriptError, { once: true });

    const interval = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        script?.removeEventListener('error', handleScriptError);
        resolve();
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        script?.removeEventListener('error', handleScriptError);
        reject(
          new Error(
            'Google Sign-In timed out while loading. Please check your network connection and try again.'
          )
        );
      }
    }, 100);
  });
};

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  loading = false,
  disabled = false,
  onCredential,
  onError
}) => {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const isConfigured = isGoogleClientConfigured(clientId);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  const [gisReady, setGisReady] = useState(false);
  const [gisLoadError, setGisLoadError] = useState('');
  const [buttonWidth, setButtonWidth] = useState(360);

  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  // Measure container width so Google's official rendered button fits cleanly across screens
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateWidth = () => {
      const measured = Math.floor(el.getBoundingClientRect().width);
      if (measured > 0) {
        setButtonWidth(Math.max(220, Math.min(400, measured)));
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Load Google Identity Services SDK when VITE_GOOGLE_CLIENT_ID is configured
  useEffect(() => {
    if (!isConfigured) {
      setGisReady(false);
      return;
    }

    let cancelled = false;

    waitForGoogleIdentityServices()
      .then(() => {
        if (!cancelled) {
          setGisLoadError('');
          setGisReady(true);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setGisReady(false);
          setGisLoadError(
            err.message || 'Unable to load Google Sign-In. Please check your connection.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isConfigured]);

  // Initialize and render the official Google Identity Services button
  useEffect(() => {
    if (!isConfigured || !gisReady || !buttonContainerRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        context: mode === 'signup' ? 'signup' : 'signin',
        callback: (response: { credential?: string }) => {
          if (!response || !response.credential) {
            onErrorRef.current(
              'Google sign-in was cancelled. Please select a Google account to continue.'
            );
            return;
          }
          onCredentialRef.current(response.credential);
        }
      });

      buttonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonWidth
      });
    } catch {
      setGisLoadError(
        'Failed to initialize Google Sign-In. Please refresh the page and try again.'
      );
    }
  }, [clientId, isConfigured, gisReady, mode, buttonWidth]);

  const handleFallbackClick = () => {
    if (!isConfigured) {
      onError(
        'Google Sign-In is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in the frontend environment and GOOGLE_CLIENT_ID in the backend environment.'
      );
      return;
    }
    if (gisLoadError) {
      onError(gisLoadError);
      return;
    }
    onError('Google Sign-In is still initializing. Please wait a moment and try again.');
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      {isConfigured && gisReady && !gisLoadError ? (
        <div
          className={`w-full flex justify-center transition-opacity ${
            loading || disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            ref={buttonContainerRef}
            className="min-h-[44px] flex items-center justify-center rounded-xl overflow-hidden"
            aria-label="Continue with Google"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading || disabled}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#101010] hover:bg-[#1C1C1C] border border-[#292929] hover:border-[#383838] text-xs font-semibold text-[#F5F5F5] transition disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {loading
              ? 'Verifying Google Account...'
              : isConfigured && !gisLoadError
              ? 'Loading Google Sign-In...'
              : 'Continue with Google'}
          </span>
        </button>
      )}

      {loading && (
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-[#A3A3A3]">
          <div className="w-3.5 h-3.5 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin" />
          <span>Verifying your Google account securely...</span>
        </div>
      )}
    </div>
  );
};
