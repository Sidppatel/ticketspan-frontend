import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function MagicLinkVerifyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Verifying…</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Redirecting to sign in…</p>
        </CardContent>
      </Card>
    </div>
  );
}
