import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AuthResponse } from '@/shared/proto/auth';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAtSeconds: null,
      user: null,
      setSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          expiresAtSeconds: Number(auth.expiresAt),
          user: auth.user ?? get().user,
        }),
      setUser: (user) => set({ user }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          expiresAtSeconds: null,
          user: null,
        }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'entryvine-auth',
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
  return useAuthStore.getState().accessToken;
}
