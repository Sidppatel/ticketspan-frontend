import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginWithPassword,
  loginWithGoogle,
  signUp,
  type SignUpInput,
  requestMagicLink,
  requestPasswordReset,
  setPassword,
} from '@/features/auth/services/authService';
import { rpcErrorMessage } from '@/shared/session';
import { homePathForRole } from '@/shared/roles';
import { takeReturnTo } from '@/shared/auth/returnTo';

import { useAuthStore, type PersistedAuthPayload } from '@/shared/auth/store';

export function useAuthFlow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const goAfterAuth = useCallback(
    (role: number) => {
      const currentAuth = useAuthStore.getState();
      const payload: PersistedAuthPayload = {
        accessToken: currentAuth.accessToken,
        refreshToken: currentAuth.refreshToken,
        expiresAtSeconds: currentAuth.expiresAtSeconds,
        user: currentAuth.user,
      };
      const authSyncHash = `auth_sync=${encodeURIComponent(JSON.stringify(payload))}`;

      const attachSyncToUrl = (targetUrl: string) => {
        try {
          const parsed = new URL(targetUrl, typeof window !== 'undefined' ? window.location.href : undefined);
          parsed.hash = parsed.hash ? `${parsed.hash}&${authSyncHash}` : authSyncHash;
          return parsed.toString();
        } catch {
          return targetUrl;
        }
      };

      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryReturn = urlParams.get('returnUrl') || urlParams.get('returnTo');
        if (queryReturn) {
          if (queryReturn.startsWith('http://') || queryReturn.startsWith('https://')) {
            window.location.href = attachSyncToUrl(queryReturn);
            return;
          }
          navigate(queryReturn);
          return;
        }
      }
      const storedReturn = takeReturnTo();
      if (storedReturn) {
        if (storedReturn.startsWith('http://') || storedReturn.startsWith('https://')) {
          window.location.href = attachSyncToUrl(storedReturn);
          return;
        }
        navigate(storedReturn);
        return;
      }
      navigate(homePathForRole(role));
    },
    [navigate],
  );

  const run = useCallback(async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const auth = await loginWithPassword(email, password);
        goAfterAuth(auth.user?.role ?? 0);
      }),
    [run, goAfterAuth],
  );

  const google = useCallback(
    (googleToken: string) =>
      run(async () => {
        const auth = await loginWithGoogle(googleToken);
        goAfterAuth(auth.user?.role ?? 0);
      }),
    [run, goAfterAuth],
  );

  const register = useCallback(
    (input: SignUpInput) =>
      run(async () => {
        const auth = await signUp(input);
        goAfterAuth(auth.user?.role ?? 0);
      }),
    [run, goAfterAuth],
  );

  const magicLink = useCallback(
    (email: string) =>
      run(async () => {
        await requestMagicLink(email);
        setNotice('Check your email for a sign-in link.');
      }),
    [run],
  );

  const forgotPassword = useCallback(
    (email: string) =>
      run(async () => {
        await requestPasswordReset(email);
        setNotice('If that email exists, a reset link was sent.');
      }),
    [run],
  );

  const submitNewPassword = useCallback(
    (token: string, password: string) =>
      run(async () => {
        await setPassword(token, password);
        setNotice('Password set. You can now sign in.');
        navigate('/login');
      }),
    [run, navigate],
  );

  return { loading, error, notice, login, google, register, magicLink, forgotPassword, submitNewPassword };
}
