import { useCallback, useEffect, useState } from 'react';
import { applyTheme, type ThemeMode } from '@/shared/theme/colors';

const STORAGE_KEY = 'svyne-theme';

export function initialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useDarkMode(): { isDark: boolean; toggle: () => void } {
  const [mode, setMode] = useState<ThemeMode>(initialThemeMode);

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);

  return { isDark: mode === 'dark', toggle };
}
