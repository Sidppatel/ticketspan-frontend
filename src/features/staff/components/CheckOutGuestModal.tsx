import { useState } from 'react';
import { LogOut, TriangleAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Alert, AlertDescription } from '@/shared/ui/alert';

const PRESET_REASONS = [
  'Left venue early',
  'Accidental scan / check-in',
  'Ticket dispute / wrong badge',
  'Guest requested pass reset',
  'Security / re-entry restriction',
];

interface CheckOutGuestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  ticketCode: string;
  onConfirm: (reason: string) => Promise<void>;
  isProcessing: boolean;
}

export function CheckOutGuestModal({
  isOpen,
  onOpenChange,
  guestName,
  ticketCode,
  onConfirm,
  isProcessing,
}: CheckOutGuestModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const effectiveReason = selectedPreset === 'Other' ? customReason.trim() : selectedPreset;

  async function handleConfirm() {
    if (!effectiveReason) {
      setError('Please select or specify a reason for check-out.');
      return;
    }
    setError(null);
    await onConfirm(effectiveReason);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 space-y-4 border border-border shadow-2xl rounded-3xl">
        <div className="space-y-1.5">
          <DialogTitle className="text-lg font-bold font-display text-foreground tracking-tight flex items-center gap-2">
            <LogOut className="size-5 text-warning" /> Undo Check-In / Check Out
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Guest: <span className="font-semibold text-foreground">{guestName}</span> ({ticketCode})
          </DialogDescription>
        </div>

        <Alert variant="warning">
          <TriangleAlert className="size-4" />
          <AlertDescription className="text-xs">
            This action will restore the attendee pass status and record an audit log with your specified reason.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reason for check-out *
          </Label>

          <div className="grid grid-cols-1 gap-1.5">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 cursor-pointer text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="checkout-reason"
                  checked={selectedPreset === reason}
                  onChange={() => {
                    setSelectedPreset(reason);
                    setError(null);
                  }}
                  className="accent-primary"
                />
                <span>{reason}</span>
              </label>
            ))}

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 cursor-pointer text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="checkout-reason"
                checked={selectedPreset === 'Other'}
                onChange={() => {
                  setSelectedPreset('Other');
                  setError(null);
                }}
                className="accent-primary"
              />
              <span>Other custom reason…</span>
            </label>
          </div>

          {selectedPreset === 'Other' && (
            <div className="space-y-1.5 pt-1">
              <Textarea
                placeholder="Explain why this attendee is being checked out…"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setError(null);
                }}
                className="text-xs min-h-[70px]"
              />
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="h-8 text-xs"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isProcessing || !effectiveReason}
            onClick={handleConfirm}
            className="h-8 px-4 text-xs font-semibold text-warning border-warning/40 hover:bg-warning/10"
          >
            Confirm Check Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
