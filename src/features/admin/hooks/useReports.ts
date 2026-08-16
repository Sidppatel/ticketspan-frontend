import { useCallback, useMemo, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  resolveRange,
  defaultBucketForPreset,
  getReportingAccess,
  getReportSummary,
  getRevenueTimeseries,
  getEventPerformance,
  getTicketTypeBreakdown,
  getSalesByChannel,
  type RangePreset,
  type Bucket,
} from '@/features/admin/services/reportingService';
import type {
  ReportingAccess,
  ReportSummary,
  RevenueTimeseries,
  EventPerformanceList,
  TicketTypeBreakdownList,
  SalesByChannelList,
} from '@/shared/proto/reporting';

export type ItemKindFilter = 'all' | 'ticket' | 'table';

export interface ReportsData {
  access: ReportingAccess;
  summary: ReportSummary;
  previousSummary: ReportSummary;
  timeseries: RevenueTimeseries;
  comparisonTimeseries: RevenueTimeseries | null;
  events: EventPerformanceList;
  ticketTypes: TicketTypeBreakdownList;
  salesByChannel: SalesByChannelList | null;
}

export interface ReportsControls {
  preset: RangePreset;
  setPreset: (preset: RangePreset) => void;
  bucket: Bucket;
  setBucket: (bucket: Bucket) => void;
  compareEnabled: boolean;
  setCompareEnabled: (enabled: boolean) => void;
  customFrom: string;
  setCustomFrom: (value: string) => void;
  customTo: string;
  setCustomTo: (value: string) => void;
  itemFilter: ItemKindFilter;
  setItemFilter: (filter: ItemKindFilter) => void;
  selectedEventId: string;
  setSelectedEventId: (eventId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function useReports() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [bucket, setBucket] = useState<Bucket>(defaultBucketForPreset('month'));
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [itemFilter, setItemFilter] = useState<ItemKindFilter>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const changePreset = useCallback((next: RangePreset) => {
    setPreset(next);
    setBucket(defaultBucketForPreset(next));
  }, []);

  const loader = useCallback(async (): Promise<ReportsData> => {
    const range = resolveRange(preset, customFrom, customTo);
    const access = await getReportingAccess();
    const wantComparison = access.hasAdvancedReporting && compareEnabled;

    const [summary, previousSummary, timeseries, events, ticketTypes, comparisonTimeseries, salesByChannel] =
      await Promise.all([
        getReportSummary(range.fromEpochSeconds, range.toEpochSeconds),
        getReportSummary(range.previousFromEpochSeconds, range.previousToEpochSeconds),
        getRevenueTimeseries(range.fromEpochSeconds, range.toEpochSeconds, bucket),
        getEventPerformance(range.fromEpochSeconds, range.toEpochSeconds),
        getTicketTypeBreakdown(range.fromEpochSeconds, range.toEpochSeconds),
        wantComparison
          ? getRevenueTimeseries(range.previousFromEpochSeconds, range.previousToEpochSeconds, bucket)
          : Promise.resolve(null),
        access.hasAdvancedReporting
          ? getSalesByChannel(range.fromEpochSeconds, range.toEpochSeconds).catch(() => null)
          : Promise.resolve(null),
      ]);

    return {
      access,
      summary,
      previousSummary,
      timeseries,
      comparisonTimeseries,
      events,
      ticketTypes,
      salesByChannel,
    };
  }, [preset, bucket, compareEnabled, customFrom, customTo]);

  const state = useAsync(loader);

  const controls = useMemo<ReportsControls>(
    () => ({
      preset,
      setPreset: changePreset,
      bucket,
      setBucket,
      compareEnabled,
      setCompareEnabled,
      customFrom,
      setCustomFrom,
      customTo,
      setCustomTo,
      itemFilter,
      setItemFilter,
      selectedEventId,
      setSelectedEventId,
      searchQuery,
      setSearchQuery,
    }),
    [preset, changePreset, bucket, compareEnabled, customFrom, customTo, itemFilter, selectedEventId, searchQuery],
  );

  return { ...state, controls };
}
