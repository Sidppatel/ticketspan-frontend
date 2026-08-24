import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Ticket as TicketIcon,
  MapPin,
  Calendar,
  CreditCard,
  Sparkles,
  Copy,
  Check,
  Mail,
  Send,
  Trash2,
  Printer,
  ArrowLeft,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { playSuccessChime } from '@/shared/lib/haptic';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { useAsync } from '@/shared/hooks/useAsync';
import { useAuth } from '@/shared/auth/useAuth';
import {
  getBooking,
  listTickets,
  inviteTicket,
  claimTicketSelf,
  revokeTicket,
  getClaimUrl,
} from '@/features/public/services/ticketService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { toast } from 'sonner';

export function BookingDetailPage() {
  const { bookingsId = '' } = useParams();
  const location = useLocation();
  const justPaid = Boolean((location.state as { justPaid?: boolean } | null)?.justPaid);
  const { user } = useAuth();

  useEffect(() => {
    if (justPaid) playSuccessChime();
  }, [justPaid]);

  const bookingLoader = useCallback(() => getBooking(bookingsId), [bookingsId]);
  const ticketsLoader = useCallback(() => listTickets(bookingsId), [bookingsId]);
  const booking = useAsync(bookingLoader);
  const tickets = useAsync(ticketsLoader);

  const [emails, setEmails] = useState<Record<string, string>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedLinkTicketId, setCopiedLinkTicketId] = useState<string | null>(null);
  const [activeQr, setActiveQr] = useState<{ qrToken: string; label: string; bookingNumber?: string } | null>(null);

  const b = booking.data;
  const tList = useMemo(() => tickets.data ?? [], [tickets.data]);

  // Check if the current user has claimed any ticket on this booking
  const myClaimedTicket = useMemo(() => {
    if (!user) return null;
    return tList.find(
      (t) => t.guestUsersId === user.usersId && (t.status === 'Claimed' || t.status === 'CheckedIn')
    );
  }, [tList, user]);

  const hasClaimedForSelf = Boolean(myClaimedTicket);

  // Invite by email
  async function handleInvite(ticketId: string) {
    const emailToInvite = (emails[ticketId] ?? '').trim();
    if (!emailToInvite) {
      toast.error('Please enter a recipient email address.');
      return;
    }

    setInvitingId(ticketId);
    try {
      await inviteTicket(ticketId, emailToInvite);
      toast.success(`Invitation email sent to ${emailToInvite}!`);
      setEmails((prev) => ({ ...prev, [ticketId]: '' }));
      await tickets.reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setInvitingId(null);
    }
  }

  // Generate and copy shareable claim link directly
  async function handleCopyClaimLink(ticketId: string) {
    setCopiedLinkTicketId(ticketId);
    try {
      const token = await inviteTicket(ticketId, '');
      const claimUrl = getClaimUrl(token);
      await navigator.clipboard.writeText(claimUrl);
      toast.success('Shareable claim link copied to clipboard!', {
        description: 'Send this direct link to your guest via SMS, WhatsApp, or chat.',
      });
      await tickets.reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setTimeout(() => setCopiedLinkTicketId(null), 2500);
    }
  }

  // Claim 1 for self
  async function handleClaimSelf(ticketId: string) {
    setClaimingId(ticketId);
    try {
      await claimTicketSelf(ticketId);
      toast.success('Ticket claimed for yourself! Added to your gate passes.');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
      await Promise.all([tickets.reload(), booking.reload()]);
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setClaimingId(null);
    }
  }

  // Revoke ticket / invite
  async function handleRevoke(ticketId: string, label: string) {
    if (!window.confirm(`Revoke ${label}? The current pass/invite code will be invalidated.`)) {
      return;
    }

    setRevokingId(ticketId);
    try {
      await revokeTicket(ticketId);
      toast.success('Ticket invitation revoked. Available to reassign.');
      await Promise.all([tickets.reload(), booking.reload()]);
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setRevokingId(null);
    }
  }

  const venue = b?.venueAddress || b?.venueName || tList.find((t) => t.venueName)?.venueName || '';
  const firstName = user?.firstName?.trim() ?? '';
  const title = b
    ? firstName
      ? `${firstName}'s Order for ${b.eventTitle || 'Event'}`
      : `Order for ${b.eventTitle || 'Event'}`
    : 'Order Details';

  return (
    <div className="space-y-8 pb-20">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to All Orders
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 gap-1.5 rounded-xl font-mono text-xs font-semibold"
          >
            <Printer className="size-3.5" /> Print Receipt
          </Button>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1 rounded-xl bg-ink text-surface px-3 py-1.5 font-mono text-xs font-semibold hover:bg-ink/90 shadow-sm"
          >
            <TicketIcon className="size-3.5" /> View Gate Passes
          </Link>
        </div>
      </div>

      {/* Just Paid Confirmation Alert */}
      {justPaid && (
        <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm space-y-1">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-display text-lg font-semibold">
            <CheckCircle2 className="size-5" /> Payment Successful! You're going.
          </div>
          <p className="text-xs text-ink-soft pl-7">
            Your booking is confirmed. Claim your pass below or share ticket invite links with your companions.
          </p>
        </div>
      )}

      {booking.loading && (
        <div className="py-12 text-center text-xs font-mono text-ink-soft animate-pulse flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin text-ink-soft" /> Loading booking details…
        </div>
      )}
      {booking.error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {booking.error}
        </div>
      )}

      {b && (
        <div className="space-y-8">
          {/* Order Overview Header Card */}
          <div className="relative overflow-hidden rounded-3xl border border-hairline bg-surface p-6 sm:p-8 shadow-[var(--shadow-e1)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Booking #{b.bookingNumber}
                  </span>
                  <Badge variant="success" className="font-mono text-[10px] font-bold">
                    {b.status}
                  </Badge>
                  <Badge variant="voltage" className="font-mono text-[10px]">
                    {centsToUSD(b.totalCents)}
                  </Badge>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
                  {title}
                </h1>

                <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs text-ink-soft">
                  {b.eventStartDate !== '0' && (
                    <div className="flex items-center gap-2 font-mono text-ink">
                      <Calendar className="size-4 text-ink-soft shrink-0" />
                      <span>{formatEventDate(b.eventStartDate)}</span>
                    </div>
                  )}
                  {venue && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="size-4 text-ink-faint shrink-0" />
                      <span className="truncate">{venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <TicketIcon className="size-4 text-ink-faint shrink-0" />
                    <span>{b.ticketsTotal} ticket(s) reserved ({b.ticketsClaimed} claimed)</span>
                  </div>
                  {b.paidAt !== '0' && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-ink-faint shrink-0" />
                      <span>Paid on {formatEventDate(b.paidAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking QR Code for Express Gate Lookup */}
              <div className="shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setActiveQr({
                      qrToken: b.bookingNumber,
                      label: `Booking #${b.bookingNumber}`,
                      bookingNumber: b.bookingNumber,
                    })
                  }
                  className="group flex flex-col items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  aria-label="Enlarge order QR code"
                >
                  <QrImage value={b.bookingNumber} size={110} className="size-[90px] object-contain transition-transform group-hover:scale-105" />
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-ink-soft group-hover:text-ink transition-colors">
                    Order QR
                  </span>
                </button>
              </div>
            </div>

            {/* Event Page Link */}
            {b.eventSlug && (
              <div className="border-t border-hairline pt-4 flex items-center justify-between text-xs">
                <span className="text-ink-soft">Need event information or schedule?</span>
                <Link
                  to={`/events/${b.eventSlug}`}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-ink-soft hover:text-ink"
                >
                  View Event Page <ExternalLink className="size-3" />
                </Link>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SELF-CLAIM HERO CALLOUT (IF PURCHASER HAS NOT CLAIMED YET)               */}
          {/* ========================================================================= */}
          {!hasClaimedForSelf && tList.some((t) => t.status === 'Unassigned' || (t.status === 'Invited' && !t.guestUsersId)) && (
            <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-ink font-display text-base font-semibold">
                  <Sparkles className="size-4 text-stone-500" /> You haven't claimed your seat yet!
                </div>
                <p className="text-xs text-ink-soft max-w-xl">
                  Claim 1 ticket for yourself to generate your personal live QR gate entry pass for door admission.
                </p>
              </div>

              {(() => {
                const targetTicket = tList.find((t) => t.status === 'Unassigned') || tList[0];
                return targetTicket ? (
                  <Button
                    onClick={() => handleClaimSelf(targetTicket.ticketsId)}
                    disabled={claimingId !== null}
                    className="shrink-0 gap-1.5 rounded-xl bg-ink text-surface hover:bg-ink/90 dark:bg-white dark:text-black font-semibold text-xs ticketspan-spring-btn shadow-sm"
                  >
                    {claimingId === targetTicket.ticketsId ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Claiming…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5 fill-current opacity-80" /> Claim 1 Ticket for Myself
                      </>
                    )}
                  </Button>
                ) : null;
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TICKET DISTRIBUTION & CLAIM MANAGEMENT HUB                               */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-hairline bg-surface p-6 sm:p-8 shadow-[var(--shadow-e1)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft font-semibold">
                  Attendee Passes
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink">
                  Ticket Distribution & Guest Management
                </h2>
              </div>
              <Badge variant="voltage" className="font-mono text-xs font-bold w-fit">
                {b.ticketsClaimed} of {b.ticketsTotal} Claimed
              </Badge>
            </div>

            {/* Tickets Interactive List */}
            <div className="space-y-4">
              {tList.map((ticket, index) => {
                const isClaimedByMe = ticket.guestUsersId === user?.usersId && (ticket.status === 'Claimed' || ticket.status === 'CheckedIn');
                const isClaimedByGuest = ticket.status === 'Claimed' && ticket.guestUsersId !== user?.usersId;
                const isInvited = ticket.status === 'Invited';
                const isCheckedIn = ticket.status === 'CheckedIn';

                const isInvitingThis = invitingId === ticket.ticketsId;
                const isClaimingThis = claimingId === ticket.ticketsId;
                const isRevokingThis = revokingId === ticket.ticketsId;
                const isCopiedThis = copiedLinkTicketId === ticket.ticketsId;

                return (
                  <div
                    key={ticket.ticketsId}
                    className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5 transition-all space-y-4 hover:border-hairline-strong"
                  >
                    {/* Top Row: Ticket info & Status pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken border border-hairline font-mono text-xs font-bold text-ink">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold text-ink text-sm sm:text-base">
                              {ticket.ticketTypeLabel || 'General Admission'}
                            </h3>
                            <span className="font-mono text-xs text-ink-soft">#{ticket.ticketCode}</span>
                          </div>
                          {ticket.seatNumber > 0 && (
                            <p className="font-mono text-xs text-ink-soft font-medium">Seat #{ticket.seatNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Checked In
                          </span>
                        ) : isClaimedByMe ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Claimed by You
                          </span>
                        ) : isClaimedByGuest ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                            <ShieldCheck className="size-3.5 text-stone-500" /> Claimed by Guest
                          </span>
                        ) : isInvited ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                            <Mail className="size-3.5 text-stone-500" /> Invite Sent · Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken border border-hairline px-3 py-1 font-mono text-xs font-medium text-ink-soft">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions according to status */}
                    <div className="border-t border-hairline pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {isClaimedByMe ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                          <p className="text-xs text-ink-soft font-mono">
                            Ready for door scan. Entry QR active in your gate passes.
                          </p>
                          <div className="flex items-center gap-2">
                            {ticket.qrToken && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-xl font-mono text-xs"
                                onClick={() =>
                                  setActiveQr({
                                    qrToken: ticket.qrToken,
                                    label: `${ticket.ticketTypeLabel} (${ticket.ticketCode})`,
                                    bookingNumber: b.bookingNumber,
                                  })
                                }
                              >
                                View Entry QR
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isRevokingThis}
                              onClick={() => handleRevoke(ticket.ticketsId, `Ticket #${ticket.ticketCode}`)}
                              className="h-8 rounded-xl text-xs font-mono"
                            >
                              {isRevokingThis ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3 mr-1" />}
                              Revoke
                            </Button>
                          </div>
                        </div>
                      ) : isInvited ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                          <div className="space-y-0.5 font-mono text-xs text-ink-soft">
                            <p className="text-ink font-medium">
                              Invite sent to: <span className="text-ink font-semibold">{ticket.invitedEmail || 'Guest'}</span>
                            </p>
                            <p className="text-[11px] text-ink-faint">
                              Waiting for guest to open invite link and accept pass.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Copy Direct Claim Link */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyClaimLink(ticket.ticketsId)}
                              className="h-8 rounded-xl font-mono text-xs"
                            >
                              {isCopiedThis ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                              {isCopiedThis ? 'Copied' : 'Copy Claim Link'}
                            </Button>

                            {/* Cancel Invite */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRevokingThis}
                              onClick={() => handleRevoke(ticket.ticketsId, `Invite for ${ticket.invitedEmail}`)}
                              className="h-8 rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                            >
                              {isRevokingThis ? <Loader2 className="size-3 animate-spin" /> : 'Cancel Invite'}
                            </Button>
                          </div>
                        </div>
                      ) : isClaimedByGuest ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                          <p className="text-xs text-ink-soft font-mono">
                            Pass claimed by companion. Entry pass assigned.
                          </p>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isRevokingThis}
                            onClick={() => handleRevoke(ticket.ticketsId, `Ticket #${ticket.ticketCode}`)}
                            className="h-8 rounded-xl text-xs font-mono"
                          >
                            {isRevokingThis ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3 mr-1" />}
                            Revoke Ticket
                          </Button>
                        </div>
                      ) : (
                        /* Unassigned Ticket Actions: 1-Click Claim for Self OR Invite Guest */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                          {/* Claim for Self Option */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={hasClaimedForSelf || isClaimingThis}
                              onClick={() => handleClaimSelf(ticket.ticketsId)}
                              className="h-8 gap-1.5 rounded-xl bg-ink text-surface hover:bg-ink/90 dark:bg-white dark:text-black font-semibold text-xs shadow-sm ticketspan-spring-btn shrink-0"
                            >
                              {isClaimingThis ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Sparkles className="size-3 fill-current opacity-80" />
                              )}
                              Claim for Myself
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyClaimLink(ticket.ticketsId)}
                              className="h-8 rounded-xl font-mono text-xs shrink-0"
                            >
                              {isCopiedThis ? <Check className="size-3 text-emerald-500 mr-1" /> : <Copy className="size-3 mr-1" />}
                              {isCopiedThis ? 'Copied Link' : 'Copy Direct Link'}
                            </Button>
                          </div>

                          {/* Email Invite Form */}
                          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                            <Input
                              type="email"
                              placeholder="guest@example.com"
                              value={emails[ticket.ticketsId] ?? ''}
                              onChange={(e) =>
                                setEmails((prev) => ({ ...prev, [ticket.ticketsId]: e.target.value }))
                              }
                              className="h-8 text-xs rounded-xl font-mono"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isInvitingThis || !(emails[ticket.ticketsId] ?? '').trim()}
                              onClick={() => handleInvite(ticket.ticketsId)}
                              className="h-8 px-2.5 rounded-xl font-mono text-xs font-semibold text-ink hover:bg-surface-sunken shrink-0"
                            >
                              {isInvitingThis ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3 mr-1" />}
                              Invite
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FINANCIAL RECEIPT & ORDER SUMMARY                                        */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-hairline bg-surface p-6 sm:p-8 shadow-[var(--shadow-e1)] space-y-6">
            <div className="border-b border-hairline pb-3">
              <h2 className="font-display text-xl font-semibold text-ink">Financial Breakdown & Receipt</h2>
              <p className="text-xs text-ink-soft">Itemized summary for this booking transaction.</p>
            </div>

            <div className="space-y-3 text-sm">
              {/* Lines list */}
              {b.lines.map((line) => (
                <div key={line.bookingLinesId} className="flex items-center justify-between py-1 border-b border-hairline/60">
                  <div>
                    <p className="font-medium text-ink">{line.label || 'Ticket'}</p>
                    <p className="font-mono text-xs text-ink-soft">{line.seats} seat(s) · {line.kind}</p>
                  </div>
                  <span className="font-mono font-medium text-ink">{centsToUSD(line.subtotalCents)}</span>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs text-ink-soft pt-2">
                <span>Subtotal</span>
                <span className="font-mono text-ink">{centsToUSD(b.subtotalCents)}</span>
              </div>

              {b.serviceFeeCents > 0 && (
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>Service & Processing Fee</span>
                  <span className="font-mono text-ink">{centsToUSD(b.serviceFeeCents)}</span>
                </div>
              )}

              {b.taxCents > 0 && (
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>Estimated Sales Tax</span>
                  <span className="font-mono text-ink">{centsToUSD(b.taxCents)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-base font-semibold text-ink border-t border-hairline pt-3">
                <span>Total Paid</span>
                <span className="font-mono text-lg text-ink font-bold">{centsToUSD(b.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Enlarge Dialog */}
      <Dialog
        open={activeQr !== null}
        onOpenChange={(open) => {
          if (!open) setActiveQr(null);
        }}
      >
        <DialogContent className="flex max-w-xs sm:max-w-sm flex-col items-center space-y-4 rounded-3xl p-6 bg-surface border border-hairline shadow-2xl">
          <DialogTitle className="text-center font-display text-xl font-semibold text-ink">
            Live Entry Pass
          </DialogTitle>
          {activeQr && (
            <>
              <div className="rounded-2xl border border-hairline bg-white p-4 shadow-md">
                <QrImage value={activeQr.qrToken} size={220} className="size-[200px] object-contain" />
              </div>
              <div className="space-y-1 text-center font-mono text-xs">
                <p className="font-bold text-ink text-sm">{activeQr.label}</p>
                {activeQr.bookingNumber && (
                  <p className="text-ink-soft">Order #{activeQr.bookingNumber}</p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl text-xs font-mono"
                onClick={() => setActiveQr(null)}
              >
                Close
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
