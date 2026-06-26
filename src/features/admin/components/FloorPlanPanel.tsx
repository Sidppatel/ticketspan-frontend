import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listFloorPlanTemplates,
  saveAsTemplate,
  applyTemplate,
  deleteFloorPlanTemplate,
} from '@/features/admin/services/floorPlanService';
import { rpcErrorMessage } from '@/shared/session';
import { FloorPlanBuilder } from '@/features/admin/components/FloorPlanBuilder';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

/**
 * Floor-plan tools: a visual grid builder (place tables + Entry/Exit/Stage
 * objects) and reusable whole-floor-plan templates.
 */
export function FloorPlanPanel({ eventsId }: { eventsId: string }) {
  const templatesLoader = useCallback(() => listFloorPlanTemplates(), []);
  const templates = useAsync(templatesLoader);
  const [notice, setNotice] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  // Bumped after a template is applied to force the builder to reload.
  const [builderKey, setBuilderKey] = useState(0);

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
        <CardTitle>Floor plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {notice ? <p className="text-sm text-amber-700">{notice}</p> : null}

        <FloorPlanBuilder key={builderKey} eventsId={eventsId} />

        <section className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium text-gray-600">Reusable templates</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label>Save current as</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={() =>
                guard(() =>
                  saveAsTemplate(eventsId, templateName).then(() => {
                    setTemplateName('');
                    templates.reload();
                  }),
                )
              }
            >
              Save template
            </Button>
          </div>
          <div className="space-y-1">
            {(templates.data ?? []).map((t) => (
              <div key={t.floorPlanTemplatesId} className="flex items-center justify-between border-b py-1 text-sm">
                <span>
                  {t.name} · {t.gridRows}×{t.gridCols} · {t.tableCount} tables · {t.objectCount} objects
                </span>
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      guard(() =>
                        applyTemplate(t.floorPlanTemplatesId, eventsId).then(() => setBuilderKey((k) => k + 1)),
                      )
                    }
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => guard(() => deleteFloorPlanTemplate(t.floorPlanTemplatesId).then(templates.reload))}
                  >
                    Delete
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
