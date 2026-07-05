import { Outlet, useLocation } from 'react-router-dom';
import { AdminTopNav } from '@/shared/components/layouts/AdminTopNav';
import { usePageEntrance } from '@/shared/hooks/usePageEntrance';

export function AdminLayout() {
  const { pathname } = useLocation();
  const page = usePageEntrance<HTMLElement>();

  return (
    <div data-portal="admin" className="min-h-screen bg-background text-foreground">
      <AdminTopNav />
      <main ref={page} key={pathname} className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
