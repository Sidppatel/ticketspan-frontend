import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listTenantReportingAccess,
  setTenantTier,
  setTenantAdvancedReporting,
  TENANT_TIERS,
  type TenantTier,
} from '@/features/developer/services/developerService';
import { rpcErrorMessage } from '@/shared/session';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const ADVANCED_TIERS: readonly string[] = ['professional', 'business', 'enterprise'];

export function DeveloperReportingAccessPage() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);

  const loader = useCallback(() => listTenantReportingAccess(submittedSearch), [submittedSearch]);
  const { data, loading, error, reload } = useAsync(loader);

  async function runAction(tenantsId: string, action: () => Promise<string>) {
    setBusyTenantId(tenantsId);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await action());
      reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  function changeTier(tenantsId: string, name: string, currentTier: string, nextTier: TenantTier) {
    const confirmed = window.confirm(
      `Change tier for "${name}" from ${currentTier} to ${nextTier}? Reporting access updates immediately.`,
    );
    if (confirmed) {
      void runAction(tenantsId, () => setTenantTier(tenantsId, nextTier));
    }
  }

  function toggleOverride(tenantsId: string, enabled: boolean) {
    void runAction(tenantsId, () => setTenantAdvancedReporting(tenantsId, enabled));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reporting access</h1>
      <p className="text-sm text-muted-foreground">
        Assign subscription tiers and override Advanced Reporting per tenant. Professional, Business and
        Enterprise include Advanced Reporting; the override grants it regardless of tier. Every change is
        written to the audit log.
      </p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search tenants by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? setSubmittedSearch(search) : undefined)}
          className="max-w-sm"
        />
      </div>

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      {actionMessage ? <p className="text-sm text-success">{actionMessage}</p> : null}
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Tenant</th>
                <th className="py-2 pr-3">Tier</th>
                <th className="py-2 pr-3">Advanced reporting</th>
                <th className="py-2 pr-3">Developer override</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((tenant) => (
                <tr key={tenant.tenantsId} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{tenant.name}</span>{' '}
                    <span className="text-muted-foreground">/{tenant.slug}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <Select
                      className="h-8 w-40"
                      value={tenant.tier}
                      disabled={busyTenantId === tenant.tenantsId}
                      onChange={(e) =>
                        changeTier(tenant.tenantsId, tenant.name, tenant.tier, e.target.value as TenantTier)
                      }
                    >
                      {TENANT_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-3">
                    {tenant.hasAdvancedReporting ? (
                      <Badge variant="success">
                        Enabled
                        {tenant.advancedReportingEnabled && !ADVANCED_TIERS.includes(tenant.tier)
                          ? ' (override)'
                          : ''}
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Basic only</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Switch
                      checked={tenant.advancedReportingEnabled}
                      disabled={busyTenantId === tenant.tenantsId}
                      label={`Advanced reporting override for ${tenant.name}`}
                      onCheckedChange={(enabled) => toggleOverride(tenant.tenantsId, enabled)}
                    />
                  </td>
                  <td className="py-2">
                    {tenant.archived ? <Badge variant="warn">Archived</Badge> : <Badge variant="neutral">Active</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tenants match this search.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
