import { getAccessToken, useAuthStore } from '@/shared/auth/store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5262';

export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  addressLine?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  emailOptIn?: boolean;
  bio?: string;
  pronouns?: string;
  preferencesJson?: string;
  billingAddressLine?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
}

export interface UserProfile {
  usersId: string;
  tenantsId: string;
  role: number;
  tenantSlug: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  phone: string;
  avatarUrl: string;
  addressLine: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  googleConnected: boolean;
  bio: string;
  pronouns: string;
  preferencesJson: string;
  billingAddressLine: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function loadProfile(): Promise<UserProfile> {
  const token = getAccessToken();
  const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clear();
    }
    throw new Error('Failed to load profile');
  }

  const raw = await response.json();
  const profile: UserProfile = {
    ...raw,
    addressLine: raw.address ?? raw.addressLine ?? '',
    billingAddressLine: raw.billingAddress ?? raw.billingAddressLine ?? '',
  };

  useAuthStore.getState().setUserProfile(profile);
  return profile;
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  const token = getAccessToken();
  const payload = {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    address: input.addressLine ?? input.address,
    city: input.city,
    state: input.state,
    zip: input.zip,
    emailOptIn: input.emailOptIn,
    bio: input.bio,
    pronouns: input.pronouns,
    preferencesJson: input.preferencesJson,
    billingAddress: input.billingAddressLine ?? input.billingAddress,
    billingCity: input.billingCity,
    billingState: input.billingState,
    billingZip: input.billingZip,
  };

  const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
}

export async function setAvatar(imagesId: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${BACKEND_URL}/api/v1/users/me/avatar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: JSON.stringify({ imagesId }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to set avatar');
  }
}

export async function removeAvatar(): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${BACKEND_URL}/api/v1/users/me/avatar`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to remove avatar');
  }
}

export async function registerUser(input: RegisterUserInput): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Registration failed');
  }
}
