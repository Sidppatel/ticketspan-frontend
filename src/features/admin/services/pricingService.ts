import { pricingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Price, PriceRule, PriceBreakdown } from '@/shared/proto/pricing';

export interface PriceInput {
  eventsId: string;
  name: string;
  pricingType: string; // TicketTier | Table | AddOn
  basePriceCents: number;
  perAttendeeCents: number;
  isAllInclusive: boolean;
  feeFormulasId: string; // honored only for developers
  parentPricesId: string;
  maxQuantity: number;
}

export interface PriceRuleInput {
  pricesId: string;
  name: string;
  ruleType: string; // Presale | LastMinute | TimeWindow | Dynamic
  priority: number;
  priceCents: number;
  activeFrom: string; // unix seconds; '0' = unset
  activeUntil: string;
  minRemaining: number; // -1 = unset
  maxRemaining: number;
  capacity: number; // people/seats the discount applies to; 0 = no cap
}

export async function createPrice(input: PriceInput): Promise<string> {
  const res = await callRpc(() => pricingClient.createPrice(input));
  return res.value;
}

export async function updatePrice(input: {
  pricesId: string;
  name: string;
  basePriceCents: number;
  perAttendeeCents: number;
  isAllInclusive: boolean;
  maxQuantity: number;
  isActive: boolean;
  feeFormulasId: string;
}): Promise<void> {
  await callRpc(() => pricingClient.updatePrice(input));
}

export async function getPrice(pricesId: string): Promise<Price> {
  return callRpc(() => pricingClient.getPrice({ value: pricesId }));
}

export async function listPricesForEvent(eventsId: string): Promise<Price[]> {
  const res = await callRpc(() => pricingClient.listPricesForEvent({ value: eventsId }));
  return res.prices;
}

export async function deletePrice(pricesId: string): Promise<void> {
  await callRpc(() => pricingClient.deletePrice({ value: pricesId }));
}

export async function createPriceRule(input: PriceRuleInput): Promise<string> {
  // Proto renamed prices_id → owner_id + scope. This service only creates
  // per-price rules, so owner_id = pricesId and scope = 'Price'.
  const { pricesId, ...rest } = input;
  const res = await callRpc(() =>
    pricingClient.createPriceRule({ ...rest, ownerId: pricesId, scope: 'Price' }),
  );
  return res.value;
}

export async function updatePriceRule(input: PriceRuleInput & { priceRulesId: string; isActive: boolean }): Promise<void> {
  await callRpc(() => pricingClient.updatePriceRule(input));
}

export async function deletePriceRule(priceRulesId: string): Promise<void> {
  await callRpc(() => pricingClient.deletePriceRule({ value: priceRulesId }));
}

export async function listPriceRules(pricesId: string): Promise<PriceRule[]> {
  const res = await callRpc(() => pricingClient.listPriceRules({ value: pricesId }));
  return res.rules;
}

export async function calculatePrice(
  pricesId: string,
  seats: number,
  at = '0',
  remaining = -1,
): Promise<PriceBreakdown> {
  return callRpc(() => pricingClient.calculatePrice({ pricesId, seats, at, remaining }));
}

export async function setTenantDefaultFeeFormula(tenantsId: string, feeFormulasId: string): Promise<void> {
  await callRpc(() => pricingClient.setTenantDefaultFeeFormula({ tenantsId, feeFormulasId }));
}
