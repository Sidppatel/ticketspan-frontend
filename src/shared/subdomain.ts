import type { Portal } from '@/shared/roles';

export interface PortalContext {
  portal: Portal;
  tenantSlug: string;
}

function readDevOverride(): Portal | null {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('portal');
    if (param === 'public' || param === 'admin' || param === 'staff' || param === 'developer') {
      window.localStorage.setItem('svyne-portal', param);
      return param;
    }
    const stored = window.localStorage.getItem('svyne-portal');
    if (stored === 'public' || stored === 'admin' || stored === 'staff' || stored === 'developer') {
      return stored;
    }
  }
  const fromEnv = import.meta.env.VITE_PORTAL;
  if (fromEnv === 'public' || fromEnv === 'admin' || fromEnv === 'staff' || fromEnv === 'developer') {
    return fromEnv;
  }
  return null;
}

function readDevTenant(): string {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('tenant');
    if (param) {
      window.localStorage.setItem('svyne-tenant', param);
      return param;
    }
    const stored = window.localStorage.getItem('svyne-tenant');
    if (stored) {
      return stored;
    }
  }
  return import.meta.env.VITE_TENANT_SLUG ?? '';
}

export function resolvePortalContext(): PortalContext {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const labels = host.split('.');
  const first = labels[0];
  const hasSubdomain = host.endsWith('.localhost')
    ? labels.length > 1
    : host.endsWith('.pages.dev')
      ? labels.length > 3
      : labels.length > 2;
  const subLabel = hasSubdomain ? first : '';

  if (subLabel === 'admin' || subLabel === 'staff' || subLabel === 'developer') {
    const portal = subLabel as Portal;
    
    
    
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('svyne-tenant');
    }
    return { portal, tenantSlug: '' };
  }

  if (path.startsWith('/staff')) {
    return { portal: 'staff', tenantSlug: subLabel || readDevTenant() };
  }

  if (subLabel) {
    return { portal: 'public', tenantSlug: subLabel };
  }

  const override = readDevOverride();
  if (override && override !== 'public') {
    return { portal: override, tenantSlug: override === 'developer' ? '' : readDevTenant() };
  }
  return { portal: 'public', tenantSlug: '' };
}

export function currentTenantSlug(): string {
  return resolvePortalContext().tenantSlug;
}
