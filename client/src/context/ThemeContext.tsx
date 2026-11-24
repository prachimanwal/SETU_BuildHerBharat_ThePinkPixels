import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'setu_theme';
const STORAGE_UID_KEY = 'setu_theme_uid';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readStoredPreference = (): ThemePreference => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // ignore storage errors
  }
  return 'light';
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const resolveThemeValue = (pref: ThemePreference, sysTheme: ResolvedTheme): ResolvedTheme =>
  pref === 'system' ? sysTheme : pref;

const applyDomAndChartTheme = (resolved: ResolvedTheme) => {
  const root = document.documentElement;
  const dark = resolved === 'dark';

  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', dark ? '#0B1120' : '#F8FCFF');
  }

  // Update Chart.js global styling for instant readable light/dark charts
  ChartJS.defaults.color = dark ? '#94A3B8' : '#475569';
  ChartJS.defaults.borderColor = dark ? 'rgba(51, 65, 85, 0.7)' : '#E2F1FC';
  if (ChartJS.defaults.plugins?.tooltip) {
    ChartJS.defaults.plugins.tooltip.backgroundColor = dark
      ? 'rgba(15, 23, 42, 0.96)'
      : 'rgba(255, 255, 255, 0.96)';
    ChartJS.defaults.plugins.tooltip.titleColor = dark ? '#F1F5F9' : '#1E3A5F';
    ChartJS.defaults.plugins.tooltip.bodyColor = dark ? '#CBD5E1' : '#334155';
    ChartJS.defaults.plugins.tooltip.borderColor = dark ? '#334155' : '#BDE0FE';
    ChartJS.defaults.plugins.tooltip.borderWidth = 1;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [themePreference, setThemePrefState] = useState<ThemePreference>(() =>
    readStoredPreference()
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = resolveThemeValue(themePreference, systemTheme);

  // Listen for OS theme changes when preference is 'system'
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply class & Chart.js defaults whenever resolved theme changes
  useEffect(() => {
    applyDomAndChartTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Sync user's persisted MongoDB themePreference upon login/user switch
  useEffect(() => {
    if (!user?.id) return;
    const dbPref = user.themePreference;
    const prevUid = localStorage.getItem(STORAGE_UID_KEY);

    if (dbPref === 'light' || dbPref === 'dark') {
      setThemePrefState(dbPref);
      localStorage.setItem(STORAGE_KEY, dbPref);
      localStorage.setItem(STORAGE_UID_KEY, user.id);
    } else if (dbPref === 'system' && prevUid === user.id) {
      setThemePrefState('system');
      localStorage.setItem(STORAGE_KEY, 'system');
    } else {
      localStorage.setItem(STORAGE_UID_KEY, user.id);
    }
  }, [user?.id, user?.themePreference]);

  const setThemePreference = useCallback(
    async (pref: ThemePreference) => {
      setThemePrefState(pref);
      try {
        localStorage.setItem(STORAGE_KEY, pref);
        if (user?.id) {
          localStorage.setItem(STORAGE_UID_KEY, user.id);
        }
      } catch {
        // ignore storage errors
      }

      if (user?.id) {
        const res = await apiFetch('/api/auth/preferences', {
          method: 'PUT',
          body: JSON.stringify({ themePreference: pref })
        });
        if (res.ok) {
          void refreshUser();
        }
      }
    },
    [user?.id, refreshUser]
  );

  const toggleTheme = useCallback(async () => {
    const next: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark';
    await setThemePreference(next);
  }, [resolvedTheme, setThemePreference]);

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        setThemePreference,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
