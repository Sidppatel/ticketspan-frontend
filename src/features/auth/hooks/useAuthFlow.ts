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

export function useAuthFlow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Prefer a pending return target (e.g. a guest checkout the user was sent
  // away from); otherwise land on the role's home.
  const goAfterAuth = useCallback(
    (role: number) => navigate(takeReturnTo() ?? homePathForRole(role)),
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
