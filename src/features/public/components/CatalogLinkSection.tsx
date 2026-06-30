import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '@/shared/upload';
import { metaValue, type CatalogLink } from './catalogJson';
import type { LucideIcon } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

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

      // 1. Horizontal Scroll for Lineup Performers (if multiple items)
      if (showHorizontalScroll && scrollRef.current) {
        const scroll = scrollRef.current;
        
        // Calculate dynamic horizontal distance
        const totalScroll = scroll.scrollWidth - scroll.clientWidth;
        if (totalScroll > 0) {
          const pin = gsap.to(scroll, {
            x: -totalScroll,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              pin: true,
              scrub: 0.8,
              start: 'top top+=100',
              end: () => `+=${totalScroll * 1.2}`,
              invalidateOnRefresh: true,
            },
          });

          return () => {
            pin.scrollTrigger?.kill();
          };
        }
      }

      // 2. Fallback Grid/Plaque animations
      if (!showHorizontalScroll) {
        const cards = container.querySelectorAll('[data-item-card]');
        gsap.from(cards, {
          opacity: 0,
          y: 20,
          scale: 0.98,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        });
      }
    },
    { scope: containerRef, dependencies: [links, showHorizontalScroll] }
  );

  // Card hover 3D tilt effects
  useGSAP(
    () => {
      const cards = document.querySelectorAll('[data-item-card]');
      cards.forEach((card) => {
        const image = card.querySelector('[data-card-image]');
        const glint = card.querySelector('[data-card-glint]');
        
        const onMouseMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xc = rect.width / 2;
          const yc = rect.height / 2;
          const angleX = (yc - y) / 12;
          const angleY = (x - xc) / 12;

          gsap.to(card, {
            rotateX: angleX,
            rotateY: angleY,
            transformPerspective: 800,
            duration: 0.3,
            ease: 'power1.out',
          });

          if (image) {
            gsap.to(image, {
              x: (x - xc) / 10,
              y: (y - yc) / 10,
              scale: 1.08,
              duration: 0.3,
            });
          }

          if (glint) {
            gsap.to(glint, {
              x: x - 40,
              y: y - 40,
              opacity: 0.15,
              duration: 0.1,
            });
          }
        };

        const onMouseLeave = () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.6,
            ease: 'power2.out',
          });

          if (image) {
            gsap.to(image, {
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.6,
            });
          }

          if (glint) {
            gsap.to(glint, {
              opacity: 0,
              duration: 0.4,
            });
          }
        };

        card.addEventListener('mousemove', onMouseMove as EventListener);
        card.addEventListener('mouseleave', onMouseLeave);

        return () => {
          card.removeEventListener('mousemove', onMouseMove as EventListener);
          card.removeEventListener('mouseleave', onMouseLeave);
        };
      });
    },
    { dependencies: [links] }
  );

  if (links.length === 0) {
    return null;
  }

  // -----------------------------------------------------------------
  // RENDER OPTION A: CINEMATIC PINNED HORIZONTAL SCROLL (LINEUP)
  // -----------------------------------------------------------------
  if (showHorizontalScroll) {
    return (
      <div 
        ref={containerRef} 
        className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#180d17] text-white py-16 md:py-24 overflow-hidden border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-white border border-primary/30">
              <Icon className="size-5" />
            </span>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase font-display">
                {title}
              </h2>
              <p className="text-xs text-on-dark-soft font-semibold">
                Scroll to explore our award-winning performers lineup
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-dark-soft bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
            {links.length} Artists
          </span>
        </div>

        {/* Ambient Big Background typography */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-[22vw] font-black uppercase text-white/[0.01] font-display leading-none tracking-tighter">
          LINEUP
        </div>

        {/* Pinned horizontal scrolling viewport */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div 
            ref={scrollRef} 
            className="flex gap-6 w-max pr-[400px]"
            style={{ willChange: 'transform' }}
          >
            {links.map((link) => {
              const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
              return (
                <Link
                  key={link.id}
                  to={`${hrefBase}/${link.slug}`}
                  data-item-card
                  className="group relative block w-[280px] sm:w-[320px] aspect-[4/5] rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-white/20"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div data-card-glint className="absolute size-24 rounded-full bg-white pointer-events-none opacity-0 blur-2xl" />

                  {link.primaryImagePath ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <img
                        data-card-image
                        src={imageUrl(link.primaryImagePath)}
                        alt={link.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-70" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-primary/30 to-[#2e1b2c] flex items-center justify-center">
                      <span className="text-white/40 uppercase tracking-widest text-xs font-bold">Artist Profile</span>
                    </div>
                  )}

                  {/* Info panel */}
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-col justify-end min-h-[100px]">
                    {subtitle ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-marigold mb-1">
                        {subtitle}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors font-display">
                      {link.name}
                    </h3>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-2.5 flex items-center gap-1 group-hover:text-white transition-colors">
                      View profile <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER OPTION B: ASYMMETRICAL EDITORIAL GRID (FEW ITEMS/SPONSORS)
  // -----------------------------------------------------------------
  return (
    <section ref={containerRef} className="space-y-6 py-4">
      {/* Editorial Header */}
      <div className="flex items-center justify-between border-b border-hairline-strong pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink uppercase font-display">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {isSponsors ? 'Proudly backed by industry leaders' : 'Special appearances and talent features'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
          {links.length} {links.length === 1 ? 'Partner' : 'Partners'}
        </span>
      </div>

      {isSponsors ? (
        /* SPONSORS PLAQUE CLOUD */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <Link
                key={link.id}
                to={`${hrefBase}/${link.slug}`}
                data-item-card
                className="group relative flex flex-col justify-center items-center rounded-2xl border border-hairline-strong bg-card p-6 h-28 overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div data-card-glint className="absolute size-20 rounded-full bg-primary pointer-events-none opacity-0 blur-xl mix-blend-screen" />
                {link.primaryImagePath ? (
                  <img
                    data-card-image
                    src={imageUrl(link.primaryImagePath)}
                    alt={link.name}
                    className="h-10 w-auto max-w-[80%] object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="font-extrabold text-muted-foreground/50 tracking-wider text-sm uppercase">
                    {link.name}
                  </span>
                )}
                {subtitle ? (
                  <span className="absolute bottom-2 text-[9px] font-bold uppercase tracking-wider text-primary opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    {subtitle}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : (
        /* ASYMMETRICAL LINEUP (FEW ITEMS) */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <Link
                key={link.id}
                to={`${hrefBase}/${link.slug}`}
                data-item-card
                className="group relative block aspect-[4/5] rounded-3xl overflow-hidden bg-surface-dark border border-white/5 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div data-card-glint className="absolute size-28 rounded-full bg-white pointer-events-none opacity-0 blur-2xl" />

                {link.primaryImagePath ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <img
                      data-card-image
                      src={imageUrl(link.primaryImagePath)}
                      alt={link.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-70" />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-primary/30 to-[#2e1b2c] flex items-center justify-center">
                    <span className="text-white/40 uppercase tracking-widest text-xs font-bold">Featured Performer</span>
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 p-6 bg-black/45 backdrop-blur-md border-t border-white/10 flex flex-col justify-end min-h-[95px]">
                  {subtitle ? (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-marigold mb-1">
                      {subtitle}
                    </span>
                  ) : null}
                  <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors font-display">
                    {link.name}
                  </h3>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-2 flex items-center gap-1 group-hover:text-white transition-colors">
                    View profile <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
