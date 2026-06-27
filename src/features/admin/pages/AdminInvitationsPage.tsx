import { useCallback, useState } from 'react';
import { useAsync } from '@/shared/hooks/useAsync';
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
} from '@/features/admin/services/invitationService';
import { rpcErrorMessage } from '@/shared/session';
import { Roles, roleLabel } from '@/shared/roles';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const INVITABLE_ROLES = [Roles.Admin, Roles.Staff, Roles.SubTenant];

export function AdminInvitationsPage() {
  const loader = useCallback(() => listInvitations(), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<number>(Roles.Staff);

  async function guard(action: () => Promise<unknown>) {
    try {
      await action();
      reload();
    } catch (caught) {
      window.alert(rpcErrorMessage(caught));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Invitations</h1>
      <Card>
        <CardHeader>
          <CardTitle>Invite a member</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <select
              className="h-10 rounded-md border border-input px-3 text-sm"
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
            >
              {INVITABLE_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            onClick={() =>
              guard(async () => {
                await createInvitation(email, role);
                setEmail('');
              })
            }
          >
            Send invitation
          </Button>
        </CardContent>
      </Card>

      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {(data ?? []).map((invitation) => (
          <Card key={invitation.invitationsId}>
            <CardContent className="flex items-center justify-between text-sm">
              <span>
                {invitation.email} · {roleLabel(invitation.role)} · {invitation.status}
              </span>
              <Button size="sm" variant="ghost" onClick={() => guard(() => revokeInvitation(invitation.invitationsId))}>
                Revoke
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
