import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { Ticket, Table2, Layers, Download, Search } from 'lucide-react';
import { centsToUSD } from '@/shared/lib/format';
import { downloadCsv } from '@/features/admin/services/reportingService';
import type { TicketTypeBreakdownRow } from '@/shared/proto/reporting';

interface ItemBreakdownSectionProps {
  ticketTypes: TicketTypeBreakdownRow[];
  events: { eventsId: string; eventTitle: string }[];
  isAdvanced: boolean;
}

type ItemFilterType = 'all' | 'ticket' | 'table';

export function ItemBreakdownSection({
  ticketTypes,
  events,
  isAdvanced,
}: ItemBreakdownSectionProps) {
  const [filterType, setFilterType] = useState<ItemFilterType>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredItems = ticketTypes.filter((item) => {
    if (filterType !== 'all' && (item.itemKind || 'ticket') !== filterType) {
      return false;
    }
    if (selectedEventId !== 'all' && item.eventsId !== selectedEventId) {
      return false;
    }
    if (
      search &&
      !item.label.toLowerCase().includes(search.toLowerCase()) &&
      !item.eventTitle.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalRevenue = ticketTypes.reduce(
    (sum, item) => sum + Number(item.revenueCents),
    0,
  );

  function exportItemsCsv() {
    downloadCsv(
      'ticket-and-table-breakdown.csv',
      [
        'Item Name',
        'Kind',
        'Event Title',
        'Unit Price',
        'Quantity Sold',
        'Gross Revenue',
        'Refunded Quantity',
        'Refunded Amount',
      ],
      filteredItems.map((item) => [
        item.label,
        item.itemKind === 'table' ? 'Table' : 'Ticket',
        item.eventTitle,
        centsToUSD(item.priceCents),
        item.quantitySold,
        centsToUSD(item.revenueCents),
        item.refundedQuantity,
        centsToUSD(item.refundedCents),
      ]),
    );
  }

  if (!isAdvanced) {
    return (
      <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold font-display text-foreground flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Ticket & Table Breakdown
              </CardTitle>
              <Badge variant="voltage">Pro</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Deep revenue breakdown across ticket tiers and table seating packages.
            </p>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center space-y-3">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold font-display">Unlock Multi-Type Financial Drilldowns</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Advanced Reporting separates general admission tiers, VIP tickets, and table package revenue with unit velocity analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold font-display text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Item & Inventory Breakdown
            </CardTitle>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Revenue and quantity sold segmented by ticket tiers and table types.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterType === 'all'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilterType('all')}
            >
              Both
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterType === 'ticket'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilterType('ticket')}
            >
              <Ticket className="h-3 w-3" />
              Tickets
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                filterType === 'table'
                  ? 'bg-background shadow-xs text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilterType('table')}
            >
              <Table2 className="h-3 w-3" />
              Tables
            </button>
          </div>

          <Select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-8 text-xs w-36 bg-background border-border/70"
          >
            <option value="all">All Events</option>
            {events.map((e) => (
              <option key={e.eventsId} value={e.eventsId}>
                {e.eventTitle}
              </option>
            ))}
          </Select>

          <div className="relative w-36 sm:w-44">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-background border-border/70"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 shrink-0"
            disabled={filteredItems.length === 0}
            onClick={exportItemsCsv}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredItems.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No ticket or table records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-left uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Item & Package</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Sold Qty</th>
                  <th className="py-3 px-4 text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Refunded</th>
                  <th className="py-3 px-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredItems.map((item) => {
                  const sharePct =
                    totalRevenue > 0
                      ? Math.round((Number(item.revenueCents) / totalRevenue) * 100)
                      : 0;

                  return (
                    <tr
                      key={`${item.eventTicketTypesId}-${item.label}-${item.eventsId}`}
                      className="hover:bg-muted/15 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {item.label}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={item.itemKind === 'table' ? 'voltage' : 'neutral'}
                          className="text-[10px] font-medium"
                        >
                          {item.itemKind === 'table' ? 'Table' : 'Ticket'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-xs">
                        {item.eventTitle}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {centsToUSD(item.priceCents)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {item.quantitySold}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-foreground">
                        {centsToUSD(item.revenueCents)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                        {Number(item.refundedCents) > 0 ? (
                          <span className="text-destructive">
                            {centsToUSD(item.refundedCents)} ({item.refundedQuantity})
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.max(sharePct, 2)}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-8 font-mono text-[11px]">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
