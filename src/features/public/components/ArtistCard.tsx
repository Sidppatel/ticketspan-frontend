import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '@/shared/upload';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { cn } from '@/shared/lib/cn';

interface ArtistCardProps {
  name: string;
  slug: string;
  primaryImagePath?: string;
  subtitle?: string;
  hrefBase: string;
  className?: string;
}

export function ArtistCard({ name, slug, primaryImagePath, subtitle, hrefBase, className }: ArtistCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const card = cardRef.current;
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
            x: (x - xc) / 10,
            y: (y - yc) / 10,
            scale: 1.08,
            duration: 0.3,
          });
        }

        if (glintRef.current) {
          gsap.to(glintRef.current, {
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

        if (imageRef.current) {
          gsap.to(imageRef.current, {
            x: 0,
            y: 0,
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
    { scope: cardRef }
  );

  return (
    <Link
      ref={cardRef}
      to={`${hrefBase}/${slug}`}
      data-item-card
      className={cn(
        'group relative block aspect-[4/5] rounded-3xl overflow-hidden bg-stage border border-black/10 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-500 hover:border-primary/40 hover:shadow-xl',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div ref={glintRef} className="absolute size-28 rounded-full bg-white pointer-events-none opacity-0 blur-2xl z-10" />

      {primaryImagePath ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            ref={imageRef}
            src={imageUrl(primaryImagePath)}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-primary/90 to-stage flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-6 z-20 flex flex-col justify-end min-h-[95px]">
        {subtitle && (
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-gold mb-1 drop-shadow-md">
            {subtitle}
          </span>
        )}
        <h3 className="text-xl font-black tracking-tight leading-tight transition-colors font-display drop-shadow-md text-white group-hover:text-accent-gold">
          {name}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider mt-2 flex items-center gap-1 transition-colors text-white/70 group-hover:text-white drop-shadow-sm">
          View profile <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
