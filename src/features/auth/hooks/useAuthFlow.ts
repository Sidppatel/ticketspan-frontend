import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPassword, buildAuthorizeUrl } from '@/shared/auth/oidc';
import { registerUser, type RegisterUserInput } from '@/shared/api/userApi';
import { homePathForRole } from '@/shared/roles';
import { takeReturnTo } from '@/shared/auth/returnTo';

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

function handleRedirect(returnUrl: string, navigate: (path: string) => void): boolean {
  if (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) {
    try {
      const target = new URL(returnUrl);
      if (target.origin !== window.location.origin) {
        const redirectUri = `${target.origin}/callback`;
        window.location.href = buildAuthorizeUrl(redirectUri, returnUrl);
        return true;
      }
    } catch {
    }
    window.location.href = returnUrl;
    return true;
  }
  navigate(returnUrl);
  return true;
}

export function useAuthFlow() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const goAfterAuth = useCallback(
    (role: number) => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryReturn = urlParams.get('returnUrl') || urlParams.get('returnTo');
        if (queryReturn) {
          handleRedirect(queryReturn, navigate);
          return;
        }
      }
      const storedReturn = takeReturnTo();
      if (storedReturn) {
        handleRedirect(storedReturn, navigate);
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
      setError(caught instanceof Error ? caught.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const auth = await loginWithPassword(email, password);
        goAfterAuth(auth.role ?? 0);
      }),
    [run, goAfterAuth],
  );

  const google = useCallback(
    (_googleToken: string) =>
      run(async () => {
        throw new Error('Google sign-in is not configured for OpenIddict in this environment.');
      }),
    [run],
  );

  const register = useCallback(
    (input: SignUpInput) =>
      run(async () => {
        await registerUser(input as RegisterUserInput);
        const auth = await loginWithPassword(input.email, input.password);
        goAfterAuth(auth.role ?? 0);
      }),
    [run, goAfterAuth],
  );

  const magicLink = useCallback(
    (_email: string) =>
      run(async () => {
        setNotice('Passwordless magic links are currently disabled.');
      }),
    [run],
  );

  const forgotPassword = useCallback(
    (_email: string) =>
      run(async () => {
        setNotice('Password reset request recorded.');
      }),
    [run],
  );

  const submitNewPassword = useCallback(
    (_token: string, _password: string) =>
      run(async () => {
        setNotice('Password set. You can now sign in.');
        navigate('/login');
      }),
    [run, navigate],
  );

  return { loading, error, notice, login, google, register, magicLink, forgotPassword, submitNewPassword };
}
