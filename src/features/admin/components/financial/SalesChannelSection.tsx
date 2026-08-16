import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { CreditCard, Wallet, Landmark, Banknote } from 'lucide-react';
import { centsToUSD } from '@/shared/lib/format';
import type { SalesByChannelList } from '@/shared/proto/reporting';

interface SalesChannelSectionProps {
  salesByChannel: SalesByChannelList | null;
  isAdvanced: boolean;
}

export function SalesChannelSection({ salesByChannel, isAdvanced }: SalesChannelSectionProps) {
  if (!isAdvanced || !salesByChannel || salesByChannel.rows.length === 0) {
    return null;
  }

  const rows = salesByChannel.rows;
  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenueCents), 0);

  const getChannelIcon = (channel: string) => {
    const lower = channel.toLowerCase();
    if (lower.includes('ach') || lower.includes('bank')) {
      return <Landmark className="h-4 w-4 text-primary" />;
    }
    if (lower.includes('wallet') || lower.includes('apple') || lower.includes('google')) {
      return <Wallet className="h-4 w-4 text-primary" />;
    }
    if (lower.includes('cash') || lower.includes('direct')) {
      return <Banknote className="h-4 w-4 text-primary" />;
    }
    return <CreditCard className="h-4 w-4 text-primary" />;
  };

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold font-display text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Channels & Methods
            </CardTitle>
            <Badge variant="voltage">Pro</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Distribution of processed transactions across card networks, digital wallets, and bank rails.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {rows.map((row) => {
            const sharePct =
              totalRevenue > 0
                ? Math.round((Number(row.revenueCents) / totalRevenue) * 100)
                : 0;

            return (
              <div
                key={row.channel}
                className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getChannelIcon(row.channel)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">
                        {row.channel}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.orders} orders · {row.ticketsSold} tickets
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="font-mono text-xs">
                    {sharePct}%
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Processed Volume</span>
                    <span className="font-bold text-foreground font-mono">
                      {centsToUSD(row.revenueCents)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.max(sharePct, 3)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
