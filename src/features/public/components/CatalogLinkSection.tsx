import { useRef } from 'react';
import { metaValue, type CatalogLink } from './catalogJson';
import type { LucideIcon } from 'lucide-react';
import { ArtistCard } from './ArtistCard';
import { SponsorLogo } from './SponsorLogo';
import { SectionTitle } from './SectionTitle';
import { ScrollRail } from './ScrollRail';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';

export function CatalogLinkSection({
  title,
  icon: Icon,
  links,
  hrefBase,
  subtitleKeys,
}: {
  title: string;
  icon: LucideIcon;
  links: CatalogLink[];
  hrefBase: string;
  subtitleKeys: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isSponsors = title.toLowerCase().includes('sponsor');
  const showHorizontalScroll = !isSponsors && links.length > 2;

  useLazyGsap(
    ({ gsap }) => {
      if (!containerRef.current) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const cards = containerRef.current.querySelectorAll('[data-item-card]');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        },
      );
    },
    containerRef,
    [links, showHorizontalScroll],
  );

  if (links.length === 0) {
    return null;
  }

  if (showHorizontalScroll) {
    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-stage py-8 text-white md:py-12"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 select-none font-display text-[22vw] font-black uppercase leading-none tracking-tighter text-white/[0.02] md:text-[16rem]">
          LINEUP
        </div>

        <div className="relative mb-6 flex items-center justify-between px-5 md:px-8">
          <SectionTitle title={title} subtitle="Swipe or use the arrows" icon={Icon} light />
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
            {links.length} Artists
          </span>
        </div>

        <ScrollRail tone="dark" scrollerClassName="gap-5 px-5 md:px-8">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <div key={link.id} className="w-[240px] shrink-0 snap-start sm:w-[300px]">
                <ArtistCard
                  name={link.name}
                  slug={link.slug}
                  primaryImagePath={link.primaryImagePath}
                  subtitle={subtitle}
                  hrefBase={hrefBase}
                />
              </div>
            );
          })}
        </ScrollRail>
      </div>
    );
  }

  if (isSponsors) {
    return (
      <section ref={containerRef} className="space-y-5 py-4" aria-label={title}>
        <div className="flex items-center justify-between">
          <SectionTitle title={title} subtitle="Proudly backed by industry leaders" icon={Icon} />
          <span className="rounded-md bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {links.length} {links.length === 1 ? 'Partner' : 'Partners'}
          </span>
        </div>

        <ScrollRail tone="light" scrollerClassName="gap-4 px-0.5">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <div key={link.id} className="w-[170px] shrink-0 snap-start sm:w-[200px]">
                <SponsorLogo
                  name={link.name}
                  slug={link.slug}
                  primaryImagePath={link.primaryImagePath}
                  subtitle={subtitle}
                  hrefBase={hrefBase}
                  className="h-28 w-full"
                />
              </div>
            );
          })}
        </ScrollRail>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="space-y-6 py-4" aria-label={title}>
      <div className="flex items-center justify-between">
        <SectionTitle title={title} subtitle="Special guest appearances" icon={Icon} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
          {links.length} {links.length === 1 ? 'Guest' : 'Guests'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => {
          const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
          return (
            <ArtistCard
              key={link.id}
              name={link.name}
              slug={link.slug}
              primaryImagePath={link.primaryImagePath}
              subtitle={subtitle}
              hrefBase={hrefBase}
            />
          );
        })}
      </div>
    </section>
  );
}
