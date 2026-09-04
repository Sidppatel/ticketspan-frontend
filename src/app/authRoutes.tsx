import { lazy, useEffect } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { NotAuthorizedPage } from '@/shared/components/StatusPages';
import { isTenantSubdomain, getUniversalLoginUrl, getUniversalRegisterUrl } from '@/shared/subdomain';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const SetPasswordPage = lazy(() =>
  import('@/features/auth/pages/SetPasswordPage').then((m) => ({ default: m.SetPasswordPage })),
);
const MagicLinkVerifyPage = lazy(() =>
  import('@/features/auth/pages/MagicLinkVerifyPage').then((m) => ({ default: m.MagicLinkVerifyPage })),
);
const AcceptInvitationPage = lazy(() =>
  import('@/features/auth/pages/AcceptInvitationPage').then((m) => ({ default: m.AcceptInvitationPage })),
);

function TenantAuthRedirect({ target = 'login' }: { target?: 'login' | 'register' }) {
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateFrom = (location.state as { from?: string } | null)?.from;
      const searchReturn = new URLSearchParams(window.location.search).get('returnUrl');
      const returnUrl = searchReturn || (stateFrom ? `${window.location.origin}${stateFrom}` : window.location.origin);
      const universalUrl =
        target === 'register' ? getUniversalRegisterUrl(returnUrl) : getUniversalLoginUrl(returnUrl);
      window.location.replace(universalUrl);
    }
  }, [target, location.state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-mono text-xs text-muted-foreground">Redirecting to Sign In...</p>
      </div>
    </div>
  );
}

export function authRoutes(options?: { allowRegister?: boolean }) {
  const onTenant = isTenantSubdomain();

  return (
    <>
      <Route path="/login" element={onTenant ? <TenantAuthRedirect target="login" /> : <LoginPage />} />
      {options?.allowRegister ? (
        <Route
          path="/register"
          element={onTenant ? <TenantAuthRedirect target="register" /> : <RegisterPage />}
        />
      ) : null}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/verify" element={<MagicLinkVerifyPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/not-authorized" element={<NotAuthorizedPage />} />
    </>
  );
}

export function authenticated() {
  return true;
}
