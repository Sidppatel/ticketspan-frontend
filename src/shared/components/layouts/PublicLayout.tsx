import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function PublicLayout() {
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();
  return (
    <div className="min-h-screen bg-background">
      <PortalNav
        links={[
          { to: '/', label: 'Events' },
          { to: '/my-bookings', label: 'My Bookings' },
          { to: '/feedback', label: 'Feedback' },
          { to: '/profile', label: 'Profile' },
        ]}
      />
      <main ref={page} key={pathname} className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
