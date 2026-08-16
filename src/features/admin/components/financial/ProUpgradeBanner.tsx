import { Sparkles, ShieldCheck, FileSpreadsheet, Layers, Filter } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';

export function ProUpgradeBanner() {
  return (
    <div className="relative rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 via-card to-background p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="voltage">Pro Analytics</Badge>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Unlock Advanced Financial Control
            </span>
          </div>
          <h3 className="text-lg font-bold font-display text-foreground">
            Custom Timeframes, Multi-Tier Breakdowns & Event Ledgers
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Upgrade your subscription or contact your organization administrator to unlock granular custom date ranges,
            ticket vs. table revenue separation, sales tax and platform fee analytics, and instant one-click CSV ledger exports for individual events.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <Filter className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">Custom Date Range</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">Tables vs Tickets</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">Event Transaction CSV</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">Tax & Fee Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}
