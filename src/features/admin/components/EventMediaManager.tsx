import { useCallback, useRef, useState } from 'react';
import { Image as ImageIcon, Star, Trash2, Upload, Sparkles, Check, Ratio, Layers, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ImageCropDialog } from '@/shared/components/ImageCropDialog';
import { useAsync } from '@/shared/hooks/useAsync';
import { uploadImage, imageUrl } from '@/shared/upload';
import { rpcErrorMessage } from '@/shared/session';
import { parseAspect, aspectCss } from '@/shared/lib/imageCrop';
import {
  listEventImages,
  addEventImage,
  removeEventImage,
  setPrimaryEventImage,
  getMediaSettings,
  updateEvent,
} from '@/features/admin/services/eventAdminService';
import type { Event, EventImage } from '@/shared/proto/event';

const MAX_PER_TYPE = 8;
const EVENT_IMAGE = 'event_image';
const EVENT_THUMBNAIL = 'event_thumbnail';

interface PendingCrop {
  file: File;
  type: string;
}

export function EventMediaManager({
  eventsId: propEventsId,
  event,
  onSaved,
}: {
  eventsId?: string;
  event?: Event;
  onSaved?: () => void;
}) {
  const targetId = event?.eventsId ?? propEventsId ?? '';
  const imagesLoader = useCallback(
    () =>
      Promise.all([
        listEventImages(targetId, EVENT_IMAGE),
        listEventImages(targetId, EVENT_THUMBNAIL),
      ]),
    [targetId],
  );
  const { data, reload } = useAsync(imagesLoader);
  const settingsLoader = useCallback(() => getMediaSettings(), []);
  const settings = useAsync(settingsLoader);
  const [images, thumbnails] = data ?? [[], []];
  const eventAspect = settings.data?.eventImageAspectRatio || '16:9';
  const thumbAspect = settings.data?.eventThumbnailAspectRatio || '4:3';
  const [pending, setPending] = useState<PendingCrop | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [heroBackdropImageId, setHeroBackdropImageId] = useState(event?.heroBackdropImageId ?? '');
  const [posterImageId, setPosterImageId] = useState(event?.posterImageId ?? '');
  const [savingMedia, setSavingMedia] = useState(false);

  async function handleCropped(file: File) {
    const type = pending?.type ?? EVENT_IMAGE;
    setPending(null);
    setError(null);
    try {
      const uploaded = await uploadImage(file, 'event', targetId);
      await addEventImage(targetId, uploaded.imagesId, type);

      const isFirstHero = !heroBackdropImageId;
      const isFirstPoster = !posterImageId;
      const nextHero = isFirstHero ? uploaded.imagesId : heroBackdropImageId;
      const nextPoster = isFirstPoster ? uploaded.imagesId : posterImageId;

      if ((isFirstHero || isFirstPoster) && event) {
        setHeroBackdropImageId(nextHero);
        setPosterImageId(nextPoster);
        await updateEvent(event.eventsId, {
          title: event.title,
          slug: event.slug,
          description: event.description,
          status: event.status,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          layoutMode: event.layoutMode,
          eventType: event.eventType,
          venuesId: event.venuesId,
          imagePath: event.imagePath,
          extraInfoJson: event.extraInfoJson,
          shortDescription: event.shortDescription,
          storyDescription: event.storyDescription,
          urgencyBadgeText: event.urgencyBadgeText,
          isVerifiedOrganizer: event.isVerifiedOrganizer,
          heroBackdropImageId: nextHero,
          posterImageId: nextPoster,
        });
        toast.success('Image uploaded and automatically assigned as Hero Backdrop & Poster frame!');
      } else {
        toast.success('Image uploaded successfully');
      }

      await reload();
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function setPrimary(imagesId: string) {
    setError(null);
    try {
      await setPrimaryEventImage(targetId, imagesId);
      toast.success('Primary event image updated');
      await reload();
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function setAsHero(imagesId: string) {
    if (!event) return;
    setHeroBackdropImageId(imagesId);
    setError(null);
    try {
      await updateEvent(event.eventsId, {
        title: event.title,
        slug: event.slug,
        description: event.description,
        status: event.status,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        layoutMode: event.layoutMode,
        eventType: event.eventType,
        venuesId: event.venuesId,
        imagePath: event.imagePath,
        extraInfoJson: event.extraInfoJson,
        shortDescription: event.shortDescription,
        storyDescription: event.storyDescription,
        urgencyBadgeText: event.urgencyBadgeText,
        isVerifiedOrganizer: event.isVerifiedOrganizer,
        heroBackdropImageId: imagesId,
        posterImageId,
      });
      toast.success('Set as Hero Backdrop image');
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function setAsPoster(imagesId: string) {
    if (!event) return;
    setPosterImageId(imagesId);
    setError(null);
    try {
      await updateEvent(event.eventsId, {
        title: event.title,
        slug: event.slug,
        description: event.description,
        status: event.status,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        layoutMode: event.layoutMode,
        eventType: event.eventType,
        venuesId: event.venuesId,
        imagePath: event.imagePath,
        extraInfoJson: event.extraInfoJson,
        shortDescription: event.shortDescription,
        storyDescription: event.storyDescription,
        urgencyBadgeText: event.urgencyBadgeText,
        isVerifiedOrganizer: event.isVerifiedOrganizer,
        heroBackdropImageId,
        posterImageId: imagesId,
      });
      toast.success('Set as Poster Frame image');
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function remove(imagesId: string) {
    setError(null);
    try {
      await removeEventImage(targetId, imagesId);
      if (heroBackdropImageId === imagesId && event) {
        setHeroBackdropImageId('');
      }
      if (posterImageId === imagesId && event) {
        setPosterImageId('');
      }
      toast.success('Image deleted');
      await reload();
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function saveMediaIds() {
    if (!event) return;
    setSavingMedia(true);
    setError(null);
    try {
      await updateEvent(event.eventsId, {
        title: event.title,
        slug: event.slug,
        description: event.description,
        status: event.status,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        layoutMode: event.layoutMode,
        eventType: event.eventType,
        venuesId: event.venuesId,
        imagePath: event.imagePath,
        extraInfoJson: event.extraInfoJson,
        shortDescription: event.shortDescription,
        storyDescription: event.storyDescription,
        urgencyBadgeText: event.urgencyBadgeText,
        isVerifiedOrganizer: event.isVerifiedOrganizer,
        heroBackdropImageId,
        posterImageId,
      });
      toast.success('Media frame assignments saved to database');
      onSaved?.();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSavingMedia(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-row items-center justify-between gap-4 bg-muted/10">
          <div>
            <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" /> Bento Studio Frame Assignments
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configured via system settings: Hero ({eventAspect}) & Poster / Thumbnail ({thumbAspect})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="text-[11px] font-mono border-primary/30 text-primary bg-primary/5 px-2.5 py-1">
              <Ratio className="size-3 mr-1" /> Hero {eventAspect}
            </Badge>
            <Badge variant="neutral" className="text-[11px] font-mono border-secondary/30 text-secondary bg-secondary/5 px-2.5 py-1">
              <Layers className="size-3 mr-1" /> Poster {thumbAspect}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-400" /> Wide Hero Backdrop
                  </span>
                  <Badge variant="neutral" className="text-[10px] font-mono">
                    Ratio {eventAspect}
                  </Badge>
                </div>
                <div className="relative aspect-video w-full rounded-lg border border-border overflow-hidden bg-muted/20 flex items-center justify-center">
                  {heroBackdropImageId ? (
                    <img src={imageUrl(heroBackdropImageId)} alt="Hero Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="size-8 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">No Hero Backdrop Assigned</p>
                      <p className="text-[10px] text-muted-foreground/70">Upload an image below to auto-assign</p>
                    </div>
                  )}
                  {heroBackdropImageId ? (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-black font-bold text-[10px]">
                      Active Hero
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">Hero Image UUID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={heroBackdropImageId}
                      onChange={(e) => setHeroBackdropImageId(e.target.value)}
                      placeholder="UUID of wide hero image"
                      className="h-9 bg-background border-border text-xs font-mono"
                    />
                    {heroBackdropImageId ? (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        title="Copy ID"
                        onClick={() => {
                          navigator.clipboard.writeText(heroBackdropImageId);
                          toast.success('Hero Image ID copied to clipboard');
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" /> Vertical Poster Frame / Thumbnail
                  </span>
                  <Badge variant="neutral" className="text-[10px] font-mono">
                    Ratio {thumbAspect}
                  </Badge>
                </div>
                <div className="relative aspect-[3/4] max-h-48 w-full rounded-lg border border-border overflow-hidden bg-muted/20 flex items-center justify-center mx-auto">
                  {posterImageId ? (
                    <img src={imageUrl(posterImageId)} alt="Poster Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="size-8 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">No Poster Frame Assigned</p>
                      <p className="text-[10px] text-muted-foreground/70">Upload an image below to auto-assign</p>
                    </div>
                  )}
                  {posterImageId ? (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground font-bold text-[10px]">
                      Active Poster
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">Poster Frame UUID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={posterImageId}
                      onChange={(e) => setPosterImageId(e.target.value)}
                      placeholder="UUID of vertical poster frame"
                      className="h-9 bg-background border-border text-xs font-mono"
                    />
                    {posterImageId ? (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0"
                        title="Copy ID"
                        onClick={() => {
                          navigator.clipboard.writeText(posterImageId);
                          toast.success('Poster Image ID copied to clipboard');
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {event ? (
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={saveMediaIds} disabled={savingMedia} className="ticketspan-spring-btn h-10 px-5 text-xs font-bold">
                {savingMedia ? 'Saving Assignments…' : 'Save Frame Assignments'}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <div>
              <CardTitle className="text-base font-bold font-display text-foreground">Media Asset Gallery</CardTitle>
              <p className="text-xs text-muted-foreground">
                Uploading the first image automatically sets it as Hero & Poster frame
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <MediaSectionGrid
            title="Hero & High-Res Gallery Images"
            subtitle={`Cropped according to app_settings ratio (${eventAspect})`}
            ratio={eventAspect}
            items={images}
            type={EVENT_IMAGE}
            heroId={heroBackdropImageId}
            posterId={posterImageId}
            onPick={(file) => setPending({ file, type: EVENT_IMAGE })}
            onPrimary={setPrimary}
            onSetHero={setAsHero}
            onSetPoster={setAsPoster}
            onRemove={remove}
          />

          <MediaSectionGrid
            title="Thumbnails & Listing Cards"
            subtitle={`Cropped according to app_settings ratio (${thumbAspect})`}
            ratio={thumbAspect}
            items={thumbnails}
            type={EVENT_THUMBNAIL}
            heroId={heroBackdropImageId}
            posterId={posterImageId}
            onPick={(file) => setPending({ file, type: EVENT_THUMBNAIL })}
            onPrimary={setPrimary}
            onSetHero={setAsHero}
            onSetPoster={setAsPoster}
            onRemove={remove}
          />

          {error ? <p className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">{error}</p> : null}
        </CardContent>
      </Card>

      {pending ? (
        <ImageCropDialog
          file={pending.file}
          aspect={parseAspect(pending.type === EVENT_IMAGE ? eventAspect : thumbAspect)}
          onCropped={handleCropped}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}

function MediaSectionGrid({
  title,
  subtitle,
  ratio,
  items,
  type,
  heroId,
  posterId,
  onPick,
  onPrimary,
  onSetHero,
  onSetPoster,
  onRemove,
}: {
  title: string;
  subtitle: string;
  ratio: string;
  items: EventImage[];
  type: string;
  heroId: string;
  posterId: string;
  onPick: (file: File) => void;
  onPrimary: (imagesId: string) => void;
  onSetHero: (imagesId: string) => void;
  onSetPoster: (imagesId: string) => void;
  onRemove: (imagesId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = items.length >= MAX_PER_TYPE;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">
            {title} <span className="text-muted-foreground font-normal text-xs">({items.length}/{MAX_PER_TYPE})</span>
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button size="sm" variant="outline" disabled={full} onClick={() => inputRef.current?.click()} className="h-9 text-xs font-bold">
          <Upload className="size-3.5 mr-1.5" /> Upload Image
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onPick(file);
            }
            e.target.value = '';
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center bg-muted/5">
          <ImageIcon className="size-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs font-medium text-muted-foreground">
            No {type === EVENT_IMAGE ? 'gallery images' : 'thumbnails'} uploaded yet
          </p>
          <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} className="mt-2 text-xs text-primary font-bold">
            Upload First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((img) => {
            const isHero = heroId === img.imagesId;
            const isPoster = posterId === img.imagesId;
            return (
              <div key={img.imagesId} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50">
                <img
                  src={imageUrl(img.imagesId)}
                  alt=""
                  className="w-full object-cover"
                  style={{ aspectRatio: aspectCss(ratio) }}
                />

                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                  {img.isPrimary ? (
                    <Badge className="bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                      <Star className="size-2.5 fill-black" /> Primary
                    </Badge>
                  ) : null}
                  {isHero ? (
                    <Badge className="bg-sky-500 text-white font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                      <Sparkles className="size-2.5" /> Hero
                    </Badge>
                  ) : null}
                  {isPoster ? (
                    <Badge className="bg-indigo-500 text-white font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-1 shadow-sm">
                      <Layers className="size-2.5" /> Poster
                    </Badge>
                  ) : null}
                </div>

                <div className="absolute inset-0 bg-black/75 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between z-20">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-white/80 hover:text-red-400 p-1 transition-colors"
                      onClick={() => onRemove(img.imagesId)}
                      title="Remove image"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {!isHero ? (
                      <button
                        type="button"
                        className="w-full text-[10px] font-bold py-1 px-1.5 rounded bg-sky-500/80 hover:bg-sky-500 text-white flex items-center justify-center gap-1 transition-colors"
                        onClick={() => onSetHero(img.imagesId)}
                      >
                        <Sparkles className="size-3" /> Set Hero
                      </button>
                    ) : null}
                    {!isPoster ? (
                      <button
                        type="button"
                        className="w-full text-[10px] font-bold py-1 px-1.5 rounded bg-indigo-500/80 hover:bg-indigo-500 text-white flex items-center justify-center gap-1 transition-colors"
                        onClick={() => onSetPoster(img.imagesId)}
                      >
                        <Layers className="size-3" /> Set Poster
                      </button>
                    ) : null}
                    {!img.isPrimary ? (
                      <button
                        type="button"
                        className="w-full text-[10px] font-bold py-1 px-1.5 rounded bg-amber-500/80 hover:bg-amber-500 text-black flex items-center justify-center gap-1 transition-colors"
                        onClick={() => onPrimary(img.imagesId)}
                      >
                        <Check className="size-3" /> Set Primary
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
