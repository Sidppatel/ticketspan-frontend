import { useEffect, useState } from 'react';
import { countdownParts, type CountdownParts } from '@/features/public/lib/discover';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span key={value} className="entryvine-page font-mono text-2xl font-medium tabular-nums text-on-stage md:text-3xl">
        {value}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-on-stage-soft">{label}</span>
    </div>
  );
}

export function Countdown({ startEpoch, endEpoch }: { startEpoch: string; endEpoch: string }) {
  const [parts, setParts] = useState<CountdownParts>(() => countdownParts(startEpoch, endEpoch));

  useEffect(() => {
    const id = setInterval(() => setParts(countdownParts(startEpoch, endEpoch)), 1000);
    return () => clearInterval(id);
  }, [startEpoch, endEpoch]);

  if (parts.past) return null;

  if (parts.live) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-voltage/20 px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest text-on-stage">
        <span className="size-2 rounded-full bg-voltage entryvine-urgent" />
        Happening now
      </span>
    );
  }

  return (
    <div className="flex items-center gap-4" role="timer" aria-label="Time until event starts">
      <Unit value={String(parts.days)} label="days" />
      <span className="font-mono text-xl text-on-stage-soft">:</span>
      <Unit value={pad(parts.hours)} label="hrs" />
      <span className="font-mono text-xl text-on-stage-soft">:</span>
      <Unit value={pad(parts.minutes)} label="min" />
      <span className="font-mono text-xl text-on-stage-soft">:</span>
      <Unit value={pad(parts.seconds)} label="sec" />
    </div>
  );
}
