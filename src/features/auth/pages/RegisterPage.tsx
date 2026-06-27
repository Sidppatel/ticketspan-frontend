import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { currentTenantSlug } from '@/shared/subdomain';

export function RegisterPage() {
  const { register, magicLink, google, loading, error, notice } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const tenantSlug = currentTenantSlug();

  if (!tenantSlug) {
    return (
      <div className="mx-auto mt-16 max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select an organizer first, then create your account on their site.
            </p>
            <Link to="/" className="text-sm text-primary">
              Browse organizers
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Signing up for {tenantSlug}.</p>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              register({ email, password, firstName, lastName });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {notice ? <p className="text-sm text-success">{notice}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
          <Button variant="outline" className="w-full" disabled={loading || !email} onClick={() => magicLink(email)}>
            Email me a sign-in link instead
          </Button>
          <GoogleSignInButton onToken={google} />
          <div className="text-sm text-muted-foreground">
            <Link to="/login">Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
