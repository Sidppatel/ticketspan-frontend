import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getReportingAccess,
  getTaxReport,
  taxReportRange,
  downloadCsv,
} from '@/features/admin/services/reportingService';
import { centsToUSD, formatEpoch, formatMonth } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { ReportingAccess, TaxReport, TaxMonthRow } from '@/shared/proto/reporting';

interface TaxReportData {
  access: ReportingAccess;
  report: TaxReport | null;
}

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

export function AdminTaxReportPage() {
  const loader = useCallback(async (): Promise<TaxReportData> => {
    const access = await getReportingAccess();
    if (access.taxCollectionMode !== 'self') {
      return { access, report: null };
    }
    const range = taxReportRange();
    const report = await getTaxReport(range.fromEpochSeconds, range.toEpochSeconds);
    return { access, report };
  }, []);
  const { data, loading, error, reload } = useAsync(loader);

  function exportCsv() {
    if (!data?.report) return;
    downloadCsv(
      'tax-report.csv',
      ['Month', 'Event', 'Taxable sales', 'Tax collected', 'Orders'],
      data.report.months.flatMap((month) =>
        month.events.map((event) => [
          formatMonth(month.monthStartEpochSeconds),
          event.eventTitle,
          centsToUSD(event.taxableCents),
          centsToUSD(event.taxCents),
          event.orders,
        ]),
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Tax report</h1>
          <p className="text-sm text-ink-soft">Sales tax you collected over the last 12 months, by month and by event.</p>
        </div>
        {data?.report ? (
          <p className="text-xs text-muted-foreground">
            Updated {formatEpoch(data.report.generatedAtEpochSeconds)}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reload}>
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="ml-2" onClick={exportCsv}>
              Export CSV
            </Button>
          </p>
        ) : null}
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}
      {loading || !data ? (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : data.report === null ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            EntryVine collects and remits sales tax on your behalf, so there is nothing for you to report. This page becomes
            available if your organization is switched to collecting its own sales tax.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tax collected by month</CardTitle>
          </CardHeader>
          <CardContent>
            {data.report.months.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No taxed sales in the last 12 months.</p>
            ) : (
              <div className="divide-y">
                {data.report.months.map((month) => (
                  <MonthRow key={month.monthStartEpochSeconds} month={month} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MonthRow({ month }: { month: TaxMonthRow }) {
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
          {month.events.map((event) => (
            <div key={event.eventsId} className="flex items-center gap-3 py-1 text-sm">
              <span className="flex-1">{event.eventTitle}</span>
              <span className="text-muted-foreground">{event.orders} orders</span>
              <span className="hidden w-28 text-right font-mono text-muted-foreground sm:block">
                {centsToUSD(event.taxableCents)}
              </span>
              <span className="w-24 text-right font-mono">{centsToUSD(event.taxCents)}</span>
            </div>
          ))}
        </div>
      </Drilldown>
    </div>
  );
}
