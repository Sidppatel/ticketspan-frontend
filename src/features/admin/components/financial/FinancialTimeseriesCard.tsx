import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
import { Download, TrendingUp } from 'lucide-react';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { downloadCsv, type Bucket } from '@/features/admin/services/reportingService';
import type { RevenueTimeseriesPoint } from '@/shared/proto/reporting';

interface FinancialTimeseriesCardProps {
  points: RevenueTimeseriesPoint[];
  comparisonPoints?: RevenueTimeseriesPoint[] | null;
  bucket: Bucket;
  setBucket: (bucket: Bucket) => void;
  isAdvanced: boolean;
  compareEnabled: boolean;
}

type ChartMetric = 'revenue' | 'orders' | 'tickets';

const BASIC_BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const ADVANCED_BUCKETS: { value: Bucket; label: string }[] = [
  ...BASIC_BUCKETS,
  { value: 'year', label: 'Yearly' },
];

export function FinancialTimeseriesCard({
  points,
  comparisonPoints,
  bucket,
  setBucket,
  isAdvanced,
  compareEnabled,
}: FinancialTimeseriesCardProps) {
  const [metric, setMetric] = useState<ChartMetric>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buckets = isAdvanced ? ADVANCED_BUCKETS : BASIC_BUCKETS;

  function exportTimeseriesCsv() {
    downloadCsv(
      'revenue-over-time.csv',
      ['Bucket Date', 'Revenue', 'Orders', 'Tickets Sold'],
      points.map((p) => [
        formatEpoch(p.bucketStartEpochSeconds),
        centsToUSD(p.revenueCents),
        p.orders,
        p.ticketsSold,
      ]),
    );
  }

  const getPointValue = (p: RevenueTimeseriesPoint) => {
    if (metric === 'orders') return p.orders;
    if (metric === 'tickets') return p.ticketsSold;
    return Number(p.revenueCents);
  };

  const formatPointValue = (val: number) => {
    if (metric === 'revenue') return centsToUSD(val);
    return val.toLocaleString();
  };

  const values = points.map(getPointValue);
  const compValues = (comparisonPoints ?? []).map(getPointValue);
  const maxValue = Math.max(...values, ...compValues, 1);

  const chartWidth = 760;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const innerW = chartWidth - paddingX * 2;
  const innerH = chartHeight - paddingY * 2;

  const getX = (index: number, len: number) => {
    if (len <= 1) return paddingX + innerW / 2;
    return paddingX + (index / (len - 1)) * innerW;
  };

  const getY = (val: number) => {
    return paddingY + innerH - (val / maxValue) * innerH;
  };

  const mainPath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, points.length).toFixed(1)} ${getY(getPointValue(p)).toFixed(1)}`).join(' ')
    : '';

  const compPath = (comparisonPoints && comparisonPoints.length > 0)
    ? comparisonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, comparisonPoints.length).toFixed(1)} ${getY(getPointValue(p)).toFixed(1)}`).join(' ')
    : '';

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold font-display text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Financial Trend & Activity
            </CardTitle>
            {isAdvanced && <Badge variant="voltage">Pro</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Visual breakdown of sales velocity and checkout performance over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                metric === 'revenue' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMetric('revenue')}
            >
              Revenue
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                metric === 'orders' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMetric('orders')}
            >
              Orders
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                metric === 'tickets' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMetric('tickets')}
            >
              Tickets
            </button>
          </div>

          <Select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as Bucket)}
            className="h-8 text-xs w-28 bg-background border-border/70"
          >
            {buckets.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </Select>

          {isAdvanced && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportTimeseriesCsv}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {points.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No sales or orders recorded for the selected timeframe.
          </div>
        ) : (
          <div className="relative">
            {activePoint && (
              <div className="absolute top-0 right-2 z-10 rounded-lg border border-border/80 bg-popover/90 backdrop-blur-md px-3 py-1.5 text-xs shadow-md">
                <span className="font-semibold text-foreground">
                  {formatEpoch(activePoint.bucketStartEpochSeconds)}:
                </span>{' '}
                <span className="font-bold text-primary ml-1 font-mono">
                  {formatPointValue(getPointValue(activePoint))}
                </span>
                <span className="text-muted-foreground ml-2 text-[11px]">
                  ({activePoint.orders} orders · {activePoint.ticketsSold} tickets)
                </span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
              role="img"
              aria-label="Financial Timeseries Chart"
            >
              {[0, 0.5, 1].map((frac) => {
                const y = paddingY + innerH - frac * innerH;
                const labelVal = maxValue * frac;
                return (
                  <g key={frac}>
                    <line
                      x1={paddingX}
                      x2={chartWidth - paddingX}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.08}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fontSize={9}
                      textAnchor="end"
                      fill="currentColor"
                      fillOpacity={0.45}
                      fontFamily="monospace"
                    >
                      {metric === 'revenue' ? `$${Math.round(labelVal / 100).toLocaleString()}` : Math.round(labelVal).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {compPath && compareEnabled && (
                <path
                  d={compPath}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.3}
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                />
              )}

              {mainPath && (
                <path
                  d={mainPath}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((p, idx) => {
                const cx = getX(idx, points.length);
                const cy = getY(getPointValue(p));
                const isHovered = hoveredIndex === idx;
                return (
                  <g
                    key={`point-${p.bucketStartEpochSeconds}-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill="var(--primary)"
                      stroke="var(--background)"
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      className="transition-all duration-150"
                    />
                    <text
                      x={cx}
                      y={chartHeight - 6}
                      fontSize={9}
                      textAnchor="middle"
                      fill="currentColor"
                      fillOpacity={isHovered ? 0.9 : 0.5}
                      fontWeight={isHovered ? 600 : 400}
                    >
                      {formatEpoch(p.bucketStartEpochSeconds).split(',')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {compareEnabled && (
              <div className="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-4 rounded-full bg-primary" />
                  Selected Period
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-b border-dashed border-muted-foreground" />
                  Previous Period
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
