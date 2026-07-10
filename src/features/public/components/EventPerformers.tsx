import { Mic2 } from 'lucide-react';
import { CatalogLinkSection } from './CatalogLinkSection';
import { parseCatalogLinks } from './catalogJson';

export function EventPerformers({ performersJson }: { performersJson: string }) {
  const links = parseCatalogLinks(performersJson, 'performerId');
  if (links.length === 0) return null;

  return (
    <div className="pt-6">
      <CatalogLinkSection
        title="Performers"
        icon={Mic2}
        links={links}
        hrefBase="/performers"
        subtitleKeys={['role', 'genre']}
      />
    </div>
  );
}
