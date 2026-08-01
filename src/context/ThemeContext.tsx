import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  /** What the user picked — may be 'system'. */
  theme: Theme;
  /** What is actually on screen, with 'system' already resolved. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Flip between light and dark, leaving 'system' behind. */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'atlas-theme';

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* localStorage unavailable — fall through to the default */
  }
  return 'system';
};

const resolve = (theme: Theme): ResolvedTheme =>
  theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme;

/* -------------------------------------------------------------------------- */
/*                                  Context                                   */
/* -------------------------------------------------------------------------- */

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                                  Provider                                  */
/* -------------------------------------------------------------------------- */

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(readStoredTheme()));

  // Reflect the resolved theme onto <html> so the `.dark` variant and the
  // `color-scheme` property (native scrollbars, form controls) both follow.
  useEffect(() => {
    const next = resolve(theme);
    setResolvedTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, [theme]);

  // Track the OS preference, but only while the user is actually on 'system'.
  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next: ResolvedTheme = media.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Persisting is best-effort; the session still honours the choice. */
    }
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(resolve(theme) === 'dark' ? 'light' : 'dark'),
    [theme, setTheme]
  );

  const value = useMemo<ThemeContextType>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
