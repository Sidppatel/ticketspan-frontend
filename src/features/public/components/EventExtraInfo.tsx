import { Info } from 'lucide-react';
import { parseMeta, publicMeta } from './catalogJson';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EventExtraInfo({ extraInfoJson }: { extraInfoJson: string }) {
  const items = publicMeta(parseMeta(extraInfoJson));
  if (items.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-4">
          <Info />
        </span>
        <CardTitle>Good to know</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {items.map((item) => (
            <div key={item.key} className="grid grid-cols-3 gap-3 py-2 text-sm">
              <dt className="font-medium text-muted-foreground">{humanize(item.key)}</dt>
              <dd className="col-span-2 whitespace-pre-wrap text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
