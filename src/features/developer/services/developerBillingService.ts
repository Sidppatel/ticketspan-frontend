import { developerBillingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type {
  TenantBillingRow,
  EventUpgradeRow,
  TenantAddonRow,
  FeeOverrideRow,
  RevenueReport,
  TenantActivityRow,
} from '@/shared/proto/billing';

export type {
  TenantBillingRow,
  EventUpgradeRow,
  TenantAddonRow,
  FeeOverrideRow,
  RevenueReport,
  TenantActivityRow,
};

export const SUBSCRIPTION_TIERS = ['starter', 'professional', 'business', 'enterprise'] as const;
export const EVENT_TIERS = ['starter_event', 'pro_event', 'business_event', 'enterprise_event'] as const;
export const ADDON_TYPES = ['custom_domain', 'advanced_analytics', 'sms', 'extra_manager'] as const;

export async function listTenantBilling(search: string): Promise<TenantBillingRow[]> {
  const response = await callRpc(() =>
    developerBillingClient.listTenantBilling({ offset: 0, limit: 200, search }),
  );
  return response.tenants;
}

export async function startTrial(tenantsId: string): Promise<string> {
  const response = await callRpc(() => developerBillingClient.startTrial({ tenantsId }));
  return response.message;
}

export async function createSubscription(tenantsId: string, tier: string, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.createSubscription({ tenantsId, tier, reason }),
  );
  return response.message;
}

export async function changeSubscriptionTier(tenantsId: string, tier: string, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.changeSubscriptionTier({ tenantsId, tier, reason }),
  );
  return response.message;
}

export async function cancelSubscription(tenantsId: string, atPeriodEnd: boolean, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.cancelSubscription({ tenantsId, atPeriodEnd, reason }),
  );
  return response.message;
}

export async function listEventUpgrades(search: string): Promise<EventUpgradeRow[]> {
  const response = await callRpc(() =>
    developerBillingClient.listEventUpgrades({ offset: 0, limit: 200, search }),
  );
  return response.upgrades;
}

export async function activateEventUpgrade(eventsId: string, tier: string, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.activateEventUpgrade({ eventsId, tier, reason }),
  );
  return response.message;
}

export async function cancelEventUpgrade(eventsId: string, refundCents: number, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.cancelEventUpgrade({ eventsId, refundCents, reason }),
  );
  return response.message;
}

export async function listTenantAddons(tenantsId: string): Promise<TenantAddonRow[]> {
  const response = await callRpc(() => developerBillingClient.listTenantAddons({ tenantsId }));
  return response.addons;
}

export async function provisionAddon(
  tenantsId: string,
  type: string,
  billingPeriod: string,
  quantity: number,
  reason: string,
): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.provisionAddon({ tenantsId, type, billingPeriod, quantity, reason }),
  );
  return response.message;
}

export async function cancelAddon(tenantAddonsId: string, refundCents: number, reason: string): Promise<string> {
  const response = await callRpc(() =>
    developerBillingClient.cancelAddon({ tenantAddonsId, refundCents, reason }),
  );
  return response.message;
}

export async function listFeeOverrides(): Promise<FeeOverrideRow[]> {
  const response = await callRpc(() => developerBillingClient.listFeeOverrides({}));
  return response.overrides;
}

export interface EventFeeOverrideInput {
  eventsId: string;
  percentBps: number;
  flatCents: number;
  minFeeCents: number;
  maxFeeCents: number;
  expiresAtEpochSeconds: string;
  reason: string;
}

export async function setEventFeeOverride(input: EventFeeOverrideInput): Promise<string> {
  const response = await callRpc(() => developerBillingClient.setEventFeeOverride(input));
  return response.message;
}

export async function clearEventFeeOverride(eventsId: string, reason: string): Promise<string> {
  const response = await callRpc(() => developerBillingClient.clearEventFeeOverride({ eventsId, reason }));
  return response.message;
}

export async function getRevenueReport(fromEpochSeconds: string, toEpochSeconds: string): Promise<RevenueReport> {
  return callRpc(() => developerBillingClient.getRevenueReport({ fromEpochSeconds, toEpochSeconds }));
}

export async function getTenantActivity(search: string, tier: string): Promise<TenantActivityRow[]> {
  const response = await callRpc(() =>
    developerBillingClient.getTenantActivity({
      fromEpochSeconds: '0',
      toEpochSeconds: '0',
      search,
      tier,
      offset: 0,
      limit: 200,
    }),
  );
  return response.rows;
}

export function percentToBps(percent: string): number {
  return Math.round(parseFloat(percent) * 100) || 0;
}

export function dateToEpochSeconds(date: string): string {
  return date ? String(Math.floor(new Date(date).getTime() / 1000)) : '0';
}

export function formatBpsFee(percentBps: number, flatCents: number): string {
  return `${(percentBps / 100).toFixed(1)}% + ${centsToUSD(flatCents)}`;
}

export function tierLabel(tier: string): string {
  return tier
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function subscriptionSummary(row: TenantBillingRow): string {
  if (!row.subscriptionStatus) {
    return '—';
  }
  if (row.subscriptionStatus === 'trial') {
    return 'Trial';
  }
  const base = `${tierLabel(row.subscriptionTier)} · ${centsToUSD(row.monthlyPriceCents)}/mo`;
  if (row.cancelAtPeriodEnd) {
    return `${base} · cancels at period end`;
  }
  if (row.pendingTier) {
    return `${base} · downgrades to ${tierLabel(row.pendingTier)}`;
  }
  return base;
}

export function overrideDiscount(row: FeeOverrideRow): string {
  const standard = formatBpsFee(row.standardPercentBps, row.standardFlatCents);
  const actual = formatBpsFee(row.percentBps, row.flatCents);
  return `${standard} → ${actual}`;
}

export function sumRevenueCents(rows: { revenueCents: string }[]): number {
  return rows.reduce((total, row) => total + Number(row.revenueCents), 0);
}

export function trendMax(points: { serviceFeeCents: string; billingCents: string }[]): number {
  return points.reduce(
    (max, point) => Math.max(max, Number(point.serviceFeeCents) + Number(point.billingCents)),
    1,
  );
}

export function trendBarPercents(
  points: { serviceFeeCents: string; billingCents: string }[],
): { total: string; heightPct: number }[] {
  const max = trendMax(points);
  return points.map((point) => {
    const total = Number(point.serviceFeeCents) + Number(point.billingCents);
    return { total: centsToUSD(total), heightPct: Math.round((total / max) * 100) };
  });
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
