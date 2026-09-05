import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeAuthCode } from '@/shared/auth/oidc';

export function OidcCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (window.parent && window.parent !== window) {
      if (code) {
        window.parent.postMessage({ type: 'OIDC_CODE', code }, window.location.origin);
      } else {
        window.parent.postMessage({ type: 'OIDC_ERROR', error: error || 'unknown' }, window.location.origin);
      }
      return;
    }

    const state = params.get('state');

    if (code) {
      exchangeAuthCode(code, `${window.location.origin}/callback`)
        .then(() => {
          if (state) {
            if (state.startsWith('http://') || state.startsWith('https://')) {
              try {
                const target = new URL(state);
                if (target.origin === window.location.origin) {
                  navigate(`${target.pathname}${target.search}${target.hash}`);
                  return;
                }
                window.location.href = state;
                return;
              } catch {
              }
            } else if (state.startsWith('/')) {
              navigate(state);
              return;
            }
          }
          navigate('/');
        })
        .catch(() => {
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
