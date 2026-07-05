import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listTenants,
  createTenant,
  archiveTenant,
  setTenantAch,
  achEnabledCount,
} from '@/features/developer/services/developerService';
import { listFeeFormulas } from '@/features/developer/services/developerFeeService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
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

type AchFilter = 'all' | 'enabled' | 'disabled';

const ACH_FILTERS: { value: AchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'ACH Enabled' },
  { value: 'disabled', label: 'ACH Disabled' },
];

export function DeveloperTenantsPage() {
  const { data, loading, error, reload } = useAsync(useCallback(() => listTenants(), []));
  const { data: feeFormulas } = useAsync(useCallback(() => listFeeFormulas(), []));

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [search, setSearch] = useState('');
  const [achFilter, setAchFilter] = useState<AchFilter>('all');
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [achFormulaByTenant, setAchFormulaByTenant] = useState<Record<string, string>>({});

  const tenants = useMemo(() => data ?? [], [data]);
  const enabledCount = achEnabledCount(tenants);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (achFilter === 'enabled' && !t.achEnabled) return false;
      if (achFilter === 'disabled' && t.achEnabled) return false;
      if (q && !`${t.name} ${t.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tenants, search, achFilter]);

  async function submit() {
    setSubmitting(true);
    setFormError(null);
    try {
      await createTenant(form);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      reload();
    } catch (caught) {
      setFormError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAch(tenantsId: string, enabled: boolean) {
    const formula = achFormulaByTenant[tenantsId] ?? '';
    if (enabled && !formula) {
      setFormError('Pick an ACH fee formula before enabling ACH for this tenant.');
      return;
    }
    setBusyTenantId(tenantsId);
    setFormError(null);
    try {
      await setTenantAch(tenantsId, enabled, formula);
      reload();
    } catch (caught) {
      setFormError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Every team on your platform</h1>
        <p className="text-sm text-muted-foreground">
          Each one is an organizer trusting your infrastructure to run their events.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tenants…"
          className="h-9 w-56"
          aria-label="Search tenants"
        />
        <div className="flex gap-1">
          {ACH_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setAchFilter(f.value)}
              className={`h-9 rounded-md border px-3 text-sm ${
                achFilter === f.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-hairline-strong text-muted-foreground hover:bg-surface-sunken'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Close' : '+ New Tenant'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {visible.length} {visible.length === 1 ? 'team' : 'teams'} shown · {enabledCount} can take bank transfers
      </p>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      {showCreate ? (
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

            <div className="md:col-span-2">
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create tenant'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="space-y-2">
        {visible.map((tenant) => (
          <Card key={tenant.tenantsId}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={`/tenants/${tenant.tenantsId}`} className="font-medium text-primary">
                  {tenant.name} <span className="text-muted-foreground">/{tenant.slug}</span>
                </Link>
                <span className="text-sm text-muted-foreground">
                  {centsToUSD(tenant.totalRevenueCents)} revenue · {tenant.memberCount} members · {tenant.eventCount} events
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                {tenant.achEnabled ? (
                  <Badge variant="success">💳 ACH: ON</Badge>
                ) : (
                  <Badge variant="neutral">💳 ACH: OFF</Badge>
                )}
                {!tenant.achEnabled ? (
                  <Select
                    className="h-8 w-44"
                    value={achFormulaByTenant[tenant.tenantsId] ?? ''}
                    disabled={busyTenantId === tenant.tenantsId}
                    onChange={(e) =>
                      setAchFormulaByTenant((prev) => ({ ...prev, [tenant.tenantsId]: e.target.value }))
                    }
                    aria-label={`ACH fee formula for ${tenant.name}`}
                  >
                    <option value="">— ACH fee formula —</option>
                    {(feeFormulas ?? []).map((f) => (
                      <option key={f.feeFormulasId} value={f.feeFormulasId}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <Switch
                  checked={tenant.achEnabled}
                  disabled={busyTenantId === tenant.tenantsId}
                  label={`ACH payments for ${tenant.name}`}
                  onCheckedChange={(enabled) => toggleAch(tenant.tenantsId, enabled)}
                />
                <div className="ml-auto flex items-center gap-3">
                  <Link to={`/tenants/${tenant.tenantsId}`} className="text-sm text-primary">
                    View Events
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      busyTenantId
                        ? undefined
                        : archiveTenant(tenant.tenantsId).then(reload).catch((caught) => setFormError(rpcErrorMessage(caught)))
                    }
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No teams match that filter. Clear the search or invite a new tenant — the platform has room.
          </p>
        ) : null}
      </div>
    </div>
  );
}
