import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { BACKEND_URL } from '@/shared/apiClient';
import {
  getTaxReport,
  formatRatePercent,
  taxTenantSharePercents,
  downloadCsv,
  listTaxOverrides,
  setEventTaxOverride,
  clearEventTaxOverride,
  taxOverrideLabel,
  percentToBps,
  type TaxOverrideRow,
} from '@/features/developer/services/developerBillingService';

export function DeveloperTaxPage() {
  const reportLoader = useCallback(() => getTaxReport('0', '0'), []);
  const report = useAsync(reportLoader);
  const data = report.data;
  const shares = data ? taxTenantSharePercents(data) : {};

  const overridesLoader = useCallback(() => listTaxOverrides(), []);
  const overrides = useAsync(overridesLoader);
  const [eventsId, setEventsId] = useState('');
  const [exempt, setExempt] = useState(false);
  const [ratePercent, setRatePercent] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  async function onRefreshRates() {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/developer/tax/refresh`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to refresh: ${response.statusText}`);
      }
      const json = await response.json();
      setRefreshMessage(json.message);
      report.reload();
    } catch (caught: any) {
      setRefreshMessage(`Error: ${caught.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  async function runAction(action: () => Promise<string>) {
    setBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await action());
      overrides.reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function onApplyOverride(event: React.FormEvent) {
    event.preventDefault();
    void runAction(() =>
      setEventTaxOverride(eventsId.trim(), exempt, exempt ? 0 : percentToBps(ratePercent), reason),
    );
  }

  function onClearOverride(row: TaxOverrideRow) {
    const clearReason = window.prompt(`Clear the tax override on "${row.eventTitle}". Reason:`);
    if (clearReason === null) return;
    void runAction(() => clearEventTaxOverride(row.eventsId, clearReason));
  }

  function onExport() {
    if (!data) return;
    downloadCsv(
      'tax-by-jurisdiction.csv',
      ['state', 'county', 'city', 'combined_rate', 'state_rate', 'county_rate', 'city_rate',
       'state_tax', 'county_tax', 'city_tax', 'tax_collected', 'orders'],
      data.byJurisdiction.map((row) => [
        row.state,
        row.county,
        row.city,
        formatRatePercent(row.combinedRate),
        formatRatePercent(row.stateRate),
        formatRatePercent(row.countyRate),
        formatRatePercent(row.cityRate),
        centsToUSD(row.stateTaxCents),
        centsToUSD(row.countyTaxCents),
        centsToUSD(row.cityTaxCents),
        centsToUSD(row.taxCollectedCents),
        row.orders,
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Tax Report</h1>
          <p className="text-sm text-ink-soft">Sales tax collected across all tenants.</p>
          {refreshMessage ? (
            <p className="mt-1 text-xs font-medium text-emerald-600">{refreshMessage}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefreshRates} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Verify & Refresh Rates'}
          </Button>
          <Button variant="outline" onClick={onExport} disabled={!data}>
            Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tax overrides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-soft">
            Exempt a qualifying event from tax or replace the venue-zip rate with a manual combined
            rate. Overrides win over the SalesTaxZip cache.
          </p>
          <form className="flex flex-wrap items-end gap-2" onSubmit={onApplyOverride}>
            <label className="text-sm">
              Event ID
              <Input
                className="mt-1 w-80"
                value={eventsId}
                onChange={(event) => setEventsId(event.target.value)}
                placeholder="uuid"
                required
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={exempt}
                onChange={(event) => setExempt(event.target.checked)}
              />
              Tax exempt
            </label>
            {exempt ? null : (
              <label className="text-sm">
                Rate %
                <Input
                  className="mt-1 w-24"
                  value={ratePercent}
                  onChange={(event) => setRatePercent(event.target.value)}
                  inputMode="decimal"
                  required
                />
              </label>
            )}
            <label className="text-sm">
              Reason (required)
              <Input
                className="mt-1 w-64"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. 501(c)(3) exemption certificate"
                required
              />
            </label>
            <Button type="submit" disabled={busy}>
              Apply
            </Button>
          </form>
          {actionMessage ? <p className="text-sm text-emerald-600">{actionMessage}</p> : null}
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          {overrides.error ? (
            <p className="text-sm text-destructive">{rpcErrorMessage(overrides.error)}</p>
          ) : null}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft">
                <th className="pb-2">Tenant</th>
                <th className="pb-2">Event</th>
                <th className="pb-2 text-right">Tax</th>
                <th className="pb-2 text-right">Updated</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {(overrides.data ?? []).map((row) => (
                <tr key={row.eventsId} className="border-t border-hairline">
                  <td className="py-1.5">{row.tenantName}</td>
                  <td className="py-1.5">{row.eventTitle}</td>
                  <td className="py-1.5 text-right font-mono">{taxOverrideLabel(row)}</td>
                  <td className="py-1.5 text-right text-ink-soft">
                    {formatEpoch(row.updatedAtEpochSeconds)}
                  </td>
                  <td className="py-1.5 text-right">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => onClearOverride(row)}>
                      Clear
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {overrides.data && overrides.data.length === 0 ? (
            <p className="text-sm text-ink-soft">No tax overrides.</p>
          ) : null}
        </CardContent>
      </Card>

      {report.loading ? (
        <div className="animate-pulse text-sm text-ink-soft">Loading tax report…</div>
      ) : report.error ? (
        <div className="text-sm text-danger">{rpcErrorMessage(report.error)}</div>
      ) : data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Total Tax Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-3xl font-bold text-accent-gold">
                {centsToUSD(data.totalTaxCents)}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="pb-2">Tenant</th>
                    <th className="pb-2 text-right">Tax Collected</th>
                    <th className="pb-2 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTenant.map((row) => (
                    <tr key={row.tenantsId} className="border-t border-hairline">
                      <td className="py-1.5">{row.name}</td>
                      <td className="py-1.5 text-right font-mono">{centsToUSD(row.taxCollectedCents)}</td>
                      <td className="py-1.5 text-right font-mono">{shares[row.tenantsId]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Jurisdiction</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="pb-2">State</th>
                    <th className="pb-2">County</th>
                    <th className="pb-2">City</th>
                    <th className="pb-2 text-right">Combined</th>
                    <th className="pb-2 text-right">State Tax</th>
                    <th className="pb-2 text-right">County Tax</th>
                    <th className="pb-2 text-right">City Tax</th>
                    <th className="pb-2 text-right">Tax Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byJurisdiction.map((row, i) => (
                    <tr key={`${row.state}-${row.county}-${row.city}-${i}`} className="border-t border-hairline">
                      <td className="py-1.5">{row.state || '—'}</td>
                      <td className="py-1.5">{row.county || '—'}</td>
                      <td className="py-1.5">{row.city || '—'}</td>
                      <td className="py-1.5 text-right font-mono">{formatRatePercent(row.combinedRate)}</td>
                      <td className="py-1.5 text-right font-mono">
                        {centsToUSD(row.stateTaxCents)}
                        <span className="block text-[10px] text-ink-faint">{formatRatePercent(row.stateRate)}</span>
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {centsToUSD(row.countyTaxCents)}
                        <span className="block text-[10px] text-ink-faint">{formatRatePercent(row.countyRate)}</span>
                      </td>
                      <td className="py-1.5 text-right font-mono">
                        {centsToUSD(row.cityTaxCents)}
                        <span className="block text-[10px] text-ink-faint">{formatRatePercent(row.cityRate)}</span>
                      </td>
                      <td className="py-1.5 text-right font-mono">{centsToUSD(row.taxCollectedCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Event</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {data.byEvent.map((row) => (
                      <tr key={row.eventsId} className="border-t border-hairline">
                        <td className="py-1.5">{row.eventTitle}</td>
                        <td className="py-1.5 text-right font-mono">{centsToUSD(row.taxCollectedCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Month</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {data.byMonth.map((row) => (
                      <tr key={row.bucketStartEpochSeconds} className="border-t border-hairline">
                        <td className="py-1.5">{formatEpoch(row.bucketStartEpochSeconds)}</td>
                        <td className="py-1.5 text-right font-mono">{centsToUSD(row.taxCollectedCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tax Rate Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="pb-2">Rate</th>
                    <th className="pb-2">State</th>
                    <th className="pb-2 text-right">Tax Collected</th>
                    <th className="pb-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rateSummary.map((row, i) => (
                    <tr key={`${row.combinedRate}-${row.state}-${i}`} className="border-t border-hairline">
                      <td className="py-1.5 font-mono">{formatRatePercent(row.combinedRate)}</td>
                      <td className="py-1.5">{row.state || '—'}</td>
                      <td className="py-1.5 text-right font-mono">{centsToUSD(row.taxCollectedCents)}</td>
                      <td className="py-1.5 text-right font-mono">{row.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
