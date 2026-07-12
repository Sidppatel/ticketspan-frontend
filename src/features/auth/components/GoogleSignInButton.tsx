import { useEffect, useRef } from 'react';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisLoad: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!gisLoad) {
    gisLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisLoad = null;
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    });
  }
  return gisLoad;
}

export function GoogleSignInButton({ onToken }: { onToken: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onToken(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: containerRef.current.clientWidth,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clientId, onToken]);

  if (!clientId) {
    return null;
  }
  return <div ref={containerRef} className="w-full [&>div]:w-full [&_iframe]:!w-full" />;
}
