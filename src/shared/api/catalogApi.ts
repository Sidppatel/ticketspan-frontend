import { httpGet } from './httpClient';
import type {
  ApiEnvelope,
  PagedEnvelope,
  PerformerDto,
  PublicPerformerDto,
  PublicSponsorDto,
  SponsorDto,
  VenueDto,
} from './types';

export interface CatalogPaginationParams {
  offset?: number;
  limit?: number;
  search?: string;
}

export const catalogApi = {
  getVenues(params?: CatalogPaginationParams): Promise<PagedEnvelope<VenueDto>> {
    return httpGet<PagedEnvelope<VenueDto>>('/api/v1/catalog/venues', { params });
  },

  getVenue(id: string): Promise<ApiEnvelope<VenueDto>> {
    return httpGet<ApiEnvelope<VenueDto>>(`/api/v1/catalog/venues/${id}`);
  },

  getPerformers(params?: CatalogPaginationParams): Promise<PagedEnvelope<PerformerDto>> {
    return httpGet<PagedEnvelope<PerformerDto>>('/api/v1/catalog/performers', { params });
  },

  getPerformer(idOrSlug: string): Promise<ApiEnvelope<PublicPerformerDto>> {
    return httpGet<ApiEnvelope<PublicPerformerDto>>(`/api/v1/catalog/performers/${idOrSlug}`);
  },

  getSponsors(params?: CatalogPaginationParams): Promise<PagedEnvelope<SponsorDto>> {
    return httpGet<PagedEnvelope<SponsorDto>>('/api/v1/catalog/sponsors', { params });
  },

  getSponsor(idOrSlug: string): Promise<ApiEnvelope<PublicSponsorDto>> {
    return httpGet<ApiEnvelope<PublicSponsorDto>>(`/api/v1/catalog/sponsors/${idOrSlug}`);
  },
};
