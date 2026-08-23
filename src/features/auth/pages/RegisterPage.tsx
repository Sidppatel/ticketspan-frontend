import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Label } from '@/shared/ui/label';
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
      eyebrow="Universal Registration"
      title="Create your Universal Pass."
      blurb="One account gives you seamless entry, QR tickets, and reservations across all venues."
    >
      <div className="rounded-2xl border border-hairline/80 bg-surface/90 p-8 shadow-[var(--shadow-e3)] backdrop-blur-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              <Sparkles className="size-3" /> {tenantSlug ? `@${tenantSlug}` : 'Universal Attendee'}
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Create account
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign up once to access all partner box offices and tickets.
          </p>
          {returnUrl ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>You will return to your selected event after registration.</span>
            </div>
          ) : null}
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            register({ email, password, firstName, lastName });
          }}
        >
          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-medium">Sign up failed</p>
                <p className="text-xs text-destructive/90">{error}</p>
              </div>
            </div>
          ) : null}

          {notice ? (
            <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success animate-in fade-in">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs text-success">{notice}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                First name
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
              <Label htmlFor="lastName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Last name
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
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            className="h-11 w-full gap-2 text-sm font-medium shadow-md transition-transform active:scale-[0.99] mt-2"
            disabled={loading}
          >
            {loading ? (
              'Creating account…'
            ) : (
              <>
                <UserPlus className="size-4" /> Create Universal Account
              </>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-hairline" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface px-3 font-mono text-[10.5px] uppercase tracking-widest text-muted-foreground">
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

          <div className="rounded-xl border border-hairline bg-surface-sunken/40 p-4 text-center">
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
