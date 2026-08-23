import { useCallback, useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import {
  createPaymentIntent,
  getPaymentStatus,
  cancelBooking,
  updatePaymentIntentForMethod,
  confirmFreeBooking,
} from '@/features/public/services/paymentService';
import { paymentsApi, type SavedPaymentMethodDto } from '@/shared/api';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import {
  Clock,
  ShieldCheck,
  CircleAlert,
  Ticket,
  Lock,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { centsToUSD } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

interface IntentState {
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  holdExpiresAt: number;
  customerSessionClientSecret?: string;
}

interface BuyerPrefill {
  name: string;
  email: string;
  phone: string;
  billingZip?: string;
  billingAddressLine?: string;
  billingCity?: string;
  billingState?: string;
}

interface PaymentStepProps {
  bookingsId: string;
  totalCents: number;
  onPaymentSuccess: () => void;
  onBack: () => void;
  preferredMethod?: 'card' | 'ach';
  buyerInfo?: BuyerPrefill;
}

export function PaymentStep({
  bookingsId,
  totalCents,
  onPaymentSuccess,
  onBack,
  preferredMethod = 'card',
  buyerInfo,
}: PaymentStepProps) {
  const isFree = totalCents === 0;
  const [intent, setIntent] = useState<IntentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (isFree) return;
    let active = true;
    createPaymentIntent(bookingsId, preferredMethod)
      .then((res) => {
        if (!active) return;
        setIntent({
          clientSecret: res.clientSecret,
          publishableKey: res.publishableKey,
          amountCents: Number(res.amountCents),
          holdExpiresAt: Number(res.holdExpiresAt),
          customerSessionClientSecret: res.customerSessionClientSecret || '',
        });
        const key = res.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
        setStripePromise(loadStripe(key));
      })
      .catch((caught) => active && setError(rpcErrorMessage(caught)));
    return () => {
      active = false;
    };
  }, [bookingsId, preferredMethod, isFree]);

  if (isFree) {
    return <FreeConfirm bookingsId={bookingsId} onConfirmed={onPaymentSuccess} onBack={onBack} />;
  }

  if (error) {
    return (
      <div className="space-y-5 pt-4 text-center">
        <div className="size-12 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
          <CircleAlert className="size-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans text-base font-bold text-white uppercase tracking-wider">
            Payment Setup Failed
          </h4>
          <p className="text-xs text-danger leading-relaxed max-w-sm mx-auto">{error}</p>
        </div>
        <Button
          onClick={onBack}
          className="h-11 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold w-full"
        >
          Return to Details
        </Button>
      </div>
    );
  }

  if (!intent || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center animate-in fade-in duration-300">
        <div className="relative size-12">
          <div className="size-12 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin" />
          <Lock className="size-4 text-amber-400 absolute inset-0 m-auto" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-white font-bold uppercase tracking-widest font-mono">
            Securing Payment Session
          </p>
          <p className="text-[11px] text-white/50">Establishing encrypted 256-bit bank tunnel…</p>
        </div>
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
            colorPrimary: '#fbbf24',
            colorBackground: '#131722',
            colorText: '#f8fafc',
            colorTextSecondary: '#94a3b8',
            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
            borderRadius: '12px',
          },
          rules: {
            '.Input': {
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#0c0f17',
              color: '#ffffff',
              paddingTop: '12px',
              paddingBottom: '12px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            },
            '.Input:focus': {
              border: '1px solid #fbbf24',
              boxShadow: '0 0 0 1px #fbbf24',
            },
            '.Label': {
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'monospace',
            },
            '.Tab': {
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
            },
            '.Tab:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
            },
            '.Tab--selected': {
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
              borderColor: '#fbbf24',
              color: '#ffffff',
              boxShadow: '0 0 0 1px #fbbf24',
            },
            '.TabLabel': {
              color: '#f8fafc',
              fontWeight: '600',
            },
            '.TabLabel--selected': {
              color: '#ffffff',
              fontWeight: '700',
            },
            '.TabIcon': {
              color: '#f8fafc',
            },
            '.TabIcon--selected': {
              color: '#fbbf24',
            },
            '.Block': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
            },
          },
        },
      }}
    >
      <StripeCheckoutForm
        bookingsId={bookingsId}
        intent={intent}
        preferredMethod={preferredMethod}
        buyerInfo={buyerInfo}
        onPaymentSuccess={onPaymentSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}

function FreeConfirm({
  bookingsId,
  onConfirmed,
  onBack,
}: {
  bookingsId: string;
  onConfirmed: () => void;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setSubmitting(true);
    setError(null);
    try {
      await confirmFreeBooking(bookingsId);
      onConfirmed();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
      setSubmitting(false);
    }
  }

  async function cancel() {
    try {
      await cancelBooking(bookingsId);
    } catch (e) {
      console.error(e);
    }
    onBack();
  }

  return (
    <div className="space-y-6 pt-1">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
            <Ticket className="size-3" /> Complimentary Admission
          </span>
          <h3 className="text-lg font-bold text-white font-sans uppercase tracking-tight mt-0.5">
            Free Entry Pass
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold font-mono">Amount Due</p>
          <span className="text-2xl font-bold text-amber-400 font-mono">$0.00</span>
        </div>
      </div>

      <p className="text-xs text-white/70 leading-relaxed px-1">
        This event is free — zero processing fees and no card required. Confirm below to issue your verified entry pass instantly.
      </p>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-[11.5px] leading-relaxed">
          <CircleAlert className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          disabled={submitting}
          onClick={cancel}
          className="h-12 px-5 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={claim}
          className="flex-1 ticketspan-spring-btn h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Issuing Pass…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Claim Entry Pass
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StripeCheckoutForm({
  bookingsId,
  intent,
  preferredMethod,
  buyerInfo,
  onPaymentSuccess,
  onBack,
}: {
  bookingsId: string;
  intent: IntentState;
  preferredMethod: 'card' | 'ach';
  buyerInfo?: BuyerPrefill;
  onPaymentSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(intent.amountCents);
  const [savingsCents, setSavingsCents] = useState(0);
  const [repricing, setRepricing] = useState(false);
  const methodRef = useRef<'card' | 'ach'>(preferredMethod);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethodDto[]>([]);
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | 'new'>('new');
  const [loadingSavedCards, setLoadingSavedCards] = useState(true);

  useEffect(() => {
    let active = true;
    paymentsApi
      .getSavedMethods()
      .then((res) => {
        if (!active) return;
        if (res.success && res.data && res.data.length > 0) {
          setSavedCards(res.data);
          setSelectedSavedCardId(res.data[0].id);
        } else {
          setSelectedSavedCardId('new');
        }
      })
      .catch(() => {
        if (active) setSelectedSavedCardId('new');
      })
      .finally(() => {
        if (active) setLoadingSavedCards(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleMethodChange = useCallback(
    async (type: string | undefined) => {
      const method: 'card' | 'ach' = type === 'us_bank_account' ? 'ach' : 'card';
      if (method === methodRef.current) return;
      methodRef.current = method;
      setRepricing(true);
      try {
        const res = await updatePaymentIntentForMethod(bookingsId, method);
        setAmountCents(res.totalCents);
        setSavingsCents(res.savingsCents);
      } catch {
        methodRef.current = method === 'ach' ? 'card' : 'ach';
      } finally {
        setRepricing(false);
      }
    },
    [bookingsId],
  );

  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    intent.holdExpiresAt > 0 ? Math.max(0, intent.holdExpiresAt - Math.floor(Date.now() / 1000)) : null,
  );
  const expired = secondsLeft !== null && secondsLeft <= 0;
  const cancelledRef = useRef(false);

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
      } catch (e) {
        console.error(e);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    onPaymentSuccess();
  }, [bookingsId, onPaymentSuccess]);

  const handleExpressConfirm = async (_event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || expired) return;
    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: intent.clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'Digital wallet transaction failed. Please retry.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      await pollUntilPaid();
      return;
    }
    setSubmitting(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || expired) return;
    setSubmitting(true);
    setMessage(null);

    // If paying with an existing saved card
    if (selectedSavedCardId && selectedSavedCardId !== 'new') {
      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          clientSecret: intent.clientSecret,
          confirmParams: {
            payment_method: selectedSavedCardId,
            return_url: window.location.href,
          },
          redirect: 'if_required',
        });

        if (error) {
          setMessage(error.message ?? 'Card payment failed. Please select another card.');
          setSubmitting(false);
          return;
        }

        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
          await pollUntilPaid();
          return;
        }
        setSubmitting(false);
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction could not be processed.';
        setMessage(msg);
        setSubmitting(false);
        return;
      }
    }

    // Otherwise pay with new card in Elements
    if (!elements) return;
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
    } catch (e) {
      console.error(e);
    }
    onBack();
  }

  const mm = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const ss = secondsLeft === null ? null : secondsLeft % 60;

  const selectedCard = savedCards.find((c) => c.id === selectedSavedCardId);

  return (
    <div className="space-y-5 pt-1">
      {/* Order & Total Charge Card */}
      <div className="rounded-2xl border border-white/10 bg-[#161a23] p-4 shadow-inner space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="size-3" /> Encrypted 256-Bit Checkout
            </span>
            <h3 className="text-base font-bold text-white font-sans tracking-tight mt-0.5">
              Authorized Payment
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold font-mono">Total</p>
            <span className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
              {centsToUSD(amountCents)}
            </span>
          </div>
        </div>

        {/* Hold Expiration Countdown Pill */}
        {secondsLeft !== null && !expired && (
          <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 text-xs text-amber-300 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 animate-pulse" /> Seating hold timer:
            </span>
            <span className="font-bold tabular-nums">
              {mm}:{String(ss).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {expired ? (
        <div className="space-y-4 py-8 text-center rounded-2xl border border-danger/20 bg-danger/10 p-6">
          <CircleAlert className="size-8 mx-auto text-danger" />
          <div className="space-y-1">
            <p className="font-sans text-sm font-bold uppercase tracking-wider text-danger">
              Booking Hold Expired
            </p>
            <p className="text-xs text-white/60">
              The ticket reservation window has elapsed. Please restart your ticket selection.
            </p>
          </div>
          <Button
            onClick={handleCancel}
            className="h-11 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold w-full"
          >
            Restart Selection
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Express Checkout Wallets (Apple Pay / Google Pay) */}
          <div className="rounded-2xl overflow-hidden shadow-md">
            <ExpressCheckoutElement
              onConfirm={handleExpressConfirm}
              options={{
                buttonHeight: 46,
                buttonTheme: {
                  applePay: 'black',
                  googlePay: 'black',
                },
                paymentMethods: {
                  applePay: 'auto',
                  googlePay: 'auto',
                  link: 'never',
                },
              }}
            />
          </div>

          {/* Saved Cards Vault List (If attendee has saved cards) */}
          {loadingSavedCards ? (
            <div className="py-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-amber-400" /> Checking vaulted payment methods…
            </div>
          ) : savedCards.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase font-mono tracking-wider text-white/80">
                  Select a Saved Card ({savedCards.length})
                </span>
                {selectedSavedCardId !== 'new' && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="size-3" /> Ready for 1-click pay
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                {savedCards.map((card) => {
                  const isSelected = selectedSavedCardId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedSavedCardId(card.id)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-xl border p-3.5 transition-all text-left group',
                        isSelected
                          ? 'border-amber-400 bg-[#1c2232] shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                          : 'border-white/10 bg-[#131722] hover:border-white/20 hover:bg-[#181d2a]',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-bold uppercase',
                            card.brand.toLowerCase().includes('visa')
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              : card.brand.toLowerCase().includes('mastercard')
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-white/10 text-white border-white/20',
                          )}
                        >
                          {card.brand.slice(0, 4)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-mono text-xs font-bold text-white tracking-wider">
                            •••• •••• •••• {card.last4}
                          </p>
                          <p className="font-mono text-[10.5px] text-white/50">
                            Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <div
                          className={cn(
                            'size-4 rounded-full border flex items-center justify-center transition-colors',
                            isSelected
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-white/30 bg-transparent',
                          )}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Option to use a new / different card */}
                <button
                  type="button"
                  onClick={() => setSelectedSavedCardId('new')}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border p-3 transition-all text-left',
                    selectedSavedCardId === 'new'
                      ? 'border-amber-400 bg-[#1c2232] ring-1 ring-amber-400 text-white'
                      : 'border-dashed border-white/15 bg-transparent hover:border-white/30 text-white/70 hover:text-white',
                  )}
                >
                  <span className="flex items-center gap-2 font-mono text-xs font-bold">
                    <Plus className="size-3.5" /> Use a different card
                  </span>
                  <div
                    className={cn(
                      'size-4 rounded-full border flex items-center justify-center',
                      selectedSavedCardId === 'new'
                        ? 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-white/30 bg-transparent',
                    )}
                  >
                    {selectedSavedCardId === 'new' && <div className="size-1.5 rounded-full bg-slate-950" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Stripe Payment Element (Shown if user selected "new" card or has no saved cards) */}
          {(selectedSavedCardId === 'new' || savedCards.length === 0) && (
            <div className="space-y-3">
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-white/10" />
                <span className="mx-3 flex-shrink text-[10px] font-mono font-bold uppercase tracking-widest text-white/50">
                  {savedCards.length > 0 ? 'Enter New Card Information' : 'Credit / Debit Card'}
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-3.5 shadow-inner">
                <PaymentElement
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card'],
                    wallets: {
                      applePay: 'never',
                      googlePay: 'never',
                      link: 'never',
                    },
                    terms: {
                      card: 'never',
                      usBankAccount: 'never',
                    },
                    fields: {
                      billingDetails: {
                        address: {
                          postalCode: 'auto',
                          country: 'auto',
                        },
                      },
                    },
                    defaultValues: {
                      billingDetails: {
                        name: buyerInfo?.name || undefined,
                        email: buyerInfo?.email || undefined,
                        phone: buyerInfo?.phone || undefined,
                        address: {
                          postal_code: buyerInfo?.billingZip || undefined,
                          line1: buyerInfo?.billingAddressLine || undefined,
                          city: buyerInfo?.billingCity || undefined,
                          state: buyerInfo?.billingState || undefined,
                          country: 'US',
                        },
                      },
                    },
                  }}
                  onChange={(e) => handleMethodChange(e.value.type)}
                />
              </div>
            </div>
          )}

          {savingsCents > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-mono font-bold">
              <ShieldCheck className="size-4 shrink-0" />
              <span>You save {centsToUSD(savingsCents)} paying via bank (ACH)</span>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs leading-relaxed animate-in fade-in-50">
              <CircleAlert className="size-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting || polling}
              onClick={handleCancel}
              className="h-12 px-5 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-bold"
            >
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>

            <Button
              type="submit"
              disabled={!stripe || submitting || polling || repricing}
              className="flex-1 ticketspan-spring-btn h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-sm font-bold tracking-wide shadow-lg shadow-amber-400/20 relative"
            >
              {repricing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> Recalculating…
                </span>
              ) : polling ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> Verifying Order…
                </span>
              ) : submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> Authorizing {centsToUSD(amountCents)}…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Lock className="size-4" />
                  {selectedCard
                    ? `Pay ${centsToUSD(amountCents)} with ${selectedCard.brand} •••• ${selectedCard.last4}`
                    : `Pay ${centsToUSD(amountCents)}`}
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
