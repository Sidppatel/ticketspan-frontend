export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function expandHex(hex: string): string {
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (!isHexColor(hex)) {
    return null;
  }
  const full = expandHex(hex);
  return [
    parseInt(full.slice(1, 3), 16),
    parseInt(full.slice(3, 5), 16),
    parseInt(full.slice(5, 7), 16),
  ];
}

function channelLuminance(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  return (
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2])
  );
}

export function mixHex(hexA: string, hexB: string, weightA: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) {
    return hexA;
  }
  const channel = (i: number) =>
    Math.round(a[i] * weightA + b[i] * (1 - weightA))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastGrade = 'AAA' | 'AA' | 'AA Large' | 'Fail';

export function contrastGrade(hexA: string, hexB: string): ContrastGrade {
  const ratio = contrastRatio(hexA, hexB);
  if (ratio >= 7) {
    return 'AAA';
  }
  if (ratio >= 4.5) {
    return 'AA';
  }
  if (ratio >= 3) {
    return 'AA Large';
  }
  return 'Fail';
}

export function readableTextOn(backgroundHex: string): string {
  return contrastRatio(backgroundHex, '#1c1917') >= contrastRatio(backgroundHex, '#ffffff')
    ? '#1c1917'
    : '#ffffff';
}

export function resolveCssColor(varName: string, alpha?: number): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (alpha === undefined) {
    return value;
  }
  const rgb = hexToRgb(value);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : value;
}

export interface TenantBranding {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  button: string;
  highlight: string;
  tokens: Record<string, string>;
  logoUrl: string | null;
  tenantName: string;
}

export const ADVANCED_BRANDING_TOKENS: { token: string; label: string; hint: string }[] = [
  { token: 'surface', label: 'Surface', hint: 'Cards and panels' },
  { token: 'surface-sunken', label: 'Surface sunken', hint: 'Muted panels and wells' },
  { token: 'ink-soft', label: 'Text soft', hint: 'Body copy and captions' },
  { token: 'ink-faint', label: 'Text faint', hint: 'Placeholders and disabled text' },
  { token: 'hairline', label: 'Border', hint: 'Default borders and dividers' },
  { token: 'hairline-strong', label: 'Border strong', hint: 'Input outlines and emphasis borders' },
  { token: 'brand-hover', label: 'Primary hover', hint: 'Hover state of primary elements' },
  { token: 'brand-ink', label: 'Text on primary', hint: 'Labels on primary-colored fills' },
  { token: 'voltage-accent-ink', label: 'Text on accent', hint: 'Labels on accent-colored fills' },
  { token: 'status-success', label: 'Success', hint: 'Confirmations and paid states' },
  { token: 'status-warn', label: 'Warning', hint: 'Cautions and pending states' },
  { token: 'status-danger', label: 'Danger', hint: 'Errors and destructive actions' },
  { token: 'stage', label: 'Stage', hint: 'Dark sections like footer and checkout' },
  { token: 'stage-elevated', label: 'Stage elevated', hint: 'Raised panels on dark sections' },
  { token: 'on-stage', label: 'Text on stage', hint: 'Text over dark sections' },
  { token: 'on-stage-soft', label: 'Text on stage soft', hint: 'Muted text over dark sections' },
];

const ADVANCED_TOKEN_SET = new Set(ADVANCED_BRANDING_TOKENS.map((entry) => entry.token));

export function parseBrandTokens(json: string): Record<string, string> {
  if (!json) {
    return {};
  }
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const tokens: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (ADVANCED_TOKEN_SET.has(key) && typeof value === 'string' && isHexColor(value)) {
        tokens[key] = value;
      }
    }
    return tokens;
  } catch {
    return {};
  }
}

export function serializeBrandTokens(tokens: Record<string, string>): string {
  const entries = Object.entries(tokens).filter(
    ([key, value]) => ADVANCED_TOKEN_SET.has(key) && isHexColor(value),
  );
  return entries.length === 0 ? '' : JSON.stringify(Object.fromEntries(entries));
}

export const DEFAULT_BRANDING: TenantBranding = {
  primary: '#8a2d3b',
  secondary: '#f3f0eb',
  accent: '#d4a574',
  background: '#faf8f5',
  text: '#1c1917',
  button: '#8a2d3b',
  highlight: '#d4a574',
  tokens: {},
  logoUrl: null,
  tenantName: '',
};

export interface BrandingPreset {
  name: string;
  colors: Pick<
    TenantBranding,
    'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'button' | 'highlight'
  >;
}

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    name: 'Svyne Classic',
    colors: {
      primary: '#8a2d3b',
      secondary: '#f3f0eb',
      accent: '#d4a574',
      background: '#faf8f5',
      text: '#1c1917',
      button: '#8a2d3b',
      highlight: '#e8940a',
    },
  },
  {
    name: 'Midnight Stage',
    colors: {
      primary: '#4f46e5',
      secondary: '#e0e7ff',
      accent: '#f59e0b',
      background: '#f8fafc',
      text: '#0f172a',
      button: '#4f46e5',
      highlight: '#f59e0b',
    },
  },
  {
    name: 'Forest Gala',
    colors: {
      primary: '#166534',
      secondary: '#ecfdf5',
      accent: '#ca8a04',
      background: '#fafdf7',
      text: '#14201a',
      button: '#166534',
      highlight: '#ca8a04',
    },
  },
  {
    name: 'Coastal Club',
    colors: {
      primary: '#0e7490',
      secondary: '#e0f2fe',
      accent: '#f97316',
      background: '#f8fbfc',
      text: '#0c1a20',
      button: '#0e7490',
      highlight: '#f97316',
    },
  },
  {
    name: 'Noir Premiere',
    colors: {
      primary: '#18181b',
      secondary: '#f4f4f5',
      accent: '#d4a017',
      background: '#fafafa',
      text: '#18181b',
      button: '#18181b',
      highlight: '#d4a017',
    },
  },
];

export function brandingCssVars(branding: TenantBranding): Record<string, string> {
  const vars: Record<string, string> = {};
  const set = (name: string, value: string) => {
    vars[name] = value;
  };
  if (isHexColor(branding.primary)) {
    set('--brand', branding.primary);
    set('--brand-hover', `color-mix(in srgb, ${branding.primary} 85%, #000000)`);
    set('--brand-ink', readableTextOn(branding.primary));
    set('--ring', branding.primary);
    set('--brand-primary', branding.primary);
  }
  if (isHexColor(branding.secondary)) {
    set('--brand-secondary', branding.secondary);
    set('--secondary', branding.secondary);
    set('--secondary-foreground', readableTextOn(branding.secondary));
  }
  if (isHexColor(branding.accent)) {
    set('--voltage-accent', branding.accent);
    set('--voltage-accent-ink', readableTextOn(branding.accent));
    set('--brand-accent', branding.accent);
  }
  if (isHexColor(branding.background)) {
    set('--canvas', branding.background);
    set('--surface-sunken', `color-mix(in srgb, ${branding.background} 92%, ${branding.text || '#1c1917'})`);
  }
  if (isHexColor(branding.text)) {
    set('--ink', branding.text);
    set('--ink-soft', `color-mix(in srgb, ${branding.text} 72%, ${branding.background || '#ffffff'})`);
    set('--ink-faint', `color-mix(in srgb, ${branding.text} 62%, ${branding.background || '#ffffff'})`);
  }
  if (isHexColor(branding.text) && isHexColor(branding.background)) {
    set('--hairline', `color-mix(in srgb, ${branding.text} 10%, ${branding.background})`);
    set('--hairline-strong', `color-mix(in srgb, ${branding.text} 22%, ${branding.background})`);
    set('--stage', branding.text);
    set('--stage-elevated', `color-mix(in srgb, ${branding.text} 92%, ${branding.background})`);
    set('--on-stage', branding.background);
    set('--on-stage-soft', `color-mix(in srgb, ${branding.background} 70%, ${branding.text})`);
  }
  if (isHexColor(branding.button)) {
    set('--primary', branding.button);
    set('--primary-foreground', readableTextOn(branding.button));
  }
  if (isHexColor(branding.highlight)) {
    set('--marigold', branding.highlight);
    set('--marigold-foreground', readableTextOn(branding.highlight));
  }
  const customTokens = branding.tokens ?? {};
  const tokenHex = (token: string) =>
    isHexColor(customTokens[token] ?? '') ? customTokens[token] : null;
  const backgroundHex = isHexColor(branding.background) ? branding.background : '#f7f8f8';
  const textHex = isHexColor(branding.text) ? branding.text : '#1c1917';
  const onStageSoftHex = tokenHex('on-stage-soft') ?? mixHex(backgroundHex, textHex, 0.7);
  const inkSoftHex = tokenHex('ink-soft') ?? mixHex(textHex, backgroundHex, 0.72);
  const MIN_SURFACE_CONTRAST = 3;
  const SURFACE_TOKEN_TEXT: Record<string, string> = {
    stage: onStageSoftHex,
    'stage-elevated': onStageSoftHex,
    surface: inkSoftHex,
    'surface-sunken': inkSoftHex,
  };
  for (const [token, value] of Object.entries(customTokens)) {
    if (!ADVANCED_TOKEN_SET.has(token) || !isHexColor(value)) {
      continue;
    }
    const pairedText = SURFACE_TOKEN_TEXT[token];
    if (pairedText && contrastRatio(value, pairedText) < MIN_SURFACE_CONTRAST) {
      continue;
    }
    set(`--${token}`, value);
  }
  return vars;
}

export function applyBranding(branding: TenantBranding): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  for (const [name, value] of Object.entries(brandingCssVars(branding))) {
    root.style.setProperty(name, value);
  }
}
