import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listFeeFormulas,
  createFeeFormula,
  updateFeeFormula,
  deleteFeeFormula,
  listAllEvents,
  assignFeeFormula,
  previewFee,
  type FeeFormula,
} from '@/features/developer/services/developerFeeService';
import {
  getRevenueReport,
  getTenantActivity,
  listFeeOverrides,
  tierLabel,
} from '@/features/developer/services/developerBillingService';
import {
  buildFeesIntel,
  filterCards,
  sortCards,
  type CardSort,
  type Insight,
  type TenantCard,
} from '@/features/developer/services/feesIntel';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/shared/ui/table';
import {
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
} from 'lucide-react';

const EMPTY_FORM = { name: '', percent: '', flat: '', max: '' };
const PREVIEW_PRICE = 5000;

const SORTS: { value: CardSort; label: string }[] = [
  { value: 'fees', label: 'Highest Fees' },
  { value: 'leakage', label: 'Most Unpriced Items' },
  { value: 'tickets', label: 'Most Tickets' },
  { value: 'name', label: 'Name' },
];

const INSIGHT_STYLES: Record<Insight['tone'], string> = {
  info: 'border-l-primary bg-primary/5 text-foreground',
  warn: 'border-l-warning bg-warning/10 text-warning-foreground',
  success: 'border-l-success bg-success/10 text-success-foreground',
};

export function DeveloperFeesPage() {
  const formulasLoader = useCallback(() => listFeeFormulas(), []);
  const eventsLoader = useCallback(() => listAllEvents(), []);
  const activityLoader = useCallback(() => getTenantActivity('', ''), []);
  const overridesLoader = useCallback(() => listFeeOverrides(), []);
  const reportLoader = useCallback(() => getRevenueReport('0', '0'), []);

  const formulas = useAsync(formulasLoader);
  const events = useAsync(eventsLoader);
  const activity = useAsync(activityLoader);
  const overrides = useAsync(overridesLoader);
  const report = useAsync(reportLoader);

  const [form, setForm] = useState(EMPTY_FORM);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CardSort>('fees');
  const [expanded, setExpanded] = useState<string | null>(null);

  const formulaList = useMemo(() => formulas.data ?? [], [formulas.data]);
  const byId = useMemo(
    () => new Map(formulaList.map((f) => [f.feeFormulasId, f])),
    [formulaList],
  );

  const intel = useMemo(
    () =>
      buildFeesIntel(
        formulaList,
        events.data ?? [],
        activity.data ?? [],
        overrides.data ?? [],
        report.data,
      ),
    [formulaList, events.data, activity.data, overrides.data, report.data],
  );

  const cards = useMemo(
    () => sortCards(filterCards(intel.cards, search), sort),
    [intel.cards, search, sort],
  );

  const loading = formulas.loading || events.loading || activity.loading;

  async function createFormula() {
    setSubmitting(true);
    setError(null);
    try {
      await createFeeFormula({
        name: form.name,
        percentBps: Math.round(parseFloat(form.percent || '0') * 100),
        flatCents: Math.round(parseFloat(form.flat || '0') * 100),
        maxFeeCents: Math.round(parseFloat(form.max || '0') * 100),
      });
      setForm(EMPTY_FORM);
      formulas.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(formula: FeeFormula) {
    try {
      await updateFeeFormula({ ...formula, isActive: !formula.isActive });
      formulas.reload();
      events.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function removeFormula(id: string) {
    try {
      await deleteFeeFormula(id);
      formulas.reload();
      events.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function assign(kind: 'ticket' | 'table', targetId: string, feeFormulasId: string) {
    if (!overrideReason.trim()) {
      setError('Enter an override reason before changing a fee assignment.');
      return;
    }
    try {
      await assignFeeFormula(kind, targetId, feeFormulasId, overrideReason.trim());
      events.reload();
      activity.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pricing Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Platform take-rates, fee formula library, and tenant fee leak detection.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link
            to="/fee-overrides"
            className="rounded-lg border border-border px-3 py-1.5 font-semibold text-foreground hover:bg-muted"
          >
            Manage Overrides
          </Link>
          <Link
            to="/revenue"
            className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-90"
          >
            Revenue Report
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Service Fee Revenue (12 Mo)"
          value={centsToUSD(intel.summary.serviceFeeRevenueCents)}
          icon={<DollarSign className="size-4 text-primary" />}
        />
        <StatCard
          label="Active Fee Formulas"
          value={`${intel.summary.activeFormulas} / ${intel.summary.totalFormulas}`}
          icon={<Layers className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Unpriced Items"
          value={String(intel.summary.unassignedItems)}
          hint={intel.summary.unassignedItems > 0 ? `of ${intel.summary.pricedItems} items` : '100% pricing coverage'}
          tone={intel.summary.unassignedItems > 0 ? 'warn' : 'success'}
        />
        <StatCard
          label="Active Overrides"
          value={String(intel.summary.activeOverrides)}
          hint={intel.summary.expiringOverrides > 0 ? `${intel.summary.expiringOverrides} expiring ≤30d` : undefined}
          tone={intel.summary.expiringOverrides > 0 ? 'warn' : 'default'}
        />
      </section>

      {intel.insights.length > 0 && (
        <section className="space-y-2">
          {intel.insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-xl border border-l-4 p-3.5 text-xs sm:text-sm font-medium ${INSIGHT_STYLES[insight.tone]}`}
            >
              💡 {insight.text}
            </div>
          ))}
        </section>
      )}

      {/* Fee Formula Library */}
      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Fee Formula Library
          </CardTitle>
          <CardDescription>
            Configured platform fee structures available for ticket and table assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 items-end">
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="formula-name" className="text-xs">Formula Name</Label>
              <Input
                id="formula-name"
                className="h-9 text-xs"
                placeholder="e.g. Standard Tier 1"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formula-percent" className="text-xs">Percent (%)</Label>
              <Input
                id="formula-percent"
                className="h-9 text-xs"
                placeholder="5.0"
                value={form.percent}
                onChange={(e) => setForm((p) => ({ ...p, percent: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formula-flat" className="text-xs">Flat ($)</Label>
              <Input
                id="formula-flat"
                className="h-9 text-xs"
                placeholder="1.50"
                value={form.flat}
                onChange={(e) => setForm((p) => ({ ...p, flat: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formula-max" className="text-xs">Max Cap ($)</Label>
              <Input
                id="formula-max"
                className="h-9 text-xs"
                placeholder="25.00"
                value={form.max}
                onChange={(e) => setForm((p) => ({ ...p, max: e.target.value }))}
              />
            </div>
            <div>
              <Button
                size="sm"
                onClick={createFormula}
                disabled={submitting || !form.name}
                className="h-9 w-full text-xs gap-1"
              >
                <Plus className="size-3.5" />
                {submitting ? 'Adding…' : 'Add Formula'}
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {intel.usage.map(({ formula: f, assignedCount }) => (
              <div key={f.feeFormulasId} className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs sm:text-sm bg-card hover:bg-muted/30 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{f.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(f.percentBps / 100).toFixed(2)}% + {centsToUSD(f.flatCents)}
                    {f.maxFeeCents ? ` (cap: ${centsToUSD(f.maxFeeCents)})` : ''}
                  </span>
                  {!f.isActive && <Badge variant="warn">Inactive</Badge>}
                  <span className="text-xs text-muted-foreground">
                    · {assignedCount} item{assignedCount === 1 ? '' : 's'} · {centsToUSD(previewFee(PREVIEW_PRICE, f))} fee on $50.00
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => toggleActive(f)}
                  >
                    {f.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => removeFormula(f.feeFormulasId)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenants Pricing Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Tenants Pricing Status ({cards.length})
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant or tier…"
                className="pl-9 h-9 text-xs"
                aria-label="Search tenants"
              />
            </div>
            <Select
              className="h-9 w-auto text-xs"
              value={sort}
              onChange={(e) => setSort(e.target.value as CardSort)}
              aria-label="Sort tenants"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading pricing intel…</div>
        ) : cards.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No tenants match the search filter.</div>
        ) : (
          <div className="grid gap-3">
            {cards.map((card) => (
              <TenantCardView
                key={card.tenantsId}
                card={card}
                open={expanded === card.tenantsId}
                onToggle={() => setExpanded((prev) => (prev === card.tenantsId ? null : card.tenantsId))}
              >
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor={`reason-${card.tenantsId}`} className="text-xs">
                      Override Reason (Required to change assignment)
                    </Label>
                    <Input
                      id={`reason-${card.tenantsId}`}
                      value={overrideReason}
                      placeholder="e.g. 501(c)(3) nonprofit partner adjustment"
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  {card.events.map((ev) => (
                    <div key={ev.eventsId} className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2 text-xs font-semibold">
                        <span className="text-foreground">{ev.title}</span>
                        <span className="text-muted-foreground capitalize">{ev.status}</span>
                      </div>
                      {ev.items.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground">No ticket types or tables configured.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="h-8 text-xs">Item</TableHead>
                              <TableHead className="h-8 text-xs">Price</TableHead>
                              <TableHead className="h-8 text-xs">Fee Formula Assignment</TableHead>
                              <TableHead className="h-8 text-xs text-right">Fee Yield</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ev.items.map((it) => (
                              <TableRow key={`${it.kind}-${it.id}`}>
                                <TableCell className="py-2">
                                  <span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                    {it.kind}
                                  </span>
                                  <span className="font-medium text-foreground">{it.label}</span>
                                </TableCell>
                                <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                                  {centsToUSD(it.priceCents)}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Select
                                    className="h-8 w-60 text-xs"
                                    value={it.feeFormulasId}
                                    onChange={(e) => assign(it.kind as 'ticket' | 'table', it.id, e.target.value)}
                                  >
                                    <option value="">— None (No Fee) —</option>
                                    {formulaList.map((f) => (
                                      <option key={f.feeFormulasId} value={f.feeFormulasId}>
                                        {f.name}
                                      </option>
                                    ))}
                                  </Select>
                                </TableCell>
                                <TableCell className="py-2 text-right font-mono text-xs font-bold text-foreground">
                                  {centsToUSD(it.feeFormulasId ? previewFee(it.priceCents, byId.get(it.feeFormulasId)) : it.feeCents)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  ))}
                </div>
              </TenantCardView>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'warn' | 'success';
}) {
  const hintClass = tone === 'warn' ? 'text-warning font-semibold' : tone === 'success' ? 'text-success font-semibold' : 'text-muted-foreground';
  return (
    <Card>
      <CardContent className="space-y-1.5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {hint && <p className={`text-xs ${hintClass}`}>{hint}</p>}
      </CardContent>
    </Card>
  );
}

function TenantCardView({
  card,
  open,
  onToggle,
  children,
}: {
  card: TenantCard;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card className={open ? 'border-primary/50 shadow-md' : undefined}>
      <button className="w-full text-left focus-visible:outline-none" onClick={onToggle}>
        <div className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold text-foreground">{card.name}</span>
              {card.tier && <Badge variant="secondary">{tierLabel(card.tier)}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.ticketsSold.toLocaleString()} tickets sold across events
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="neutral">{card.itemCount} priced item{card.itemCount === 1 ? '' : 's'}</Badge>
              {card.unassignedCount > 0 ? (
                <Badge variant="warn">{card.unassignedCount} unpriced</Badge>
              ) : card.itemCount > 0 ? (
                <Badge variant="success">Fully Priced</Badge>
              ) : null}
              {card.hasOverride && <Badge variant="voltage">Override</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs uppercase text-muted-foreground">Total Fees</span>
              <span className="font-mono text-lg font-bold text-foreground">{centsToUSD(card.serviceFeeCents)}</span>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </div>
          </div>
        </div>
      </button>
      {open && <div className="border-t border-border/40 p-5 pt-3">{children}</div>}
    </Card>
  );
}
