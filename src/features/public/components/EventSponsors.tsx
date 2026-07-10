import { Award } from 'lucide-react';
import { CatalogLinkSection } from './CatalogLinkSection';
import { parseCatalogLinks } from './catalogJson';

export function EventSponsors({ sponsorsJson }: { sponsorsJson: string }) {
  const links = parseCatalogLinks(sponsorsJson, 'sponsorId');
  if (links.length === 0) return null;
  
  return (
    <div className="pt-6">
      <CatalogLinkSection
        title="Sponsors"
        icon={Award}
        links={links}
        hrefBase="/sponsors"
        subtitleKeys={['tier', 'category']}
      />
    </div>
  );
}
