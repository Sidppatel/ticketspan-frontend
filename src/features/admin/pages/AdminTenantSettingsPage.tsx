import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getMyTenant,
  updateMyTenantContact,
  getTenantStripeProfile,
  type TenantContactInput,
} from '@/features/admin/services/tenantService';
import { getStripeStatus, startStripeOnboarding } from '@/features/admin/services/financialService';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import { formatUsPhone } from '@/shared/lib/validation';
import type { Tenant, TenantStripeProfile } from '@/shared/proto/tenant';
import type { StripeStatus } from '@/shared/proto/admin';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Building2, CreditCard, Palette, ExternalLink, Save } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY: TenantContactInput = {
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
};

export function AdminTenantSettingsPage() {
  const { tenantsId } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantContactInput>(EMPTY);
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [stripeProfile, setStripeProfile] = useState<TenantStripeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const stripeReturn = searchParams.get('stripe');

  useEffect(() => {
    getMyTenant()
      .then((value) => {
        setTenant(value);
        setForm({
          phone: value.phone,
          addressLine1: value.addressLine1,
          addressLine2: value.addressLine2,
          city: value.city,
          state: value.state,
          zip: value.zip,
        });
      })
      .catch((caught) => setError(rpcErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tenantsId) return;
    getStripeStatus(tenantsId).then(setStripe).catch(() => undefined);
    getTenantStripeProfile(tenantsId).then(setStripeProfile).catch(() => undefined);
  }, [tenantsId]);

  useEffect(() => {
    if (!stripeReturn || !tenantsId) return;
    getStripeStatus(tenantsId).then(setStripe).catch((caught) => setError(rpcErrorMessage(caught)));
    searchParams.delete('stripe');
    setSearchParams(searchParams, { replace: true });
  }, [stripeReturn, tenantsId, searchParams, setSearchParams]);

  function field(key: keyof TenantContactInput) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateMyTenantContact(form);
      setNotice('Settings saved successfully.');
      toast.success('Organization settings saved.');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function openStripe() {
    setError(null);
    try {
      const url = await startStripeOnboarding(tenantsId ?? '');
      window.open(url, '_blank');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  const hasAccount = stripeProfile?.hasAccount ?? false;

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div className="space-y-1 border-b border-border/40 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Organization Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage your organization profile, physical address, and Stripe payout connections.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <Alert variant="success">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {}
      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Business Profile & Contact
          </CardTitle>
          <CardDescription>
            Official contact and location information shown on customer receipts and claim passes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Subdomain Slug</Label>
              <Input value={tenant?.slug ?? ''} disabled className="h-9 text-xs font-mono bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display Name</Label>
              <Input value={tenant?.name ?? ''} disabled className="h-9 text-xs bg-muted/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Legal Name</Label>
              <Input value={tenant?.legalName ?? ''} disabled className="h-9 text-xs bg-muted/30" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company-phone" className="text-xs">Company Phone</Label>
            <Input
              id="company-phone"
              className="h-9 text-xs"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={(e) => field('phone')(formatUsPhone(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address-1" className="text-xs">Street Address Line 1</Label>
            <Input
              id="address-1"
              className="h-9 text-xs"
              value={form.addressLine1}
              onChange={(e) => field('addressLine1')(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address-2" className="text-xs">Street Address Line 2 (Suite, Unit, etc.)</Label>
            <Input
              id="address-2"
              className="h-9 text-xs"
              value={form.addressLine2}
              onChange={(e) => field('addressLine2')(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs">City</Label>
              <Input
                id="city"
                className="h-9 text-xs"
                value={form.city}
                onChange={(e) => field('city')(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-xs">State</Label>
              <Input
                id="state"
                className="h-9 text-xs"
                value={form.state}
                onChange={(e) => field('state')(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="zip" className="text-xs">ZIP Code</Label>
              <Input
                id="zip"
                className="h-9 text-xs font-mono"
                value={form.zip}
                onChange={(e) => field('zip')(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-1.5 h-9 text-xs font-semibold">
              <Save className="size-3.5" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            Branding Studio
          </CardTitle>
          <CardDescription>
            Customize your brand colors, custom logos, hero themes, and live event storefront previews.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage your high-resolution logos, primary brand colors, and preview live customer views.
          </p>
          <Link
            to="/branding"
            className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Open Branding Studio <ExternalLink className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Stripe Payouts & Connect
          </CardTitle>
          <CardDescription>
            Direct daily bank payouts and automated card payment processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {hasAccount ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs space-y-1.5 font-mono">
              <p className="text-foreground font-semibold font-sans text-sm">
                Connected Account: {stripeProfile?.businessName || 'Active'}
              </p>
              {stripe?.bankLast4 && (
                <p className="text-muted-foreground">Payout Bank: •••• {stripe.bankLast4}</p>
              )}
              {stripe && (
                <p className="text-muted-foreground">
                  Charges Enabled: {String(stripe.chargesEnabled)} · Payouts Enabled: {String(stripe.payoutsEnabled)} · Onboarding: {String(stripe.detailsSubmitted)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No Stripe Express account connected. Connect a bank account to receive direct payouts from ticket sales.
            </p>
          )}

          <Button size="sm" onClick={openStripe} className="text-xs font-semibold">
            {hasAccount ? 'Manage on Stripe' : 'Connect Stripe Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
