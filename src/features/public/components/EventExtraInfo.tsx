import { useMemo } from 'react';
import { Sparkles, HelpCircle, Lock, Calendar, Star, Compass, ShieldCheck } from 'lucide-react';
import { parseMeta, publicMeta } from './catalogJson';

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMetaIcon(key: string) {
  const k = key.toLowerCase();
  if (k.includes('age') || k.includes('restriction')) return Lock;
  if (k.includes('dress') || k.includes('attire')) return Sparkles;
  if (k.includes('parking') || k.includes('transport')) return Compass;
  if (k.includes('refund') || k.includes('cancel')) return Star;
  if (k.includes('date') || k.includes('time')) return Calendar;
  return HelpCircle;
}

export function EventExtraInfo({ extraInfoJson }: { extraInfoJson: string }) {
  const items = useMemo(() => publicMeta(parseMeta(extraInfoJson)), [extraInfoJson]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-base font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand" /> Guidelines & Policy Vault
        </h4>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {items.length} Rules Defined
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const MetaIcon = getMetaIcon(item.key);
          return (
            <div
              key={item.key}
              className="group flex items-start gap-3.5 p-4 rounded-2xl border border-border-strong bg-surface-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand border border-brand/20 transition-transform duration-200 group-hover:scale-110">
                <MetaIcon className="size-4.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h5 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  {humanize(item.key)}
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
