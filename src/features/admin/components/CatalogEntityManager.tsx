import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { imageUrl } from '@/shared/upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { UnifiedImageUploader } from '@/shared/components/upload/UnifiedImageUploader';
import { cn } from '@/shared/lib/cn';
import { Plus, Search, Sparkles, Building2, Globe, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NamedDraft } from '@/features/admin/services/catalogService';

interface MetaRow {
  key: string;
  value: string;
}

export interface CatalogEntity {
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  isActive: boolean;
}

interface ManagerProps<T extends CatalogEntity> {
  title: string;
  entityType: string;
  suggestedKeys: string[];
  aspectRatio?: string;
  load: () => Promise<T[]>;
  create: (draft: NamedDraft) => Promise<string>;
  update: (id: string, draft: NamedDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  idOf: (item: T) => string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseMeta(metaJson: string): MetaRow[] {
  try {
    const parsed = JSON.parse(metaJson || '[]');
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({ key: String(item.key ?? ''), value: String(item.value ?? '') }));
    }
  } catch {
    return [];
  }
  return [];
}

function serializeMeta(rows: MetaRow[]): string {
  return JSON.stringify(
    rows
      .filter((row) => row.key.trim())
      .map((row, index) => ({ key: row.key.trim(), value: row.value, isPublic: true, sortOrder: index })),
  );
}

export function CatalogEntityManager<T extends CatalogEntity>(props: ManagerProps<T>) {
  const loader = useCallback(() => props.load(), [props]);
  const { data, loading, error, reload } = useAsync(loader);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [imagesId, setImagesId] = useState('');
  const [meta, setMeta] = useState<MetaRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  async function add() {
    setNotice(null);
    try {
      await props.create({
        name,
        slug: slugify(name),
        imagePath: imagesId,
        metaJson: serializeMeta(meta),
        isActive: true,
      });
      setName('');
      setImagesId('');
      setMeta([]);
      setIsAdding(false);
      toast.success(`${props.title.slice(0, -1)} added successfully`);
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const items = data ?? [];
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight font-display text-foreground md:text-4xl">
              {props.title}
            </h1>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary border border-primary/20">
              {items.length} total ({activeCount} active)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage {props.title.toLowerCase()} logos, branding tiers, website links, and catalog visibility.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding((v) => !v)}
          className="h-11 px-6 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 gap-2"
        >
          <Plus className="size-4" /> {isAdding ? 'Close Builder' : `Add ${props.title.slice(0, -1)}`}
        </Button>
      </div>

      {isAdding && (
        <div className="border border-border/60 bg-card shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="border-b border-border/20 px-6 py-4 bg-muted/20">
            <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> New {props.title.slice(0, -1)} Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {notice ? (
              <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">
                {notice}
              </p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    placeholder="e.g. Acme Corporation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 bg-background border-border text-sm font-semibold rounded-xl"
                  />
                </div>

                <MetaEditor rows={meta} onChange={setMeta} suggestedKeys={props.suggestedKeys} />
              </div>

              <div className="md:col-span-5 border-l border-border/20 pl-0 md:pl-6">
                <UnifiedImageUploader
                  entityType={props.entityType}
                  imagesId={imagesId}
                  onChange={setImagesId}
                  aspectRatio={props.aspectRatio ?? '1:1'}
                  label="Official Logo / Artwork"
                  hint="PNG or SVG with transparent background recommended"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/20 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="h-10 px-5 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={add}
                disabled={!name.trim()}
                className={cn(
                  'h-10 px-7 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20',
                  !name.trim() && 'opacity-40 cursor-not-allowed',
                )}
              >
                Save {props.title.slice(0, -1)}
              </Button>
            </div>
          </CardContent>
        </div>
      )}

      <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border/40 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${props.title.toLowerCase()} by name or slug...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-none bg-transparent text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : null}

      {error ? <p className="text-destructive font-bold text-sm bg-destructive/10 p-4 rounded-2xl">{error}</p> : null}

      {!loading && filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-dashed border-border/60 rounded-3xl space-y-3">
          <Building2 className="size-10 mx-auto text-muted-foreground/50" />
          <p className="text-sm font-bold text-muted-foreground">No {props.title.toLowerCase()} found.</p>
          <Button size="sm" onClick={() => setIsAdding(true)} className="rounded-xl font-bold">
            Create First {props.title.slice(0, -1)}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => (
            <EntityRow
              key={props.idOf(item)}
              item={item}
              entityType={props.entityType}
              suggestedKeys={props.suggestedKeys}
              aspectRatio={props.aspectRatio ?? '1:1'}
              onSave={(draft) => props.update(props.idOf(item), draft)}
              onRemove={() => props.remove(props.idOf(item))}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntityRow<T extends CatalogEntity>({
  item,
  entityType,
  suggestedKeys,
  aspectRatio = '1:1',
  onSave,
  onRemove,
  onChanged,
}: {
  item: T;
  entityType: string;
  suggestedKeys: string[];
  aspectRatio?: string;
  onSave: (draft: NamedDraft) => Promise<void>;
  onRemove: () => Promise<void>;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(item.name);
  const [imagesId, setImagesId] = useState(item.primaryImagePath);
  const [meta, setMeta] = useState<MetaRow[]>(parseMeta(item.metaJson));

  const websiteUrl = meta.find((m) => m.key.toLowerCase() === 'website')?.value;
  const tier = meta.find((m) => m.key.toLowerCase() === 'tier')?.value;

  async function persist(isActive: boolean) {
    setNotice(null);
    try {
      await onSave({ name, slug: item.slug, imagePath: imagesId, metaJson: serializeMeta(meta), isActive });
      setEditing(false);
      toast.success('Settings updated');
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
      toast.success('Removed successfully');
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div
      className={cn(
        'rounded-3xl border bg-card transition-all duration-300 overflow-hidden flex flex-col',
        item.isActive
          ? 'border-border/60 shadow-md hover:border-primary/40'
          : 'border-border-soft opacity-60 bg-muted/20 shadow-none scale-[0.99]',
      )}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {item.primaryImagePath ? (
              <img
                src={imageUrl(item.primaryImagePath)}
                alt={item.name}
                className="size-14 rounded-2xl object-cover shadow-md border border-border/40 shrink-0 bg-background"
              />
            ) : (
              <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground text-xs font-bold uppercase shrink-0">
                Logo
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-foreground font-display truncate">{item.name}</h3>
                {tier && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                    {tier}
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground block truncate">/{item.slug}</span>
              {websiteUrl && (
                <a
                  href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-0.5"
                >
                  <Globe className="size-3" /> {websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={item.isActive} onCheckedChange={(v) => persist(v)} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing((v) => !v)}
              className="h-8 px-3 text-xs font-bold rounded-xl"
            >
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>
        </div>

        {notice ? (
          <p className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 leading-normal animate-shake">
            {notice}
          </p>
        ) : null}

        {editing && (
          <div className="space-y-4 pt-4 border-t border-border/20 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-background text-sm font-semibold rounded-xl"
              />
            </div>

            <UnifiedImageUploader
              entityType={entityType}
              imagesId={imagesId}
              onChange={setImagesId}
              aspectRatio={aspectRatio}
              label="Update Logo"
            />

            <MetaEditor rows={meta} onChange={setMeta} suggestedKeys={suggestedKeys} />

            <div className="flex items-center justify-between border-t border-border/10 pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => guard(onRemove)}
                className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
              <Button
                size="sm"
                onClick={() => persist(item.isActive)}
                className="h-9 px-5 rounded-xl font-bold text-xs shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}

function MetaEditor({
  rows,
  onChange,
  suggestedKeys,
}: {
  rows: MetaRow[];
  onChange: (rows: MetaRow[]) => void;
  suggestedKeys: string[];
}) {
  function update(index: number, patch: Partial<MetaRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Metadata, Tiers &amp; Social Links
      </Label>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            className="w-36 h-9 text-xs bg-background rounded-xl font-mono font-bold"
            placeholder="key (e.g. tier)"
            list="catalog-meta-keys"
            value={row.key}
            onChange={(e) => update(index, { key: e.target.value })}
          />
          <Input
            className="flex-1 h-9 text-xs bg-background rounded-xl font-medium"
            placeholder="value (e.g. Headline Sponsor)"
            value={row.value}
            onChange={(e) => update(index, { value: e.target.value })}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-xl shrink-0"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            ✕
          </Button>
        </div>
      ))}
      <datalist id="catalog-meta-keys">
        {suggestedKeys.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 text-xs w-full border-dashed rounded-xl font-bold"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
      >
        + Add Metadata Field
      </Button>
    </div>
  );
}
