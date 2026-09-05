import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const PortalNav = lazy(() =>
  import('@/shared/components/layouts/PortalNav').then((m) => ({ default: m.PortalNav })),
);
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';
import { useAuth } from '@/shared/auth/useAuth';
import { cn } from '@/shared/lib/cn';
import { acquireLenis } from '@/shared/motion/lenis';
import { currentTenantSlug, resolvePortalContext } from '@/shared/subdomain';
import { useAuthStore } from '@/shared/auth/store';
import { tryRefresh } from '@/shared/session';
import { silentSsoCheck } from '@/shared/auth/oidc';
import { loadProfile } from '@/shared/api/userApi';

import { GlobalCartDock } from '@/features/public/components/cart/GlobalCartDock';
import { UniversalMultiCheckoutDrawer } from '@/features/public/components/checkout/UniversalMultiCheckoutDrawer';
import { useState } from 'react';

export function PublicLayout() {
  const { role, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();
  const [isMultiCheckoutOpen, setIsMultiCheckoutOpen] = useState(false);

  useEffect(() => acquireLenis(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { portal } = resolvePortalContext();
    if (portal !== 'public') return;

    function validateOrRefresh() {
      const store = useAuthStore.getState();
      if (store.isSessionValid()) {
        loadProfile().catch(() => {
          store.clear();
        });
        return;
      }

      if (store.accessToken) {
        tryRefresh().then((valid) => {
          if (!valid) {
            store.clear();
            silentSsoCheck();
          }
        });
      } else {
        silentSsoCheck();
      }
    }

    validateOrRefresh();

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('ts_auth_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          useAuthStore.getState().clear();
        }
      };
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        validateOrRefresh();
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        validateOrRefresh();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', validateOrRefresh);

    return () => {
      if (channel) {
        channel.close();
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', validateOrRefresh);
    };
  }, []);

  const onRootDomain = !currentTenantSlug();

  const links = onRootDomain
    ? [
        { to: '/', label: 'Home' },
        ...(isAuthenticated ? [{ to: '/hub', label: 'Attendee Hub' }] : []),
      ]
    : [{ to: '/', label: 'Events' }];

  if (!onRootDomain && isAuthenticated && (role === 2 || role === 1 || role === 3)) {
    links.push({ to: '/staff', label: 'Staff Check-In' });
  }

  const isPlatformLanding = pathname === '/' && onRootDomain;
  const isFullBleedPage = pathname.startsWith('/events/') || isPlatformLanding;

  return (
    <div className={cn('min-h-screen bg-background', onRootDomain && 'landing-ivory')}>
      {!isPlatformLanding && (
        <Suspense fallback={<div className="h-16" />}>
          <PortalNav links={links} transparent={isFullBleedPage} hideAuth={false} />
        </Suspense>
      )}
      <main
        ref={page}
        key={pathname}
        className={cn(
          'mx-auto w-full',
          isFullBleedPage ? 'pb-16 md:pb-0' : 'max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8',
        )}
      >
        <Outlet />
      </main>

      <GlobalCartDock onCheckout={() => {
        setIsMultiCheckoutOpen(true);
      }} />

      <UniversalMultiCheckoutDrawer
        isOpen={isMultiCheckoutOpen}
        onClose={() => setIsMultiCheckoutOpen(false)}
      />
    </div>
  );
}
