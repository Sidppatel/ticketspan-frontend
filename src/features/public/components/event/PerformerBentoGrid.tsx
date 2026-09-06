import { Link } from 'react-router-dom';
import { Mic2, ArrowUpRight, Sparkles, Clock, MapPin, Music } from 'lucide-react';
import { parseCatalogLinks, metaValue } from '../catalogJson';
import { imageUrl } from '@/shared/upload';

interface PerformerBentoGridProps {
  performersJson: string;
}

export function PerformerBentoGrid({ performersJson }: PerformerBentoGridProps) {
  const links = parseCatalogLinks(performersJson, 'performerId');
  if (links.length === 0) return null;

  return (
    <section className="space-y-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            <Mic2 className="size-4" /> Live Lineup &amp; Talent
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Featured Performers
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {links.length} {links.length === 1 ? 'Artist' : 'Artists'} Announced
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((performer, index) => {
          const role = metaValue(performer.meta, 'role') || (index === 0 ? 'Headliner' : 'Support');
          const isHeadliner = role.toLowerCase().includes('headliner');
          const genre = metaValue(performer.meta, 'genre');
          const stage = metaValue(performer.meta, 'stage');
          const setTime = metaValue(performer.meta, 'set_time');
          const duration = metaValue(performer.meta, 'duration');
          const notes = metaValue(performer.meta, 'notes') || metaValue(performer.meta, 'description');
          const image = performer.primaryImagePath ? imageUrl(performer.primaryImagePath) : null;
          const href = performer.slug ? `/performers/${performer.slug}` : `/performers/${performer.id}`;

          const cardSpan = isHeadliner && links.length > 2 && index === 0
            ? 'sm:col-span-2 lg:col-span-2 min-h-[300px]'
            : 'col-span-1 min-h-[240px]';

          return (
            <Link
              key={performer.id}
              to={href}
              className={`group relative flex flex-col justify-end overflow-hidden rounded-[2rem] border border-border/80 bg-card p-1.5 shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[var(--shadow-e3)] ${cardSpan}`}
            >
              <div className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-[calc(2rem-0.375rem)] bg-muted p-6 sm:p-7">
                {image ? (
                  <img
                    src={image}
                    alt={performer.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-neutral-900 to-black">
                    <div className="pointer-events-none absolute -right-12 -top-12 size-60 rounded-full bg-primary/20 blur-2xl" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                <div className="absolute left-4 top-4 right-4 flex items-center justify-between z-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider uppercase backdrop-blur-md ${
                        isHeadliner
                          ? 'border border-amber-400/40 bg-amber-500/20 text-amber-300'
                          : 'border border-white/20 bg-white/10 text-white/90'
                      }`}
                    >
                      {isHeadliner ? <Sparkles className="size-3" /> : <Music className="size-3" />}
                      {role}
                    </span>
                    {genre ? (
                      <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-medium text-white/80 backdrop-blur-md">
                        {genre}
                      </span>
                    ) : null}
                  </div>

                  <span className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>

                <div className="relative z-10 space-y-2 text-white">
                  <h4 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors sm:text-2xl">
                    {performer.name}
                  </h4>

                  {notes ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/70 max-w-xl">
                      {notes}
                    </p>
                  ) : null}

                  {(stage || setTime) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/15 text-[11px] font-mono text-white/80">
                      {stage && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          {stage}
                        </span>
                      )}
                      {setTime && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-primary" />
                          {setTime} {duration ? `(${duration})` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
