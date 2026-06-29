export type ThemeMode = 'light' | 'dark';

export function applyTheme(_mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.colorScheme = 'light';
}
