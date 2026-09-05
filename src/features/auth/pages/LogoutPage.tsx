import { useEffect } from 'react';
import { useAuthStore } from '@/shared/auth/store';
import { oidcLogout } from '@/shared/auth/oidc';

export function LogoutPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') || params.get('returnTo') || '/';

    useAuthStore.getState().clear();
    oidcLogout(false).finally(() => {
      window.location.replace(returnUrl);
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-mono text-xs text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}
