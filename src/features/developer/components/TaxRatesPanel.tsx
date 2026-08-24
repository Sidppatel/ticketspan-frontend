import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { formatEpoch } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
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
  listTaxRates,
  lookupTaxRateMessage,
  refreshAllTaxRates,
  filterTaxRates,
  newestFetchedEpoch,
  formatRatePercent,
} from '@/features/developer/services/developerBillingService';
import { Search, RefreshCw, ExternalLink, Calculator } from 'lucide-react';

export function TaxRatesPanel() {
  const loader = useCallback(() => listTaxRates(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [search, setSearch] = useState('');
  const [lookupZip, setLookupZip] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const rates = data ?? [];
  const filtered = filterTaxRates(rates, search);

  async function runAction(action: () => Promise<string>) {
    setBusy(true);
    setMessage(null);
    setActionError(null);
    try {
      setMessage(await action());
      reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function onLookup(event: React.FormEvent) {
    event.preventDefault();
    void runAction(() => lookupTaxRateMessage(lookupZip)).then(() => setLookupZip(''));
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Tax Rates Cache</CardTitle>
            <CardDescription>
              SalesTaxZip automated geospatial tax rate cache.
            </CardDescription>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="block text-muted-foreground">Cached ZIPs</span>
              <span className="font-mono text-base font-bold text-foreground">{rates.length}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Last Refreshed</span>
              <span className="font-mono text-base font-bold text-foreground">
                {rates.length > 0 ? formatEpoch(newestFetchedEpoch(rates)) : '—'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-xs"
              placeholder="Search ZIP, city, state…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
            <form className="flex items-end gap-2" onSubmit={onLookup}>
              <div className="space-y-1">
                <Label htmlFor="tax-lookup-zip" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Lookup ZIP
                </Label>
                <Input
                  id="tax-lookup-zip"
                  className="h-9 w-28 text-xs font-mono"
                  value={lookupZip}
                  onChange={(event) => setLookupZip(event.target.value)}
                  placeholder="36611"
                  inputMode="numeric"
                  pattern="\d{5}"
                  required
                />
              </div>
              <Button type="submit" size="sm" disabled={busy} className="h-9 text-xs">
                Lookup
              </Button>
            </form>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs gap-1.5"
              disabled={busy || rates.length === 0}
              onClick={() => void runAction(() => refreshAllTaxRates())}
            >
              <RefreshCw className="size-3.5" />
              Refresh All
            </Button>
          </div>
        </div>

        {message && (
          <Alert variant="success">
            <AlertDescription>{message}</AlertDescription>
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

        <div className="rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading cached tax rates…</div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ZIP Code</TableHead>
                  <TableHead>City / Region</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Combined Rate</TableHead>
                  <TableHead className="text-right">State / County / City / Local</TableHead>
                  <TableHead className="text-right">Last Fetched</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.zipCode}>
                    <TableCell className="font-mono font-medium">
                      <a
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={`https://salestaxzip.com/tax/${row.zipCode}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.zipCode}
                        <ExternalLink className="size-3 opacity-60" />
                      </a>
                    </TableCell>
                    <TableCell>{row.city || '—'}</TableCell>
                    <TableCell>{row.state || '—'}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatRatePercent(row.combinedRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {formatRatePercent(row.stateRate)} / {formatRatePercent(row.countyRate)} /{' '}
                      {formatRatePercent(row.cityRate)} / {formatRatePercent(row.localRate)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatEpoch(row.fetchedAtEpochSeconds)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        disabled={busy}
                        onClick={() => void runAction(() => lookupTaxRateMessage(row.zipCode))}
                      >
                        Refresh
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Calculator className="size-6 text-muted-foreground" />}
                title="No Tax Rates Cached"
                description={
                  rates.length === 0
                    ? 'No cached tax rates found. Rates are automatically populated when venues are created or through manual ZIP lookup.'
                    : 'No tax rate records match your search criteria.'
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
