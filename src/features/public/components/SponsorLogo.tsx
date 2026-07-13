import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '@/shared/upload';
import { cn } from '@/shared/lib/cn';
import { useLazyGsap } from '@/shared/motion/useLazyGsap';

interface SponsorLogoProps {
  name: string;
  slug: string;
  primaryImagePath?: string;
  subtitle?: string;
  hrefBase: string;
  className?: string;
}

export function SponsorLogo({ name, slug, primaryImagePath, subtitle, hrefBase, className }: SponsorLogoProps) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useLazyGsap(
    ({ gsap }) => {
      const card = containerRef.current;
      if (!card) return;

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

        if (imageRef.current) {
          gsap.to(imageRef.current, {
            scale: 1.05,
            duration: 0.3,
          });
        }

        if (glintRef.current) {
          gsap.to(glintRef.current, {
            x: x - 40,
            y: y - 40,
            opacity: 0.1,
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

        if (imageRef.current) {
          gsap.to(imageRef.current, {
            scale: 1,
            duration: 0.6,
          });
        }

        if (glintRef.current) {
          gsap.to(glintRef.current, {
            opacity: 0,
            duration: 0.4,
          });
        }
      };

      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);

      return () => {
        card.removeEventListener('mousemove', onMouseMove);
        card.removeEventListener('mouseleave', onMouseLeave);
      };
    },
    containerRef,
  );

  return (
    <Link
      ref={containerRef}
      to={`${hrefBase}/${slug}`}
      data-item-card
      className={cn(
        'group relative flex flex-col justify-center items-center rounded-2xl border border-border bg-card p-6 h-28 overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div ref={glintRef} className="absolute size-20 rounded-full bg-primary pointer-events-none opacity-0 blur-xl mix-blend-screen" />
      {primaryImagePath ? (
        <img
          ref={imageRef}
          src={imageUrl(primaryImagePath)}
          alt={name}
          className="h-10 w-auto max-w-[80%] object-contain opacity-70 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
          loading="lazy"
        />
      ) : (
        <span className="font-extrabold text-foreground tracking-wider text-sm uppercase text-center truncate w-full">
          {name}
        </span>
      )}
      {subtitle && (
        <span className="absolute bottom-2 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          {subtitle}
        </span>
      )}
    </Link>
  );
}
