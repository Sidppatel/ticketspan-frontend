import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { NotFoundPage } from '@/shared/components/StatusPages';
import { PublicLayout } from '@/shared/components/layouts/PublicLayout';
import { authRoutes, authenticated } from '@/app/authRoutes';
import { EventListPage } from '@/features/public/pages/EventListPage';
import { TenantLandingPage } from '@/features/public/pages/TenantLandingPage';
import { currentTenantSlug } from '@/shared/subdomain';
import { EventDetailPage } from '@/features/public/pages/EventDetailPage';
import { PerformerProfilePage } from '@/features/public/pages/PerformerProfilePage';
import { SponsorProfilePage } from '@/features/public/pages/SponsorProfilePage';
import { TicketsPage } from '@/features/public/pages/TicketsPage';
import { BookingsPage } from '@/features/public/pages/BookingsPage';
import { ProfilePage } from '@/features/public/pages/ProfilePage';
import { BookingDetailPage } from '@/features/public/pages/BookingDetailPage';
import { CheckoutPage } from '@/features/public/pages/CheckoutPage';
import { ClaimTicketPage } from '@/features/public/pages/ClaimTicketPage';
import { FeedbackPage } from '@/features/public/pages/FeedbackPage';
import { OrganizerPage } from '@/features/public/pages/OrganizerPage';
import { TermsPage } from '@/features/public/pages/TermsPage';
import { PrivacyPage } from '@/features/public/pages/PrivacyPage';
import { RefundPolicyPage } from '@/features/public/pages/RefundPolicyPage';
import { HelpCenterPage } from '@/features/public/pages/HelpCenterPage';
import { ContactSupportPage } from '@/features/public/pages/ContactSupportPage';

export default function PublicRoutes() {
  return (
    <Routes>
      {authRoutes({ allowRegister: true })}
      <Route element={<PublicLayout />}>
        <Route index element={currentTenantSlug() ? <EventListPage /> : <TenantLandingPage />} />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="performers/:slug" element={<PerformerProfilePage />} />
        <Route path="sponsors/:slug" element={<SponsorProfilePage />} />
        <Route path="claim" element={<ClaimTicketPage />} />
        <Route path="organizer/:slug" element={<OrganizerPage />} />
        <Route path="organizer/:slug/admin" element={<OrganizerPage admin />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="refund-policy" element={<RefundPolicyPage />} />
        <Route path="help" element={<HelpCenterPage />} />
        <Route path="contact" element={<ContactSupportPage />} />
        <Route
          path="tickets"
          element={
            <ProtectedRoute allow={authenticated}>
              <TicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings"
          element={
            <ProtectedRoute allow={authenticated}>
              <BookingsPage />
            </ProtectedRoute>
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
            <ProtectedRoute allow={authenticated}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute allow={authenticated}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
