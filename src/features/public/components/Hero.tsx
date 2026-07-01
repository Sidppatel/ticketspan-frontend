import { useRef, useState, useEffect } from 'react';
import { CalendarDays, Users, Ticket, Eye, ShieldCheck, Clock } from 'lucide-react';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '@/shared/ui/button';
import { PriceBadge } from './PriceBadge';

interface HeroProps {
  event: Event;
  onGetTickets: () => void;
  minPriceCents?: number;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  Open: 'General Admission',
  Table: 'VIP Lounge Seating',
  Both: 'Tickets & VIP Tables',
};

export function Hero({ event, onGetTickets, minPriceCents }: HeroProps) {
  const date = formatEventDate(event.startDate);
  const hasImage = Boolean(event.primaryImageId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Real-time scarcity simulations
  const [viewers, setViewers] = useState(12);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 55 });

  useEffect(() => {
    // Subtle social viewer counter
    const interval = setInterval(() => {
      setViewers((prev) => Math.max(5, Math.min(38, prev + Math.floor(Math.random() * 5) - 2)));
    }, 5000);

    // Secure hold countdown (e.g. 15 minute lock)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const container = containerRef.current;

      // Parallax mouse move effect (disabled under reduced motion)
      const onMouseMove = (e: MouseEvent) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const { left, top, width, height } = container.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;

        if (imageRef.current) {
          gsap.to(imageRef.current, {
            x: x * 15,
            y: y * 15,
            duration: 0.6,
            ease: 'power2.out',
          });
        }

        // Magnetic CTA button glow position shift
        if (ctaRef.current) {
          const btnRect = ctaRef.current.getBoundingClientRect();
          const bx = e.clientX - btnRect.left;
          const by = e.clientY - btnRect.top;
          ctaRef.current.style.setProperty('--glow-x', `${bx}px`);
          ctaRef.current.style.setProperty('--glow-y', `${by}px`);
        }
      };

      container.addEventListener('mousemove', onMouseMove);

      // Clip path text entrances and page reveals
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      
      gsap.set('[data-animate-reveal]', { opacity: 0, y: 25 });
      gsap.set('[data-animate-title]', { clipPath: 'inset(0% 0% 100% 0%)', y: 30 });

      tl.to('[data-animate-title]', {
        clipPath: 'inset(0% 0% 0% 0%)',
        y: 0,
        duration: 1.0,
        stagger: 0.1,
      })
      .to('[data-animate-reveal]', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.05,
      }, '-=0.6');

      return () => {
        container.removeEventListener('mousemove', onMouseMove);
      };
    },
    { scope: containerRef }
  );

  const fDigit = (num: number) => String(num).padStart(2, '0');

  return (
    <section 
      ref={containerRef}
      aria-label="Event Introduction"
      className="w-full relative overflow-hidden bg-surface-900 text-white pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32"
    >
      {/* Background Media & Atmospheric Glows */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        {hasImage ? (
          <img
            ref={imageRef}
            src={imageUrl(event.primaryImageId)}
            alt=""
            className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-300"
          />
        ) : (
          /* Color Mesh Fallback if no media exists */
          <div className="w-full h-full bg-gradient-to-br from-accent-burgundy/40 via-surface-900 to-black" />
        )}

        {/* Ambient Moving Lights */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-accent-burgundy/20 blur-[120px] animate-pulse" 
          style={{ animationDuration: '8s' }} 
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square rounded-full bg-accent-gold/10 blur-[100px] animate-pulse" 
          style={{ animationDuration: '12s' }} 
        />
        
        {/* Widescreen gradient masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/75 z-[1]" />
        <div className="absolute inset-0 bg-black/30 z-[1]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Heading & Meta Panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Live Urgency Status */}
          {timeLeft.minutes > 0 && (
            <div data-animate-reveal className="inline-flex items-center gap-2 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold px-4 py-1 rounded-full w-fit">
              <Clock className="size-3.5 animate-spin" style={{ animationDuration: '12s' }} />
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                Reserve Rate Lock: {fDigit(timeLeft.minutes)}m {fDigit(timeLeft.seconds)}s left
              </span>
            </div>
          )}

          {/* Heading with clip-path entrance */}
          <div className="overflow-hidden">
            <h1 
              ref={titleRef}
              data-animate-title
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] text-white font-display uppercase break-words"
            >
              {event.title}
            </h1>
          </div>

          <div data-animate-reveal className="max-w-2xl">
            <p className="text-sm md:text-base text-white/70 leading-relaxed font-medium font-sans">
              {event.description?.substring(0, 180)}...
            </p>
          </div>

          {/* Details Grid Panel (Glass UI) */}
          <div data-animate-reveal className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-white/10 py-6 max-w-3xl">
            {date && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-burgundy/20 text-white border border-accent-burgundy/30">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Schedule Date</p>
                  <p className="font-bold text-white text-xs truncate">{date}</p>
                </div>
              </div>
            )}

            {event.totalCapacity > 0 && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-burgundy/20 text-white border border-accent-burgundy/30">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total Space</p>
                  <p className="font-bold text-white text-xs">{event.totalCapacity} Attendees</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-burgundy/20 text-white border border-accent-burgundy/30">
                <Ticket className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Access Mode</p>
                <p className="font-bold text-white text-xs truncate">{EVENT_TYPE_LABEL[event.eventType] || EVENT_TYPE_LABEL.Open}</p>
              </div>
            </div>
          </div>

          {/* Actions Block */}
          <div data-animate-reveal className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Button 
              ref={ctaRef}
              onClick={onGetTickets}
              className="px-8 py-7 text-sm font-extrabold bg-accent-burgundy hover:bg-accent-burgundy/95 text-white rounded-xl shadow-[0_12px_30px_rgba(164,18,63,0.4)] hover:shadow-[0_16px_36px_rgba(164,18,63,0.55)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer relative overflow-hidden group select-none border border-accent-burgundy/50"
              style={{
                background: 'radial-gradient(circle at var(--glow-x, 0px) var(--glow-y, 0px), rgba(255,255,255,0.15) 0%, transparent 80%), var(--primary)'
              } as React.CSSProperties}
            >
              Get Tickets {minPriceCents !== undefined && (
                <span className="ml-1.5 opacity-90">· From <PriceBadge priceCents={minPriceCents} className="text-white" /></span>
              )}
            </Button>
            
            <div className="flex flex-col items-start justify-center text-xs text-white/50">
              <div className="flex items-center gap-1.5 text-accent-gold font-bold uppercase tracking-wider">
                <ShieldCheck className="size-4 text-accent-gold" /> Secure Booking
              </div>
              <p className="text-[10px] mt-0.5 font-medium">Platform verified entries</p>
            </div>
          </div>
        </div>

        {/* Floating Social Proof Card */}
        <div data-animate-reveal className="lg:col-span-4 flex justify-end lg:block hidden">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-2xl space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                <Eye className="size-3.5" /> {viewers} browsing details
              </p>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-sans font-medium">
              High visitor traffic detected for this page. Tickets and table options are dynamic and subject to tier price increases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
