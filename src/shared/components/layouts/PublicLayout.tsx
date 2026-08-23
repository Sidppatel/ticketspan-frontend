import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const PortalNav = lazy(() =>
  import('@/shared/components/layouts/PortalNav').then((m) => ({ default: m.PortalNav })),
);
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';
import { useAuth } from '@/shared/auth/useAuth';
import { cn } from '@/shared/lib/cn';
import { acquireLenis } from '@/shared/motion/lenis';
import { currentTenantSlug } from '@/shared/subdomain';

export function PublicLayout() {
  const { role, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();

  useEffect(() => acquireLenis(), []);

  const onRootDomain = !currentTenantSlug();

  // On tenant domain, only show Events catalog and Staff check-in if staff
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
    </div>
  );
}
