import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { NotFoundPage } from '@/shared/components/StatusPages';
import { DeveloperLayout } from '@/shared/components/layouts/DeveloperLayout';
import { isDeveloper } from '@/shared/roles';
import { authRoutes } from '@/app/authRoutes';
import { DeveloperTenantsPage } from '@/features/developer/pages/DeveloperTenantsPage';
import { DeveloperTenantMembersPage } from '@/features/developer/pages/DeveloperTenantMembersPage';
import { DeveloperDashboardPage } from '@/features/developer/pages/DeveloperDashboardPage';
import { DeveloperLogsPage } from '@/features/developer/pages/DeveloperLogsPage';
import { DeveloperFeesPage } from '@/features/developer/pages/DeveloperFeesPage';
import { DeveloperReportingAccessPage } from '@/features/developer/pages/DeveloperReportingAccessPage';
import { DeveloperBillingPage } from '@/features/developer/pages/DeveloperBillingPage';
import { DeveloperPayPerEventPage } from '@/features/developer/pages/DeveloperPayPerEventPage';
import { DeveloperFeeOverridesPage } from '@/features/developer/pages/DeveloperFeeOverridesPage';
import { DeveloperRevenuePage } from '@/features/developer/pages/DeveloperRevenuePage';

export default function DeveloperRoutes() {
  return (
    <Routes>
      {authRoutes()}
      <Route
        element={
          <ProtectedRoute allow={isDeveloper}>
            <DeveloperLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeveloperTenantsPage />} />
        <Route path="dashboard" element={<DeveloperDashboardPage />} />
        <Route path="tenants/:tenantsId" element={<DeveloperTenantMembersPage />} />
        <Route path="fees" element={<DeveloperFeesPage />} />
        <Route path="billing" element={<DeveloperBillingPage />} />
        <Route path="pay-per-event" element={<DeveloperPayPerEventPage />} />
        <Route path="fee-overrides" element={<DeveloperFeeOverridesPage />} />
        <Route path="revenue" element={<DeveloperRevenuePage />} />
        <Route path="reporting-access" element={<DeveloperReportingAccessPage />} />
        <Route path="logs" element={<DeveloperLogsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
