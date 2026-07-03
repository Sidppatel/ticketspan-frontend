import { tenantClient, logClient, dashboardClient, tenantTierClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type {
  Tenant,
  CreateTenantResponse,
  TenantMember,
  TenantStripeStatus,
  TenantStripeProfile,
} from '@/shared/proto/tenant';
import type { LogEntry, DeveloperDashboard } from '@/shared/proto/admin';
import type { TenantReportingAccessRow } from '@/shared/proto/reporting';

export const TENANT_TIERS = ['free', 'starter', 'professional', 'business', 'enterprise'] as const;
export type TenantTier = (typeof TENANT_TIERS)[number];

export async function listTenantReportingAccess(search: string): Promise<TenantReportingAccessRow[]> {
  const response = await callRpc(() =>
    tenantTierClient.listTenantReportingAccess({ offset: 0, limit: 200, search }),
  );
  return response.tenants;
}

export async function setTenantTier(tenantsId: string, tier: TenantTier): Promise<string> {
  const response = await callRpc(() => tenantTierClient.setTenantTier({ tenantsId, tier }));
  return response.message;
}

export async function setTenantAdvancedReporting(tenantsId: string, enabled: boolean): Promise<string> {
  const response = await callRpc(() => tenantTierClient.setTenantAdvancedReporting({ tenantsId, enabled }));
  return response.message;
}

export async function getDeveloperDashboard(): Promise<DeveloperDashboard> {
  return callRpc(() => dashboardClient.getDeveloperDashboard({}));
}

export async function listTenantMembers(tenantsId: string): Promise<TenantMember[]> {
  const response = await callRpc(() => tenantClient.listTenantMembers({ value: tenantsId }));
  return response.members;
}

export async function getTenantStripeStatus(tenantsId: string): Promise<TenantStripeStatus> {
  return callRpc(() => tenantClient.getTenantStripeStatus({ value: tenantsId }));
}

export async function archiveTenant(tenantsId: string): Promise<void> {
  await callRpc(() => tenantClient.archiveTenant({ value: tenantsId }));
}

export async function getTenant(tenantsId: string): Promise<Tenant> {
  return callRpc(() => tenantClient.getTenant({ value: tenantsId }));
}

export interface UpdateTenantInput {
  tenantsId: string;
  name: string;
  legalName: string;
  countryCode: string;
}

export async function updateTenant(input: UpdateTenantInput): Promise<void> {
  await callRpc(() =>
    tenantClient.updateTenant({
      tenantsId: input.tenantsId,
      name: input.name,
      legalName: input.legalName,
      countryCode: input.countryCode,
    }),
  );
}

export async function getTenantStripeProfile(tenantsId: string): Promise<TenantStripeProfile> {
  return callRpc(() => tenantClient.getTenantStripeProfile({ value: tenantsId }));
}

export interface StripeProfileInput {
  tenantsId: string;
  businessType: string;
  businessName: string;
  businessUrl: string;
  productDescription: string;
  mcc: string;
  supportEmail: string;
}

export async function updateTenantStripeProfile(input: StripeProfileInput): Promise<void> {
  await callRpc(() =>
    tenantClient.updateTenantStripeProfile({
      tenantsId: input.tenantsId,
      businessType: input.businessType,
      businessName: input.businessName,
      businessUrl: input.businessUrl,
      productDescription: input.productDescription,
      mcc: input.mcc,
      supportEmail: input.supportEmail,
    }),
  );
}

export async function listTenants(): Promise<Tenant[]> {
  const response = await callRpc(() => tenantClient.listTenants({ offset: 0, limit: 100, search: '' }));
  return response.tenants;
}

export interface NewTenantInput {
  slug: string;
  name: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  legalName?: string;
  countryCode?: string;
  businessType?: string;
  businessUrl?: string;
  productDescription?: string;
  mcc?: string;
  supportEmail?: string;
}

export async function createTenant(input: NewTenantInput): Promise<CreateTenantResponse> {
  return callRpc(() =>
    tenantClient.createTenant({
      slug: input.slug,
      name: input.name,
      adminEmail: input.adminEmail,
      adminFirstName: input.adminFirstName,
      adminLastName: input.adminLastName,
      legalName: input.legalName || input.name,
      countryCode: input.countryCode || 'US',
      businessType: input.businessType ?? '',
      businessUrl: input.businessUrl ?? '',
      productDescription: input.productDescription ?? '',
      mcc: input.mcc ?? '',
      supportEmail: input.supportEmail ?? '',
    }),
  );
}

export async function getDeveloperLogs(): Promise<LogEntry[]> {
  const response = await callRpc(() =>
    logClient.getDeveloperLogs({
      page: { offset: 0, limit: 100, search: '' },
      action: '',
      entityType: '',
      from: '0',
      to: '0',
    }),
  );
  return response.entries;
}
