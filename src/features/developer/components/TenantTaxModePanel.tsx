import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  listTenantReportingAccess,
  setTenantTaxMode,
} from '@/features/developer/services/developerService';

const TAX_MODE_PLATFORM = 'platform';
const TAX_MODE_SELF = 'self';

export function TenantTaxModePanel() {
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loader = useCallback(() => listTenantReportingAccess(submittedSearch), [submittedSearch]);
  const { data, loading, error, reload } = useAsync(loader);

  async function changeMode(tenantsId: string, name: string, mode: 'platform' | 'self') {
    const reason = window.prompt(
      mode === TAX_MODE_SELF
        ? `"${name}" will collect and remit its own sales tax; the tax line flows to their payout. Reason:`
        : `EntryVine will collect and remit sales tax on behalf of "${name}". Reason:`,
    );
    if (!reason || !reason.trim()) {
      return;
    }
    setBusyTenantId(tenantsId);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await setTenantTaxMode(tenantsId, mode, reason.trim()));
      reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Tax collection by tenant</CardTitle>
        <Input
          placeholder="Search tenants…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? setSubmittedSearch(search) : undefined)}
          className="h-8 w-56"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-ink-soft">
          Platform mode: EntryVine keeps the tax inside its application fee and remits it for the
          tenant. Self mode: the tax line is still charged at checkout but flows into the tenant
          payout, and the tenant remits it themselves. Changes require a reason and are
          audit-logged.
        </p>
        {actionMessage ? <p className="text-sm text-success">{actionMessage}</p> : null}
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
        {loading ? <p className="text-sm text-ink-soft">Loading tenants…</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft">
              <th className="pb-2">Tenant</th>
              <th className="pb-2">Collected by</th>
              <th className="pb-2">Mode</th>
              <th className="pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((tenant) => (
              <tr key={tenant.tenantsId} className="border-t border-hairline">
                <td className="py-1.5">
                  <span className="font-medium">{tenant.name}</span>{' '}
                  <span className="text-ink-soft">/{tenant.slug}</span>
                </td>
                <td className="py-1.5">
                  {tenant.taxCollectionMode === TAX_MODE_SELF ? (
                    <Badge variant="warn">Tenant self-collects</Badge>
                  ) : (
                    <Badge variant="success">EntryVine (platform)</Badge>
                  )}
                </td>
                <td className="py-1.5">
                  <Select
                    className="h-8 w-44"
                    value={tenant.taxCollectionMode || TAX_MODE_PLATFORM}
                    disabled={busyTenantId === tenant.tenantsId}
                    onChange={(e) =>
                      void changeMode(tenant.tenantsId, tenant.name, e.target.value as 'platform' | 'self')
                    }
                  >
                    <option value={TAX_MODE_PLATFORM}>Platform (EntryVine)</option>
                    <option value={TAX_MODE_SELF}>Tenant self-collects</option>
                  </Select>
                </td>
                <td className="py-1.5 text-right">
                  {tenant.archived ? <Badge variant="warn">Archived</Badge> : <Badge variant="neutral">Active</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.length === 0 ? (
          <p className="text-sm text-ink-soft">No tenants match this search.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
