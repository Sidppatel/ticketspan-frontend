import { lazy, Suspense } from 'react';
import { resolvePortalContext } from '@/shared/subdomain';
import { Toaster } from '@/shared/ui/sonner';

const PublicRoutes = lazy(() => import('@/app/PublicRoutes'));
const AdminRoutes = lazy(() => import('@/app/AdminRoutes'));
const DeveloperRoutes = lazy(() => import('@/app/DeveloperRoutes'));
const StaffRoutes = lazy(() => import('@/app/StaffRoutes'));

function selectRoutes(portal: string) {
  switch (portal) {
    case 'admin':
      return <AdminRoutes />;
    case 'developer':
      return <DeveloperRoutes />;
    case 'staff':
      return <StaffRoutes />;
    default:
      return <PublicRoutes />;
  }
}

export function App() {
  const { portal } = resolvePortalContext();
  return (
    <>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
        {selectRoutes(portal)}
      </Suspense>
      <Toaster position="bottom-center" />
    </>
  );
}
