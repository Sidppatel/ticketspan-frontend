import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';

export function ForgotPasswordPage() {
  const { forgotPassword, loading, error, notice } = useAuthFlow();
  const [email, setEmail] = useState('');

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              forgotPassword(email);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {notice ? <p className="text-sm text-success">{notice}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            <Link to="/login">Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
