import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OidcTokenResponse, OidcUserProfile } from '@/shared/auth/oidc';
import type { UserProfile } from '@/shared/api/userApi';

export interface AuthUser {
  usersId: string;
  email: string;
  name: string;
  role: number;
  tenantSlug: string;
  tenantsId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  phone?: string;
  addressLine?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  billingAddressLine?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  googleConnected?: boolean;
  bio?: string;
  pronouns?: string;
  preferencesJson?: string;
}

export interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresAtSeconds: number | null;
  user: AuthUser | null;
  setSession: (tokens: OidcTokenResponse, user: OidcUserProfile) => void;
  setUserProfile: (profile: UserProfile) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      expiresAtSeconds: null,
      user: null,
      setSession: (tokens, user) => {
        const existing = get().user;
        const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600);
        set({
          accessToken: tokens.access_token,
          idToken: tokens.id_token ?? null,
          refreshToken: tokens.refresh_token ?? get().refreshToken,
          expiresAtSeconds: expiresAt,
          user: {
            usersId: user.sub,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantSlug: user.tenantSlug,
            tenantsId: user.tenantsId,
            firstName: existing?.firstName,
            lastName: existing?.lastName,
            avatarUrl: existing?.avatarUrl,
            emailVerified: existing?.emailVerified,
            phone: existing?.phone,
            addressLine: existing?.addressLine,
            address: existing?.address,
            city: existing?.city,
            state: existing?.state,
            zip: existing?.zip,
            billingAddressLine: existing?.billingAddressLine,
            billingAddress: existing?.billingAddress,
            billingCity: existing?.billingCity,
            billingState: existing?.billingState,
            billingZip: existing?.billingZip,
            googleConnected: existing?.googleConnected,
            bio: existing?.bio,
            pronouns: existing?.pronouns,
            preferencesJson: existing?.preferencesJson,
          },
        });
      },
      setUserProfile: (profile) => {
        set({
          user: {
            usersId: profile.usersId,
            email: profile.email,
            name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
            role: profile.role,
            tenantSlug: profile.tenantSlug,
            tenantsId: profile.tenantsId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl,
            emailVerified: profile.emailVerified,
            phone: profile.phone,
            addressLine: profile.addressLine,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zip: profile.zip,
            billingAddressLine: profile.billingAddressLine,
            billingAddress: profile.billingAddress,
            billingCity: profile.billingCity,
            billingState: profile.billingState,
            billingZip: profile.billingZip,
            googleConnected: profile.googleConnected,
            bio: profile.bio,
            pronouns: profile.pronouns,
            preferencesJson: profile.preferencesJson,
          },
        });
      },
      clear: () => {
        set({
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAtSeconds: null,
          user: null,
        });
      },
      isAuthenticated: () => Boolean(get().accessToken),
      isSessionValid: () => {
        const { accessToken, expiresAtSeconds } = get();
        if (!accessToken) return false;
        if (!expiresAtSeconds) return true;
        return expiresAtSeconds > Math.floor(Date.now() / 1000) + 30;
      },
    }),
    {
      name: 'ticketspan-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        idToken: state.idToken,
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
