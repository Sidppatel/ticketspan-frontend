import { useCallback, useRef, useState } from 'react';
import { Image as ImageIcon, Star, Trash2, Upload } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
} from '@/features/admin/services/eventAdminService';
import type { EventImage } from '@/shared/proto/event';

const MAX_PER_TYPE = 5;
const EVENT_IMAGE = 'event_image';
const EVENT_THUMBNAIL = 'event_thumbnail';

interface PendingCrop {
  file: File;
  type: string;
}

export function EventMediaManager({ eventsId }: { eventsId: string }) {
  const imagesLoader = useCallback(
    () =>
      Promise.all([
        listEventImages(eventsId, EVENT_IMAGE),
        listEventImages(eventsId, EVENT_THUMBNAIL),
      ]),
    [eventsId],
  );
  const { data, reload } = useAsync(imagesLoader);
  const settings = useAsync(getMediaSettings);
  const [images, thumbnails] = data ?? [[], []];
  const eventAspect = settings.data?.eventImageAspectRatio || '16:9';
  const thumbAspect = settings.data?.eventThumbnailAspectRatio || '4:3';
  const [pending, setPending] = useState<PendingCrop | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCropped(file: File) {
    const type = pending?.type ?? EVENT_IMAGE;
    setPending(null);
    setError(null);
    try {
      const uploaded = await uploadImage(file, 'event', eventsId);
      await addEventImage(eventsId, uploaded.imagesId, type);
      await reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function setPrimary(imagesId: string) {
    setError(null);
    try {
      await setPrimaryEventImage(eventsId, imagesId);
      await reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function remove(imagesId: string) {
    setError(null);
    try {
      await removeEventImage(eventsId, imagesId);
      await reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <ImageIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Event media</h3>
      </div>
      <CardContent className="space-y-6">
        <MediaSection
          title="Event images"
          subtitle="Shown on the event page. Cropped to the event card ratio."
          ratio={eventAspect}
          items={images}
          type={EVENT_IMAGE}
          onPick={(file) => setPending({ file, type: EVENT_IMAGE })}
          onPrimary={setPrimary}
          onRemove={remove}
        />
        <MediaSection
          title="Event thumbnails"
          subtitle="Shown on the event list. Cropped to the list card ratio."
          ratio={thumbAspect}
          items={thumbnails}
          type={EVENT_THUMBNAIL}
          onPick={(file) => setPending({ file, type: EVENT_THUMBNAIL })}
          onPrimary={setPrimary}
          onRemove={remove}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      {pending ? (
        <ImageCropDialog
          file={pending.file}
          aspect={parseAspect(pending.type === EVENT_IMAGE ? eventAspect : thumbAspect)}
          onCropped={handleCropped}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </Card>
  );
}

function MediaSection({
  title,
  subtitle,
  ratio,
  items,
  type,
  onPick,
  onPrimary,
  onRemove,
}: {
  title: string;
  subtitle: string;
  ratio: string;
  items: EventImage[];
  type: string;
  onPick: (file: File) => void;
  onPrimary: (imagesId: string) => void;
  onRemove: (imagesId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = items.length >= MAX_PER_TYPE;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {title} <span className="text-muted-foreground">({items.length}/{MAX_PER_TYPE})</span>
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button size="sm" variant="outline" disabled={full} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Add
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
        <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          No {type === 'event_image' ? 'images' : 'thumbnails'} yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((img) => (
            <div key={img.imagesId} className="group relative overflow-hidden rounded-md border border-border">
              <img
                src={imageUrl(img.imagesId)}
                alt=""
                className="w-full object-cover"
                style={{ aspectRatio: aspectCss(ratio) }}
              />
              {img.isPrimary ? (
                <Badge className="absolute left-1 top-1">
                  <Star className="size-3" /> Primary
                </Badge>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-stone-950/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isPrimary ? (
                  <button
                    type="button"
                    className="rounded px-1 text-xs text-white hover:text-amber-300"
                    onClick={() => onPrimary(img.imagesId)}
                  >
                    Set primary
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="rounded px-1 text-white hover:text-destructive"
                  onClick={() => onRemove(img.imagesId)}
                  aria-label="Remove image"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
