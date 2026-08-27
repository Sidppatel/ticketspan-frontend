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
    const hash = window.location.hash;
    if (!hash || !hash.includes('auth_sync=')) return null;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const raw = params.get('auth_sync');
    if (!raw) return null;
    const payload = JSON.parse(decodeURIComponent(raw)) as PersistedAuthPayload;

    params.delete('auth_sync');
    const remaining = params.toString();
    const newUrl =
      window.location.pathname +
      window.location.search +
      (remaining ? `#${remaining}` : '');
    window.history.replaceState(null, '', newUrl);

    return {
      accessToken: payload.accessToken ?? null,
      expiresAtSeconds: payload.expiresAtSeconds ?? null,
      user: payload.user ?? null,
    };
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
