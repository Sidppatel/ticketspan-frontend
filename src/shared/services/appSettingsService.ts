import { eventClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { PublicAppSettings } from '@/shared/proto/event';

export async function getPublicAppSettings(): Promise<PublicAppSettings> {
  return callRpc(() => eventClient.getPublicAppSettings({}));
}
