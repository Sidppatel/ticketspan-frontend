import { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getEventBySlug } from '@/features/public/services/publicEventService';
import { listEventTicketTypes } from '@/features/public/services/paymentService';
import { minTicketPriceCents } from '@/features/public/lib/discover';

import { BentoHeader } from '@/features/public/components/event/BentoHeader';
import { TicketPassDeck } from '@/features/public/components/event/TicketPassDeck';
import { PerformerBentoGrid } from '@/features/public/components/event/PerformerBentoGrid';
import { ScheduleStream } from '@/features/public/components/event/ScheduleStream';
import { VenueLogisticsBento } from '@/features/public/components/event/VenueLogisticsBento';
import { LoungeSeatingBento } from '@/features/public/components/event/LoungeSeatingBento';
import { BentoOrderSummary } from '@/features/public/components/event/BentoOrderSummary';
import { EventTabNav } from '@/features/public/components/EventTabNav';
import { EventMobileStickyBar } from '@/features/public/components/EventMobileStickyBar';
import { EventFooter } from '@/features/public/components/EventFooter';
import { CheckoutDrawer } from '@/features/public/components/checkout/CheckoutDrawer';
import { PersuasionBand } from '@/features/public/components/event/PersuasionBand';
import { DeltaStrip } from '@/features/public/components/event/DeltaStrip';
import { isTenantSubdomain, getUniversalLoginUrl } from '@/shared/subdomain';
import { buildPersuasion } from '@/features/public/lib/persuasion';
import { rememberEventVisit } from '@/features/public/lib/eventMemory';
import { GroupDiscountBanner } from '@/features/public/components/GroupDiscountBanner';
import { EventSponsors } from '@/features/public/components/EventSponsors';

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
import type { Event } from '@/shared/proto/event';

import { toast } from 'sonner';

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getEventBySlug(slug), [slug]);
  const { data: event, loading, error } = useAsync(loader);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stage text-on-stage">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-on-stage/10 border-t-brand" />
          <p className="text-sm text-on-stage-soft font-mono">Loading Bento Studio…</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-4 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Event Not Found</h2>
          <p className="text-sm text-ink-soft">{error || 'The link may be outdated or incorrect.'}</p>
        </div>
      </div>
    );
  }

  return <EventDetailPageContent event={event} />;
}

export function EventDetailPageContent({
  event,
  isPreview = false,
}: {
  event: Event;
  isPreview?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutBookingsId, setCheckoutBookingsId] = useState('');
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'ach'>('card');

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (isPreview) return [];
    clearOtherPendingCarts(event.eventsId);
    return takePendingCart(event.eventsId);
  });
  const [delta] = useState(() => (isPreview ? null : rememberEventVisit(event)));
  const [busy, setBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const ticketTypesLoader = useCallback(() => {
    return listEventTicketTypes(event.eventsId);
  }, [event.eventsId]);

  const { data: ticketTypes } = useAsync(ticketTypesLoader);

  const admissionTiers = useMemo(() => ticketTypes ?? [], [ticketTypes]);
  const minPriceCents = useMemo(() => minTicketPriceCents(admissionTiers), [admissionTiers]);
  const persuasion = useMemo(() => buildPersuasion(event, admissionTiers), [event, admissionTiers]);

  const upsert = useCallback((item: CartItem) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.key !== item.key);
      return [...next, item];
    });
  }, []);

  const removeKey = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const quoteLoader = useCallback(async () => {
    if (cart.length === 0) {
      return null;
    }
    return quoteCart(
      event.eventsId,
      cart.map((i) => ({ kind: i.kind, refId: i.refId, seats: i.kind === 'Ticket' ? i.seats : 0 })),
    );
  }, [cart, event.eventsId]);
  const { data: quote } = useAsync(quoteLoader);

  const holdSeconds = quote?.holdSeconds || DEFAULT_HOLD_SECONDS;

  useEffect(() => {
    if (isPreview) return;
    savePendingCart(event.eventsId, cart, holdSeconds);
  }, [cart, event.eventsId, holdSeconds, isPreview]);

  const total = quote?.totalCents ?? 0;
  const achAvailable = quote?.achAvailable ?? false;
  const achTotal = quote?.achTotalCents ?? 0;

  async function handleCheckout(method: 'card' | 'ach' = 'card') {
    if (isPreview) {
      toast.info('Preview Mode: Cart and pricing simulator is active. Live bookings are disabled.');
      return;
    }

    if (!isAuthenticated) {
      savePendingCart(event.eventsId, cart, holdSeconds);
      setReturnTo(location.pathname + location.search);
      if (isTenantSubdomain()) {
        window.location.href = getUniversalLoginUrl(window.location.href);
        return;
      }
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
    <div className="w-full bg-surface-canvas min-h-screen pb-24 md:pb-12">
      <Seo
        title={event.title}
        description={event.description}
        image={event.primaryImageId ? imageUrl(event.primaryImageId) : undefined}
      />

      <BentoHeader
        event={event}
        onGetTickets={scrollToBooking}
        minPriceCents={minPriceCents}
      />

      <EventTabNav
        hasPerformers={Boolean(event.performersJson && event.performersJson !== '[]')}
        hasSponsors={Boolean(event.sponsorsJson && event.sponsorsJson !== '[]')}
        hasTimeline={true}
        hasVenue={Boolean(event.venuesId)}
        hasExtraInfo={Boolean(event.extraInfoJson || event.description)}
      />

      <PersuasionBand persuasion={persuasion} onGetTickets={scrollToBooking} cartCount={cart.length} />

      {delta ? <DeltaStrip delta={delta} /> : null}

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-12 space-y-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-8 space-y-12 min-w-0">
            {showTickets && (
              <div id="booking-panel" className="space-y-4">
                <GroupDiscountBanner hint={quote?.groupDiscount} />
                <TicketPassDeck
                  admissionTiers={admissionTiers}
                  feesIncluded={event.feesIncluded}
                  achAvailable={achAvailable}
                  cart={cart}
                  upsert={upsert}
                  removeKey={removeKey}
                />
              </div>
            )}

            {showTables && (
              <LoungeSeatingBento
                eventsId={event.eventsId}
                feesIncluded={event.feesIncluded}
                cart={cart}
                upsert={upsert}
                removeKey={removeKey}
              />
            )}

            {event.performersJson && (
              <div id="performers-section">
                <PerformerBentoGrid performersJson={event.performersJson} />
              </div>
            )}

            {event.sponsorsJson && (
              <div id="sponsors-section">
                <EventSponsors sponsorsJson={event.sponsorsJson} />
              </div>
            )}

            <div id="schedule-section">
              <ScheduleStream eventsId={event.eventsId} />
            </div>

            <div id="venue-section">
              <VenueLogisticsBento
                venuesId={event.venuesId}
                extraInfoJson={event.extraInfoJson}
                description={event.storyDescription || event.description}
              />
            </div>
          </div>

          <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24">
            <BentoOrderSummary
              cart={cart}
              quote={quote}
              feesIncluded={event.feesIncluded}
              busy={busy}
              bookingError={bookingError}
              onRemoveKey={removeKey}
              onCheckout={handleCheckout}
            />
          </aside>
        </div>
      </main>

      <EventMobileStickyBar
        minPriceCents={minPriceCents}
        cartCount={cart.length}
        totalCents={total}
        busy={busy}
        onGetTickets={scrollToBooking}
        onCheckout={() => handleCheckout('card')}
      />

      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={handleClose}
        bookingsId={checkoutBookingsId}
        cartTotalCents={checkoutMethod === 'ach' ? achTotal : total}
        preferredMethod={checkoutMethod}
      />

      <EventFooter />
    </div>
  );
}
