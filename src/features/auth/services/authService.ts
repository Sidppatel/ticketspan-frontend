import { authClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { currentTenantSlug, resolvePortalContext } from '@/shared/subdomain';
import { useAuthStore } from '@/shared/auth/store';
import type { AuthResponse, UserProfile } from '@/shared/proto/auth';

export async function loginWithPassword(email: string, password: string): Promise<AuthResponse> {
  const auth = await callRpc(() =>
    authClient.login({
      email,
      password,
      tenantSlug: currentTenantSlug(),
      portal: resolvePortalContext().portal,
    }),
  );
  useAuthStore.getState().setSession(auth);
  return auth;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  const auth = await callRpc(() =>
    authClient.signUp({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      tenantSlug: currentTenantSlug(),
    }),
  );
  useAuthStore.getState().setSession(auth);
  return auth;
}

export async function loginWithGoogle(googleToken: string): Promise<AuthResponse> {
  const auth = await callRpc(() =>
    authClient.googleSignIn({
      googleToken,
      tenantSlug: currentTenantSlug(),
      portal: resolvePortalContext().portal,
    }),
  );
  useAuthStore.getState().setSession(auth);
  return auth;
}

export async function requestMagicLink(email: string): Promise<void> {
  await callRpc(() => authClient.requestMagicLink({ email, tenantSlug: currentTenantSlug() }));
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  const auth = await callRpc(() => authClient.verifyMagicLink({ token }));
  useAuthStore.getState().setSession(auth);
  return auth;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await callRpc(() =>
    authClient.requestPasswordReset({
      email,
      tenantSlug: currentTenantSlug(),
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    }),
  );
}

export async function validateResetToken(token: string): Promise<void> {
  await callRpc(() => authClient.validatePasswordResetToken({ token }));
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  await callRpc(() => authClient.setPassword({ token, newPassword }));
}

export async function loadProfile(): Promise<UserProfile> {
  const profile = await callRpc(() => authClient.me({}));
  useAuthStore.getState().setUser(profile);
  return profile;
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  const profile = await callRpc(() => authClient.updateProfile(input));
  useAuthStore.getState().setUser(profile);
}

export async function setAvatar(imagesId: string): Promise<void> {
  const profile = await callRpc(() => authClient.setAvatar({ imagesId }));
  useAuthStore.getState().setUser(profile);
}

export async function logout(): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken ?? '';
  try {
    await callRpc(() => authClient.logout({ sessionHash: refreshToken }));
  } finally {
    useAuthStore.getState().clear();
  }
}
