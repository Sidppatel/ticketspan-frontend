export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  fontFamily: string;
}

export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: '#6f8f99',
  secondaryColor: '#deeae8',
  accentColor: '#d99a6c',
  logoUrl: null,
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
};

export function applyBranding(branding: TenantBranding): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', branding.primaryColor);
  root.style.setProperty('--brand-secondary', branding.secondaryColor);
  root.style.setProperty('--brand-accent', branding.accentColor);
  root.style.setProperty('--brand-font', branding.fontFamily);
}
