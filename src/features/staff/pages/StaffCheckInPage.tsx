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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import {
  Search,
  Scan,
  Users,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  FileCheck,
  Undo2,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface ScanOverlayState {
  show: boolean;
  success: boolean;
  message: string;
}

interface UncheckTarget {
  ticketsId: string;
  guestName: string;
}

export function StaffCheckInPage() {
  const { eventsId = '' } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualType, setManualType] = useState<'Booking' | 'Ticket'>('Ticket');
  const [checkingIn, setCheckingIn] = useState(false);
  
  
  const [scanOverlay, setScanOverlay] = useState<ScanOverlayState | null>(null);
  const [pendingBooking, setPendingBooking] = useState<GuestBooking | null>(null);
  const [uncheckTarget, setUncheckTarget] = useState<UncheckTarget | null>(null);
  const [uncheckReason, setUncheckReason] = useState('');

  
  const guestListLoader = useCallback(() => getGuestList(eventsId), [eventsId]);
  const guestList = useAsync(guestListLoader);

  const statsLoader = useCallback(() => getCheckInStats(eventsId), [eventsId]);
  const stats = useAsync(statsLoader);

  
  const reloadAll = useCallback(() => {
    guestList.reload();
    stats.reload();
  }, [guestList, stats]);

  const triggerOverlay = (success: boolean, message: string) => {
    setScanOverlay({ show: true, success, message });
    
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (success) {
        navigator.vibrate(150); 
      } else {
        navigator.vibrate([100, 50, 100]); 
      }
    }
    
    
    setTimeout(() => {
      setScanOverlay(null);
    }, 1500);
  };

  const notAuthorized = !!(guestList.error && guestList.error.includes('Not Authorized'));

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    const code = qrToken.trim();
    if (!code) return;

    setCheckingIn(true);
    try {
      const bookingLookup = await lookupBooking(eventsId, code);
      if (bookingLookup.found && bookingLookup.booking) {
        setPendingBooking(bookingLookup.booking);
        setQrToken('');
        return;
      }
      const res = await scanTicket(code, eventsId);
      if (res.valid) {
        triggerOverlay(true, `Checked In: ${res.holderName || 'Guest'}`);
        setQrToken('');
        reloadAll();
      } else {
        triggerOverlay(false, res.message || 'Check-in failed.');
      }
    } catch (err) {
      triggerOverlay(false, rpcErrorMessage(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleManualCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;

    setCheckingIn(true);
    try {
      if (manualType === 'Booking') {
        const bookingLookup = await lookupBooking(eventsId, code);
        if (bookingLookup.found && bookingLookup.booking) {
          setPendingBooking(bookingLookup.booking);
          setManualCode('');
        } else {
          triggerOverlay(false, bookingLookup.message || 'Booking not found.');
        }
        return;
      }
      const res = await checkInGuest(eventsId, code, manualType);
      if (res.valid) {
        triggerOverlay(true, `Checked In: ${res.holderName || 'Guest'}`);
        setManualCode('');
        reloadAll();
      } else {
        triggerOverlay(false, res.message || 'Check-in failed.');
      }
    } catch (err) {
      triggerOverlay(false, rpcErrorMessage(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleActionCheckIn(codeOrId: string, type: 'Booking' | 'Ticket') {
    setCheckingIn(true);
    try {
      const res = await checkInGuest(eventsId, codeOrId, type);
      if (res.valid) {
        triggerOverlay(true, `Successfully Checked In!`);
        reloadAll();
      } else {
        triggerOverlay(false, res.message || 'Check-in failed.');
      }
    } catch (err) {
      triggerOverlay(false, rpcErrorMessage(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleConfirmBookingCheckIn() {
    if (!pendingBooking) return;
    const bookingsId = pendingBooking.bookingsId;
    setPendingBooking(null);
    await handleActionCheckIn(bookingsId, 'Booking');
  }

  async function handleConfirmUncheck(e: React.FormEvent) {
    e.preventDefault();
    if (!uncheckTarget || !uncheckReason.trim()) return;

    setCheckingIn(true);
    try {
      const res = await uncheckInTicket(eventsId, uncheckTarget.ticketsId, uncheckReason.trim());
      if (res.valid) {
        triggerOverlay(true, res.message || 'Check-in undone.');
        setUncheckTarget(null);
        setUncheckReason('');
        reloadAll();
      } else {
        triggerOverlay(false, res.message || 'Undo check-in failed.');
      }
    } catch (err) {
      triggerOverlay(false, rpcErrorMessage(err));
    } finally {
      setCheckingIn(false);
    }
  }

  
  const filteredBookings = (guestList.data ?? []).filter((b) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesBooking =
      b.bookingNumber.toLowerCase().includes(query) ||
      b.buyerName.toLowerCase().includes(query);

    const matchesTicket = b.tickets.some(
      (t) =>
        t.ticketCode.toLowerCase().includes(query) ||
        t.guestName.toLowerCase().includes(query),
    );

    return matchesBooking || matchesTicket;
  });

  const pendingUncheckedTickets = pendingBooking
    ? pendingBooking.tickets.filter((t: GuestTicket) => t.status !== 'CheckedIn')
    : [];

  if (notAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-6">
        <div className="inline-flex p-4 bg-destructive/10 rounded-full text-destructive border border-destructive/20 animate-shake">
          <XCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Not Authorized</h2>
          <p className="text-muted-foreground text-xs leading-normal">
            You do not have access to this event check-in, or the current time is outside the allowed window (24 hours before event start to 24 hours after event end).
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/staff')} className="w-full h-11 text-xs">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Staff Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2 relative">
      
      {}
      {scanOverlay && (
        <div className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in p-6 backdrop-blur-md",
          scanOverlay.success ? "bg-success/95" : "bg-destructive/95"
        )}>
          <div className="flex flex-col items-center gap-6 text-white text-center">
            {scanOverlay.success ? (
              <CheckCircle2 className="size-32 animate-fade-in stroke-[1.5]" />
            ) : (
              <XCircle className="size-32 stroke-[1.5]" />
            )}
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold tracking-tight font-display uppercase">
                {scanOverlay.success ? 'Valid Ticket' : 'Invalid Ticket'}
              </h2>
              <p className="text-lg font-semibold opacity-90 max-w-md leading-normal">
                {scanOverlay.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingBooking && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
          <Card className="w-full sm:max-w-lg border border-border bg-card shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/20 px-5 py-4 shrink-0">
              <CardTitle className="text-sm font-bold font-display flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Confirm Booking Check-In
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {pendingBooking.buyerName} · Booking <span className="font-mono">{pendingBooking.bookingNumber}</span>
              </p>
            </CardHeader>
            <CardContent className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                {pendingBooking.tickets.map((t: GuestTicket) => (
                  <div key={t.ticketsId} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-muted/20">
                    <div>
                      <p className="font-semibold text-foreground">Seat #{t.seatNumber} : {t.guestName}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{t.ticketCode}</p>
                    </div>
                    {t.status === 'CheckedIn' ? (
                      <span className="text-[10px] font-bold text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Already In
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        Will Check In
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {pendingUncheckedTickets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center font-semibold">
                  Everyone in this booking is already checked in.
                </p>
              ) : (
                <p className="text-xs text-foreground text-center font-semibold">
                  {pendingUncheckedTickets.length} of {pendingBooking.tickets.length} guests will be checked in.
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPendingBooking(null)}
                  className="flex-1 h-11 text-xs font-semibold"
                >
                  Cancel
                </Button>
                {pendingUncheckedTickets.length > 0 && (
                  <Button
                    onClick={handleConfirmBookingCheckIn}
                    disabled={checkingIn}
                    className="flex-1 h-11 text-xs font-semibold bg-primary hover:bg-primary/95 text-white"
                  >
                    <FileCheck className="h-4 w-4 mr-1.5" />
                    Check In {pendingUncheckedTickets.length}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {uncheckTarget && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6 animate-fade-in">
          <Card className="w-full sm:max-w-md border border-border bg-card shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20 px-5 py-4">
              <CardTitle className="text-sm font-bold font-display flex items-center gap-2 text-foreground">
                <Undo2 className="h-4 w-4 text-destructive" />
                Undo Check-In
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {uncheckTarget.guestName} will be marked as not checked in. A reason is required for the audit log.
              </p>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleConfirmUncheck} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="uncheck-reason">Reason</Label>
                  <Input
                    id="uncheck-reason"
                    placeholder="e.g. Accidental scan, guest left early..."
                    value={uncheckReason}
                    onChange={(e) => setUncheckReason(e.target.value)}
                    required
                    autoFocus
                    className="h-10 bg-background/50 border-border focus:border-primary text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setUncheckTarget(null); setUncheckReason(''); }}
                    className="flex-1 h-11 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={checkingIn || !uncheckReason.trim()}
                    className="flex-1 h-11 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white"
                  >
                    Undo Check-In
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/30 pb-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/staff')} className="-ml-2 mb-1 gap-1 text-muted-foreground hover:bg-muted/30">
            <ArrowLeft className="h-4 w-4" /> Portal Home
          </Button>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scan className="h-5.5 w-5.5 text-primary" />
            Check-In Desk
          </h1>
        </div>
        {stats.data && (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider">
              {stats.data.checkedIn} Checked In
            </div>
            <div className="bg-card border border-border px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground font-display uppercase tracking-wider">
              {stats.data.remaining} Remaining
            </div>
          </div>
        )}
      </div>

      {}
      <div className="grid gap-6 md:grid-cols-3">
        {}
        <div className="space-y-6 md:col-span-1">
          {}
          <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20 px-5 py-4">
              <CardTitle className="text-sm font-bold font-display flex items-center gap-2 text-foreground">
                <Scan className="h-4 w-4 text-primary" />
                Scan Ticket QR
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-normal">Simulate scanner inputs at the door.</p>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleScan} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qr-input">Scan Token</Label>
                  <Input
                    id="qr-input"
                    placeholder="Enter QR token hash..."
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    required
                    className="h-10 bg-background/50 border-border focus:border-primary text-sm"
                  />
                </div>
                <Button type="submit" className="w-full h-10 text-xs font-semibold bg-primary hover:bg-primary/95 text-white" disabled={checkingIn}>
                  <FileCheck className="h-4 w-4 mr-1.5" /> Check In Token
                </Button>
              </form>
            </CardContent>
          </Card>

          {}
          <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20 px-5 py-4">
              <CardTitle className="text-sm font-bold font-display flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Manual Lookup Check-In
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-normal">Override check-in using codes.</p>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-type">Type</Label>
                  <Select
                    id="manual-type"
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as 'Booking' | 'Ticket')}
                    className="h-10 bg-background/50 border-border"
                  >
                    <option value="Ticket">Single Ticket</option>
                    <option value="Booking">Whole Booking</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-code">Code / Number</Label>
                  <Input
                    id="manual-code"
                    placeholder={manualType === 'Ticket' ? "Enter Ticket Code..." : "Enter Booking Number..."}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    required
                    className="h-10 bg-background/50 border-border focus:border-primary text-sm"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full h-10 text-xs font-semibold border-border hover:bg-muted" disabled={checkingIn}>
                  Check In Manual
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by buyer name, guest name, booking number, or ticket code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 w-full bg-card border-border hover:border-hairline-strong focus:border-primary text-sm rounded-xl shadow-sm"
            />
          </div>

          <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20 px-5 py-4">
              <CardTitle className="text-sm font-bold font-display flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Guest List
              </CardTitle>
              <p className="text-[11px] text-muted-foreground leading-normal">Browse and manage ticket check-ins.</p>
            </CardHeader>
            <CardContent className="p-0">
              <StaffGuestList
                loading={guestList.loading}
                error={guestList.error}
                filteredBookings={filteredBookings}
                checkingIn={checkingIn}
                setPendingBooking={setPendingBooking}
                setUncheckTarget={setUncheckTarget}
                handleActionCheckIn={handleActionCheckIn}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
