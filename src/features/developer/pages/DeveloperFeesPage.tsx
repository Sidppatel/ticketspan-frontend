import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listFeeFormulas,
  createFeeFormula,
  updateFeeFormula,
  deleteFeeFormula,
  listAllEvents,
  assignFeeFormula,
  previewFee,
  type FeeFormula,
} from '@/features/developer/services/developerFeeService';
import { rpcErrorMessage } from '@/shared/session';
import { centsToUSD } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';


const EMPTY_FORM = { name: '', percent: '', flat: '', min: '', max: '' };

export function DeveloperFeesPage() {
  const formulasLoader = useCallback(() => listFeeFormulas(), []);
  const eventsLoader = useCallback(() => listAllEvents(), []);
  const formulas = useAsync(formulasLoader);
  const events = useAsync(eventsLoader);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formulaList = formulas.data ?? [];
  const byId = new Map(formulaList.map((f) => [f.feeFormulasId, f]));

  async function createFormula() {
    setSubmitting(true);
    setError(null);
    try {
      await createFeeFormula({
        name: form.name,
        percentBps: Math.round(parseFloat(form.percent || '0') * 100),
        flatCents: Math.round(parseFloat(form.flat || '0') * 100),
        minFeeCents: Math.round(parseFloat(form.min || '0') * 100),
        maxFeeCents: Math.round(parseFloat(form.max || '0') * 100),
      });
      setForm(EMPTY_FORM);
      formulas.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(formula: FeeFormula) {
    try {
      await updateFeeFormula({ ...formula, isActive: !formula.isActive });
      formulas.reload();
      events.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function removeFormula(id: string) {
    try {
      await deleteFeeFormula(id);
      formulas.reload();
      events.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  async function assign(kind: 'ticket' | 'table', targetId: string, feeFormulasId: string) {
    try {
      await assignFeeFormula(kind, targetId, feeFormulasId);
      events.reload();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    }
  }

  const previewPrice = 5000; // $50 sample for the live preview column

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Service fees</h1>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* ── Fee formulas ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Fee formulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="percent">Percent %</Label>
              <Input id="percent" value={form.percent} onChange={(e) => setForm((p) => ({ ...p, percent: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="flat">Flat $</Label>
              <Input id="flat" value={form.flat} onChange={(e) => setForm((p) => ({ ...p, flat: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="min">Min $ (opt)</Label>
              <Input id="min" value={form.min} onChange={(e) => setForm((p) => ({ ...p, min: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="max">Max $ (opt)</Label>
              <Input id="max" value={form.max} onChange={(e) => setForm((p) => ({ ...p, max: e.target.value }))} />
            </div>
          </div>
          <Button onClick={createFormula} disabled={submitting || !form.name}>
            {submitting ? 'Adding…' : 'Add formula'}
          </Button>

          {formulas.loading ? <p className="text-muted-foreground">Loading…</p> : null}
          <div className="divide-y rounded-md border">
            {formulaList.map((f) => (
              <div key={f.feeFormulasId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div>
                  <span className="font-medium">{f.name}</span>{' '}
                  <span className="text-sm text-muted-foreground">
                    {(f.percentBps / 100).toFixed(2)}% + {centsToUSD(f.flatCents)}
                    {f.minFeeCents ? ` · min ${centsToUSD(f.minFeeCents)}` : ''}
                    {f.maxFeeCents ? ` · max ${centsToUSD(f.maxFeeCents)}` : ''}
                  </span>
                  {!f.isActive ? <span className="ml-2 text-xs text-amber-foreground">inactive</span> : null}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">on {centsToUSD(previewPrice)} → {centsToUSD(previewFee(previewPrice, f))}</span>
                  <button className="text-primary" onClick={() => toggleActive(f)}>
                    {f.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="text-destructive" onClick={() => removeFormula(f.feeFormulasId)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── All events (cross-tenant) ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.loading ? <p className="text-muted-foreground">Loading…</p> : null}
          {(events.data ?? []).map((ev) => (
            <div key={ev.eventsId} className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-muted px-3 py-2">
                <span className="font-medium">{ev.title}</span>
                <span className="text-sm text-muted-foreground">{ev.tenantName} · {ev.status}</span>
              </div>
              {ev.items.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No ticket types or tables.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-1 font-normal">Item</th>
                      <th className="px-3 py-1 font-normal">Price</th>
                      <th className="px-3 py-1 font-normal">Formula</th>
                      <th className="px-3 py-1 font-normal">Service fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ev.items.map((it) => (
                      <tr key={`${it.kind}-${it.id}`} className="border-t">
                        <td className="px-3 py-1">
                          <span className="rounded bg-muted px-1 text-xs uppercase text-muted-foreground">{it.kind}</span>{' '}
                          {it.label}
                        </td>
                        <td className="px-3 py-1">{centsToUSD(it.priceCents)}</td>
                        <td className="px-3 py-1">
                          <select
                            className="h-8 rounded-md border border-input px-1 text-sm"
                            value={it.feeFormulasId}
                            onChange={(e) => assign(it.kind as 'ticket' | 'table', it.id, e.target.value)}
                          >
                            <option value="">— none —</option>
                            {formulaList.map((f) => (
                              <option key={f.feeFormulasId} value={f.feeFormulasId}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1 font-medium">
                          {centsToUSD(it.feeFormulasId ? previewFee(it.priceCents, byId.get(it.feeFormulasId)) : it.feeCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
