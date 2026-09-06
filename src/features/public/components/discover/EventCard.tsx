import { Link } from 'react-router-dom';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { ArrowUpRight, Sparkles, Tag, Users, Ticket } from 'lucide-react';
import { parseCatalogLinks } from '@/features/public/components/catalogJson';

function getEventDateBadge(dateValue?: string | number | null) {
  if (!dateValue) return { month: 'TBA', day: '--' };
  try {
    const d = typeof dateValue === 'number' ? new Date(dateValue * 1000) : new Date(dateValue);
    if (isNaN(d.getTime())) return { month: 'TBA', day: '--' };
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate().toString().padStart(2, '0');
    return { month, day };
  } catch {
    return { month: 'TBA', day: '--' };
  }
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Music: 'from-amber-700/80 via-rose-950 to-slate-950',
  Nightlife: 'from-purple-700/80 via-indigo-950 to-slate-950',
  Festival: 'from-emerald-700/80 via-teal-950 to-slate-950',
  Tech: 'from-cyan-700/80 via-blue-950 to-slate-950',
  Conference: 'from-blue-700/80 via-slate-950 to-neutral-950',
  Dining: 'from-orange-700/80 via-amber-950 to-slate-950',
};

export function EventCard({ event, index }: { event: Event; index: number }) {
  const { month, day } = getEventDateBadge(event.startDate);
  const categoryKey = event.category || 'Event';
  const gradient = CATEGORY_GRADIENTS[categoryKey] || 'from-zinc-700/80 via-zinc-900 to-slate-950';
  const performers = parseCatalogLinks(event.performersJson, 'performerId');
  const cardImage = event.primaryImageId ? imageUrl(event.primaryImageId) : null;

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border/80 bg-card p-1.5 text-card-foreground shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[var(--shadow-e3)]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="flex flex-col justify-between h-full rounded-[calc(2rem-0.375rem)] bg-background/50 overflow-hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {cardImage ? (
            <img
              src={cardImage}
              alt={event.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full flex-col justify-end bg-gradient-to-br ${gradient} p-5 text-white`}>
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
              <div className="space-y-1 z-10">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-white/70">
                  <Sparkles className="size-3 text-amber-300" /> Live Experience
                </span>
                <p className="font-display text-lg font-bold leading-tight text-white line-clamp-2">
                  {event.title}
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />

          <div className="absolute left-3.5 top-3.5 flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-slate-950/85 px-3 py-1.5 text-center shadow-lg backdrop-blur-md">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {month}
            </span>
            <span className="font-mono text-base font-extrabold leading-none text-white">
              {day}
            </span>
          </div>

          <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
            {event.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/30 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-200 backdrop-blur-md">
                ★ Featured
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-medium text-white/90 shadow-md backdrop-blur-md">
              <Tag className="size-2.5 text-primary" />
              {categoryKey}
            </span>
          </div>

          {performers.length > 0 && (
            <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-white/90">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 font-mono text-[10px] font-medium backdrop-blur-md">
                <Users className="size-3 text-primary" /> {performers.length} {performers.length === 1 ? 'Act' : 'Acts'} Announced
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-primary">
                {formatEventDate(event.startDate)}
              </span>
              {event.eventType && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {event.eventType === 'Both' ? 'Passes & Tables' : event.eventType === 'Table' ? 'Reserved Tables' : 'Admission Passes'}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg font-bold leading-snug text-foreground line-clamp-2 transition-colors duration-200 group-hover:text-primary">
              {event.title}
            </h3>

            {event.shortDescription || event.description ? (
              <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {event.shortDescription || event.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Ticket className="size-3.5 text-primary" />
              <span>Tickets &amp; Passes</span>
            </div>

            <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:underline">
              Book Passes
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-3.5" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
