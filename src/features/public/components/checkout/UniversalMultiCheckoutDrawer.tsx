import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { GuestInfoStep, type BuyerInfo } from './GuestInfoStep';
import { PaymentStep } from './PaymentStep';
import { ConfirmationReceipt } from '@/features/public/components/checkout/ConfirmationReceipt';
import { useCartStore } from '@/shared/lib/cartStore';
import { createMultiBooking, quoteCart, cartServiceFeeCents } from '@/features/public/services/paymentService';
import type { CartQuote } from '@/shared/proto/bookings';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { useNavigate, useLocation } from 'react-router-dom';
import { isTenantSubdomain, getUniversalLoginUrl } from '@/shared/subdomain';
import { BrandMark } from '@/shared/brand/BrandMark';
import { ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';
import { centsToUSD } from '@/shared/lib/format';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';

function calculateLineTotal(val1: number, val2: number): number {
  return val1 * val2;
}

interface UniversalMultiCheckoutDrawerProps {
  isOpen: boolean;
  onClose: (completed?: boolean) => void;
}

export function UniversalMultiCheckoutDrawer({
  isOpen,
  onClose,
}: UniversalMultiCheckoutDrawerProps) {
  const { items, subtotalCents, groupedByEvent, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: '', email: '', phone: '', billingZip: '' });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [bookingsId, setBookingsId] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, CartQuote>>({});

  const eventGroups = groupedByEvent();
  const eventIds = Object.keys(eventGroups);

  // Fetch quotes per event whenever drawer is open or items change
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      return;
    }

    const currentEventGroups = useCartStore.getState().groupedByEvent();
    const currentEventIds = Object.keys(currentEventGroups);

    let active = true;

    async function loadAllQuotes() {
      const results: Record<string, CartQuote> = {};
      for (const eventId of currentEventIds) {
        const groupItems = currentEventGroups[eventId] || [];
        const lines = groupItems.map((i) => ({
          kind: i.kind,
          refId: i.refId,
          seats: i.kind === 'Ticket' ? i.seats : 0,
        }));
        try {
          const q = await quoteCart(eventId, lines);
          results[eventId] = q;
        } catch {
          // fallback if individual quote fails
        }
      }
      if (active) {
        setQuotes(results);
      }
    }

    loadAllQuotes();
    return () => {
      active = false;
    };
  }, [isOpen, items]);

  // Aggregate totals across all event quotes
  let totalSubtotalCents = 0;
  let totalDiscountCents = 0;
  let totalServiceFeeCents = 0;
  let totalTaxCents = 0;
  let totalChargeCents = 0;

  for (const eventId of eventIds) {
    const q = quotes[eventId];
    const groupItems = eventGroups[eventId] || [];
    const fallbackSubtotal = groupItems.reduce((s, i) => s + calculateLineTotal(i.unitPriceCents, i.seats), 0);

    if (q) {
      totalSubtotalCents += q.subtotalCents;
      totalDiscountCents += q.discountCents;
      totalServiceFeeCents += cartServiceFeeCents(q);
      totalTaxCents += q.taxCents;
      totalChargeCents += q.totalCents;
    } else {
      totalSubtotalCents += fallbackSubtotal;
      totalChargeCents += fallbackSubtotal;
    }
  }

  const grandTotalCents = totalChargeCents > 0 ? totalChargeCents : subtotalCents();

  // When proceeding from step 1 to step 2, create the multi-event booking reservations
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      setReturnTo(location.pathname + location.search);
      if (isTenantSubdomain()) {
        window.location.href = getUniversalLoginUrl(window.location.href);
        return;
      }
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    try {
      // Primary event ID for multi-booking session
      const primaryEventId = items[0].eventId;
      const lines = items.map((i) => ({
        kind: i.kind,
        refId: i.refId,
        seats: i.kind === 'Ticket' ? i.seats : 0,
      }));

      const res = await createMultiBooking(primaryEventId, lines);
      setBookingsId(res.bookingsId);
      setStep(2);
    } catch (err) {
      const msg = rpcErrorMessage(err);
      setBookingError(msg);
      toast.error(msg || 'Failed to initialize booking.');
    }
  };

  const handleBack = () => {
    if (step === 1) {
      handleClose(false);
    }
    if (step === 2) setStep(1);
  };

  const handleClose = (completed = false) => {
    setStep(1);
    setBuyerInfo({ name: '', email: '', phone: '', billingZip: '' });
    setShowBreakdown(false);
    setBookingError(null);
    setQuotes({});
    if (completed) {
      clearCart();
    }
    onClose(completed);
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose(step === 3);
      }}
    >
      <SheetContent
        side="right"
        hideCloseButton={true}
        className="w-full sm:max-w-xl bg-[#0c0f17] border-l border-white/10 text-white flex flex-col p-0 shadow-2xl overflow-hidden backdrop-blur-2xl h-full max-h-screen"
      >
        <SheetTitle className="sr-only">Multi-Event Express Checkout</SheetTitle>

        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-amber-500/15 blur-3xl"
          aria-hidden="true"
        />

        {/* Fixed Header Bar */}
        <div className="relative z-10 shrink-0 border-b border-white/10 bg-[#131722]/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-6 text-amber-400" />
              <span className="font-sans text-base font-bold text-white tracking-tight">
                TicketSpan Multi-Checkout
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10.5px] font-mono font-bold text-emerald-400">
                <ShieldCheck className="size-3" /> 256-Bit SSL
              </span>
              <button
                type="button"
                onClick={() => handleClose(step === 3)}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Close checkout"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Cart Multi-Event Summary Box */}
          <div className="mt-3 rounded-xl border border-white/10 bg-[#181d2a] p-3 shadow-inner space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-sans text-sm font-bold text-white tracking-tight">
                  {eventIds.length} {eventIds.length === 1 ? 'Event Order' : 'Events in Order'}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {items.length} pass tier(s) selected
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBreakdown((prev) => !prev)}
                  className="flex items-center gap-1.5 text-right group focus:outline-none"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {centsToUSD(grandTotalCents)}
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono flex items-center gap-0.5 group-hover:underline">
                      {showBreakdown ? 'Hide details' : 'View details'}
                      {showBreakdown ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Collapsible Itemized Breakdown */}
            {showBreakdown && (
              <div className="border-t border-white/10 pt-2.5 space-y-2 text-xs animate-in fade-in-50 duration-200">
                <div className="space-y-1.5 divide-y divide-white/5 pb-1">
                  {eventIds.map((eventId) => {
                    const groupItems = eventGroups[eventId];
                    const first = groupItems[0];
                    return (
                      <div key={eventId} className="pt-1.5 first:pt-0 space-y-1">
                        <span className="font-bold text-amber-400/90 text-[11px] block truncate">
                          {first.eventTitle}
                        </span>
                        {groupItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-[11px] text-slate-300 pl-2">
                            <span className="truncate pr-2">
                              {item.label} (x{item.seats})
                            </span>
                            <span className="font-mono">{centsToUSD(calculateLineTotal(item.unitPriceCents, item.seats))}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1 text-[11px] pt-2 border-t border-white/10">
                  {totalDiscountCents > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Savings</span>
                      <span className="font-mono">-{centsToUSD(totalDiscountCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono">{centsToUSD(totalSubtotalCents)}</span>
                  </div>
                  {totalServiceFeeCents > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Service fee</span>
                      <span className="font-mono">{centsToUSD(totalServiceFeeCents)}</span>
                    </div>
                  )}
                  {totalTaxCents > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax</span>
                      <span className="font-mono">{centsToUSD(totalTaxCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 text-xs">
                    <span>Total</span>
                    <span className="font-mono text-amber-400">{centsToUSD(grandTotalCents)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {step < 3 && (
            <div className="mt-3 flex items-center gap-2">
              <div
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-all duration-300',
                  step >= 1 ? 'bg-amber-400' : 'bg-white/10',
                )}
              />
              <div
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-all duration-300',
                  step >= 2 ? 'bg-amber-400' : 'bg-white/10',
                )}
              />
            </div>
          )}
        </div>

        {/* Scrollable Step Body */}
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 py-5 overscroll-contain touch-pan-y pointer-events-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {bookingError && (
            <div role="alert" className="mb-4 p-3 bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold rounded-xl">
              {bookingError}
            </div>
          )}

          {step === 1 && (
            <GuestInfoStep
              buyerInfo={buyerInfo}
              onChange={setBuyerInfo}
              onBack={handleBack}
              onNext={handleProceedToPayment}
            />
          )}

          {step === 2 && bookingsId && (
            <PaymentStep
              bookingsId={bookingsId}
              totalCents={grandTotalCents}
              preferredMethod="card"
              buyerInfo={buyerInfo}
              onBack={handleBack}
              onPaymentSuccess={() => {
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <ConfirmationReceipt
              bookingsId={bookingsId}
              grandTotalCents={grandTotalCents}
              onClose={() => handleClose(true)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
