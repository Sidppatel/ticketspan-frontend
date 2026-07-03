import { centsToUSD } from '@/shared/lib/format';
import {
  CHART_WIDTH,
  CHART_HEIGHT,
  CHART_PADDING,
  buildLineChart,
  buildBars,
  type LineChartModel,
} from '@/features/admin/services/reportChartMath';
import type { RevenueTimeseriesPoint } from '@/shared/proto/reporting';
import type { Bucket } from '@/features/admin/services/reportingService';

interface RevenueLineChartProps {
  points: RevenueTimeseriesPoint[];
  comparisonPoints?: RevenueTimeseriesPoint[] | null;
  bucket: Bucket;
  showTrendLine: boolean;
}

function ChartSeries({ model, color, dashed }: { model: LineChartModel; color: string; dashed?: boolean }) {
  return (
    <g>
      <path d={model.path} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} />
      {model.points.map((point) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={3.5} fill={color}>
          <title>{`${point.label}: ${centsToUSD(point.valueCents)}`}</title>
        </circle>
      ))}
    </g>
  );
}

export function RevenueLineChart({ points, comparisonPoints, bucket, showTrendLine }: RevenueLineChartProps) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period yet.</p>;
  }
  const model = buildLineChart(points, bucket);
  const comparisonModel = comparisonPoints && comparisonPoints.length > 0 ? buildLineChart(comparisonPoints, bucket) : null;
  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" role="img" aria-label="Revenue over time">
      {model.gridLines.map((line) => (
        <g key={line.y}>
          <line
            x1={CHART_PADDING}
            x2={CHART_WIDTH - CHART_PADDING}
            y1={line.y}
            y2={line.y}
            stroke="currentColor"
            strokeOpacity={0.12}
          />
          <text x={0} y={line.y} dy={4} fontSize={10} fill="currentColor" fillOpacity={0.55}>
            {line.label}
          </text>
        </g>
      ))}
      {model.points.map((point) => (
        <text
          key={`label-${point.x}`}
          x={point.x}
          y={CHART_HEIGHT}
          dy={-6}
          fontSize={9}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.55}
        >
          {point.label}
        </text>
      ))}
      {comparisonModel ? <ChartSeries model={comparisonModel} color="var(--muted-foreground, #999)" dashed /> : null}
      {showTrendLine && model.trendPath ? (
        <path d={model.trendPath} fill="none" stroke="var(--marigold, #f9a825)" strokeWidth={1.5} strokeDasharray="3 3" />
      ) : null}
      <ChartSeries model={model} color="var(--primary, #2e7d32)" />
    </svg>
  );
}

interface BarListProps {
  rows: { label: string; detail: string; valueCents: number }[];
}

export function BarList({ rows }: BarListProps) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing to show for this period.</p>;
  }
  const bars = buildBars(rows);
  return (
    <div className="space-y-2">
      {bars.map((bar) => (
        <div key={`${bar.label}-${bar.detail}`} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{bar.label}</span>
            <span className="text-muted-foreground">{bar.detail}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${bar.widthPercent}%` }} title={bar.detail} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  changePercent: number | null;
  hint?: string;
}

export function MetricCard({ label, value, changePercent, hint }: MetricCardProps) {
  const positive = changePercent !== null && changePercent >= 0;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs">
        {changePercent === null ? (
          <span className="text-muted-foreground">— vs previous period</span>
        ) : (
          <span className={positive ? 'text-success' : 'text-destructive'}>
            {positive ? '▲' : '▼'} {Math.abs(changePercent)}% vs previous period
          </span>
        )}
        {hint ? <span className="ml-1 text-muted-foreground">{hint}</span> : null}
      </p>
    </div>
  );
}
