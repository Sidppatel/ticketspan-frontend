import { useCallback, useEffect, useRef, useState } from 'react';
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
import { rpcErrorMessage } from '@/shared/session';
import { PriceBadge } from '../PriceBadge';
import { Button } from '@/shared/ui/button';
import { Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { centsToUSD } from '@/shared/lib/format';

interface IntentState {
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  holdExpiresAt: number;
}

interface PaymentStepProps {
  bookingsId: string;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export function PaymentStep({ bookingsId, onPaymentSuccess, onBack }: PaymentStepProps) {
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
      <div className="space-y-4 pt-2 text-center">
        <AlertCircle className="size-8 mx-auto text-danger" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Payment Setup Failed</h4>
        <p className="text-xs text-danger leading-relaxed">{error}</p>
        <Button onClick={onBack} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 w-full hover:text-white">
          Go Back
        </Button>
      </div>
    );
  }

  if (!intent || !stripePromise) {
    return (
      <div className="space-y-4 py-8 text-center animate-pulse">
        <div className="size-8 rounded-full border-2 border-white/10 border-t-accent-burgundy animate-spin mx-auto" />
        <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Contacting secure banking node…</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: intent.clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#cfa052',
            colorBackground: '#180D17',
            colorText: '#ffffff',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.4)',
            colorDanger: '#ff4d4d',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
          },
          rules: {
            '.Input': {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
            '.Input:focus': {
              border: '1px solid #cfa052',
              boxShadow: '0 0 0 1px #cfa052',
            },
            '.Label': {
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }
          }
        }
      }}
    >
      <StripeCheckoutForm
        bookingsId={bookingsId}
        intent={intent}
        onPaymentSuccess={onPaymentSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}

function StripeCheckoutForm({
  bookingsId,
  intent,
  onPaymentSuccess,
  onBack,
}: {
  bookingsId: string;
  intent: IntentState;
  onPaymentSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    intent.holdExpiresAt > 0 ? Math.max(0, intent.holdExpiresAt - Math.floor(Date.now() / 1000)) : null
  );
  const expired = secondsLeft !== null && secondsLeft <= 0;
  const cancelledRef = useRef(false);

  // Hold Timer countdown
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const pollUntilPaid = useCallback(async () => {
    setPolling(true);
    for (let attempt = 0; attempt < 25; attempt += 1) {
      if (cancelledRef.current) return;
      try {
        const status = await getPaymentStatus(bookingsId);
        if (status.bookingStatus === 'Paid') {
          onPaymentSuccess();
          return;
        }
        if (status.paymentStatus === 'Failed') {
          setMessage('Transaction declined. Please try another card or payment method.');
          setPolling(false);
          return;
        }
      } catch {
        // keep polling on network glitch
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    // Webhook lag fallback
    onPaymentSuccess();
  }, [bookingsId, onPaymentSuccess]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || expired) return;
    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'Secure transaction failed. Please retry.');
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
    cancelledRef.current = true;
    try {
      await cancelBooking(bookingsId);
    } catch {
      // best effort
    }
    onBack();
  }

  const mm = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const ss = secondsLeft === null ? null : secondsLeft % 60;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <h3 className="text-lg font-black text-white font-display uppercase tracking-tight">Secure Payment</h3>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
            <ShieldCheck className="size-3.5" /> 256-Bit SSL Connection
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Total Charged</p>
          <PriceBadge priceCents={intent.amountCents} className="text-xl font-extrabold text-accent-gold font-display" />
        </div>
      </div>

      {secondsLeft !== null && !expired && (
        <div className="inline-flex items-center gap-2 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold px-3.5 py-1.5 rounded-xl w-full text-xs font-semibold">
          <Clock className="size-4 shrink-0" />
          <span>Tickets and seating held securely for: {mm}:{String(ss).padStart(2, '0')}</span>
        </div>
      )}

      {expired ? (
        <div className="space-y-4 py-4 text-center">
          <AlertCircle className="size-8 mx-auto text-danger" />
          <p className="text-xs text-danger font-bold uppercase tracking-wider leading-relaxed">
            Your booking hold expired. Please restart the checkout process.
          </p>
          <Button onClick={handleCancel} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 w-full hover:text-white">
            Restart Selection
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PaymentElement />
          
          {message && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[11px] leading-relaxed">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              disabled={submitting || polling}
              onClick={handleCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || submitting || polling}
              className="flex-1 bg-accent-burgundy hover:bg-accent-burgundy/95 text-white py-5 shadow-lg relative"
            >
              {polling ? 'Verifying…' : submitting ? 'Authorizing…' : `Pay ${centsToUSD(intent.amountCents)}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
