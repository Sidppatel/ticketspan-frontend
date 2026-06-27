import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function StaffLayout() {
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();
  return (
    <div className="min-h-screen bg-background">
      <PortalNav section="staff" links={[{ to: '/staff', label: 'Check-In' }]} />
      <main ref={page} key={pathname} className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
