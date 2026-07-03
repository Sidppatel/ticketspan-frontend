import { useReports } from '@/features/admin/hooks/useReports';
import {
  percentChange,
  bpsToPercentLabel,
  salesVelocityLabel,
  downloadCsv,
  type RangePreset,
  type Bucket,
} from '@/features/admin/services/reportingService';
import { centsToUSD, formatEpoch, formatEventDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { RevenueLineChart, BarList, MetricCard } from '@/features/admin/components/ReportCharts';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
];

const BASIC_BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const ADVANCED_BUCKETS: { value: Bucket; label: string }[] = [...BASIC_BUCKETS, { value: 'year', label: 'Yearly' }];

function ProBadge() {
  return <Badge variant="voltage">Pro</Badge>;
}

export function AdminFinancialPage() {
  const { data, loading, error, reload, controls } = useReports();
  const advanced = data?.access.hasAdvancedReporting ?? false;
  const buckets = advanced ? ADVANCED_BUCKETS : BASIC_BUCKETS;

  function exportEventsCsv() {
    if (!data) return;
    downloadCsv(
      'event-performance.csv',
      ['Event', 'Start', 'Status', 'Revenue', 'Orders', 'Tickets', 'Checked in', 'Attendance rate'],
      data.events.rows.map((row) => [
        row.eventTitle,
        formatEventDate(row.eventStartEpochSeconds),
        row.eventStatus,
        centsToUSD(row.revenueCents),
        row.orders,
        row.ticketsSold,
        row.checkedIn,
        bpsToPercentLabel(row.attendanceRateBps),
      ]),
    );
  }

  function exportTicketTypesCsv() {
    if (!data) return;
    downloadCsv(
      'ticket-types.csv',
      ['Ticket type', 'Event', 'Price', 'Quantity sold', 'Revenue'],
      data.ticketTypes.rows.map((row) => [
        row.label,
        row.eventTitle,
        centsToUSD(row.priceCents),
        row.quantitySold,
        centsToUSD(row.revenueCents),
      ]),
    );
  }

  function exportTimeseriesCsv() {
    if (!data) return;
    downloadCsv(
      'revenue-over-time.csv',
      ['Bucket start', 'Revenue', 'Orders', 'Tickets'],
      data.timeseries.points.map((point) => [
        formatEpoch(point.bucketStartEpochSeconds),
        centsToUSD(point.revenueCents),
        point.orders,
        point.ticketsSold,
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Reports</h1>
          {advanced ? <ProBadge /> : null}
        </div>
        {data ? (
          <p className="text-xs text-muted-foreground">
            Updated {formatEpoch(data.summary.generatedAtEpochSeconds)}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reload}>
              Refresh
            </Button>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              variant={controls.preset === preset.value ? 'default' : 'outline'}
              onClick={() => controls.setPreset(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
          {advanced ? (
            <Button
              size="sm"
              variant={controls.preset === 'custom' ? 'default' : 'outline'}
              onClick={() => controls.setPreset('custom')}
            >
              Custom
            </Button>
          ) : null}
        </div>
        {advanced && controls.preset === 'custom' ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="report-from">From</Label>
              <Input
                id="report-from"
                type="date"
                value={controls.customFrom}
                onChange={(e) => controls.setCustomFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                value={controls.customTo}
                onChange={(e) => controls.setCustomTo(e.target.value)}
              />
            </div>
          </>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="report-bucket">Granularity</Label>
          <Select
            id="report-bucket"
            className="h-8 w-32"
            value={controls.bucket}
            onChange={(e) => controls.setBucket(e.target.value as Bucket)}
          >
            {buckets.map((bucket) => (
              <option key={bucket.value} value={bucket.value}>
                {bucket.label}
              </option>
            ))}
          </Select>
        </div>
        {advanced ? (
          <label className="flex items-center gap-2 pb-1 text-sm">
            <Switch checked={controls.compareEnabled} onCheckedChange={controls.setCompareEnabled} />
            Compare with previous period
          </label>
        ) : null}
      </div>

      {error ? <p className="text-destructive">{error}</p> : null}
      {loading || !data ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <Skeleton key={key} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Total revenue"
              value={centsToUSD(data.summary.revenueCents)}
              changePercent={percentChange(data.summary.revenueCents, data.previousSummary.revenueCents)}
            />
            <MetricCard
              label="Tickets sold"
              value={String(data.summary.ticketsSold)}
              changePercent={percentChange(data.summary.ticketsSold, data.previousSummary.ticketsSold)}
            />
            <MetricCard
              label="Orders"
              value={String(data.summary.orders)}
              changePercent={percentChange(data.summary.orders, data.previousSummary.orders)}
            />
            <MetricCard
              label="Average order value"
              value={centsToUSD(data.summary.averageOrderCents)}
              changePercent={percentChange(data.summary.averageOrderCents, data.previousSummary.averageOrderCents)}
            />
            <MetricCard
              label="Conversion rate"
              value={bpsToPercentLabel(data.summary.conversionBps)}
              changePercent={percentChange(data.summary.conversionBps, data.previousSummary.conversionBps)}
              hint={`${data.summary.visits} visits`}
            />
            {advanced ? (
              <MetricCard
                label="Refunded"
                value={centsToUSD(data.summary.refundedCents)}
                changePercent={percentChange(data.summary.refundedCents, data.previousSummary.refundedCents)}
                hint={`${data.summary.refundedOrders} orders`}
              />
            ) : (
              <MetricCard label="Visits" value={String(data.summary.visits)} changePercent={percentChange(data.summary.visits, data.previousSummary.visits)} />
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Revenue over time
                {advanced ? <span className="text-xs font-normal text-muted-foreground">with trend line</span> : null}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={exportTimeseriesCsv}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <RevenueLineChart
                points={data.timeseries.points}
                comparisonPoints={data.comparisonTimeseries?.points}
                bucket={controls.bucket}
                showTrendLine={advanced}
              />
              {data.comparisonTimeseries ? (
                <p className="mt-1 text-xs text-muted-foreground">Dashed line: previous period</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event performance</CardTitle>
              <Button size="sm" variant="outline" onClick={exportEventsCsv}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.events.rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No events in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2 pr-3">Start</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 pr-3 text-right">Tickets</th>
                      <th className="py-2 pr-3 text-right">Attendance</th>
                      {advanced ? (
                        <>
                          <th className="py-2 pr-3 text-right">Capacity used</th>
                          <th className="py-2 pr-3 text-right">Velocity</th>
                          <th className="py-2 pr-3 text-right">Rev / attendee</th>
                          <th className="py-2 text-right">Refunded</th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.rows.map((row) => (
                      <tr key={row.eventsId} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.eventTitle}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{formatEventDate(row.eventStartEpochSeconds)}</td>
                        <td className="py-2 pr-3">{row.eventStatus}</td>
                        <td className="py-2 pr-3 text-right font-mono">{centsToUSD(row.revenueCents)}</td>
                        <td className="py-2 pr-3 text-right">{row.ticketsSold}</td>
                        <td className="py-2 pr-3 text-right">{bpsToPercentLabel(row.attendanceRateBps)}</td>
                        {advanced ? (
                          <>
                            <td className="py-2 pr-3 text-right">{bpsToPercentLabel(row.capacityUsedBps)}</td>
                            <td className="py-2 pr-3 text-right">{salesVelocityLabel(row.salesPerDayMilli)}</td>
                            <td className="py-2 pr-3 text-right font-mono">{centsToUSD(row.revenuePerAttendeeCents)}</td>
                            <td className="py-2 text-right font-mono">{centsToUSD(row.refundedCents)}</td>
                          </>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue by ticket type</CardTitle>
                <Button size="sm" variant="outline" onClick={exportTicketTypesCsv}>
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <BarList
                  rows={data.ticketTypes.rows.map((row) => ({
                    label: `${row.label} — ${row.eventTitle}`,
                    detail: `${row.quantitySold} sold · ${centsToUSD(row.revenueCents)}`,
                    valueCents: Number(row.revenueCents),
                  }))}
                />
                {advanced && data.ticketTypes.rows.some((row) => row.refundedQuantity > 0) ? (
                  <div className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Refunds & cancellations
                    </p>
                    {data.ticketTypes.rows
                      .filter((row) => row.refundedQuantity > 0)
                      .map((row) => (
                        <p key={`${row.eventTicketTypesId}-${row.eventsId}`} className="text-sm text-muted-foreground">
                          {row.label} — {row.eventTitle}: {row.refundedQuantity} refunded (
                          {centsToUSD(row.refundedCents)})
                        </p>
                      ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CardTitle>Sales by channel</CardTitle>
                <ProBadge />
              </CardHeader>
              <CardContent>
                {advanced && data.channels ? (
                  <BarList
                    rows={data.channels.rows.map((row) => ({
                      label: row.channel,
                      detail: `${row.orders} orders · ${row.ticketsSold} tickets · ${centsToUSD(row.revenueCents)}`,
                      valueCents: Number(row.revenueCents),
                    }))}
                  />
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      See where your sales come from — direct, social, email, QR, and partners.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Included with Professional plans and above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
