import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { claimTicket } from '@/features/public/services/ticketService';
import { rpcErrorMessage } from '@/shared/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function ClaimTicketPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>(token ? 'pending' : 'error');
  const [error, setError] = useState<string | null>(token ? null : 'Missing token.');

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    const run = async () => {
      try {
        await claimTicket(token);
        if (active) {
          setStatus('done');
        }
      } catch (caught) {
        if (active) {
          setStatus('error');
          setError(rpcErrorMessage(caught));
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Claim ticket</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'pending' ? <p className="text-muted-foreground">Claiming…</p> : null}
          {status === 'done' ? <p className="text-success">Ticket claimed. Check My Bookings.</p> : null}
          {status === 'error' ? <p className="text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
