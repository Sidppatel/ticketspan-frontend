import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';
import { useAuth } from '@/shared/auth/useAuth';
import { cn } from '@/shared/lib/cn';
import { FLAGS } from '@/shared/lib/flags';

export function PublicLayout() {
  const { role, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();

  const links = [
    { to: '/', label: 'Events' },
    { to: '/my-bookings', label: 'My Bookings' },
    { to: '/my-tickets', label: 'My Tickets' },
    { to: '/feedback', label: 'Feedback' },
    { to: '/profile', label: 'Profile' },
  ];

  if (isAuthenticated && (role === 2 || role === 1 || role === 3)) {
    links.push({ to: '/staff', label: 'Check-In' });
  }

  const isFullBleedPage = pathname.startsWith('/events/');

  return (
    <div className="min-h-screen bg-background">
      <PortalNav links={links} transparent={isFullBleedPage && FLAGS.newEventPage} />
      <main 
        ref={page} 
        key={pathname} 
        className={cn(
          "mx-auto w-full",
          isFullBleedPage ? "" : "max-w-7xl px-4 py-6 md:px-6 md:py-8"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
