import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { currentTenantSlug } from '@/shared/subdomain';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Mail, Lock, UserPlus, Sparkles, ArrowRight, CircleAlert, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const { register, magicLink, google, loading, error, notice } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const tenantSlug = currentTenantSlug();

  const returnUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl') || new URLSearchParams(window.location.search).get('returnTo')
    : null;

  return (
    <AuthShell
      eyebrow="Registration"
      title="Create your account."
      blurb="One account gives you seamless entry, QR tickets, and reservations across all venues."
    >
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <div className="flex items-center gap-1.5">
            <Badge variant="voltage" className="font-mono text-xs">
              <Sparkles className="size-3" /> {tenantSlug ? `@${tenantSlug}` : 'Attendee'}
            </Badge>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create account
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign up once to access all partner box offices and tickets.
          </p>
          {returnUrl && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>You will return to your selected event after registration.</span>
            </div>
          )}
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            register({ email, password, firstName, lastName });
          }}
        >
          {error && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <div>
                <AlertTitle className="text-xs">Sign up failed</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {notice && (
            <Alert variant="success">
              <CheckCircle2 className="size-4" />
              <AlertDescription className="text-xs">{notice}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-sm font-semibold mt-2"
            disabled={loading}
          >
            {loading ? (
              'Creating account…'
            ) : (
              <>
                <UserPlus className="size-4" /> Create Account
              </>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton onToken={google} />

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9"
            disabled={loading || !email}
            onClick={() => magicLink(email)}
          >
            Email me a magic sign-in link
          </Button>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Sign in here <ArrowRight className="size-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
