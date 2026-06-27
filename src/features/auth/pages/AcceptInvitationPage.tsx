import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { acceptInvitation } from '@/features/admin/services/invitationService';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await acceptInvitation(token, password, firstName, lastName);
      navigate('/login');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Accept invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {token ? null : <p className="text-sm text-destructive">Missing token in link.</p>}
          <div className="space-y-1">
            <Label>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" onClick={submit} disabled={submitting || !token}>
            {submitting ? 'Saving…' : 'Accept and continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
