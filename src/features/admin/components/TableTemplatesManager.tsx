import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listTableTemplates,
  createTableTemplate,
  deleteTableTemplate,
} from '@/features/admin/services/tableTemplateService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'];

/**
 * Catalog surface for reusable table TYPES (table templates). Each carries one base
 * price only — price rules are defined per event against the event's price, not
 * here. Events reuse these types and override values.
 */
export function TableTemplatesManager() {
  const loader = useCallback(() => listTableTemplates(), []);
  const templates = useAsync(loader);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [shape, setShape] = useState('Round');
  const [priceCents, setPriceCents] = useState(0);
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(80);

  async function guard(action: () => Promise<void>) {
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setNotice(rpcErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table types (catalog)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice ? <p className="text-sm text-amber-foreground">{notice}</p> : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input className="w-20" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Shape</Label>
            <select
              className="h-9 rounded-md border border-input px-2 text-sm"
              value={shape}
              onChange={(e) => setShape(e.target.value)}
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Base price (cents)</Label>
            <Input className="w-28" type="number" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Width (px)</Label>
            <Input className="w-20" type="number" min={20} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Height (px)</Label>
            <Input className="w-20" type="number" min={20} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
          <Button
            size="sm"
            onClick={() =>
              guard(() =>
                createTableTemplate({
                  name,
                  defaultCapacity: capacity,
                  defaultShape: shape,
                  defaultColor: '',
                  defaultPriceCents: priceCents,
                  defaultWidth: Math.max(20, width),
                  defaultHeight: Math.max(20, height),
                }).then(() => {
                  setName('');
                  setCapacity(8);
                  setPriceCents(0);
                  setWidth(80);
                  setHeight(80);
                  templates.reload();
                }),
              )
            }
          >
            Add table type
          </Button>
        </div>

        <div className="space-y-1">
          {(templates.data ?? []).map((template) => (
            <div key={template.tableTemplatesId} className="flex items-center justify-between border-b py-1 text-sm">
              <span>
                <span className="font-medium">{template.name}</span>{' '}
                <span className="text-muted-foreground">
                  · {template.defaultShape} · cap {template.defaultCapacity} · {template.defaultWidth}×{template.defaultHeight}px · {centsToUSD(template.defaultPriceCents)}
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => guard(() => deleteTableTemplate(template.tableTemplatesId).then(templates.reload))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
