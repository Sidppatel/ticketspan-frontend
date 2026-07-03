import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  listTenantBilling,
  listTenantAddons,
  startTrial,
  createSubscription,
  changeSubscriptionTier,
  cancelSubscription,
  provisionAddon,
  cancelAddon,
  subscriptionSummary,
  formatBpsFee,
  tierLabel,
  SUBSCRIPTION_TIERS,
  ADDON_TYPES,
  type TenantBillingRow,
  type TenantAddonRow,
} from '@/features/developer/services/developerBillingService';

export function DeveloperBillingPage() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [addons, setAddons] = useState<TenantAddonRow[]>([]);

  const loader = useCallback(() => listTenantBilling(submittedSearch), [submittedSearch]);
  const { data, loading, error, reload } = useAsync(loader);

  async function runAction(tenantsId: string, action: () => Promise<string>) {
    setBusyTenantId(tenantsId);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await action());
      reload();
      if (expandedTenantId === tenantsId) {
        setAddons(await listTenantAddons(tenantsId));
      }
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  function onSubscribe(row: TenantBillingRow, tier: string) {
    if (!tier) return;
    const hasSubscription = row.subscriptionStatus === 'active' || row.subscriptionStatus === 'past_due';
    const verb = hasSubscription ? 'Change subscription to' : 'Create subscription:';
    const reason = window.prompt(`${verb} ${tierLabel(tier)} for "${row.name}". Reason (for the audit log):`);
    if (reason === null) return;
    void runAction(row.tenantsId, () =>
      hasSubscription
        ? changeSubscriptionTier(row.tenantsId, tier, reason)
        : createSubscription(row.tenantsId, tier, reason),
    );
  }

  function onCancel(row: TenantBillingRow) {
    const atPeriodEnd = window.confirm(
      `Cancel subscription for "${row.name}".\n\nOK = at period end (features remain until then)\nCancel = choose immediate next`,
    );
    if (!atPeriodEnd && !window.confirm(`Cancel IMMEDIATELY for "${row.name}"? Tenant reverts to free now.`)) {
      return;
    }
    const reason = window.prompt('Reason (for the audit log):');
    if (reason === null) return;
    void runAction(row.tenantsId, () => cancelSubscription(row.tenantsId, atPeriodEnd, reason));
  }

  function onTrial(row: TenantBillingRow) {
    if (window.confirm(`Start a 14-day Professional trial for "${row.name}"?`)) {
      void runAction(row.tenantsId, () => startTrial(row.tenantsId));
    }
  }

  async function toggleAddons(tenantsId: string) {
    if (expandedTenantId === tenantsId) {
      setExpandedTenantId(null);
      return;
    }
    setExpandedTenantId(tenantsId);
    setAddons(await listTenantAddons(tenantsId));
  }

  function onProvisionAddon(row: TenantBillingRow, type: string) {
    if (!type) return;
    const period = window.confirm('OK = monthly billing, Cancel = annual billing') ? 'monthly' : 'annual';
    const quantityText =
      type === 'extra_manager' || type === 'custom_domain'
        ? window.prompt('Quantity:', '1')
        : '1';
    if (quantityText === null) return;
    const reason = window.prompt('Reason (for the audit log):');
    if (reason === null) return;
    void runAction(row.tenantsId, () =>
      provisionAddon(row.tenantsId, type, period, Number(quantityText) || 1, reason),
    );
  }

  function onCancelAddon(tenantsId: string, addon: TenantAddonRow) {
    const refundText = window.prompt(
      `Cancel ${tierLabel(addon.type)} add-on. Prorated refund in cents (0 = none):`,
      '0',
    );
    if (refundText === null) return;
    const reason = window.prompt('Reason (for the audit log):');
    if (reason === null) return;
    void runAction(tenantsId, () => cancelAddon(addon.tenantAddonsId, Number(refundText) || 0, reason));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Subscriptions &amp; billing</h1>
      <p className="text-sm text-muted-foreground">
        Manage trials, subscriptions and add-ons per tenant. Tier changes apply the tier&apos;s
        per-ticket fee automatically; every action is audit-logged.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedSearch(search);
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tenants by name or slug…"
          aria-label="Search tenants"
        />
      </form>

      {actionMessage ? <p className="text-sm text-emerald-600">{actionMessage}</p> : null}
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {error ? <p className="text-sm text-destructive">{rpcErrorMessage(error)}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="space-y-3">
        {(data ?? []).map((row) => {
          const busy = busyTenantId === row.tenantsId;
          return (
            <Card key={row.tenantsId}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {row.name}
                  <span className="text-xs font-normal text-muted-foreground">{row.slug}</span>
                  <Badge variant={row.tier === 'suspended' ? 'danger' : 'neutral'}>
                    {tierLabel(row.tier)}
                  </Badge>
                  {row.hasCustomFeeOverride ? <Badge variant="warn">Fee override</Badge> : null}
                  {row.archived ? <Badge variant="danger">Archived</Badge> : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                  <span>Subscription: {subscriptionSummary(row)}</span>
                  <span>Per-ticket fee: {formatBpsFee(row.feePercentBps, row.feeFlatCents)}</span>
                  {row.subscriptionStatus === 'trial' ? (
                    <span>Trial ends {formatEpoch(row.trialEndsAtEpochSeconds)}</span>
                  ) : null}
                  {row.subscriptionStatus === 'active' ? (
                    <span>Renews {formatEpoch(row.currentPeriodEndEpochSeconds)}</span>
                  ) : null}
                  <span>{row.totalEvents} events</span>
                  <span>{row.activeAddons} active add-ons</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="h-8 w-44"
                    aria-label={`Subscription tier for ${row.name}`}
                    value=""
                    disabled={busy}
                    onChange={(event) => onSubscribe(row, event.target.value)}
                  >
                    <option value="">
                      {row.subscriptionStatus === 'active' ? 'Change tier…' : 'Add subscription…'}
                    </option>
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tierLabel(tier)}
                      </option>
                    ))}
                  </Select>
                  {!row.subscriptionStatus ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onTrial(row)}>
                      Start 14-day trial
                    </Button>
                  ) : null}
                  {row.subscriptionStatus ? (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(row)}>
                      Cancel subscription
                    </Button>
                  ) : null}
                  <Select
                    className="h-8 w-44"
                    aria-label={`Provision add-on for ${row.name}`}
                    value=""
                    disabled={busy}
                    onChange={(event) => onProvisionAddon(row, event.target.value)}
                  >
                    <option value="">Provision add-on…</option>
                    {ADDON_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {tierLabel(type)}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => void toggleAddons(row.tenantsId)}>
                    {expandedTenantId === row.tenantsId ? 'Hide add-ons' : 'View add-ons'}
                  </Button>
                </div>
                {expandedTenantId === row.tenantsId ? (
                  <div className="rounded-md border p-2">
                    {addons.length === 0 ? (
                      <p className="text-muted-foreground">No add-ons.</p>
                    ) : (
                      <ul className="space-y-1">
                        {addons.map((addon) => (
                          <li key={addon.tenantAddonsId} className="flex flex-wrap items-center gap-2">
                            <Badge variant={addon.status === 'active' ? 'success' : 'neutral'}>
                              {addon.status}
                            </Badge>
                            <span>
                              {tierLabel(addon.type)} ×{addon.quantity} — {centsToUSD(addon.priceCents)}/
                              {addon.billingPeriod === 'annual' ? 'yr' : 'mo'}
                            </span>
                            <span className="text-muted-foreground">
                              renews {formatEpoch(addon.currentPeriodEndEpochSeconds)}
                            </span>
                            {addon.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onCancelAddon(row.tenantsId, addon)}
                              >
                                Cancel
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
