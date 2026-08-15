import { CatalogEntityManager } from '@/features/admin/components/CatalogEntityManager';
import { listSponsors, createSponsor, updateSponsor, deleteSponsor } from '@/features/admin/services/catalogService';
import type { Sponsor } from '@/shared/proto/catalog';

const SPONSOR_KEYS = ['tier', 'category', 'notes', 'website', 'instagram', 'twitter', 'facebook', 'linkedin'];

export function AdminSponsorsPage() {
  return (
    <CatalogEntityManager<Sponsor>
      title="Sponsors"
      entityType="sponsor"
      suggestedKeys={SPONSOR_KEYS}
      aspectRatio="1:1"
      load={listSponsors}
      create={createSponsor}
      update={updateSponsor}
      remove={deleteSponsor}
      idOf={(item) => item.sponsorsId}
    />
  );
}
