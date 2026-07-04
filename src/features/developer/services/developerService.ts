import { tenantClient, logClient, dashboardClient, tenantTierClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type {
  Tenant,
  CreateTenantResponse,
  TenantMember,
  TenantStripeStatus,
  TenantStripeProfile,
} from '@/shared/proto/tenant';
import type {
  LogEntry,
  DeveloperDashboard,
  ErrorLogEntry,
  ErrorLogPage,
  ErrorLogStats,
} from '@/shared/proto/admin';
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

export async function setTenantAch(tenantsId: string, enabled: boolean, feeFormulasId: string): Promise<string> {
  const response = await callRpc(() => tenantTierClient.setTenantAch({ tenantsId, enabled, feeFormulasId }));
  return response.message;
}

export async function getDeveloperDashboard(): Promise<DeveloperDashboard> {
  return callRpc(() => dashboardClient.getDeveloperDashboard({}));
}

export function achEnabledCount(tenants: Tenant[]): number {
  return tenants.filter((tenant) => tenant.achEnabled).length;
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

export type { ErrorLogEntry, ErrorLogPage, ErrorLogStats };

export const ERROR_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Warning', 'Info', 'Error'] as const;
export const ERROR_SOURCES = ['backend', 'frontend'] as const;
export const RESOLVED_FILTER_ALL = 0;
export const RESOLVED_FILTER_UNRESOLVED = 1;
export const RESOLVED_FILTER_RESOLVED = 2;

export interface ErrorLogFilters {
  severity: string;
  source: string;
  resolvedFilter: number;
  search: string;
  offset: number;
  limit: number;
}

export async function getErrorLogs(filters: ErrorLogFilters): Promise<ErrorLogPage> {
  return callRpc(() =>
    logClient.getErrorLogs({
      page: { offset: filters.offset, limit: filters.limit, search: '' },
      severity: filters.severity,
      source: filters.source,
      resolvedFilter: filters.resolvedFilter,
      search: filters.search,
      from: '0',
      to: '0',
    }),
  );
}

export async function getErrorLogStats(): Promise<ErrorLogStats> {
  return callRpc(() => logClient.getErrorLogStats({}));
}

export async function resolveErrorLog(errorLogId: string, notes: string): Promise<string> {
  const response = await callRpc(() => logClient.resolveErrorLog({ errorLogId, notes }));
  return response.message;
}

export function nextPageOffset(offset: number, limit: number): number {
  return offset + limit;
}

export function previousPageOffset(offset: number, limit: number): number {
  return Math.max(0, offset - limit);
}

export function hasNextPage(offset: number, limit: number, total: number): boolean {
  return offset + limit < total;
}

export function pageLabel(offset: number, limit: number, total: number): string {
  if (total === 0) {
    return 'No entries';
  }
  const first = offset + 1;
  const last = Math.min(offset + limit, total);
  return `${first}–${last} of ${total}`;
}

export async function getDeveloperLogs(): Promise<LogEntry[]> {
  const response = await callRpc(() =>
    logClient.getDeveloperLogs({
      page: { offset: 0, limit: 100, search: '' },
      action: '',
      entityType: '',
      from: '0',
      to: '0',
      eventsId: '',
    }),
  );
  return response.entries;
}
