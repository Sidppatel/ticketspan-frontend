import { useCallback, useMemo, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listPricesForEvent,
  listPriceRules,
  createPriceRule,
  deletePriceRule,
  updatePriceRule,
  calculatePrice,
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
import { cn } from '@/shared/lib/cn';
import type { Price, PriceRule } from '@/shared/proto/pricing';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { zonedInputToEpoch } from '@/shared/lib/timezone';



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
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  const prices = useMemo(() => state.data?.prices ?? [], [state.data]);
  const groups = useMemo(() => state.data?.groups ?? [], [state.data]);
  const tickets = useMemo(() => prices.filter((p) => p.pricingType === 'TicketTier'), [prices]);
  const tables = useMemo(() => prices.filter((p) => p.pricingType === 'Table'), [prices]);

  const noApplicablePrices = (!showTickets || tickets.length === 0) && (!showTables || tables.length === 0);

  const now = nowSeconds();


  function createRule(draft: { name: string; ruleType: string; percent: number; capacity: number; activeFrom: string; activeUntil: string }) {
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
            capacity: draft.capacity,
          }),
        ),
      ).then(() => state.reload()),
    );
  }

  function removeGroup(group: RuleGroup) {
    return guard(() => Promise.all(group.priceRuleIds.map(deletePriceRule)).then(() => state.reload()));
  }

  return (
    <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/20 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <CardTitle className="mt-1 font-display text-base font-bold text-foreground">Prices &amp; rules</CardTitle>
        </div>
        <Button size="sm" onClick={() => setRuleBuilderOpen(true)} disabled={noApplicablePrices || ruleBuilderOpen} className="entryvine-spring-btn h-9 px-4 rounded-lg font-bold text-xs">
          <Plus className="mr-1.5 h-4 w-4" /> Add New Rule
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {notice ? <p className="text-[10px] font-bold text-warning bg-warning/10 border border-warning/20 rounded-lg p-2.5 leading-normal">{notice}</p> : null}
        {state.loading ? <p className="text-sm text-muted-foreground">Loading prices…</p> : null}

        {ruleBuilderOpen && (
          <InlineRuleBuilder
            timeZone={timeZone}
            onCancel={() => setRuleBuilderOpen(false)}
            onSubmit={(draft) => {
              return createRule(draft).then(() => setRuleBuilderOpen(false));
            }}
          />
        )}

        <RuleStrip
          groups={groups}
          prices={prices}
          now={now}
          timeZone={timeZone}
          onRemove={removeGroup}
          onChanged={state.reload}
          onError={setNotice}
        />

      </CardContent>


    </Card>
  );
}

function RuleStrip({
  groups,
  prices,
  now,
  timeZone,
  onRemove,
  onChanged,
  onError,
}: {
  groups: RuleGroup[];
  prices: Price[];
  now: number;
  timeZone: string;
  onRemove: (group: RuleGroup) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-6 flex flex-col items-center justify-center text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs font-semibold text-muted-foreground">
          No discount rules. Prices show at list value.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <RuleGroupItem
          key={g.key}
          group={g}
          prices={prices}
          now={now}
          timeZone={timeZone}
          onRemove={onRemove}
          onChanged={onChanged}
          onError={onError}
        />
      ))}
    </div>
  );
}

function RuleGroupItem({
  group,
  prices,
  now,
  timeZone,
  onRemove,
  onChanged,
  onError,
}: {
  group: RuleGroup;
  prices: Price[];
  now: number;
  timeZone: string;
  onRemove: (group: RuleGroup) => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const live = isWindowActive(group.activeFrom, group.activeUntil, now);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-300 shadow-sm',
        live ? 'border-amber/40 bg-amber/5' : 'border-border/50 bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {live ? <Sparkles className="size-4 text-amber animate-pulse" /> : null}
            <span className="truncate font-bold text-sm text-foreground">{group.name}</span>
            <span className="rounded-md bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success border border-success/20">
              −{group.percent}%
            </span>
          </div>
          <p className="mt-1 text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="uppercase tracking-wider">{group.ruleType}</span>
            <span>&bull;</span>
            <span>{formatEpochInZone(group.activeFrom, timeZone)} &rarr; {formatEpochInZone(group.activeUntil, timeZone)}</span>
            {live ? '' : <span className="text-primary/70 bg-primary/10 px-1.5 rounded-sm">Scheduled</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={expanded ? "default" : "outline"}
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-bold h-8 px-3 rounded-lg"
          >
            {expanded ? 'Hide prices' : 'Edit prices'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label={`Delete rule ${group.name}`}
            onClick={() => onRemove(group)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {live ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-amber/20 border border-amber/10">
          <div
            className="h-full rounded-full bg-amber shadow-[0_0_8px_color-mix(in_srgb,var(--amber)_60%,transparent)]"
            style={{ width: `${windowProgress(group.activeFrom, group.activeUntil, now)}%` }}
          />
        </div>
      ) : null}

      {expanded && (
        <div className="mt-3 border-t border-border/50 pt-2 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Rule Prices (does not affect base price)
          </p>
          {group.rules.map((rule) => {
            const price = prices.find((p) => p.pricesId === rule.pricesId);
            if (!price) return null;
            return (
              <RulePriceRow
                key={`${rule.priceRulesId}-${rule.priceCents}`}
                priceName={price.name}
                basePriceCents={price.basePriceCents}
                rule={rule}
                onChanged={onChanged}
                onError={onError}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RulePriceRow({
  priceName,
  basePriceCents,
  rule,
  onChanged,
  onError,
}: {
  priceName: string;
  basePriceCents: number;
  rule: PriceRule;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [value, setValue] = useState(centsToUsdInput(rule.priceCents));
  const dirty = usdToCents(value) !== rule.priceCents;


  const fetchBreakdown = useCallback(() => {
    return calculatePrice(rule.pricesId, 1, rule.activeFrom?.toString());
  }, [rule.pricesId, rule.activeFrom]);
  const { data: breakdown } = useAsync(fetchBreakdown);

  async function handleSave() {
    try {
      await updatePriceRule({
        priceRulesId: rule.priceRulesId,
        name: rule.name,
        ruleType: rule.ruleType,
        priority: rule.priority,
        priceCents: usdToCents(value),
        activeFrom: rule.activeFrom,
        activeUntil: rule.activeUntil,
        minRemaining: rule.minRemaining,
        maxRemaining: rule.maxRemaining,
        isActive: rule.isActive,
        capacity: rule.capacity,
        pricesId: rule.pricesId,
      });
      onChanged();
    } catch (err) {
      onError(rpcErrorMessage(err));
    }
  }

  return (
    <div className="space-y-1.5 py-1.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-4 text-sm bg-muted/10 p-3 rounded-xl border border-border/30">
        <span className="flex-1 truncate font-bold text-xs text-foreground">{priceName}</span>
        <span className="text-[10px] text-muted-foreground line-through font-display font-bold">
          {centsToUSD(basePriceCents)}
        </span>
        <div className="relative w-28 entryvine-spring-input">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">
            $
          </span>
          <Input
            className="pl-7 text-right font-display tabular-nums h-9 text-xs font-bold bg-background border-border"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setValue(new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(usdToCents(value) / 100))}
          />
        </div>
        <Button
          size="sm"
          className={cn("h-9 px-4 rounded-lg font-bold text-xs", dirty ? "entryvine-spring-btn shadow-md shadow-primary/20" : "")}
          variant={dirty ? 'default' : 'outline'}
          disabled={!dirty}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
      {breakdown ? (
        <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground bg-secondary/20 rounded-lg p-3 sm:grid-cols-5 border border-border/20 mx-1 mt-1">
          <div>
            <span className="block font-medium text-foreground">Platform Fee</span>
            <span className="tabular-nums">{centsToUSD(breakdown.platformFeeCents)}</span>
          </div>
          <div>
            <span className="block font-medium text-foreground">Tax</span>
            <span className="tabular-nums">{centsToUSD(breakdown.taxCents)}</span>
          </div>
          <div>
            <span className="block font-medium text-foreground">Final Price</span>
            <span className="tabular-nums text-success font-semibold">{centsToUSD(breakdown.finalPriceCents)}</span>
          </div>
          <div>
            <span className="block font-medium text-foreground">Organizer Net</span>
            <span className="tabular-nums text-info font-semibold">{centsToUSD(breakdown.organizerNetCents)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
function InlineRuleBuilder({
  timeZone,
  onCancel,
  onSubmit,
}: {
  timeZone: string;
  onCancel: () => void;
  onSubmit: (draft: { name: string; ruleType: string; percent: number; capacity: number; activeFrom: string; activeUntil: string }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState('Presale');
  const [percent, setPercent] = useState(10);
  const [capacity, setCapacity] = useState(0);
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/10 p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-1">
        <h3 className="font-display text-base font-bold tracking-tight">Create a new rule</h3>
        <p className="text-[10px] text-muted-foreground font-semibold">
          Applies to every ticket and table type for the window you set. Add-ons stay at list price.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[10px]">Name</Label>
          <div className="entryvine-spring-input">
            <Input
              value={name}
              placeholder="e.g. Pre-sale"
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-background border-border text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px]">Type</Label>
          <div className="entryvine-spring-input">
            <Input
              value={ruleType}
              placeholder="Presale"
              list="rule-type-suggestions"
              onChange={(e) => setRuleType(e.target.value)}
              className="h-10 bg-background border-border text-sm"
            />
            <datalist id="rule-type-suggestions">
              <option value="Presale" />
              <option value="LastMinute" />
              <option value="TimeWindow" />
              <option value="Dynamic" />
            </datalist>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px]">Discount %</Label>
          <div className="entryvine-spring-input relative">
            <Input
              type="number"
              min={0}
              max={100}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="h-10 bg-background border-border text-sm pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">%</span>
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-[10px]">Capacity (people/seats, 0 = no cap)</Label>
          <div className="entryvine-spring-input">
            <Input
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="h-10 bg-background border-border text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px]">Starts</Label>
          <DateTimePicker value={from} onChange={setFrom} timeZone={timeZone} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px]">Ends</Label>
          <DateTimePicker value={until} onChange={setUntil} timeZone={timeZone} fallbackDate={from} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={busy} className="h-9 px-4 rounded-lg font-bold text-xs">
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy || !name.trim()} className="entryvine-spring-btn h-9 px-6 rounded-lg font-bold text-xs shadow-sm">
          {busy ? 'Saving…' : 'Create rule'}
        </Button>
      </div>
    </div>
  );
}


