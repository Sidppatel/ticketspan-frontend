import { useCallback, useMemo, useState, useEffect } from 'react';
import { ShieldCheck, Ticket, Users, Flame } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventBySlug } from '@/features/public/services/publicEventService';
import { listEventTicketTypes } from '@/features/public/services/paymentService';
import { listPricesForEvent, calculatePrice } from '@/features/admin/services/pricingService';

import { Hero } from '@/features/public/components/Hero';
import { EventTimeline } from '@/features/public/components/EventTimeline';
import { EventExtraInfo } from '@/features/public/components/EventExtraInfo';
import { EventPerformers } from '@/features/public/components/EventPerformers';
import { EventSponsors } from '@/features/public/components/EventSponsors';
import { EventSeatingMap } from '@/features/public/components/EventSeatingMap';
import { VenueCard } from '@/features/public/components/VenueCard';
import { EventFooter } from '@/features/public/components/EventFooter';
import { CheckoutDrawer } from '@/features/public/components/checkout/CheckoutDrawer';
import { TicketCard } from '@/features/public/components/TicketCard';
import { SectionTitle } from '@/features/public/components/SectionTitle';

import { Seo } from '@/shared/components/Seo';
import { imageUrl } from '@/shared/upload';
import { createMultiBooking, quoteCart } from '@/features/public/services/paymentService';
import {
  type CartItem,
  savePendingCart,
  takePendingCart,
} from '@/features/public/services/pendingCart';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { FLAGS } from '@/shared/lib/flags';
import type { Event } from '@/shared/proto/event';
import Lenis from 'lenis';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900 text-white">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="size-10 rounded-full border-4 border-white/10 border-t-accent-burgundy animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-white/60">Configuring Svyne experience…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-4 text-center">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-ink font-display">Event details offline</h2>
          <p className="text-sm text-body">{error || 'This link may have expired or is incorrect.'}</p>
        </div>
      </div>
    );
  }

  return <EventDetailPageContent event={event} />;
}

function EventDetailPageContent({ event }: { event: Event }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Checkout Drawer States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBookingsId, setCheckoutBookingsId] = useState('');

  // Cart & Booking States: Initialize cart synchronously from pending cart on mount
  const [cart, setCart] = useState<CartItem[]>(() => takePendingCart(event.eventsId));
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    savePendingCart(event.eventsId, cart);
  }, [cart, event.eventsId]);

  // Smooth scroll Lenis integration
  useEffect(() => {
    if (!FLAGS.newMotion) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);

  // Fetch ticket types to determine minimum entry price
  const ticketTypesLoader = useCallback(() => {
    return listEventTicketTypes(event.eventsId);
  }, [event.eventsId]);
  
  const { data: ticketTypes } = useAsync(ticketTypesLoader);

  const pricingLoader = useCallback(async () => {
    try {
      const prices = await listPricesForEvent(event.eventsId);
      const tiers = prices.filter((p) => p.pricingType === 'TicketTier');
      const entries = await Promise.all(
        tiers.map(async (p) => [p.name.toLowerCase(), await calculatePrice(p.pricesId, 1)] as const),
      );
      return new Map(entries);
    } catch {
      return null;
    }
  }, [event.eventsId]);

  const { data: tierPricing } = useAsync(pricingLoader);

  const admissionTiers = useMemo(() => {
    if (!ticketTypes) return [];
    return ticketTypes.map((tt) => {
      const bd = tierPricing?.get(tt.label.toLowerCase());
      const discountedPriceCents =
        bd && bd.sellingPriceCents !== bd.basePriceCents ? bd.sellingPriceCents : undefined;
      return { ...tt, discountedPriceCents };
    });
  }, [ticketTypes, tierPricing]);
  
  const minPriceCents = useMemo(() => {
    if (admissionTiers.length === 0) return undefined;
    return Math.min(...admissionTiers.map((tt) => tt.discountedPriceCents || tt.priceCents));
  }, [admissionTiers]);

  const upsert = useCallback((item: CartItem) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.key !== item.key);
      const updated = [...next, item];
      console.log('[Telemetry]: ticket_selection_changed', item);
      return updated;
    });
  }, []);

  const removeKey = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const cartKey = cart.map((i) => `${i.key}x${i.seats}`).join('|');
  const quoteLoader = useCallback(async () => {
    if (cart.length === 0) return null;
    return quoteCart(
      event.eventsId,
      cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, event.eventsId]);
  const { data: quote } = useAsync(quoteLoader);

  const subtotal = quote?.subtotalCents ?? 0;
  const fee = quote?.feeCents ?? 0;
  const total = quote?.totalCents ?? 0;
  const discount = quote?.discountCents ?? 0;

  async function handleCheckout() {
    console.log('[Telemetry]: hero_cta_clicked');

    if (!isAuthenticated) {
      savePendingCart(event.eventsId, cart);
      setReturnTo(location.pathname + location.search);
      navigate('/login');
      return;
    }

    console.log('[Telemetry]: checkout_drawer_opened');

    setBusy(true);
    setBookingError(null);
    try {
      const { bookingsId } = await createMultiBooking(
        event.eventsId,
        cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
      );

      if (FLAGS.checkoutDrawer) {
        setCheckoutBookingsId(bookingsId);
        setIsCheckoutOpen(true);
      } else {
        navigate(`/checkout/${bookingsId}`);
      }
    } catch (caught) {
      setBookingError(rpcErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const scrollToBooking = () => {
    document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClose = (completed = false) => {
    setIsCheckoutOpen(false);
    setCheckoutBookingsId('');
    if (completed) {
      setCart([]);
    }
  };

  const showTickets = event.eventType === 'Open' || event.eventType === 'Both';
  const showTables = event.eventType === 'Table' || event.eventType === 'Both';

  return (
    <div className="w-full bg-surface-canvas min-h-screen pb-24">
      <Seo
        title={event.title}
        description={event.description}
        image={event.primaryImageId ? imageUrl(event.primaryImageId) : undefined}
      />

      {/* Chapter 1: Immersive Dark Hero */}
      <Hero 
        event={event} 
        onGetTickets={scrollToBooking} 
        minPriceCents={minPriceCents}
      />

      {/* Chapter 2: The Core Booking Panel */}
      <div id="booking-panel" className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          
          {/* Left Column: Tickets & VIP Seating Map */}
          <div className="space-y-12">
            
            {/* Live Inventory Demand Alert */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-border-strong p-5 shadow-sm flex items-start gap-4">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent-burgundy" />
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-burgundy/10 text-accent-burgundy border border-accent-burgundy/25">
                <Flame className="size-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-ink font-display flex items-center gap-1.5">
                  High Ticket Demand Alert
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h4>
                <p className="text-[11px] text-body leading-relaxed font-sans font-medium">
                  VIP tables and admission releases are held in real-time. Secure your spot now to lock in current rates.
                </p>
              </div>
            </div>

            {/* Admission Tiers */}
            {showTickets && (
              <div className="space-y-4">
                <SectionTitle 
                  title="Admission Tiers" 
                  subtitle="Select ticket options below" 
                  icon={Ticket} 
                />
                <div className="space-y-3">
                  {!ticketTypes ? (
                    <div className="py-8 text-center text-xs text-muted-foreground font-bold animate-pulse">
                      Loading admissions…
                    </div>
                  ) : admissionTiers.length === 0 ? (
                    <p className="text-center py-6 text-sm text-muted-foreground font-medium">
                      No admission tickets available currently.
                    </p>
                  ) : (
                    admissionTiers.map((tt, index) => {
                      const qty = cart.find((i) => i.key === `Ticket:${tt.eventTicketTypesId}`)?.seats || 0;
                      return (
                        <TicketCard
                          key={tt.eventTicketTypesId}
                          label={tt.label}
                          description={tt.description}
                          priceCents={tt.priceCents}
                          platformFeeCents={tt.platformFeeCents}
                          feesIncluded={event.feesIncluded}
                          quantity={qty}
                          maxQuantity={tt.maxQuantity || undefined}
                          isPopular={index === 0}
                          discountedPriceCents={tt.discountedPriceCents}
                          onQuantityChange={(newQty) => {
                            const key = `Ticket:${tt.eventTicketTypesId}`;
                            if (newQty <= 0) {
                              removeKey(key);
                            } else {
                              upsert({
                                key,
                                kind: 'Ticket',
                                refId: tt.eventTicketTypesId,
                                label: tt.label,
                                seats: newQty,
                              });
                            }
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Interactive VIP Seating Map */}
            {showTables && (
              <div className="space-y-4">
                <SectionTitle 
                  title="VIP Lounge Booking" 
                  subtitle="Select a VIP table layout to reserve the block" 
                  icon={Users} 
                />
                <EventSeatingMap
                  eventsId={event.eventsId}
                  feesIncluded={event.feesIncluded}
                  cart={cart}
                  upsert={upsert}
                  removeKey={removeKey}
                />
              </div>
            )}

            {/* Event Description */}
            {event.description && (
              <div className="py-8 border-t border-border-soft space-y-3">
                <SectionTitle title="Story & Details" />
                <p className="whitespace-pre-line leading-relaxed text-body text-sm font-medium font-sans max-w-3xl">
                  {event.description}
                </p>
              </div>
            )}

            {/* Lineup / Performers */}
            {event.performersJson && (
              <div className="pt-6">
                <EventPerformers performersJson={event.performersJson} />
              </div>
            )}

            {/* Event Timeline */}
            <div className="pt-6">
              <EventTimeline eventsId={event.eventsId} />
            </div>

            {/* Venue Card Address & Map details */}
            <div className="pt-6">
              <VenueCard venuesId={event.venuesId} />
            </div>

            {/* FAQs / Extra Guidelines Info */}
            {event.extraInfoJson && (
              <div className="pt-6">
                <EventExtraInfo extraInfoJson={event.extraInfoJson} />
              </div>
            )}

            {/* Sponsors logo cloud */}
            {event.sponsorsJson && (
              <div className="pt-6">
                <EventSponsors sponsorsJson={event.sponsorsJson} />
              </div>
            )}

          </div>

          {/* Right Column: Checkout Dock */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            <Card className="overflow-hidden border border-border-strong bg-card shadow-md rounded-2xl">
              <div className="bg-muted px-6 py-4 border-b border-border-strong flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground font-display">Order Summary</span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" /> secure server
                </span>
              </div>

              <CardContent className="p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Ticket className="size-8 stroke-1 mx-auto text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Your cart is empty</p>
                    <p className="text-[10px] text-muted-foreground/60 leading-normal max-w-[200px] mx-auto">
                      Select general entry tickets or lounge tables above to proceed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="divide-y divide-border-soft">
                      {cart.map((item) => {
                        const line = quote?.lines.find((l) => `${l.kind}:${l.refId}` === item.key);
                        const linePrice = event.feesIncluded
                          ? line?.breakdown?.finalPriceCents
                          : line?.breakdown?.sellingPriceCents;
                        return (
                          <div key={item.key} className="flex items-center justify-between py-3 text-xs">
                            <div className="space-y-1 min-w-0 pr-3">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-accent-burgundy/10 text-accent-burgundy border border-accent-burgundy/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                  {item.kind}
                                </span>
                                <span className="font-extrabold text-foreground truncate block max-w-[130px]">{item.label}</span>
                              </div>
                              <span className="text-muted-foreground/75 font-semibold block">
                                {item.seats} {item.seats === 1 ? 'seat' : 'seats'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-foreground">
                                {linePrice !== undefined ? centsToUSD(linePrice) : '—'}
                              </span>
                              <button
                                className="text-danger font-bold text-[10px] uppercase hover:underline cursor-pointer"
                                onClick={() => removeKey(item.key)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-border-strong pt-4 space-y-2">
                      {event.feesIncluded ? (
                        <div className="space-y-1 text-xs">
                          {discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>You save</span>
                              <span>{centsToUSD(discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm font-black text-foreground uppercase tracking-wider font-display">
                            <span>Total (incl. fees)</span>
                            <span>{centsToUSD(total)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          {discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span>You save</span>
                              <span>{centsToUSD(discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="font-semibold">{centsToUSD(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Fees</span>
                            <span className="font-semibold">{centsToUSD(fee)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-black text-foreground border-t border-border-soft pt-2 uppercase tracking-wider font-display">
                            <span>Total amount</span>
                            <span>{centsToUSD(total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-[10px] font-bold leading-normal">
                    {bookingError}
                  </div>
                )}

                <Button 
                  disabled={busy || cart.length === 0 || total <= 0} 
                  onClick={handleCheckout} 
                  className={cn(
                    'w-full py-6 text-xs uppercase font-black tracking-widest rounded-xl transition-all duration-300 shadow-md',
                    cart.length > 0 && total > 0 
                      ? 'bg-accent-burgundy hover:bg-accent-burgundy/95 text-white shadow-[0_8px_20px_rgba(164,18,63,0.3)] hover:-translate-y-0.5' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {busy ? 'Securing Spot…' : 'Secure my tickets'}
                </Button>
              </CardContent>
            </Card>

            {/* Booking Trust Signals */}
            <div className="rounded-2xl border border-border-strong bg-card p-5 space-y-4 shadow-sm text-xs">
              <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-wider border-b border-border-soft pb-3 font-display">
                <ShieldCheck className="size-4 text-emerald-600" /> Guaranteed Verified Tickets
              </div>
              <div className="space-y-3 font-sans text-body">
                <div className="flex gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-bold text-foreground">Instant Wallet Delivery:</span> Entry tickets arrive in your inbox and account profile immediately upon checkout completion.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-bold text-foreground">Refund Policy:</span> All ticket sales are final and non-refundable.
                  </p>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Floating Bottom Action Bar for Mobile */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-white/10 bg-surface-900/95 backdrop-blur-md px-6 py-4 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Selected total</span>
            <span className="text-sm font-black text-white font-display uppercase">
              {centsToUSD(total)}
            </span>
          </div>
          <Button 
            onClick={handleCheckout}
            disabled={busy}
            className="px-6 py-5 bg-accent-burgundy hover:bg-accent-burgundy/90 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg"
          >
            {busy ? 'Securing…' : 'Secure spot'}
          </Button>
        </div>
      )}

      {/* Same-page Multi-step Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={handleClose}
        bookingsId={checkoutBookingsId}
        cartTotalCents={total}
      />

      {/* Visual Footer */}
      <EventFooter organizerName={event.category || 'Special Events'} />
    </div>
  );
}
