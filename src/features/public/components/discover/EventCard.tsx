import { Link } from 'react-router-dom';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { ArrowUpRight, Sparkles, Tag } from 'lucide-react';

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
  Music: 'from-amber-600/80 via-rose-900/70 to-slate-950',
  Nightlife: 'from-purple-600/80 via-indigo-950 to-slate-950',
  Festival: 'from-emerald-600/80 via-teal-950 to-slate-950',
  Conference: 'from-blue-600/80 via-cyan-950 to-slate-950',
  Dining: 'from-orange-600/80 via-amber-950 to-slate-950',
};

export function EventCard({ event, index }: { event: Event; index: number }) {
  const { month, day } = getEventDateBadge(event.startDate);
  const categoryKey = event.category || 'Event';
  const gradient = CATEGORY_GRADIENTS[categoryKey] || 'from-zinc-700/80 via-zinc-900 to-slate-950';

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-2 text-card-foreground shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-e3)]"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      {}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.25rem] bg-muted">
        {event.primaryImageId ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full flex-col justify-end bg-gradient-to-br ${gradient} p-5 text-white`}>
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
            <div className="space-y-1 z-10">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-white/70">
                <Sparkles className="size-3 text-amber-300" /> Exclusive Experience
              </span>
              <p className="font-display text-xl font-bold leading-tight text-white line-clamp-2">
                {event.title}
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {}
        <div className="absolute left-3.5 top-3.5 flex flex-col items-center justify-center rounded-xl border border-white/20 bg-slate-950/85 px-3 py-1.5 text-center shadow-lg backdrop-blur-md">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {month}
          </span>
          <span className="font-mono text-base font-extrabold leading-none text-white">
            {day}
          </span>
        </div>

        {}
        <div className="absolute right-3.5 top-3.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-medium text-white/90 shadow-md backdrop-blur-md">
            <Tag className="size-2.5 text-primary" />
            {categoryKey}
          </span>
        </div>
      </div>

      {}
      <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono font-medium text-primary">
              {formatEventDate(event.startDate)}
            </span>
            {event.isFeatured ? (
              <span className="font-mono text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                ★ Featured
              </span>
            ) : null}
          </div>
          <h3 className="font-display text-lg font-bold leading-snug text-foreground line-clamp-2 transition-colors duration-200 group-hover:text-primary">
            {event.title}
          </h3>
          {event.description ? (
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          ) : null}
        </div>

        {}
        <div className="flex items-center justify-end border-t border-border/60 pt-3 text-xs font-semibold text-primary">
          <span className="inline-flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-0.5">
            Book Tickets <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
