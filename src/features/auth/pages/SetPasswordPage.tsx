import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAuthFlow } from '@/features/auth/hooks/useAuthFlow';
import { validateResetToken } from '@/features/auth/services/authService';

type TokenState = 'checking' | 'valid' | 'invalid';

export function SetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const { submitNewPassword, loading, error, notice } = useAuthFlow();
  const [password, setPassword] = useState('');
  const [tokenState, setTokenState] = useState<TokenState>(token ? 'checking' : 'invalid');
  const [tokenError, setTokenError] = useState(token ? '' : 'Missing token in link.');

  // Validate the reset link before showing the form. The token is single-use and
  // is only consumed on submit, so an already-used or expired link is rejected here.
  useEffect(() => {
    if (!token) {
      return;
    }
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
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Set your password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenState === 'checking' ? (
            <p className="text-sm text-muted-foreground">Validating link…</p>
          ) : null}

          {tokenState === 'invalid' ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{tokenError}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/forgot-password')}
              >
                Request a new reset link
              </Button>
            </div>
          ) : null}

          {tokenState === 'valid' ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitNewPassword(token, password);
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {notice ? <p className="text-sm text-success">{notice}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Set password'}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
