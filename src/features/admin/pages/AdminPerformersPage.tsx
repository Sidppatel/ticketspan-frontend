import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { imageUrl } from '@/shared/upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { UnifiedImageUploader } from '@/shared/components/upload/UnifiedImageUploader';
import {
  listPerformers,
  createPerformer,
  updatePerformer,
  deletePerformer,
  type NamedDraft,
} from '@/features/admin/services/catalogService';
import type { Performer } from '@/shared/proto/catalog';
import {
  Plus,
  Search,
  Sparkles,
  Music2,
  ExternalLink,
  Trash2,
  X,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

interface MetaRow {
  key: string;
  value: string;
}

function parseMeta(metaJson: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const parsed = JSON.parse(metaJson || '[]');
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item?.key) {
          result[String(item.key).toLowerCase()] = String(item.value ?? '');
        }
      }
    }
  } catch {
    return result;
  }
  return result;
}

function serializeStructuredMeta(fields: Record<string, string>): string {
  const rows: MetaRow[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value && value.trim()) {
      rows.push({ key, value: value.trim() });
    }
  }
  return JSON.stringify(
    rows.map((r, i) => ({
      key: r.key,
      value: r.value,
      isPublic: true,
      sortOrder: i,
    })),
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ROLE_OPTIONS = [
  'Headliner',
  'Co-Headliner',
  'Support',
  'Guest Artist',
  'Opening Act',
  'DJ / Producer',
  'Keynote Speaker',
  'Panelist',
];

const GENRE_SUGGESTIONS = [
  'Southern Rock',
  'Neo-Soul',
  'Delta Americana',
  'Synthwave',
  'Electronic & House',
  'Blues Rock',
  'Indie Folk',
  'Pop',
  'Keynote / Technology',
];

export function AdminPerformersPage() {
  const loader = useCallback(() => listPerformers(), []);
  const { data, loading, error, reload } = useAsync(loader);

  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imagesId, setImagesId] = useState('');
  const [role, setRole] = useState('Headliner');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [spotify, setSpotify] = useState('');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [bookingLink, setBookingLink] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setImagesId('');
    setRole('Headliner');
    setGenre('');
    setDescription('');
    setWebsite('');
    setSpotify('');
    setYoutube('');
    setInstagram('');
    setTwitter('');
    setBookingLink('');
    setIsAdding(false);
    setNotice(null);
  };

  async function addPerformer() {
    setNotice(null);
    if (!name.trim()) {
      setNotice('Performer name is required.');
      return;
    }

    try {
      const metaJson = serializeStructuredMeta({
        role,
        genre,
        description,
        notes: description,
        website,
        spotify,
        youtube,
        instagram,
        twitter,
        booking_link: bookingLink,
      });

      await createPerformer({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        imagePath: imagesId,
        metaJson,
        isActive: true,
      });

      toast.success(`${name} registered in artist lineup`);
      resetForm();
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const items = data ?? [];
  const filteredItems = items.filter((item) => {
    const meta = parseMeta(item.metaJson);
    const itemRole = meta.role || 'Featured';
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meta.genre && meta.genre.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === 'All' || itemRole.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Performer &amp; Talent Directory
            </h1>
            <Badge variant="voltage" className="font-mono text-xs">
              {items.length} total ({activeCount} active)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage stage talent, headline billing tiers, artist biographies, streaming links, and public profiles.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding((v) => !v)}
          className="gap-1.5 self-start sm:self-auto text-xs font-semibold rounded-full"
        >
          {isAdding ? <X className="size-4" /> : <Plus className="size-4" />}
          {isAdding ? 'Close Studio' : 'Register New Artist'}
        </Button>
      </div>

      {isAdding && (
        <Card className="rounded-[2rem] border border-border/80 bg-card/90 shadow-[var(--shadow-e3)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" /> Artist Registration &amp; Lineup Studio
            </CardTitle>
            <CardDescription className="text-xs">
              Configure artist bio, portrait artwork, musical genre, and digital streaming presence.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {notice && (
              <Alert variant="destructive">
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="perf-name" className="text-xs font-semibold">Artist / Band Name</Label>
                    <Input
                      id="perf-name"
                      placeholder="e.g. Saltmarsh Revival"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="perf-slug" className="text-xs font-semibold">Public Slug</Label>
                    <Input
                      id="perf-slug"
                      placeholder="e.g. demo-mobile-saltmarsh-revival"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="perf-role" className="text-xs font-semibold">Billing Role</Label>
                    <select
                      id="perf-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="perf-genre" className="text-xs font-semibold">Genre / Discipline</Label>
                    <Input
                      id="perf-genre"
                      placeholder="e.g. Southern Rock & Delta Americana"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      list="genre-list"
                      className="h-9 text-xs"
                    />
                    <datalist id="genre-list">
                      {GENRE_SUGGESTIONS.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="perf-desc" className="text-xs font-semibold">Artist Biography &amp; Statement</Label>
                  <Textarea
                    id="perf-desc"
                    placeholder="Provide a compelling description of the performer's background, accomplishments, and stage presentation."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="text-xs leading-relaxed resize-none"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Radio className="size-3.5 text-primary" /> Streaming &amp; Web Presence
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Website (https://...)"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Spotify URL"
                      value={spotify}
                      onChange={(e) => setSpotify(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="YouTube Channel / Music URL"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Instagram (@handle or URL)"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="X (Twitter) handle"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Booking Email / Agent"
                      value={bookingLink}
                      onChange={(e) => setBookingLink(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-border/40 lg:pl-8">
                <UnifiedImageUploader
                  entityType="performer"
                  imagesId={imagesId}
                  onChange={setImagesId}
                  aspectRatio="1:1"
                  label="Official Artist Portrait / Photo"
                  hint="High-resolution square artwork recommended"
                />

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Live Public Card Preview
                  </Label>
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="size-14 rounded-2xl border border-border/80 bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {imagesId ? (
                          <img
                            src={imageUrl(imagesId)}
                            alt="preview"
                            className="size-full object-cover"
                          />
                        ) : (
                          <Music2 className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-sm text-foreground truncate">
                            {name || 'Artist Name'}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.2 font-mono text-[9px] font-semibold text-primary">
                            {role}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground block truncate">
                          {genre || 'Genre not set'}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80 block truncate">
                          /{slug || 'artist-slug'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="text-xs font-semibold rounded-full"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addPerformer}
                disabled={!name.trim()}
                className="text-xs font-semibold rounded-full px-5"
              >
                Save Performer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search artists by name, slug, or genre…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
          {['All', 'Headliner', 'Support', 'Opener'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition-all shrink-0 ${
                roleFilter === r
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-[1.75rem]" />
          <Skeleton className="h-44 rounded-[1.75rem]" />
          <Skeleton className="h-44 rounded-[1.75rem]" />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Music2 className="size-8 text-muted-foreground" />}
          title="No Performers Found"
          description={
            items.length === 0
              ? 'Your artist directory is currently empty. Register your first headliner or act.'
              : 'No performers match your search query or role filter.'
          }
          action={
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 rounded-full">
              <Plus className="size-4" /> Register First Performer
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((performer) => (
            <PerformerAdminCard
              key={performer.performersId}
              performer={performer}
              onSave={(draft) => updatePerformer(performer.performersId, draft)}
              onRemove={() => deletePerformer(performer.performersId)}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PerformerAdminCard({
  performer,
  onSave,
  onRemove,
  onChanged,
}: {
  performer: Performer;
  onSave: (draft: NamedDraft) => Promise<void>;
  onRemove: () => Promise<void>;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const initialMeta = parseMeta(performer.metaJson);

  const [name, setName] = useState(performer.name);
  const [imagesId, setImagesId] = useState(performer.primaryImagePath);
  const [role, setRole] = useState(initialMeta.role || 'Headliner');
  const [genre, setGenre] = useState(initialMeta.genre || '');
  const [description, setDescription] = useState(initialMeta.description || initialMeta.notes || '');
  const [website, setWebsite] = useState(initialMeta.website || '');
  const [spotify, setSpotify] = useState(initialMeta.spotify || '');
  const [youtube, setYoutube] = useState(initialMeta.youtube || '');
  const [instagram, setInstagram] = useState(initialMeta.instagram || '');
  const [twitter, setTwitter] = useState(initialMeta.twitter || '');
  const [bookingLink, setBookingLink] = useState(initialMeta.booking_link || '');

  async function persist(isActive: boolean) {
    setNotice(null);
    try {
      const metaJson = serializeStructuredMeta({
        role,
        genre,
        description,
        notes: description,
        website,
        spotify,
        youtube,
        instagram,
        twitter,
        booking_link: bookingLink,
      });

      await onSave({
        name: name.trim(),
        slug: performer.slug,
        imagePath: imagesId,
        metaJson,
        isActive,
      });
      setEditing(false);
      toast.success(`${name} updated`);
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  async function remove() {
    setNotice(null);
    try {
      await onRemove();
      toast.success('Performer removed');
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const roleBadge = initialMeta.role || 'Performer';
  const avatar = performer.primaryImagePath ? imageUrl(performer.primaryImagePath) : null;
  const publicHref = `/performers/${performer.slug}`;

  return (
    <Card className={`rounded-[1.75rem] border border-border/80 transition-all ${!performer.isActive ? 'opacity-60 bg-muted/20' : 'bg-card'}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 rounded-2xl border border-border/80 bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {avatar ? (
                <img
                  src={avatar}
                  alt={performer.name}
                  className="size-full object-cover"
                />
              ) : (
                <Music2 className="size-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-foreground truncate">
                  {performer.name}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0">
                  {roleBadge}
                </Badge>
                {initialMeta.genre && (
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    {initialMeta.genre}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={performer.isActive} onCheckedChange={(v) => persist(v)} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing((v) => !v)}
              className="h-7 px-2.5 text-xs font-semibold rounded-full"
            >
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px]">
          <span className="font-mono text-muted-foreground truncate">
            /{performer.slug}
          </span>
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Public Profile <ExternalLink className="size-3" />
          </a>
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
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Genre</Label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <UnifiedImageUploader
              entityType="performer"
              imagesId={imagesId}
              onChange={setImagesId}
              aspectRatio="1:1"
              label="Update Portrait Photo"
            />

            <div className="space-y-1">
              <Label className="text-xs">Artist Bio</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs leading-relaxed resize-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <Label className="text-xs">Streaming &amp; Social Channels</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="Spotify"
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="YouTube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="Instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="X (Twitter)"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="Booking Link"
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={remove}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 rounded-full"
              >
                <Trash2 className="size-3.5 mr-1" /> Remove
              </Button>
              <Button
                size="sm"
                onClick={() => persist(performer.isActive)}
                className="h-8 px-4 text-xs font-semibold rounded-full"
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
