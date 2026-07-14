import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { uploadImage, imageUrl } from '@/shared/upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { Upload } from 'lucide-react';
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
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">{props.title}</h1>
        <p className="text-xs text-muted-foreground">Manage {props.title.toLowerCase()} for the catalog.</p>
      </div>

      <div className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            Add {props.title.toLowerCase().replace(/s$/, '')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {notice ? <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">{notice}</p> : null}
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <div className="entryvine-spring-input">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-background border-border text-sm" />
              </div>
            </div>
            
            <ImageField entityType={props.entityType} imagesId={imagesId} onChange={setImagesId} />
            <MetaEditor rows={meta} onChange={setMeta} suggestedKeys={props.suggestedKeys} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 border-t border-border/20 pt-4">
            <Button onClick={add} disabled={!name.trim()} className={cn("entryvine-spring-btn h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20", !name.trim() && "opacity-40 cursor-not-allowed")}>
              Add {props.title.toLowerCase().replace(/s$/, '')}
            </Button>
          </div>
        </CardContent>
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((item) => (
          <EntityRow
            key={props.idOf(item)}
            item={item}
            entityType={props.entityType}
            suggestedKeys={props.suggestedKeys}
            onSave={(draft) => props.update(props.idOf(item), draft)}
            onRemove={() => props.remove(props.idOf(item))}
            onChanged={reload}
          />
        ))}
      </div>
    </div>
  );
}

function EntityRow<T extends CatalogEntity>({
  item,
  entityType,
  suggestedKeys,
  onSave,
  onRemove,
  onChanged,
}: {
  item: T;
  entityType: string;
  suggestedKeys: string[];
  onSave: (draft: NamedDraft) => Promise<void>;
  onRemove: () => Promise<void>;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(item.name);
  const [imagesId, setImagesId] = useState(item.primaryImagePath);
  const [meta, setMeta] = useState<MetaRow[]>(parseMeta(item.metaJson));

  async function persist(isActive: boolean) {
    setNotice(null);
    try {
      await onSave({ name, slug: item.slug, imagePath: imagesId, metaJson: serializeMeta(meta), isActive });
      setEditing(false);
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300 overflow-hidden flex flex-col h-fit",
        item.isActive 
          ? "border-border shadow-sm" 
          : "border-border-soft opacity-60 bg-muted/30 shadow-none scale-[0.99] translate-y-1"
      )}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {item.primaryImagePath ? (
              <img src={imageUrl(item.primaryImagePath)} alt="" className="h-10 w-10 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold uppercase">No Img</div>
            )}
            <div>
              <span className="font-bold text-sm text-foreground font-display block">{item.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={item.isActive} onCheckedChange={(v) => persist(v)} label="Enabled" />
            <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)} className="h-8 text-xs font-semibold hover:bg-muted/40">
              {editing ? 'Close' : 'Edit'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => guard(onRemove)} className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10">
              Remove
            </Button>
          </div>
        </div>
        
        {notice ? <p className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 leading-normal animate-shake">{notice}</p> : null}
        
        <div className={cn(
          "grid transition-all duration-300 ease-in-out overflow-hidden border-t border-border/20 pt-1.5",
          editing ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden space-y-4 pt-2.5">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 bg-background text-xs" />
            </div>
            
            <ImageField entityType={entityType} imagesId={imagesId} onChange={setImagesId} />
            <MetaEditor rows={meta} onChange={setMeta} suggestedKeys={suggestedKeys} />
            
            <div className="flex items-center justify-end border-t border-border/10 pt-3">
              <Button size="sm" onClick={() => persist(item.isActive)} className="entryvine-spring-btn h-9 px-6 rounded-lg font-bold text-xs">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

function ImageField({
  entityType,
  imagesId,
  onChange,
}: {
  entityType: string;
  imagesId: string;
  onChange: (imagesId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await uploadImage(file, entityType, '');
      onChange(result.imagesId);
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px]">Image</Label>
      <div className="flex items-center gap-3">
        {imagesId ? (
          <img src={imageUrl(imagesId)} alt="" className="h-14 w-14 rounded-lg object-cover shadow-sm" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground border border-border">
            <Upload className="h-4 w-4 mb-1" />
            <span className="text-[8px] font-bold uppercase">Upload</span>
          </div>
        )}
        <Input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="text-xs h-9" />
      </div>
      {error ? <p className="text-[10px] text-destructive bg-destructive/10 p-1.5 rounded">{error}</p> : null}
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
      <Label className="text-[10px]">Metadata, links &amp; social</Label>
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            className="w-32 h-9 text-xs bg-background"
            placeholder="key"
            list="catalog-meta-keys"
            value={row.key}
            onChange={(e) => update(index, { key: e.target.value })}
          />
          <Input 
            className="flex-1 h-9 text-xs bg-background"
            placeholder="value" 
            value={row.value} 
            onChange={(e) => update(index, { value: e.target.value })} 
          />
          <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            ✕
          </Button>
        </div>
      ))}
      <datalist id="catalog-meta-keys">
        {suggestedKeys.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      <Button size="sm" variant="outline" className="h-8 text-xs w-full border-dashed" onClick={() => onChange([...rows, { key: '', value: '' }])}>
        + Add field
      </Button>
    </div>
  );
}
