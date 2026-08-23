import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { PasswordInput } from '@/shared/ui/password-input';
import { Label } from '@/shared/ui/label';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Mail, Lock, LogIn, Sparkles, ArrowRight, CircleAlert } from 'lucide-react';

export function LoginPage() {
  const { login, google, loading, error } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const fillDemoAccount = () => {
    setEmail('psiddh1408@gmail.com');
    setPassword('Password123!');
  };

  const returnUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnUrl') || new URLSearchParams(window.location.search).get('returnTo')
    : null;

  return (
    <AuthShell
      eyebrow="Universal Account"
      title="One account for all your events."
      blurb="Sign in once with your Universal Attendee credentials to access passes, table bookings, and receipts across every venue."
    >
      <div className="rounded-2xl border border-hairline/80 bg-surface/90 p-8 shadow-[var(--shadow-e3)] backdrop-blur-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              <Sparkles className="size-3" /> Universal Sign In
            </span>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="font-mono text-[11px] text-ink-soft transition-colors hover:text-brand hover:underline"
              title="Click to fill test credentials"
            >
              Fill Demo Login
            </button>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to access your universal passes.
          </p>
          {returnUrl ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              <span>You will return to your selected event after signing in.</span>
            </div>
          ) : null}
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            login(email, password);
          }}
        >
          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-medium">Sign in failed</p>
                <p className="text-xs text-destructive/90">{error}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                className="h-11 pl-10 text-sm transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:underline"
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
                className="h-11 pl-10 text-sm transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
              Stay signed in on this device
            </label>
          </div>

          <Button
            type="submit"
            className="h-11 w-full gap-2 text-sm font-medium shadow-md transition-transform active:scale-[0.99]"
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

          <div className="rounded-xl border border-hairline bg-surface-sunken/40 p-4 text-center">
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
