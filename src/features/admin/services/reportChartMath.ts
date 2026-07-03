import type { RevenueTimeseriesPoint } from '@/shared/proto/reporting';
import type { Bucket } from '@/features/admin/services/reportingService';

export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 220;
export const CHART_PADDING = 28;

export interface ChartPoint {
  x: number;
  y: number;
  label: string;
  valueCents: number;
}

export interface LineChartModel {
  path: string;
  trendPath: string;
  points: ChartPoint[];
  maxCents: number;
  gridLines: { y: number; label: string }[];
}

function niceCeiling(value: number): number {
  if (value <= 0) {
    return 100;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

export function formatBucketLabel(epochSeconds: number | string, bucket: Bucket): string {
  const date = new Date(Number(epochSeconds) * 1000);
  if (bucket === 'year') {
    return String(date.getUTCFullYear());
  }
  if (bucket === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function buildLineChart(points: RevenueTimeseriesPoint[], bucket: Bucket): LineChartModel {
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const values = points.map((point) => Number(point.revenueCents));
  const maxCents = niceCeiling(Math.max(...values, 0));
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const chartPoints: ChartPoint[] = points.map((point, index) => ({
    x: CHART_PADDING + (points.length > 1 ? index * stepX : innerWidth / 2),
    y: CHART_PADDING + innerHeight - (Number(point.revenueCents) / maxCents) * innerHeight,
    label: formatBucketLabel(point.bucketStartEpochSeconds, bucket),
    valueCents: Number(point.revenueCents),
  }));

  const path = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ');

  let trendPath = '';
  if (chartPoints.length >= 2) {
    const n = chartPoints.length;
    const meanX = chartPoints.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = chartPoints.reduce((sum, p) => sum + p.y, 0) / n;
    const covariance = chartPoints.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
    const variance = chartPoints.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
    const slope = variance === 0 ? 0 : covariance / variance;
    const firstX = chartPoints[0].x;
    const lastX = chartPoints[n - 1].x;
    const yAt = (x: number) => meanY + slope * (x - meanX);
    trendPath = `M${firstX.toFixed(1)},${yAt(firstX).toFixed(1)} L${lastX.toFixed(1)},${yAt(lastX).toFixed(1)}`;
  }

  const gridLines = [0, 0.5, 1].map((fraction) => ({
    y: CHART_PADDING + innerHeight - fraction * innerHeight,
    label: `$${Math.round((maxCents * fraction) / 100).toLocaleString()}`,
  }));

  return { path, trendPath, points: chartPoints, maxCents, gridLines };
}

export interface BarModel {
  label: string;
  detail: string;
  widthPercent: number;
}

export function buildBars(rows: { label: string; detail: string; valueCents: number }[]): BarModel[] {
  const maxValue = Math.max(...rows.map((row) => row.valueCents), 1);
  return rows.map((row) => ({
    label: row.label,
    detail: row.detail,
    widthPercent: Math.max(Math.round((row.valueCents / maxValue) * 100), 2),
  }));
}
