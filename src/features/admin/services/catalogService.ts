import { venueClient, performerClient, sponsorClient } from '@/shared/apiClient';
import { callRpc } from '@/shared/session';
import type { Venue, Performer, Sponsor } from '@/shared/proto/catalog';

const page = { offset: 0, limit: 100, search: '' };

export async function listVenues(): Promise<Venue[]> {
  const response = await callRpc(() => venueClient.listVenues(page));
  return response.venues;
}

export async function getVenue(venuesId: string): Promise<Venue> {
  return callRpc(() => venueClient.getVenue({ value: venuesId }));
}

export interface VenueDraft {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  zip: string;
}

export async function createVenue(draft: VenueDraft): Promise<string> {
  const response = await callRpc(() =>
    venueClient.createVenue({
      name: draft.name,
      description: draft.description,
      imagePath: '',
      phone: draft.phone,
      email: draft.email,
      website: draft.website,
      line1: '',
      line2: '',
      city: draft.city,
      state: draft.state,
      zip: draft.zip,
    }),
  );
  return response.value;
}

export async function listPerformers(): Promise<Performer[]> {
  const response = await callRpc(() => performerClient.listPerformers(page));
  return response.performers;
}

export async function createPerformer(name: string, slug: string): Promise<string> {
  const response = await callRpc(() =>
    performerClient.createPerformer({ name, slug, imagePath: '', metaJson: '{}' }),
  );
  return response.value;
}

export async function deletePerformer(performersId: string): Promise<void> {
  await callRpc(() => performerClient.deletePerformer({ value: performersId }));
}

export async function listSponsors(): Promise<Sponsor[]> {
  const response = await callRpc(() => sponsorClient.listSponsors(page));
  return response.sponsors;
}

export async function createSponsor(name: string, slug: string): Promise<string> {
  const response = await callRpc(() =>
    sponsorClient.createSponsor({ name, slug, imagePath: '', metaJson: '{}' }),
  );
  return response.value;
}

export async function deleteSponsor(sponsorsId: string): Promise<void> {
  await callRpc(() => sponsorClient.deleteSponsor({ value: sponsorsId }));
}
