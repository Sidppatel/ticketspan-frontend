import { reportingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  differenceInSeconds,
} from 'date-fns';
import type {
  ReportingAccess,
  ReportSummary,
  RevenueTimeseries,
  EventPerformanceList,
  TicketTypeBreakdownList,
  SalesByChannelList,
} from '@/shared/proto/reporting';

export type RangePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom';
export type Bucket = 'day' | 'week' | 'month' | 'year';

export interface ReportRange {
  fromEpochSeconds: bigint;
  toEpochSeconds: bigint;
  previousFromEpochSeconds: bigint;
  previousToEpochSeconds: bigint;
}

function toEpochSeconds(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

export function resolveRange(preset: RangePreset, customFrom?: string, customTo?: string): ReportRange {
  const now = new Date();
  let from: Date;
  let to: Date = now;
  switch (preset) {
    case 'today':
      from = startOfDay(now);
      break;
    case 'week':
      from = startOfWeek(now);
      break;
    case 'month':
      from = startOfMonth(now);
      break;
    case 'quarter':
      from = startOfQuarter(now);
      break;
    case 'custom':
      from = customFrom ? new Date(customFrom) : startOfMonth(now);
      to = customTo ? new Date(`${customTo}T23:59:59`) : now;
      break;
  }
  const spanSeconds = Math.max(differenceInSeconds(to, from), 1);
  const previousTo = from;
  const previousFrom = new Date(from.getTime() - spanSeconds * 1000);
  return {
    fromEpochSeconds: toEpochSeconds(from),
    toEpochSeconds: toEpochSeconds(to),
    previousFromEpochSeconds: toEpochSeconds(previousFrom),
    previousToEpochSeconds: toEpochSeconds(previousTo),
  };
}

export function defaultBucketForPreset(preset: RangePreset): Bucket {
  return preset === 'quarter' || preset === 'custom' ? 'week' : 'day';
}

export async function getReportingAccess(): Promise<ReportingAccess> {
  return callRpc(() => reportingClient.getReportingAccess({}));
}

export async function getReportSummary(fromEpochSeconds: bigint, toEpochSeconds: bigint): Promise<ReportSummary> {
  return callRpc(() =>
    reportingClient.getReportSummary({
      fromEpochSeconds: String(fromEpochSeconds),
      toEpochSeconds: String(toEpochSeconds),
    }),
  );
}

export async function getRevenueTimeseries(
  fromEpochSeconds: bigint,
  toEpochSeconds: bigint,
  bucket: Bucket,
): Promise<RevenueTimeseries> {
  return callRpc(() =>
    reportingClient.getRevenueTimeseries({
      fromEpochSeconds: String(fromEpochSeconds),
      toEpochSeconds: String(toEpochSeconds),
      bucket,
    }),
  );
}

export async function getEventPerformance(
  fromEpochSeconds: bigint,
  toEpochSeconds: bigint,
): Promise<EventPerformanceList> {
  return callRpc(() =>
    reportingClient.getEventPerformance({
      fromEpochSeconds: String(fromEpochSeconds),
      toEpochSeconds: String(toEpochSeconds),
    }),
  );
}

export async function getTicketTypeBreakdown(
  fromEpochSeconds: bigint,
  toEpochSeconds: bigint,
): Promise<TicketTypeBreakdownList> {
  return callRpc(() =>
    reportingClient.getTicketTypeBreakdown({
      fromEpochSeconds: String(fromEpochSeconds),
      toEpochSeconds: String(toEpochSeconds),
    }),
  );
}

export async function getSalesByChannel(
  fromEpochSeconds: bigint,
  toEpochSeconds: bigint,
): Promise<SalesByChannelList> {
  return callRpc(() =>
    reportingClient.getSalesByChannel({
      fromEpochSeconds: String(fromEpochSeconds),
      toEpochSeconds: String(toEpochSeconds),
    }),
  );
}

export function percentChange(current: number | string, previous: number | string): number | null {
  const currentValue = Number(current);
  const previousValue = Number(previous);
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) {
    return null;
  }
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

export function bpsToPercentLabel(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function salesVelocityLabel(salesPerDayMilli: number): string {
  return `${(salesPerDayMilli / 1000).toFixed(1)}/day`;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const content = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
