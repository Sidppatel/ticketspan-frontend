import { type ReactNode, useCallback, useMemo, useState, useRef } from 'react';
import { FileText, Flame, ShieldCheck, Ticket, Users, Info, Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEventBySlug,
  getEventLayout,
  calculatePrice,
  listEventTableTypes,
} from '@/features/public/services/publicEventService';

import { EventHero } from '@/features/public/components/EventHero';
import { useEventReveal } from '@/features/public/hooks/useEventReveal';
import { EventPerformers } from '@/features/public/components/EventPerformers';
import { EventSponsors } from '@/features/public/components/EventSponsors';
import { EventTimeline } from '@/features/public/components/EventTimeline';
import { EventExtraInfo } from '@/features/public/components/EventExtraInfo';
import { Seo } from '@/shared/components/Seo';
import { imageUrl } from '@/shared/upload';
import { listEventTicketTypes, createMultiBooking } from '@/features/public/services/paymentService';
import {
  type CartItem,
  savePendingCart,
  takePendingCart,
  clearPendingCart,
} from '@/features/public/services/pendingCart';
import type { EventTicketType } from '@/shared/proto/bookings';
import type { Table } from '@/shared/proto/booking';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { centsToUSD } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);
  const scope = useEventReveal<HTMLDivElement>(Boolean(event));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-body">Loading Event details…</p>
        </div>
      </div>
    );
  }
  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-center">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-ink font-display">Event not found</h2>
          <p className="text-sm text-body">{error ?? 'This link may have expired or is incorrect.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="pb-32 bg-canvas">
      <Seo
        title={event.title}
        description={event.description}
        image={event.primaryImageId ? imageUrl(event.primaryImageId) : undefined}
      />
      
      {/* 1. HERO HEADER REDESIGN */}
      <EventHero event={event} />
      
      {/* 2. CORE LAYOUT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16">
        <CartBookingPanel
          eventsId={event.eventsId}
          eventType={event.eventType || 'Open'}
          feesIncluded={event.feesIncluded}
        >
          {/* About Section Redesigned */}
          {event.description ? <AboutSection description={event.description} /> : null}
          
          <div data-reveal className="pt-6">
            <EventPerformers performersJson={event.performersJson} />
          </div>
          
          <div data-reveal className="pt-6">
            <EventSponsors sponsorsJson={event.sponsorsJson} />
          </div>
          
          <div data-reveal className="pt-6">
            <EventTimeline eventsId={event.eventsId} />
          </div>
          
          <div data-reveal className="pt-6">
            <EventExtraInfo extraInfoJson={event.extraInfoJson} />
          </div>
        </CartBookingPanel>
      </div>

      {/* STICKY BUY BAR FOR MOBILE */}
      <StickyBuyBar />
    </div>
  );
}

// -------------------------------------------------------------
// REDESIGNED ABOUT SECTION (ASYSMMETRICAL EDITORIAL LAYOUT)
// -------------------------------------------------------------
function AboutSection({ description }: { description: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.from(containerRef.current.querySelector('[data-about-title]'), {
      opacity: 0,
      y: 20,
      duration: 0.6,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
      }
    });
    gsap.from(containerRef.current.querySelector('[data-about-text]'), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} data-reveal className="py-8 border-b border-hairline-strong">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left bold display title */}
        <div className="lg:col-span-4" data-about-title>
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
            <FileText className="size-4" /> About the experience
          </div>
          <h2 className="text-3xl md:text-4xl font-black leading-tight text-ink font-display uppercase">
            THE STORY & DETAILS
          </h2>
        </div>
        {/* Right high-readability description */}
        <div className="lg:col-span-8 lg:pl-6" data-about-text>
          <p className="whitespace-pre-line leading-relaxed text-body text-base font-medium font-sans">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// STICKY BOTTOM CHECKOUT TRIGGER FOR MOBILE
// -------------------------------------------------------------
function StickyBuyBar() {
  function scrollToBooking() {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-white/10 bg-surface-dark/95 backdrop-blur-md px-6 py-4 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold tracking-widest text-on-dark-soft">Secure Booking</span>
        <span className="text-sm font-black text-white font-display">RESERVE YOUR SPOT</span>
      </div>
      <Button 
        onClick={scrollToBooking}
        className="px-6 py-5 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg animate-pulse"
      >
        Select Tickets
      </Button>
    </div>
  );
}

// -------------------------------------------------------------
// CART & BOOKING PANEL REDESIGN (ASYMMETRICAL LAYOUT WITH DECK)
// -------------------------------------------------------------
function CartBookingPanel({
  eventsId,
  eventType,
  feesIncluded,
  children,
}: {
  eventsId: string;
  eventType: string;
  feesIncluded: boolean;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showTickets = eventType === 'Open' || eventType === 'Both';
  const showTables = eventType === 'Table' || eventType === 'Both';

  const [cart, setCart] = useState<CartItem[]>(() => takePendingCart(eventsId));
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const upsert = useCallback((item: CartItem) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.key !== item.key);
      return [...next, item];
    });
  }, []);
  
  const removeKey = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);
  
  const inCart = useCallback((key: string) => cart.some((i) => i.key === key), [cart]);

  const subtotal = cart.reduce((s, i) => addCents(s, i.subtotal), 0);
  const fee = cart.reduce((s, i) => addCents(s, i.fee), 0);
  const total = addCents(subtotal, fee);

  async function checkout() {
    if (!isAuthenticated) {
      savePendingCart(eventsId, cart);
      setReturnTo(location.pathname + location.search);
      navigate('/login');
      return;
    }

    setBusy(true);
    setBookingError(null);
    try {
      const { bookingsId } = await createMultiBooking(
        eventsId,
        cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
      );
      clearPendingCart(eventsId);
      navigate(`/checkout/${bookingsId}`);
    } catch (caught) {
      setBookingError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start pb-16">
      
      {/* LEFT COLUMN: SELECTION AREAS */}
      <div className="min-w-0 space-y-12">
        {/* Glowing floating live viewing notification banner */}
        <div data-reveal className="relative overflow-hidden rounded-2xl bg-white border border-[#e7d9cb] p-5 shadow-[0_8px_30px_rgba(231,217,203,0.3)] flex items-start gap-4">
          {/* Accent red pulse line */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flame className="size-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase tracking-wider text-ink font-display flex items-center gap-2">
              Demand Level: CRITICAL
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </h4>
            <p className="text-xs text-body leading-relaxed">
              Ticket pricing increases as availability drops. Complete your order today to locked-in current promotional rates.
            </p>
          </div>
        </div>

        {showTickets ? (
          <div data-reveal id="booking">
            <TicketTierSection 
              eventsId={eventsId} 
              feesIncluded={feesIncluded} 
              cart={cart} 
              upsert={upsert} 
              removeKey={removeKey} 
            />
          </div>
        ) : null}
        
        {showTables ? (
          <div data-reveal>
            <TableSection 
              eventsId={eventsId} 
              feesIncluded={feesIncluded} 
              inCart={inCart} 
              upsert={upsert} 
              removeKey={removeKey} 
            />
          </div>
        ) : null}
        
        {children}
      </div>

      {/* RIGHT COLUMN: STICKY CHECKOUT DECK */}
      <aside className="lg:sticky lg:top-8 space-y-6">
        <Card className="overflow-hidden border border-hairline-strong bg-card shadow-lg rounded-2xl">
          {/* Glass header with visual identity */}
          <div className="bg-muted px-6 py-4 border-b border-hairline-strong flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink">ORDER DOCK</span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" /> Connection secure
            </span>
          </div>

          <CardContent className="p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <Ticket className="size-8 stroke-1 mx-auto text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Your cart is empty</p>
                <p className="text-[10px] text-muted-foreground/60">Choose a ticket or seat layout on the left to proceed</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-hairline-soft">
                  {cart.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 text-xs">
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-primary/10 text-primary border border-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                            {item.kind}
                          </span>
                          <span className="font-extrabold text-ink truncate block max-w-[150px]">{item.label}</span>
                        </div>
                        <span className="text-muted-foreground/70 font-semibold block">
                          {item.seats} {item.seats === 1 ? 'seat' : 'seats'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-extrabold text-ink">
                          {centsToUSD(feesIncluded ? addCents(item.subtotal, item.fee) : item.subtotal)}
                        </span>
                        <button 
                          className="text-destructive font-bold text-[10px] uppercase hover:underline cursor-pointer" 
                          onClick={() => removeKey(item.key)} 
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-hairline-strong pt-4 space-y-2">
                  {feesIncluded ? (
                    <div className="flex justify-between items-center text-sm font-black text-ink uppercase tracking-wider font-display">
                      <span>Total (incl. fees)</span>
                      <span>{centsToUSD(total)}</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-semibold">{centsToUSD(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform service fees</span>
                        <span className="font-semibold">{centsToUSD(fee)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-ink border-t border-hairline-soft pt-2 uppercase tracking-wider font-display">
                        <span>Total amount</span>
                        <span>{centsToUSD(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bookingError ? (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-[10px] font-bold leading-normal">
                {bookingError}
              </div>
            ) : null}

            <Button 
              disabled={busy || cart.length === 0 || total <= 0} 
              onClick={checkout} 
              className={cn(
                "w-full py-6 text-xs uppercase font-black tracking-widest rounded-xl transition-all duration-300 shadow-md",
                cart.length > 0 && total > 0 
                  ? "bg-primary hover:bg-primary/95 text-white shadow-[0_8px_20px_rgba(164,18,63,0.3)] hover:-translate-y-0.5" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {busy ? 'Securing Spot…' : 'Secure my tickets'}
            </Button>
          </CardContent>
        </Card>

        {/* TRUST ACCREDITATION SIGNALS */}
        <div className="rounded-2xl border border-hairline-strong bg-card p-5 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-2 text-ink font-bold uppercase tracking-wider border-b border-hairline-soft pb-3 font-display">
            <ShieldCheck className="size-4.5 text-emerald-600" /> Guaranteed Ticket Trust
          </div>
          <div className="space-y-3 font-sans text-body">
            <div className="flex gap-2">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <p className="text-[11px] leading-relaxed">
                <span className="font-bold text-ink">Instant Digital Issuance:</span> Tickets arrive in your wallet and inbox immediately.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <p className="text-[11px] leading-relaxed">
                <span className="font-bold text-ink">All Sales Final:</span> All ticket sales are final and non-refundable.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// -------------------------------------------------------------
// TICKET TIER SELECTION REDESIGN (PREMIUM GLASS NOTCH TICKETS)
// -------------------------------------------------------------
function TicketTierSection({
  eventsId,
  feesIncluded,
  cart,
  upsert,
  removeKey,
}: {
  eventsId: string;
  feesIncluded: boolean;
  cart: CartItem[];
  upsert: (i: CartItem) => void;
  removeKey: (key: string) => void;
}) {
  const loader = useCallback(() => listEventTicketTypes(eventsId), [eventsId]);
  const { data: ticketTypes, loading } = useAsync(loader);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || (ticketTypes ?? []).length === 0) return;
      const cards = containerRef.current.querySelectorAll('[data-ticket-tier-card]');

      // Entrance animation
      gsap.from(cards, {
        opacity: 0,
        y: 25,
        scale: 0.98,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      });
    },
    { scope: containerRef, dependencies: [ticketTypes] }
  );

  function seatsFor(refId: string): number {
    return cart.find((i) => i.key === `Ticket:${refId}`)?.seats ?? 0;
  }

  function setSeats(tt: EventTicketType, seats: number) {
    const key = `Ticket:${tt.eventTicketTypesId}`;
    if (seats <= 0) {
      removeKey(key);
      return;
    }
    upsert({
      key,
      kind: 'Ticket',
      refId: tt.eventTicketTypesId,
      label: tt.label,
      seats,
      // eslint-disable-next-line
      subtotal: tt.priceCents * seats,
      // eslint-disable-next-line
      fee: tt.platformFeeCents * seats,
    });
  }

  return (
    <div ref={containerRef}>
      <Card className="border border-hairline-strong bg-card rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-hairline-soft px-6 py-4">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Ticket className="size-4.5" />
          </span>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-ink font-display">Admission Tiers</CardTitle>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Select ticket quantity below</p>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">
              Loading admissions…
            </div>
          ) : null}
          
          {!loading && (ticketTypes ?? []).length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No admission tickets are available currently.</p>
          ) : null}

          {(ticketTypes ?? []).map((tt, index) => {
            const qty = seatsFor(tt.eventTicketTypesId);
            const max = tt.maxQuantity && tt.maxQuantity > 0 ? tt.maxQuantity : undefined;
            const isPopular = index === 0;

            return (
              <div
                key={tt.eventTicketTypesId}
                data-ticket-tier-card
                className={cn(
                  "relative flex items-center justify-between rounded-2xl border p-5 overflow-hidden transition-all duration-300 bg-card",
                  isPopular 
                    ? 'border-primary/40 bg-gradient-to-r from-card to-primary/[0.03] shadow-md hover:shadow-lg' 
                    : 'border-border hover:border-primary/20 shadow-sm hover:shadow-md'
                )}
              >
                {/* Premium Ticket Notches (Stub look) */}
                <div 
                  className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-canvas border-r border-border transition-colors" 
                  style={{ '--svyne-notch': 'var(--background)' } as React.CSSProperties}
                />
                <div 
                  className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-canvas border-l border-border transition-colors"
                  style={{ '--svyne-notch': 'var(--background)' } as React.CSSProperties}
                />

                <div className="pl-3 pr-4 relative min-w-0">
                  {isPopular && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary text-[8px] font-black uppercase tracking-wider text-white px-2 py-0.5 mb-2 shadow-sm border border-primary/20">
                      ★ RECOMMEND CHOICE
                    </span>
                  )}
                  <span className="block font-black text-lg text-ink font-display tracking-tight leading-tight">
                    {tt.label}
                  </span>
                  
                  {tt.description ? (
                    <span className="block text-xs text-body mt-1 max-w-[200px] sm:max-w-md truncate">
                      {tt.description}
                    </span>
                  ) : null}
                  
                  <span className="block text-sm font-black text-primary mt-2">
                    {centsToUSD(feesIncluded ? addCents(tt.priceCents, tt.platformFeeCents) : tt.priceCents)}
                    <span className="text-[10px] text-muted-foreground font-semibold"> each</span>
                    {!feesIncluded && tt.platformFeeCents > 0 ? (
                      <span className="text-[9px] text-muted-foreground font-medium block sm:inline">
                        {' '}
                        (+ {centsToUSD(tt.platformFeeCents)} platform fee)
                      </span>
                    ) : null}
                  </span>
                </div>

                {/* Perforation vertical separation line */}
                <div className="flex items-center gap-2 border-l border-dashed border-hairline-strong pl-6 py-4 relative shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={qty <= 0}
                    onClick={() => setSeats(tt, qty - 1)}
                    className="size-9 rounded-xl border-hairline-strong hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-90 font-black cursor-pointer"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <div className="w-8 text-center font-black text-sm text-ink select-none font-display">
                    {qty}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={max !== undefined && qty >= max}
                    onClick={() => setSeats(tt, qty + 1)}
                    className="size-9 rounded-xl border-hairline-strong hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-90 font-black cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// TABLE SEATING SECTION REDESIGN (VIP BLUEPRINT FLOORPLAN MAP)
// -------------------------------------------------------------
const OBJECT_GLYPH: Record<string, string> = { Entry: '🚪', Exit: '🚪', Stage: '🎭' };
function shapeRadius(shape: string): string {
  switch (shape) {
    case 'Round':
    case 'Cocktail':
      return 'rounded-full';
    case 'Square':
      return 'rounded-none';
    default:
      return 'rounded-xl';
  }
}

interface HoveredTable extends Table {
  capacity: number;
  type?: { label: string; color?: string; shape?: string; capacity?: number };
  priceCents: number;
}

function TableSection({
  eventsId,
  feesIncluded,
  inCart,
  upsert,
  removeKey,
}: {
  eventsId: string;
  feesIncluded: boolean;
  inCart: (key: string) => boolean;
  upsert: (i: CartItem) => void;
  removeKey: (key: string) => void;
}) {
  const layoutLoader = useCallback(() => getEventLayout(eventsId), [eventsId]);
  const { data: layout, loading } = useAsync(layoutLoader);
  const typesLoader = useCallback(() => listEventTableTypes(eventsId), [eventsId]);
  const { data: types } = useAsync(typesLoader);
  const typeById = useMemo(() => new Map((types ?? []).map((t) => [t.eventTablesId, t])), [types]);

  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<HoveredTable | null>(null);

  const canvas = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const t of layout?.tables ?? []) {
      w = Math.max(w, t.posX + (t.width || 80));
      h = Math.max(h, t.posY + (t.height || 80));
    }
    for (const o of layout?.objects ?? []) {
      w = Math.max(w, o.posX + (o.width || 80));
      h = Math.max(h, o.posY + (o.height || 80));
    }
    return { w: w + 48, h: h + 48 };
  }, [layout]);

  function capacityOf(table: Table): number {
    return table.capacityOverride || typeById.get(table.eventTablesId)?.capacity || 1;
  }

  async function toggleTable(table: Table) {
    const key = `Table:${table.tablesId}`;
    if (inCart(key)) {
      removeKey(key);
      return;
    }
    const cap = capacityOf(table);
    setPending(table.tablesId);
    setErr(null);
    try {
      let subtotal = table.priceCents;
      let fee = table.platformFeeCents;
      if (table.pricesId) {
        const b = await calculatePrice(table.pricesId, cap);
        subtotal = b.subtotalCents;
        fee = b.feeCents;
      }
      upsert({ key, kind: 'Table', refId: table.tablesId, label: table.label, seats: cap, subtotal, fee });
    } catch (caught) {
      setErr(rpcErrorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="border border-hairline-strong bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-hairline-soft px-6 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Users className="size-4.5" />
        </span>
        <div>
          <CardTitle className="text-xl font-black uppercase tracking-tight text-ink font-display">VIP Table Booking</CardTitle>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Select a lounge table to reserve the whole block</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">
            Loading floor plan layout…
          </div>
        ) : null}
        
        {!loading && (layout?.tables ?? []).length === 0 ? (
          <p className="text-center py-6 text-sm text-muted-foreground">No VIP layouts are published for this event.</p>
        ) : null}
        
        {err ? (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-bold leading-normal">
            {err}
          </div>
        ) : null}

        {layout && (layout.tables.length > 0 || layout.objects.length > 0) ? (
          <div className="space-y-4">
            {/* FLOOPLAN MAP (LIGHT PAPER BLUEPRINT LOUNGE VISUALIZATION) */}
            <div className="overflow-auto rounded-2xl border border-hairline-strong bg-[#f4ece3] p-4 shadow-inner relative select-none">
              
              {/* Premium blueprint grid background pattern */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(36, 21, 34, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(36, 21, 34, 0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="relative" style={{ width: canvas.w, height: canvas.h }}>
                
                {/* 1. LAYOUT STATIC STAGE/ENTRY OBJECTS */}
                {layout.objects.map((o) => (
                  <div
                    key={o.layoutObjectsId}
                    title={o.objectType}
                    style={{ 
                      position: 'absolute', 
                      left: o.posX, 
                      top: o.posY, 
                      width: o.width || 80, 
                      height: o.height || 80 
                    }}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-strong bg-card text-ink text-[10px] font-extrabold uppercase tracking-wider shadow-sm"
                  >
                    <span className="text-lg mb-1">{OBJECT_GLYPH[o.objectType] ?? '⚙'}</span>
                    {o.objectType}
                  </div>
                ))}

                {/* 2. LAYOUT INTERACTIVE SEATING TABLES */}
                {layout.tables.map((table) => {
                  const type = typeById.get(table.eventTablesId);
                  const isAvailable = table.status === 'Available';
                  const isSelected = inCart(`Table:${table.tablesId}`);
                  const capacity = capacityOf(table);
                  const baseColor = table.colorOverride || type?.color || '#a4123f';
                  const shape = table.shapeOverride || type?.shape || 'Rectangle';

                  // Dynamic color styles
                  const bgStyle = isSelected
                    ? 'var(--primary)'
                    : isAvailable 
                      ? '#ffffff' 
                      : '#e7d9cb';

                  const textStyle = isSelected
                    ? 'text-white'
                    : isAvailable
                      ? 'text-ink'
                      : 'text-[#6b5a66]/60';

                  return (
                    <button
                      key={table.tablesId}
                      type="button"
                      disabled={!isAvailable || pending === table.tablesId}
                      onMouseEnter={() => isAvailable && setHoveredTable({ ...table, capacity, type, priceCents: table.priceCents })}
                      onMouseLeave={() => setHoveredTable(null)}
                      onClick={() => toggleTable(table)}
                      style={{
                        position: 'absolute',
                        left: table.posX,
                        top: table.posY,
                        width: table.width || 80,
                        height: table.height || 80,
                        backgroundColor: bgStyle,
                        border: isSelected ? '2px solid var(--primary)' : isAvailable ? `3px solid ${baseColor}` : '1px solid #e7d9cb',
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center text-[10px] font-bold transition-all duration-300 shadow-sm",
                        shapeRadius(shape),
                        textStyle,
                        isAvailable 
                          ? 'cursor-pointer hover:scale-106 hover:shadow-[0_4px_12px_rgba(36,21,34,0.15)] hover:z-20' 
                          : 'cursor-not-allowed opacity-65',
                        isSelected 
                          ? 'ring-4 ring-primary ring-offset-2 ring-offset-[#f4ece3] scale-106 shadow-lg z-20 font-black' 
                          : ''
                      )}
                    >
                      {isAvailable ? (
                        <>
                          <span className="font-extrabold text-[11px] font-display">{table.label}</span>
                          <span className="text-[8px] opacity-80 mt-0.5">{capacity} pax</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[9px] font-semibold">
                          🔒 {table.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LIVE DYNAMIC TOOLTIP DETAILS CARD */}
            {hoveredTable ? (
              <div className="bg-[#241522] text-[#fff7f2] p-4 rounded-xl border border-white/10 shadow-lg flex items-center justify-between transition-opacity duration-300">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-marigold animate-pulse">Hovering View</span>
                  <h4 className="text-sm font-black uppercase font-display">{hoveredTable.label} · {hoveredTable.type?.label || 'VIP Seating'}</h4>
                  <p className="text-[10px] text-on-dark-soft">Fits up to {hoveredTable.capacity} guests comfortably</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-white block">
                    {centsToUSD(hoveredTable.priceCents)}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold block">Available to Book</span>
                </div>
              </div>
            ) : null}

            {/* Legend & Instructions info block */}
            <div className="p-4 bg-muted border border-[#e7d9cb]/50 rounded-xl flex items-start gap-2.5 text-xs text-body leading-relaxed">
              <Info className="size-4.5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-ink">Lounge Booking Rules</p>
                <p className="text-[11px]">
                  Tap any colored table shape to reservation the entire table capacity block. Locked/Held seats appear gray with lock icons.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t border-hairline-strong mt-1.5 text-[9px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><span className="size-3 rounded border-2 border-primary bg-white" /> Available Seating</div>
                  <div className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> Selected Table</div>
                  <div className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#e7d9cb] border border-[#e7d9cb]" /> Occupied Table</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* FALLBACK SIMPLE VIEW (If canvas positions aren't configured) */
          <div className="flex flex-wrap gap-3">
            {(layout?.tables ?? []).map((table) => {
              const sel = inCart(`Table:${table.tablesId}`);
              const isAvailable = table.status === 'Available';
              const cap = capacityOf(table);

              return (
                <Button
                  key={table.tablesId}
                  size="sm"
                  variant={sel ? 'default' : 'outline'}
                  disabled={!isAvailable || pending === table.tablesId}
                  onClick={() => toggleTable(table)}
                  className={cn(
                    "rounded-xl px-4 py-5 font-bold text-xs cursor-pointer",
                    sel ? 'bg-primary text-white border-primary shadow-md' : 'border-hairline-strong'
                  )}
                >
                  {!isAvailable ? '🔒 ' : ''}
                  {table.label}
                  {' · '}
                  {centsToUSD(feesIncluded ? addCents(table.priceCents, table.platformFeeCents) : table.priceCents)}
                  {' · '}
                  {cap} Seats
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
