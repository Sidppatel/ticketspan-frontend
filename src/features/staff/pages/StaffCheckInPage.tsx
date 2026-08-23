import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  scanTicket,
  getCheckInStats,
  getGuestList,
  checkInGuest,
  lookupBooking,
  uncheckInTicket,
} from '@/features/staff/services/staffService';
import { rpcErrorMessage } from '@/shared/session';
import type { GuestBooking, GuestTicket } from '@/shared/proto/bookings';
import { StaffGuestList } from '@/features/staff/components/StaffGuestList';
import { CameraQrScanner } from '@/features/staff/components/CameraQrScanner';
import { BookingCheckInModal } from '@/features/staff/components/BookingCheckInModal';
import { CheckOutGuestModal } from '@/features/staff/components/CheckOutGuestModal';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Scan,
  Users,
  CheckCircle2,
  ArrowLeft,
  CircleX,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { toast } from 'sonner';

interface ScanFeedbackState {
  success: boolean;
  message: string;
  holderName?: string;
}

export function StaffCheckInPage() {
  const { eventsId = '' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'scanner' | 'roster'>('scanner');
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [feedback, setFeedback] = useState<ScanFeedbackState | null>(null);
  const [pendingBooking, setPendingBooking] = useState<GuestBooking | null>(null);
  const [checkOutTicket, setCheckOutTicket] = useState<GuestTicket | null>(null);

  const guestListLoader = useCallback(() => getGuestList(eventsId), [eventsId]);
  const guestList = useAsync(guestListLoader);

  const statsLoader = useCallback(() => getCheckInStats(eventsId), [eventsId]);
  const stats = useAsync(statsLoader);

  const reloadAll = useCallback(() => {
    guestList.reload();
    stats.reload();
  }, [guestList, stats]);

  const triggerFeedback = (success: boolean, message: string, holderName?: string) => {
    setFeedback({ success, message, holderName });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (success) {
        navigator.vibrate(150);
      } else {
        navigator.vibrate([100, 50, 100]);
      }
    }

    if (success) {
      toast.success(message);
    } else {
      toast.error(message);
    }

    setTimeout(() => {
      setFeedback(null);
    }, 2800);
  };

  const extractLookupToken = (raw: string): string => {
    const clean = raw.trim();
    if (!clean) return '';
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed?.uid) return parsed.uid;
        if (parsed?.passId) return parsed.passId;
        if (parsed?.email) return parsed.email;
      } catch {
        // Fallback to original string
      }
    }
    return clean;
  };

  const handleQrScan = useCallback(
    async (code: string) => {
      const clean = extractLookupToken(code);
      if (!clean || isProcessing) return;

      setIsProcessing(true);
      try {
        const bookingLookup = await lookupBooking(eventsId, clean);
        if (bookingLookup.found && bookingLookup.booking) {
          setPendingBooking(bookingLookup.booking);
          return;
        }

        const res = await scanTicket(clean, eventsId);
        if (res.valid) {
          triggerFeedback(true, `Verified: ${res.holderName || 'Guest'}`, res.holderName);
          reloadAll();
        } else {
          triggerFeedback(false, res.message || 'Ticket verification failed.');
        }
      } catch (err) {
        triggerFeedback(false, rpcErrorMessage(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [eventsId, isProcessing, reloadAll],
  );

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = manualCode.trim();
    if (!raw) return;
    const code = extractLookupToken(raw);

    setIsProcessing(true);
    try {
      const bookingLookup = await lookupBooking(eventsId, code);
      if (bookingLookup.found && bookingLookup.booking) {
        setPendingBooking(bookingLookup.booking);
        setManualCode('');
        return;
      }

      const res = await checkInGuest(eventsId, code, 'Ticket');
      if (res.valid) {
        triggerFeedback(true, `Checked In: ${res.holderName || 'Guest'}`, res.holderName);
        setManualCode('');
        reloadAll();
      } else {
        const bookingRes = await checkInGuest(eventsId, code, 'Booking');
        if (bookingRes.valid) {
          triggerFeedback(true, `Booking Checked In: ${bookingRes.holderName || 'Group'}`, bookingRes.holderName);
          setManualCode('');
          reloadAll();
        } else {
          triggerFeedback(false, res.message || bookingRes.message || 'Check-in failed.');
        }
      }
    } catch (err) {
      triggerFeedback(false, rpcErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBatchCheckInAll(booking: GuestBooking) {
    setIsProcessing(true);
    try {
      const res = await checkInGuest(eventsId, booking.bookingsId, 'Booking');
      if (res.valid) {
        toast.success(`Group check-in completed for ${booking.buyerName}`);
        setPendingBooking(null);
        reloadAll();
      } else {
        toast.error(res.message || 'Failed to check in group');
      }
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSingleTicketCheckIn(ticket: GuestTicket) {
    setIsProcessing(true);
    try {
      const res = await checkInGuest(eventsId, ticket.ticketsId, 'Ticket');
      if (res.valid) {
        toast.success(`Checked in ${ticket.guestName || 'Guest'}`);
        if (pendingBooking) {
          const updatedLookup = await lookupBooking(eventsId, pendingBooking.bookingsId);
          if (updatedLookup.found && updatedLookup.booking) {
            setPendingBooking(updatedLookup.booking);
          }
        }
        reloadAll();
      } else {
        toast.error(res.message || 'Check-in failed');
      }
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExecuteCheckOut(reason: string) {
    if (!checkOutTicket) return;
    setIsProcessing(true);
    try {
      const res = await uncheckInTicket(eventsId, checkOutTicket.ticketsId, reason);
      if (res.valid) {
        toast.success(res.message || 'Check-in undone successfully');
        setCheckOutTicket(null);
        reloadAll();
      } else {
        toast.error(res.message || 'Could not undo check-in');
      }
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  }

  const total = stats.data?.total ?? 0;
  const checkedIn = stats.data?.checkedIn ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/staff')}
          className="h-9 px-2.5 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Events
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={reloadAll}
            className="h-8 text-xs font-bold gap-1.5 rounded-lg"
          >
            <RefreshCw className={cn('size-3', (stats.loading || guestList.loading) && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-border/80 bg-card shadow-sm rounded-3xl overflow-hidden p-5">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Event Check-In
            </span>
            <h1 className="text-lg font-extrabold font-display text-foreground tracking-tight">
              Attendee Access Portal
            </h1>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold font-display text-primary">{pct}%</span>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">
              {checkedIn} of {total} in
            </p>
          </div>
        </div>

        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 border border-border/50 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('scanner')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'scanner'
              ? 'bg-card text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Scan className="size-4 text-primary" /> Camera Scanner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'roster'
              ? 'bg-card text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Users className="size-4 text-primary" /> Guest Roster
        </button>
      </div>

      {feedback && (
        <div
          className={cn(
            'p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-xl',
            feedback.success
              ? 'border-success/30 bg-success/15 text-success-foreground'
              : 'border-destructive/30 bg-destructive/15 text-destructive',
          )}
        >
          {feedback.success ? (
            <CheckCircle2 className="size-6 text-success shrink-0" />
          ) : (
            <CircleX className="size-6 text-destructive shrink-0" />
          )}
          <div className="space-y-0.5">
            <p className="font-extrabold">{feedback.message}</p>
            {feedback.holderName && (
              <p className="text-xs font-medium opacity-90">Attendee verified: {feedback.holderName}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'scanner' ? (
        <div className="space-y-4">
          <CameraQrScanner
            onScan={handleQrScan}
            isPaused={isProcessing || pendingBooking !== null}
          />

          <Card className="border border-border/70 bg-card shadow-sm rounded-2xl p-4">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <Input
                placeholder="Or type ticket code or booking #…"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="h-10 bg-background text-xs font-mono rounded-xl flex-1"
              />
              <Button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="ticketspan-spring-btn h-10 px-5 text-xs font-bold rounded-xl"
              >
                Verify
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        <StaffGuestList
          bookings={guestList.data || []}
          onCheckInTicket={(t) => void handleSingleTicketCheckIn(t)}
          onCheckInBooking={(b) => void handleBatchCheckInAll(b)}
          onTriggerCheckOut={(t) => setCheckOutTicket(t)}
          isProcessing={isProcessing}
        />
      )}

      <BookingCheckInModal
        isOpen={pendingBooking !== null}
        onOpenChange={(open) => {
          if (!open) setPendingBooking(null);
        }}
        booking={pendingBooking}
        onCheckInAll={handleBatchCheckInAll}
        onCheckInSingle={handleSingleTicketCheckIn}
        isProcessing={isProcessing}
      />

      <CheckOutGuestModal
        isOpen={checkOutTicket !== null}
        onOpenChange={(open) => {
          if (!open) setCheckOutTicket(null);
        }}
        guestName={checkOutTicket?.guestName || 'Attendee'}
        ticketCode={checkOutTicket?.ticketCode || ''}
        onConfirm={handleExecuteCheckOut}
        isProcessing={isProcessing}
      />
    </div>
  );
}
