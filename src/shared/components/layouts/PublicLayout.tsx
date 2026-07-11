import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { MobileTabBar } from '@/shared/components/layouts/MobileTabBar';
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

  const links = [
    { to: '/', label: 'Events' },
    { to: '/tickets', label: 'Tickets' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/profile', label: 'Profile' },
  ];

  if (isAuthenticated && (role === 2 || role === 1 || role === 3)) {
    links.push({ to: '/staff', label: 'Check-In' });
  }

  const isPlatformLanding = pathname === '/' && !currentTenantSlug();
  const isFullBleedPage = pathname.startsWith('/events/') || isPlatformLanding;

  return (
    <div className="min-h-screen bg-background">
      {!isPlatformLanding && <PortalNav links={links} transparent={isFullBleedPage} />}
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
      {!isFullBleedPage && <MobileTabBar />}
    </div>
  );
}
