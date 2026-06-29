import { tenantClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Tenant, TenantStripeProfile } from '@/shared/proto/tenant';

export interface TenantContactInput {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
}

export async function getMyTenant(): Promise<Tenant> {
  return callRpc(() => tenantClient.getMyTenant({}));
}

export async function updateMyTenantContact(input: TenantContactInput): Promise<void> {
  await callRpc(() => tenantClient.updateMyTenantContact(input));
}

export interface TenantBrandingInput {
  logoImagesId: string;
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
}

export async function updateMyTenantBranding(input: TenantBrandingInput): Promise<void> {
  await callRpc(() => tenantClient.updateMyTenantBranding(input));
}

export async function getTenantStripeProfile(tenantsId: string): Promise<TenantStripeProfile> {
  return callRpc(() => tenantClient.getTenantStripeProfile({ value: tenantsId }));
}
