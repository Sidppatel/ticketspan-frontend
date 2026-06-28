import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { zonedInputToEpoch, zoneAbbrev } from '@/shared/lib/timezone';

export interface RuleDraft {
  name: string;
  ruleType: string;
  percent: number;
  capacity: number;
  activeFrom: string;
  activeUntil: string;
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function RuleDialog({
  timeZone,
  onClose,
  onSubmit,
}: {
  timeZone: string;
  onClose: () => void;
  onSubmit: (draft: RuleDraft) => Promise<void>;
}) {
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState('Presale');
  const [percent, setPercent] = useState(10);
  const [capacity, setCapacity] = useState(0);
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);

  useGSAP(
    () => {
      if (reduced()) {
        firstField.current?.focus();
        return;
      }
      gsap.from(overlay.current, { autoAlpha: 0, duration: 0.2, ease: 'power1.out' });
      gsap.from(panel.current, {
        autoAlpha: 0,
        y: 24,
        scale: 0.96,
        duration: 0.32,
        ease: 'power3.out',
        onComplete: () => firstField.current?.focus(),
      });
    },
    { scope: overlay },
  );

  function animateOut(done: () => void) {
    if (reduced()) {
      done();
      return;
    }
    gsap
      .timeline({ onComplete: done })
      .to(panel.current, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.2, ease: 'power2.in' }, 0)
      .to(overlay.current, { autoAlpha: 0, duration: 0.2, ease: 'power1.in' }, 0.04);
  }

  const requestClose = () => animateOut(onClose);

  async function submit() {
    if (!name.trim()) {
      firstField.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        ruleType: ruleType.trim() || 'Custom',
        percent,
        capacity,
        activeFrom: zonedInputToEpoch(from, timeZone),
        activeUntil: zonedInputToEpoch(until, timeZone),
      });
      animateOut(onClose);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Create pricing rule"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          requestClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={panel}
        className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-foreground">
            Time-bound rule
          </p>
          <h3 className="font-display text-xl tracking-tight">Create a discount</h3>
          <p className="text-sm text-muted-foreground">
            Applies to every ticket and table type for the window you set. Add-ons stay at list price.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rule-name">Name</Label>
            <Input
              id="rule-name"
              ref={firstField}
              value={name}
              placeholder="Pre-sale"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rule-type">Type</Label>
              <Input
                id="rule-type"
                value={ruleType}
                placeholder="Pre-sale"
                list="rule-type-suggestions"
                onChange={(e) => setRuleType(e.target.value)}
              />
              <datalist id="rule-type-suggestions">
                <option value="Presale" />
                <option value="LastMinute" />
                <option value="TimeWindow" />
                <option value="Dynamic" />
              </datalist>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rule-pct">Discount %</Label>
              <Input
                id="rule-pct"
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rule-capacity">Capacity (people/seats, 0 = no cap)</Label>
            <Input
              id="rule-capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <Label>Starts</Label>
              <span className="text-xs text-muted-foreground">Times in {zoneAbbrev(timeZone)}</span>
            </div>
            <DateTimePicker value={from} onChange={setFrom} timeZone={timeZone} />
          </div>
          <div className="space-y-1">
            <Label>Ends</Label>
            <DateTimePicker value={until} onChange={setUntil} timeZone={timeZone} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={requestClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Create rule'}
          </Button>
        </div>
      </div>
    </div>
  );
}
