import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { formatEpoch, usdToCents } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  percentToBps,
  dateToEpochSeconds,
  listFeeOverrides,
  setEventFeeOverride,
  clearEventFeeOverride,
  overrideDiscount,
  downloadCsv,
  type FeeOverrideRow,
} from '@/features/developer/services/developerBillingService';

export function DeveloperFeeOverridesPage() {
  const [eventsId, setEventsId] = useState('');
  const [percent, setPercent] = useState('4.0');
  const [flat, setFlat] = useState('1.00');
  const [minFee, setMinFee] = useState('');
  const [expires, setExpires] = useState('');
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loader = useCallback(() => listFeeOverrides(), []);
  const { data, loading, error, reload } = useAsync(loader);

  async function runAction(action: () => Promise<string>) {
    setBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await action());
      reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function onApply(event: React.FormEvent) {
    event.preventDefault();
    void runAction(() =>
      setEventFeeOverride({
        eventsId: eventsId.trim(),
        percentBps: percentToBps(percent),
        flatCents: usdToCents(flat),
        minFeeCents: minFee ? usdToCents(minFee) : 0,
        maxFeeCents: 0,
        expiresAtEpochSeconds: dateToEpochSeconds(expires),
        reason,
      }),
    );
  }

  function onClear(row: FeeOverrideRow) {
    const clearReason = window.prompt(`Clear the fee override on "${row.eventTitle}". Reason:`);
    if (clearReason === null) return;
    void runAction(() => clearEventFeeOverride(row.eventsId, clearReason));
  }

  function onExport() {
    downloadCsv(
      'fee-overrides.csv',
      ['scope', 'tenant', 'event', 'standard_fee', 'override_fee', 'expires'],
      (data ?? []).map((row) => [
        row.scope,
        row.tenantName,
        row.eventTitle,
        overrideDiscount(row).split(' → ')[0],
        overrideDiscount(row).split(' → ')[1],
        row.expiresAtEpochSeconds === '0' ? 'never' : formatEpoch(row.expiresAtEpochSeconds),
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Fee overrides</h1>
      <p className="text-sm text-muted-foreground">
        Silent per-ticket fee overrides for non-profits, fundraisers and promotions. Event-level
        beats tenant-level; tenants never see these. Tenant-level overrides are managed on the Fees
        page (custom default formula).
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Set event override</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-2" onSubmit={onApply}>
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
            <label className="text-sm">
              Percent %
              <Input
                className="mt-1 w-24"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label className="text-sm">
              Flat $
              <Input
                className="mt-1 w-24"
                value={flat}
                onChange={(event) => setFlat(event.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label className="text-sm">
              Min net $ (optional)
              <Input
                className="mt-1 w-28"
                value={minFee}
                onChange={(event) => setMinFee(event.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="text-sm">
              Expires (optional)
              <Input
                className="mt-1 w-44"
                type="date"
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
              />
            </label>
            <label className="text-sm">
              Reason (required)
              <Input
                className="mt-1 w-64"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Non-profit fundraiser"
                required
              />
            </label>
            <Button type="submit" disabled={busy}>
              Apply override
            </Button>
          </form>
        </CardContent>
      </Card>

      {actionMessage ? <p className="text-sm text-emerald-600">{actionMessage}</p> : null}
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {error ? <p className="text-sm text-destructive">{rpcErrorMessage(error)}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Active overrides</h2>
        <Button size="sm" variant="outline" onClick={onExport} disabled={!data || data.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Scope</th>
              <th className="p-2">Tenant</th>
              <th className="p-2">Event</th>
              <th className="p-2">Standard → Override</th>
              <th className="p-2">Expires</th>
              <th className="p-2">Updated</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={`${row.scope}-${row.eventsId || row.tenantsId}`} className="border-t">
                <td className="p-2">
                  <Badge variant="neutral">{row.scope}</Badge>
                </td>
                <td className="p-2">{row.tenantName}</td>
                <td className="p-2 text-muted-foreground">{row.eventTitle || '—'}</td>
                <td className="p-2">{overrideDiscount(row)}</td>
                <td className="p-2 text-muted-foreground">
                  {row.expiresAtEpochSeconds === '0' ? 'never' : formatEpoch(row.expiresAtEpochSeconds)}
                </td>
                <td className="p-2 text-muted-foreground">{formatEpoch(row.updatedAtEpochSeconds)}</td>
                <td className="p-2">
                  {row.scope === 'event' ? (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => onClear(row)}>
                      Clear
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && !loading ? (
          <p className="p-3 text-sm text-muted-foreground">No fee overrides.</p>
        ) : null}
      </div>
    </div>
  );
}
