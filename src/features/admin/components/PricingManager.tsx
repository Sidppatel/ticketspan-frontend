import { useCallback, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronDown, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listPricesForEvent,
  listPriceRules,
  createPrice,
  updatePrice,
  deletePrice,
  createPriceRule,
  deletePriceRule,
} from '@/features/admin/services/pricingService';
import {
  groupEventRules,
  discountedCents,
  isWindowActive,
  windowProgress,
  nowSeconds,
  type RuleGroup,
} from '@/features/admin/services/pricingRules';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD, centsToUsdInput, usdToCents } from '@/shared/lib/format';
import { formatEpochInZone } from '@/shared/lib/timezone';
import type { Price } from '@/shared/proto/pricing';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { RuleDialog, type RuleDraft } from '@/features/admin/components/RuleDialog';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PricingManager({
  eventsId,
  eventType,
  timeZone,
}: {
  eventsId: string;
  eventType: string;
  timeZone: string;
}) {
  const showTickets = eventType !== 'Table';
  const showTables = eventType !== 'Open';

  const load = useCallback(async () => {
    const prices = await listPricesForEvent(eventsId);
    const owners = prices.filter((p) => p.pricingType === 'TicketTier' || p.pricingType === 'Table');
    const ruleLists = await Promise.all(owners.map((p) => listPriceRules(p.pricesId)));
    return { prices, groups: groupEventRules(prices, ruleLists.flat()) };
  }, [eventsId]);

  const state = useAsync(load);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const prices = state.data?.prices ?? [];
  const groups = state.data?.groups ?? [];
  const tickets = prices.filter((p) => p.pricingType === 'TicketTier');
  const tables = prices.filter((p) => p.pricingType === 'Table');
  const addOns = prices.filter((p) => p.pricingType === 'AddOn');

  const now = nowSeconds();
  const active = groups.find((g) => isWindowActive(g.activeFrom, g.activeUntil, now)) ?? null;
  const percent = active?.percent ?? 0;

  function createRule(draft: RuleDraft) {
    const owners = [...tickets, ...tables];
    return guard(() =>
      Promise.all(
        owners.map((p) =>
          createPriceRule({
            pricesId: p.pricesId,
            name: draft.name,
            ruleType: draft.ruleType,
            priority: 10,
            priceCents: discountedCents(p.basePriceCents, draft.percent),
            activeFrom: draft.activeFrom,
            activeUntil: draft.activeUntil,
            minRemaining: -1,
            maxRemaining: -1,
          }),
        ),
      ).then(() => state.reload()),
    );
  }

  function removeGroup(group: RuleGroup) {
    return guard(() => Promise.all(group.priceRuleIds.map(deletePriceRule)).then(() => state.reload()));
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </p>
          <CardTitle className="mt-1 font-display text-xl">Prices &amp; rules</CardTitle>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus /> New rule
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}
        {state.loading ? <p className="text-sm text-muted-foreground">Loading prices…</p> : null}

        <RuleStrip groups={groups} now={now} timeZone={timeZone} onRemove={removeGroup} />

        {showTickets ? (
          <Section label="Ticket types" count={tickets.length} defaultOpen={!active}>
            <PriceList prices={tickets} percent={percent} />
          </Section>
        ) : null}

        {showTables ? (
          <Section label="Table types" count={tables.length} defaultOpen={!active}>
            <PriceList prices={tables} percent={percent} />
          </Section>
        ) : null}

        <Section label="Add-ons" count={addOns.length} defaultOpen editable>
          <AddOnEditor
            eventsId={eventsId}
            addOns={addOns}
            onChanged={state.reload}
            onError={setNotice}
          />
        </Section>
      </CardContent>

      {dialogOpen ? (
        <RuleDialog timeZone={timeZone} onClose={() => setDialogOpen(false)} onSubmit={createRule} />
      ) : null}
    </Card>
  );
}

function RuleStrip({
  groups,
  now,
  timeZone,
  onRemove,
}: {
  groups: RuleGroup[];
  now: number;
  timeZone: string;
  onRemove: (group: RuleGroup) => void;
}) {
  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        No discount rules. Prices show at list value.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const live = isWindowActive(g.activeFrom, g.activeUntil, now);
        return (
          <div
            key={g.key}
            className={
              live
                ? 'rounded-xl border border-amber/50 bg-amber/10 p-3'
                : 'rounded-xl border border-border p-3'
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {live ? <Sparkles className="size-4 text-amber-foreground" /> : null}
                  <span className="truncate font-medium">{g.name}</span>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                    −{g.percent}%
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {g.ruleType} · {formatEpochInZone(g.activeFrom, timeZone)} →{' '}
                  {formatEpochInZone(g.activeUntil, timeZone)}
                  {live ? '' : ' · scheduled'}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete rule ${g.name}`}
                onClick={() => onRemove(g)}
              >
                <Trash2 />
              </Button>
            </div>
            {live ? (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-amber/20">
                <div
                  className="h-full rounded-full bg-amber"
                  style={{ width: `${windowProgress(g.activeFrom, g.activeUntil, now)}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Section({
  label,
  count,
  defaultOpen,
  editable,
  children,
}: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  editable?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const body = useRef<HTMLDivElement>(null);
  const chevron = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const el = body.current;
      if (!el) {
        return;
      }
      if (reduced()) {
        gsap.set(el, { height: open ? 'auto' : 0 });
        gsap.set(chevron.current, { rotate: open ? 180 : 0 });
        return;
      }
      gsap.to(el, {
        height: open ? 'auto' : 0,
        autoAlpha: open ? 1 : 0,
        duration: open ? 0.35 : 0.28,
        ease: open ? 'power2.out' : 'power2.in',
      });
      gsap.to(chevron.current, { rotate: open ? 180 : 0, duration: 0.3, ease: 'power2.out' });
    },
    { dependencies: [open] },
  );

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {count}
          </span>
          {editable ? (
            <span className="text-[0.6rem] font-medium uppercase tracking-wider text-amber-foreground">
              editable
            </span>
          ) : null}
        </span>
        <ChevronDown ref={chevron} className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <div ref={body} className="overflow-hidden" style={{ height: defaultOpen ? undefined : 0 }}>
        <div className="space-y-2 px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}

function PriceList({ prices, percent }: { prices: Price[]; percent: number }) {
  if (prices.length === 0) {
    return <p className="py-1 text-sm text-muted-foreground">None defined yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {prices.map((p) => (
        <li key={p.pricesId} className="flex items-center justify-between gap-4 py-2.5">
          <span className="truncate text-sm font-medium">{p.name}</span>
          <PriceFigure baseCents={p.basePriceCents} percent={percent} />
        </li>
      ))}
    </ul>
  );
}

function PriceFigure({ baseCents, percent }: { baseCents: number; percent: number }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const strike = useRef<HTMLSpanElement>(null);
  const target = discountedCents(baseCents, percent);

  useGSAP(
    () => {
      if (percent <= 0 || !numRef.current) {
        return;
      }
      if (reduced()) {
        numRef.current.textContent = centsToUSD(target);
        return;
      }
      gsap.fromTo(strike.current, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
      const counter = { value: baseCents };
      gsap.to(counter, {
        value: target,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          if (numRef.current) {
            numRef.current.textContent = centsToUSD(counter.value);
          }
        },
      });
    },
    { dependencies: [percent, baseCents, target] },
  );

  if (percent <= 0) {
    return <span className="font-display text-base font-semibold tabular-nums">{centsToUSD(baseCents)}</span>;
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="relative text-sm text-muted-foreground">
        {centsToUSD(baseCents)}
        <span
          ref={strike}
          className="absolute left-0 top-1/2 h-px w-full origin-left bg-muted-foreground"
          aria-hidden
        />
      </span>
      <span ref={numRef} className="font-display text-base font-semibold tabular-nums text-success">
        {centsToUSD(target)}
      </span>
    </span>
  );
}

function AddOnEditor({
  eventsId,
  addOns,
  onChanged,
  onError,
}: {
  eventsId: string;
  addOns: Price[];
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  async function guard(action: () => Promise<void>) {
    try {
      await action();
    } catch (caught) {
      onError(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-2">
      {addOns.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">No add-ons yet.</p>
      ) : (
        addOns.map((p) => (
          <AddOnRow key={p.pricesId} price={p} onChanged={onChanged} onError={onError} />
        ))
      )}

      <div className="mt-2 flex flex-col gap-2 border-t border-dashed border-border pt-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="addon-name">New add-on</Label>
          <Input
            id="addon-name"
            value={name}
            placeholder="Parking pass"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-full space-y-1 sm:w-32">
          <Label htmlFor="addon-price">Price ($)</Label>
          <Input
            id="addon-price"
            inputMode="decimal"
            value={price}
            placeholder="0.00"
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={!name.trim()}
          onClick={() =>
            guard(() =>
              createPrice({
                eventsId,
                name: name.trim(),
                pricingType: 'AddOn',
                basePriceCents: usdToCents(price),
                perAttendeeCents: 0,
                isAllInclusive: false,
                feeFormulasId: '',
                parentPricesId: '',
                maxQuantity: 0,
              }).then(() => {
                setName('');
                setPrice('');
                onChanged();
              }),
            )
          }
        >
          <Plus /> Add
        </Button>
      </div>
    </div>
  );
}

function AddOnRow({
  price,
  onChanged,
  onError,
}: {
  price: Price;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [value, setValue] = useState(centsToUsdInput(price.basePriceCents));
  const dirty = usdToCents(value) !== price.basePriceCents;

  async function guard(action: () => Promise<void>) {
    try {
      await action();
    } catch (caught) {
      onError(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1 truncate text-sm font-medium">{price.name}</span>
      <div className="relative w-28">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          className="pl-6 text-right font-display tabular-nums"
          inputMode="decimal"
          value={value}
          aria-label={`${price.name} price`}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        variant={dirty ? 'default' : 'outline'}
        disabled={!dirty}
        onClick={() =>
          guard(() =>
            updatePrice({
              pricesId: price.pricesId,
              name: price.name,
              basePriceCents: usdToCents(value),
              perAttendeeCents: price.perAttendeeCents,
              isAllInclusive: price.isAllInclusive,
              maxQuantity: price.maxQuantity,
              isActive: price.isActive,
              feeFormulasId: price.feeFormulasId,
            }).then(onChanged),
          )
        }
      >
        Save
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Delete ${price.name}`}
        onClick={() => guard(() => deletePrice(price.pricesId).then(onChanged))}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
