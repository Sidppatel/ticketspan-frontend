import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listVenues,
  createVenue,
  listPerformers,
  createPerformer,
  deletePerformer,
  listSponsors,
  createSponsor,
  deleteSponsor,
} from '@/features/admin/services/catalogService';
import { rpcErrorMessage } from '@/shared/session';
import { TableTemplatesManager } from '@/features/admin/components/TableTemplatesManager';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Catalog</h1>
      <TableTemplatesManager />
      <VenuesSection />
      <NamedSection
        title="Performers"
        load={listPerformers}
        idOf={(item) => item.performersId}
        create={createPerformer}
        remove={deletePerformer}
      />
      <NamedSection
        title="Sponsors"
        load={listSponsors}
        idOf={(item) => item.sponsorsId}
        create={createSponsor}
        remove={deleteSponsor}
      />
    </div>
  );
}

function VenuesSection() {
  const loader = useCallback(() => listVenues(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [name, setName] = useState('');

  async function add() {
    try {
      await createVenue({ name, description: '', phone: '', email: '', website: '', city: '', state: '', zip: '' });
      setName('');
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button size="sm" onClick={add}>
            Add venue
          </Button>
        </div>
        {loading ? <p className="text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}
        {(data ?? []).map((venue) => (
          <div key={venue.venuesId} className="border-b py-1 text-sm">
            {venue.name}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface NamedItem {
  name: string;
  slug: string;
}

function NamedSection<T extends NamedItem>({
  title,
  load,
  idOf,
  create,
  remove,
}: {
  title: string;
  load: () => Promise<T[]>;
  idOf: (item: T) => string;
  create: (name: string, slug: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
}) {
  const loader = useCallback(() => load(), [load]);
  const { data, loading, error, reload } = useAsync(loader);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  async function guard(action: () => Promise<unknown>) {
    try {
      await action();
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <Button
            size="sm"
            onClick={() =>
              guard(async () => {
                await create(name, slug);
                setName('');
                setSlug('');
              })
            }
          >
            Add
          </Button>
        </div>
        {loading ? <p className="text-muted-foreground">Loading…</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}
        {(data ?? []).map((item) => (
          <div key={idOf(item)} className="flex items-center justify-between border-b py-1 text-sm">
            <span>{item.name}</span>
            <Button size="sm" variant="ghost" onClick={() => guard(() => remove(idOf(item)))}>
              Remove
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
