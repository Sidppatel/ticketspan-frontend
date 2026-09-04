import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AuthResponse } from '@/shared/proto/auth';

const COOKIE_NAME = 'ticketspan_session';

export interface PersistedAuthPayload {
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAtSeconds: number | null;
  user: UserProfile | null;
}

export function clearCrossDomainCookie() {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch (error) {
    void error;
  }
}

export function readAuthFromUrlHash(): PersistedAuthPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const host = window.location.hostname;
    const labels = host.split('.');
    const first = labels[0];
    const hasSubdomain = host.endsWith('.localhost')
      ? labels.length > 1
      : host.endsWith('.pages.dev')
        ? labels.length > 3
        : labels.length > 2;
    const subLabel = hasSubdomain && first !== 'www' ? first : '';
    if (subLabel === 'admin' || subLabel === 'staff' || subLabel === 'developer') {
      return null;
    }

    let raw: string | null = null;
    const hash = window.location.hash;
    if (hash && hash.includes('auth_sync=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      raw = params.get('auth_sync');
      if (raw) {
        params.delete('auth_sync');
        const remaining = params.toString();
        const newUrl =
          window.location.pathname +
          window.location.search +
          (remaining ? `#${remaining}` : '');
        window.history.replaceState(null, '', newUrl);
      }
    }

    if (!raw && window.location.search.includes('auth_sync=')) {
      const searchParams = new URLSearchParams(window.location.search);
      raw = searchParams.get('auth_sync');
      if (raw) {
        searchParams.delete('auth_sync');
        const remainingSearch = searchParams.toString();
        const cleanUrl =
          window.location.pathname +
          (remainingSearch ? `?${remainingSearch}` : '') +
          window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
      }
    }

    if (!raw) return null;
    const payload = JSON.parse(decodeURIComponent(raw)) as PersistedAuthPayload;
    const result: PersistedAuthPayload = {
      accessToken: payload.accessToken ?? null,
      expiresAtSeconds: payload.expiresAtSeconds ?? null,
      user: payload.user ?? null,
    };

    if (result.accessToken) {
      try {
        window.sessionStorage.removeItem('ts_sso_probed');
      } catch (err) {
        void err;
      }
      try {
        window.localStorage.setItem(
          'ticketspan-auth',
          JSON.stringify({
            state: {
              accessToken: result.accessToken,
              expiresAtSeconds: result.expiresAtSeconds,
              user: result.user,
            },
            version: 0,
          }),
        );
      } catch (err) {
        void err;
      }
    }

    return result;
  } catch (e) {
    void e;
    return null;
  }
}

export function readStoredAuth(): PersistedAuthPayload | null {
  if (typeof window === 'undefined') return null;

  const fromHash = readAuthFromUrlHash();
  if (fromHash?.accessToken) return fromHash;

  try {
    const raw = window.localStorage.getItem('ticketspan-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = (parsed && typeof parsed === 'object' && 'state' in parsed) ? parsed.state : parsed;
      if (state?.accessToken) {
        return {
          accessToken: state.accessToken ?? null,
          expiresAtSeconds: state.expiresAtSeconds ?? null,
          user: state.user ?? null,
        };
      }
    }
  } catch (e) {
    void e;
  }

  return null;
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
      refreshToken: null,
      expiresAtSeconds: initialPayload?.expiresAtSeconds ?? null,
      user: initialPayload?.user ?? null,
      setSession: (auth) => {
        try {
          window.sessionStorage.removeItem('ts_sso_probed');
        } catch (e) {
          void e;
        }
        const nextUser = auth.user ?? get().user;
        set({
          accessToken: auth.accessToken,
          refreshToken: null,
          expiresAtSeconds: Number(auth.expiresAt),
          user: nextUser,
        });
      },
      setUser: (user) => {
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
        const expiresAt = typedPersisted?.expiresAtSeconds || currentState?.expiresAtSeconds || currentOrFallback?.expiresAtSeconds || null;
        const user = typedPersisted?.user || currentState?.user || currentOrFallback?.user || null;

        return {
          ...currentState,
          accessToken: token,
          refreshToken: null,
          expiresAtSeconds: expiresAt,
          user: user,
        };
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'ticketspan-auth') {
      const updated = readStoredAuth();
      useAuthStore.setState({
        accessToken: updated?.accessToken ?? null,
        expiresAtSeconds: updated?.expiresAtSeconds ?? null,
        user: updated?.user ?? null,
      });
    }
  });
}
