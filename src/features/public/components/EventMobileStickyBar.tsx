import { Ticket, ShoppingBag } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { PriceBadge } from './PriceBadge';
import { centsToUSD } from '@/shared/lib/format';

interface EventMobileStickyBarProps {
  minPriceCents?: number;
  cartCount: number;
  totalCents: number;
  busy: boolean;
  onGetTickets: () => void;
  onCheckout: () => void;
}

export function EventMobileStickyBar({
  minPriceCents,
  cartCount,
  totalCents,
  busy,
  onGetTickets,
  onCheckout,
}: EventMobileStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-strong bg-surface-canvas/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          {cartCount > 0 ? (
            <>
              <span className="text-[10px] uppercase tracking-wider text-ink-soft">
                {cartCount} {cartCount === 1 ? 'ticket' : 'tickets'} selected
              </span>
              <span className="font-mono text-base font-bold text-foreground">{centsToUSD(totalCents)}</span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-ink-soft">Starting from</span>
              {minPriceCents !== undefined ? (
                <PriceBadge priceCents={minPriceCents} className="font-mono text-base font-bold text-foreground" />
              ) : (
                <span className="text-xs font-semibold text-ink-soft">Check pricing</span>
              )}
            </>
          )}
        </div>

        {cartCount > 0 ? (
          <Button
            onClick={onCheckout}
            disabled={busy}
            size="lg"
            className="flex-1 max-w-[200px] gap-2 rounded-xl bg-brand text-brand-ink font-bold shadow-md hover:bg-brand-hover active:scale-98"
          >
            <ShoppingBag className="size-4" />
            {busy ? 'Reserving…' : 'Checkout'}
          </Button>
        ) : (
          <Button
            onClick={onGetTickets}
            size="lg"
            className="flex-1 max-w-[200px] gap-2 rounded-xl bg-foreground text-background font-bold shadow-md hover:bg-foreground/90 active:scale-98"
          >
            <Ticket className="size-4 text-brand" />
            Get Tickets
          </Button>
        )}
      </div>
    </div>
  );
}
