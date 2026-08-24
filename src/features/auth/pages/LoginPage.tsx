import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Mail, Lock, LogIn, Sparkles, ArrowRight, CircleAlert } from 'lucide-react';

export function LoginPage() {
  const { login, google, loading, error } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const returnUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl') || new URLSearchParams(window.location.search).get('returnTo')
    : null;

  return (
    <AuthShell
      eyebrow="Universal Account"
      title="One account for all your events."
      blurb="Sign in once with your Universal Attendee credentials to access passes, table bookings, and receipts across every venue."
    >
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your universal passes.
          </p>
          {returnUrl && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>You will return to your selected event after signing in.</span>
            </div>
          )}
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            login(email, password);
          }}
        >
          {error && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <div>
                <AlertTitle className="text-xs">Sign in failed</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 pt-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
            />
            <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
              Stay signed in on this device
            </label>
          </div>

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              'Signing in…'
            ) : (
              <>
                <LogIn className="size-4" /> Sign In
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

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Don&rsquo;t have an attendee account yet?{' '}
              <Link
                to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Create one now <ArrowRight className="size-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
