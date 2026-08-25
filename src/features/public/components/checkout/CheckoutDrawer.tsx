import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { GuestInfoStep, type BuyerInfo } from './GuestInfoStep';
import { PaymentStep } from './PaymentStep';
import { ConfirmationReceipt } from './ConfirmationReceipt';
import {
  Calendar,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BrandMark } from '@/shared/brand/BrandMark';
import { formatEventDate, centsToUSD } from '@/shared/lib/format';
import type { Event } from '@/shared/proto/event';
import type { CartQuote, CartQuoteLine } from '@/shared/proto/bookings';
import { cartServiceFeeCents, lineAllInExclTaxCents } from '@/features/public/services/paymentService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: (completed?: boolean) => void;
  bookingsId?: string;
  cartTotalCents: number;
  preferredMethod?: 'card' | 'ach';
  event?: Event;
  quote?: CartQuote | null;
  feesIncluded?: boolean;
}

export function CheckoutDrawer({
  isOpen,
  onClose,
  bookingsId: initialBookingsId = '',
  cartTotalCents,
  preferredMethod = 'card',
  event,
  quote,
  feesIncluded = false,
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: '', email: '', phone: '', billingZip: '' });
  const [showBreakdown, setShowBreakdown] = useState(false);

  const grandTotalCents = cartTotalCents;
  const subtotal = quote?.subtotalCents ?? 0;
  const serviceFee = quote ? cartServiceFeeCents(quote) : 0;
  const tax = quote?.taxCents ?? 0;

  const handleBack = () => {
    if (step === 1) {
      handleClose(false);
    }
    if (step === 2) setStep(1);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleClose = (completed = false) => {
    setStep(1);
    setBuyerInfo({ name: '', email: '', phone: '', billingZip: '' });
    setShowBreakdown(false);
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
        <SheetTitle className="sr-only">Express Event Checkout</SheetTitle>

        {/* Ambient Top Glows */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-amber-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/3 size-64 rounded-full bg-blue-500/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Fixed Header Bar */}
        <div className="relative z-10 shrink-0 border-b border-white/10 bg-[#131722]/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-6 text-amber-400" />
              <span className="font-sans text-base font-bold text-white tracking-tight">
                TicketSpan Checkout
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

          {/* Event Context Strip & Expandable Price Breakdown */}
          {event && (
            <div className="mt-3 rounded-xl border border-white/10 bg-[#181d2a] p-3 shadow-inner space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-sans text-sm font-bold text-white tracking-tight">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span className="truncate flex items-center gap-1">
                      <Calendar className="size-3 text-amber-400" />
                      {formatEventDate(event.startDate)}
                    </span>
                  </div>
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
                  {quote?.lines && quote.lines.length > 0 && (
                    <div className="space-y-1 divide-y divide-white/5 pb-1">
                      {quote.lines.map((line: CartQuoteLine) => {
                        const linePrice = feesIncluded
                          ? (lineAllInExclTaxCents(line) ?? 0)
                          : (line.breakdown?.sellingPriceCents ?? 0);
                        return (
                          <div key={`${line.kind}:${line.refId}`} className="flex justify-between text-[11px] pt-1 text-slate-300">
                            <span className="truncate pr-2">
                              {line.label} (x{line.seats})
                            </span>
                            <span className="font-mono">{centsToUSD(linePrice)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1 text-[11px]">
                    {!feesIncluded && (
                      <>
                        {subtotal > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal</span>
                            <span className="font-mono">{centsToUSD(subtotal)}</span>
                          </div>
                        )}
                        {serviceFee > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>Service fee</span>
                            <span className="font-mono">{centsToUSD(serviceFee)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tax</span>
                        <span className="font-mono">{centsToUSD(tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 text-xs">
                      <span>Total Charge</span>
                      <span className="font-mono text-amber-400">{centsToUSD(grandTotalCents)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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

        {/* Scrollable Step Body with Guaranteed Lenis & Mouse Wheel Scrolling */}
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 py-5 overscroll-contain touch-pan-y pointer-events-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {step === 1 && (
            <GuestInfoStep
              buyerInfo={buyerInfo}
              onChange={setBuyerInfo}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}

          {step === 2 && (
            <PaymentStep
              bookingsId={initialBookingsId}
              totalCents={grandTotalCents}
              preferredMethod={preferredMethod}
              buyerInfo={buyerInfo}
              onBack={handleBack}
              onPaymentSuccess={() => {
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <ConfirmationReceipt
              bookingsId={initialBookingsId}
              grandTotalCents={grandTotalCents}
              event={event}
              onClose={() => handleClose(true)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


