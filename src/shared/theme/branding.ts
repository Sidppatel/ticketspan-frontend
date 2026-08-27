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

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let val = t;
      if (val < 0) val += 1;
      if (val > 1) val -= 1;
      if (val < 1 / 6) return p + (q - p) * 6 * val;
      if (val < 1 / 2) return q;
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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

export function ensureAccessibleContrast(
  fgHex: string,
  bgHex: string,
  minRatio = 4.5,
): string {
  if (!isHexColor(fgHex) || !isHexColor(bgHex)) return fgHex;
  const currentRatio = contrastRatio(fgHex, bgHex);
  if (currentRatio >= minRatio) return fgHex;

  const bgLum = relativeLuminance(bgHex);
  const shouldLighten = bgLum < 0.45;

  const rgb = hexToRgb(fgHex);
  if (!rgb) return shouldLighten ? '#ffffff' : '#0a0d14';
  const [h, s, initialL] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  let bestRatio = currentRatio;

  if (shouldLighten) {
    for (let l = Math.max(initialL, 45); l <= 100; l += 2) {
      const candidate = hslToHex(h, s, l);
      const ratio = contrastRatio(candidate, bgHex);
      if (ratio >= minRatio) return candidate;
      if (ratio > bestRatio) {
        bestRatio = ratio;
      }
    }
    for (let curS = s; curS >= 0; curS -= 15) {
      const candidate = hslToHex(h, curS, 98);
      if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
    }
    return '#ffffff';
  } else {
    for (let l = Math.min(initialL, 55); l >= 0; l -= 2) {
      const candidate = hslToHex(h, s, l);
      const ratio = contrastRatio(candidate, bgHex);
      if (ratio >= minRatio) return candidate;
      if (ratio > bestRatio) {
        bestRatio = ratio;
      }
    }
    for (let curS = s; curS >= 0; curS -= 15) {
      const candidate = hslToHex(h, curS, 6);
      if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
    }
    return '#0a0d14';
  }
}

export function resolveCssColor(varName: string, alpha?: number): string {
  if (typeof document === 'undefined') return '#000000';
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (alpha === undefined) {
    return value;
  }
  const rgb = hexToRgb(value);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : value;
}

export function readableTextOn(backgroundHex: string): string {
  if (!isHexColor(backgroundHex)) return '#ffffff';
  const whiteRatio = contrastRatio('#ffffff', backgroundHex);
  const blackRatio = contrastRatio('#0b0f19', backgroundHex);
  return whiteRatio >= blackRatio ? '#ffffff' : '#0b0f19';
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

export type BrandingColorRole =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'text'
  | 'button'
  | 'highlight';

const BRANDING_COLOR_ROLES: BrandingColorRole[] = [
  'primary',
  'secondary',
  'accent',
  'background',
  'text',
  'button',
  'highlight',
];

export type BrandingColors = Pick<TenantBranding, BrandingColorRole>;

function readBrandingColors(cssVarPrefix: string): BrandingColors {
  const colors = {} as BrandingColors;
  for (const role of BRANDING_COLOR_ROLES) {
    colors[role] = resolveCssColor(`${cssVarPrefix}-${role}`);
  }
  return colors;
}

let cachedDefaultBranding: TenantBranding | null = null;

export function defaultBranding(): TenantBranding {
  if (!cachedDefaultBranding || !isHexColor(cachedDefaultBranding.primary)) {
    cachedDefaultBranding = {
      ...readBrandingColors('--branding-default'),
      tokens: {},
      logoUrl: null,
      tenantName: '',
    };
  }
  return cachedDefaultBranding;
}

export interface BrandingPreset {
  name: string;
  colors: BrandingColors;
}

const BRANDING_PRESET_SLUGS: { name: string; slug: string }[] = [
  { name: 'TicketSpan Classic', slug: 'ticketspan-classic' },
  { name: 'Midnight Stage', slug: 'midnight-stage' },
  { name: 'Forest Gala', slug: 'forest-gala' },
  { name: 'Coastal Club', slug: 'coastal-club' },
  { name: 'Noir Premiere', slug: 'noir-premiere' },
];

let cachedBrandingPresets: BrandingPreset[] | null = null;

export function brandingPresets(): BrandingPreset[] {
  if (!cachedBrandingPresets || !isHexColor(cachedBrandingPresets[0].colors.primary)) {
    cachedBrandingPresets = BRANDING_PRESET_SLUGS.map(({ name, slug }) => ({
      name,
      colors: readBrandingColors(`--branding-preset-${slug}`),
    }));
  }
  return cachedBrandingPresets;
}

export function brandingCssVars(branding: TenantBranding): Record<string, string> {
  const vars: Record<string, string> = {};
  const fallback = defaultBranding();
  const shadeMixTarget = resolveCssColor('--branding-shade-mix-target') || '#000000';
  const set = (name: string, value: string) => {
    vars[name] = value;
  };

  const primaryHex = isHexColor(branding.primary) ? branding.primary : fallback.primary;
  const secondaryHex = isHexColor(branding.secondary) ? branding.secondary : fallback.secondary;
  const accentHex = isHexColor(branding.accent) ? branding.accent : fallback.accent;
  const canvasHex = isHexColor(branding.background) ? branding.background : (fallback.background || '#ffffff');
  const textHex = isHexColor(branding.text) ? branding.text : (fallback.text || '#0f172a');
  const buttonHex = isHexColor(branding.button) ? branding.button : primaryHex;
  const highlightHex = isHexColor(branding.highlight) ? branding.highlight : '#f59e0b';

  set('--brand', primaryHex);
  set('--brand-hover', `color-mix(in srgb, ${primaryHex} 85%, ${shadeMixTarget})`);
  set('--brand-ink', readableTextOn(primaryHex));
  set('--ring', primaryHex);
  set('--brand-primary', primaryHex);

  set('--brand-secondary', secondaryHex);
  set('--secondary', secondaryHex);
  set('--secondary-foreground', readableTextOn(secondaryHex));

  set('--voltage-accent', accentHex);
  set('--voltage-accent-ink', readableTextOn(accentHex));
  set('--brand-accent', accentHex);

  set('--canvas', canvasHex);
  set('--surface-sunken', `color-mix(in srgb, ${canvasHex} 92%, ${textHex})`);

  const safeInk = ensureAccessibleContrast(textHex, canvasHex, 7.0);
  const safeInkSoft = ensureAccessibleContrast(mixHex(textHex, canvasHex, 0.72), canvasHex, 4.5);
  const safeInkFaint = ensureAccessibleContrast(mixHex(textHex, canvasHex, 0.55), canvasHex, 3.0);

  set('--ink', safeInk);
  set('--ink-soft', safeInkSoft);
  set('--ink-faint', safeInkFaint);

  set('--hairline', `color-mix(in srgb, ${textHex} 10%, ${canvasHex})`);
  set('--hairline-strong', `color-mix(in srgb, ${textHex} 22%, ${canvasHex})`);

  const stageHex = '#0d1017';
  set('--stage', stageHex);
  set('--stage-elevated', '#161b26');
  set('--on-stage', '#ffffff');
  set('--on-stage-soft', '#cbd5e1');

  set('--primary', buttonHex);
  set('--primary-foreground', readableTextOn(buttonHex));
  set('--marigold', highlightHex);
  set('--marigold-foreground', readableTextOn(highlightHex));

  const customTokens = branding.tokens ?? {};
  for (const [token, value] of Object.entries(customTokens)) {
    if (!ADVANCED_TOKEN_SET.has(token) || !isHexColor(value)) {
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
