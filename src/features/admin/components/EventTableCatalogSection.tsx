import { useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { centsToUSD, centsToUsdInput, usdToCents } from '@/shared/lib/format';
import { addCents } from '@/shared/lib/math';
import { createEventTable, deleteEventTable } from '@/features/admin/services/eventAdminService';
import { createTableTemplate } from '@/features/admin/services/tableTemplateService';
import { CreateTableTemplateModal } from '@/features/admin/components/CreateTableTemplateModal';
import { FloorPlanPanel } from '@/features/admin/components/FloorPlanPanel';
import type { TableTemplate, EventTableType } from '@/shared/proto/booking';

interface EventTableCatalogSectionProps {
  eventsId: string;
  templateList: TableTemplate[];
  typeList: EventTableType[];
  lockedTypeIds: Set<string>;
  templatesReload: () => void;
  tableTypesReload: () => void;
  statsReload: () => void;
  guard: (action: () => Promise<unknown>, onSuccess?: () => void) => void;
  pricingKeyInc: () => void;
}

export function EventTableCatalogSection({
  eventsId,
  templateList,
  typeList,
  lockedTypeIds,
  templatesReload,
  tableTypesReload,
  statsReload,
  guard,
  pricingKeyInc,
}: EventTableCatalogSectionProps) {
  const [tableTemplateId, setTableTemplateId] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableColor, setTableColor] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tablePriceCents, setTablePriceCents] = useState(0);
  const [tableWidth, setTableWidth] = useState(120);
  const [tableHeight, setTableHeight] = useState(80);
  const [tableIsAllInclusive, setTableIsAllInclusive] = useState(true);
  const [tablePerAttendeeCents, setTablePerAttendeeCents] = useState(0);
  const [floorKey, setFloorKey] = useState(0);

  const [isCreateTableTemplateOpen, setIsCreateTableTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateColor, setNewTemplateColor] = useState('#6366f1');
  const [newTemplateShape, setNewTemplateShape] = useState<'Round' | 'Square' | 'Rectangle' | 'Cocktail'>('Rectangle');
  const [newTemplateCapacity, setNewTemplateCapacity] = useState(4);
  const [newTemplatePriceUsd, setNewTemplatePriceUsd] = useState('100.00');
  const [newTemplateWidth, setNewTemplateWidth] = useState(120);
  const [newTemplateHeight, setNewTemplateHeight] = useState(80);
  const [newTemplateAllInclusive, setNewTemplateAllInclusive] = useState(true);
  const [newTemplateError, setNewTemplateError] = useState<string | null>(null);
  const [newTemplateSubmitting, setNewTemplateSubmitting] = useState(false);

  function selectTemplate(id: string) {
    setTableTemplateId(id);
    const tmpl = templateList.find((t) => t.tableTemplatesId === id);
    if (!tmpl) {
      setTableLabel('');
      setTableColor('');
      setTableCapacity(4);
      setTablePriceCents(0);
      setTableWidth(120);
      setTableHeight(80);
      setTableIsAllInclusive(true);
      setTablePerAttendeeCents(0);
      return;
    }
    setTableLabel(tmpl.name);
    setTableColor(tmpl.defaultColor || '#6366f1');
    setTableCapacity(tmpl.defaultCapacity);
    setTablePriceCents(tmpl.defaultPriceCents);
    setTableWidth(tmpl.defaultWidth || 120);
    setTableHeight(tmpl.defaultHeight || 80);
    setTableIsAllInclusive(tmpl.defaultIsAllInclusive);
    setTablePerAttendeeCents(0);
  }

  async function handleCreateTableTemplate() {
    if (!newTemplateName.trim()) {
      setNewTemplateError('Template name is required');
      return;
    }
    setNewTemplateSubmitting(true);
    setNewTemplateError(null);
    try {
      const createdId = await createTableTemplate({
        name: newTemplateName.trim(),
        defaultColor: newTemplateColor,
        defaultShape: newTemplateShape,
        defaultCapacity: newTemplateCapacity,
        defaultPriceCents: usdToCents(newTemplatePriceUsd),
        defaultWidth: newTemplateWidth,
        defaultHeight: newTemplateHeight,
        defaultIsAllInclusive: newTemplateAllInclusive,
      });
      templatesReload();
      selectTemplate(createdId);
      setIsCreateTableTemplateOpen(false);
      setNewTemplateName('');
    } catch (err: unknown) {
      setNewTemplateError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setNewTemplateSubmitting(false);
    }
  }

  return (
    <>
      <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 px-6 py-4">
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <LayoutGrid className="h-4.5 w-4.5 text-primary" /> Table Catalog & Seating Specs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-wrap items-end gap-3 p-4 border border-border/50 bg-muted/20 rounded-xl">
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between gap-2 min-w-[12rem]">
                <Label className="text-[10px]">Table Type</Label>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateTableTemplateOpen(true)}
                  className="h-auto p-0 text-[10px] font-bold text-primary flex items-center gap-0.5 hover:bg-transparent hover:text-primary"
                >
                  <Plus className="h-3 w-3" /> Create New
                </Button>
              </div>
              <Select
                className="h-9 w-48 text-xs bg-background"
                value={tableTemplateId}
                onChange={(e) => selectTemplate(e.target.value)}
              >
                <option value="">— select —</option>
                {templateList.map((t) => (
                  <option key={t.tableTemplatesId} value={t.tableTemplatesId}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Table Name</Label>
              <Input className="h-9 w-32 text-xs bg-background" value={tableLabel} disabled readOnly />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Color</Label>
              <span
                className="flex h-9 w-14 items-center justify-center rounded-md border border-input bg-background"
                title="Inherited from catalog table type"
              >
                <span className="size-5 rounded-sm" style={{ backgroundColor: tableColor || 'transparent' }} />
              </span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Capacity</Label>
              <Input
                type="number"
                className="h-9 w-20 text-xs bg-background"
                disabled={!tableTemplateId}
                value={tableCapacity}
                onChange={(e) => setTableCapacity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Price (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-9 w-28 text-xs bg-background"
                disabled={!tableTemplateId}
                value={centsToUsdInput(tablePriceCents)}
                onChange={(e) => setTablePriceCents(usdToCents(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Width (px)</Label>
              <Input className="h-9 w-20 text-xs bg-background" type="number" value={tableWidth} disabled readOnly />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Height (px)</Label>
              <Input className="h-9 w-20 text-xs bg-background" type="number" value={tableHeight} disabled readOnly />
            </div>
            <div className="flex items-center h-9 px-2 text-xs font-semibold text-muted-foreground">
              <input type="checkbox" className="mr-2" checked={tableIsAllInclusive} disabled readOnly />
              All-inclusive
            </div>
            <Button
              size="sm"
              disabled={!tableTemplateId}
              className="ticketspan-spring-btn h-9 px-4 rounded-lg font-bold text-xs"
              onClick={() =>
                guard(
                  () =>
                    createEventTable({
                      eventsId,
                      label: tableLabel,
                      capacity: tableCapacity,
                      shape: '',
                      color: tableColor,
                      priceCents: tablePriceCents,
                      feeFormulasId: '',
                      isAllInclusive: tableIsAllInclusive,
                      perAttendeeCents: tablePerAttendeeCents,
                      tableTemplatesId: tableTemplateId,
                      width: tableWidth,
                      height: tableHeight,
                    }).then(() => {
                      setTableTemplateId('');
                      setTableLabel('');
                      setTableColor('');
                      setFloorKey((k) => k + 1);
                      pricingKeyInc();
                    }),
                  tableTypesReload,
                )
              }
            >
              Add table
            </Button>
          </div>
          <div className="space-y-2">
            {typeList.map((type: EventTableType) => (
              <div key={type.eventTablesId} className="flex items-center justify-between border border-border/50 bg-card rounded-lg px-4 py-3 shadow-sm">
                <span className="flex items-center gap-3">
                  <span className="inline-block size-4 rounded shadow-sm border border-black/10" style={{ backgroundColor: type.color }} />
                  <span className="font-bold text-sm">{type.label}</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{centsToUSD(type.priceCents)}</span>
                  {type.platformFeeCents > 0 ? (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      + fee {centsToUSD(type.platformFeeCents)} ={' '}
                      <span className="text-foreground">{centsToUSD(addCents(type.priceCents, type.platformFeeCents))}</span>
                    </span>
                  ) : null}
                  {lockedTypeIds.has(type.eventTablesId) ? (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">🔒 In use</span>
                  ) : null}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={lockedTypeIds.has(type.eventTablesId)}
                  title={lockedTypeIds.has(type.eventTablesId) ? 'Has sold or held tables — can’t be removed' : undefined}
                  onClick={() =>
                    guard(
                      () =>
                        deleteEventTable(type.eventTablesId).then(() => {
                          setFloorKey((k) => k + 1);
                          pricingKeyInc();
                        }),
                      tableTypesReload,
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FloorPlanPanel
        key={`floor-${floorKey}`}
        eventsId={eventsId}
        onTypesChanged={pricingKeyInc}
        onLayoutSaved={() => {
          tableTypesReload();
          statsReload();
        }}
      />

      <CreateTableTemplateModal
        isOpen={isCreateTableTemplateOpen}
        onOpenChange={setIsCreateTableTemplateOpen}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        newTemplateColor={newTemplateColor}
        setNewTemplateColor={setNewTemplateColor}
        newTemplateShape={newTemplateShape}
        setNewTemplateShape={(v) => setNewTemplateShape(v as 'Round' | 'Square' | 'Rectangle' | 'Cocktail')}
        newTemplateCapacity={newTemplateCapacity}
        setNewTemplateCapacity={setNewTemplateCapacity}
        newTemplatePriceUsd={newTemplatePriceUsd}
        setNewTemplatePriceUsd={setNewTemplatePriceUsd}
        newTemplateWidth={newTemplateWidth}
        setNewTemplateWidth={setNewTemplateWidth}
        newTemplateHeight={newTemplateHeight}
        setNewTemplateHeight={setNewTemplateHeight}
        newTemplateAllInclusive={newTemplateAllInclusive}
        setNewTemplateAllInclusive={setNewTemplateAllInclusive}
        newTemplateError={newTemplateError}
        setNewTemplateError={setNewTemplateError}
        newTemplateSubmitting={newTemplateSubmitting}
        handleCreateTableTemplate={handleCreateTableTemplate}
      />
    </>
  );
}
