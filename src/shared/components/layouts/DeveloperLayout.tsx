import { Outlet, useLocation } from 'react-router-dom';
import { PortalNav } from '@/shared/components/layouts/PortalNav';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function DeveloperLayout() {
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();
  return (
    <div data-portal="developer" className="min-h-screen bg-background">
      <PortalNav
        section="developer"
        links={[
          { to: '/', label: 'Dashboard' },
          { to: '/tenants', label: 'Tenants' },
          { to: '/billing', label: 'Billing' },
          { to: '/pay-per-event', label: 'Pay Per Event' },
          { to: '/fees', label: 'Fees' },
          { to: '/fee-overrides', label: 'Fee Overrides' },
          { to: '/revenue', label: 'Revenue' },
          { to: '/reporting-access', label: 'Reporting Access' },
          { to: '/logs', label: 'System Logs' },
        ]}
      />
      <main ref={page} key={pathname} className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
