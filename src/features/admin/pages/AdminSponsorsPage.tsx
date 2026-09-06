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
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  type NamedDraft,
} from '@/features/admin/services/catalogService';
import type { Sponsor } from '@/shared/proto/catalog';
import {
  Plus,
  Search,
  Sparkles,
  Building2,
  ExternalLink,
  Trash2,
  X,
  Globe,
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

const TIER_OPTIONS = [
  'Platinum',
  'Gold',
  'Silver',
  'Bronze',
  'Title Partner',
  'Founding Partner',
  'Media Partner',
  'Community Supporter',
];

const CATEGORY_SUGGESTIONS = [
  'Clean Energy & Infrastructure',
  'Commercial & Private Banking',
  'Technology & Cloud Solutions',
  'Digital Broadcasting & Media',
  'Hospitality & Culinary',
  'Health & Wellness',
  'Telecommunications',
];

export function AdminSponsorsPage() {
  const loader = useCallback(() => listSponsors(), []);
  const { data, loading, error, reload } = useAsync(loader);

  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imagesId, setImagesId] = useState('');
  const [tier, setTier] = useState('Platinum');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [boothLocation, setBoothLocation] = useState('');

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
    setTier('Platinum');
    setCategory('');
    setDescription('');
    setWebsite('');
    setLinkedin('');
    setTwitter('');
    setContactName('');
    setContactEmail('');
    setBoothLocation('');
    setIsAdding(false);
    setNotice(null);
  };

  async function addSponsor() {
    setNotice(null);
    if (!name.trim()) {
      setNotice('Sponsor name is required.');
      return;
    }

    try {
      const metaJson = serializeStructuredMeta({
        tier,
        category,
        description,
        notes: description,
        website,
        linkedin,
        twitter,
        contact_name: contactName,
        contact_email: contactEmail,
        booth_location: boothLocation,
      });

      await createSponsor({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        imagePath: imagesId,
        metaJson,
        isActive: true,
      });

      toast.success(`${name} registered as sponsor partner`);
      resetForm();
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const items = data ?? [];
  const filteredItems = items.filter((item) => {
    const meta = parseMeta(item.metaJson);
    const itemTier = meta.tier || 'Partner';
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meta.category && meta.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier =
      tierFilter === 'All' || itemTier.toLowerCase() === tierFilter.toLowerCase();

    return matchesSearch && matchesTier;
  });

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sponsor &amp; Corporate Partner Directory
            </h1>
            <Badge variant="voltage" className="font-mono text-xs">
              {items.length} total ({activeCount} active)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage corporate brands, sponsorship tiers, exhibit locations, logos, and public partner profiles.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding((v) => !v)}
          className="gap-1.5 self-start sm:self-auto text-xs font-semibold rounded-full"
        >
          {isAdding ? <X className="size-4" /> : <Plus className="size-4" />}
          {isAdding ? 'Close Studio' : 'Register New Partner'}
        </Button>
      </div>

      {isAdding && (
        <Card className="rounded-[2rem] border border-border/80 bg-card/90 shadow-[var(--shadow-e3)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" /> Sponsor Registration &amp; Brand Studio
            </CardTitle>
            <CardDescription className="text-xs">
              Configure partnership tier, brand artwork, company overview, exhibit location, and representative contacts.
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
                    <Label htmlFor="spon-name" className="text-xs font-semibold">Corporate Brand Name</Label>
                    <Input
                      id="spon-name"
                      placeholder="e.g. Gulf Power"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="spon-slug" className="text-xs font-semibold">Public Slug</Label>
                    <Input
                      id="spon-slug"
                      placeholder="e.g. demo-mobile-gulf-power"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="spon-tier" className="text-xs font-semibold">Partnership Tier</Label>
                    <select
                      id="spon-tier"
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="spon-cat" className="text-xs font-semibold">Industry / Category</Label>
                    <Input
                      id="spon-cat"
                      placeholder="e.g. Clean Energy & Infrastructure"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      list="cat-list"
                      className="h-9 text-xs"
                    />
                    <datalist id="cat-list">
                      {CATEGORY_SUGGESTIONS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="spon-desc" className="text-xs font-semibold">Company Overview &amp; Scope</Label>
                  <Textarea
                    id="spon-desc"
                    placeholder="Describe the partner's organization, civic commitment, or specific event activations."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="text-xs leading-relaxed resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="spon-booth" className="text-xs font-semibold">Exhibit / Booth Location</Label>
                    <Input
                      id="spon-booth"
                      placeholder="e.g. Main Hall - Pavilion A1"
                      value={boothLocation}
                      onChange={(e) => setBoothLocation(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="spon-contact-name" className="text-xs font-semibold">Representative Name</Label>
                    <Input
                      id="spon-contact-name"
                      placeholder="e.g. Sarah Jenkins"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Globe className="size-3.5 text-primary" /> Corporate Web &amp; Contact Links
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Official Website (https://...)"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="LinkedIn Company URL"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="X (Twitter) handle or URL"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Partnership Contact Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-border/40 lg:pl-8">
                <UnifiedImageUploader
                  entityType="sponsor"
                  imagesId={imagesId}
                  onChange={setImagesId}
                  aspectRatio="1:1"
                  label="Official Brand Logo"
                  hint="High-contrast transparent PNG or SVG recommended"
                />

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Live Partner Card Preview
                  </Label>
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="size-14 rounded-2xl border border-border/80 bg-background p-2 shrink-0 flex items-center justify-center">
                        {imagesId ? (
                          <img
                            src={imageUrl(imagesId)}
                            alt="preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Building2 className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-sm text-foreground truncate">
                            {name || 'Corporate Partner'}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.2 font-mono text-[9px] font-semibold text-primary">
                            {tier}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground block truncate">
                          {category || 'Industry Category'}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80 block truncate">
                          /{slug || 'sponsor-slug'}
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
                onClick={addSponsor}
                disabled={!name.trim()}
                className="text-xs font-semibold rounded-full px-5"
              >
                Save Sponsor Partner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners by name, slug, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
          {['All', 'Platinum', 'Gold', 'Silver'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition-all shrink-0 ${
                tierFilter === t
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
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
          icon={<Building2 className="size-8 text-muted-foreground" />}
          title="No Sponsors Found"
          description={
            items.length === 0
              ? 'Your sponsor directory is currently empty. Register your first partner organization.'
              : 'No sponsors match your search query or tier filter.'
          }
          action={
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 rounded-full">
              <Plus className="size-4" /> Register First Sponsor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((sponsor) => (
            <SponsorAdminCard
              key={sponsor.sponsorsId}
              sponsor={sponsor}
              onSave={(draft) => updateSponsor(sponsor.sponsorsId, draft)}
              onRemove={() => deleteSponsor(sponsor.sponsorsId)}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SponsorAdminCard({
  sponsor,
  onSave,
  onRemove,
  onChanged,
}: {
  sponsor: Sponsor;
  onSave: (draft: NamedDraft) => Promise<void>;
  onRemove: () => Promise<void>;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const initialMeta = parseMeta(sponsor.metaJson);

  const [name, setName] = useState(sponsor.name);
  const [imagesId, setImagesId] = useState(sponsor.primaryImagePath);
  const [tier, setTier] = useState(initialMeta.tier || 'Platinum');
  const [category, setCategory] = useState(initialMeta.category || '');
  const [description, setDescription] = useState(initialMeta.description || initialMeta.notes || '');
  const [website, setWebsite] = useState(initialMeta.website || '');
  const [linkedin, setLinkedin] = useState(initialMeta.linkedin || '');
  const [twitter, setTwitter] = useState(initialMeta.twitter || '');
  const [contactName, setContactName] = useState(initialMeta.contact_name || '');
  const [contactEmail, setContactEmail] = useState(initialMeta.contact_email || '');
  const [boothLocation, setBoothLocation] = useState(initialMeta.booth_location || '');

  async function persist(isActive: boolean) {
    setNotice(null);
    try {
      const metaJson = serializeStructuredMeta({
        tier,
        category,
        description,
        notes: description,
        website,
        linkedin,
        twitter,
        contact_name: contactName,
        contact_email: contactEmail,
        booth_location: boothLocation,
      });

      await onSave({
        name: name.trim(),
        slug: sponsor.slug,
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
      toast.success('Sponsor removed');
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const tierBadge = initialMeta.tier || 'Partner';
  const logo = sponsor.primaryImagePath ? imageUrl(sponsor.primaryImagePath) : null;
  const publicHref = `/sponsors/${sponsor.slug}`;

  return (
    <Card className={`rounded-[1.75rem] border border-border/80 transition-all ${!sponsor.isActive ? 'opacity-60 bg-muted/20' : 'bg-card'}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 rounded-2xl border border-border/80 bg-background p-2 shrink-0 flex items-center justify-center">
              {logo ? (
                <img
                  src={logo}
                  alt={sponsor.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Building2 className="size-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-foreground truncate">
                  {sponsor.name}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="voltage" className="font-mono text-[9px] px-1.5 py-0">
                  {tierBadge}
                </Badge>
                {initialMeta.category && (
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    {initialMeta.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={sponsor.isActive} onCheckedChange={(v) => persist(v)} />
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
            /{sponsor.slug}
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
              <Label className="text-xs">Corporate Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tier</Label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <UnifiedImageUploader
              entityType="sponsor"
              imagesId={imagesId}
              onChange={setImagesId}
              aspectRatio="1:1"
              label="Update Brand Logo"
            />

            <div className="space-y-1">
              <Label className="text-xs">Corporate Overview</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Exhibit Booth</Label>
                <Input
                  placeholder="e.g. Pavilion A1"
                  value={boothLocation}
                  onChange={(e) => setBoothLocation(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contact Name</Label>
                <Input
                  placeholder="Rep Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-7 text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label className="text-xs">Digital &amp; Contact Links</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="LinkedIn"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="Twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="h-7 text-[11px]"
                />
                <Input
                  placeholder="Contact Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
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
                onClick={() => persist(sponsor.isActive)}
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
