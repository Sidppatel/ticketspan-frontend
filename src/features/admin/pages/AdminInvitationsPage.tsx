import { useCallback, useMemo, useState } from 'react';
import { Mail, Send, UserMinus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
} from '@/features/admin/services/invitationService';
import { listAllStaff, removeStaffRole } from '@/features/admin/services/staffAdminService';
import { rpcErrorMessage } from '@/shared/session';
import { Roles, roleLabel } from '@/shared/roles';
import { useAuth } from '@/shared/auth/useAuth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';

const INVITABLE_ROLES = [Roles.Admin, Roles.Staff, Roles.SubTenant, Roles.EventManager];

function statusVariant(status: string): 'success' | 'warn' | 'neutral' | 'danger' {
  const s = status.toLowerCase();
  if (s === 'accepted') return 'success';
  if (s === 'pending' || s === 'sent') return 'warn';
  if (s === 'expired') return 'danger';
  return 'neutral';
}

export function AdminInvitationsPage() {
  const { user } = useAuth();
  const loader = useCallback(async () => {
    const [invs, mems] = await Promise.all([listInvitations(), listAllStaff()]);
    return { invitations: invs, members: mems };
  }, []);
  const { data, loading, error, reload } = useAsync(loader);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<number>(Roles.Staff);
  const [sending, setSending] = useState(false);

  const invitations = useMemo(() => data?.invitations ?? [], [data]);
  const members = useMemo(() => data?.members ?? [], [data]);

  async function guard(action: () => Promise<unknown>) {
    try {
      await action();
      reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    }
  }

  async function handleSendInvite() {
    if (!email.trim()) return;
    setSending(true);
    try {
      await createInvitation(email.trim(), role);
      toast.success(`Invitation sent to ${email.trim()}.`);
      setEmail('');
      reload();
    } catch (caught) {
      toast.error(rpcErrorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-1 border-b border-border/40 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Team & Invitations
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage organizers, check-in staff, and event managers with role-based access control.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            Invite a Team Member
          </CardTitle>
          <CardDescription>
            Send an onboarding link with pre-assigned role permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:flex-1 space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@organization.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="w-full sm:w-48 space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs">Role</Label>
              <Select
                id="invite-role"
                className="h-9 text-xs"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
              >
                {INVITABLE_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {roleLabel(value)}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              disabled={!email.trim() || sending}
              onClick={handleSendInvite}
              className="h-9 text-xs gap-1.5 w-full sm:w-auto"
            >
              <Send className="size-3.5" />
              {sending ? 'Sending…' : 'Send Invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Active Team Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {members.length > 0 ? (
                <ul className="divide-y divide-border/50">
                  {members.map((member) => {
                    const isSelf = member.email.toLowerCase() === user?.email?.toLowerCase();
                    return (
                      <li key={member.usersId} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate text-sm font-semibold text-foreground flex items-center gap-2">
                            {member.firstName || member.lastName ? `${member.firstName} ${member.lastName}`.trim() : member.email}
                            {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email} · <span className="font-medium text-foreground">{roleLabel(member.role)}</span>
                          </p>
                        </div>
                        <div className="shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isSelf}
                            onClick={() =>
                              guard(async () => {
                                if (window.confirm(`Are you sure you want to remove ${member.firstName || member.lastName || member.email} from the team?`)) {
                                  await removeStaffRole(member.usersId);
                                  toast.success('Member removed successfully.');
                                }
                              })
                            }
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-30"
                          >
                            <UserMinus className="mr-1 size-3.5" /> Remove
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<Users className="size-5 text-muted-foreground" />}
                    title="No Active Members"
                    description="No additional team members have been configured."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                Pending Invitations ({invitations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invitations.length > 0 ? (
                <ul className="divide-y divide-border/50">
                  {invitations.map((invitation) => (
                    <li key={invitation.invitationsId} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate text-sm font-semibold text-foreground">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel(invitation.role)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={statusVariant(invitation.status)}>{invitation.status}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => guard(() => revokeInvitation(invitation.invitationsId))}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Revoke
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<Mail className="size-5 text-muted-foreground" />}
                    title="No Pending Invites"
                    description="All sent invitations have been accepted or no invites are active."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
