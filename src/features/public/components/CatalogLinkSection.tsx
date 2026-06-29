import { Link } from 'react-router-dom';
import { imageUrl } from '@/shared/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { metaValue, type CatalogLink } from './catalogJson';
import type { LucideIcon } from 'lucide-react';

export function CatalogLinkSection({
  title,
  icon: Icon,
  links,
  hrefBase,
  subtitleKeys,
}: {
  title: string;
  icon: LucideIcon;
  links: CatalogLink[];
  hrefBase: string;
  subtitleKeys: string[];
}) {
  if (links.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <Icon />
        </span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {links.map((link) => {
            const subtitle = subtitleKeys.map((key) => metaValue(link.meta, key)).find(Boolean);
            return (
              <Link
                key={link.id}
                to={`${hrefBase}/${link.slug}`}
                className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card interactive className="h-full overflow-hidden">
                  {link.primaryImagePath ? (
                    <img
                      src={imageUrl(link.primaryImagePath)}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-muted" />
                  )}
                  <CardContent className="space-y-0.5 py-3">
                    <p className="truncate font-medium transition-colors group-hover:text-primary">
                      {link.name}
                    </p>
                    {subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
