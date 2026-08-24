import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { imageUrl } from '@/shared/upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { UnifiedImageUploader } from '@/shared/components/upload/UnifiedImageUploader';
import { cn } from '@/shared/lib/cn';
import { Plus, Search, Sparkles, Building2, Globe, Trash2, X } from 'lucide-react';
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
    <div className="space-y-8 max-w-6xl mx-auto py-2 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {props.title}
            </h1>
            <Badge variant="voltage" className="font-mono text-xs">
              {items.length} total ({activeCount} active)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage {props.title.toLowerCase()} artwork, branding tiers, web links, and catalog visibility.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding((v) => !v)}
          className="gap-1.5 self-start sm:self-auto text-xs font-semibold"
        >
          {isAdding ? <X className="size-4" /> : <Plus className="size-4" />}
          {isAdding ? 'Close Builder' : `Add ${props.title.slice(0, -1)}`}
        </Button>
      </div>

      {isAdding && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-200">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> New {props.title.slice(0, -1)} Registration
            </CardTitle>
            <CardDescription>
              Add a new catalog entity with artwork and metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {notice && (
              <Alert variant="destructive">
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="catalog-entity-name" className="text-xs">Name</Label>
                  <Input
                    id="catalog-entity-name"
                    placeholder="e.g. Headliner or Sponsor Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <MetaEditor rows={meta} onChange={setMeta} suggestedKeys={props.suggestedKeys} />
              </div>

              <div className="md:col-span-5 md:border-l md:border-border/40 md:pl-6">
                <UnifiedImageUploader
                  entityType={props.entityType}
                  imagesId={imagesId}
                  onChange={setImagesId}
                  aspectRatio={props.aspectRatio ?? '1:1'}
                  label="Official Logo / Artwork"
                  hint="PNG or SVG recommended"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={add}
                disabled={!name.trim()}
                className="text-xs font-semibold"
              >
                Save {props.title.slice(0, -1)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search ${props.title.toLowerCase()} by name or slug…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-6 text-muted-foreground" />}
          title={`No ${props.title} Found`}
          description={
            items.length === 0
              ? `Your ${props.title.toLowerCase()} directory is currently empty.`
              : `No ${props.title.toLowerCase()} match your search query.`
          }
          action={
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
              <Plus className="size-4" /> Add First {props.title.slice(0, -1)}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    <Card className={cn('transition-all', !item.isActive && 'opacity-60 bg-muted/20')}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {item.primaryImagePath ? (
              <img
                src={imageUrl(item.primaryImagePath)}
                alt={item.name}
                className="size-12 rounded-xl object-cover shadow-xs border border-border shrink-0 bg-background"
              />
            ) : (
              <div className="size-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase shrink-0">
                Logo
              </div>
            )}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-foreground truncate">{item.name}</h3>
                {tier && (
                  <Badge variant="voltage" className="text-[9px] px-1.5 py-0">
                    {tier}
                  </Badge>
                )}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground block truncate">/{item.slug}</span>
              {websiteUrl && (
                <a
                  href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
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
              className="h-8 px-2.5 text-xs font-semibold"
            >
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>
        </div>

        {notice && (
          <Alert variant="destructive">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {editing && (
          <div className="space-y-4 pt-4 border-t border-border/40 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
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

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => guard(onRemove)}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
              <Button
                size="sm"
                onClick={() => persist(item.isActive)}
                className="h-8 px-4 text-xs font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
    <div className="space-y-2">
      <Label className="text-xs">Metadata &amp; Social Links</Label>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            className="w-32 h-8 text-xs font-mono"
            placeholder="key (e.g. tier)"
            list="catalog-meta-keys"
            value={row.key}
            onChange={(e) => update(index, { key: e.target.value })}
          />
          <Input
            className="flex-1 h-8 text-xs"
            placeholder="value"
            value={row.value}
            onChange={(e) => update(index, { value: e.target.value })}
          />
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground hover:text-destructive shrink-0"
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
        className="h-8 text-xs w-full border-dashed"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
      >
        + Add Metadata Field
      </Button>
    </div>
  );
}
