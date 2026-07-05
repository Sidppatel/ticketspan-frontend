import { useCallback, useMemo, useState, useEffect } from 'react';
import { ShieldCheck, Ticket, Users } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventBySlug } from '@/features/public/services/publicEventService';
import { listEventTicketTypes } from '@/features/public/services/paymentService';
import { minTicketPriceCents } from '@/features/public/lib/discover';

import { Hero } from '@/features/public/components/Hero';
import { EventTimeline } from '@/features/public/components/EventTimeline';
import { EventExtraInfo } from '@/features/public/components/EventExtraInfo';
import { EventPerformers } from '@/features/public/components/EventPerformers';
import { EventSponsors } from '@/features/public/components/EventSponsors';
import { EventSeatingMap } from '@/features/public/components/EventSeatingMap';
import { VenueCard } from '@/features/public/components/VenueCard';
import { EventFooter } from '@/features/public/components/EventFooter';
import { CheckoutDrawer } from '@/features/public/components/checkout/CheckoutDrawer';
import { DeltaStrip } from '@/features/public/components/event/DeltaStrip';
import { rememberEventVisit } from '@/features/public/lib/eventMemory';
import { TicketCard } from '@/features/public/components/TicketCard';
import { SectionTitle } from '@/features/public/components/SectionTitle';

import { Seo } from '@/shared/components/Seo';
import { imageUrl } from '@/shared/upload';
import { createMultiBooking, quoteCart } from '@/features/public/services/paymentService';
import {
  type CartItem,
  DEFAULT_HOLD_SECONDS,
  clearOtherPendingCarts,
  savePendingCart,
  takePendingCart,
} from '@/features/public/services/pendingCart';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import type { Event } from '@/shared/proto/event';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stage text-on-stage">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-on-stage/10 border-t-brand" />
          <p className="text-sm text-on-stage-soft">Loading event…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-4 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="font-display text-2xl font-semibold text-ink">We can't find that event</h2>
          <p className="text-sm text-ink-soft">{error || 'The link may be outdated — check the address or head back to browse events.'}</p>
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

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBookingsId, setCheckoutBookingsId] = useState('');
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'ach'>('card');

  const [cart, setCart] = useState<CartItem[]>(() => {
    clearOtherPendingCarts(event.eventsId);
    return takePendingCart(event.eventsId);
  });
  const [delta] = useState(() => rememberEventVisit(event));
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const ticketTypesLoader = useCallback(() => {
    return listEventTicketTypes(event.eventsId);
  }, [event.eventsId]);

  const { data: ticketTypes } = useAsync(ticketTypesLoader);

  const admissionTiers = useMemo(() => ticketTypes ?? [], [ticketTypes]);
  const minPriceCents = useMemo(() => minTicketPriceCents(admissionTiers), [admissionTiers]);

  const upsert = useCallback((item: CartItem) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.key !== item.key);
      return [...next, item];
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

  const holdSeconds = quote?.holdSeconds || DEFAULT_HOLD_SECONDS;

  useEffect(() => {
    savePendingCart(event.eventsId, cart, holdSeconds);
  }, [cart, event.eventsId, holdSeconds]);

  const subtotal = quote?.subtotalCents ?? 0;
  const fee = quote?.feeCents ?? 0;
  const total = quote?.totalCents ?? 0;
  const discount = quote?.discountCents ?? 0;
  const achAvailable = quote?.achAvailable ?? false;
  const achTotal = quote?.achTotalCents ?? 0;
  const achSavings = quote?.achSavingsCents ?? 0;

  async function handleCheckout(method: 'card' | 'ach' = 'card') {
    if (!isAuthenticated) {
      savePendingCart(event.eventsId, cart, holdSeconds);
      setReturnTo(location.pathname + location.search);
      navigate('/login');
      return;
    }

    setBusy(true);
    setBookingError(null);
    try {
      const { bookingsId } = await createMultiBooking(
        event.eventsId,
        cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
      );
      setCheckoutMethod(method);
      setCheckoutBookingsId(bookingsId);
      setIsCheckoutOpen(true);
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

      {delta ? <DeltaStrip delta={delta} /> : null}

      <div id="booking-panel" className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          
          {/* Left Column: Tickets & VIP Seating Map */}
          <div className="space-y-12">
            
            {showTickets && (
              <div className="space-y-4">
                <SectionTitle
                  title="Tickets"
                  subtitle="Choose your admission"
                  icon={Ticket}
                />
                <div className="space-y-3">
                  {!ticketTypes ? (
                    <div className="py-8 text-center text-sm text-ink-soft">Loading tickets…</div>
                  ) : admissionTiers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-soft">
                      No tickets on sale right now.
                    </p>
                  ) : (
                    admissionTiers.map((tt, index) => {
                      const qty = cart.find((i) => i.key === `Ticket:${tt.eventTicketTypesId}`)?.seats || 0;
                      const availableQuantity = tt.capacity > 0 ? Math.max(0, tt.capacity - tt.soldCount) : undefined;
                      
                      return (
                        <TicketCard
                          key={tt.eventTicketTypesId}
                          label={tt.label}
                          description={tt.description}
                          priceCents={tt.priceCents}
                          platformFeeCents={tt.platformFeeCents}
                          feesIncluded={event.feesIncluded}
                          achAvailable={achAvailable}
                          quantity={qty}
                          maxQuantity={tt.maxQuantity || undefined}
                          availableQuantity={availableQuantity}
                          isPopular={index === 0}
                          discountedPriceCents={
                            tt.sellingPriceCents > 0 && tt.sellingPriceCents < tt.priceCents
                              ? tt.sellingPriceCents
                              : undefined
                          }
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
            <Card className="overflow-hidden border border-border bg-card shadow-md rounded-2xl">
              <div className="flex items-center justify-between border-b border-hairline bg-surface-sunken px-6 py-4">
                <span className="font-display text-sm font-semibold text-ink">Your order</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <ShieldCheck className="size-3.5 text-success" /> Secure checkout
                </span>
              </div>

              <CardContent className="p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="space-y-3 py-8 text-center">
                    <Ticket className="mx-auto size-8 stroke-1 text-ink-faint" />
                    <p className="text-sm font-medium text-ink">Nothing selected yet</p>
                    <p className="mx-auto max-w-[220px] text-xs leading-relaxed text-ink-soft">
                      Pick tickets or a table and your order appears here.
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
                                <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                                  {item.kind}
                                </span>
                                <span className="block max-w-[130px] truncate font-semibold text-foreground">{item.label}</span>
                              </div>
                              <span className="block text-ink-soft">
                                {item.seats} {item.seats === 1 ? 'seat' : 'seats'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono font-medium text-foreground">
                                {linePrice !== undefined ? centsToUSD(linePrice) : '—'}
                              </span>
                              <button
                                className="cursor-pointer text-xs font-medium text-ink-faint hover:text-destructive hover:underline"
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
                      <div className="space-y-1.5 text-xs">
                        {discount > 0 && (
                          <div className="flex justify-between font-medium text-success">
                            <span>You save</span>
                            <span className="font-mono">{centsToUSD(discount)}</span>
                          </div>
                        )}
                        {!event.feesIncluded && (
                          <>
                            <div className="flex justify-between text-ink-soft">
                              <span>Subtotal</span>
                              <span className="font-mono">{centsToUSD(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-ink-soft">
                              <span>Fees</span>
                              <span className="font-mono">{centsToUSD(fee)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between border-t border-hairline pt-2 text-sm font-semibold text-foreground">
                          <span>{event.feesIncluded ? 'Total (incl. fees)' : 'Total'}</span>
                          <span className="font-mono">{centsToUSD(total)}</span>
                        </div>
                        {achAvailable && achSavings > 0 && (
                          <div className="flex items-center justify-between rounded-lg bg-success/10 border border-success/20 px-2.5 py-1.5 text-success">
                            <span className="font-semibold">Pay by bank (ACH)</span>
                            <span className="font-mono font-semibold">
                              {centsToUSD(achTotal)} · save {centsToUSD(achSavings)}
                            </span>
                          </div>
                        )}
                      </div>
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
                  onClick={() => handleCheckout('card')}
                  size="lg"
                  className="w-full"
                >
                  {busy ? 'Reserving…' : 'Continue to checkout'}
                </Button>
                {achAvailable && achSavings > 0 && (
                  <Button
                    disabled={busy || cart.length === 0 || total <= 0}
                    onClick={() => handleCheckout('ach')}
                    size="lg"
                    variant="outline"
                    className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success"
                  >
                    {busy ? 'Reserving…' : `Pay by bank — save ${centsToUSD(achSavings)}`}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3 rounded-lg border border-hairline bg-surface p-5 text-xs">
              <div className="flex items-center gap-2 border-b border-hairline pb-3 font-display text-sm font-semibold text-foreground">
                <ShieldCheck className="size-4 text-success" /> How your tickets work
              </div>
              <p className="leading-relaxed text-ink-soft">
                <span className="font-semibold text-foreground">Instant delivery.</span> Tickets appear
                in your account and inbox the moment payment completes.
              </p>
              <p className="leading-relaxed text-ink-soft">
                <span className="font-semibold text-foreground">All sales final.</span> Tickets are
                non-refundable once purchased.
              </p>
            </div>
          </aside>

        </div>
      </div>

      {/* Floating Bottom Action Bar for Mobile */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-stage-elevated bg-stage/95 px-6 py-4 shadow-[var(--shadow-e2)] backdrop-blur-md md:hidden">
          <div className="flex flex-col">
            <span className="text-xs text-on-stage-soft">Total</span>
            <span className="font-mono text-base font-medium text-on-stage">{centsToUSD(total)}</span>
          </div>
          <Button onClick={() => handleCheckout('card')} disabled={busy} size="lg" className="px-8">
            {busy ? 'Reserving…' : 'Checkout'}
          </Button>
        </div>
      )}

      {/* Same-page Multi-step Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={handleClose}
        bookingsId={checkoutBookingsId}
        cartTotalCents={checkoutMethod === 'ach' ? achTotal : total}
        preferredMethod={checkoutMethod}
      />

      {/* Visual Footer */}
      <EventFooter organizerName={event.category || 'Special Events'} />
    </div>
  );
}
