import { useRef } from 'react';
import { metaValue, type CatalogLink } from './catalogJson';
import type { LucideIcon } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArtistCard } from './ArtistCard';
import { SponsorLogo } from './SponsorLogo';
import { SectionTitle } from './SectionTitle';

gsap.registerPlugin(ScrollTrigger);

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSponsors = title.toLowerCase().includes('sponsor');
  const showHorizontalScroll = !isSponsors && links.length > 2;

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      
      if (showHorizontalScroll && scrollRef.current) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const scroll = scrollRef.current;
        const totalScroll = scroll.scrollWidth - scroll.clientWidth;

        if (totalScroll > 0) {
          const pin = gsap.to(scroll, {
            x: -totalScroll,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              pin: true,
              scrub: 0.8,
              start: 'top top+=80',
              end: () => `+=${totalScroll * 1.1}`,
              invalidateOnRefresh: true,
            },
          });

          return () => {
            pin.scrollTrigger?.kill();
          };
        }
      }


      if (!showHorizontalScroll) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const cards = container.querySelectorAll('[data-item-card]');
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
      }
    },
    { scope: containerRef, dependencies: [links, showHorizontalScroll] }
  );

  if (links.length === 0) {
    return null;
  }

  
  if (showHorizontalScroll) {
    return (
      <div 
        ref={containerRef} 
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-stage text-white py-16 md:py-24 overflow-hidden border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-10 flex items-center justify-between">
          <SectionTitle
            title={title}
            subtitle="Scroll to explore our special performers lineup"
            icon={Icon}
            light
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
            {links.length} Artists
          </span>
        </div>

        {}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-[20vw] font-black uppercase text-white/[0.01] font-display leading-none tracking-tighter">
          LINEUP
        </div>

        {}
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div 
            ref={scrollRef} 
            className="flex gap-6 w-max pr-[400px]"
            style={{ willChange: 'transform' }}
          >
            {links.map((link) => {
              const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
              return (
                <div key={link.id} className="w-[280px] sm:w-[320px]">
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
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <section ref={containerRef} className="space-y-6 py-4" aria-label={title}>
      <div className="flex items-center justify-between">
        <SectionTitle
          title={title}
          subtitle={isSponsors ? 'Proudly backed by industry leaders' : 'Special guest appearances'}
          icon={Icon}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
          {links.length} {links.length === 1 ? 'Partner' : 'Partners'}
        </span>
      </div>

      {isSponsors ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <SponsorLogo
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
      ) : (
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
      )}
    </section>
  );
}
