import { lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { NotFoundPage } from '@/shared/components/StatusPages';
import { PublicLayout } from '@/shared/components/layouts/PublicLayout';
import { authRoutes, authenticated } from '@/app/authRoutes';
import { TenantLandingPage } from '@/features/public/pages/TenantLandingPage';
import { currentTenantSlug, isTenantSubdomain, getRootDomainUrl } from '@/shared/subdomain';

const EventListPage = lazy(() =>
  import('@/features/public/pages/EventListPage').then((m) => ({ default: m.EventListPage })),
);
const EventDetailPage = lazy(() =>
  import('@/features/public/pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
);
const PerformerProfilePage = lazy(() =>
  import('@/features/public/pages/PerformerProfilePage').then((m) => ({ default: m.PerformerProfilePage })),
);
const SponsorProfilePage = lazy(() =>
  import('@/features/public/pages/SponsorProfilePage').then((m) => ({ default: m.SponsorProfilePage })),
);
const TicketsPage = lazy(() =>
  import('@/features/public/pages/TicketsPage').then((m) => ({ default: m.TicketsPage })),
);
const BookingsPage = lazy(() =>
  import('@/features/public/pages/BookingsPage').then((m) => ({ default: m.BookingsPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/public/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const BookingDetailPage = lazy(() =>
  import('@/features/public/pages/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage })),
);
const CheckoutPage = lazy(() =>
  import('@/features/public/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const ClaimTicketPage = lazy(() =>
  import('@/features/public/pages/ClaimTicketPage').then((m) => ({ default: m.ClaimTicketPage })),
);
const FeedbackPage = lazy(() =>
  import('@/features/public/pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })),
);
const OrganizerPage = lazy(() =>
  import('@/features/public/pages/OrganizerPage').then((m) => ({ default: m.OrganizerPage })),
);
const TermsPage = lazy(() =>
  import('@/features/public/pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('@/features/public/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const HelpCenterPage = lazy(() =>
  import('@/features/public/pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })),
);
const ContactSupportPage = lazy(() =>
  import('@/features/public/pages/ContactSupportPage').then((m) => ({ default: m.ContactSupportPage })),
);
const GetStartedPage = lazy(() =>
  import('@/features/public/pages/GetStartedPage').then((m) => ({ default: m.GetStartedPage })),
);
const AttendeeHubPage = lazy(() =>
  import('@/features/public/pages/AttendeeHubPage').then((m) => ({ default: m.AttendeeHubPage })),
);

function RootLandingOrHub() {
  const slug = currentTenantSlug();
  if (slug) {
    return <EventListPage />;
  }
  return <TenantLandingPage />;
}

function TenantUniversalRedirect({ path }: { path: string }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(getRootDomainUrl(path));
    }
  }, [path]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-mono text-xs text-muted-foreground">Redirecting to Attendee Hub...</p>
      </div>
    </div>
  );
}

export default function PublicRoutes() {
  const onTenant = isTenantSubdomain();

  return (
    <Routes>
      {authRoutes({ allowRegister: true })}
      <Route path="get-started" element={<GetStartedPage />} />
      <Route element={<PublicLayout />}>
        <Route index element={<RootLandingOrHub />} />
        <Route
          path="hub"
          element={
            onTenant ? (
              <TenantUniversalRedirect path="/hub" />
            ) : (
              <ProtectedRoute allow={authenticated}>
                <AttendeeHubPage />
              </ProtectedRoute>
            )
          }
        />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="performers/:slug" element={<PerformerProfilePage />} />
        <Route path="sponsors/:slug" element={<SponsorProfilePage />} />
        <Route path="claim" element={<ClaimTicketPage />} />
        <Route path="organizer/:slug" element={<OrganizerPage />} />
        <Route path="organizer/:slug/admin" element={<OrganizerPage admin />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="help" element={<HelpCenterPage />} />
        <Route path="contact" element={<ContactSupportPage />} />
        <Route
          path="tickets"
          element={
            onTenant ? (
              <TenantUniversalRedirect path="/tickets" />
            ) : (
              <ProtectedRoute allow={authenticated}>
                <TicketsPage />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="bookings"
          element={
            onTenant ? (
              <TenantUniversalRedirect path="/bookings" />
            ) : (
              <ProtectedRoute allow={authenticated}>
                <BookingsPage />
              </ProtectedRoute>
            )
          }
        />
        <Route path="my-bookings" element={<Navigate to="/bookings" replace />} />
        <Route path="my-tickets" element={<Navigate to="/tickets" replace />} />
        <Route
          path="bookings/:bookingsId"
          element={
            <ProtectedRoute allow={authenticated}>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout/:bookingsId"
          element={
            <ProtectedRoute allow={authenticated}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="feedback"
          element={
            onTenant ? (
              <TenantUniversalRedirect path="/feedback" />
            ) : (
              <ProtectedRoute allow={authenticated}>
                <FeedbackPage />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="profile"
          element={
            onTenant ? (
              <TenantUniversalRedirect path="/profile" />
            ) : (
              <ProtectedRoute allow={authenticated}>
                <ProfilePage />
              </ProtectedRoute>
            )
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
