import { useAuthStore } from '@/shared/auth/store';
import { currentTenantSlug, resolvePortalContext, isTenantSubdomain, getRootDomainUrl } from '@/shared/subdomain';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5262';
export const CLIENT_ID = 'ticketspan_spa';
export const SCOPES = 'openid profile email roles offline_access ticketspan_api';

export function buildAuthorizeUrl(redirectUri: string, state?: string, prompt?: string): string {
  const url = new URL(`${BACKEND_URL}/connect/authorize`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  if (state) {
    url.searchParams.set('state', state);
  }
  if (prompt) {
    url.searchParams.set('prompt', prompt);
  }
  return url.toString();
}

export interface OidcTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
}

export interface OidcUserProfile {
  sub: string;
  email: string;
  name: string;
  role: number;
  tenantSlug: string;
  tenantsId: string;
}

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export function extractUserProfile(tokens: OidcTokenResponse): OidcUserProfile {
  const sourceToken = tokens.id_token || tokens.access_token;
  const payload = parseJwtPayload(sourceToken);

  const sub = String(payload.sub ?? '');
  const email = String(payload.email ?? '');
  const name = String(payload.name ?? email);
  const roleRaw = payload.role;
  const role = typeof roleRaw === 'number' ? roleRaw : parseInt(String(roleRaw ?? '0'), 10) || 0;
  const tenantSlug = String(payload.tenant_slug ?? '');
  const tenantsId = String(payload.tenants_id ?? '');

  return { sub, email, name, role, tenantSlug, tenantsId };
}

export async function loginWithPassword(email: string, password: string): Promise<OidcUserProfile> {
  const portal = resolvePortalContext().portal || 'public';
  const tenantSlug = currentTenantSlug() || '';

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT_ID,
    username: email,
    password: password,
    scope: SCOPES,
    portal: portal,
    tenant_slug: tenantSlug,
  });

  const response = await fetch(`${BACKEND_URL}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-portal': portal,
      'x-tenant-slug': tenantSlug,
    },
    body: body.toString(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const desc = errJson.error_description || errJson.error || 'Invalid credentials';
    throw new Error(desc);
  }

  const tokens: OidcTokenResponse = await response.json();
  const user = extractUserProfile(tokens);

  useAuthStore.getState().setSession(tokens, user);
  return user;
}

export async function exchangeAuthCode(code: string, redirectUri: string): Promise<OidcUserProfile> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code: code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${BACKEND_URL}/connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error_description || 'Authorization code exchange failed');
  }

  const tokens: OidcTokenResponse = await response.json();
  const user = extractUserProfile(tokens);

  useAuthStore.getState().setSession(tokens, user);
  return user;
}

export async function refreshOidcToken(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return false;

  const portal = resolvePortalContext().portal || 'public';
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(`${BACKEND_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-portal': portal,
      },
      body: body.toString(),
      credentials: 'include',
    });

    if (!response.ok) {
      useAuthStore.getState().clear();
      return false;
    }

    const tokens: OidcTokenResponse = await response.json();
    const user = extractUserProfile(tokens);
    useAuthStore.getState().setSession(tokens, user);
    return true;
  } catch {
    return false;
  }
}

let silentCheckPromise: Promise<boolean> | null = null;

export async function silentSsoCheck(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (useAuthStore.getState().isSessionValid()) return true;
  if (silentCheckPromise) return silentCheckPromise;

  silentCheckPromise = new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      silentCheckPromise = null;
      resolve(false);
    }, 5000);

    const redirectUri = `${window.location.origin}/callback`;
    const authorizeUrl = buildAuthorizeUrl(redirectUri, undefined, 'none');

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OIDC_CODE' && event.data?.code) {
        clearTimeout(timeout);
        cleanup();
        silentCheckPromise = null;
        exchangeAuthCode(event.data.code, redirectUri)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      } else if (event.data?.type === 'OIDC_ERROR') {
        clearTimeout(timeout);
        cleanup();
        silentCheckPromise = null;
        resolve(false);
      }
    }

    function cleanup() {
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }

    window.addEventListener('message', handleMessage);
    iframe.src = authorizeUrl;
    document.body.appendChild(iframe);
  });

  return silentCheckPromise;
}

export async function oidcLogout(redirectCentral: boolean = true): Promise<void> {
  const { accessToken, idToken, user } = useAuthStore.getState();
  const body = new URLSearchParams();
  if (user?.usersId) {
    body.append('users_id', user.usersId);
  }
  if (idToken) {
    body.append('id_token_hint', idToken);
  }
  if (accessToken) {
    body.append('token', accessToken);
  }

  try {
    await fetch(`${BACKEND_URL}/connect/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body.toString(),
      credentials: 'include',
    });
    await fetch(`${BACKEND_URL}/connect/logout`, {
      method: 'GET',
      credentials: 'include',
    }).catch(() => {});
  } catch {
  } finally {
    useAuthStore.getState().clear();
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('ts_auth_sync');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }
    } catch {
    }

    if (redirectCentral && typeof window !== 'undefined') {
      const isSub = isTenantSubdomain();
      if (isSub) {
        const target = getRootDomainUrl('/logout') + `?returnUrl=${encodeURIComponent(window.location.origin)}`;
        window.location.replace(target);
      }
    }
  }
}
