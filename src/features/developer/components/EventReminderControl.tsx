import { useCallback, useState } from 'react';
import { Bell, Send, Clock, Sliders, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  getEventReminderSettings,
  updateEventReminderSettings,
  triggerManualEventReminder,
} from '@/features/developer/services/developerService';
import { rpcErrorMessage } from '@/shared/session';
import { formatEpoch } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';

interface EventReminderControlProps {
  eventsId: string;
  eventTitle: string;
}

export function EventReminderControl({ eventsId, eventTitle }: EventReminderControlProps) {
  const loader = useCallback(() => getEventReminderSettings(eventsId), [eventsId]);
  const { data: settings, loading, reload } = useAsync(loader);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const enabled = settings ? settings.remindersEnabled : true;
  const sent1 = settings ? settings.reminder7DSent : false;
  const sent2 = settings ? settings.reminder48HSent : false;
  const lastManual = settings && settings.lastManualReminderAt ? Number(settings.lastManualReminderAt) : 0;
  const manualCount = settings ? settings.manualReminderCount : 0;

  const default1 = settings?.defaultReminder1Hours || 168;
  const default2 = settings?.defaultReminder2Hours || 48;

  const serverDays1 = settings ? Math.max(1, Math.round((settings.reminder1Hours || default1) / 24)) : 7;
  const serverHours2 = settings ? (settings.reminder2Hours || default2) : 48;

  const [draft1Days, setDraft1Days] = useState<number | null>(null);
  const [draft2Hours, setDraft2Hours] = useState<number | null>(null);

  const reminder1Days = draft1Days ?? serverDays1;
  const reminder2Hours = draft2Hours ?? serverHours2;

  async function handleToggle(nextVal: boolean) {
    setSaving(true);
    try {
      await updateEventReminderSettings(eventsId, nextVal, reminder1Days * 24, reminder2Hours);
      toast.success(nextVal ? 'Automated event reminders enabled' : 'Automated event reminders disabled');
      reload();
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule() {
    setSaving(true);
    try {
      const h1 = Math.max(1, reminder1Days) * 24;
      const h2 = Math.max(1, reminder2Hours);
      await updateEventReminderSettings(eventsId, enabled, h1, h2);
      toast.success(`Reminder schedule updated: ${reminder1Days}d (${h1}h) & ${h2}h`);
      setShowConfig(false);
      reload();
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleResetToDefaults() {
    setDraft1Days(Math.round(default1 / 24));
    setDraft2Hours(default2);
  }

  async function handleSendNow() {
    setSending(true);
    try {
      const res = await triggerManualEventReminder(eventsId);
      toast.success(res.message || `Reminder for "${eventTitle}" dispatched to ${res.recipientsCount} ticket holders`);
      reload();
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const label1 = `${reminder1Days}d (${reminder1Days * 24}h)`;
  const label2 = `${reminder2Hours}h`;

  return (
    <div className="rounded-md border p-3 text-xs space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Bell className="h-3.5 w-3.5 text-brand" />
          <span>Event Reminders (Developer)</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowConfig(!showConfig)}
            className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          >
            <Sliders className="h-3 w-3" />
            {showConfig ? 'Close Timing' : 'Customize Timing'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{enabled ? 'Auto On' : 'Auto Off'}</span>
            <Switch
              checked={enabled}
              disabled={loading || saving}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <Badge variant={sent1 ? 'success' : enabled ? 'neutral' : 'neutral'}>
          {sent1 ? `✓ ${label1} reminder sent` : `${label1} auto (pending)`}
        </Badge>
        <Badge variant={sent2 ? 'success' : enabled ? 'neutral' : 'neutral'}>
          {sent2 ? `✓ ${label2} reminder sent` : `${label2} auto (pending)`}
        </Badge>
        {manualCount > 0 && lastManual > 0 ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last broadcast: {formatEpoch(lastManual)} ({manualCount}x)
          </span>
        ) : null}
      </div>

      {showConfig ? (
        <div className="rounded border bg-background/80 p-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Configurable Reminder Windows</span>
            <span className="text-[10px] text-muted-foreground">System default: {Math.round(default1 / 24)}d &amp; {default2}h (from app_settings)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                First Automated Reminder (Days before start)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={reminder1Days}
                  onChange={(e) => setDraft1Days(Number(e.target.value))}
                  className="h-8 text-xs w-24"
                />
                <span className="text-[11px] text-muted-foreground">days ({reminder1Days * 24} hours out)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Second Automated Reminder (Hours before start)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={reminder2Hours}
                  onChange={(e) => setDraft2Hours(Number(e.target.value))}
                  className="h-8 text-xs w-24"
                />
                <span className="text-[11px] text-muted-foreground">hours out</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleResetToDefaults}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSchedule}
              disabled={saving}
              className="h-7 text-xs gap-1"
            >
              <Check className="h-3 w-3" />
              {saving ? 'Saving…' : 'Save Timing Override'}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="pt-1 flex items-center justify-between border-t gap-2">
        <p className="text-[11px] text-muted-foreground">
          Broadcasts a reminder email for &ldquo;{eventTitle}&rdquo; to all confirmed ticket holders with event details &amp; directions.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={sending}
          onClick={handleSendNow}
          className="h-7 text-xs shrink-0 gap-1.5 border-brand/40 hover:bg-brand/10 hover:text-brand"
        >
          <Send className="h-3 w-3" />
          {sending ? 'Sending…' : 'Send Reminder Now'}
        </Button>
      </div>
    </div>
  );
}
