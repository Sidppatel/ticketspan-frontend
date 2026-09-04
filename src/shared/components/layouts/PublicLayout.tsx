import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const PortalNav = lazy(() =>
  import('@/shared/components/layouts/PortalNav').then((m) => ({ default: m.PortalNav })),
);
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';
import { useAuth } from '@/shared/auth/useAuth';
import { cn } from '@/shared/lib/cn';
import { acquireLenis } from '@/shared/motion/lenis';
import { currentTenantSlug, resolvePortalContext, getRootDomainUrl } from '@/shared/subdomain';
import { useAuthStore } from '@/shared/auth/store';

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
    const { portal, tenantSlug } = resolvePortalContext();
    if (portal !== 'public' || !tenantSlug) return;
    if (useAuthStore.getState().accessToken) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sso_probed') === '1') {
      try {
        window.sessionStorage.setItem('ts_sso_probed', '1');
      } catch (e) {
        void e;
      }
      urlParams.delete('sso_probed');
      const remaining = urlParams.toString();
      const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : '') + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
      return;
    }

    try {
      if (window.sessionStorage.getItem('ts_sso_probed') === '1') {
        return;
      }
      window.sessionStorage.setItem('ts_sso_probed', '1');
    } catch (e) {
      void e;
    }

    const probeUrl = getRootDomainUrl(`/sso/probe?returnUrl=${encodeURIComponent(window.location.href)}`);
    window.location.replace(probeUrl);
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

      {}
      <GlobalCartDock onCheckout={() => {
        setIsMultiCheckoutOpen(true);
      }} />

      {}
      <UniversalMultiCheckoutDrawer
        isOpen={isMultiCheckoutOpen}
        onClose={() => setIsMultiCheckoutOpen(false)}
      />
    </div>
  );
}
