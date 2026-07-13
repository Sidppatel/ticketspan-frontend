import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  createPaymentIntent,
  getPaymentStatus,
  cancelBooking,
  getBooking,
} from '@/features/public/services/paymentService';
import { eventClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import { clearAllPendingCarts } from '@/features/public/services/pendingCart';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, formatEventDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Lock, ShieldCheck, Ticket, Calendar, Clock, ArrowLeft, Loader2, Info } from 'lucide-react';
import type { Booking } from '@/shared/proto/bookings';
import type { Event } from '@/shared/proto/event';

interface IntentState {
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  holdExpiresAt: number;
}

const NOTCH = { ['--svyne-notch' as string]: 'var(--background)' } as CSSProperties;
const URGENT_HOLD_SECONDS = 120;

export function CheckoutPage() {
  const { bookingsId = '' } = useParams();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<IntentState | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    let active = true;

    createPaymentIntent(bookingsId)
      .then((res) => {
        if (!active) return;
        setIntent({
          clientSecret: res.clientSecret,
          publishableKey: res.publishableKey,
          amountCents: Number(res.amountCents),
          holdExpiresAt: Number(res.holdExpiresAt),
        });
        const key = res.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
        setStripePromise(loadStripe(key));
      })
      .catch((caught) => active && setError(rpcErrorMessage(caught)));

    getBooking(bookingsId)
      .then((b) => {
        if (!active) return;
        setBooking(b);
        return callRpc(() => eventClient.getEvent({ value: b.eventsId }));
      })
      .then((evt) => {
        if (active && evt) {
          setEventData(evt);
        }
      })
      .catch(() => {
        if (active) setMetaError(true);
      });

    return () => {
      active = false;
    };
  }, [bookingsId]);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Checkout unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-soft">{error}</p>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-10 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!intent || !stripePromise) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-ink-soft">Preparing secure checkout…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
            <Lock className="h-5 w-5 text-brand" /> Checkout
          </h1>
          <p className="text-sm text-ink-soft">Review your order and complete payment.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="h-9">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-[var(--shadow-e1)]">
            <div className="space-y-2 border-b border-hairline bg-surface-sunken p-5">
              {eventData ? (
                <>
                  {eventData.category ? (
                    <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                      {eventData.category}
                    </span>
                  ) : null}
                  <h2 className="font-display text-xl font-semibold text-foreground">{eventData.title}</h2>
                  <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <Calendar className="h-3.5 w-3.5 text-brand" />
                    {formatEventDate(eventData.startDate)}
                  </p>
                </>
              ) : metaError ? (
                <div className="flex items-start gap-2 text-xs text-ink-soft">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    We couldn't load the event details, but your reservation is intact — the total below
                    is what you'll be charged.
                  </span>
                </div>
              ) : (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-16 rounded bg-hairline" />
                  <div className="h-6 w-3/4 rounded bg-hairline" />
                </div>
              )}
            </div>

            <div className="svyne-ticket-edge" style={NOTCH} />

            <div className="space-y-6 p-6">
              {booking && booking.lines && booking.lines.length > 0 ? (
                <div className="space-y-3">
                  <p className="border-b border-hairline pb-2 font-mono text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Your tickets
                  </p>
                  <div className="divide-y divide-hairline">
                    {booking.lines.map((line) => (
                      <div key={line.bookingLinesId} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Ticket className="h-3.5 w-3.5 text-voltage" /> {line.label}
                        </span>
                        <span className="text-xs text-ink-soft">{line.kind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : metaError ? null : (
                <div className="animate-pulse space-y-2 py-4">
                  <div className="h-4 w-full rounded bg-hairline" />
                  <div className="h-4 w-full rounded bg-hairline" />
                </div>
              )}

              {booking ? (
                <div className="space-y-2 border-t border-hairline pt-4 text-sm">
                  {booking.feesIncluded ? null : (
                    <>
                      <div className="flex justify-between text-ink-soft">
                        <span>Subtotal</span>
                        <span className="font-mono">{centsToUSD(booking.subtotalCents)}</span>
                      </div>
                      <div className="flex justify-between text-ink-soft">
                        <span>Service fee</span>
                        <span className="font-mono">{centsToUSD(booking.serviceFeeCents)}</span>
                      </div>
                    </>
                  )}
                  {booking.taxCents > 0 ? (
                    <div className="flex justify-between text-ink-soft">
                      <span>Tax</span>
                      <span className="font-mono">{centsToUSD(booking.taxCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-hairline pt-3 font-semibold text-foreground">
                    <span>Total</span>
                    <span className="font-mono text-lg">{centsToUSD(booking.totalCents)}</span>
                  </div>
                  {booking.taxCents > 0 && booking.venueZip ? (
                    <p className="pt-1 text-xs text-ink-soft">
                      📍 Tax calculated based on venue location: {booking.venueCity}, {booking.venueState} {booking.venueZip}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-hairline bg-surface p-4 text-xs">
            <div className="flex items-center gap-2 border-b border-hairline pb-2.5 font-display text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-success" /> Payment security
            </div>
            <p className="leading-relaxed text-ink-soft">
              Payments are processed by Stripe over an encrypted connection. Your card details never
              touch Svyne servers.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: intent.clientSecret, appearance: { theme: 'stripe' } }}
          >
            <CheckoutForm bookingsId={bookingsId} intent={intent} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ bookingsId, intent }: { bookingsId: string; intent: IntentState }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    intent.holdExpiresAt > 0 ? Math.max(0, intent.holdExpiresAt - Math.floor(Date.now() / 1000)) : null,
  );

  const expired = secondsLeft !== null && secondsLeft <= 0;
  const urgent = secondsLeft !== null && secondsLeft > 0 && secondsLeft <= URGENT_HOLD_SECONDS;

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const pollUntilPaid = useCallback(async () => {
    setPolling(true);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const status = await getPaymentStatus(bookingsId);
        if (status.bookingStatus === 'Paid') {
          clearAllPendingCarts();
          navigate(`/bookings/${bookingsId}`, { state: { justPaid: true } });
          return;
        }
        if (status.paymentStatus === 'Failed') {
          setMessage('Payment failed. Please try another method.');
          setPolling(false);
          return;
        }
      } catch {
        void 0;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    clearAllPendingCarts();
    navigate(`/bookings/${bookingsId}`, { state: { justPaid: true } });
  }, [bookingsId, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || expired) return;
    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/bookings/${bookingsId}` },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'Payment could not be completed.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      await pollUntilPaid();
      return;
    }
    setSubmitting(false);
  }

  async function handleCancel() {
    try {
      await cancelBooking(bookingsId);
    } catch {
      navigate(-1);
      return;
    }
    navigate(-1);
  }

  const mm = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const ss = secondsLeft === null ? null : secondsLeft % 60;

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-e1)]">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <CardTitle className="text-lg">Payment</CardTitle>
        <span className="font-mono text-lg font-medium text-foreground">{centsToUSD(intent.amountCents)}</span>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {secondsLeft !== null && !expired ? (
          <div
            className={
              urgent
                ? 'svyne-urgent flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning'
                : 'flex items-center gap-2 rounded-md border border-hairline bg-surface-sunken px-4 py-3 text-sm text-ink-soft'
            }
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              Tickets held for{' '}
              <span className="font-mono font-medium tabular-nums">
                {mm}:{String(ss).padStart(2, '0')}
              </span>
            </span>
          </div>
        ) : null}

        {expired ? (
          <div className="space-y-4 py-6 text-center">
            <p className="text-sm font-medium text-destructive">
              Your hold expired — head back to the event to pick your tickets again.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)} className="h-11 w-full">
              Back to event
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PaymentElement />

            {message ? (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">
                {message}
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground">
              All ticket sales are final. No refunds.
            </p>

            <div className="flex gap-3 pt-3">
              <Button type="submit" size="lg" className="h-12 flex-1" disabled={!stripe || submitting || polling}>
                {polling ? 'Confirming…' : submitting ? 'Processing…' : `Pay ${centsToUSD(intent.amountCents)}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="h-12"
                disabled={submitting || polling}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
