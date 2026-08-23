import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { QrImage } from '@/features/public/components/wallet/QrImage';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { roleLabel } from '@/shared/roles';
import { BrandMark } from '@/shared/brand/BrandMark';
import { Sparkles, Copy, Check, ShieldCheck, QrCode, Smartphone, X, Ticket, ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/shared/proto/auth';

interface DigitalPassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  role: number;
}

export function DigitalPassModal({ open, onOpenChange, user, role }: DigitalPassModalProps) {
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Universal Attendee';
  const attendeePassId = `TS-${user.usersId.slice(0, 8).toUpperCase()}-${(user.email || '').slice(0, 3).toUpperCase()}`;
  const qrData = JSON.stringify({
    uid: user.usersId,
    email: user.email,
    passId: attendeePassId,
    type: 'universal_attendee_credential',
    iss: 'TicketSpan Platform',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(attendeePassId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-[2rem] border border-border/80 bg-card p-0 shadow-2xl backdrop-blur-xl">
        <DialogTitle className="sr-only">Universal Attendee Digital Credential</DialogTitle>

        {/* Double-Bezel Pass Shell */}
        <div className="p-2 sm:p-3 bg-muted/40">
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-hairline bg-stage text-on-stage shadow-xl">
            {/* Ambient Background Glows */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/25 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-voltage/20 blur-3xl"
              aria-hidden="true"
            />

            {/* Pass Header */}
            <div className="relative z-10 border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrandMark className="size-6 text-brand-accent" />
                  <span className="font-display text-lg font-semibold tracking-tight text-white">
                    TicketSpan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="voltage" className="flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase">
                    <Sparkles className="size-3" /> Universal Pass
                  </Badge>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
                    aria-label="Close pass"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 bg-stage-elevated shadow-inner">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display text-xl font-bold text-brand-accent">
                      {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate font-display text-xl font-bold text-white">{displayName}</p>
                  <p className="truncate font-mono text-xs text-on-stage-soft/80">{user.email}</p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-emerald-400">
                      <ShieldCheck className="size-3" /> {roleLabel(role)}
                    </span>
                    {user.tenantSlug && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9.5px] text-slate-300">
                        {user.tenantSlug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Notches & Perforation */}
            <div className="relative flex items-center justify-between px-3 py-1 bg-stage-elevated/80 border-y border-white/10">
              <div className="size-4 -ml-5 rounded-full bg-muted/40 shadow-inner" />
              <div className="flex-1 border-t border-dashed border-white/20 mx-2" />
              <div className="size-4 -mr-5 rounded-full bg-muted/40 shadow-inner" />
            </div>

            {/* QR Code Presentation Area */}
            <div className="relative z-10 flex flex-col items-center p-6 text-center space-y-4">
              <div className="rounded-2xl border border-white/15 bg-white p-4 shadow-xl">
                <QrImage value={qrData} size={180} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="font-mono text-sm font-semibold tracking-wider text-white">
                    {attendeePassId}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-on-stage-soft transition-colors hover:bg-white/20 hover:text-white"
                    title="Copy Credential ID"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-on-stage-soft/70">
                  Universal Attendee Credential & Box Office ID
                </p>
              </div>

              {/* Informational Guidance Box */}
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left space-y-2">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="size-4 text-brand-accent mt-0.5 shrink-0" />
                  <div className="text-[11.5px] leading-relaxed text-on-stage-soft/90">
                    <p className="font-semibold text-white">Box Office & VIP Desk Verification</p>
                    <p className="text-[10.5px] text-on-stage-soft/70">
                      Use this credential for fast-lane ID verification, will-call pickup, and partner lounge access across all TicketSpan venues.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10.5px]">
                  <span className="text-on-stage-soft/80">Need door ticket for a specific event?</span>
                  <Link
                    to="/tickets"
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center gap-1 font-semibold text-voltage hover:underline"
                  >
                    <Ticket className="size-3" /> My Event Tickets <ArrowRight className="size-2.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="border-t border-white/10 bg-stage-elevated/90 p-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-stage-soft/70">
                <QrCode className="size-3.5 text-brand-accent" />
                <span>TicketSpan NFC / QR Ready</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 rounded-full border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/20 hover:text-white"
              >
                Close Pass
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
