import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
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
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <div className="flex items-center gap-1.5">
            <Badge variant="voltage" className="font-mono text-xs">
              <KeyRound className="size-3" /> Security
            </Badge>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
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
          {error && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {notice && (
            <Alert variant="success">
              <CheckCircle2 className="size-4" />
              <AlertDescription className="text-xs">{notice}</AlertDescription>
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? 'Sending link…' : 'Send Recovery Link'}
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
