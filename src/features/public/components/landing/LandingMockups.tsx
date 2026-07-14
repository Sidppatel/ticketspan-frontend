import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { gsap as GsapCore } from 'gsap';
import type { Draggable as DraggableType } from 'gsap/Draggable';
import { cn } from '@/shared/lib/cn';
import { Check } from 'lucide-react';

interface MockGsapBundle {
  gsap: typeof GsapCore;
  Draggable: typeof DraggableType;
}

let mockGsapLoaded: Promise<MockGsapBundle> | null = null;

function loadMockGsap(): Promise<MockGsapBundle> {
  if (!mockGsapLoaded) {
    mockGsapLoaded = Promise.all([import('gsap'), import('gsap/Draggable')]).then(
      ([core, drag]) => {
        core.gsap.registerPlugin(drag.Draggable);
        return { gsap: core.gsap, Draggable: drag.Draggable };
      },
    );
  }
  return mockGsapLoaded;
}

function useMockGsap(
  setup: (bundle: MockGsapBundle) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    let disposed = false;
    let ctx: { revert(): void } | undefined;
    let cleanup: (() => void) | void;
    void loadMockGsap().then((bundle) => {
      if (disposed || !scope.current) return;
      ctx = bundle.gsap.context(() => {
        cleanup = setup(bundle);
      }, scope);
    });
    return () => {
      disposed = true;
      cleanup?.();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function LiveNumber({
  initial,
  min,
  max,
  step,
  prefix = '',
}: {
  initial: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useMockGsap(
    ({ gsap }) => {
      const el = ref.current;
      if (!el) {
        return;
      }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      let current = initial;
      let timer = 0;
      let tween: gsap.core.Tween | undefined;
      const tick = () => {
        const next = gsap.utils.clamp(min, max, current + gsap.utils.random(-step, step, 1));
        const obj = { n: current };
        tween = gsap.to(obj, {
          n: next,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = prefix + Math.round(obj.n).toLocaleString();
          },
        });
        current = next;
        timer = window.setTimeout(tick, gsap.utils.random(2000, 3000));
      };
      timer = window.setTimeout(tick, gsap.utils.random(2000, 3000));
      return () => {
        window.clearTimeout(timer);
        tween?.kill();
      };
    },
    ref,
    [],
  );
  return <span ref={ref}>{prefix + initial.toLocaleString()}</span>;
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useMockGsap(
    ({ gsap }) => {
      const wrap = wrapRef.current;
      const card = cardRef.current;
      if (!wrap || !card) {
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
        const rxTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const ryTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => {
          const rect = wrap.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          rxTo(py * -10);
          ryTo(px * 12);
        };
        const onLeave = () => {
          rxTo(0);
          ryTo(0);
        };
        wrap.addEventListener('mousemove', onMove);
        wrap.addEventListener('mouseleave', onLeave);
        return () => {
          wrap.removeEventListener('mousemove', onMove);
          wrap.removeEventListener('mouseleave', onLeave);
        };
      });
      return () => mm.revert();
    },
    wrapRef,
  );

  return (
    <div ref={wrapRef} className="w-full max-w-sm [perspective:900px]">
      <TicketCard cardRef={cardRef} />
    </div>
  );
}

function TicketCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      className="entryvine-tilt w-full rotate-2 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-e2)] motion-reduce:rotate-0"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Admit six</p>
          <p className="font-mono text-[11px] text-ink-faint">FRI · AUG 21 · 10 PM</p>
        </div>
        <p className="font-display text-3xl text-ink">Solstice Rooftop</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-ink-soft">Table T-4 · 6 seats</p>
            <p className="text-xs text-ink-soft">Skyline Terrace, 44th Fl</p>
          </div>
          <p className="font-display text-2xl text-voltage-ink">
            <span className="rounded bg-voltage/20 px-1.5 py-0.5 font-mono text-lg">$600.00</span>
          </p>
        </div>
      </div>
      <div className="entryvine-ticket-edge" style={{ ['--entryvine-notch' as string]: 'var(--stage)' }} />
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

const TABLE_LAYOUT = [
  { label: 'T-1', shape: 'round', x: 12, y: 14 },
  { label: 'T-2', shape: 'round', x: 210, y: 14 },
  { label: 'T-3', shape: 'square', x: 372, y: 14 },
  { label: 'T-4', shape: 'round', x: 116, y: 98 },
  { label: 'T-5', shape: 'square', x: 288, y: 98 },
  { label: 'T-6', shape: 'round', x: 12, y: 182 },
  { label: 'T-7', shape: 'round', x: 210, y: 182 },
  { label: 'T-8', shape: 'square', x: 372, y: 182 },
] as const;

const HELD_INDEX = 3;

function pickSoldIndices(): Set<number> {
  const pool = TABLE_LAYOUT.map((_, i) => i).filter((i) => i !== HELD_INDEX);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return new Set(pool.slice(0, 2));
}

export function FloorPlanMock() {
  const boardRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sold = useMemo(() => pickSoldIndices(), []);

  useMockGsap(
    ({ gsap, Draggable }) => {
      const board = boardRef.current;
      if (!board) {
        return;
      }
      const tiles = tileRefs.current.filter((t): t is HTMLDivElement => t !== null);
      const draggers = TABLE_LAYOUT.map((_, i) => {
        if (i === HELD_INDEX || sold.has(i)) {
          return null;
        }
        const el = tileRefs.current[i];
        if (!el) {
          return null;
        }
        const good = { x: 0, y: 0 };
        return Draggable.create(el, {
          type: 'x,y',
          bounds: board,
          onPress() {
            good.x = this.x;
            good.y = this.y;
          },
          onDrag() {
            const hit = tiles.some((other) => other !== el && this.hitTest(other, 0));
            if (hit) {
              gsap.set(el, { x: good.x, y: good.y });
              this.x = good.x;
              this.y = good.y;
            } else {
              good.x = this.x;
              good.y = this.y;
            }
          },
        })[0];
      });
      return () => draggers.forEach((d) => d?.kill());
    },
    boardRef,
    [sold],
  );

  return (
    <div className="rounded-xl bg-stage-elevated p-5 shadow-[var(--shadow-e1)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-on-stage-soft">Skyline Terrace · floor plan</p>
        <span className="rounded-full bg-voltage px-2.5 py-1 font-mono text-[11px] text-voltage-ink">
          T-4 held · 9:42 left
        </span>
      </div>
      <div className="mb-3 rounded-md border border-on-stage-soft/30 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-on-stage-soft">
        Stage
      </div>
      <div ref={boardRef} className="relative mx-auto aspect-[440/248] w-full max-w-[440px] touch-none">
        {TABLE_LAYOUT.map((table, i) => {
          const isSold = sold.has(i);
          const isHeld = i === HELD_INDEX;
          const isOpen = !isSold && !isHeld;
          return (
            <div
              key={table.label}
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              style={{ left: `${(table.x / 440) * 100}%`, top: `${(table.y / 248) * 100}%` }}
              className={cn(
                'absolute flex aspect-square w-[11.8%] select-none items-center justify-center font-mono text-[11px]',
                table.shape === 'round' ? 'rounded-full' : 'rounded-md',
                isOpen && 'cursor-grab border border-on-stage-soft/40 text-on-stage transition-shadow hover:shadow-[0_0_14px_color-mix(in_srgb,var(--voltage-accent)_35%,transparent)] active:cursor-grabbing',
                isSold && 'bg-on-stage-soft/15 text-on-stage-soft line-through',
                isHeld && 'entryvine-hold-pulse bg-voltage text-voltage-ink shadow-[var(--shadow-e1)]',
              )}
            >
              {table.label}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-on-stage-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-on-stage-soft/60" /> Drag to arrange
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
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[var(--shadow-e1)]">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Solstice Rooftop · live</p>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-success">
          <span className="entryvine-urgent h-1.5 w-1.5 rounded-full bg-success" /> On sale
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-hairline border-b border-hairline">
        <div className="px-3 py-4 sm:px-5">
          <p className="whitespace-nowrap text-[11px] text-ink-faint">Tickets sold</p>
          <p className="font-mono text-xl text-ink"><LiveNumber initial={184} min={180} max={220} step={3} /><span className="text-ink-faint">/220</span></p>
        </div>
        <div className="px-3 py-4 sm:px-5">
          <p className="whitespace-nowrap text-[11px] text-ink-faint">Your revenue</p>
          <p className="font-mono text-xl text-voltage-ink"><LiveNumber initial={11040} min={10800} max={13200} step={120} prefix="$" /></p>
        </div>
        <div className="px-3 py-4 sm:px-5">
          <p className="whitespace-nowrap text-[11px] text-ink-faint">At the door</p>
          <p className="font-mono text-xl text-ink"><LiveNumber initial={96} min={90} max={130} step={2} /><span className="text-ink-faint"> in</span></p>
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
    <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[24px] border-4 border-stage-elevated bg-stage shadow-[var(--shadow-e1)] select-none">
      <div className="px-4 pb-3 pt-4 border-b border-on-stage-soft/10">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-on-stage-soft">Door scan</p>
      </div>
      <div className="entryvine-scanline px-4 py-8 text-center text-success">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <Check className="h-5 w-5 text-success" />
        </div>
        <p className="font-display text-4xl text-on-stage">Table 3</p>
        <p className="mt-1 text-sm text-on-stage-soft">Amara O. · party of 6</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-success font-bold">Checked in</p>
      </div>
      <div className="flex items-center justify-between border-t border-on-stage-soft/10 px-5 py-4 font-mono text-[11px] text-on-stage-soft">
        <span>96 / 220 in</span>
        <span className="text-on-stage">Next scan</span>
      </div>
    </div>
  );
}
