import { useCallback } from 'react';
import { MapPin, Phone, Mail, Compass, ExternalLink } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import { getVenue } from '@/features/admin/services/catalogService';
import { cn } from '@/shared/lib/cn';

interface VenueCardProps {
  venuesId: string;
  className?: string;
}

export function VenueCard({ venuesId, className }: VenueCardProps) {
  const loader = useCallback(() => getVenue(venuesId), [venuesId]);
  const { data: venue, loading, error } = useAsync(loader);

  if (loading) {
    return (
      <div className={cn('p-6 rounded-2xl border border-border-soft bg-surface-card animate-pulse space-y-4 h-64', className)}>
        <div className="h-6 w-1/3 bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className={cn('p-6 rounded-2xl border border-danger/10 bg-danger/5 text-danger text-xs font-semibold', className)}>
        Venue logistics unavailable at this time. Please check your booking details or contact the organizer.
      </div>
    );
  }

  const addressString = `${venue.line1 || ''} ${venue.line2 || ''}, ${venue.city || ''}, ${venue.state || ''} ${venue.zip || ''}`.trim();
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${addressString}`)}`;

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 rounded-3xl border border-border-strong bg-surface-card shadow-md', className)}>
      <div className="lg:col-span-6 space-y-5">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent-burgundy mb-2">
            <Compass className="size-3.5" /> Event Venue
          </span>
          <h3 className="text-xl md:text-2xl font-black text-foreground font-display uppercase tracking-tight">
            {venue.name}
          </h3>
          {venue.description && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
              {venue.description}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {addressString && (
            <div className="flex items-start gap-3 text-sm text-foreground">
              <MapPin className="size-4.5 text-accent-burgundy shrink-0 mt-0.5" />
              <span>{addressString}</span>
            </div>
          )}

          {venue.phone && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Phone className="size-4.5 text-accent-burgundy shrink-0" />
              <a href={`tel:${venue.phone}`} className="hover:underline">{venue.phone}</a>
            </div>
          )}

          {venue.email && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Mail className="size-4.5 text-accent-burgundy shrink-0" />
              <a href={`mailto:${venue.email}`} className="hover:underline">{venue.email}</a>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-6 min-h-[200px] rounded-2xl overflow-hidden border border-border-strong relative bg-muted group shadow-inner">
        {/* Simple Blueprint/Map graphic background */}
        <div className="absolute inset-0 bg-[#f4ece3] opacity-40 pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(164, 18, 63, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(164, 18, 63, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '16px 16px'
          }}
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
          <MapPin className="size-8 text-accent-burgundy animate-bounce" />
          <div>
            <h4 className="font-bold text-sm text-foreground font-display uppercase tracking-wide">Directions & Location</h4>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">Navigate to the event using your preferred mapping software</p>
          </div>
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-burgundy text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            Open in Google Maps <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
