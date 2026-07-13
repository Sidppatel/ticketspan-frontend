import type { PublicTenantBranding } from '@/shared/proto/tenant';
import type { Event, ListEventsResponse } from '@/shared/proto/event';

let cached: { slug: string; promise: Promise<PublicTenantBranding> } | null = null;

export function fetchPublicBranding(slug: string): Promise<PublicTenantBranding> {
  if (!cached || cached.slug !== slug) {
    cached = {
      slug,
      promise: import('@/shared/apiClient').then(
        ({ tenantClient }) => tenantClient.getPublicTenantBranding({ slug }).response,
      ),
    };
  }
  return cached.promise;
}

let eventCached: { slug: string; promise: Promise<Event> } | null = null;

export function prefetchPublicEventBySlug(slug: string): void {
  eventCached = {
    slug,
    promise: import('@/shared/apiClient').then(
      ({ eventClient }) => eventClient.getEventBySlug({ slug }).response,
    ),
  };
  eventCached.promise.catch(() => undefined);
}

export function takePrefetchedEventBySlug(slug: string): Promise<Event> | null {
  if (eventCached && eventCached.slug === slug) {
    const { promise } = eventCached;
    eventCached = null;
    return promise;
  }
  return null;
}

let listCached: Promise<ListEventsResponse> | null = null;

export function prefetchDefaultPublicEventList(): void {
  listCached = import('@/shared/apiClient').then(
    ({ eventClient }) =>
      eventClient.listEvents({
        page: { offset: 0, limit: 50, search: '' },
        status: 'Published',
        category: '',
      }).response,
  );
  listCached.catch(() => undefined);
}

export function takePrefetchedEventList(): Promise<ListEventsResponse> | null {
  const promise = listCached;
  listCached = null;
  return promise;
}
