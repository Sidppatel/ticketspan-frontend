import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { GuestInfoStep, type BuyerInfo } from './GuestInfoStep';
import { PaymentStep } from './PaymentStep';
import { ConfirmationReceipt } from '@/features/public/components/checkout/ConfirmationReceipt';
import { useCartStore, isCartItemExpired, type UniversalCartItem } from '@/shared/lib/cartStore';
import { createMultiBooking, quoteCart, cartServiceFeeCents } from '@/features/public/services/paymentService';
import type { CartQuote } from '@/shared/proto/bookings';
import { rpcErrorMessage } from '@/shared/session';
import { useAuth } from '@/shared/auth/useAuth';
import { setReturnTo } from '@/shared/auth/returnTo';
import { useNavigate, useLocation } from 'react-router-dom';
import { isTenantSubdomain, getUniversalLoginUrl } from '@/shared/subdomain';
import { BrandMark } from '@/shared/brand/BrandMark';
import { CartItemCountdown } from '@/features/public/components/cart/CartItemCountdown';
import { ShieldCheck, X, ChevronDown, ChevronUp, AlertTriangle, RotateCcw } from 'lucide-react';
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
  const { items, subtotalCents, groupedByEvent, clearCart, reclaimItem } = useCartStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: '', email: '', phone: '', billingZip: '' });
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [bookingsId, setBookingsId] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, CartQuote>>({});
  const [reclaimingAll, setReclaimingAll] = useState(false);

  const eventGroups = groupedByEvent();
  const eventIds = Object.keys(eventGroups);

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
          void 0;
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

  const handleReclaim = useCallback(async (item: UniversalCartItem) => {
    try {
      await quoteCart(item.eventId, [{
        kind: item.kind,
        refId: item.refId,
        seats: item.kind === 'Ticket' ? item.seats : 0,
      }]);
      reclaimItem(item.id);
      toast.success(`${item.label} re-claimed!`, {
        description: 'Your hold timer has been restarted.',
      });
    } catch {
      toast.error(`Unable to re-claim ${item.label}`, {
        description: 'This pass may no longer be available or sold out.',
      });
    }
  }, [reclaimItem]);

  const handleReclaimAllExpired = useCallback(async () => {
    setReclaimingAll(true);
    const expiredItems = items.filter((i) => isCartItemExpired(i));
    let reclaimedCount = 0;

    for (const item of expiredItems) {
      try {
        await quoteCart(item.eventId, [{
          kind: item.kind,
          refId: item.refId,
          seats: item.kind === 'Ticket' ? item.seats : 0,
        }]);
        reclaimItem(item.id);
        reclaimedCount++;
      } catch {
        void 0;
      }
    }

    setReclaimingAll(false);
    if (reclaimedCount > 0) {
      toast.success(`Re-claimed ${reclaimedCount} item(s)!`, {
        description: 'Your hold timers have been refreshed.',
      });
    } else {
      toast.error('Could not re-claim expired items. They may be sold out.');
    }
  }, [items, reclaimItem]);

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
  const hasExpired = items.some((i) => isCartItemExpired(i));

  const handleProceedToPayment = async () => {
    if (hasExpired) {
      toast.error('Expired passes in cart', {
        description: 'Please re-claim or remove expired items before proceeding to payment.',
      });
      return;
    }

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

        {}
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden="true"
        />

        {}
        <div className="relative z-10 shrink-0 border-b border-white/10 bg-[#131722]/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <BrandMark className="size-6 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-sans text-base font-bold text-white tracking-tight leading-tight block truncate">
                  TicketSpan
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono truncate">
                  <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
                  <span className="truncate">256-Bit Encrypted Checkout</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-300 leading-none">
                Step {step} of 3
              </span>
              <button
                type="button"
                onClick={() => handleClose(step === 3)}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer shrink-0"
                aria-label="Close checkout"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {}
          {hasExpired && step === 1 && (
            <div className="mt-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="size-4 text-rose-400 shrink-0" />
                <span className="text-rose-300 font-medium truncate">
                  Some pass hold timers expired.
                </span>
              </div>
              <button
                type="button"
                onClick={handleReclaimAllExpired}
                disabled={reclaimingAll}
                className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-rose-500/30 border border-rose-500/50 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-200 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className={cn('size-3', reclaimingAll && 'animate-spin')} />
                <span>{reclaimingAll ? 'Reclaiming…' : 'Re-claim All'}</span>
              </button>
            </div>
          )}

          {}
          <div className="mt-2.5 sm:mt-3 rounded-xl border border-white/10 bg-[#181d2a] p-2.5 sm:p-3 shadow-inner space-y-1.5 sm:space-y-2">
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
                  className="flex items-center gap-1.5 text-right group focus:outline-none cursor-pointer"
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

            {}
            {showBreakdown && (
              <div className="border-t border-white/10 pt-2.5 space-y-2 text-xs animate-in fade-in-50 duration-200">
                <div className="space-y-2 divide-y divide-white/5 pb-1">
                  {eventIds.map((eventId) => {
                    const groupItems = eventGroups[eventId];
                    const first = groupItems[0];
                    return (
                      <div key={eventId} className="pt-2 first:pt-0 space-y-1.5">
                        <span className="font-bold text-amber-400/90 text-[11px] block truncate">
                          {first.eventTitle}
                        </span>
                        {groupItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px] text-slate-300 pl-2 gap-2">
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <span className="truncate">
                                {item.label} (x{item.seats})
                              </span>
                              <CartItemCountdown item={item} onReclaim={handleReclaim} />
                            </div>
                            <span className="font-mono shrink-0">{centsToUSD(calculateLineTotal(item.unitPriceCents, item.seats))}</span>
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

          {}
          {step < 3 && (
            <div className="mt-2 sm:mt-3 flex items-center gap-2">
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

        {}
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3.5 py-3 sm:px-6 sm:py-5 overscroll-contain touch-pan-y pointer-events-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
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
