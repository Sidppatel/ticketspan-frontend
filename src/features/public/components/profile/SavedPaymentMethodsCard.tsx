import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import type { Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { paymentsApi, type SavedPaymentMethodDto } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { useAuth } from '@/shared/auth/useAuth';
import type { UserProfile } from '@/shared/proto/auth';
import {
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  Loader2,
  CircleAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/cn';
import { resolveCssColor } from '@/shared/theme/branding';

export function SavedPaymentMethodsCard() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<SavedPaymentMethodDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    let active = true;
    const initFetch = async () => {
      try {
        const res = await paymentsApi.getSavedMethods();
        if (active && res.success && res.data) {
          setMethods(res.data);
        }
      } catch {
        // Non-blocking
      } finally {
        if (active) setLoading(false);
      }
    };
    initFetch();
    return () => {
      active = false;
    };
  }, []);

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentsApi.getSavedMethods();
      if (res.success && res.data) {
        setMethods(res.data);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await paymentsApi.deleteSavedMethod(id);
      if (res.success) {
        toast.success('Payment method removed successfully.');
        setMethods((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error(res.message || 'Could not remove card.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove payment method.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setSetupLoading(true);
    try {
      const res = await paymentsApi.createSetupIntent();
      if (res.success && res.data?.clientSecret) {
        setSetupSecret(res.data.clientSecret);
        const key = res.data.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
        setStripePromise(
          loadStripe(key, {
            developerTools: {
              assistant: {
                enabled: false,
              },
            },
          }),
        );
      } else {
        toast.error('Could not initialize card setup.');
        setAddModalOpen(false);
      }
    } catch {
      toast.error('Failed to connect to payment vault.');
      setAddModalOpen(false);
    } finally {
      setSetupLoading(false);
    }
  };

  const getBrandBadge = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes('visa')) return 'bg-blue-600/10 text-blue-500 border-blue-500/20';
    if (b.includes('mastercard')) return 'bg-amber-600/10 text-amber-500 border-amber-500/20';
    if (b.includes('amex') || b.includes('american')) return 'bg-cyan-600/10 text-cyan-500 border-cyan-500/20';
    if (b.includes('discover')) return 'bg-orange-600/10 text-orange-500 border-orange-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className="rounded-3xl border border-hairline bg-surface shadow-[var(--shadow-e1)] overflow-hidden">
      <CardHeader className="border-b border-hairline/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-brand" />
              <CardTitle className="font-display text-lg font-semibold text-ink">
                Saved Payment Methods
              </CardTitle>
            </div>
            <p className="text-xs text-ink-soft">
              Manage credit and debit cards securely vaulted with Stripe for 1-click event checkout.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="ticketspan-spring-btn h-8 rounded-xl bg-brand font-mono text-xs font-semibold text-brand-ink hover:opacity-90 gap-1.5 shadow-sm"
          >
            <Plus className="size-3.5" /> Add New Card
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-ink-soft gap-2 font-mono text-xs animate-pulse">
            <Loader2 className="size-4 animate-spin text-brand" /> Loading saved payment methods…
          </div>
        ) : methods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline-strong p-6 text-center space-y-2">
            <CreditCard className="mx-auto size-7 stroke-1 text-ink-faint" />
            <p className="font-display text-sm font-semibold text-ink">No saved payment methods</p>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              Save a card for faster checkout on upcoming tickets. Cards are securely stored directly in Stripe's PCI-compliant vault.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddModal}
              className="mt-2 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Plus className="size-3.5" /> Add Card Now
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {methods.map((method) => (
              <div
                key={method.id}
                className="group relative flex items-center justify-between rounded-2xl border border-hairline bg-surface-sunken p-4 transition-all duration-200 hover:border-brand/40 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-bold uppercase', getBrandBadge(method.brand))}>
                    {method.brand.slice(0, 4)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-sm font-semibold text-ink tracking-wider">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="font-mono text-[11px] text-ink-soft">
                      Expires {String(method.expMonth).padStart(2, '0')}/{String(method.expYear).slice(-2)}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  disabled={deletingId === method.id}
                  onClick={() => handleDelete(method.id)}
                  className="size-8 rounded-lg text-ink-soft hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                  title="Remove card"
                  aria-label={`Remove ${method.brand} ending in ${method.last4}`}
                >
                  {deletingId === method.id ? (
                    <Loader2 className="size-3.5 animate-spin text-danger" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-surface-elevated border border-hairline px-3.5 py-2.5 text-[11px] text-ink-soft">
          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
          <span>
            Zero card storage on TicketSpan servers. Card data is vaulted directly in Stripe PCI DSS Level 1 infrastructure.
          </span>
        </div>
      </CardContent>

      {/* Add Card Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border border-hairline shadow-2xl bg-surface text-ink">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-brand" />
              <DialogTitle className="font-display text-lg font-semibold">
                Add Saved Payment Method
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-ink-soft">
              Enter your card details to securely vault with Stripe for instant 1-click checkout.
            </DialogDescription>
          </div>

          {setupLoading || !setupSecret || !stripePromise ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="size-7 animate-spin text-brand" />
              <p className="text-xs text-ink-soft font-mono">Initializing secure payment vault…</p>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: resolveCssColor('--voltage-accent'),
                    colorBackground: resolveCssColor('--stage'),
                    colorText: resolveCssColor('--on-stage'),
                    colorTextPlaceholder: resolveCssColor('--on-stage', 0.4),
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <AddCardSetupForm
                user={user}
                onSuccess={() => {
                  setAddModalOpen(false);
                  fetchMethods();
                }}
                onCancel={() => setAddModalOpen(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddCardSetupForm({
  user,
  onSuccess,
  onCancel,
}: {
  user: UserProfile | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message ?? 'Card authorization failed. Please verify details.');
        setSubmitting(false);
        return;
      }

      if (setupIntent && (setupIntent.status === 'succeeded' || setupIntent.status === 'processing')) {
        toast.success('Card successfully saved to your profile!');
        onSuccess();
        return;
      }

      setSubmitting(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Card setup encountered an error.';
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  const initialZip = user?.billingZip || user?.zip || undefined;
  const initialName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
              name: initialName,
              email: user?.email || undefined,
              phone: user?.phone || undefined,
              address: {
                postal_code: initialZip,
                line1: user?.billingAddressLine || user?.addressLine || undefined,
                city: user?.billingCity || user?.city || undefined,
                state: user?.billingState || user?.state || undefined,
                country: 'US',
              },
            },
          },
        }}
      />

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[11.5px] leading-relaxed">
          <CircleAlert className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
          className="flex-1 rounded-xl h-10 text-xs font-semibold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 ticketspan-spring-btn rounded-xl h-10 bg-brand text-brand-ink text-xs font-bold shadow-md hover:opacity-90 gap-1.5"
        >
          {submitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving Card…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" /> Save Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
