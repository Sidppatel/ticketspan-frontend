import { useState } from 'react';
import { Clock, ShieldCheck, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { DateTimePicker } from '@/shared/ui/date-time-picker';
import { epochToZonedInput, zonedInputToEpoch } from '@/shared/lib/timezone';
import { updateStaffAccessWindow } from '@/features/admin/services/staffAdminService';
import { toast } from 'sonner';
import { rpcErrorMessage } from '@/shared/session';
import type { StaffMember } from '@/shared/proto/admin';

interface StaffAccessWindowModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  eventsId: string;
  defaultStartDate: number | string;
  defaultEndDate: number | string;
  timeZone: string;
  onSaved: () => void;
}

export function StaffAccessWindowModal({
  isOpen,
  onOpenChange,
  member,
  eventsId,
  defaultStartDate,
  defaultEndDate,
  timeZone,
  onSaved,
}: StaffAccessWindowModalProps) {
  const numStart = Number(defaultStartDate);
  const numEnd = Number(defaultEndDate);
  const defStartEpoch = numStart > 0 ? numStart - 86400 : 0;
  const defEndEpoch = numEnd > 0 ? numEnd + 86400 : 0;

  const currentStartEpoch = member && Number(member.accessStart) > 0 ? Number(member.accessStart) : defStartEpoch;
  const currentEndEpoch = member && Number(member.accessEnd) > 0 ? Number(member.accessEnd) : defEndEpoch;

  const [startInput, setStartInput] = useState(() => epochToZonedInput(currentStartEpoch, timeZone));
  const [endInput, setEndInput] = useState(() => epochToZonedInput(currentEndEpoch, timeZone));
  const [isSaving, setIsSaving] = useState(false);

  if (!member) return null;

  async function handleSave() {
    if (!member) return;
    setIsSaving(true);
    try {
      const aStart = zonedInputToEpoch(startInput, timeZone);
      const aEnd = zonedInputToEpoch(endInput, timeZone);
      if (Number(aEnd) <= Number(aStart)) {
        toast.error('Access finish time must be after access start time');
        setIsSaving(false);
        return;
      }
      await updateStaffAccessWindow(member.usersId, eventsId, Number(aStart), Number(aEnd));
      toast.success(`Access window updated for ${member.firstName || member.email}`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetToDefault() {
    if (!member) return;
    setIsSaving(true);
    try {
      await updateStaffAccessWindow(member.usersId, eventsId, 0, 0);
      toast.success('Access window reset to default event ±24h');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(rpcErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 space-y-4 border border-border shadow-2xl rounded-3xl">
        <div className="space-y-1">
          <DialogTitle className="text-lg font-extrabold font-display text-foreground tracking-tight flex items-center gap-2">
            <Clock className="size-5 text-primary" /> Staff Access Window
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure access hours for <span className="font-bold text-foreground">{member.firstName} {member.lastName}</span> ({member.email})
          </DialogDescription>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            By default, check-in staff can scan tickets from 24h before start to 24h after end. You can customize exact times below.
          </span>
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Access Start *
            </Label>
            <DateTimePicker value={startInput} onChange={setStartInput} timeZone={timeZone} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Access Finish *
            </Label>
            <DateTimePicker value={endInput} onChange={setEndInput} timeZone={timeZone} />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between gap-2 border-t border-border/40">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="h-9 px-3 text-xs font-bold text-muted-foreground gap-1.5"
          >
            <RotateCcw className="size-3.5" /> Reset Default
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-9 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="ticketspan-spring-btn h-9 px-4 text-xs font-bold rounded-xl"
            >
              Save Access
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
