import { useState } from 'react';
import { Sparkle, X } from 'lucide-react';
import { deltaMessages, type EventDelta } from '@/features/public/lib/eventMemory';

export function DeltaStrip({ delta }: { delta: EventDelta }) {
  const [dismissed, setDismissed] = useState(false);
  const messages = deltaMessages(delta);
  if (dismissed || messages.length === 0) return null;

  return (
    <div className="entryvine-page mx-auto max-w-7xl px-4 md:px-8">
      <div className="mt-6 flex items-start justify-between gap-3 rounded-lg border border-voltage/30 bg-voltage/10 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Sparkle className="mt-0.5 size-4 shrink-0 text-voltage-ink" />
          <div className="space-y-0.5 text-sm text-voltage-ink">
            <p className="font-semibold">Since your last visit</p>
            <ul className="text-xs leading-relaxed">
              {messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss updates"
          onClick={() => setDismissed(true)}
          className="cursor-pointer rounded p-1 text-voltage-ink/60 transition-colors hover:text-voltage-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
