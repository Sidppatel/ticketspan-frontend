import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { NotAuthorizedPage } from '@/shared/components/StatusPages';

import { LoginPage } from '@/features/auth/pages/LoginPage';
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

export function authRoutes(options?: { allowRegister?: boolean }) {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      {options?.allowRegister ? <Route path="/register" element={<RegisterPage />} /> : null}
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
