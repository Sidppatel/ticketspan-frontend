import { Link } from 'react-router-dom';
import {
  Calendar,
  Globe,
  Music2,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Radio,
  Clock,
  Ticket,
  CheckCircle2,
  Share2,
  Mail,
} from 'lucide-react';
import { imageUrl } from '@/shared/upload';
import { formatEpoch } from '@/shared/lib/format';
import { parseMeta, metaValue } from '@/features/public/components/catalogJson';
import type { PublicLinkedEvent } from '@/shared/proto/catalog';
import { toast } from 'sonner';

interface PerformerProfileViewProps {
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  events: PublicLinkedEvent[];
}

export function PerformerProfileView({
  name,
  slug,
  primaryImagePath,
  metaJson,
  events,
}: PerformerProfileViewProps) {
  const meta = parseMeta(metaJson);
  const role = metaValue(meta, 'role') || 'Featured Artist';
  const genre = metaValue(meta, 'genre');
  const description = metaValue(meta, 'description') || metaValue(meta, 'notes');
  const website = metaValue(meta, 'website');
  const spotify = metaValue(meta, 'spotify');
  const youtube = metaValue(meta, 'youtube');
  const instagram = metaValue(meta, 'instagram');
  const twitter = metaValue(meta, 'twitter');
  const bookingLink = metaValue(meta, 'booking_link');

  const avatarUrl = primaryImagePath ? imageUrl(primaryImagePath) : '';

  const shareProfile = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Artist link copied to clipboard');
    }
  };

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
          onClick={shareProfile}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3.5 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-all hover:text-foreground active:scale-[0.98]"
        >
          <Share2 className="size-3.5" />
          Share Artist
        </button>
      </nav>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-border/80 bg-gradient-to-b from-card/95 via-card/85 to-background p-2 shadow-[var(--shadow-e3)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-28 -top-28 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 -bottom-28 size-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 rounded-[calc(2.5rem-0.5rem)] bg-background/40 p-6 sm:p-10 md:flex-row md:items-end md:gap-10">
          <div className="relative shrink-0">
            <div className="relative size-44 overflow-hidden rounded-[2rem] border border-white/20 bg-muted/50 p-1.5 shadow-2xl sm:size-52">
              <div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-0.375rem)] bg-muted">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-muted to-card text-foreground">
                    <Music2 className="size-14 text-primary/70" />
                    <span className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Live Act
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-1 font-mono text-[10px] font-bold text-primary shadow-lg backdrop-blur-md">
              <CheckCircle2 className="size-3 text-emerald-500" /> Verified
            </span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-primary">
                <Sparkles className="size-3.5" /> {role}
              </span>
              {genre ? (
                <span className="rounded-full border border-border/60 bg-muted/80 px-3 py-1 font-mono text-[11px] font-medium text-foreground backdrop-blur-md">
                  {genre}
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

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {website ? (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
                >
                  <Globe className="size-3.5" /> Official Website
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              ) : null}

              {spotify ? (
                <a
                  href={spotify.startsWith('http') ? spotify : `https://${spotify}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
                >
                  <Radio className="size-3.5" /> Spotify
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              ) : null}

              {youtube ? (
                <a
                  href={youtube.startsWith('http') ? youtube : `https://${youtube}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
                >
                  <Music2 className="size-3.5" /> YouTube Music
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              ) : null}

              {instagram ? (
                <a
                  href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
                >
                  Instagram
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

              {bookingLink ? (
                <a
                  href={bookingLink.includes('@') ? `mailto:${bookingLink}` : bookingLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
                >
                  <Mail className="size-3.5" /> Booking Inquiries
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              <Calendar className="size-4" /> Performance Schedule
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Upcoming Shows & Appearances
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {events.length} {events.length === 1 ? 'Date' : 'Dates'} Confirmed
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border/80 bg-card/40 p-12 text-center backdrop-blur-sm">
            <Clock className="mx-auto size-10 text-muted-foreground/60" />
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
              No Upcoming Public Appearances
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New tour dates and festival lineups are announced regularly. Check back soon.
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
                        <Ticket className="size-3" /> Tickets
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                    <h3 className="font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary line-clamp-2">
                      {ev.title}
                    </h3>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs font-semibold text-primary">
                      <span>View Lineup &amp; Passes</span>
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
