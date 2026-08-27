import { tableBookingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { TableTemplate, TableTemplatePriceRule } from '@/shared/proto/booking';

export interface TableTemplateInput {
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor: string;
  defaultPriceCents: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultIsAllInclusive: boolean;
}

export interface TableTemplateEdit {
  tableTemplatesId: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor: string;
  defaultPriceCents: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultIsAllInclusive: boolean;
  isActive: boolean;
}

export interface TableTemplatePriceRuleInput {
  tableTemplatesId: string;
  name: string;
  ruleType: string;
  priority: number;
  priceCents: number;
  activeFrom: string;
  activeUntil: string;
  minRemaining: number;
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

export async function updateTableTemplate(input: TableTemplateEdit): Promise<void> {
  await callRpc(() => tableBookingClient.updateTableTemplate(input));
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
