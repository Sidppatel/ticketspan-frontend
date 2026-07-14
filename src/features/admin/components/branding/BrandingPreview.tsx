import { useState, type CSSProperties } from 'react';
import { Monitor, Smartphone, Ticket, QrCode } from 'lucide-react';
import { brandingCssVars, type TenantBranding } from '@/shared/theme/branding';
import { cn } from '@/shared/lib/cn';

type PreviewTab = 'event' | 'ticketing' | 'floorplan';

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'event', label: 'Event page' },
  { id: 'ticketing', label: 'Ticketing' },
  { id: 'floorplan', label: 'Floor plan' },
];

export function BrandingPreview({
  branding,
  eventName = 'Summer Rooftop Sessions',
}: {
  branding: TenantBranding;
  eventName?: string;
}) {
  const [tab, setTab] = useState<PreviewTab>('event');
  const [mobile, setMobile] = useState(false);
  const scopedVars = brandingCssVars(branding) as CSSProperties;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                tab === entry.id
                  ? 'bg-surface text-ink shadow-[var(--shadow-e1)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            aria-label="Desktop preview"
            onClick={() => setMobile(false)}
            className={cn('rounded-md p-1.5', !mobile ? 'bg-surface shadow-[var(--shadow-e1)]' : 'text-muted-foreground')}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Mobile preview"
            onClick={() => setMobile(true)}
            className={cn('rounded-md p-1.5', mobile ? 'bg-surface shadow-[var(--shadow-e1)]' : 'text-muted-foreground')}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        style={scopedVars}
        className={cn(
          'mx-auto overflow-hidden rounded-xl border border-hairline shadow-[var(--shadow-e2)] transition-all',
          mobile ? 'max-w-[360px]' : 'w-full',
        )}
      >
        <div className="bg-canvas text-ink">
          <PreviewHeader branding={branding} mobile={mobile} />
          {tab === 'event' ? <PreviewEventPage eventName={eventName} mobile={mobile} /> : null}
          {tab === 'ticketing' ? <PreviewTicketing eventName={eventName} /> : null}
          {tab === 'floorplan' ? <PreviewFloorPlan /> : null}
          <PreviewFooter branding={branding} />
        </div>
      </div>
    </div>
  );
}

function PreviewHeader({ branding, mobile }: { branding: TenantBranding; mobile: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline bg-surface px-4 py-2.5">
      <div className="flex items-center gap-2">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-6 w-6 rounded object-contain" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded bg-brand text-[10px] font-bold text-brand-ink">
            {(branding.tenantName || 'S').slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="text-sm font-semibold">{branding.tenantName || 'Your brand'}</span>
      </div>
      {!mobile ? (
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="border-b-2 border-brand pb-0.5 font-medium text-ink">Events</span>
          <span>Tickets</span>
          <span>Bookings</span>
          <span className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground">Sign in</span>
        </div>
      ) : null}
    </div>
  );
}

function PreviewEventPage({ eventName, mobile }: { eventName: string; mobile: boolean }) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-stage p-5 text-on-stage">
        <span className="rounded-full bg-marigold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marigold-foreground">
          Featured
        </span>
        <h3 className="mt-2 font-display text-xl font-semibold">{eventName}</h3>
        <p className="mt-1 text-xs text-on-stage-soft">Sat, Aug 15 · 7:00 PM · Grand Terrace</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Get tickets
          </span>
          <span className="rounded-md border border-on-stage-soft px-3 py-1.5 text-xs text-on-stage">
            View schedule
          </span>
        </div>
      </div>
      <div className={cn('grid gap-3', mobile ? 'grid-cols-1' : 'grid-cols-2')}>
        {['Live jazz quartet', 'Sunset tasting menu'].map((item) => (
          <div key={item} className="rounded-lg border border-hairline bg-surface p-3">
            <p className="text-xs font-semibold text-brand">8:30 PM</p>
            <p className="mt-0.5 text-sm font-medium text-ink">{item}</p>
            <p className="mt-1 text-xs text-ink-soft">Main stage · 45 min</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
        <p className="text-xs font-medium text-secondary-foreground">Early-bird pricing ends Friday</p>
        <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Book now
        </span>
      </div>
    </div>
  );
}

function PreviewTicketing({ eventName }: { eventName: string }) {
  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-semibold text-ink">{eventName} — Tickets</p>
      {[
        { name: 'General Admission', price: '$45.00', note: 'Standing · open bar access' },
        { name: 'Table', price: '$220.00', note: 'Seats 4 · bottle service' },
      ].map((tier) => (
        <div
          key={tier.name}
          className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
              <Ticket className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{tier.name}</p>
              <p className="text-xs text-ink-soft">{tier.note}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-ink">{tier.price}</span>
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              Select
            </span>
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-hairline bg-surface p-3">
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>Subtotal</span>
          <span>$45.00</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm font-semibold text-ink">
          <span>Total</span>
          <span className="text-brand">$48.20</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2 rounded-md bg-secondary p-2">
          <QrCode className="h-7 w-7 text-secondary-foreground" />
          <p className="text-[11px] text-secondary-foreground">
            Your QR ticket arrives by email after checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewFloorPlan() {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Choose your table</p>
        <div className="flex items-center gap-3 text-[10px] text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-marigold" /> Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-ink-faint" /> Taken
          </span>
        </div>
      </div>
      <svg viewBox="0 0 320 170" className="w-full rounded-lg border border-hairline bg-surface">
        <rect x="90" y="8" width="140" height="20" rx="4" className="fill-[var(--stage)]" />
        <text x="160" y="22" textAnchor="middle" className="fill-[var(--on-stage)] text-[9px]">
          STAGE
        </text>
        {[
          { cx: 60, cy: 70, state: 'available', label: 'T1' },
          { cx: 130, cy: 70, state: 'selected', label: 'T2' },
          { cx: 200, cy: 70, state: 'available', label: 'T3' },
          { cx: 265, cy: 70, state: 'taken', label: 'T4' },
          { cx: 60, cy: 130, state: 'taken', label: 'T5' },
          { cx: 130, cy: 130, state: 'available', label: 'T6' },
          { cx: 200, cy: 130, state: 'available', label: 'T7' },
          { cx: 265, cy: 130, state: 'selected', label: 'T8' },
        ].map((table) => (
          <g key={table.label}>
            <circle
              cx={table.cx}
              cy={table.cy}
              r="18"
              className={
                table.state === 'selected'
                  ? 'fill-[var(--marigold)]'
                  : table.state === 'taken'
                    ? 'fill-[var(--ink-faint)]'
                    : 'fill-[var(--brand)]'
              }
              opacity={table.state === 'taken' ? 0.5 : 1}
            />
            <text
              x={table.cx}
              y={table.cy + 3}
              textAnchor="middle"
              className={
                table.state === 'selected'
                  ? 'fill-[var(--marigold-foreground)] text-[9px] font-semibold'
                  : 'fill-[var(--brand-ink)] text-[9px] font-semibold'
              }
            >
              {table.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-3 py-2">
        <p className="text-xs text-ink-soft">
          Table T2 · seats 4 · <span className="font-semibold text-ink">$220.00</span>
        </p>
        <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          Reserve
        </span>
      </div>
    </div>
  );
}

function PreviewFooter({ branding }: { branding: TenantBranding }) {
  return (
    <div className="flex items-center justify-between border-t border-hairline bg-surface px-4 py-2.5">
      <span className="text-[11px] text-ink-soft">
        © {new Date().getFullYear()} {branding.tenantName || 'Your brand'}
      </span>
      <span className="text-[11px] font-medium text-brand">Powered by entryvine</span>
    </div>
  );
}
