import { FloorPlanBuilder } from '@/features/admin/components/FloorPlanBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function FloorPlanPanel({
  eventsId,
  onTypesChanged,
  onLayoutSaved,
}: {
  eventsId: string;
  onTypesChanged?: () => void;
  onLayoutSaved?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Floor plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FloorPlanBuilder eventsId={eventsId} onTypesChanged={onTypesChanged} onLayoutSaved={onLayoutSaved} />
      </CardContent>
    </Card>
  );
}
