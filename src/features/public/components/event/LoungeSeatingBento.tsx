import { useState, useEffect } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { EventSeatingMap } from '../EventSeatingMap';
import { DeferUntilVisible } from '@/shared/components/DeferUntilVisible';
import type { CartItem } from '@/features/public/services/pendingCart';

interface LoungeSeatingBentoProps {
  eventsId: string;
  feesIncluded: boolean;
  cart: CartItem[];
  upsert: (item: CartItem) => void;
  removeKey: (key: string) => void;
}

export function LoungeSeatingBento({
  eventsId,
  feesIncluded,
  cart,
  upsert,
  removeKey,
}: LoungeSeatingBentoProps) {
  const [minHeight, setMinHeight] = useState(590);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setMinHeight(320);
      } else {
        setMinHeight(590);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border-soft pb-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-brand">
            <Sparkles className="size-3" /> VIP Lounge Experience
          </span>
          <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-brand" /> Lounge & Seating Reservations
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-2 border border-border-soft text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-400 shadow-sm" />
            <span className="text-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-400/50 shadow-sm" />
            <span className="text-muted-foreground">Reserved</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-border-strong bg-surface-card p-4 sm:p-6 md:p-8 shadow-lg">
        <DeferUntilVisible minHeight={minHeight}>
          <EventSeatingMap
            eventsId={eventsId}
            feesIncluded={feesIncluded}
            cart={cart}
            upsert={upsert}
            removeKey={removeKey}
          />
        </DeferUntilVisible>
      </div>
    </div>
  );
}
