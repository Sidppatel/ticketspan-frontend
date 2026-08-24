import { useCallback, useState, type FormEvent } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { formatEpoch } from '@/shared/lib/format';
import {
  ERROR_SEVERITIES,
  ERROR_SOURCES,
  RESOLVED_FILTER_ALL,
  RESOLVED_FILTER_RESOLVED,
  RESOLVED_FILTER_UNRESOLVED,
  getErrorLogStats,
  getErrorLogs,
  hasNextPage,
  nextPageOffset,
  pageLabel,
  previousPageOffset,
  resolveErrorLog,
  type ErrorLogEntry,
} from '@/features/developer/services/developerService';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { ShieldAlert, Search, ChevronRight, ChevronDown, CheckCircle2, AlertTriangle, Bug } from 'lucide-react';

const PAGE_SIZE = 25;

type SeverityBadgeVariant = 'danger' | 'warn' | 'neutral';

function severityVariant(severity: string): SeverityBadgeVariant {
  if (severity === 'Critical' || severity === 'High' || severity === 'Error') {
    return 'danger';
  }
  if (severity === 'Medium' || severity === 'Warning') {
    return 'warn';
  }
  return 'neutral';
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-1.5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function CountList({ title, counts }: { title: string; counts: { key: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border/40 p-4 pb-3">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-3">
        {counts.length === 0 ? <p className="text-xs text-muted-foreground">No events recorded</p> : null}
        {counts.map((item) => (
          <div key={item.key} className="flex items-center justify-between text-xs">
            <span className="truncate pr-2 font-medium text-foreground">{item.key}</span>
            <span className="font-mono font-semibold text-muted-foreground">{item.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ErrorDetail({ entry, onResolved }: { entry: ErrorLogEntry; onResolved: () => void }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const submitResolution = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await resolveErrorLog(entry.id, notes);
      onResolved();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Failed to resolve error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-border/40 pt-4 text-xs">
      <div className="grid gap-2 sm:grid-cols-2 rounded-xl bg-muted/30 p-3 font-mono">
        <p><span className="text-muted-foreground">Error ID: </span>{entry.id}</p>
        <p><span className="text-muted-foreground">Correlation: </span>{entry.correlationId || '—'}</p>
        <p><span className="text-muted-foreground">Exception: </span>{entry.exceptionType || '—'}</p>
        <p><span className="text-muted-foreground">Status Code: </span>{entry.statusCode || '—'}</p>
        <p><span className="text-muted-foreground">User ID: </span>{entry.usersId || '—'}</p>
        <p><span className="text-muted-foreground">Tenant ID: </span>{entry.tenantsId || '—'}</p>
        <p><span className="text-muted-foreground">Client IP: </span>{entry.ipAddress || '—'}</p>
        <p><span className="text-muted-foreground">Source: </span>{entry.source}</p>
      </div>

      {entry.stackTrace && (
        <div>
          <p className="mb-1.5 font-semibold text-foreground">Stack Trace</p>
          <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {entry.stackTrace}
          </pre>
        </div>
      )}

      {entry.metadataJson && (
        <div>
          <p className="mb-1.5 font-semibold text-foreground">Execution Context</p>
          <pre className="max-h-48 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {entry.metadataJson}
          </pre>
        </div>
      )}

      {entry.resolved ? (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3">
          <p className="font-semibold text-success flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" /> Resolved {formatEpoch(entry.resolvedAt)}
          </p>
          <p className="text-muted-foreground mt-1">{entry.resolvedNotes || 'No notes provided'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Resolution root-cause / mitigation notes…"
            className="min-h-16 text-xs"
          />
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          <Button size="sm" onClick={() => void submitResolution()} disabled={saving} className="h-8 text-xs">
            {saving ? 'Saving…' : 'Mark Error Resolved'}
          </Button>
        </div>
      )}
    </div>
  );
}

export function DeveloperLogsPage() {
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState(RESOLVED_FILTER_ALL);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState('');

  const statsLoader = useCallback(() => getErrorLogStats(), []);
  const stats = useAsync(statsLoader);

  const logsLoader = useCallback(
    () => getErrorLogs({ severity, source, resolvedFilter, search, offset, limit: PAGE_SIZE }),
    [severity, source, resolvedFilter, search, offset],
  );
  const logs = useAsync(logsLoader);

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchDraft);
  };

  const onResolved = () => {
    logs.reload();
    stats.reload();
  };

  const total = logs.data?.meta?.total ?? 0;

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-1 border-b border-border/40 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          System Error Logs
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Platform-wide error telemetry, exception stack traces, and resolution audit trail.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Errors Today"
          value={stats.data?.totalToday ?? 0}
          icon={<AlertTriangle className="size-4 text-warning" />}
        />
        <StatCard
          label="Last 7 Days"
          value={stats.data?.totalWeek ?? 0}
          icon={<ShieldAlert className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Last 30 Days"
          value={stats.data?.totalMonth ?? 0}
          icon={<Bug className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Unresolved Errors"
          value={stats.data?.unresolved ?? 0}
          icon={<AlertTriangle className="size-4 text-destructive" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CountList title="By Severity (30d)" counts={stats.data?.bySeverity ?? []} />
        <CountList title="Top Error Types (30d)" counts={stats.data?.topTypes ?? []} />
        <CountList title="Top Affected Tenants (30d)" counts={stats.data?.topTenants ?? []} />
      </div>

      <form onSubmit={applySearch} className="flex flex-wrap items-center gap-2">
        <Select
          className="h-9 w-36 text-xs"
          value={severity}
          onChange={(event) => {
            setOffset(0);
            setSeverity(event.target.value);
          }}
        >
          <option value="">All Severities</option>
          {ERROR_SEVERITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select
          className="h-9 w-36 text-xs"
          value={source}
          onChange={(event) => {
            setOffset(0);
            setSource(event.target.value);
          }}
        >
          <option value="">All Sources</option>
          {ERROR_SOURCES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select
          className="h-9 w-36 text-xs"
          value={String(resolvedFilter)}
          onChange={(event) => {
            setOffset(0);
            setResolvedFilter(Number(event.target.value));
          }}
        >
          <option value={String(RESOLVED_FILTER_ALL)}>All Statuses</option>
          <option value={String(RESOLVED_FILTER_UNRESOLVED)}>Unresolved</option>
          <option value={String(RESOLVED_FILTER_RESOLVED)}>Resolved</option>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search message, request path, correlation or error ID…"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">
          Filter
        </Button>
      </form>

      {logs.error && (
        <Alert variant="destructive">
          <AlertDescription>{logs.error}</AlertDescription>
        </Alert>
      )}

      {logs.loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Loading error logs…</div>
      ) : (logs.data?.entries ?? []).length > 0 ? (
        <div className="space-y-2">
          {(logs.data?.entries ?? []).map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className={isExpanded ? 'border-primary/40' : undefined}>
                <CardContent className="space-y-2 p-4">
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-center gap-2.5 text-left focus-visible:outline-none"
                    onClick={() => setExpandedId(isExpanded ? '' : entry.id)}
                  >
                    <Badge variant={severityVariant(entry.severity)}>{entry.severity}</Badge>
                    <Badge variant="neutral">{entry.source}</Badge>
                    {entry.resolved && <Badge variant="success">Resolved</Badge>}
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground sm:text-sm">
                      {entry.message}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.requestMethod} {entry.requestPath}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatEpoch(entry.timestamp)}
                    </span>
                    <div className="text-muted-foreground ml-1">
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </div>
                  </button>
                  {isExpanded && <ErrorDetail entry={entry} onResolved={onResolved} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ShieldAlert className="size-6 text-muted-foreground" />}
          title="No Error Logs"
          description="No errors match the current filter selection. System is operating normally."
        />
      )}

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <span className="text-xs text-muted-foreground font-mono">{pageLabel(offset, PAGE_SIZE, total)}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={offset === 0}
            onClick={() => setOffset(previousPageOffset(offset, PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={!hasNextPage(offset, PAGE_SIZE, total)}
            onClick={() => setOffset(nextPageOffset(offset, PAGE_SIZE))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
