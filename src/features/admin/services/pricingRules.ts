import type { Price, PriceRule } from '@/shared/proto/pricing';

export interface RuleGroup {
  key: string;
  name: string;
  ruleType: string;
  activeFrom: string;
  activeUntil: string;
  percent: number;
  priceRuleIds: string[];
  rules: PriceRule[];
}

export function discountedCents(baseCents: number, percent: number): number {
  return Math.round(baseCents * (1 - percent / 100));
}

export function derivePercent(baseCents: number, ruleCents: number): number {
  if (baseCents <= 0) {
    return 0;
  }
  return Math.round((1 - ruleCents / baseCents) * 100);
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function isWindowActive(activeFrom: string, activeUntil: string, now: number): boolean {
  const from = Number(activeFrom);
  const until = Number(activeUntil);
  if (from && now < from) {
    return false;
  }
  if (until && now > until) {
    return false;
  }
  return Boolean(from || until);
}

export function windowProgress(activeFrom: string, activeUntil: string, now: number): number {
  const from = Number(activeFrom);
  const until = Number(activeUntil);
  if (!from || !until || until <= from) {
    return 0;
  }
  const ratio = (now - from) / (until - from);
  return Math.min(100, Math.max(0, ratio * 100));
}

export function epochToLocalInput(activeAt: string): string {
  const seconds = Number(activeAt);
  if (!seconds) {
    return '';
  }
  const d = new Date(seconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ruleKey(rule: PriceRule): string {
  return [rule.name, rule.ruleType, rule.activeFrom, rule.activeUntil].join('|');
}

export function groupEventRules(prices: Price[], rules: PriceRule[]): RuleGroup[] {
  const baseById = new Map(prices.map((p) => [p.pricesId, p.basePriceCents]));
  const groups = new Map<string, RuleGroup>();
  for (const rule of rules) {
    const key = ruleKey(rule);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: rule.name,
        ruleType: rule.ruleType,
        activeFrom: rule.activeFrom,
        activeUntil: rule.activeUntil,
        percent: derivePercent(baseById.get(rule.pricesId) ?? 0, rule.priceCents),
        priceRuleIds: [],
        rules: [],
      };
      groups.set(key, group);
    }
    group.priceRuleIds.push(rule.priceRulesId);
    group.rules.push(rule);
  }
  return [...groups.values()];
}
