import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { useAuth } from '@/shared/auth/useAuth';
import { canManageTenantSettings } from '@/shared/roles';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function AdminLayout() {
  const { role } = useAuth();
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();
  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/events', label: 'Events' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/catalog', label: 'Catalog' },
    { to: '/feedback', label: 'Feedback' },
    { to: '/logs', label: 'Logs' },
  ];
  if (canManageTenantSettings(role)) {
    links.push({ to: '/invitations', label: 'Invitations' });
    links.push({ to: '/financial', label: 'Financial' });
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav section="admin" links={links} />
      <main ref={page} key={pathname} className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
