import { useCallback, useState } from 'react';
import { Mic2, Award } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listPerformers,
  listSponsors,
  setEventPerformers,
  setEventSponsors,
  createPerformer,
  createSponsor,
} from '@/features/admin/services/catalogService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Select } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

function parseLinks(json: string, idKey: string): Option[] {
  try {
    const parsed = JSON.parse(json || '[]');
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({ id: String(item[idKey] ?? ''), name: String(item.name ?? '') }))
        .filter((item) => item.id);
    }
  } catch {
    return [];
  }
  return [];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function EventCatalogLinks({
  eventsId,
  performersJson,
  sponsorsJson,
  onChanged,
}: {
  eventsId: string;
  performersJson: string;
  sponsorsJson: string;
  onChanged: () => void;
}) {
  const performersLoader = useCallback(() => listPerformers(), []);
  const sponsorsLoader = useCallback(() => listSponsors(), []);
  const performers = useAsync(performersLoader);
  const sponsors = useAsync(sponsorsLoader);

  const performerOptions = (performers.data ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({ id: p.performersId, name: p.name }));
  const sponsorOptions = (sponsors.data ?? [])
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.sponsorsId, name: s.name }));

  return (
    <>
      <LinkManager
        icon={Mic2}
        title="Performers"
        options={performerOptions}
        selected={parseLinks(performersJson, 'performerId')}
        onChange={(ids) => setEventPerformers(eventsId, ids).then(onChanged)}
        onCreate={async (name) => {
          const id = await createPerformer({
            name,
            slug: slugify(name),
            imagePath: '',
            metaJson: '[]',
            isActive: true,
          });
          await performers.reload();
          return id;
        }}
      />
      <LinkManager
        icon={Award}
        title="Sponsors"
        options={sponsorOptions}
        selected={parseLinks(sponsorsJson, 'sponsorId')}
        onChange={(ids) => setEventSponsors(eventsId, ids).then(onChanged)}
        onCreate={async (name) => {
          const id = await createSponsor({
            name,
            slug: slugify(name),
            imagePath: '',
            metaJson: '[]',
            isActive: true,
          });
          await sponsors.reload();
          return id;
        }}
      />
    </>
  );
}

function LinkManager({
  icon: Icon,
  title,
  options,
  selected,
  onChange,
  onCreate,
}: {
  icon: LucideIcon;
  title: string;
  options: Option[];
  selected: Option[];
  onChange: (ids: string[]) => Promise<void>;
  onCreate: (name: string) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedIds = selected.map((s) => s.id);
  const available = options.filter((o) => !selectedIds.includes(o.id));

  async function apply(ids: string[]) {
    setBusy(true);
    setError(null);
    try {
      await onChange(ids);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError('Name is required');
      return;
    }
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const newId = await onCreate(newName.trim());
      setIsCreateOpen(false);
      setNewName('');
      await apply([...selectedIds, newId]);
    } catch (caught) {
      setCreateError(rpcErrorMessage(caught));
    } finally {
      setCreateSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <Icon />
        </span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Select
            className="w-64 bg-background"
            value=""
            disabled={busy}
            onChange={(e) => e.target.value && apply([...selectedIds, e.target.value])}
          >
            <option value="">{available.length === 0 ? `No more ${title.toLowerCase()}` : `+ Add ${title.toLowerCase()}`}</option>
            {available.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3 rounded-lg text-xs font-bold text-primary flex items-center gap-1 hover:bg-primary/5 hover:text-primary border border-primary/20"
          >
            <Plus className="h-3.5 w-3.5" /> Create New
          </Button>
        </div>
        {error ? <p className="text-sm text-amber-foreground">{error}</p> : null}
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">None linked yet.</p>
        ) : (
          <div className="space-y-1">
            {selected.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b py-1 text-sm">
                <span>{item.name || item.id}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => apply(selectedIds.filter((id) => id !== item.id))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" /> Create New {title.slice(0, -1)}
          </DialogTitle>
          <div className="space-y-4 py-3">
            {createError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive">
                {createError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>Name</Label>
              <div className="svyne-spring-input">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`Name of the ${title.toLowerCase().slice(0, -1)}`}
                  className="h-10 bg-background border-border text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreateOpen(false);
                  setNewName('');
                  setCreateError(null);
                }}
                disabled={createSubmitting}
                className="h-9 px-4 rounded-lg font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={createSubmitting || !newName.trim()}
                className="svyne-spring-btn h-9 px-4 rounded-lg font-bold text-xs shadow-sm shadow-primary/10"
              >
                {createSubmitting ? 'Creating...' : 'Create & Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
