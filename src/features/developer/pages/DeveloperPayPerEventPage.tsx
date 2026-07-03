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
  listEventUpgrades,
  activateEventUpgrade,
  cancelEventUpgrade,
  tierLabel,
  EVENT_TIERS,
} from '@/features/developer/services/developerBillingService';

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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pay Per Event</h1>
      <p className="text-sm text-muted-foreground">
        One-time upgrades that give a single event lower per-ticket fees, analytics, and (per tier)
        custom domains and SMS credits — independent of the tenant&apos;s subscription.
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activate for an event</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-center gap-2" onSubmit={onActivate}>
            <Input
              className="w-96"
              value={eventsId}
              onChange={(event) => setEventsId(event.target.value)}
              placeholder="Event ID (uuid)"
              aria-label="Event ID"
              required
            />
            <Select
              className="h-10 w-48"
              aria-label="Pay Per Event tier"
              value={tier}
              onChange={(event) => setTier(event.target.value)}
            >
              {EVENT_TIERS.map((eventTier) => (
                <option key={eventTier} value={eventTier}>
                  {tierLabel(eventTier)}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={busy || !eventsId.trim()}>
              Activate
            </Button>
          </form>
        </CardContent>
      </Card>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedSearch(search);
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by event or tenant…"
          aria-label="Search upgrades"
        />
      </form>

      {actionMessage ? <p className="text-sm text-emerald-600">{actionMessage}</p> : null}
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {error ? <p className="text-sm text-destructive">{rpcErrorMessage(error)}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Event</th>
              <th className="p-2">Tenant</th>
              <th className="p-2">Tier</th>
              <th className="p-2">Status</th>
              <th className="p-2">Paid</th>
              <th className="p-2">SMS / Domains</th>
              <th className="p-2">Activated</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.eventUpgradesId} className="border-t">
                <td className="p-2">{row.eventTitle}</td>
                <td className="p-2 text-muted-foreground">{row.tenantName}</td>
                <td className="p-2">{tierLabel(row.tier)}</td>
                <td className="p-2">
                  <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>
                </td>
                <td className="p-2">
                  {centsToUSD(row.priceCents)}
                  {row.refundedCents > 0 ? ` (−${centsToUSD(row.refundedCents)} refunded)` : ''}
                </td>
                <td className="p-2 text-muted-foreground">
                  {row.smsCredits} / {row.customDomainLimit}
                </td>
                <td className="p-2 text-muted-foreground">{formatEpoch(row.createdAtEpochSeconds)}</td>
                <td className="p-2">
                  {row.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onCancelUpgrade(row.eventsId, row.eventTitle)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 && !loading ? (
          <p className="p-3 text-sm text-muted-foreground">No Pay Per Event upgrades yet.</p>
        ) : null}
      </div>
    </div>
  );
}
