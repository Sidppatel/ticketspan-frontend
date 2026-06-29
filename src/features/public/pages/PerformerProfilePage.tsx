import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAsync } from '@/shared/hooks/useAsync';
import { getPerformerBySlug } from '@/features/public/services/publicCatalogService';
import { CatalogProfile } from '@/features/public/components/CatalogProfile';
import { Seo } from '@/shared/components/Seo';
import { imageUrl } from '@/shared/upload';
import { metaValue, parseMeta } from '@/features/public/components/catalogJson';

export function PerformerProfilePage() {
  const { slug = '' } = useParams();
  const loader = useCallback(() => getPerformerBySlug(slug), [slug]);
  const { data, loading, error } = useAsync(loader);

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error || !data) {
    return <p className="text-destructive">{error ?? 'Performer not found.'}</p>;
  }

  return (
    <>
      <Seo
        title={data.name}
        description={metaValue(parseMeta(data.metaJson), 'description')}
        image={data.primaryImagePath ? imageUrl(data.primaryImagePath) : undefined}
      />
      <CatalogProfile
        name={data.name}
        primaryImagePath={data.primaryImagePath}
        metaJson={data.metaJson}
        events={data.events}
      />
    </>
  );
}
