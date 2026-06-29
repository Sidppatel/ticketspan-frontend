import { Award } from 'lucide-react';
import { CatalogLinkSection } from './CatalogLinkSection';
import { parseCatalogLinks } from './catalogJson';

export function EventSponsors({ sponsorsJson }: { sponsorsJson: string }) {
  return (
    <CatalogLinkSection
      title="Sponsors"
      icon={Award}
      links={parseCatalogLinks(sponsorsJson, 'sponsorId')}
      hrefBase="/sponsors"
      subtitleKeys={['tier', 'category']}
    />
  );
}
