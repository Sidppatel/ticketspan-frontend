import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import {
  getTaxRemittanceReport,
  remittanceMonthsToCsvRows,
  type TaxRemitMonthRow,
} from '@/features/developer/services/developerBillingService';
import { downloadCsv } from '@/features/admin/services/reportingService';
import { centsToUSD, formatEpoch, formatMonth } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

function Drilldown({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid overflow-hidden transition-all duration-300 ease-in-out',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function DeveloperTaxRemittancePage() {
  const loader = useCallback(() => getTaxRemittanceReport('0', '0'), []);
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Tax Remittance</h1>
          <p className="text-sm text-ink-soft">
            Monthly sales tax owed to tax authorities, broken down by tenant. Last 12 months.
          </p>
        </div>
        {data ? (
          <p className="text-xs text-muted-foreground">
            Updated {formatEpoch(data.generatedAtEpochSeconds)}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reload}>
              Refresh
            </Button>
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{rpcErrorMessage(error)}</p> : null}
      {loading || !data ? (
        <div className="animate-pulse text-sm text-ink-soft">Loading tax remittance report…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">EntryVine must remit</p>
                <p className="text-2xl font-semibold font-mono">{centsToUSD(data.platformTotalCents)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tenant-remitted (informational)</p>
                <p className="text-2xl font-semibold font-mono">{centsToUSD(data.selfTotalCents)}</p>
              </CardContent>
            </Card>
          </div>

          <RemittanceSection
            title="Tax to remit — collected by EntryVine"
            description="Tax collected on the platform account. EntryVine pays these amounts to the tax authorities each month."
            months={data.platformMonths}
            csvName="tax-remittance-platform.csv"
          />

          <RemittanceSection
            title="Tenant-collected tax — not remitted by EntryVine"
            description="Tax that flowed to tenant payouts. Each tenant remits these amounts themselves; shown for oversight only."
            months={data.selfMonths}
            csvName="tax-remittance-self.csv"
          />
        </>
      )}
    </div>
  );
}

function RemittanceSection({
  title,
  description,
  months,
  csvName,
}: {
  title: string;
  description: string;
  months: TaxRemitMonthRow[];
  csvName: string;
}) {
  function exportCsv() {
    downloadCsv(
      csvName,
      ['Month', 'Tenant', 'Taxable sales', 'Tax', 'Orders'],
      remittanceMonthsToCsvRows(months),
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={months.length === 0}>
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {months.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No taxed sales in the last 12 months.</p>
        ) : (
          <div className="divide-y">
            {months.map((month) => (
              <MonthRow key={month.monthStartEpochSeconds} month={month} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonthRow({ month }: { month: TaxRemitMonthRow }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:bg-muted/40"
      >
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open ? 'rotate-180' : '')} />
        <span className="flex-1 font-medium">{formatMonth(month.monthStartEpochSeconds)}</span>
        <span className="text-muted-foreground">{month.orders} orders</span>
        <span className="hidden w-28 text-right font-mono text-muted-foreground sm:block">
          {centsToUSD(month.taxableCents)}
        </span>
        <span className="w-24 text-right font-mono">{centsToUSD(month.taxCents)}</span>
      </button>
      <Drilldown open={open}>
        <div className="space-y-1 border-l-2 border-primary/30 py-2 pl-7">
          {month.tenants.map((tenant) => (
            <div key={tenant.tenantsId} className="flex items-center gap-3 py-1 text-sm">
              <span className="flex-1">{tenant.tenantName}</span>
              <span className="text-muted-foreground">{tenant.orders} orders</span>
              <span className="hidden w-28 text-right font-mono text-muted-foreground sm:block">
                {centsToUSD(tenant.taxableCents)}
              </span>
              <span className="w-24 text-right font-mono">{centsToUSD(tenant.taxCents)}</span>
            </div>
          ))}
        </div>
      </Drilldown>
    </div>
  );
}
