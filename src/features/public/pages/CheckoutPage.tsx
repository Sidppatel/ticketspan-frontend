import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  createPaymentIntent,
  getPaymentStatus,
  cancelBooking,
} from '@/features/public/services/paymentService';
import { clearAllPendingCarts } from '@/features/public/services/pendingCart';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface IntentState {
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  holdExpiresAt: number; // unix seconds, 0 = none
}

export function CheckoutPage() {
  const { bookingsId = '' } = useParams();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<IntentState | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    return () => {
      active = false;
    };
  }, [bookingsId]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checkout unavailable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!intent || !stripePromise) {
    return <p className="text-muted-foreground">Preparing secure checkout…</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: intent.clientSecret, appearance: { theme: 'stripe' } }}
    >
      <CheckoutForm bookingsId={bookingsId} intent={intent} />
    </Elements>
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
  const cancelledRef = useRef(false);

  // Hold countdown.
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
          navigate(`/bookings/${bookingsId}`);
          return;
        }
        if (status.paymentStatus === 'Failed') {
          setMessage('Payment failed. Please try another method.');
          setPolling(false);
          return;
        }
      } catch {
        // transient — keep polling
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    // Webhook may lag; send the user to their booking which reflects final state.
    clearAllPendingCarts();
    navigate(`/bookings/${bookingsId}`);
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
      // Tickets are issued by the backend webhook; poll for the booking flip.
      await pollUntilPaid();
      return;
    }
    setSubmitting(false);
  }

  async function handleCancel() {
    cancelledRef.current = true;
    try {
      await cancelBooking(bookingsId);
    } catch {
      /* best effort */
    }
    navigate(-1);
  }

  const mm = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const ss = secondsLeft === null ? null : secondsLeft % 60;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-2 border-b-0">
        <CardTitle>Complete payment</CardTitle>
        <span className="font-display text-2xl font-bold text-marigold">
          {centsToUSD(intent.amountCents)}
        </span>
      </CardHeader>
      <div
        className="svyne-ticket-edge mx-4"
        style={{ ['--svyne-notch' as string]: '#ffffff' } as React.CSSProperties}
      />
      <CardContent>
        {secondsLeft !== null && !expired ? (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 text-sm font-medium text-marigold-foreground">
            Seats held for {mm}:{String(ss).padStart(2, '0')}
          </p>
        ) : null}

        {expired ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">Your hold expired. Please start the booking again.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back to event
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <div className="sticky bottom-0 -mx-4 -mb-4 flex gap-2 border-t border-border bg-card/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <Button type="submit" size="lg" className="flex-1 sm:flex-none" disabled={!stripe || submitting || polling}>
                {polling ? 'Confirming…' : submitting ? 'Processing…' : `Pay ${centsToUSD(intent.amountCents)}`}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleCancel} disabled={submitting || polling}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
