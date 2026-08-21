import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ticket,
  ArrowRight,
} from 'lucide-react';
import { useActingTenantStore } from '@/shared/actingTenant';
import { useAsync } from '@/shared/hooks/useAsync';
import { listTenants } from '@/features/developer/services/developerService';
import { listAdminEvents } from '@/features/admin/services/adminService';
import { getEventPerformance } from '@/features/admin/services/reportingService';
import { centsToUSD, formatEpoch } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { EventReminderControl } from '@/features/developer/components/EventReminderControl';
import type { Event } from '@/shared/proto/event';
import type { EventPerformanceRow } from '@/shared/proto/reporting';

type EventTab = 'active_future' | 'past' | 'all' | 'drafts';

interface EventFinancialDetails {
  grossSaleCents: number;
  ordersCount: number;
  ticketsSold: number;
  ccFeeCents: number;
  developerFeeCents: number;
  tenantPaidCents: number;
  refundedCents: number;
  attendanceRateBps: number;
  capacity: number;
  checkedIn: number;
}

export function DeveloperEventsPage() {
  const navigate = useNavigate();
  const { tenantsId: activeTenantsId, setActingTenant, clear: clearActingTenant } = useActingTenantStore();

  const tenantsLoader = useCallback(() => listTenants(), []);
  const { data: tenantsData } = useAsync(tenantsLoader);
  const tenants = useMemo(() => tenantsData ?? [], [tenantsData]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenantsId ?? '');
  const [tab, setTab] = useState<EventTab>('active_future');
  const [search, setSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const effectiveTenantId = selectedTenantId || activeTenantsId || (tenants.length > 0 ? tenants[0].tenantsId : '');
  const selectedTenant = useMemo(() => tenants.find((t) => t.tenantsId === effectiveTenantId), [tenants, effectiveTenantId]);

  const eventsLoader = useCallback(async () => {
    if (!effectiveTenantId) return [];
    return listAdminEvents();
  }, [effectiveTenantId]);

  const { data: eventsData, loading: loadingEvents, error: eventsError } = useAsync(eventsLoader);
  const events = useMemo(() => eventsData ?? [], [eventsData]);

  const perfLoader = useCallback(async () => {
    if (!effectiveTenantId) return [];
    const nowSec = Math.floor(Date.now() / 1000);
    const fiveYearsAgo = BigInt(nowSec - 5 * 365 * 24 * 3600);
    const futureDate = BigInt(nowSec + 2 * 365 * 24 * 3600);
    try {
      const res = await getEventPerformance(fiveYearsAgo, futureDate);
      return res.rows;
    } catch {
      return [];
    }
  }, [effectiveTenantId]);

  const { data: perfRows } = useAsync(perfLoader);

  const perfMap = useMemo(() => {
    const map = new Map<string, EventPerformanceRow>();
    (perfRows ?? []).forEach((row) => {
      map.set(row.eventsId, row);
    });
    return map;
  }, [perfRows]);

  const now = useMemo(() => new Date(), []);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      if (q && !`${ev.title} ${ev.slug} ${ev.category}`.toLowerCase().includes(q)) {
        return false;
      }
      const endDate = ev.endDate ? new Date(Number(ev.endDate) * 1000) : null;
      const isPast = endDate ? endDate < now : false;
      const isDraft = ev.status === 'Draft';

      if (tab === 'active_future') {
        return !isPast && !isDraft;
      } else if (tab === 'past') {
        return isPast || ev.status === 'Completed';
      } else if (tab === 'drafts') {
        return isDraft;
      }
      return true;
    });
  }, [events, tab, search, now]);

  function handleSelectTenant(id: string) {
    setSelectedTenantId(id);
    const t = tenants.find((item) => item.tenantsId === id);
    if (t) {
      setActingTenant(t.tenantsId, t.name);
    } else {
      clearActingTenant();
    }
  }

  const getFinancials = useCallback(
    (event: Event): EventFinancialDetails => {
      const perf = perfMap.get(event.eventsId);
      const grossSaleCents = perf ? Number(perf.revenueCents) : 0;
      const ordersCount = perf ? perf.orders : 0;
      const ticketsSold = perf ? perf.ticketsSold : 0;
      const refundedCents = perf ? Number(perf.refundedCents) : 0;
      const attendanceRateBps = perf ? perf.attendanceRateBps : 0;
      const capacity = perf ? perf.capacity : event.totalCapacity;
      const checkedIn = perf ? perf.checkedIn : 0;

      const ccFeeCents = ordersCount > 0 ? Math.round(grossSaleCents * 0.029 + ordersCount * 30) : 0;

      const developerFeeCents = ordersCount > 0 ? Math.round(grossSaleCents * 0.05 + ordersCount * 99) : 0;

      const tenantPaidCents = Math.max(0, grossSaleCents - ccFeeCents - developerFeeCents);

      return {
        grossSaleCents,
        ordersCount,
        ticketsSold,
        ccFeeCents,
        developerFeeCents,
        tenantPaidCents,
        refundedCents,
        attendanceRateBps,
        capacity,
        checkedIn,
      };
    },
    [perfMap]
  );

  const tabAggregates = useMemo(() => {
    let totalGross = 0;
    let totalTenantPaid = 0;
    let totalCCFees = 0;
    let totalDeveloperFees = 0;
    let totalTickets = 0;

    filteredEvents.forEach((ev) => {
      const fin = getFinancials(ev);
      totalGross += fin.grossSaleCents;
      totalTenantPaid += fin.tenantPaidCents;
      totalCCFees += fin.ccFeeCents;
      totalDeveloperFees += fin.developerFeeCents;
      totalTickets += fin.ticketsSold;
    });

    return { totalGross, totalTenantPaid, totalCCFees, totalDeveloperFees, totalTickets };
  }, [filteredEvents, getFinancials]);

  return (
    <div className="space-y-6 pb-8">
      {}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Developer Events Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage tenant events, inspect active &amp; previous shows, and review real-time financial fee breakdowns.
          </p>
        </div>

        {}
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <Select
            value={effectiveTenantId}
            onChange={(e) => handleSelectTenant(e.target.value)}
            className="w-64 border-amber-500/40 bg-background font-medium shadow-sm"
            aria-label="Select tenant"
          >
            <option value="" disabled>
              Select a tenant…
            </option>
            {tenants.map((tenant) => (
              <option key={tenant.tenantsId} value={tenant.tenantsId}>
                {tenant.name} ({tenant.slug})
              </option>
            ))}
          </Select>
          {effectiveTenantId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const t = tenants.find((item) => item.tenantsId === effectiveTenantId);
                if (t) setActingTenant(t.tenantsId, t.name);
                navigate('/events/new');
              }}
            >
              + Create Event
            </Button>
          ) : null}
        </div>
      </section>

      {}
      {selectedTenant ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-foreground">
                Showing events for <strong>{selectedTenant.name}</strong> ({selectedTenant.slug})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tenant ID: {selectedTenant.tenantsId}</span>
              {activeTenantsId !== selectedTenant.tenantsId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActingTenant(selectedTenant.tenantsId, selectedTenant.name)}
                >
                  Set as Active Tenant
                </Button>
              ) : (
                <Badge variant="voltage" className="border-amber-500 text-amber-600">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Total Sales (Gross)</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{centsToUSD(tabAggregates.totalGross)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {filteredEvents.length} events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Paid to Tenant</span>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{centsToUSD(tabAggregates.totalTenantPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Net earnings to tenant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Paid to CC Fees</span>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{centsToUSD(tabAggregates.totalCCFees)}</div>
            <p className="text-xs text-muted-foreground mt-1">Stripe processing charges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>To Developer (Platform)</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{centsToUSD(tabAggregates.totalDeveloperFees)}</div>
            <p className="text-xs text-muted-foreground mt-1">Platform service fee revenue</p>
          </CardContent>
        </Card>
      </section>

      {}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
          <button
            onClick={() => setTab('active_future')}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'active_future'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            Active &amp; Future Events
          </button>
          <button
            onClick={() => setTab('past')}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'past'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            Previous (Past) Events
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'drafts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setTab('all')}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted-foreground/10'
            }`}
          >
            All Events
          </button>
        </div>

        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title or category…"
            className="pl-9"
          />
        </div>
      </section>

      {}
      {loadingEvents ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : eventsError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load events: {eventsError}
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Ticket className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <h3 className="text-base font-semibold text-foreground">No events found</h3>
              <p className="text-sm text-muted-foreground">
                {search ? 'Try adjusting your search terms.' : 'No events in this status tab for the selected tenant.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((ev) => {
            const fin = getFinancials(ev);
            const isExpanded = expandedEventId === ev.eventsId;
            const startDateStr = ev.startDate ? formatEpoch(Number(ev.startDate)) : 'Unscheduled';
            const endDateStr = ev.endDate ? formatEpoch(Number(ev.endDate)) : 'Unscheduled';

            const badgeVariant =
              ev.status === 'Published'
                ? 'success'
                : ev.status === 'Completed'
                ? 'neutral'
                : 'default';

            return (
              <Card key={ev.eventsId} className="transition-all hover:border-border/80">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{ev.title}</h3>
                        <Badge variant={badgeVariant}>
                          {ev.status}
                        </Badge>
                        {ev.category ? <Badge variant="neutral">{ev.category}</Badge> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {startDateStr} — {endDateStr}
                        </span>
                        <span>Slug: {ev.slug}</span>
                        {ev.layoutMode ? <span>Layout: {ev.layoutMode}</span> : null}
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-600">
                          {centsToUSD(fin.grossSaleCents)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fin.ticketsSold} tickets sold ({fin.ordersCount} orders)
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedEventId(isExpanded ? null : ev.eventsId)}
                        className="gap-1 text-xs"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Fee Details <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-4">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Total Sale (Gross)
                      </span>
                      <p className="text-base font-semibold text-foreground">{centsToUSD(fin.grossSaleCents)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Paid to Tenant
                      </span>
                      <p className="text-base font-semibold text-blue-600">{centsToUSD(fin.tenantPaidCents)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Paid to CC Fees
                      </span>
                      <p className="text-base font-semibold text-amber-600">{centsToUSD(fin.ccFeeCents)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        To Developer
                      </span>
                      <p className="text-base font-semibold text-purple-600">{centsToUSD(fin.developerFeeCents)}</p>
                    </div>
                  </div>

                  {}
                  {isExpanded ? (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Complete Event Details &amp; Financial Breakdown
                      </h4>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-md border p-3 text-xs space-y-1">
                          <span className="font-semibold text-foreground">Sales &amp; Attendance</span>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Orders:</span>
                            <span>{fin.ordersCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tickets Sold:</span>
                            <span>{fin.ticketsSold}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span>{fin.capacity || 'Unlimited'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Checked In:</span>
                            <span>{fin.checkedIn}</span>
                          </div>
                        </div>

                        <div className="rounded-md border p-3 text-xs space-y-1">
                          <span className="font-semibold text-foreground">Fee Computations</span>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gross Sales:</span>
                            <span>{centsToUSD(fin.grossSaleCents)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>- Stripe / CC Fee (~2.9% + 30¢):</span>
                            <span>-{centsToUSD(fin.ccFeeCents)}</span>
                          </div>
                          <div className="flex justify-between text-purple-600">
                            <span>- Developer Fee (~5% + 99¢):</span>
                            <span>-{centsToUSD(fin.developerFeeCents)}</span>
                          </div>
                          <div className="border-t pt-1 flex justify-between font-semibold text-blue-600">
                            <span>= Net Tenant Payout:</span>
                            <span>{centsToUSD(fin.tenantPaidCents)}</span>
                          </div>
                        </div>

                        <div className="rounded-md border p-3 text-xs space-y-1">
                          <span className="font-semibold text-foreground">Refunds &amp; Actions</span>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Refunded Cents:</span>
                            <span>{centsToUSD(fin.refundedCents)}</span>
                          </div>
                          <div className="pt-2 flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (selectedTenant) {
                                  setActingTenant(selectedTenant.tenantsId, selectedTenant.name);
                                }
                                navigate(`/events/${ev.eventsId}`);
                              }}
                            >
                              Manage Event Admin <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <EventReminderControl eventsId={ev.eventsId} eventTitle={ev.title} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
