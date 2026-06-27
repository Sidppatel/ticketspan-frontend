import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyMagicLink } from '@/features/auth/services/authService';
import { rpcErrorMessage } from '@/shared/session';
import { homePathForRole } from '@/shared/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function MagicLinkVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<string | null>(token ? null : 'Missing token.');

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    const run = async () => {
      try {
        const auth = await verifyMagicLink(token);
        if (active) {
          navigate(homePathForRole(auth.user?.role ?? 0));
        }
      } catch (caught) {
        if (active) {
          setError(rpcErrorMessage(caught));
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token, navigate]);

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Verifying…</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-destructive">{error}</p> : <p className="text-muted-foreground">One moment.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
