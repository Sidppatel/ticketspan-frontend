import { MapPin, BookOpen } from 'lucide-react';
import { VenueCard } from '../VenueCard';
import { EventExtraInfo } from '../EventExtraInfo';

interface VenueLogisticsBentoProps {
  venuesId?: string;
  extraInfoJson?: string;
  description?: string;
}

export function VenueLogisticsBento({
  venuesId,
  extraInfoJson,
  description,
}: VenueLogisticsBentoProps) {
  return (
    <div className="space-y-8">
      {description && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-brand" /> The Story & Event Vision
            </h3>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-br from-surface-card via-surface-card to-surface-sunken p-6 md:p-8 shadow-md">
            <div className="absolute right-4 top-4 font-display text-8xl font-black text-foreground/[0.03] select-none pointer-events-none">
              STORY
            </div>

            <p className="relative z-10 whitespace-pre-line text-sm leading-relaxed text-foreground font-sans font-medium max-w-4xl">
              {description}
            </p>
          </div>
        </div>
      )}

      {extraInfoJson && (
        <EventExtraInfo extraInfoJson={extraInfoJson} />
      )}

      {venuesId && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
              <MapPin className="size-5 text-brand" /> Location & Venue
            </h3>
          </div>
          <VenueCard venuesId={venuesId} />
        </div>
      )}
    </div>
  );
}
