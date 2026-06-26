import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import type { RpcInterceptor } from '@protobuf-ts/runtime-rpc';
import { getAccessToken } from '@/shared/auth/store';
import { currentTenantSlug } from '@/shared/subdomain';
import { AuthServiceClient } from '@/shared/proto/auth.client';
import { TenantServiceClient } from '@/shared/proto/tenant.client';
import { EventServiceClient } from '@/shared/proto/event.client';
import {
  VenueServiceClient,
  PerformerServiceClient,
  SponsorServiceClient,
} from '@/shared/proto/catalog.client';
import { TableBookingServiceClient } from '@/shared/proto/booking.client';
import {
  BookingServiceClient,
  TicketServiceClient,
  CheckInServiceClient,
} from '@/shared/proto/bookings.client';
import {
  DashboardServiceClient,
  FinancialServiceClient,
  StaffServiceClient,
  InvitationServiceClient,
  LogServiceClient,
  FeedbackServiceClient,
  HealthServiceClient,
} from '@/shared/proto/admin.client';
import { EnumServiceClient } from '@/shared/proto/enums.client';
import { FeeServiceClient } from '@/shared/proto/fees.client';
import { PricingServiceClient } from '@/shared/proto/pricing.client';
import { FloorPlanServiceClient } from '@/shared/proto/floorplan.client';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:60262';

const authInterceptor: RpcInterceptor = {
  interceptUnary(next, method, input, options) {
    const token = getAccessToken();
    if (token) {
      options.meta = { ...options.meta, Authorization: `Bearer ${token}` };
    }
    return next(method, input, options);
  },
};

const tenantInterceptor: RpcInterceptor = {
  interceptUnary(next, method, input, options) {
    const slug = currentTenantSlug();
    if (slug) {
      options.meta = { ...options.meta, 'x-tenant-slug': slug };
    }
    return next(method, input, options);
  },
};

export const transport = new GrpcWebFetchTransport({
  baseUrl: BACKEND_URL,
  format: 'binary',
  interceptors: [authInterceptor, tenantInterceptor],
});

export const authClient = new AuthServiceClient(transport);
export const tenantClient = new TenantServiceClient(transport);
export const eventClient = new EventServiceClient(transport);
export const venueClient = new VenueServiceClient(transport);
export const performerClient = new PerformerServiceClient(transport);
export const sponsorClient = new SponsorServiceClient(transport);
export const tableBookingClient = new TableBookingServiceClient(transport);
export const bookingClient = new BookingServiceClient(transport);
export const ticketClient = new TicketServiceClient(transport);
export const checkInClient = new CheckInServiceClient(transport);
export const dashboardClient = new DashboardServiceClient(transport);
export const financialClient = new FinancialServiceClient(transport);
export const staffClient = new StaffServiceClient(transport);
export const invitationClient = new InvitationServiceClient(transport);
export const logClient = new LogServiceClient(transport);
export const feedbackClient = new FeedbackServiceClient(transport);
export const healthClient = new HealthServiceClient(transport);
export const enumClient = new EnumServiceClient(transport);
export const feeClient = new FeeServiceClient(transport);
export const pricingClient = new PricingServiceClient(transport);
export const floorPlanClient = new FloorPlanServiceClient(transport);
