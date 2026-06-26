import { tableBookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { TableTemplate, TableTemplatePriceRule } from '@/shared/proto/booking';

export interface TableTemplateInput {
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor: string;
  defaultPriceCents: number;
  defaultRowSpan: number;
  defaultColSpan: number;
}

export interface TableTemplatePriceRuleInput {
  tableTemplatesId: string;
  name: string;
  ruleType: string; // Presale | LastMinute | TimeWindow | Dynamic
  priority: number;
  priceCents: number;
  activeFrom: string; // unix seconds; '0' = unset
  activeUntil: string;
  minRemaining: number; // -1 = unset
  maxRemaining: number;
}

export async function listTableTemplates(): Promise<TableTemplate[]> {
  const res = await callRpc(() => tableBookingClient.listTableTemplates({}));
  return res.templates;
}

export async function createTableTemplate(input: TableTemplateInput): Promise<string> {
  const res = await callRpc(() => tableBookingClient.createTableTemplate(input));
  return res.value;
}

export async function deleteTableTemplate(tableTemplatesId: string): Promise<void> {
  await callRpc(() => tableBookingClient.deleteTableTemplate({ value: tableTemplatesId }));
}

export async function listTableTemplatePriceRules(tableTemplatesId: string): Promise<TableTemplatePriceRule[]> {
  const res = await callRpc(() => tableBookingClient.listTableTemplatePriceRules({ value: tableTemplatesId }));
  return res.rules;
}

export async function createTableTemplatePriceRule(input: TableTemplatePriceRuleInput): Promise<string> {
  const res = await callRpc(() => tableBookingClient.createTableTemplatePriceRule(input));
  return res.value;
}

export async function deleteTableTemplatePriceRule(tableTemplatePriceRulesId: string): Promise<void> {
  await callRpc(() => tableBookingClient.deleteTableTemplatePriceRule({ value: tableTemplatePriceRulesId }));
}
