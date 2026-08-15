import { CatalogEntityManager } from '@/features/admin/components/CatalogEntityManager';
import { listPerformers, createPerformer, updatePerformer, deletePerformer } from '@/features/admin/services/catalogService';
import type { Performer } from '@/shared/proto/catalog';

const PERFORMER_KEYS = ['genre', 'role', 'notes', 'website', 'booking_link', 'instagram', 'twitter', 'facebook', 'youtube'];

export function AdminPerformersPage() {
  return (
    <CatalogEntityManager<Performer>
      title="Performers"
      entityType="performer"
      suggestedKeys={PERFORMER_KEYS}
      aspectRatio="1:1"
      load={listPerformers}
      create={createPerformer}
      update={updatePerformer}
      remove={deletePerformer}
      idOf={(item) => item.performersId}
    />
  );
}
