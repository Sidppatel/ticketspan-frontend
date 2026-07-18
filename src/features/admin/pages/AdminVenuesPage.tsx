import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listVenues,
  createVenue,
  updateVenue,
  listVenueImages,
  addVenueImage,
  removeVenueImage,
  setPrimaryVenueImage,
  formatTaxRate,
  type VenueDraft,
} from '@/features/admin/services/catalogService';
import { rpcErrorMessage } from '@/shared/session';
import { uploadImage, imageUrl } from '@/shared/upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/cn';
import { MapPin, Sparkles } from 'lucide-react';
import {
  US_STATES,
  isValidEmail,
  isValidState,
  isValidUsPhone,
  isValidZip,
  toPhoneE164,
  formatUsPhone,
} from '@/shared/lib/validation';
import type { Venue } from '@/shared/proto/catalog';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { searchVenueWithZip, fetchUserZipCode } from '@/shared/lib/location';

export function venueError(draft: VenueDraft): string | null {
  if (!draft.name.trim()) {
    return 'Name is required';
  }
  if (draft.email && !isValidEmail(draft.email)) {
    return 'Enter a valid email address';
  }
  if (draft.phone && !isValidUsPhone(draft.phone)) {
    return 'Enter a valid US phone (+1 and 10 digits)';
  }
  if (draft.state && !isValidState(draft.state)) {
    return 'Select a valid US state';
  }
  if (draft.zip && !isValidZip(draft.zip)) {
    return 'Zip must be 5 digits';
  }
  return null;
}

export function normalizeVenue(draft: VenueDraft): VenueDraft {
  return { ...draft, phone: draft.phone ? toPhoneE164(draft.phone) : '' };
}


export function venueLabel(venue: Venue): string {
  const address = [venue.line1, venue.city, [venue.state, venue.zip].filter(Boolean).join(' ')]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
  return address ? `${venue.name} (${address})` : venue.name;
}

export function emptyDraft(): VenueDraft {
  return {
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  };
}

function toDraft(venue: Venue): VenueDraft {
  return {
    name: venue.name,
    description: venue.description,
    phone: venue.phone,
    email: venue.email,
    website: venue.website,
    line1: venue.line1,
    line2: venue.line2,
    city: venue.city,
    state: venue.state,
    zip: venue.zip,
  };
}

export function withDisplayPhone(draft: VenueDraft): VenueDraft {
  return { ...draft, phone: formatUsPhone(draft.phone) };
}

export function AdminVenuesPage() {
  const loader = useCallback(() => listVenues(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [draft, setDraft] = useState<VenueDraft>(emptyDraft());
  const [notice, setNotice] = useState<string | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchDesc, setSearchDesc] = useState('');
  const [searchZip, setSearchZip] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function openSearchModal() {
    setIsSearchModalOpen(true);
    setSearchDesc('');
    setSearchError(null);
    setSearchZip('');
    const zip = await fetchUserZipCode();
    if (zip) {
      setSearchZip(zip);
    } else {
      setSearchZip('10001');
    }
  }

  async function handleSearchVenue() {
    if (!searchDesc.trim() || !searchZip.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchVenueWithZip(searchDesc, searchZip, true);
      if (res) {
        setDraft({
          ...emptyDraft(),
          name: res.name,
          line1: res.line1,
          city: res.city,
          state: res.state,
          zip: res.zip,
        });
        setIsSearchModalOpen(false);
      } else {
        setSearchError("Could not find a venue matching that description nearby.");
      }
    } catch {
      setSearchError("An error occurred while searching.");
    } finally {
      setIsSearching(false);
    }
  }

  async function add() {
    const err = venueError(draft);
    if (err) {
      setNotice(err);
      return;
    }
    setNotice(null);
    try {
      await createVenue(normalizeVenue(draft));
      setDraft(emptyDraft());
      reload();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight font-display text-foreground md:text-3xl">Venues</h1>
        <p className="text-xs text-muted-foreground">Manage locations for your events.</p>
      </div>

      <div className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-primary" /> Add Venue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {notice ? <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal animate-shake">{notice}</p> : null}
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <div className="ticketspan-spring-input">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-10 bg-background border-border text-sm" />
              </div>
            </div>
            
            <VenueFields draft={draft} onChange={setDraft} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 border-t border-border/20 pt-4">
            <Button type="button" variant="ghost" onClick={openSearchModal} className="h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Suggest One
            </Button>
            <Button onClick={add} disabled={!draft.name.trim()} className={cn("ticketspan-spring-btn h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20", !draft.name.trim() && "opacity-40 cursor-not-allowed")}>
              Add venue
            </Button>
          </div>
        </CardContent>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-8">
          <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading…</p>
        </div>
      ) : null}
      
      {error ? <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 leading-normal">{error}</p> : null}
      
      <div className="grid grid-cols-1 gap-4">
        {(data ?? []).map((venue) => (
          <VenueRow key={venue.venuesId} venue={venue} onChanged={reload} />
        ))}
      </div>

      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-bold font-display text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Venue Search
          </DialogTitle>
          <div className="space-y-4 py-4">
            {searchError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive animate-shake">
                {searchError}
              </div>
            ) : null}
            
            <div className="space-y-1.5">
              <Label>Description / Name</Label>
              <Input
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
                placeholder="e.g. Downtown Library"
                className="h-10 bg-background border-border text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Zip Code</Label>
              <Input
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
                placeholder="e.g. 10001"
                className="h-10 bg-background border-border text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Used as the center point for the search.</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
              <Button type="button" variant="ghost" onClick={() => setIsSearchModalOpen(false)} disabled={isSearching} className="h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleSearchVenue} disabled={isSearching || !searchDesc.trim() || !searchZip.trim()} className="ticketspan-spring-btn h-10 px-6 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-primary/20">
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VenueFields({ draft, onChange }: { draft: VenueDraft; onChange: (d: VenueDraft) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 pt-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[10px]">Line 1</Label>
        <Input value={draft.line1} onChange={(e) => onChange({ ...draft, line1: e.target.value })} className="h-9 bg-background text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Line 2</Label>
        <Input value={draft.line2} onChange={(e) => onChange({ ...draft, line2: e.target.value })} className="h-9 bg-background text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">City</Label>
        <Input value={draft.city} onChange={(e) => onChange({ ...draft, city: e.target.value })} className="h-9 bg-background text-xs" />
      </div>
      <div className="flex gap-3">
        <div className="space-y-1.5 flex-1">
          <Label className="text-[10px]">State</Label>
          <Select className="h-9 w-full text-xs" value={draft.state} onChange={(e) => onChange({ ...draft, state: e.target.value })}>
            <option value="">Select State</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} - {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 w-24">
          <Label className="text-[10px]">Zip</Label>
          <Input className="h-9 bg-background text-xs" value={draft.zip} onChange={(e) => onChange({ ...draft, zip: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px]">Phone (US)</Label>
        <Input
          placeholder="+1 (555) 123-4567"
          value={draft.phone}
          onChange={(e) => onChange({ ...draft, phone: formatUsPhone(e.target.value) })}
          className="h-9 bg-background text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px]">Email</Label>
        <Input
          type="email"
          value={draft.email}
          onChange={(e) => onChange({ ...draft, email: e.target.value })}
          className="h-9 bg-background text-xs"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-[10px]">Website</Label>
        <Input value={draft.website} onChange={(e) => onChange({ ...draft, website: e.target.value })} className="h-9 bg-background text-xs" />
      </div>
    </div>
  );
}

function VenueRow({ venue, onChanged }: { venue: Venue; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VenueDraft>(withDisplayPhone(toDraft(venue)));
  const [notice, setNotice] = useState<string | null>(null);

  async function persist(isActive: boolean) {
    const err = venueError(draft);
    if (err) {
      setNotice(err);
      return;
    }
    setNotice(null);
    try {
      await updateVenue(venue.venuesId, normalizeVenue(draft), isActive);
      setEditing(false);
      onChanged();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-300 overflow-hidden flex flex-col h-fit",
        venue.isActive 
          ? "border-border shadow-sm" 
          : "border-border-soft opacity-60 bg-muted/30 shadow-none scale-[0.99] translate-y-1"
      )}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-sm text-foreground font-display block">{venue.name}</span>
            {venue.city || venue.state ? (
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[venue.city, venue.state].filter(Boolean).join(', ')}
              </span>
            ) : null}
            {venue.combinedTaxRate > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Tax Rate: {formatTaxRate(venue.combinedTaxRate)}%
                </span>
                <span className="text-[10px] text-muted-foreground/80">
                  (State: {formatTaxRate(venue.stateTaxRate)}% |
                  County: {formatTaxRate(venue.countyTaxRate)}% |
                  City: {formatTaxRate(venue.cityTaxRate)}% |
                  Local: {formatTaxRate(venue.localTaxRate)}%)
                </span>
              </div>
            ) : (
              <div className="mt-1">
                <span className="inline-flex items-center rounded bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  {venue.zip ? 'Tax Rate: 0.000%' : 'No tax rate — add a zip code'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={venue.isActive} onCheckedChange={(v) => persist(v)} label="Enabled" />
            <Button size="sm" variant="ghost" onClick={() => setEditing((v) => !v)} className="h-8 text-xs font-semibold hover:bg-muted/40">
              {editing ? 'Close' : 'Edit'}
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
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-9 bg-background text-xs" />
            </div>
            
            <VenueFields draft={draft} onChange={setDraft} />
            
            <div className="flex items-center justify-end border-t border-border/10 pt-3">
              <Button size="sm" onClick={() => persist(venue.isActive)} className="ticketspan-spring-btn h-9 px-6 rounded-lg font-bold text-xs">
                Save Settings
              </Button>
            </div>
            
            <VenueGallery venuesId={venue.venuesId} />
          </div>
        </div>
      </CardContent>
    </div>
  );
}

function VenueGallery({ venuesId }: { venuesId: string }) {
  const loader = useCallback(() => listVenueImages(venuesId), [venuesId]);
  const { data, reload } = useAsync(loader);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await uploadImage(file, 'venue', venuesId);
      await addVenueImage(venuesId, result.imagesId);
      reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function guard(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-2 border-t border-border/10 pt-4">
      <Label className="text-[10px]">Images</Label>
      <Input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} className="text-xs h-9" />
      {error ? <p className="text-[10px] text-destructive bg-destructive/10 p-1.5 rounded">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        {(data ?? []).map((image) => (
          <div key={image.imagesId} className="w-28 space-y-1.5 p-2 border border-border rounded-lg bg-card shadow-sm">
            <img src={imageUrl(image.imagesId)} alt="" className="h-20 w-full rounded object-cover" />
            <div className="flex items-center justify-between text-[10px] font-bold">
              {image.isPrimary ? (
                <span className="text-primary">Primary</span>
              ) : (
                <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => guard(() => setPrimaryVenueImage(venuesId, image.imagesId))}>
                  Set primary
                </button>
              )}
              <button className="text-destructive/80 hover:text-destructive transition-colors" onClick={() => guard(() => removeVenueImage(venuesId, image.imagesId))}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
