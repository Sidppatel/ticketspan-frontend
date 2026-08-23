import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Mail, ArrowLeft, KeyRound, CircleAlert, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const { forgotPassword, loading, error, notice } = useAuthFlow();
  const [email, setEmail] = useState('');

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Reset your password."
      blurb="Enter the email associated with your Universal Account and we'll send you recovery instructions."
    >
      <div className="rounded-2xl border border-hairline/80 bg-surface/90 p-8 shadow-[var(--shadow-e3)] backdrop-blur-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              <KeyRound className="size-3" /> Security
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Reset password
          </h2>
          <p className="text-sm text-muted-foreground">
            We will send a secure password reset link to your email inbox.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            forgotPassword(email);
          }}
        >
          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive animate-in fade-in">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs text-destructive/90">{error}</p>
            </div>
          ) : null}

          {notice ? (
            <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success animate-in fade-in">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs text-success">{notice}</p>
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 pl-10 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-11 w-full gap-2 text-sm font-medium shadow-md transition-transform active:scale-[0.99]"
            disabled={loading}
          >
            {loading ? 'Sending link…' : 'Send Recovery Link'}
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
