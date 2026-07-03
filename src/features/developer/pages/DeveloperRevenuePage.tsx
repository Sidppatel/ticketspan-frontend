import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  getRevenueReport,
  getTenantActivity,
  sumRevenueCents,
  trendBarPercents,
  tierLabel,
  downloadCsv,
} from '@/features/developer/services/developerBillingService';

const TIER_FILTERS = ['', 'free', 'trial', 'starter', 'professional', 'business', 'enterprise', 'suspended'];

export function DeveloperRevenuePage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [submitted, setSubmitted] = useState({ search: '', tier: '' });

  const reportLoader = useCallback(() => getRevenueReport('0', '0'), []);
  const report = useAsync(reportLoader);

  const activityLoader = useCallback(
    () => getTenantActivity(submitted.search, submitted.tier),
    [submitted],
  );
  const activity = useAsync(activityLoader);

  function onExportActivity() {
    downloadCsv(
      'tenant-activity.csv',
      ['tenant', 'slug', 'tier', 'events', 'tickets', 'service_fees', 'billing', 'avg_ticket', 'subscription'],
      (activity.data ?? []).map((row) => [
        row.name,
        row.slug,
        row.tier,
        row.eventsCreated,
        row.ticketsSold,
        centsToUSD(row.serviceFeeCents),
        centsToUSD(row.billingCents),
        centsToUSD(row.avgTicketCents),
        row.subscriptionStatus || 'none',
      ]),
    );
  }

  const bars = report.data ? trendBarPercents(report.data.trend) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Platform revenue</h1>
      <p className="text-sm text-muted-foreground">
        Last 12 months across all revenue sources: per-ticket service fees, subscriptions,
        Pay Per Event, add-ons and setup fees (refunds negative).
      </p>

      {report.error ? <p className="text-sm text-destructive">{rpcErrorMessage(report.error)}</p> : null}
      {report.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      {report.data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total revenue (12 mo)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {centsToUSD(sumRevenueCents(report.data.bySource))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">By source</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
                  {report.data.bySource.map((row) => (
                    <li key={row.source} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{tierLabel(row.source)}</span>
                      <span>{centsToUSD(row.revenueCents)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Monthly trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-1" role="img" aria-label="Monthly revenue trend">
                {bars.map((bar, index) => (
                  <div
                    key={report.data!.trend[index].bucketStartEpochSeconds}
                    className="flex-1 rounded-t bg-primary/70"
                    style={{ height: `${bar.heightPct}%` }}
                    title={`${formatEpoch(report.data!.trend[index].bucketStartEpochSeconds)}: ${bar.total}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Revenue by tier</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-1">Tier</th>
                    <th className="py-1">Tenants</th>
                    <th className="py-1">Service fees</th>
                    <th className="py-1">Subscriptions &amp; charges</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.byTier.map((row) => (
                    <tr key={row.tier} className="border-t">
                      <td className="py-1">{tierLabel(row.tier)}</td>
                      <td className="py-1">{row.tenantCount}</td>
                      <td className="py-1">{centsToUSD(row.serviceFeeCents)}</td>
                      <td className="py-1">{centsToUSD(row.billingCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-sm font-medium">Tenant activity</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onExportActivity}
          disabled={!activity.data || activity.data.length === 0}
        >
          Export CSV
        </Button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted({ search, tier: tierFilter });
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tenants…"
          aria-label="Search tenants"
        />
        <Select
          className="w-44"
          aria-label="Filter by tier"
          value={tierFilter}
          onChange={(event) => setTierFilter(event.target.value)}
        >
          {TIER_FILTERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier ? tierLabel(tier) : 'All tiers'}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {activity.error ? <p className="text-sm text-destructive">{rpcErrorMessage(activity.error)}</p> : null}
      {activity.loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Tenant</th>
              <th className="p-2">Tier</th>
              <th className="p-2">Events</th>
              <th className="p-2">Tickets</th>
              <th className="p-2">Service fees</th>
              <th className="p-2">Charges</th>
              <th className="p-2">Avg ticket</th>
              <th className="p-2">Subscription</th>
            </tr>
          </thead>
          <tbody>
            {(activity.data ?? []).map((row) => (
              <tr key={row.tenantsId} className="border-t">
                <td className="p-2">
                  {row.name} <span className="text-muted-foreground">({row.slug})</span>
                </td>
                <td className="p-2">{tierLabel(row.tier)}</td>
                <td className="p-2">{row.eventsCreated}</td>
                <td className="p-2">{row.ticketsSold}</td>
                <td className="p-2">{centsToUSD(row.serviceFeeCents)}</td>
                <td className="p-2">{centsToUSD(row.billingCents)}</td>
                <td className="p-2">{centsToUSD(row.avgTicketCents)}</td>
                <td className="p-2 text-muted-foreground">{row.subscriptionStatus || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
