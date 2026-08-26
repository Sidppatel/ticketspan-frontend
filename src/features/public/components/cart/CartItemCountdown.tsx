import { useState, useEffect } from 'react';
import { Clock, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { UniversalCartItem } from '@/shared/lib/cartStore';

interface CartItemCountdownProps {
  item: UniversalCartItem;
  onReclaim?: (item: UniversalCartItem) => Promise<void> | void;
  className?: string;
  size?: 'sm' | 'md';
}

export function CartItemCountdown({
  item,
  onReclaim,
  className,
  size: _size = 'sm',
}: CartItemCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const [reclaiming, setReclaiming] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const expiresAt = item.expiresAt || 0;
  const remainingMs = Math.max(0, expiresAt - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpired = totalSeconds <= 0;
  const isUrgent = totalSeconds > 0 && totalSeconds <= 120; // under 2 minutes

  const handleReclaimClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onReclaim || reclaiming) return;
    setReclaiming(true);
    try {
      await onReclaim(item);
    } finally {
      setReclaiming(false);
    }
  };

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (isExpired) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-400">
          <AlertTriangle className="size-3 text-rose-400 shrink-0" />
          <span>Expired</span>
        </span>

        {onReclaim && (
          <button
            type="button"
            onClick={handleReclaimClick}
            disabled={reclaiming}
            className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            title={item.holdSeconds ? `Re-claim ticket with a new ${Math.round(item.holdSeconds / 60)}-minute hold window` : 'Re-claim ticket with a new hold window'}
          >
            {reclaiming ? (
              <Loader2 className="size-3 animate-spin text-amber-300" />
            ) : (
              <RotateCcw className="size-3" />
            )}
            <span>{reclaiming ? 'Checking…' : 'Re-claim'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md font-mono text-[10px] font-semibold px-1.5 py-0.5 border transition-colors',
          isUrgent
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        )}
      >
        <Clock className={cn('size-3 shrink-0', isUrgent ? 'text-amber-400' : 'text-emerald-400')} />
        <span className="tabular-nums">{formattedTime} hold</span>
      </span>
    </div>
  );
}
