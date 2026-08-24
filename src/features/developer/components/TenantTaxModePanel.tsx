import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import { rpcErrorMessage } from '@/shared/session';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import {
  listTenantReportingAccess,
  setTenantTaxMode,
  setTenantTaxDefault,
} from '@/features/developer/services/developerService';
import { Building2, Search } from 'lucide-react';

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
        : `TicketSpan will collect and remit sales tax on behalf of "${name}". Reason:`,
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

  async function changeDefaultTax(tenantsId: string, name: string, chargeTax: boolean) {
    const reason = window.prompt(
      chargeTax
        ? `New events for "${name}" will charge sales tax by default. Reason:`
        : `New events for "${name}" will be tax-exempt by default. Reason:`,
    );
    if (!reason || !reason.trim()) {
      return;
    }
    setBusyTenantId(tenantsId);
    setActionError(null);
    setActionMessage(null);
    try {
      setActionMessage(await setTenantTaxDefault(tenantsId, chargeTax, reason.trim()));
      reload();
    } catch (caught) {
      setActionError(rpcErrorMessage(caught));
    } finally {
      setBusyTenantId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Tax Collection by Tenant</CardTitle>
            <CardDescription>
              Control whether TicketSpan or the tenant remits sales tax to state tax authorities.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? setSubmittedSearch(search) : undefined)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {actionMessage && (
          <Alert variant="success">
            <AlertDescription>{actionMessage}</AlertDescription>
          </Alert>
        )}
        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading tenants…</div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Remittance Authority</TableHead>
                  <TableHead>Default Tax Policy</TableHead>
                  <TableHead>Change Collection Mode</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((tenant) => (
                  <TableRow key={tenant.tenantsId}>
                    <TableCell>
                      <div className="font-medium text-foreground">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/{tenant.slug}</div>
                    </TableCell>
                    <TableCell>
                      {tenant.taxCollectionMode === TAX_MODE_SELF ? (
                        <Badge variant="warn">Tenant Self-Collects</Badge>
                      ) : (
                        <Badge variant="success">TicketSpan (Platform)</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        className="h-8 w-44 text-xs"
                        value={tenant.chargeTaxByDefault ? 'charge' : 'exempt'}
                        disabled={busyTenantId === tenant.tenantsId}
                        onChange={(e) =>
                          void changeDefaultTax(tenant.tenantsId, tenant.name, e.target.value === 'charge')
                        }
                      >
                        <option value="charge">Charge Tax (Default)</option>
                        <option value="exempt">Tax-Exempt by Default</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        className="h-8 w-44 text-xs"
                        value={tenant.taxCollectionMode || TAX_MODE_PLATFORM}
                        disabled={busyTenantId === tenant.tenantsId}
                        onChange={(e) =>
                          void changeMode(tenant.tenantsId, tenant.name, e.target.value as 'platform' | 'self')
                        }
                      >
                        <option value={TAX_MODE_PLATFORM}>Platform (TicketSpan)</option>
                        <option value={TAX_MODE_SELF}>Tenant Self-Collects</option>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {tenant.archived ? <Badge variant="warn">Archived</Badge> : <Badge variant="neutral">Active</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Building2 className="size-6 text-muted-foreground" />}
                title="No Tenants Found"
                description="No tenant records matched the search query."
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
