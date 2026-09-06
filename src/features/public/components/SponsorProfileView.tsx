import { Link } from 'react-router-dom';
import {
  Globe,
  Building2,
  ExternalLink,
  ArrowLeft,
  Award,
  ShieldCheck,
  Mail,
  MapPin,
  Share2,
  Ticket,
  Clock,
} from 'lucide-react';
import { imageUrl } from '@/shared/upload';
import { formatEpoch } from '@/shared/lib/format';
import { parseMeta, metaValue } from '@/features/public/components/catalogJson';
import type { PublicLinkedEvent } from '@/shared/proto/catalog';
import { toast } from 'sonner';

interface SponsorProfileViewProps {
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  events: PublicLinkedEvent[];
}

export function SponsorProfileView({
  name,
  slug,
  primaryImagePath,
  metaJson,
  events,
}: SponsorProfileViewProps) {
  const meta = parseMeta(metaJson);
  const tier = metaValue(meta, 'tier') || 'Official Partner';
  const category = metaValue(meta, 'category');
  const description = metaValue(meta, 'description') || metaValue(meta, 'notes');
  const website = metaValue(meta, 'website');
  const linkedin = metaValue(meta, 'linkedin');
  const twitter = metaValue(meta, 'twitter');
  const contactName = metaValue(meta, 'contact_name');
  const contactEmail = metaValue(meta, 'contact_email');
  const boothLocation = metaValue(meta, 'booth_location');

  const logoUrl = primaryImagePath ? imageUrl(primaryImagePath) : '';

  const sharePartner = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Partner link copied to clipboard');
    }
  };

  const isPlatinum = tier.toLowerCase().includes('platinum');
  const isGold = tier.toLowerCase().includes('gold');

  const tierBadgeStyle = isPlatinum
    ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    : isGold
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : 'border-primary/20 bg-primary/10 text-primary';

  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-24">
      <nav className="flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md transition-all duration-200 hover:border-foreground/20 hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to Box Office
        </Link>

        <button
          type="button"
          onClick={sharePartner}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3.5 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-all hover:text-foreground active:scale-[0.98]"
        >
          <Share2 className="size-3.5" />
          Share Partner
        </button>
      </nav>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-gradient-to-b from-card/95 via-card/85 to-background p-2 shadow-[var(--shadow-e3)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 rounded-[calc(2.5rem-0.5rem)] bg-background/40 p-6 sm:p-10 md:flex-row md:items-end md:gap-10">
          <div className="relative shrink-0">
            <div className="relative size-44 overflow-hidden rounded-[2rem] border border-white/20 bg-muted/60 p-2 shadow-2xl sm:size-52">
              <div className="flex h-full w-full items-center justify-center rounded-[calc(2rem-0.5rem)] bg-background p-4 shadow-inner">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={name}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Building2 className="size-12 text-primary/70" />
                    <span className="mt-2 font-display text-base font-bold text-foreground">
                      {name}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Official Partner
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-1 font-mono text-[10px] font-bold text-primary shadow-lg backdrop-blur-md">
              <ShieldCheck className="size-3 text-primary" /> Official
            </span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 font-mono text-[11px] font-semibold ${tierBadgeStyle}`}>
                <Award className="size-3.5" /> {tier} Partner
              </span>
              {category ? (
                <span className="rounded-full border border-border/60 bg-muted/80 px-3 py-1 font-mono text-[11px] font-medium text-foreground backdrop-blur-md">
                  {category}
                </span>
              ) : null}
              <span className="rounded-full bg-muted/40 px-3 py-1 font-mono text-[11px] text-muted-foreground">
                /{slug}
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              {name}
            </h1>

            {description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {website ? (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Globe className="size-3.5" /> Visit Official Website
                  <ExternalLink className="size-3" />
                </a>
              ) : null}

              {linkedin ? (
                <a
                  href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
                >
                  LinkedIn
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              ) : null}

              {twitter ? (
                <a
                  href={twitter.startsWith('http') ? twitter : `https://x.com/${twitter.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
                >
                  X (Twitter)
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              ) : null}

              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
                >
                  <Mail className="size-3.5" /> Contact Partner
                </a>
              ) : null}
            </div>

            {(boothLocation || contactName) && (
              <div className="flex flex-wrap items-center gap-4 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                {boothLocation && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    Exhibit Presence: <span className="font-mono">{boothLocation}</span>
                  </span>
                )}
                {contactName && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    Representative: <span className="font-mono">{contactName}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              <Award className="size-4" /> Backed Events &amp; Experiences
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Partnership Portfolio
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {events.length} Sponsored {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border/80 bg-card/40 p-12 text-center backdrop-blur-sm">
            <Clock className="mx-auto size-10 text-muted-foreground/60" />
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
              No Current Public Events
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New sponsored experiences and partner stages are updated regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => {
              const evImg = ev.primaryImagePath ? imageUrl(ev.primaryImagePath) : '';
              return (
                <Link
                  key={ev.eventsId}
                  to={`/events/${ev.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card p-2 text-card-foreground shadow-[var(--shadow-e1)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[var(--shadow-e3)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[calc(2rem-0.375rem)] bg-muted">
                    {evImg ? (
                      <img
                        src={evImg}
                        alt={ev.title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-card p-4 text-center text-xs font-semibold text-muted-foreground">
                        {ev.title}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute left-3.5 top-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-white backdrop-blur-md">
                        {ev.category || 'Event'}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                      <span className="font-mono text-xs font-semibold">
                        {formatEpoch(ev.startDate)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 font-mono text-[10px] font-bold text-primary-foreground shadow-md backdrop-blur-md transition-transform group-hover:scale-105">
                        <Ticket className="size-3" /> Event Details
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                    <h3 className="font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {ev.title}
                    </h3>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs font-semibold text-primary">
                      <span>Explore Partner Stage</span>
                      <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
