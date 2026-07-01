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
import { RuleDialog, type RuleDraft } from '@/features/admin/components/RuleDialog';



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

  const prices = useMemo(() => state.data?.prices ?? [], [state.data]);
  const groups = useMemo(() => state.data?.groups ?? [], [state.data]);
  const tickets = useMemo(() => prices.filter((p) => p.pricingType === 'TicketTier'), [prices]);
  const tables = useMemo(() => prices.filter((p) => p.pricingType === 'Table'), [prices]);

  const noApplicablePrices = (!showTickets || tickets.length === 0) && (!showTables || tables.length === 0);

  const now = nowSeconds();


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
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </p>
          <CardTitle className="mt-1 font-display text-xl">Prices &amp; rules</CardTitle>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} disabled={noApplicablePrices}>
          <Plus /> New rule
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}
        {state.loading ? <p className="text-sm text-muted-foreground">Loading prices…</p> : null}

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

      {dialogOpen ? (
        <RuleDialog timeZone={timeZone} onClose={() => setDialogOpen(false)} onSubmit={createRule} />
      ) : null}
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
      <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        No discount rules. Prices show at list value.
      </p>
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
        'rounded-xl border p-3 transition-colors',
        live ? 'border-amber/50 bg-amber/10' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {live ? <Sparkles className="size-4 text-amber-foreground" /> : null}
            <span className="truncate font-medium">{group.name}</span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
              −{group.percent}%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {group.ruleType} · {formatEpochInZone(group.activeFrom, timeZone)} →{' '}
            {formatEpochInZone(group.activeUntil, timeZone)}
            {live ? '' : ' · scheduled'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="text-xs h-8 px-2"
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
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-amber/20">
          <div
            className="h-full rounded-full bg-amber"
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
                key={rule.priceRulesId}
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
      <div className="flex items-center gap-4 text-sm">
        <span className="flex-1 truncate font-medium text-foreground">{priceName}</span>
        <span className="text-xs text-muted-foreground line-through font-display">
          {centsToUSD(basePriceCents)}
        </span>
        <div className="relative w-28">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            className="pl-6 text-right font-display tabular-nums h-8 text-xs"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          className="h-8 text-xs"
          variant={dirty ? 'default' : 'outline'}
          disabled={!dirty}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
      {breakdown ? (
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-lg p-2 sm:grid-cols-5">
          <div>
            <span className="block font-medium text-foreground">Platform Fee</span>
            <span className="tabular-nums">{centsToUSD(breakdown.platformFeeCents)}</span>
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







