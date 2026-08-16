import { centsToUSD } from '@/shared/lib/format';
import { percentChange, bpsToPercentLabel } from '@/features/admin/services/reportingService';
import { MetricCard } from '@/features/admin/components/ReportCharts';
import { Badge } from '@/shared/ui/badge';
import type { ReportSummary, ReportingAccess } from '@/shared/proto/reporting';

interface FinancialSummaryCardsProps {
  summary: ReportSummary;
  previousSummary: ReportSummary;
  access: ReportingAccess;
}

export function FinancialSummaryCards({ summary, previousSummary, access }: FinancialSummaryCardsProps) {
  const isAdvanced = access.hasAdvancedReporting;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Gross Revenue"
        value={centsToUSD(summary.revenueCents)}
        changePercent={percentChange(summary.revenueCents, previousSummary.revenueCents)}
        hint="Total sales volume"
      />

      {isAdvanced ? (
        <MetricCard
          label="Net Revenue"
          value={centsToUSD(summary.netRevenueCents)}
          changePercent={percentChange(summary.netRevenueCents, previousSummary.netRevenueCents)}
          hint="After refunds"
        />
      ) : (
        <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Net Revenue</p>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground/40">{centsToUSD(summary.revenueCents)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Available on Pro tier</p>
        </div>
      )}

      <MetricCard
        label="Tickets & Seats Sold"
        value={String(summary.ticketsSold)}
        changePercent={percentChange(summary.ticketsSold, previousSummary.ticketsSold)}
        hint={`${summary.orders} total orders`}
      />

      <MetricCard
        label="Average Order Value"
        value={centsToUSD(summary.averageOrderCents)}
        changePercent={percentChange(summary.averageOrderCents, previousSummary.averageOrderCents)}
        hint="Per completed order"
      />

      <MetricCard
        label="Conversion Rate"
        value={bpsToPercentLabel(summary.conversionBps)}
        changePercent={percentChange(summary.conversionBps, previousSummary.conversionBps)}
        hint={`${summary.visits} page visits`}
      />

      {isAdvanced ? (
        <MetricCard
          label="Refunds & Returns"
          value={centsToUSD(summary.refundedCents)}
          changePercent={percentChange(summary.refundedCents, previousSummary.refundedCents)}
          hint={`${summary.refundedOrders} refunded orders`}
        />
      ) : (
        <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Refunds & Returns</p>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground/40">$0.00</p>
          <p className="mt-1 text-xs text-muted-foreground">Track refund metrics with Pro</p>
        </div>
      )}

      {isAdvanced ? (
        <MetricCard
          label="Processing & Platform Fees"
          value={centsToUSD(summary.serviceFeeCents)}
          changePercent={percentChange(summary.serviceFeeCents, previousSummary.serviceFeeCents)}
          hint="Collected fees"
        />
      ) : (
        <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collected Fees</p>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground/40">—</p>
          <p className="mt-1 text-xs text-muted-foreground">Fee breakdowns on Pro</p>
        </div>
      )}

      {isAdvanced ? (
        <MetricCard
          label="Sales Tax Collected"
          value={centsToUSD(summary.taxCents)}
          changePercent={percentChange(summary.taxCents, previousSummary.taxCents)}
          hint="Total tax collected"
        />
      ) : (
        <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Taxes Collected</p>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground/40">—</p>
          <p className="mt-1 text-xs text-muted-foreground">Tax reporting on Pro</p>
        </div>
      )}
    </div>
  );
}
