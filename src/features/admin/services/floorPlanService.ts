import { floorPlanClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { FloorPlanTemplate } from '@/shared/proto/floorplan';

export async function saveAsTemplate(eventsId: string, name: string): Promise<string> {
  const res = await callRpc(() => floorPlanClient.saveAsTemplate({ eventsId, name }));
  return res.value;
}

export async function listFloorPlanTemplates(): Promise<FloorPlanTemplate[]> {
  const res = await callRpc(() => floorPlanClient.listFloorPlanTemplates({}));
  return res.templates;
}

export async function applyTemplate(floorPlanTemplatesId: string, eventsId: string): Promise<void> {
  await callRpc(() => floorPlanClient.applyTemplate({ floorPlanTemplatesId, eventsId }));
}

export async function deleteFloorPlanTemplate(floorPlanTemplatesId: string): Promise<void> {
  await callRpc(() => floorPlanClient.deleteFloorPlanTemplate({ value: floorPlanTemplatesId }));
}
