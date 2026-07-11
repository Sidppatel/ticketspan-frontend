import { cn } from '@/shared/lib/cn';

function QrGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className={cn('block', className)}>
      <rect x="2" y="2" width="12" height="12" fill="currentColor" />
      <rect x="5" y="5" width="6" height="6" fill="var(--surface)" />
      <rect x="30" y="2" width="12" height="12" fill="currentColor" />
      <rect x="33" y="5" width="6" height="6" fill="var(--surface)" />
      <rect x="2" y="30" width="12" height="12" fill="currentColor" />
      <rect x="5" y="33" width="6" height="6" fill="var(--surface)" />
      <rect x="18" y="4" width="4" height="4" fill="currentColor" />
      <rect x="24" y="8" width="4" height="4" fill="currentColor" />
      <rect x="18" y="14" width="4" height="4" fill="currentColor" />
      <rect x="30" y="18" width="4" height="4" fill="currentColor" />
      <rect x="38" y="20" width="4" height="4" fill="currentColor" />
      <rect x="18" y="22" width="4" height="4" fill="currentColor" />
      <rect x="24" y="18" width="4" height="4" fill="currentColor" />
      <rect x="22" y="28" width="4" height="4" fill="currentColor" />
      <rect x="28" y="32" width="4" height="4" fill="currentColor" />
      <rect x="18" y="36" width="4" height="4" fill="currentColor" />
      <rect x="34" y="38" width="4" height="4" fill="currentColor" />
      <rect x="38" y="30" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

export function HeroTicket() {
  return (
    <div className="w-full max-w-sm rotate-2 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-e2)] transition-transform duration-[280ms] ease-[var(--ease-out)] hover:rotate-0 motion-reduce:rotate-0 motion-reduce:transition-none">
      <div className="space-y-4 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Admit six</p>
          <p className="font-mono text-[11px] text-ink-faint">FRI · AUG 21 · 10 PM</p>
        </div>
        <h3 className="font-display text-3xl text-ink">Solstice Rooftop</h3>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-ink-soft">VIP Table T-4 · 6 seats</p>
            <p className="text-xs text-ink-soft">Skyline Terrace, 44th Fl</p>
          </div>
          <p className="font-display text-2xl text-voltage-ink">
            <span className="rounded bg-voltage/20 px-1.5 py-0.5 font-mono text-lg">$600.00</span>
          </p>
        </div>
      </div>
      <div className="svyne-ticket-edge" style={{ ['--svyne-notch' as string]: 'var(--stage)' }} />
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Booking</p>
          <p className="font-mono text-sm text-ink">SVY-8F2K-T4</p>
        </div>
        <QrGlyph className="h-11 w-11 text-ink" />
      </div>
    </div>
  );
}

const floorTables = [
  { label: 'T-1', shape: 'round', col: 'col-start-1', row: 'row-start-1', state: 'open' },
  { label: 'T-2', shape: 'round', col: 'col-start-3', row: 'row-start-1', state: 'sold' },
  { label: 'T-3', shape: 'square', col: 'col-start-5', row: 'row-start-1', state: 'open' },
  { label: 'T-4', shape: 'round', col: 'col-start-2', row: 'row-start-2', state: 'held' },
  { label: 'T-5', shape: 'square', col: 'col-start-4', row: 'row-start-2', state: 'open' },
  { label: 'T-6', shape: 'round', col: 'col-start-1', row: 'row-start-3', state: 'sold' },
  { label: 'T-7', shape: 'round', col: 'col-start-3', row: 'row-start-3', state: 'open' },
  { label: 'T-8', shape: 'square', col: 'col-start-5', row: 'row-start-3', state: 'open' },
] as const;

export function FloorPlanMock() {
  return (
    <div className="rounded-xl bg-stage-elevated p-5 shadow-[var(--shadow-e2)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-stage-soft">Skyline Terrace · floor plan</p>
        <span className="rounded-full bg-voltage/20 px-2.5 py-1 font-mono text-[11px] text-voltage">
          T-4 held · 9:42 left
        </span>
      </div>
      <div className="mb-3 rounded-md border border-on-stage-soft/30 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-on-stage-soft">
        Stage
      </div>
      <div className="grid grid-cols-5 grid-rows-3 gap-3">
        {floorTables.map((table) => (
          <div
            key={table.label}
            className={cn(
              'flex aspect-square items-center justify-center font-mono text-[11px]',
              table.col,
              table.row,
              table.shape === 'round' ? 'rounded-full' : 'rounded-md',
              table.state === 'open' && 'border border-on-stage-soft/40 text-on-stage',
              table.state === 'sold' && 'bg-on-stage-soft/15 text-on-stage-soft/50 line-through',
              table.state === 'held' && 'bg-voltage text-voltage-ink shadow-[var(--shadow-e1)]',
            )}
          >
            {table.label}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-5 font-mono text-[10px] uppercase tracking-widest text-on-stage-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-on-stage-soft/60" /> Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-voltage" /> Yours for 10 min
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-on-stage-soft/30" /> Sold
        </span>
      </div>
    </div>
  );
}

const revenueBars = ['h-7', 'h-10', 'h-8', 'h-14', 'h-12', 'h-20', 'h-24'];

export function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[var(--shadow-e2)]">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Solstice Rooftop · live</p>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-success">
          <span className="svyne-urgent h-1.5 w-1.5 rounded-full bg-success" /> On sale
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-hairline border-b border-hairline">
        <div className="px-5 py-4">
          <p className="text-[11px] text-ink-faint">Tickets sold</p>
          <p className="font-mono text-xl text-ink">184<span className="text-ink-faint">/220</span></p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] text-ink-faint">Your revenue</p>
          <p className="font-mono text-xl text-voltage-ink">$11,040</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11px] text-ink-faint">At the door</p>
          <p className="font-mono text-xl text-ink">96<span className="text-ink-faint"> in</span></p>
        </div>
      </div>
      <div className="flex items-end gap-2 px-5 pb-4 pt-5">
        {revenueBars.map((height, i) => (
          <div key={i} className={cn('flex-1 rounded-sm', height, i === revenueBars.length - 1 ? 'bg-brand' : 'bg-brand/25')} />
        ))}
      </div>
      <div className="flex justify-between px-5 pb-4 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <span>Mon</span>
        <span>Sales this week</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

export function ScannerMock() {
  return (
    <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[24px] border-4 border-stage-elevated bg-stage shadow-[var(--shadow-e2)]">
      <div className="px-4 pb-3 pt-4">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-on-stage-soft">Door scan</p>
      </div>
      <div className="mx-4 rounded-lg bg-success px-4 py-6 text-center text-[var(--color-sand-100)]">
        <p className="font-display text-4xl">VIP-3</p>
        <p className="mt-1 text-sm">Amara O. · party of 6</p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-widest opacity-80">Checked in</p>
      </div>
      <div className="flex items-center justify-between px-5 py-4 font-mono text-[11px] text-on-stage-soft">
        <span>96 / 220 in</span>
        <span className="text-on-stage">Next scan</span>
      </div>
    </div>
  );
}
