import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_BRANDING,
  applyBranding,
  parseBrandTokens,
  type TenantBranding,
} from '@/shared/theme/branding';
import { resolvePortalContext } from '@/shared/subdomain';
import { fetchPublicBranding } from '@/shared/theme/brandingPrefetch';

interface ThemeContextValue {
  branding: TenantBranding;
  tenantSlug: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  branding: DEFAULT_BRANDING,
  tenantSlug: '',
});

function mergeBranding(base: TenantBranding, fetched: Partial<TenantBranding>): TenantBranding {
  const merged = { ...base };
  for (const key of Object.keys(fetched) as (keyof TenantBranding)[]) {
    const value = fetched[key];
    if (value) {
      merged[key] = value as never;
    }
  }
  return merged;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { portal, tenantSlug } = resolvePortalContext();
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    if (portal !== 'public' || !tenantSlug) {
      return;
    }
    let cancelled = false;
    fetchPublicBranding(tenantSlug)
      .then((fetched) => {
        if (cancelled) {
          return;
        }
        setBranding(
          mergeBranding(DEFAULT_BRANDING, {
            primary: fetched.brandPrimary,
            secondary: fetched.brandSecondary,
            accent: fetched.brandAccent,
            background: fetched.brandBackground,
            text: fetched.brandText,
            button: fetched.brandButton,
            highlight: fetched.brandHighlight,
            tokens: parseBrandTokens(fetched.brandTokensJson),
            logoUrl: fetched.logoUrl || null,
            tenantName: fetched.name,
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [portal, tenantSlug]);

  useEffect(() => {
    if (portal !== 'public') {
      return;
    }
    applyBranding(branding);
  }, [portal, branding]);

  const value = useMemo(() => ({ branding, tenantSlug }), [branding, tenantSlug]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTenantBranding(): ThemeContextValue {
  return useContext(ThemeContext);
}
