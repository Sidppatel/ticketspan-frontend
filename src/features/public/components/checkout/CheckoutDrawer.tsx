import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import { GuestInfoStep, type BuyerInfo } from './GuestInfoStep';
import { PaymentStep } from './PaymentStep';
import { useAsync } from '@/shared/hooks/useAsync';
import { listTickets, getBooking, selfCheckInTicket } from '@/features/public/services/ticketService';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import {
  CheckCircle2,
  Share2,
  Printer,
  Calendar,
  ShieldCheck,
  Smartphone,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { BrandMark } from '@/shared/brand/BrandMark';
import { formatEventDate, centsToUSD } from '@/shared/lib/format';
import type { Event } from '@/shared/proto/event';
import type { Ticket } from '@/shared/proto/bookings';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: (completed?: boolean) => void;
  bookingsId: string;
  cartTotalCents: number;
  preferredMethod?: 'card' | 'ach';
  event?: Event;
}

export function CheckoutDrawer({
  isOpen,
  onClose,
  bookingsId,
  cartTotalCents,
  preferredMethod = 'card',
  event,
}: CheckoutDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({ name: '', email: '', phone: '', billingZip: '' });

  const grandTotalCents = cartTotalCents;

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

          {/* Event Context Strip */}
          {event && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#181d2a] p-3 shadow-inner">
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
              <span className="text-base font-bold text-amber-400 font-mono shrink-0">
                {centsToUSD(grandTotalCents)}
              </span>
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
              bookingsId={bookingsId}
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
              bookingsId={bookingsId}
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

function ShareEventButton({ eventLabel }: { eventLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.origin + window.location.pathname;
    const text = eventLabel ? `I'm attending ${eventLabel}!` : "I'm attending!";
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  };
  return (
    <Button
      variant="outline"
      onClick={share}
      className="h-11 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs font-bold w-full"
    >
      <Share2 className="size-4 mr-2 text-amber-400" />
      {copied ? 'Link Copied to Clipboard!' : 'Share Event Link'}
    </Button>
  );
}

function ConfirmationReceipt({
  bookingsId,
  grandTotalCents,
  event,
  onClose,
}: {
  bookingsId: string;
  grandTotalCents: number;
  event?: Event;
  onClose: () => void;
}) {
  const ticketsLoader = useCallback(() => listTickets(bookingsId), [bookingsId]);
  const bookingLoader = useCallback(() => getBooking(bookingsId), [bookingsId]);
  const tickets = useAsync(ticketsLoader);
  const booking = useAsync(bookingLoader);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const handleSelfCheckIn = async (ticket: Ticket) => {
    if (checkingInId) return;
    setCheckingInId(ticket.ticketsId);

    try {
      const res = await selfCheckInTicket(ticket.ticketsId);
      if (res.valid) {
        toast.success(res.message || 'Admission verified for entrance!');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        tickets.reload();
      } else {
        toast.error(res.message || 'Check-in could not be completed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed. Please show pass at door.';
      toast.error(msg);
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="flex flex-col space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 pb-6">
      {/* Confirmation Icon & Heading */}
      <div className="space-y-2 pt-2">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="size-8" />
        </div>
        <h3 className="font-sans text-2xl font-bold text-white tracking-tight">
          Payment Confirmed!
        </h3>
        <p className="text-xs text-white/60 max-w-sm mx-auto">
          Your reservation is verified. Digital passes have been issued and synced to your Universal Pass.
        </p>
      </div>

      {/* Ticket Pass Receipt Card */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#131722] text-left shadow-2xl">
        {/* Pass Top Header */}
        <div className="p-5 border-b border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono">
              Official Entry Pass
            </span>
            <span className="font-mono text-xs text-amber-400 font-bold">
              #{booking.data?.bookingNumber || 'VERIFIED'}
            </span>
          </div>
          <div>
            <h4 className="font-sans text-base font-bold text-white">
              {event?.title || booking.data?.lines?.[0]?.label || 'Event Admission'}
            </h4>
            <p className="text-[11px] text-white/50 font-mono mt-0.5">
              Ref: {bookingsId.substring(0, 12)}…
            </p>
          </div>
        </div>

        {/* Perforation Divider */}
        <div
          className="ticketspan-ticket-edge mx-3"
          style={{ '--ticketspan-notch': '#0c0f17' } as React.CSSProperties}
        />

        {/* Pass Body & QR Items */}
        <div className="p-5 space-y-4">
          {tickets.loading ? (
            <div className="py-8 text-center text-white/60 text-xs font-mono flex items-center justify-center gap-2 animate-pulse">
              <Loader2 className="size-4 animate-spin text-amber-400" /> Generating secure passes…
            </div>
          ) : (
            <div className="space-y-3">
              {(tickets.data || []).map((t) => {
                const isCheckedIn = t.status === 'CheckedIn';
                const isChecking = checkingInId === t.ticketsId;

                return (
                  <div
                    key={t.ticketsId}
                    className={cn(
                      'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center gap-4',
                      isCheckedIn
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-white/10 bg-white/5',
                    )}
                  >
                    {t.qrToken && (
                      <div className="shrink-0 rounded-xl bg-white p-2 shadow-md">
                        <QrImage value={t.qrToken} size={70} className="size-[70px] object-contain" />
                      </div>
                    )}

                    <div className="text-xs min-w-0 flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <p className="font-mono font-bold text-sm text-white tracking-wider">
                          #{t.ticketCode}
                        </p>
                        <Badge variant="voltage" className="text-[9px] font-mono uppercase">
                          {t.ticketTypeLabel || 'Admission'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-white/60 font-mono">
                        {t.seatNumber > 0 ? `Seat #${t.seatNumber}` : 'General Entry'}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="size-3.5" /> Checked In
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelfCheckIn(t)}
                          disabled={isChecking}
                          className="h-8 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold ticketspan-spring-btn shadow-sm"
                        >
                          {isChecking ? (
                            <>
                              <Loader2 className="size-3 animate-spin mr-1" /> Checking In…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3 mr-1" /> Check In Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paid Total Summary */}
          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs">
            <span className="text-white/50 uppercase font-bold font-mono tracking-wider">Total Paid</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {centsToUSD(grandTotalCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <Link to="/tickets" onClick={onClose} className="block">
          <Button className="ticketspan-spring-btn h-12 w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 gap-2">
            <Smartphone className="size-4" /> Open Passes in Wallet <ArrowRight className="size-4" />
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <ShareEventButton eventLabel={event?.title || booking.data?.lines?.[0]?.label} />
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 text-xs font-bold"
          >
            <Printer className="size-4 mr-1.5" /> Print Passes
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          className="h-10 text-xs text-white/50 hover:text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
