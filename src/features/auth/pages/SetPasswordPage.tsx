import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { PasswordInput } from '@/shared/ui/password-input';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { validateResetToken } from '@/features/auth/services/authService';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { Lock, CircleAlert, CheckCircle2 } from 'lucide-react';

type TokenState = 'checking' | 'valid' | 'invalid';

export function SetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const { submitNewPassword, loading, error, notice } = useAuthFlow();
  const [password, setPassword] = useState('');
  const [tokenState, setTokenState] = useState<TokenState>(token ? 'checking' : 'invalid');
  const [tokenError, setTokenError] = useState(token ? '' : 'Missing token in link.');

  useEffect(() => {
    if (!token) return;
    let active = true;
    validateResetToken(token)
      .then(() => {
        if (active) setTokenState('valid');
      })
      .catch((e: unknown) => {
        if (!active) return;
        setTokenState('invalid');
        setTokenError(
          e instanceof Error
            ? e.message
            : 'Invalid token. Please request a new password reset link.',
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthShell
      eyebrow="Security Credentials"
      title="Set your password."
      blurb="Choose a strong, secure password for your account."
    >
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="space-y-2 pb-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create new password
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your new account password below.
          </p>
        </div>

        {tokenState === 'checking' && (
          <p className="text-sm text-muted-foreground">Validating security token…</p>
        )}

        {tokenState === 'invalid' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertDescription className="text-xs">{tokenError}</AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full text-xs font-semibold"
              onClick={() => navigate('/forgot-password')}
            >
              Request a new reset link
            </Button>
          </div>
        )}

        {tokenState === 'valid' && (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              submitNewPassword(token, password);
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
              <Label htmlFor="password" className="text-xs">
                New Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pl-10 text-sm"
                />
              </div>
            </div>

            <Button type="submit" className="h-10 w-full text-sm font-semibold" disabled={loading}>
              {loading ? 'Saving…' : 'Set New Password'}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
