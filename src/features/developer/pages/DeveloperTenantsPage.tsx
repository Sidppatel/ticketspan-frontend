import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { listTenants, createTenant, archiveTenant } from '@/features/developer/services/developerService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const EMPTY_FORM = {
  slug: '',
  name: '',
  adminEmail: '',
  adminFirstName: '',
  adminLastName: '',
  legalName: '',
  countryCode: 'US',
  businessType: 'individual',
  businessUrl: '',
  productDescription: '',
  mcc: '',
  supportEmail: '',
};

export function DeveloperTenantsPage() {
  const loader = useCallback(() => listTenants(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setFormError(null);
    try {
      await createTenant(form);
      setForm(EMPTY_FORM);
      reload();
    } catch (caught) {
      setFormError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Tenants</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create tenant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(
            [
              ['slug', 'Slug'],
              ['name', 'Name'],
              ['adminEmail', 'Admin email'],
              ['adminFirstName', 'Admin first name'],
              ['adminLastName', 'Admin last name'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="md:col-span-2 mt-2 border-t pt-3">
            <p className="text-sm font-medium text-foreground">Stripe onboarding prefill (optional)</p>
            <p className="text-xs text-muted-foreground">Pre-fills the seller's Stripe Express onboarding form.</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="businessType">Business type</Label>
            <select
              id="businessType"
              className="h-9 w-full rounded-md border border-input px-2 text-sm"
              value={form.businessType}
              onChange={(e) => setForm((prev) => ({ ...prev, businessType: e.target.value }))}
            >
              <option value="individual">Individual / sole proprietorship</option>
              <option value="company">Company</option>
            </select>
          </div>

          {(
            [
              ['countryCode', 'Country code (e.g. US)'],
              ['legalName', 'Legal / business name'],
              ['businessUrl', 'Business website URL'],
              ['mcc', 'Industry MCC (4-digit code)'],
              ['supportEmail', 'Support email'],
              ['productDescription', 'Product description'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}

          {formError ? <p className="text-sm text-destructive md:col-span-2">{formError}</p> : null}
          <div className="md:col-span-2">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create tenant'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((tenant) => (
          <Card key={tenant.tenantsId}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2">
              <Link to={`/tenants/${tenant.tenantsId}`} className="font-medium text-primary">
                {tenant.name} <span className="text-muted-foreground">/{tenant.slug}</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {tenant.memberCount} members · {tenant.eventCount} events
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    submitting
                      ? undefined
                      : archiveTenant(tenant.tenantsId).then(reload).catch((caught) => setFormError(rpcErrorMessage(caught)))
                  }
                >
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
