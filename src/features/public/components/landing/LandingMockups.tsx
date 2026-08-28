import { useEffect, useRef, useState } from 'react';
import { useLandingStore, venueSlug, type VenueType } from '@/features/public/hooks/landingStore';
import { QrCode, Ticket, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';

const eventByType: Record<VenueType, { name: string; detail: string; date: string; time: string; price: string }> = {
  club: { name: 'Late Night Sessions', detail: 'Main Room · Sound & Lights', date: 'SAT, OCT 18', time: '10:00 PM', price: '$45.00' },
  theater: { name: 'Autumn Showcase', detail: 'Center Stage · Reserved', date: 'FRI, NOV 14', time: '7:30 PM', price: '$65.00' },
  rooftop: { name: 'Sunset Horizon', detail: 'Sky Deck · General Access', date: 'SUN, SEP 28', time: '6:00 PM', price: '$35.00' },
  'supper club': { name: 'Chef & Song Dinner', detail: 'Dining Hall · Table 4', date: 'THU, OCT 02', time: '7:00 PM', price: '$120.00' },
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const QR_DATA_PATH =
  'M2 2h8v8H2V2Zm2 2v4h4V4H4Zm10-2h8v8h-8V2Zm2 2v4h4V4h-4ZM2 14h8v8H2v-8Zm2 2v4h4v-4H4Zm12-2h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-2 2h2v2h-2v-2Zm-4 0h2v2h-2v-2Z';

export function HeroTicket() {
  const venueName = useLandingStore((s) => s.venueName);
  const venueType = useLandingStore((s) => s.venueType);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const interval = window.setInterval(() => setShowQr((prev) => !prev), 4000);
    return () => window.clearInterval(interval);
  }, []);

  const eventInfo = eventByType[venueType];
  const displayName = venueName.trim() || 'The Grand Hall';

  return (
    <div className="relative w-full max-w-[320px] mx-auto lp-floating" data-ticket-scene>
      <div className="lp-double-bezel">
        <div className="lp-double-bezel-inner overflow-hidden p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-(--lp-green) text-white shadow-sm">
                <Ticket className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-(--lp-ink) truncate max-w-[150px] sm:max-w-[170px]">{displayName}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-(--lp-green) truncate">
                  {venueSlug(displayName)}.ticketspan.com
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition-colors hover:bg-stone-200"
            >
              {showQr ? <Ticket className="size-3" /> : <QrCode className="size-3" />}
              <span>{showQr ? 'Details' : 'Pass'}</span>
            </button>
          </div>

          <div className="relative min-h-[210px] rounded-xl bg-stone-50/80 p-3.5 sm:p-4 border border-stone-200/60">
            {showQr ? (
              <div className="flex flex-col items-center justify-center py-2 text-center animate-[lp-rise_0.3s_var(--lp-ease)_both]">
                <div className="rounded-xl bg-white p-3 shadow-sm border border-stone-200/80">
                  <svg viewBox="0 0 24 24" className="size-24 sm:size-28 text-(--lp-ink)" aria-hidden="true">
                    <path fill="currentColor" d={QR_DATA_PATH} />
                  </svg>
                </div>
                <div className="mt-3 flex items-center gap-1.5 font-mono text-xs font-semibold text-(--lp-green)">
                  <ShieldCheck className="size-3.5" />
                  <span>VERIFIED PASS · T-04</span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-stone-500">Scan at entrance with any camera</p>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-full animate-[lp-rise_0.3s_var(--lp-ease)_both]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-md bg-(--lp-green-ivory) px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-(--lp-green)">
                      <Sparkles className="size-2.5" />
                      Confirmed
                    </span>
                    <span className="font-mono text-xs font-semibold text-(--lp-ink)">№ 04189</span>
                  </div>
                  <h3 className="mt-3 text-base sm:text-lg font-bold text-(--lp-ink) leading-snug">{eventInfo.name}</h3>
                  <p className="mt-0.5 text-xs text-stone-600 flex items-center gap-1">
                    <MapPin className="size-3 text-stone-400 shrink-0" />
                    <span className="truncate">{eventInfo.detail}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-stone-400">Date & Time</span>
                    <p className="font-medium text-stone-800 flex items-center gap-1 mt-0.5 text-[11px] sm:text-xs">
                      <Calendar className="size-3 text-stone-400 shrink-0" />
                      <span className="truncate">{eventInfo.date}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-mono uppercase text-stone-400">Paid Direct</span>
                    <p className="font-mono font-semibold text-(--lp-green) mt-0.5">{eventInfo.price}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] font-medium text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-stone-400 shrink-0" />
              Direct check-in
            </span>
            <span className="font-mono text-(--lp-green) font-semibold">100% Face Value</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const ledgerRows = [
  { attendee: 'Amara Okonkwo', type: 'Table 4 · 4 Seats', payout: '$480.00', time: 'Just now' },
  { attendee: 'Jordan Reed', type: 'VIP Box · 2 Seats', payout: '$240.00', time: '1m ago' },
  { attendee: 'Sarah Jenkins', type: 'GA Pass · 2 Tickets', payout: '$90.00', time: '4m ago' },
  { attendee: 'Marcus Cole', type: 'Early Bird · 3 Tickets', payout: '$105.00', time: '7m ago' },
  { attendee: 'Priya Nair', type: 'Table 7 · 6 Seats', payout: '$720.00', time: '12m ago' },
];

export function DashboardMock() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const interval = window.setInterval(() => setIndex((i) => i + 1), 3000);
    return () => window.clearInterval(interval);
  }, []);

  const totalSold = Math.min(138 + (index % 10), 160);
  const revenueTotal = 5420 + (index % 10) * 120;
  const currentOrders = [0, 1, 2].map((offset) => ledgerRows[(index + offset) % ledgerRows.length]);

  return (
    <div className="lp-card p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-(--lp-green-accent) animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-(--lp-green)">
              Direct Stripe Deposit
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-(--lp-ink) mt-0.5 sm:mt-1">Live Door & Payout Ledger</h4>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-emerald-50 px-3 py-1 font-mono text-[11px] sm:text-xs font-semibold text-emerald-700 border border-emerald-200">
          2-Day Rolling Payouts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 rounded-xl bg-stone-50/80 p-3 sm:p-4 border border-stone-200/60">
        <div>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-500">Gross Payout</span>
          <p className="mt-1 text-lg sm:text-2xl font-bold text-(--lp-ink) tabular-nums">${revenueTotal.toLocaleString()}</p>
        </div>
        <div>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-500">Tickets Sold</span>
          <p className="mt-1 text-lg sm:text-2xl font-bold text-(--lp-ink) tabular-nums">
            {totalSold}
            <span className="text-xs sm:text-sm font-normal text-stone-400">/160</span>
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-500">Scanned In</span>
          <p className="mt-1 text-lg sm:text-2xl font-bold text-(--lp-green) tabular-nums">{Math.floor(totalSold * 0.72)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
          <span>Capacity Ingress</span>
          <span className="font-mono font-medium text-stone-700">{Math.round((totalSold / 160) * 100)}% sold</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full bg-(--lp-green) transition-all duration-700 rounded-full"
            style={{ width: `${(totalSold / 160) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-stone-100 pt-3">
        {currentOrders.map((order, i) => (
          <div
            key={`${order.attendee}-${index}-${i}`}
            className="flex items-center justify-between rounded-lg bg-stone-50/50 p-2 sm:p-2.5 text-xs transition-all animate-[lp-rise_0.3s_var(--lp-ease)_both]"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                ✓
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 truncate">{order.attendee}</p>
                <p className="text-[10px] sm:text-[11px] text-stone-500 truncate">{order.type}</p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <span className="font-mono font-bold text-(--lp-green)">{order.payout}</span>
              <p className="text-[10px] text-stone-400">{order.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TableShape = 'circle' | 'square' | 'rect';
interface TableItem {
  id: number;
  x: number;
  y: number;
  shape: TableShape;
  status: 'open' | 'booked' | 'held';
  seats: number;
}

const initialTables: TableItem[] = [
  { id: 1, x: 45, y: 70, shape: 'circle', status: 'booked', seats: 4 },
  { id: 2, x: 105, y: 65, shape: 'rect', status: 'held', seats: 6 },
  { id: 3, x: 175, y: 70, shape: 'circle', status: 'open', seats: 4 },
  { id: 4, x: 50, y: 125, shape: 'square', status: 'open', seats: 2 },
  { id: 5, x: 110, y: 120, shape: 'circle', status: 'booked', seats: 4 },
  { id: 6, x: 170, y: 125, shape: 'square', status: 'open', seats: 2 },
];

export function FloorPlanMock() {
  const [tables, setTables] = useState<TableItem[]>(initialTables);
  const [heldTime, setHeldTime] = useState(580);
  const svgRef = useRef<SVGSVGElement>(null);
  const activeDrag = useRef<{ id: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setHeldTime((t) => (t > 0 ? t - 1 : 600));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const table = tables.find((t) => t.id === id);
    if (!table || table.status !== 'open') return;

    activeDrag.current = {
      id,
      startX: ((e.clientX - rect.left) / rect.width) * 220 - table.x,
      startY: ((e.clientY - rect.top) / rect.height) * 160 - table.y,
    };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      void 0;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 220 - activeDrag.current.startX;
    const curY = ((e.clientY - rect.top) / rect.height) * 160 - activeDrag.current.startY;

    const clampedX = Math.max(25, Math.min(195, curX));
    const clampedY = Math.max(50, Math.min(140, curY));

    setTables((prev) =>
      prev.map((t) => (t.id === activeDrag.current?.id ? { ...t, x: clampedX, y: clampedY } : t))
    );
  };

  const handlePointerUp = () => {
    activeDrag.current = null;
  };

  return (
    <div className="lp-card p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-(--lp-green)">
            Studio Canvas
          </span>
          <h4 className="text-lg sm:text-xl font-bold text-(--lp-ink) mt-0.5">Interactive Table Layout</h4>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-stone-100 px-3 py-1 font-mono text-[10px] sm:text-[11px] font-medium text-stone-600 whitespace-nowrap">
          Drag open tables to arrange
        </span>
      </div>

      <div className="relative rounded-xl bg-stone-50/80 p-2 sm:p-3 border border-stone-200/60 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 220 160"
          className="w-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <rect x="30" y="8" width="160" height="24" rx="6" fill="#064e3b" />
          <text
            x="110"
            y="20"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8"
            fontWeight="bold"
            letterSpacing="1.2"
          >
            MAIN STAGE / DJ BOOTH
          </text>

          {tables.map((t) => {
            const isBooked = t.status === 'booked';
            const isHeld = t.status === 'held';
            const fill = isBooked ? '#111816' : isHeld ? '#059669' : '#ffffff';
            const stroke = isBooked ? '#111816' : isHeld ? '#059669' : '#d6d3d1';
            const textColor = isBooked || isHeld ? '#ffffff' : '#111816';

            return (
              <g
                key={t.id}
                onPointerDown={(e) => handlePointerDown(e, t.id)}
                style={{ cursor: t.status === 'open' ? 'grab' : 'default' }}
              >
                {t.shape === 'circle' && (
                  <circle cx={t.x} cy={t.y} r="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
                )}
                {t.shape === 'square' && (
                  <rect x={t.x - 12} y={t.y - 12} width="24" height="24" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
                )}
                {t.shape === 'rect' && (
                  <rect x={t.x - 18} y={t.y - 10} width="36" height="20" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
                )}
                <text x={t.x} y={t.y + 2.5} textAnchor="middle" fontSize="7" fontWeight="bold" fill={textColor}>
                  T-{t.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 font-medium text-stone-700">
            <span className="size-2 rounded-full bg-stone-900" /> Booked
          </span>
          <span className="flex items-center gap-1 font-medium text-stone-700">
            <span className="size-2 rounded-full bg-(--lp-green-light)" /> Held
          </span>
          <span className="flex items-center gap-1 font-medium text-stone-700">
            <span className="size-2 rounded-full border border-stone-300 bg-white" /> Open
          </span>
        </div>
        <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold text-(--lp-green)">
          T-2 Held: {formatTimer(heldTime)}
        </span>
      </div>
    </div>
  );
}

const scanEntries = [
  { verdict: 'VALID ENTRY', guest: 'Jordan Reed', seat: 'Table 4 · Seat 1', code: '№ 04189' },
  { verdict: 'VALID ENTRY', guest: 'Sarah Jenkins', seat: 'General Admission', code: '№ 04190' },
  { verdict: 'ALREADY SCANNED', guest: 'Duplicate Pass', seat: 'Scanned at 9:12 PM', code: '№ 04188' },
  { verdict: 'VALID ENTRY', guest: 'Marcus Cole', seat: 'Early Bird Entry', code: '№ 04191' },
];

export function ScannerMock() {
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const interval = window.setInterval(() => setCursor((c) => (c + 1) % scanEntries.length), 2600);
    return () => window.clearInterval(interval);
  }, []);

  const entry = scanEntries[cursor];
  const isDuplicate = entry.verdict === 'ALREADY SCANNED';

  return (
    <div className="w-full max-w-[270px] mx-auto rounded-2xl bg-stone-950 p-3 text-white shadow-xl ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-stone-800 px-2 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">Scanner Viewfinder</span>
        <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Camera Active
        </span>
      </div>

      <div className="my-3 rounded-xl border border-stone-800 bg-stone-900/60 p-3.5 text-center">
        <div className="flex justify-center">
          {isDuplicate ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <AlertTriangle className="size-4" />
            </span>
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
          )}
        </div>
        <p className={`mt-2 font-mono text-xs sm:text-sm font-bold tracking-wider ${isDuplicate ? 'text-rose-400' : 'text-emerald-400'}`}>
          {entry.verdict}
        </p>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-white truncate">{entry.guest}</p>
        <p className="font-mono text-[10px] sm:text-[11px] text-stone-400 truncate">{entry.seat}</p>
      </div>

      <div className="flex items-center justify-between border-t border-stone-800 px-2 pt-2 font-mono text-[10px] text-stone-400">
        <span>In: 114 / 160</span>
        <span className="text-emerald-400">Offline Ready</span>
      </div>
    </div>
  );
}
