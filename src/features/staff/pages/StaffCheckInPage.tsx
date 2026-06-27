import { useState } from 'react';
import { scanTicket, getCheckInStats } from '@/features/staff/services/staffService';
import { rpcErrorMessage } from '@/shared/session';
import type { ScanResponse, CheckInStats } from '@/shared/proto/bookings';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function StaffCheckInPage() {
  const [eventsId, setEventsId] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function loadStats() {
    setError(null);
    try {
      setStats(await getCheckInStats(eventsId));
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function scan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await scanTicket(qrToken, eventsId));
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Check-in scanner</h1>
      <Card>
        <CardHeader>
          <CardTitle>Scan ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="eventsId">Event ID</Label>
            <Input id="eventsId" value={eventsId} onChange={(e) => setEventsId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qrToken">QR token</Label>
            <Input id="qrToken" value={qrToken} onChange={(e) => setQrToken(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {result ? (
            <div className={result.valid ? 'text-success' : 'text-destructive'}>
              <p className="font-medium">{result.valid ? 'Valid' : 'Invalid'}</p>
              <p className="text-sm">{result.holderName}</p>
              <p className="text-sm">{result.message}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={scan} disabled={scanning}>
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
            <Button variant="outline" onClick={loadStats} disabled={!eventsId}>
              Load stats
            </Button>
          </div>
          {stats ? (
            <p className="text-sm text-muted-foreground">
              Total {stats.total} · Checked in {stats.checkedIn} · Remaining {stats.remaining}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
