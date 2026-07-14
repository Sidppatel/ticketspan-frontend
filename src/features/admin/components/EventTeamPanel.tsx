import { useState } from 'react';
import { toast } from 'sonner';
import { assignStaffByEmail, unassignStaff } from '@/features/admin/services/staffAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { accessWindow, initials } from '@/shared/lib/format';
import type { StaffMember } from '@/shared/proto/admin';
import { Roles } from '@/shared/roles';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Users, UserPlus, Clock, Mail, Sparkles } from 'lucide-react';

type Props = {
  eventsId: string;
  startDate: number | string;
  endDate: number | string;
  staff: StaffMember[];
  loading: boolean;
  onChanged: () => void;
};

function isPending(member: StaffMember): boolean {
  return !member.firstName.trim() && !member.lastName.trim();
}

function displayName(member: StaffMember): string {
  const full = `${member.firstName} ${member.lastName}`.trim();
  return full || 'Invitation pending';
}

export function EventTeamPanel({ eventsId, startDate, endDate, staff, loading, onChanged }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<number>(Roles.Staff);
  const [sending, setSending] = useState(false);
  const window = accessWindow(startDate, endDate);

  async function invite() {
    const clean = email.trim();
    if (!clean) return;
    setSending(true);
    try {
      const res = await assignStaffByEmail(clean, eventsId, role);
      toast.success(res.userExisted ? `${clean} added to your team.` : res.message);
      setEmail('');
      onChanged();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  async function remove(member: StaffMember) {
    if (!confirm(`Remove ${displayName(member)} from this event's team?`)) return;
    try {
      await unassignStaff(member.usersId, eventsId);
      toast.success('Removed from the team.');
      onChanged();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/20 px-6 py-4">
        <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-primary" /> Your Event Team
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Every great event needs a great team. Invite the people you trust to help it run.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-teammate" className="text-[10px] flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Invite a team member
              </Label>
              <Input
                id="invite-teammate"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void invite();
                }}
                className="h-10 bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-[10px]">Role</Label>
              <Select
                id="invite-role"
                className="h-10 w-auto bg-background text-sm"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
              >
                <option value={Roles.Staff}>Check-in Staff</option>
                <option value={Roles.EventManager}>Event Manager</option>
              </Select>
            </div>
            <Button
              className="entryvine-spring-btn h-10 px-6 rounded-lg font-bold text-xs"
              disabled={sending || !email.trim()}
              onClick={() => void invite()}
            >
              <UserPlus className="h-4 w-4" /> {sending ? 'Sending…' : 'Invite to team'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {role === Roles.EventManager
              ? 'Event Managers can edit this event and see its attendees — never other events, and never revenue.'
              : 'Check-in Staff can scan tickets and check in guests for this event only.'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-amber/40 bg-amber/5 px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-amber/15 text-amber-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">No one on the team yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Invite check-in staff to scan tickets and welcome guests. They’ll get access 24 hours
                before the event and for 24 hours after it ends.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Current team ({staff.length} {staff.length === 1 ? 'member' : 'members'})
            </p>
            {staff.map((member) => {
              const pending = isPending(member);
              return (
                <div
                  key={member.usersId}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initials(member.firstName, member.lastName, member.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">{displayName(member)}</span>
                      <Badge variant="neutral">
                        {member.role === Roles.EventManager ? 'Event Manager' : 'Check-in Staff'}
                      </Badge>
                      <Badge variant={pending ? 'warn' : 'success'}>{pending ? 'Pending' : 'Active'}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    {window && !pending ? (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> Access {window.from} → {window.to}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => void remove(member)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
