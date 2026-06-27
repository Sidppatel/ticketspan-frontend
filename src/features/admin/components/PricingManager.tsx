import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listPricesForEvent,
  createPrice,
  deletePrice,
  listPriceRules,
  createPriceRule,
  deletePriceRule,
  calculatePrice,
} from '@/features/admin/services/pricingService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import type { Price, PriceRule, PriceBreakdown } from '@/shared/proto/pricing';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select } from '@/shared/ui/select';

const PRICING_TYPES = ['TicketTier', 'Table', 'AddOn'];

/**
 * Admin surface for the Pricing Module: defines prices (with table per-attendee /
 * all-inclusive modes), priority-ordered rules (presale / last-minute / dynamic),
 * and a live server-authoritative CalculatePrice preview. Fee is developer-
 * controlled — admins see the resolved amount but cannot change the formula here.
 */
export function PricingManager({ eventsId }: { eventsId: string }) {
  const pricesLoader = useCallback(() => listPricesForEvent(eventsId), [eventsId]);
  const prices = useAsync(pricesLoader);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [pricingType, setPricingType] = useState('TicketTier');
  const [basePriceCents, setBasePriceCents] = useState(0);
  const [perAttendeeCents, setPerAttendeeCents] = useState(0);
  const [isAllInclusive, setIsAllInclusive] = useState(false);

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              className="w-40"
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value)}
            >
              {PRICING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Base price (cents)</Label>
            <Input type="number" value={basePriceCents} onChange={(e) => setBasePriceCents(Number(e.target.value))} />
          </div>
          {pricingType === 'Table' ? (
            <>
              <div className="space-y-1">
                <Label>Per attendee (cents)</Label>
                <Input
                  type="number"
                  value={perAttendeeCents}
                  disabled={isAllInclusive}
                  onChange={(e) => setPerAttendeeCents(Number(e.target.value))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAllInclusive}
                  onChange={(e) => setIsAllInclusive(e.target.checked)}
                />
                All-inclusive (flat)
              </label>
            </>
          ) : null}
          <Button
            size="sm"
            onClick={() =>
              guard(() =>
                createPrice({
                  eventsId,
                  name,
                  pricingType,
                  basePriceCents,
                  perAttendeeCents: pricingType === 'Table' && !isAllInclusive ? perAttendeeCents : 0,
                  isAllInclusive: pricingType === 'Table' ? isAllInclusive : false,
                  feeFormulasId: '',
                  parentPricesId: '',
                  maxQuantity: 0,
                }).then(() => {
                  setName('');
                  setBasePriceCents(0);
                  setPerAttendeeCents(0);
                  setIsAllInclusive(false);
                  prices.reload();
                }),
              )
            }
          >
            Add price
          </Button>
        </div>

        <div className="space-y-3">
          {(prices.data ?? []).map((price) => (
            <PriceRow key={price.pricesId} price={price} onChanged={prices.reload} onError={setNotice} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PriceRow({
  price,
  onChanged,
  onError,
}: {
  price: Price;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const rulesLoader = useCallback(() => listPriceRules(price.pricesId), [price.pricesId]);
  const rules = useAsync(rulesLoader);
  const [seats, setSeats] = useState(price.pricingType === 'Table' ? 4 : 1);
  const [at, setAt] = useState('');
  const [preview, setPreview] = useState<PriceBreakdown | null>(null);

  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('Presale');
  const [rulePrice, setRulePrice] = useState(0);
  const [priority, setPriority] = useState(10);
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');

  async function guard(action: () => Promise<void>) {
    try {
      await action();
    } catch (caught) {
      onError(rpcErrorMessage(caught));
    }
  }

  const toEpoch = (local: string) => (local ? String(Math.floor(new Date(local).getTime() / 1000)) : '0');

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">{price.name}</span>{' '}
          <span className="text-muted-foreground">
            · {price.pricingType} · {centsToUSD(price.basePriceCents)}
            {price.pricingType === 'Table'
              ? price.isAllInclusive
                ? ' (all-inclusive)'
                : ` + ${centsToUSD(price.perAttendeeCents)}/attendee`
              : ''}
            {price.isActive ? '' : ' · inactive'}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => guard(() => deletePrice(price.pricesId).then(onChanged))}>
          Remove
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label>Seats</Label>
          <Input className="w-20" type="number" value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>At (rule preview)</Label>
          <Input className="w-44" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => guard(() => calculatePrice(price.pricesId, seats, toEpoch(at)).then(setPreview))}
        >
          Calculate
        </Button>
        {preview ? (
          <p className="text-sm text-muted-foreground">
            {at ? `At ${new Date(at).toLocaleString()} · ` : 'Now · '}
            Subtotal {centsToUSD(preview.subtotalCents)} · Fee {centsToUSD(preview.feeCents)} · Buyer pays{' '}
            <span className="font-medium">{centsToUSD(preview.totalCents)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 border-t pt-2">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Rules (highest priority active rule wins)</p>
        {(rules.data ?? []).map((rule: PriceRule) => (
          <div key={rule.priceRulesId} className="flex items-center justify-between py-0.5 text-sm">
            <span>
              [{rule.priority}] {rule.name} · {rule.ruleType} · {centsToUSD(rule.priceCents)}
              {rule.isActive ? '' : ' · off'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => guard(() => deletePriceRule(rule.priceRulesId).then(rules.reload))}
            >
              ✕
            </Button>
          </div>
        ))}
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label>Rule name</Label>
            <Input className="w-32" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              className="w-36"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
            >
              {['Presale', 'LastMinute', 'TimeWindow', 'Dynamic'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Priority</Label>
            <Input className="w-20" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Price (cents)</Label>
            <Input className="w-28" type="number" value={rulePrice} onChange={(e) => setRulePrice(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input className="w-44" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Until</Label>
            <Input className="w-44" type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
          </div>
          <Button
            size="sm"
            onClick={() =>
              guard(() =>
                createPriceRule({
                  pricesId: price.pricesId,
                  name: ruleName,
                  ruleType,
                  priority,
                  priceCents: rulePrice,
                  activeFrom: toEpoch(from),
                  activeUntil: toEpoch(until),
                  minRemaining: -1,
                  maxRemaining: -1,
                }).then(() => {
                  setRuleName('');
                  setRulePrice(0);
                  setFrom('');
                  setUntil('');
                  rules.reload();
                }),
              )
            }
          >
            Add rule
          </Button>
        </div>
      </div>
    </div>
  );
}
