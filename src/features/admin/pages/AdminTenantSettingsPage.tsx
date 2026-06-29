import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMyTenant,
  updateMyTenantContact,
  updateMyTenantBranding,
  getTenantStripeProfile,
  type TenantContactInput,
  type TenantBrandingInput,
} from '@/features/admin/services/tenantService';
import { getStripeStatus, startStripeOnboarding } from '@/features/admin/services/financialService';
import { uploadImage } from '@/shared/upload';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import type { Tenant, TenantStripeProfile } from '@/shared/proto/tenant';
import type { StripeStatus } from '@/shared/proto/admin';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const EMPTY: TenantContactInput = {
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
};

const EMPTY_BRANDING: TenantBrandingInput = {
  logoImagesId: '',
  brandPrimary: '#000000',
  brandSecondary: '#666666',
  brandAccent: '#f59e0b',
};

export function AdminTenantSettingsPage() {
  const { tenantsId } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantContactInput>(EMPTY);
  const [branding, setBranding] = useState<TenantBrandingInput>(EMPTY_BRANDING);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
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
        setLogoUrl(value.logoUrl);
        setBranding({
          logoImagesId: value.logoUrl ? (value.logoUrl.split('/').pop() ?? '') : '',
          brandPrimary: value.brandPrimary || EMPTY_BRANDING.brandPrimary,
          brandSecondary: value.brandSecondary || EMPTY_BRANDING.brandSecondary,
          brandAccent: value.brandAccent || EMPTY_BRANDING.brandAccent,
        });
      })
      .catch((caught) => setError(rpcErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!tenantsId) {
      return;
    }
    getStripeStatus(tenantsId).then(setStripe).catch(() => undefined);
    getTenantStripeProfile(tenantsId).then(setStripeProfile).catch(() => undefined);
  }, [tenantsId]);

  useEffect(() => {
    if (!stripeReturn || !tenantsId) {
      return;
    }
    getStripeStatus(tenantsId).then(setStripe).catch((caught) => setError(rpcErrorMessage(caught)));
    searchParams.delete('stripe');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeReturn, tenantsId]);

  function field(key: keyof TenantContactInput) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateMyTenantContact(form);
      setNotice('Settings saved.');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  function brandField(key: keyof TenantBrandingInput) {
    return (value: string) => setBranding((prev) => ({ ...prev, [key]: value }));
  }

  async function onLogo(file: File | undefined) {
    if (!file || !tenantsId) {
      return;
    }
    setLogoBusy(true);
    setError(null);
    try {
      const result = await uploadImage(file, 'tenant', tenantsId);
      setBranding((prev) => ({ ...prev, logoImagesId: result.imagesId }));
      setLogoUrl(URL.createObjectURL(file));
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setLogoBusy(false);
    }
  }

  async function saveBranding() {
    setSavingBrand(true);
    setError(null);
    setNotice(null);
    try {
      await updateMyTenantBranding(branding);
      setNotice('Branding saved.');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSavingBrand(false);
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
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const hasAccount = stripeProfile?.hasAccount ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Tenant Settings</h1>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <ReadOnly label="Slug" value={tenant?.slug ?? ''} />
            <ReadOnly label="Company name" value={tenant?.name ?? ''} />
            <ReadOnly label="Legal name" value={tenant?.legalName ?? ''} />
          </div>

          <Labeled label="Company phone" value={form.phone} onChange={field('phone')} />
          <Labeled label="Address line 1" value={form.addressLine1} onChange={field('addressLine1')} />
          <Labeled label="Address line 2" value={form.addressLine2} onChange={field('addressLine2')} />
          <div className="grid grid-cols-3 gap-3">
            <Labeled label="City" value={form.city} onChange={field('city')} />
            <Labeled label="State" value={form.state} onChange={field('state')} />
            <Labeled label="Zip code" value={form.zip} onChange={field('zip')} />
          </div>

          {notice ? <p className="text-sm text-success">{notice}</p> : null}
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-muted">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo</span>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="logo">Company logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                disabled={logoBusy}
                onChange={(e) => onLogo(e.target.files?.[0])}
              />
              {logoBusy ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" value={branding.brandPrimary} onChange={brandField('brandPrimary')} />
            <ColorField label="Secondary" value={branding.brandSecondary} onChange={brandField('brandSecondary')} />
            <ColorField label="Accent" value={branding.brandAccent} onChange={brandField('brandAccent')} />
          </div>

          <Button onClick={saveBranding} disabled={savingBrand}>
            {savingBrand ? 'Saving…' : 'Save branding'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAccount ? (
            <div className="text-sm text-muted-foreground">
              <p>Account: {stripeProfile?.businessName || '—'}</p>
              {stripe?.bankLast4 ? <p>Payout bank: •••• {stripe.bankLast4}</p> : null}
              {stripe ? (
                <p>
                  charges: {String(stripe.chargesEnabled)} · payouts: {String(stripe.payoutsEnabled)} · details:{' '}
                  {String(stripe.detailsSubmitted)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Stripe account connected yet.</p>
          )}
          <Button size="sm" onClick={openStripe}>
            {hasAccount ? 'Manage on Stripe' : 'Connect Stripe account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Labeled({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} disabled readOnly />
    </div>
  );
}
