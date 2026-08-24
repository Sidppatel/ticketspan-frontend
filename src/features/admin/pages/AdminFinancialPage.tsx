import { useReports } from '@/features/admin/hooks/useReports';
import { formatEpoch } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Skeleton } from '@/shared/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { RefreshCw, Sparkles } from 'lucide-react';
import { FinancialSummaryCards } from '@/features/admin/components/financial/FinancialSummaryCards';
import { FinancialTimeseriesCard } from '@/features/admin/components/financial/FinancialTimeseriesCard';
import { EventPerformanceSection } from '@/features/admin/components/financial/EventPerformanceSection';
import { ItemBreakdownSection } from '@/features/admin/components/financial/ItemBreakdownSection';
import { SalesChannelSection } from '@/features/admin/components/financial/SalesChannelSection';
import { ProUpgradeBanner } from '@/features/admin/components/financial/ProUpgradeBanner';
import type { RangePreset } from '@/features/admin/services/reportingService';

const PRESETS: { value: RangePreset; label: string; isPro?: boolean }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom', isPro: true },
];

export function AdminFinancialPage() {
  const { data, loading, error, reload, controls } = useReports();
  const isAdvanced = data?.access.hasAdvancedReporting ?? false;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Financial Overview
            </h1>
            {isAdvanced ? (
              <Badge variant="voltage" className="gap-1 font-semibold">
                <Sparkles className="h-3 w-3" />
                Pro Analytics
              </Badge>
            ) : (
              <Badge variant="neutral">Standard</Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete financial telemetry — revenue streams, ticket velocity, and event ledger audit trails.
          </p>
        </div>

        {data ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
            <span>Updated {formatEpoch(data.summary.generatedAtEpochSeconds)}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1 hover:bg-muted"
              onClick={reload}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 bg-muted/20 border border-border/60 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => {
              if (p.isPro && !isAdvanced) {
                return (
                  <button
                    key={p.value}
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 text-muted-foreground/50 cursor-not-allowed bg-muted/10"
                  >
                    {p.label}
                    <Badge variant="voltage" className="text-[9px] px-1 py-0 h-3.5">
                      Pro
                    </Badge>
                  </button>
                );
              }

              return (
                <Button
                  key={p.value}
                  size="sm"
                  variant={controls.preset === p.value ? 'default' : 'outline'}
                  className={`h-8 text-xs font-medium ${
                    controls.preset === p.value ? 'shadow-xs' : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => controls.setPreset(p.value)}
                >
                  {p.label}
                </Button>
              );
            })}
          </div>

          {isAdvanced && controls.preset === 'custom' && (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div className="space-y-1">
                <Label htmlFor="financial-custom-from" className="text-[10px] uppercase font-bold text-muted-foreground">
                  From
                </Label>
                <Input
                  id="financial-custom-from"
                  type="date"
                  value={controls.customFrom}
                  onChange={(e) => controls.setCustomFrom(e.target.value)}
                  className="h-8 text-xs w-34 bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="financial-custom-to" className="text-[10px] uppercase font-bold text-muted-foreground">
                  To
                </Label>
                <Input
                  id="financial-custom-to"
                  type="date"
                  value={controls.customTo}
                  onChange={(e) => controls.setCustomTo(e.target.value)}
                  className="h-8 text-xs w-34 bg-background"
                />
              </div>
            </div>
          )}
        </div>

        {isAdvanced && (
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <Switch
              checked={controls.compareEnabled}
              onCheckedChange={controls.setCompareEnabled}
            />
            <span>Compare with previous period</span>
          </label>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isAdvanced && <ProUpgradeBanner />}

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
              <Skeleton key={key} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          <FinancialSummaryCards
            summary={data.summary}
            previousSummary={data.previousSummary}
            access={data.access}
          />

          <FinancialTimeseriesCard
            points={data.timeseries.points}
            comparisonPoints={data.comparisonTimeseries?.points}
            bucket={controls.bucket}
            setBucket={controls.setBucket}
            isAdvanced={isAdvanced}
            compareEnabled={controls.compareEnabled}
          />

          <EventPerformanceSection
            events={data.events.rows}
            ticketTypes={data.ticketTypes.rows}
            isAdvanced={isAdvanced}
          />

          <ItemBreakdownSection
            ticketTypes={data.ticketTypes.rows}
            events={data.events.rows}
            isAdvanced={isAdvanced}
          />

          <SalesChannelSection
            salesByChannel={data.salesByChannel}
            isAdvanced={isAdvanced}
          />
        </>
      )}
    </div>
  );
}
