import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
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
  listEventUpgrades,
  activateEventUpgrade,
  cancelEventUpgrade,
  tierLabel,
  EVENT_TIERS,
} from '@/features/developer/services/developerBillingService';
import { Zap, Search } from 'lucide-react';

export function DeveloperPayPerEventPage() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [eventsId, setEventsId] = useState('');
  const [tier, setTier] = useState<string>(EVENT_TIERS[0]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loader = useCallback(() => listEventUpgrades(submittedSearch), [submittedSearch]);
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

  function onActivate(event: React.FormEvent) {
    event.preventDefault();
    const reason = window.prompt('Reason (for the audit log):');
    if (reason === null) return;
    void runAction(() => activateEventUpgrade(eventsId.trim(), tier, reason));
  }

  function onCancelUpgrade(targetEventsId: string, title: string) {
    const refundText = window.prompt(
      `Cancel Pay Per Event for "${title}". Prorated refund in cents (0 = none):`,
      '0',
    );
    if (refundText === null) return;
    const reason = window.prompt('Reason (for the audit log):');
    if (reason === null) return;
    void runAction(() => cancelEventUpgrade(targetEventsId, Number(refundText) || 0, reason));
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pay Per Event
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          One-time event upgrades providing reduced per-order fees, dedicated analytics, custom domains, and SMS allowances.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            Activate Event Upgrade
          </CardTitle>
          <CardDescription>
            Grant tier-specific capabilities to an individual event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 items-end" onSubmit={onActivate}>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="upgrade-eventId" className="text-xs">Event ID</Label>
              <Input
                id="upgrade-eventId"
                value={eventsId}
                onChange={(event) => setEventsId(event.target.value)}
                placeholder="UUID or Event ID"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upgrade-tier" className="text-xs">Upgrade Tier</Label>
              <Select
                id="upgrade-tier"
                value={tier}
                onChange={(event) => setTier(event.target.value)}
              >
                {EVENT_TIERS.map((eventTier) => (
                  <option key={eventTier} value={eventTier}>
                    {tierLabel(eventTier)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Button type="submit" disabled={busy || !eventsId.trim()} className="w-full">
                {busy ? 'Activating…' : 'Activate Upgrade'}
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
        <CardHeader className="space-y-3 border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Upgraded Events</CardTitle>
              <CardDescription>
                {(data ?? []).length} events currently with active tier upgrades.
              </CardDescription>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(search);
              }}
              className="relative w-full sm:w-64"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events or tenants…"
                className="pl-9 h-9 text-xs"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading event upgrades…</div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>SMS / Domains</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.eventUpgradesId}>
                    <TableCell className="font-medium text-foreground">{row.eventTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{row.tenantName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tierLabel(row.tier)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {centsToUSD(row.priceCents)}
                      {row.refundedCents > 0 ? ` (−${centsToUSD(row.refundedCents)})` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {row.smsCredits} SMS · {row.customDomainLimit} Domains
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatEpoch(row.createdAtEpochSeconds)}</TableCell>
                    <TableCell className="text-right">
                      {row.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => onCancelUpgrade(row.eventsId, row.eventTitle)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Cancel
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
                icon={<Zap className="size-6 text-muted-foreground" />}
                title="No Event Upgrades"
                description="No Pay Per Event upgrades have been provisioned yet. Use the form above to activate an upgrade."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
