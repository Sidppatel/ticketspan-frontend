import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { GuestInfoStep, type BuyerInfo } from './GuestInfoStep';
import { PaymentStep } from './PaymentStep';
import { PriceBadge } from '../PriceBadge';
import { useAsync } from '@/shared/hooks/useAsync';
import { listTickets, getBooking } from '@/features/public/services/ticketService';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: (completed?: boolean) => void;
  bookingsId: string;
  cartTotalCents: number;
  preferredMethod?: 'card' | 'ach';
}

export function CheckoutDrawer({
  isOpen,
  onClose,
  bookingsId,
  cartTotalCents,
  preferredMethod = 'card',
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<3 | 4 | 5>(3);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: '', email: '', phone: '' });

  const grandTotalCents = cartTotalCents;

  const handleBack = () => {
    if (step === 3) {
      handleClose(false);
    }
    if (step === 4) setStep(3);
  };

  const handleNext = () => {
    if (step === 3) {
      console.log('[Telemetry]: checkout_step_completed', { step: 3 });
      setStep(4);
    }
  };

  const handleClose = (completed = false) => {
    if (step < 5) {
      console.log('[Telemetry]: checkout_abandoned', { bookingsId, step });
    }
    setStep(3);
    setBuyerInfo({ name: '', email: '', phone: '' });
    onClose(completed);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(false); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-stage border-l border-white/5 text-white flex flex-col p-6"
      >
        <SheetTitle className="sr-only">Checkout Process</SheetTitle>

        {/* Step Indicator Headers */}
        {step < 5 && (
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold">
              Step {step - 2} of 2
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', step >= 3 ? 'bg-accent-gold' : 'bg-white/20')} />
              <span className={cn('size-2 rounded-full', step >= 4 ? 'bg-accent-gold' : 'bg-white/20')} />
            </div>
          </div>
        )}

        {/* Step Views */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto -mx-6 px-6 pb-6">
          {step === 3 && (
            <GuestInfoStep
              buyerInfo={buyerInfo}
              onChange={setBuyerInfo}
              onBack={handleBack}
              onNext={handleNext}
            />
          )}

          {step === 4 && (
            <PaymentStep
              bookingsId={bookingsId}
              preferredMethod={preferredMethod}
              buyerInfo={buyerInfo}
              onBack={handleBack}
              onPaymentSuccess={() => {
                console.log('[Telemetry]: checkout_purchase_completed', { bookingsId });
                setStep(5);
              }}
            />
          )}

          {step === 5 && (
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

function ConfirmationReceipt({
  bookingsId,
  grandTotalCents,
  onClose,
}: {
  bookingsId: string;
  grandTotalCents: number;
  onClose: () => void;
}) {
  const ticketsLoader = useCallback(() => listTickets(bookingsId), [bookingsId]);
  const bookingLoader = useCallback(() => getBooking(bookingsId), [bookingsId]);
  const tickets = useAsync(ticketsLoader);
  const booking = useAsync(bookingLoader);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 pt-4 text-center pb-6">
        <div className="space-y-2">
          <CheckCircle2 className="size-12 mx-auto text-success animate-[svyne-fade-up_0.5s_ease-out]" />
          <h3 className="text-xl font-black text-white font-display uppercase tracking-tight">Booking Confirmed</h3>
          <p className="text-xs text-white/50">Your secure entries are verified and issued</p>
        </div>

      {/* Visual Perforated Ticket Stub Receipt */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-stage-elevated text-left shadow-2xl">
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40 uppercase tracking-wider font-bold">Entry Pass receipt</span>
            <span className="font-mono text-accent-gold font-bold">#{booking.data?.bookingNumber || 'HOLD'}</span>
          </div>
          <div>
            <h4 className="font-black font-display text-base text-white uppercase tracking-tight">
              {booking.data?.lines?.[0]?.label || 'General Entry'}
            </h4>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">Booking Reference: {bookingsId.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Ticket Perforation Tear Edge */}
        <div className="svyne-ticket-edge mx-4" style={{ '--svyne-notch': 'var(--background)' } as React.CSSProperties} />

        <div className="p-5 space-y-4">
          {/* Dynamic Tickets Barcode/QR List */}
          {tickets.loading ? (
            <div className="py-4 text-center text-white/50 text-[10px] uppercase font-bold tracking-widest animate-pulse">
              Generating secure barcodes…
            </div>
          ) : (
            <div className="space-y-3">
              {(tickets.data || []).map((t) => (
                <div key={t.ticketsId} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  {t.qrToken && (
                    <div className="shrink-0 rounded border bg-white p-1">
                      <QrImage value={t.qrToken} size={40} className="h-10 w-10 object-contain" />
                    </div>
                  )}
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-mono font-bold text-white tracking-wide">{t.ticketCode}</p>
                    <p className="text-[10px] font-bold text-accent-gold uppercase mt-0.5">{t.ticketTypeLabel || 'General Entry'}</p>
                    <p className="text-[9px] text-white/40 mt-0.5">Pass #{t.seatNumber}</p>
                  </div>
                  <span className="rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs">
            <span className="text-white/40 font-bold uppercase tracking-wider">Total Charge</span>
            <PriceBadge priceCents={grandTotalCents} className="text-base font-extrabold text-accent-gold" />
          </div>
        </div>
      </div>
      </div>

      <div className="flex flex-col gap-2 pt-4 mt-auto border-t border-white/5 shrink-0 bg-stage sticky bottom-0 z-10 pb-2">
        <Button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 w-full hover:text-white">
          Print Entry Passes
        </Button>
        <Button onClick={onClose} className="bg-accent-burgundy hover:bg-accent-burgundy/95 text-white py-4 w-full">
          Close Checkout
        </Button>
      </div>
    </div>
  );
}
