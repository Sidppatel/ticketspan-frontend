import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { resolvePortalContext } from '@/shared/subdomain';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function LoginPage() {
  const page = usePageEntrance<HTMLDivElement>();
  const { login, google, loading, error } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const allowRegister = resolvePortalContext().portal === 'public';

  return (
    <div ref={page} className="mx-auto mt-10 max-w-sm sm:mt-16">
      <div className="mb-6 text-center">
        <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-primary)' }}>
          svyne
        </span>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back. Sign in to continue.</p>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              login(email, password);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 uppercase tracking-wide text-muted-foreground">or</span>
            </div>
          </div>
          <GoogleSignInButton onToken={google} />
          <div className="flex justify-between text-sm">
            {allowRegister ? (
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create account
              </Link>
            ) : (
              <span />
            )}
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
