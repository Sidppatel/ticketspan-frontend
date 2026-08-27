import type { Portal } from '@/shared/roles';

export interface PortalContext {
  portal: Portal;
  tenantSlug: string;
}

function readDevOverride(): Portal | null {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('portal');
    if (param === 'public' || param === 'admin' || param === 'staff' || param === 'developer') {
      window.localStorage.setItem('ticketspan-portal', param);
      return param;
    }
    const stored = window.localStorage.getItem('ticketspan-portal');
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
      window.localStorage.setItem('ticketspan-tenant', param);
      return param;
    }
    const stored = window.localStorage.getItem('ticketspan-tenant');
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
  const subLabel = hasSubdomain && first !== 'www' ? first : '';

  if (subLabel === 'admin' || subLabel === 'staff' || subLabel === 'developer') {
    const portal = subLabel as Portal;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ticketspan-tenant');
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

export function tenantUrl(slug: string): string {
  const { protocol, hostname, port } = window.location;
  const baseHost = hostname.endsWith('.localhost')
    ? hostname.slice(hostname.indexOf('.') + 1)
    : hostname.split('.').slice(-2).join('.');
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${slug}.${baseHost}${portSuffix}/`;
}

export function getRootDomainUrl(path: string = '/'): string {
  if (typeof window === 'undefined') return path;
  const { protocol, hostname, port } = window.location;
  let baseHost: string;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    baseHost = hostname;
  } else if (hostname.endsWith('.localhost')) {
    baseHost = hostname.slice(hostname.indexOf('.') + 1);
  } else {
    const parts = hostname.split('.');
    baseHost = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  }
  const portSuffix = port ? `:${port}` : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${protocol}//${baseHost}${portSuffix}${normalizedPath}`;
}

export function isTenantSubdomain(): boolean {
  const { portal, tenantSlug } = resolvePortalContext();
  return portal === 'public' && Boolean(tenantSlug);
}

export function getUniversalLoginUrl(returnUrl?: string): string {
  if (typeof window === 'undefined') return '/login';
  const targetReturn = returnUrl || window.location.href;
  const rootUrl = getRootDomainUrl('/login');
  const url = new URL(rootUrl);
  if (targetReturn && !targetReturn.includes('/login') && !targetReturn.includes('/register')) {
    url.searchParams.set('returnUrl', targetReturn);
  }
  return url.toString();
}

export function getUniversalRegisterUrl(returnUrl?: string): string {
  if (typeof window === 'undefined') return '/register';
  const targetReturn = returnUrl || window.location.href;
  const rootUrl = getRootDomainUrl('/register');
  const url = new URL(rootUrl);
  if (targetReturn && !targetReturn.includes('/login') && !targetReturn.includes('/register')) {
    url.searchParams.set('returnUrl', targetReturn);
  }
  return url.toString();
}

export function getRootCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
  if (hostname.endsWith('.localhost')) return '';
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return '.' + parts.slice(-2).join('.');
  }
  return '';
}
