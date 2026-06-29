import { useCallback } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { listEventImages } from '@/features/public/services/publicEventService';
import { imageUrl } from '@/shared/upload';

export function EventMediaCarousel({ eventsId }: { eventsId: string }) {
  const loader = useCallback(() => listEventImages(eventsId, 'event_image'), [eventsId]);
  const { data } = useAsync(loader);
  const images = (data ?? []).slice(0, 5);
  if (images.length === 0) {
    return null;
  }
  const [hero, ...rest] = images;
  return (
    <div className="space-y-2">
      <img
        src={imageUrl(hero.imagesId)}
        alt=""
        className="aspect-[16/9] w-full rounded-lg object-cover"
      />
      {rest.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {rest.map((img) => (
            <img
              key={img.imagesId}
              src={imageUrl(img.imagesId)}
              alt=""
              className="aspect-[16/9] h-20 shrink-0 rounded-md object-cover"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
