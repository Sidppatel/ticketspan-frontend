import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Ticket,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { EmptyState } from '@/shared/ui/empty-state';
import type { GuestBooking, GuestTicket } from '@/shared/proto/bookings';
import { cn } from '@/shared/lib/cn';

interface StaffGuestListProps {
  bookings: GuestBooking[];
  onCheckInTicket: (ticket: GuestTicket) => void;
  onCheckInBooking: (booking: GuestBooking) => void;
  onTriggerCheckOut: (ticket: GuestTicket) => void;
  isProcessing: boolean;
}

export function StaffGuestList({
  bookings,
  onCheckInTicket,
  onCheckInBooking,
  onTriggerCheckOut,
  isProcessing,
}: StaffGuestListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'checked_in'>('all');
  const [expandedBookingIds, setExpandedBookingIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .map((b) => {
        const matchesBooking =
          !q ||
          b.bookingNumber.toLowerCase().includes(q) ||
          b.buyerName.toLowerCase().includes(q);

        const matchingTickets = (b.tickets || []).filter((t) => {
          const isCheckedIn = t.status === 'CheckedIn';
          if (filterStatus === 'pending' && isCheckedIn) return false;
          if (filterStatus === 'checked_in' && !isCheckedIn) return false;

          if (!q) return true;
          if (matchesBooking) return true;
          return (
            t.guestName.toLowerCase().includes(q) ||
            t.ticketCode.toLowerCase().includes(q) ||
            (t.seatNumber > 0 && `seat ${t.seatNumber}`.includes(q))
          );
        });

        if (matchingTickets.length === 0 && !matchesBooking) return null;

        return {
          ...b,
          filteredTickets: matchingTickets,
        };
      })
      .filter((b): b is GuestBooking & { filteredTickets: GuestTicket[] } => b !== null);
  }, [bookings, search, filterStatus]);

  const totalAttendees = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (b.tickets?.length || 0), 0);
  }, [bookings]);

  const totalCheckedIn = useMemo(() => {
    return bookings.reduce((sum, b) => {
      return sum + (b.tickets?.filter((t) => t.status === 'CheckedIn').length || 0);
    }, 0);
  }, [bookings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, booking #, or ticket code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border shrink-0">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('all')}
            className="h-7 text-xs font-semibold"
          >
            All ({totalAttendees})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'pending' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('pending')}
            className="h-7 text-xs font-semibold"
          >
            Pending ({totalAttendees - totalCheckedIn})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'checked_in' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('checked_in')}
            className="h-7 text-xs font-semibold"
          >
            Checked In ({totalCheckedIn})
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6 text-muted-foreground" />}
          title="No Attendees Found"
          description="No guest records matched your filter or search query."
        />
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const isExpanded = expandedBookingIds.has(b.bookingsId) || search.trim().length > 0;
            const tickets = b.filteredTickets;
            const pendingCount = tickets.filter((t) => t.status !== 'CheckedIn').length;

            return (
              <Card
                key={b.bookingsId}
                className="overflow-hidden transition-all"
              >
                <div
                  onClick={() => toggleExpand(b.bookingsId)}
                  className="p-4 flex items-center justify-between gap-3 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">{b.buyerName}</span>
                      <Badge variant="neutral" className="font-mono text-[10px]">
                        #{b.bookingNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tickets.length} pass{tickets.length > 1 ? 'es' : ''} · {pendingCount === 0 ? 'All checked in' : `${pendingCount} pending`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pendingCount > 0 && (
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckInBooking(b);
                        }}
                        className="h-8 px-3 text-xs font-semibold"
                      >
                        Check In Group ({pendingCount})
                      </Button>
                    )}
                    <button
                      type="button"
                      className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-3 pt-0 border-t border-border/40 divide-y divide-border/40">
                    {tickets.map((t) => {
                      const isCheckedIn = t.status === 'CheckedIn';
                      return (
                        <div
                          key={t.ticketsId}
                          className="py-3 px-2 flex items-center justify-between gap-3 first:pt-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <Ticket className={cn('size-3.5 shrink-0', isCheckedIn ? 'text-success' : 'text-muted-foreground')} />
                              <span className="text-xs font-semibold text-foreground truncate">
                                {t.guestName || b.buyerName}
                              </span>
                              {t.seatNumber > 0 && (
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                  Seat #{t.seatNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground pl-5.5">
                              {t.ticketCode}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isCheckedIn ? (
                              <>
                                <Badge variant="success" className="text-[10px] font-semibold gap-1">
                                  <CheckCircle2 className="size-3" /> Checked In
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isProcessing}
                                  onClick={() => onTriggerCheckOut(t)}
                                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-warning hover:bg-warning/10 gap-1 rounded-lg"
                                  title="Undo Check-In"
                                >
                                  <LogOut className="size-3" /> Check Out
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => onCheckInTicket(t)}
                                className="h-7 px-3 text-xs font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                              >
                                Check In
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
