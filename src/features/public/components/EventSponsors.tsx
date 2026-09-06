import { Link } from 'react-router-dom';
import { Award, Globe, ArrowUpRight, ShieldCheck, MapPin } from 'lucide-react';
import { parseCatalogLinks, metaValue } from './catalogJson';
import { imageUrl } from '@/shared/upload';

export function EventSponsors({ sponsorsJson }: { sponsorsJson: string }) {
  const links = parseCatalogLinks(sponsorsJson, 'sponsorId');
  if (links.length === 0) return null;

  const platinum = links.filter((l) =>
    (metaValue(l.meta, 'tier') || '').toLowerCase().includes('platinum'),
  );
  const gold = links.filter((l) =>
    (metaValue(l.meta, 'tier') || '').toLowerCase().includes('gold'),
  );
  const others = links.filter((l) => {
    const t = (metaValue(l.meta, 'tier') || '').toLowerCase();
    return !t.includes('platinum') && !t.includes('gold');
  });

  return (
    <section className="space-y-8 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-border/50 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            <Award className="size-4" /> Official Event Partners
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sponsors &amp; Supporters
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {links.length} Corporate {links.length === 1 ? 'Partner' : 'Partners'}
        </span>
      </div>

      {platinum.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="size-3" /> Platinum Title Partners
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platinum.map((item) => (
              <SponsorCard key={item.id} sponsor={item} prominent />
            ))}
          </div>
        </div>
      )}

      {gold.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Gold Tier Partners
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gold.map((item) => (
              <SponsorCard key={item.id} sponsor={item} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Official Supporters &amp; Media
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((item) => (
              <SponsorCard key={item.id} sponsor={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SponsorCard({
  sponsor,
  prominent = false,
}: {
  sponsor: ReturnType<typeof parseCatalogLinks>[0];
  prominent?: boolean;
}) {
  const tier = metaValue(sponsor.meta, 'tier') || 'Partner';
  const category = metaValue(sponsor.meta, 'category');
  const booth = metaValue(sponsor.meta, 'booth') || metaValue(sponsor.meta, 'booth_location');
  const website = metaValue(sponsor.meta, 'website');
  const notes = metaValue(sponsor.meta, 'notes') || metaValue(sponsor.meta, 'description');
  const logo = sponsor.primaryImagePath ? imageUrl(sponsor.primaryImagePath) : null;
  const href = sponsor.slug ? `/sponsors/${sponsor.slug}` : `/sponsors/${sponsor.id}`;

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border ${prominent ? 'border-primary/40 bg-card/90 shadow-[var(--shadow-e2)]' : 'border-border/80 bg-card shadow-[var(--shadow-e1)]'} p-1.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-e3)]`}>
      <div className="flex flex-col justify-between h-full rounded-[calc(1.75rem-0.375rem)] bg-background/60 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Link to={href} className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-background p-2 shadow-xs">
              {logo ? (
                <img
                  src={logo}
                  alt={sponsor.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="font-display text-sm font-bold text-muted-foreground">
                  {sponsor.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-base text-foreground transition-colors group-hover:text-primary truncate">
                  {sponsor.name}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-border/60 bg-muted/80 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tier}
                </span>
                {category ? (
                  <span className="font-mono text-[10px] text-muted-foreground truncate">
                    {category}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>

          <Link
            to={href}
            aria-label={`View ${sponsor.name} profile`}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {notes && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {notes}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px]">
          {booth ? (
            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
              <MapPin className="size-3 text-primary" /> {booth}
            </span>
          ) : (
            <Link to={href} className="font-medium text-primary hover:underline">
              Partner Details
            </Link>
          )}

          {website ? (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
            >
              <Globe className="size-3" /> Website
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
