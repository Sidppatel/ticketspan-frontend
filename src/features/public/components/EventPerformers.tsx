import { Mic2 } from 'lucide-react';
import { CatalogLinkSection } from './CatalogLinkSection';
import { parseCatalogLinks } from './catalogJson';

export function EventPerformers({ performersJson }: { performersJson: string }) {
  return (
    <CatalogLinkSection
      title="Performers"
      icon={Mic2}
      links={parseCatalogLinks(performersJson, 'performerId')}
      hrefBase="/performers"
      subtitleKeys={['role', 'genre']}
    />
  );
}
