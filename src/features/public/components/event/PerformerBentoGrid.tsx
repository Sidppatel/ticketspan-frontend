import { Mic2, ExternalLink } from 'lucide-react';
import { parseCatalogLinks, metaValue } from '../catalogJson';
import { imageUrl } from '@/shared/upload';

interface PerformerBentoGridProps {
  performersJson: string;
}

export function PerformerBentoGrid({ performersJson }: PerformerBentoGridProps) {
  const links = parseCatalogLinks(performersJson, 'performerId');
  if (links.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
          <Mic2 className="size-5 text-brand" /> Artist Lineup
        </h3>
        <span className="text-xs font-mono font-medium text-ink-soft uppercase tracking-wider">
          {links.length} {links.length === 1 ? 'Performer' : 'Performers'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((performer) => {
          const role = metaValue(performer.meta, 'role');
          const genre = metaValue(performer.meta, 'genre');
          const image = performer.primaryImagePath ? imageUrl(performer.primaryImagePath) : null;
          const href = performer.slug ? `/performers/${performer.slug}` : `/performers/${performer.id}`;

          return (
            <a
              key={performer.id}
              href={href}
              className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-border-strong bg-surface-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl min-h-[220px]"
            >
              {image ? (
                <img
                  src={image}
                  alt={performer.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stage via-surface-card to-surface-sunken" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-1 text-white">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-voltage transition-colors">
                    {performer.name}
                  </span>
                  <ExternalLink className="size-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {role && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white/90 backdrop-blur-md">
                      {role}
                    </span>
                  )}
                  {genre && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white/90 backdrop-blur-md">
                      {genre}
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
