import { performerClient, sponsorClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { PublicPerformer, PublicSponsor } from '@/shared/proto/catalog';

export async function getPerformerBySlug(slug: string): Promise<PublicPerformer> {
  return callRpc(() => performerClient.getPerformerBySlug({ slug }));
}

export async function getSponsorBySlug(slug: string): Promise<PublicSponsor> {
  return callRpc(() => sponsorClient.getSponsorBySlug({ slug }));
}
