import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getAdminLogs } from '@/features/admin/services/logAdminService';
import { formatEpoch } from '@/shared/lib/format';
import { Card, CardContent } from '@/shared/ui/card';

export function AdminLogsPage() {
  const loader = useCallback(() => getAdminLogs(), []);
  const { data, loading, error } = useAsync(loader);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Activity logs</h1>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((entry) => (
          <Card key={entry.id}>
            <CardContent className="text-sm">
              <p className="font-medium">
                {entry.action} · {entry.entityType}
              </p>
              <p className="text-muted-foreground">
                {entry.actorEmail} · {formatEpoch(entry.timestamp)}
              </p>
              <p className="text-muted-foreground">{entry.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? <p className="text-muted-foreground">No log entries.</p> : null}
    </div>
  );
}
