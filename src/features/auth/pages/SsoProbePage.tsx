import { useLayoutEffect } from 'react';
import { useAuthStore, readStoredAuth } from '@/shared/auth/store';
import { resolvePortalContext } from '@/shared/subdomain';

function isAllowedTenantTarget(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl, typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173');
    const host = parsed.hostname;
    const labels = host.split('.');
    const first = labels[0];
    const hasSubdomain = host.endsWith('.localhost')
      ? labels.length > 1
      : host.endsWith('.pages.dev')
        ? labels.length > 3
        : labels.length > 2;
    const subLabel = hasSubdomain && first !== 'www' ? first : '';
    if (subLabel === 'admin' || subLabel === 'staff' || subLabel === 'developer') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function SsoProbePage({ mode = 'probe' }: { mode?: 'probe' | 'logout' }) {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const rawReturn = params.get('returnUrl') || params.get('returnTo');
    const safeTarget = rawReturn && isAllowedTenantTarget(rawReturn) ? rawReturn : '/';

    if (mode === 'logout') {
      useAuthStore.getState().clear();
      try {
        window.sessionStorage.setItem('ts_sso_probed', '1');
      } catch (e) {
        void e;
      }
      try {
        const target = new URL(safeTarget, window.location.href);
        target.searchParams.set('sso_probed', '1');
        window.location.replace(target.toString());
      } catch {
        window.location.replace(safeTarget);
      }
      return;
    }

    const { portal } = resolvePortalContext();
    if (portal !== 'public') {
      window.location.replace(safeTarget);
      return;
    }

    const auth = readStoredAuth();
    try {
      const target = new URL(safeTarget, window.location.href);
      target.searchParams.set('sso_probed', '1');

      if (auth?.accessToken && auth.user) {
        const payload = {
          accessToken: auth.accessToken,
          expiresAtSeconds: auth.expiresAtSeconds,
          user: auth.user,
        };
        const syncHash = `auth_sync=${encodeURIComponent(JSON.stringify(payload))}`;
        target.hash = target.hash ? `${target.hash}&${syncHash}` : syncHash;
      }

      window.location.replace(target.toString());
    } catch {
      window.location.replace(safeTarget);
    }
  }, [mode]);

  return <div className="min-h-screen bg-background" />;
}
