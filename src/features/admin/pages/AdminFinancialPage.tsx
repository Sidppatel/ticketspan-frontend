import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getStripeStatus,
  startStripeOnboarding,
  getMonthlyReport,
} from '@/features/admin/services/financialService';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type { StripeStatus, MonthlyReport } from '@/shared/proto/admin';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function AdminFinancialPage() {
  const { tenantsId } = useAuth();
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [eventsId, setEventsId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const stripeReturn = searchParams.get('stripe');

  async function guard(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  // Stripe Connect onboarding redirects back here with ?stripe=return|refresh.
  // Auto-load the latest account status so the admin sees the result immediately.
  useEffect(() => {
    if (!stripeReturn || !tenantsId) {
      return;
    }
    
    const fetchStatus = async () => {
      try {
        setStripe(await getStripeStatus(tenantsId));
      } catch (caught) {
        setError(rpcErrorMessage(caught));
      }
    };
    
    fetchStatus();
    
    searchParams.delete('stripe');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeReturn, tenantsId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Financial</h1>
      {error ? <p className="text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => guard(async () => setStripe(await getStripeStatus(tenantsId ?? '')))}>
              Check status
            </Button>
            <Button
              size="sm"
              onClick={() =>
                guard(async () => {
                  const url = await startStripeOnboarding(tenantsId ?? '');
                  window.open(url, '_blank');
                })
              }
            >
              Start onboarding
            </Button>
          </div>
          {stripe ? (
            <p className="text-sm text-muted-foreground">
              charges: {String(stripe.chargesEnabled)} · payouts: {String(stripe.payoutsEnabled)} · details:{' '}
              {String(stripe.detailsSubmitted)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Event ID</Label>
              <Input value={eventsId} onChange={(e) => setEventsId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <Input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
            </div>
            <Button size="sm" onClick={() => guard(async () => setReport(await getMonthlyReport(eventsId, year, month)))}>
              Run report
            </Button>
          </div>
          {report ? (
            <div className="text-sm text-muted-foreground">
              <p>Gross: {centsToUSD(report.grossCents)}</p>
              <p>Fees: {centsToUSD(report.feesCents)}</p>
              <p>Net: {centsToUSD(report.netCents)}</p>
              <p>Tickets sold: {report.ticketsSold}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
