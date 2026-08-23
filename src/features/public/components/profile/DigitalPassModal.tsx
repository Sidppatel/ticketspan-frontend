import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { roleLabel } from '@/shared/roles';
import { BrandMark } from '@/shared/brand/BrandMark';
import {
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  X,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Loader2,
  Smartphone,
  Radio,
  Ticket as TicketIcon,
  QrCode,
  Search,
  Zap,
} from 'lucide-react';
import type { UserProfile } from '@/shared/proto/auth';
import type { Ticket } from '@/shared/proto/bookings';
import { listMyTickets, selfCheckInTicket } from '@/features/public/services/ticketService';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';

interface DigitalPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  role: number;
}

type ModalTab = 'tickets' | 'qr';

export function DigitalPassModal({ open, onOpenChange, user, role }: DigitalPassModalProps) {
  const [copied, setCopied] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkCheckingIn, setBulkCheckingIn] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLoadingTickets(true);
    });
    listMyTickets()
      .then((res) => {
        if (active) setTickets(res || []);
      })
      .catch(() => {
        // Non-blocking error
      })
      .finally(() => {
        if (active) setLoadingTickets(false);
      });
    return () => {
      active = false;
    };
  }, [open, user]);

  // Group tickets by event title for ultra-clean display
  const groupedTickets = useMemo(() => {
    const map = new Map<string, { eventTitle: string; venueName: string; tickets: Ticket[] }>();
    for (const t of tickets) {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (t.eventTitle || '').toLowerCase().includes(q) ||
          (t.ticketCode || '').toLowerCase().includes(q) ||
          (t.venueName || '').toLowerCase().includes(q);
        if (!matches) continue;
      }

      const key = t.eventTitle || 'Event Admissions';
      if (!map.has(key)) {
        map.set(key, {
          eventTitle: key,
          venueName: t.venueName || '',
          tickets: [],
        });
      }
      map.get(key)!.tickets.push(t);
    }
    return Array.from(map.values());
  }, [tickets, searchQuery]);

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Universal Attendee';
  const attendeePassId = `TS-${user.usersId.slice(0, 8).toUpperCase()}-${(user.email || '').slice(0, 3).toUpperCase()}`;
  const qrData = JSON.stringify({
    uid: user.usersId,
    email: user.email,
    passId: attendeePassId,
    type: 'universal_attendee_credential',
    iss: 'TicketSpan Platform',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(attendeePassId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelfCheckIn = async (ticket: Ticket) => {
    if (checkingInId) return;
    setCheckingInId(ticket.ticketsId);

    try {
      const res = await selfCheckInTicket(ticket.ticketsId);
      if (res.valid) {
        toast.success(res.message || `Checked in to ${ticket.eventTitle}!`);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        setTickets((prev) =>
          prev.map((t) => (t.ticketsId === ticket.ticketsId ? { ...t, status: 'CheckedIn' } : t)),
        );
      } else {
        toast.error(res.message || 'Check-in could not be completed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed. Please show pass QR at the door.';
      toast.error(msg);
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCheckInAllForEvent = async (eventTickets: Ticket[]) => {
    const unchecked = eventTickets.filter((t) => t.status !== 'CheckedIn');
    if (unchecked.length === 0) return;

    setBulkCheckingIn(true);
    let successCount = 0;

    for (const t of unchecked) {
      try {
        const res = await selfCheckInTicket(t.ticketsId);
        if (res.valid) {
          successCount += 1;
          setTickets((prev) =>
            prev.map((item) => (item.ticketsId === t.ticketsId ? { ...item, status: 'CheckedIn' } : item)),
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    setBulkCheckingIn(false);
    if (successCount > 0) {
      toast.success(`Successfully checked in ${successCount} ticket(s)!`);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 40, 50, 40, 50]);
      }
    }
  };

  const activeCount = tickets.filter((t) => t.status !== 'CheckedIn').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton={true}
        className="w-full max-w-lg h-[86vh] max-h-[780px] flex flex-col p-0 overflow-hidden bg-[#0c0f17] border border-white/15 text-white rounded-[2rem] shadow-2xl backdrop-blur-2xl"
      >
        <DialogTitle className="sr-only">Universal Attendee Digital Credential</DialogTitle>

        {/* Ambient Glows */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-amber-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/2 size-64 rounded-full bg-blue-600/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Fixed Top Header Bar */}
        <div className="relative z-10 shrink-0 border-b border-white/10 bg-[#131722]/95 px-6 py-4 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-6 text-amber-400" />
              <div>
                <span className="!font-sans text-base font-bold text-white tracking-tight">
                  Universal Pass
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                  </span>
                  Gate Verified
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="voltage" className="font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 font-bold">
                <Sparkles className="size-3 mr-1" /> VIP Credential
              </Badge>
              {/* Single Close Button */}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Close pass"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Segmented Control Navigation Tabs */}
          <div className="flex rounded-2xl bg-[#080a10] p-1 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl !font-sans text-xs font-bold transition-all',
                activeTab === 'tickets'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <TicketIcon className="size-3.5" />
              <span>Active Passes ({tickets.length})</span>
              {activeCount > 0 && activeTab !== 'tickets' && (
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl !font-sans text-xs font-bold transition-all',
                activeTab === 'qr'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <QrCode className="size-3.5" />
              <span>Digital QR Pass</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body with Lenis & Wheel Event StopPropagation */}
        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4 overscroll-contain touch-pan-y pointer-events-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {/* TAB 1: ACTIVE PASSES & 1-CLICK SELF CHECK-IN */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              {/* Attendee Quick Identity Strip */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#131722] p-3.5 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl overflow-hidden border border-amber-400/40 bg-[#1e2434] shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center !font-sans text-sm font-bold text-amber-400">
                        {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate !font-sans text-xs font-bold text-white">{displayName}</p>
                    <p className="font-mono text-[10.5px] text-amber-400 font-bold">{attendeePassId}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-8 px-2.5 rounded-xl border-white/15 bg-white/5 text-[10.5px] font-mono font-bold text-white hover:bg-white/10"
                >
                  {copied ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
                  {copied ? 'Copied' : 'ID'}
                </Button>
              </div>

              {/* Search / Filter bar if more than 3 tickets */}
              {tickets.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by event, seat, or ticket code…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 bg-[#080a10] border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              )}

              {loadingTickets ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="size-4 animate-spin text-amber-400" /> Loading your active entry passes…
                </div>
              ) : groupedTickets.length === 0 ? (
                <div className="py-12 text-center space-y-2 rounded-2xl border border-white/10 bg-[#131722] p-6">
                  <TicketIcon className="size-8 mx-auto text-slate-500" />
                  <p className="!font-sans text-sm font-bold text-white">No active passes found</p>
                  <p className="text-xs text-slate-400">
                    {searchQuery
                      ? 'No tickets match your search filter.'
                      : 'When you purchase event tickets, they will automatically sync here for 1-click door entry.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTickets.map((group) => {
                    const uncheckedInGroup = group.tickets.filter((t) => t.status !== 'CheckedIn');
                    const allCheckedInGroup = uncheckedInGroup.length === 0;

                    return (
                      <div
                        key={group.eventTitle}
                        className="rounded-2xl border border-white/10 bg-[#131722] overflow-hidden shadow-md"
                      >
                        {/* Event Group Header */}
                        <div className="p-4 border-b border-white/10 bg-[#171c2b] flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate !font-sans text-sm font-bold text-white tracking-tight">
                              {group.eventTitle}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                              {group.venueName && (
                                <span className="truncate flex items-center gap-1">
                                  <MapPin className="size-3 text-amber-400" /> {group.venueName}
                                </span>
                              )}
                              <span>• {group.tickets.length} Ticket(s)</span>
                            </div>
                          </div>

                          {/* Quick Check-In All Button for this Event */}
                          {!allCheckedInGroup && group.tickets.length > 1 && (
                            <Button
                              size="sm"
                              disabled={bulkCheckingIn}
                              onClick={() => handleCheckInAllForEvent(group.tickets)}
                              className="h-8 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold shrink-0 gap-1.5"
                            >
                              {bulkCheckingIn ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Zap className="size-3 text-emerald-400 fill-current" />
                              )}
                              Check In All ({uncheckedInGroup.length})
                            </Button>
                          )}
                        </div>

                        {/* Tickets List */}
                        <div className="p-3 space-y-2">
                          {group.tickets.map((t) => {
                            const isCheckedIn = t.status === 'CheckedIn';
                            const isChecking = checkingInId === t.ticketsId;

                            return (
                              <div
                                key={t.ticketsId}
                                className={cn(
                                  'p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3',
                                  isCheckedIn
                                    ? 'border-emerald-500/30 bg-emerald-950/20'
                                    : 'border-white/10 bg-[#0f131e] hover:border-white/20',
                                )}
                              >
                                <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                                  <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <p className="font-mono font-bold text-xs text-white tracking-wider">
                                      #{t.ticketCode}
                                    </p>
                                    <Badge variant="voltage" className="text-[9px] font-mono uppercase px-1.5 py-0 font-bold">
                                      {t.seatNumber > 0 ? `Seat #${t.seatNumber}` : t.ticketTypeLabel || 'General Admission'}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isCheckedIn ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="size-3.5" /> Checked In
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleSelfCheckIn(t)}
                                      disabled={isChecking || bulkCheckingIn}
                                      className="h-8 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold ticketspan-spring-btn shadow-sm"
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL APPLE WALLET STYLE DIGITAL QR PASS */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#181d2a] to-[#121622] shadow-xl">
                {/* Top Amber Brand Accent Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />

                {/* Attendee Identity Section */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative size-13 shrink-0">
                      <div className="size-13 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-[#1e2434] shadow-md">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center !font-sans text-xl font-bold text-amber-400">
                            {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-[#121622] flex items-center justify-center">
                        <Check className="size-2.5 text-slate-950 stroke-[3]" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h3 className="truncate !font-sans text-base font-bold text-white tracking-tight">
                        {displayName}
                      </h3>
                      <p className="truncate font-mono text-xs text-slate-400">{user.email}</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-400">
                          <ShieldCheck className="size-3" /> {roleLabel(role)}
                        </span>
                        {user.tenantSlug && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] text-slate-300">
                            {user.tenantSlug}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credential ID Bar */}
                  <div className="flex items-center justify-between rounded-xl bg-[#0c0f17] border border-white/10 px-3 py-2">
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                        Universal Credential ID
                      </span>
                      <p className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                        {attendeePassId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Perforation Cutout Divider */}
                <div className="relative flex items-center justify-between px-3 py-1 bg-[#151926] border-y border-white/10">
                  <div className="size-4 -ml-5 rounded-full bg-[#0c0f17] shadow-inner" />
                  <div className="flex-1 border-t border-dashed border-white/20 mx-2" />
                  <div className="size-4 -mr-5 rounded-full bg-[#0c0f17] shadow-inner" />
                </div>

                {/* QR Code Presentation Box */}
                <div className="p-5 flex flex-col items-center text-center space-y-3 bg-[#121622]">
                  <div className="relative group">
                    <div className="rounded-2xl border border-white/20 bg-white p-4 shadow-2xl">
                      <QrImage value={qrData} size={180} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="!font-sans text-xs font-bold text-white tracking-wide">
                      Express Door & Box Office Scan
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Present this QR code to event scanners or door staff for 1-step verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Wallet Link */}
          <div className="rounded-2xl border border-white/10 bg-[#131722] p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-amber-400" />
              <span className="text-slate-300">Looking for individual ticket passes?</span>
            </div>
            <Link
              to="/tickets"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 hover:underline font-mono text-[11px]"
            >
              My Passes <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Fixed Bottom Footer */}
        <div className="shrink-0 border-t border-white/10 bg-[#131722]/95 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 font-semibold">
            <Radio className="size-3.5 text-emerald-400 animate-pulse" />
            <span>Digital Credential Active</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-4 rounded-xl border-white/15 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
          >
            Close Pass
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
