export const palette = {
  powderPetal: '#f1e2d7',
  brightSnow: '#f9f9f7',
  almondSilk: '#f8d5c2',
  azureMist: '#deeae8',
  paleSky: '#cddcdf',
  seashell: '#f3e7e3',
  dustyBlue: '#6f8f99',
  dustyBlueLight: '#9bb8bf',
  slateInk: '#36454a',
  slateSoft: '#4a5b5f',
  slateMuted: '#7e8a8c',
  snow: '#ffffff',
  sage: '#5e8b7e',
  sageBright: '#7fa898',
  rose: '#c97b6e',
  roseSoft: '#d99685',
  peach: '#d99a6c',
  peachBright: '#e6b48a',
} as const;

export type ColorToken =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'amber'
  | 'amber-foreground'
  | 'success'
  | 'success-foreground'
  | 'warning'
  | 'destructive'
  | 'destructive-foreground'
  | 'border'
  | 'input'
  | 'ring';

export type ThemeMode = 'light' | 'dark';

const light: Record<ColorToken, string> = {
  background: palette.brightSnow,
  foreground: palette.slateInk,
  card: palette.snow,
  'card-foreground': palette.slateInk,
  popover: palette.snow,
  'popover-foreground': palette.slateInk,
  primary: palette.dustyBlue,
  'primary-foreground': '#ffffff',
  secondary: palette.azureMist,
  'secondary-foreground': palette.slateSoft,
  muted: palette.powderPetal,
  'muted-foreground': palette.slateMuted,
  accent: palette.almondSilk,
  'accent-foreground': '#8a5240',
  amber: palette.peach,
  'amber-foreground': '#7a4a2e',
  success: palette.sage,
  'success-foreground': '#ffffff',
  warning: palette.peach,
  destructive: palette.rose,
  'destructive-foreground': '#fff5f2',
  border: '#dde2e0',
  input: '#cdd6d6',
  ring: palette.dustyBlue,
};

const dark: Record<ColorToken, string> = {
  background: '#1b2225',
  foreground: '#e8eded',
  card: '#232b2e',
  'card-foreground': '#e8eded',
  popover: '#232b2e',
  'popover-foreground': '#e8eded',
  primary: palette.dustyBlueLight,
  'primary-foreground': '#14201f',
  secondary: '#2e383a',
  'secondary-foreground': '#e8eded',
  muted: '#2e383a',
  'muted-foreground': '#a6b3b3',
  accent: '#3a3330',
  'accent-foreground': palette.almondSilk,
  amber: palette.peachBright,
  'amber-foreground': '#2a1c12',
  success: palette.sageBright,
  'success-foreground': '#0e1a16',
  warning: palette.peachBright,
  destructive: palette.roseSoft,
  'destructive-foreground': '#2a1410',
  border: '#36413f',
  input: '#36413f',
  ring: palette.dustyBlueLight,
};

export const themes: Record<ThemeMode, Record<ColorToken, string>> = { light, dark };

const gradients: Record<ThemeMode, string> = {
  light: [
    `radial-gradient(120% 90% at 0% 0%, ${palette.almondSilk}cc 0%, transparent 45%)`,
    `radial-gradient(110% 80% at 100% 0%, ${palette.azureMist}cc 0%, transparent 42%)`,
    `radial-gradient(140% 120% at 100% 100%, ${palette.seashell}aa 0%, transparent 55%)`,
    `linear-gradient(180deg, ${palette.brightSnow} 0%, ${palette.brightSnow} 100%)`,
  ].join(', '),
  dark: [
    `radial-gradient(120% 90% at 0% 0%, ${palette.slateSoft}88 0%, transparent 45%)`,
    `radial-gradient(110% 80% at 100% 0%, ${palette.dustyBlue}55 0%, transparent 42%)`,
    `radial-gradient(140% 120% at 100% 100%, ${palette.sage}33 0%, transparent 55%)`,
    `linear-gradient(180deg, #1b2225 0%, #1b2225 100%)`,
  ].join(', '),
};

export function themeVars(mode: ThemeMode): Record<string, string> {
  const tokens = themes[mode];
  const vars: Record<string, string> = {};
  for (const key of Object.keys(tokens) as ColorToken[]) {
    vars[`--${key}`] = tokens[key];
  }
  vars['--gradient-bg'] = gradients[mode];
  vars['--brand-primary'] = tokens.primary;
  vars['--brand-secondary'] = tokens.accent;
  vars['--brand-accent'] = tokens.amber;
  return vars;
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const vars = themeVars(mode);
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
  root.style.colorScheme = mode;
}
