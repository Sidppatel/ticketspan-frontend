import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listFeedback, deleteFeedback } from '@/features/admin/services/feedbackService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

export function AdminFeedbackPage() {
  const loader = useCallback(() => listFeedback(), []);
  const { data, loading, error, reload } = useAsync(loader);

  async function remove(id: string) {
    try {
      await deleteFeedback(id);
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Feedback</h1>
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((item) => (
          <Card key={item.feedbacksId}>
            <CardContent className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">
                  {item.name} · {item.type} · {item.rating}/5
                </p>
                <p className="text-muted-foreground">{item.message}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(item.feedbacksId)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {!loading && (data ?? []).length === 0 ? <p className="text-muted-foreground">No feedback.</p> : null}
    </div>
  );
}
