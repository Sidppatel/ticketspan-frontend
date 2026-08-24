import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActingTenantStore } from '@/shared/actingTenant';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listTenants,
  createTenant,
  archiveTenant,
  setTenantAch,
  achEnabledCount,
} from '@/features/developer/services/developerService';
import { listFeeFormulas, setTenantDefaultFeeFormula } from '@/features/developer/services/developerFeeService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Building2, Search, Plus, CreditCard, X } from 'lucide-react';

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
  { value: 'all', label: 'All Tenants' },
  { value: 'enabled', label: 'ACH Enabled' },
  { value: 'disabled', label: 'ACH Disabled' },
];

export function DeveloperTenantsPage() {
  const navigate = useNavigate();
  const setActingTenant = useActingTenantStore((state) => state.setActingTenant);
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

  async function changeDefaultFormula(tenantsId: string, feeFormulasId: string, revert: () => void) {
    const reason = window.prompt('Why is this tenant getting a different pricing formula?');
    if (!reason || !reason.trim()) {
      revert();
      return;
    }
    setBusyTenantId(tenantsId);
    setFormError(null);
    try {
      await setTenantDefaultFeeFormula(tenantsId, feeFormulasId, reason.trim());
      reload();
    } catch (caught) {
      setFormError(rpcErrorMessage(caught));
      revert();
    } finally {
      setBusyTenantId(null);
    }
  }

  async function applyAchChange(tenantsId: string, enabled: boolean, formula: string) {
    const reason = window.prompt('Why is this tenant’s ACH setup changing?');
    if (!reason || !reason.trim()) {
      return;
    }
    setBusyTenantId(tenantsId);
    setFormError(null);
    try {
      await setTenantAch(tenantsId, enabled, formula, reason.trim());
      reload();
    } catch (caught) {
      setFormError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  async function toggleAch(tenant: { tenantsId: string; achFeeFormulasId: string }, enabled: boolean) {
    const formula = achFormulaByTenant[tenant.tenantsId] ?? tenant.achFeeFormulasId ?? '';
    if (enabled && !formula) {
      setFormError('Pick an ACH fee formula before enabling ACH for this tenant.');
      return;
    }
    await applyAchChange(tenant.tenantsId, enabled, formula);
  }

  async function changeAchFormula(tenant: { tenantsId: string; achEnabled: boolean }, formula: string) {
    setAchFormulaByTenant((prev) => ({ ...prev, [tenant.tenantsId]: formula }));
    if (tenant.achEnabled && formula) {
      await applyAchChange(tenant.tenantsId, true, formula);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tenants Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {tenants.length} event organizer teams · {enabledCount} with ACH bank transfers enabled.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="gap-1.5 self-start sm:self-auto"
        >
          {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
          {showCreate ? 'Close Builder' : 'New Tenant'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name or slug…"
            className="pl-9 h-9 text-xs"
            aria-label="Search tenants"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ACH_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={achFilter === f.value ? 'default' : 'outline'}
              onClick={() => setAchFilter(f.value)}
              className="h-8 text-xs font-semibold"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showCreate && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-200">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Register New Tenant
            </CardTitle>
            <CardDescription>
              Create an isolated organization tenant with dedicated subdomain and Stripe profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-slug" className="text-xs">Subdomain Slug</Label>
                <Input
                  id="tenant-slug"
                  className="h-9 text-xs font-mono"
                  placeholder="e.g. downtown-jazz"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-name" className="text-xs">Display Name</Label>
                <Input
                  id="tenant-name"
                  className="h-9 text-xs"
                  placeholder="e.g. Downtown Jazz Society"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-adminEmail" className="text-xs">Admin Email</Label>
                <Input
                  id="tenant-adminEmail"
                  type="email"
                  className="h-9 text-xs"
                  placeholder="admin@organization.com"
                  value={form.adminEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-adminFirstName" className="text-xs">Admin First Name</Label>
                <Input
                  id="tenant-adminFirstName"
                  className="h-9 text-xs"
                  placeholder="Jane"
                  value={form.adminFirstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminFirstName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-adminLastName" className="text-xs">Admin Last Name</Label>
                <Input
                  id="tenant-adminLastName"
                  className="h-9 text-xs"
                  placeholder="Doe"
                  value={form.adminLastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, adminLastName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-businessType" className="text-xs">Business Type</Label>
                <Select
                  id="tenant-businessType"
                  className="h-9 text-xs"
                  value={form.businessType}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessType: e.target.value }))}
                >
                  <option value="individual">Individual / Sole Proprietorship</option>
                  <option value="company">Corporation / LLC / Non-Profit</option>
                </Select>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                Stripe Onboarding Details (Optional)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tenant-legalName" className="text-xs">Legal Business Name</Label>
                  <Input
                    id="tenant-legalName"
                    className="h-9 text-xs"
                    placeholder="Downtown Jazz LLC"
                    value={form.legalName}
                    onChange={(e) => setForm((prev) => ({ ...prev, legalName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tenant-businessUrl" className="text-xs">Business Website URL</Label>
                  <Input
                    id="tenant-businessUrl"
                    className="h-9 text-xs"
                    placeholder="https://downtownjazz.org"
                    value={form.businessUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, businessUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tenant-mcc" className="text-xs">Industry MCC (4-digit code)</Label>
                  <Input
                    id="tenant-mcc"
                    className="h-9 text-xs font-mono"
                    placeholder="7922"
                    value={form.mcc}
                    onChange={(e) => setForm((prev) => ({ ...prev, mcc: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={submitting || !form.slug || !form.name}>
                {submitting ? 'Creating Tenant…' : 'Confirm Registration'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">Loading tenants directory…</div>
      ) : visible.length > 0 ? (
        <div className="grid gap-3">
          {visible.map((tenant) => (
            <Card key={tenant.tenantsId} className="hover:border-primary/40 transition-colors">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Link
                      to={`/tenants/${tenant.tenantsId}`}
                      className="font-display text-base font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {tenant.name}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        /{tenant.slug}
                      </span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">
                        {centsToUSD(tenant.totalRevenueCents)} Total Volume
                      </span>
                      <span>·</span>
                      <span>{tenant.memberCount} Team Members</span>
                      <span>·</span>
                      <span>{tenant.eventCount} Events</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/tenants/${tenant.tenantsId}`}
                      className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      View Details
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold"
                      onClick={() => {
                        setActingTenant(tenant.tenantsId, tenant.name);
                        navigate('/events');
                      }}
                    >
                      Enter Console
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        busyTenantId
                          ? undefined
                          : archiveTenant(tenant.tenantsId)
                              .then(reload)
                              .catch((caught) => setFormError(rpcErrorMessage(caught)))
                      }
                    >
                      Archive
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                      Pricing Tier:
                    </span>
                    <Select
                      className="h-7 w-44 text-xs"
                      value={tenant.defaultFeeFormulasId}
                      disabled={busyTenantId === tenant.tenantsId}
                      onChange={(e) => {
                        const select = e.target;
                        changeDefaultFormula(tenant.tenantsId, select.value, () => {
                          select.value = tenant.defaultFeeFormulasId;
                        });
                      }}
                      aria-label={`Default pricing formula for ${tenant.name}`}
                    >
                      <option value="">Platform Default</option>
                      {(feeFormulas ?? []).map((f) => (
                        <option key={f.feeFormulasId} value={f.feeFormulasId}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                      ACH Formula:
                    </span>
                    <Select
                      className="h-7 w-40 text-xs"
                      value={achFormulaByTenant[tenant.tenantsId] ?? tenant.achFeeFormulasId ?? ''}
                      disabled={busyTenantId === tenant.tenantsId}
                      onChange={(e) => changeAchFormula(tenant, e.target.value)}
                      aria-label={`ACH fee formula for ${tenant.name}`}
                    >
                      <option value="">— Select Formula —</option>
                      {(feeFormulas ?? []).map((f) => (
                        <option key={f.feeFormulasId} value={f.feeFormulasId}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tenant.achEnabled}
                      disabled={busyTenantId === tenant.tenantsId}
                      label={`ACH payments for ${tenant.name}`}
                      onCheckedChange={(enabled) => toggleAch(tenant, enabled)}
                    />
                    <Badge variant={tenant.achEnabled ? 'success' : 'neutral'}>
                      <CreditCard className="size-3" />
                      {tenant.achEnabled ? 'ACH Active' : 'ACH Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="size-6 text-muted-foreground" />}
          title="No Tenants Found"
          description="No organizer teams match your search or ACH filter. Adjust the search filter or register a new tenant."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="size-4" /> Register New Tenant
            </Button>
          }
        />
      )}
    </div>
  );
}
