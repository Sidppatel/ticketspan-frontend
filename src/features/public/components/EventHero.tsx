import { useRef, useState, useEffect } from 'react';
import { CalendarDays, Users, Ticket, Eye, Flame, Clock, Compass, ShieldCheck } from 'lucide-react';
import type { Event } from '@/shared/proto/event';
import { imageUrl } from '@/shared/upload';
import { formatEventDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Button } from '@/shared/ui/button';

const EVENT_TYPE_LABEL: Record<string, string> = {
  Open: 'General admission',
  Table: 'Table seating',
  Both: 'Tickets & tables',
};

export function EventHero({ event }: { event: Event }) {
  const date = formatEventDate(event.startDate);
  const hasImage = Boolean(event.primaryImageId);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  
  // Scarcity & Social proof state simulations
  const [viewers, setViewers] = useState(34);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 44, seconds: 12 });

  useEffect(() => {
    // Simulate live viewing spikes
    const viewerInterval = setInterval(() => {
      setViewers(prev => Math.max(20, Math.min(65, prev + Math.floor(Math.random() * 7) - 3)));
    }, 4000);

    // Simulate countdown ticker (e.g., promotional price lock or start countdown)
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  useGSAP(
    () => {
      // 1. Mouse Move Parallax Effect
      if (!imageRef.current || !containerRef.current) return;
      const container = containerRef.current;
      const image = imageRef.current;

      const onMouseMove = (e: MouseEvent) => {
        const { left, top, width, height } = container.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;

        // Subtle parallax translation + tilt rotation on image
        gsap.to(image, {
          x: x * 25,
          y: y * 25,
          rotateX: y * -8,
          rotateY: x * 8,
          duration: 0.8,
          ease: 'power2.out',
        });
      };

      const onMouseLeave = () => {
        gsap.to(image, {
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 1.2,
          ease: 'power3.out',
        });
      };

      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);

      // 2. High-End GSAP Entrance Animations
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      
      // Reset starting states for clean animations
      gsap.set('[data-animate-reveal]', { opacity: 0, y: 35 });
      gsap.set('[data-animate-title]', { clipPath: 'inset(0% 0% 100% 0%)', y: 40 });
      gsap.set('[data-animate-float]', { scale: 0.9, opacity: 0 });

      tl.to('[data-animate-title]', {
        clipPath: 'inset(0% 0% 0% 0%)',
        y: 0,
        duration: 1.2,
        stagger: 0.15,
      })
      .to('[data-animate-reveal]', {
        opacity: 1,
        y: 0,
        duration: 1.0,
        stagger: 0.08,
      }, '-=0.8')
      .to('[data-animate-float]', {
        scale: 1,
        opacity: 1,
        duration: 1.0,
        ease: 'back.out(1.7)',
        stagger: 0.1,
      }, '-=0.8');

      return () => {
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
      };
    },
    { scope: containerRef }
  );

  function scrollToTickets() {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Format time display digits helper
  const fDigit = (num: number) => String(num).padStart(2, '0');

  return (
    <header 
      ref={containerRef}
      className="w-full relative overflow-hidden bg-[#180d17] text-white border-b border-white/5 py-16 md:py-24 lg:py-32"
      style={{ perspective: 1000 }}
    >
      {/* Background Atmosphere: Ambient Dynamic Mesh Gradients & Moving Orbs */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden">
        {hasImage ? (
          <img
            src={imageUrl(event.primaryImageId)}
            alt=""
            className="w-full h-full object-cover blur-3xl opacity-30 scale-125"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 via-[#180d17] to-black" />
        )}
        {/* Deep Plum & Cranberry Radial Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-primary/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-marigold/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* Fine Noise Texture & Gradient Masking */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fbf6f0] via-transparent to-black/80 z-[1]" />
        <div className="absolute inset-0 bg-black/40 z-[1]" />
      </div>

      {/* Main Responsive Grid Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: Cover Image with Parallax Glass Frame */}
        <div className="lg:col-span-6 flex justify-center order-1 lg:order-2" data-animate-float>
          <div className="relative w-full max-w-xl aspect-[4/3] group rounded-2xl p-2 bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_30px_70px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-white/20">
            
            {/* Glass Corner Overlay Tags */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
              <span className="rounded-full bg-black/80 backdrop-blur-md px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white border border-white/15 shadow-lg">
                {event.category || 'Special Event'}
              </span>
              {event.status ? (
                <Badge className="bg-primary hover:bg-primary/95 text-white text-[9px] uppercase font-bold tracking-wider px-3 py-1 border border-white/10 shadow-lg">
                  {event.status}
                </Badge>
              ) : null}
            </div>

            {/* Main Cover Image */}
            <div className="w-full h-full overflow-hidden rounded-xl bg-black/40 relative">
              {hasImage ? (
                <img
                  ref={imageRef as React.RefObject<HTMLImageElement>}
                  src={imageUrl(event.primaryImageId)}
                  alt={event.title}
                  className="w-full h-full object-cover scale-[1.08] transition-transform duration-300 ease-out"
                />
              ) : (
                <div 
                  ref={imageRef as React.RefObject<HTMLDivElement>}
                  className="w-full h-full bg-gradient-to-tr from-primary/35 via-[#2e1b2c] to-transparent flex flex-col items-center justify-center text-white/50 gap-2"
                >
                  <Compass className="size-10 stroke-1 text-white/40" />
                  <span className="text-xs uppercase tracking-widest font-bold">Experience Awaits</span>
                </div>
              )}
              {/* Premium overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>

            {/* Bottom Floating Social Proof Badge */}
            <div className="absolute bottom-6 right-6 z-20 bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 shadow-xl flex items-center gap-2.5 animate-bounce" style={{ animationDuration: '4s' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
                <Eye className="size-3.5 text-emerald-400" />
                {viewers} buying live right now
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cinematic Editorial Copy */}
        <div ref={heroContentRef} className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1 text-left">
          
          {/* Urgent Time Lock Badge */}
          <div data-animate-reveal className="inline-flex items-center gap-2 bg-marigold/10 border border-marigold/30 text-marigold px-4.5 py-1.5 rounded-full w-fit mb-6 shadow-[0_4px_20px_rgba(245,165,36,0.15)]">
            <Clock className="size-4 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
              TICKET LOCK: {fDigit(timeLeft.hours)}h {fDigit(timeLeft.minutes)}m {fDigit(timeLeft.seconds)}s REMAINING
            </span>
          </div>

          {/* Stagger-revealed Headline */}
          <div className="overflow-hidden mb-6">
            <h1 
              ref={titleRef}
              data-animate-title
              className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95] text-white font-display uppercase break-words"
            >
              {event.title}
            </h1>
          </div>

          {/* Meta Information Cards (Glass Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-white/10 py-6 mb-8" data-animate-reveal>
            {date ? (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-white border border-primary/30">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">Date & Time</p>
                  <p className="font-bold text-white text-xs truncate">{date}</p>
                </div>
              </div>
            ) : null}

            {event.totalCapacity > 0 ? (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-white border border-primary/30">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">Capacity Limit</p>
                  <p className="font-bold text-white text-xs">{event.totalCapacity} attendees</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/15">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-white border border-primary/30">
                <Ticket className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">Access Mode</p>
                <p className="font-bold text-white text-xs truncate">{EVENT_TYPE_LABEL[event.eventType] ?? EVENT_TYPE_LABEL.Open}</p>
              </div>
            </div>
          </div>

          {/* Action CTAs & Trust Signals */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6" data-animate-reveal>
            <Button 
              onClick={scrollToTickets}
              className="w-full sm:w-auto px-8 py-7 text-base font-extrabold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-[0_12px_30px_rgba(164,18,63,0.45)] hover:shadow-[0_16px_36px_rgba(164,18,63,0.6)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-98 cursor-pointer border border-primary/50 relative overflow-hidden group"
            >
              {/* Shimmer Highlight */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/15 skew-x-[-25deg] translate-x-[-120%] group-hover:animate-[svyne-shimmer_1.2s_ease-in-out_infinite]" />
              <Flame className="size-5 mr-2 animate-bounce fill-white" />
              Claim Tickets Now
            </Button>
            
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="size-4 shrink-0" />
                Guaranteed Instant Checkout
              </div>
              <p className="text-[10px] text-white/40 font-medium">All ticket sales are final</p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
