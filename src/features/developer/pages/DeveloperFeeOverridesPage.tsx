import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { formatEpoch, usdToCents } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
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
import { Download, Layers, Sparkles } from 'lucide-react';

export function DeveloperFeeOverridesPage() {
  const [eventsId, setEventsId] = useState('');
  const [percent, setPercent] = useState('4.0');
  const [flat, setFlat] = useState('1.00');
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
    <div className="space-y-8 pb-8">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Fee Overrides
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Silent per-order fee overrides for non-profits, fundraisers, and platform partnerships. Event-level overrides take precedence.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-marigold" />
            Set Event Override
          </CardTitle>
          <CardDescription>
            Configure custom platform take-rates for a specific event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end" onSubmit={onApply}>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="override-eventId" className="text-xs">Event ID</Label>
              <Input
                id="override-eventId"
                value={eventsId}
                onChange={(event) => setEventsId(event.target.value)}
                placeholder="UUID or Event ID"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="override-percent" className="text-xs">Percent (%)</Label>
              <Input
                id="override-percent"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="override-flat" className="text-xs">Flat ($)</Label>
              <Input
                id="override-flat"
                value={flat}
                onChange={(event) => setFlat(event.target.value)}
                inputMode="decimal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="override-expires" className="text-xs">Expires (Optional)</Label>
              <Input
                id="override-expires"
                type="date"
                value={expires}
                onChange={(event) => setExpires(event.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
              <Label htmlFor="override-reason" className="text-xs">Reason (Audit Trail Required)</Label>
              <Input
                id="override-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. 501(c)(3) charity partnership discount"
                required
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Applying…' : 'Apply Override'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {actionMessage && (
        <Alert variant="success">
          <AlertDescription>{actionMessage}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{rpcErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div>
            <CardTitle>Active Overrides</CardTitle>
            <CardDescription>
              {(data ?? []).length} active fee override rules in effect.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            disabled={!data || data.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="size-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading fee overrides…</div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Rate Delta</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={`${row.scope}-${row.eventsId || row.tenantsId}`}>
                    <TableCell>
                      <Badge variant="neutral">{row.scope}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{row.tenantName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.eventTitle || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{overrideDiscount(row)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.expiresAtEpochSeconds === '0' ? 'Never' : formatEpoch(row.expiresAtEpochSeconds)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatEpoch(row.updatedAtEpochSeconds)}</TableCell>
                    <TableCell className="text-right">
                      {row.scope === 'event' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onClear(row)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Clear
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Layers className="size-6 text-muted-foreground" />}
                title="No Fee Overrides"
                description="No active event or tenant fee overrides are configured. Standard rates apply across all bookings."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
