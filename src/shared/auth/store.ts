import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AuthResponse } from '@/shared/proto/auth';
import { getRootCookieDomain } from '@/shared/subdomain';

const COOKIE_NAME = 'ticketspan_session';

export interface PersistedAuthPayload {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAtSeconds: number | null;
  user: UserProfile | null;
}

export function setCrossDomainCookie(payload: PersistedAuthPayload) {
  if (typeof document === 'undefined') return;
  try {
    const domain = getRootCookieDomain();
    const domainAttr = domain ? `; domain=${domain}` : '';
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    const json = JSON.stringify(payload);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(json)}; path=/; max-age=604800; SameSite=Lax${domainAttr}${secure}`;
  } catch (error) {
    void error;
  }
}

export function clearCrossDomainCookie() {
  if (typeof document === 'undefined') return;
  try {
    const domain = getRootCookieDomain();
    const domainAttr = domain ? `; domain=${domain}` : '';
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch (error) {
    void error;
  }
}

export function readCrossDomainCookie(): PersistedAuthPayload | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
    if (!match) return null;
    const json = decodeURIComponent(match[2]);
    return JSON.parse(json) as PersistedAuthPayload;
  } catch (error) {
    void error;
    return null;
  }
}

export function readAuthFromUrlHash(): PersistedAuthPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('auth_sync=')) return null;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const raw = params.get('auth_sync');
    if (!raw) return null;
    const payload = JSON.parse(decodeURIComponent(raw)) as PersistedAuthPayload;
    // Clean up auth_sync from hash so address bar stays clean
    params.delete('auth_sync');
    const remaining = params.toString();
    const newUrl =
      window.location.pathname +
      window.location.search +
      (remaining ? `#${remaining}` : '');
    window.history.replaceState(null, '', newUrl);
    // Write directly to local storage and cookies on this host
    window.localStorage.setItem('ticketspan-auth', JSON.stringify({ state: payload, version: 0 }));
    setCrossDomainCookie(payload);
    return payload;
  } catch (e) {
    void e;
    return null;
  }
}

export function readStoredAuth(): PersistedAuthPayload | null {
  if (typeof window === 'undefined') return null;
  // 1. First check URL hash if just transferred
  const fromHash = readAuthFromUrlHash();
  if (fromHash?.accessToken) return fromHash;

  // 2. Check localStorage
  try {
    const raw = window.localStorage.getItem('ticketspan-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = (parsed && typeof parsed === 'object' && 'state' in parsed) ? parsed.state : parsed;
      if (state?.accessToken) {
        return {
          accessToken: state.accessToken ?? null,
          refreshToken: state.refreshToken ?? null,
          expiresAtSeconds: state.expiresAtSeconds ?? null,
          user: state.user ?? null,
        };
      }
    }
  } catch (e) {
    void e;
  }

  // 3. Check document.cookie
  return readCrossDomainCookie();
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAtSeconds: number | null;
  user: UserProfile | null;
  setSession: (auth: AuthResponse) => void;
  setUser: (user: UserProfile) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

const initialPayload = readStoredAuth();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: initialPayload?.accessToken ?? null,
      refreshToken: initialPayload?.refreshToken ?? null,
      expiresAtSeconds: initialPayload?.expiresAtSeconds ?? null,
      user: initialPayload?.user ?? null,
      setSession: (auth) => {
        const nextUser = auth.user ?? get().user;
        const payload: PersistedAuthPayload = {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAtSeconds: Number(auth.expiresAt),
          user: nextUser,
        };
        try {
          window.localStorage.setItem('ticketspan-auth', JSON.stringify({ state: payload, version: 0 }));
        } catch (e) {
          void e;
        }
        setCrossDomainCookie(payload);
        set(payload);
      },
      setUser: (user) => {
        const current = get();
        const payload: PersistedAuthPayload = {
          accessToken: current.accessToken,
          refreshToken: current.refreshToken,
          expiresAtSeconds: current.expiresAtSeconds,
          user,
        };
        try {
          window.localStorage.setItem('ticketspan-auth', JSON.stringify({ state: payload, version: 0 }));
        } catch (e) {
          void e;
        }
        setCrossDomainCookie(payload);
        set({ user });
      },
      clear: () => {
        clearCrossDomainCookie();
        try {
          window.localStorage.removeItem('ticketspan-auth');
        } catch (e) {
          void e;
        }
        set({
          accessToken: null,
          refreshToken: null,
          expiresAtSeconds: null,
          user: null,
        });
      },
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'ticketspan-auth',
      merge: (persistedState, currentState) => {
        const typedPersisted = (persistedState && typeof persistedState === 'object' && 'state' in persistedState)
          ? (persistedState as { state: Partial<PersistedAuthPayload> }).state
          : (persistedState as Partial<PersistedAuthPayload> | undefined);

        const currentOrFallback = readStoredAuth();

        const token = typedPersisted?.accessToken || currentState?.accessToken || currentOrFallback?.accessToken || null;
        const refreshToken = typedPersisted?.refreshToken || currentState?.refreshToken || currentOrFallback?.refreshToken || null;
        const expiresAt = typedPersisted?.expiresAtSeconds || currentState?.expiresAtSeconds || currentOrFallback?.expiresAtSeconds || null;
        const user = typedPersisted?.user || currentState?.user || currentOrFallback?.user || null;

        return {
          ...currentState,
          accessToken: token,
          refreshToken: refreshToken,
          expiresAtSeconds: expiresAt,
          user: user,
        };
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAtSeconds: state.expiresAtSeconds,
        user: state.user,
      }),
    },
  ),
);

export function getAccessToken(): string | null {
  const inStore = useAuthStore.getState().accessToken;
  if (inStore) return inStore;
  const fallback = readStoredAuth();
  return fallback?.accessToken ?? null;
}
