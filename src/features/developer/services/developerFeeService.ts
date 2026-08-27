import { feeClient, pricingClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { FeeFormula, DeveloperEvent } from '@/shared/proto/fees';

export type { FeeFormula, DeveloperEvent };

export async function listFeeFormulas(): Promise<FeeFormula[]> {
  const response = await callRpc(() => feeClient.listFeeFormulas({}));
  return response.formulas;
}

export interface FeeFormulaInput {
  name: string;
  percentBps: number;
  flatCents: number;
  maxFeeCents: number;
}

export async function createFeeFormula(input: FeeFormulaInput): Promise<string> {
  const response = await callRpc(() => feeClient.createFeeFormula(input));
  return response.value;
}

export async function updateFeeFormula(formula: FeeFormula): Promise<void> {
  await callRpc(() => feeClient.updateFeeFormula(formula));
}

export async function deleteFeeFormula(feeFormulasId: string): Promise<void> {
  await callRpc(() => feeClient.deleteFeeFormula({ value: feeFormulasId }));
}

export async function listAllEvents(): Promise<DeveloperEvent[]> {
  const response = await callRpc(() => feeClient.listAllEvents({}));
  return response.events;
}

export async function assignFeeFormula(
  kind: 'ticket' | 'table',
  targetId: string,
  feeFormulasId: string,
  reason: string,
): Promise<void> {
  await callRpc(() => feeClient.assignFeeFormula({ kind, targetId, feeFormulasId, reason }));
}

export async function setTenantDefaultFeeFormula(
  tenantsId: string,
  feeFormulasId: string,
  reason: string,
): Promise<void> {
  await callRpc(() => pricingClient.setTenantDefaultFeeFormula({ tenantsId, feeFormulasId, reason }));
}

export function previewFee(priceCents: number, formula: FeeFormula | undefined): number {
  if (!formula) return 0;
  let fee = Math.round((priceCents * formula.percentBps) / 10000) + formula.flatCents;
  if (formula.maxFeeCents > 0 && fee > formula.maxFeeCents) fee = formula.maxFeeCents;
  return Math.max(0, fee);
}
