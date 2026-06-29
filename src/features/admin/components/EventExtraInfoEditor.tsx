import { useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { setEventExtraInfo } from '@/features/admin/services/eventAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { Event } from '@/shared/proto/event';

interface InfoRow {
  key: string;
  value: string;
  isPublic: boolean;
}

function parseRows(json: string): InfoRow[] {
  try {
    const parsed = JSON.parse(json || '[]');
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      key: String(item?.key ?? ''),
      value: String(item?.value ?? ''),
      isPublic: item?.isPublic !== false,
    }));
  } catch {
    return [];
  }
}

export function EventExtraInfoEditor({ event, onSaved }: { event: Event; onSaved: () => void }) {
  const [rows, setRows] = useState<InfoRow[]>(() => parseRows(event.extraInfoJson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, patch: Partial<InfoRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const clean = rows
        .filter((row) => row.key.trim())
        .map((row, sortOrder) => ({ key: row.key.trim(), value: row.value, isPublic: row.isPublic, sortOrder }));
      await setEventExtraInfo(event, JSON.stringify(clean));
      onSaved();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <Info />
        </span>
        <CardTitle>Extra information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Notes, policies, age restrictions, parking, dress code — anything attendees should know.
          Uncheck “Public” to keep a row internal.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No extra info yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  className="w-40"
                  placeholder="Label (e.g. Parking)"
                  value={row.key}
                  onChange={(e) => update(index, { key: e.target.value })}
                />
                <Input
                  className="min-w-48 flex-1"
                  placeholder="Details"
                  value={row.value}
                  onChange={(e) => update(index, { value: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={row.isPublic}
                    onChange={(e) => update(index, { isPublic: e.target.checked })}
                  />
                  Public
                </label>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remove row"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRows((prev) => [...prev, { key: '', value: '', isPublic: true }])}
          >
            <Plus /> Add row
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save info'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
