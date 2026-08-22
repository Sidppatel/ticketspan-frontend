export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message?: string | null;
}

export interface PagedEnvelope<T> {
  success: boolean;
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AckEnvelope {
  success: boolean;
  message: string;
  code: number;
}

export interface LoginApiRequest {
  email: string;
  password: string;
  tenantSlug?: string | null;
  portal?: string | null;
}

export interface SignUpApiRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug: string;
}

export interface GoogleAuthApiRequest {
  googleToken: string;
  tenantSlug?: string | null;
  portal?: string | null;
}

export interface MagicLinkRequestApiRequest {
  email: string;
  tenantSlug?: string | null;
  portal?: string | null;
}

export interface VerifyMagicLinkApiRequest {
  token: string;
}

export interface PasswordResetRequestApiRequest {
  email: string;
  tenantSlug?: string | null;
}

export interface PasswordResetConfirmApiRequest {
  token: string;
  newPassword: string;
}

export interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  usersId: string;
  tenantsId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
  tenantSlug: string;
  emailVerified: boolean;
}

export interface UserProfileApiResponse {
  usersId: string;
  tenantsId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: number;
  emailVerified: boolean;
}

export interface EventSummaryDto {
  eventsId: string;
  tenantsId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: string;
  category: string;
  startDate: number;
  endDate: number;
  imagePath: string;
  heroBackdropImageId: string;
  posterImageId: string;
  isFeatured: boolean;
  layoutMode: string;
  eventType: string;
  venuesId: string;
  totalCapacity: number;
  isVerifiedOrganizer: boolean;
  urgencyBadgeText: string;
}

export interface EventDetailDto {
  eventsId: string;
  tenantsId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  storyDescription: string;
  status: string;
  category: string;
  startDate: number;
  endDate: number;
  imagePath: string;
  heroBackdropImageId: string;
  posterImageId: string;
  isFeatured: boolean;
  layoutMode: string;
  eventType: string;
  venuesId: string;
  totalCapacity: number;
  feesIncluded: boolean;
  achEnabled: boolean;
  venueCombinedTaxRate: number;
  isVerifiedOrganizer: boolean;
  urgencyBadgeText: string;
  performersJson: string;
  sponsorsJson: string;
  extraInfoJson: string;
}

export interface TicketTypeDto {
  eventTicketTypesId: string;
  label: string;
  priceCents: number;
  sellingPriceCents: number;
  capacity: number;
  soldCount: number;
  maxQuantity: number;
  description: string;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
}

export interface TableDto {
  tablesId: string;
  eventTablesId: string;
  label: string;
  capacityOverride: number;
  priceCents: number;
  status: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  shapeOverride: string;
  colorOverride: string;
}

export interface ScheduleItemDto {
  scheduleItemsId: string;
  eventsId: string;
  title: string;
  typeCategory: string;
  startTime: number;
  endTime: number;
}

export interface ReserveCapacityApiRequest {
  eventsId: string;
  eventTicketTypesId: string;
  seats: number;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
}

export interface CreateBookingApiResponse {
  bookingsId: string;
  bookingNumber: string;
}

export interface LockTableApiRequest {
  tablesId: string;
}

export interface CreatePaymentIntentApiRequest {
  bookingsId: string;
  preferredMethod?: string | null;
}

export interface PaymentIntentApiResponse {
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  status: string;
  amountCents: number;
  holdExpiresAt: number;
  achAllowed: boolean;
}

export interface BookingLineDto {
  bookingLinesId: string;
  kind: string;
  label: string;
  eventTicketTypesId: string;
  tablesId: string;
  seats: number;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  basePriceCents: number;
  sellingPriceCents: number;
  discountCents: number;
  appliedRuleName: string;
  platformFeeCents: number;
  gatewayFeeCents: number;
  taxCents: number;
  finalPriceCents: number;
  currency: string;
}

export interface BookingDetailApiResponse {
  bookingsId: string;
  tenantsId: string;
  bookingNumber: string;
  status: string;
  usersId: string;
  eventsId: string;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  seatsReserved: number;
  eventTitle: string;
  eventSlug: string;
  eventStartDate: number;
  ticketsTotal: number;
  ticketsClaimed: number;
  paymentTransactionId: string;
  feesIncluded: boolean;
  venueName: string;
  venueAddress: string;
  paidAt: number;
  taxCents: number;
  serviceFeeCents: number;
  venueZip: string;
  venueCity: string;
  venueState: string;
  paymentMethodType: string;
  paymentMethodLast4: string;
  paymentMethodBrand: string;
  userEmail: string;
  userName: string;
  lines: BookingLineDto[];
}

export interface DigitalTicketDto {
  ticketsId: string;
  ticketCode: string;
  qrToken: string;
  seatNumber: number;
  status: string;
  guestUsersId: string;
  eventTitle: string;
  eventStartDate: number;
  venueName: string;
  eventSlug: string;
  bookingNumber: string;
  ticketTypeLabel: string;
  invitedEmail: string;
  inviteSentAt: number;
}

export interface InviteTicketApiRequest {
  ticketsId: string;
  email: string;
}

export interface ScanTicketApiRequest {
  eventsId: string;
  qrToken: string;
}

export interface ScanTicketApiResponse {
  valid: boolean;
  message: string;
  holderName: string;
  status: string;
}

export interface ManualCheckInApiRequest {
  eventsId: string;
  codeOrId: string;
  type?: string;
}

export interface CheckInStatsApiResponse {
  total: number;
  checkedIn: number;
  remaining: number;
}

export interface StaffAssignedEventDto {
  eventsId: string;
  title: string;
  slug: string;
  startDate: number;
  endDate: number;
  status: string;
  venueName: string;
}

export interface GuestTicketDto {
  ticketsId: string;
  ticketCode: string;
  guestName: string;
  status: string;
  seatNumber: number;
  checkedInAt: number;
}

export interface GuestBookingDto {
  bookingsId: string;
  bookingNumber: string;
  buyerName: string;
  status: string;
  tickets: GuestTicketDto[];
}

export interface VenueDto {
  venuesId: string;
  name: string;
  description: string;
  imagePath: string;
  phone: string;
  email: string;
  website: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  combinedTaxRate: number;
}

export interface PerformerDto {
  performersId: string;
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  isActive: boolean;
}

export interface SponsorDto {
  sponsorsId: string;
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  isActive: boolean;
}

export interface PublicLinkedEventDto {
  eventsId: string;
  title: string;
  slug: string;
  startDate: number;
  primaryImagePath: string;
  category: string;
}

export interface PublicPerformerDto {
  performersId: string;
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  events: PublicLinkedEventDto[];
}

export interface PublicSponsorDto {
  sponsorsId: string;
  name: string;
  slug: string;
  primaryImagePath: string;
  metaJson: string;
  events: PublicLinkedEventDto[];
}

export interface AdminDashboardApiResponse {
  totalEvents: number;
  activeEvents: number;
  totalRevenueCents: number;
  totalAttendees: number;
}

export interface CreateAdminEventApiRequest {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  storyDescription?: string;
  status?: string;
  category?: string;
  startDate: number;
  endDate: number;
  imagePath?: string;
  heroBackdropImageId?: string;
  posterImageId?: string;
  isFeatured: boolean;
  layoutMode?: string;
  eventType?: string;
  venuesId: string;
  isVerifiedOrganizer: boolean;
  urgencyBadgeText?: string;
}

export interface CreateAdminEventApiResponse {
  eventsId: string;
}

export interface UpdateAdminEventApiRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  storyDescription?: string;
  category?: string;
  startDate: number;
  endDate: number;
  imagePath?: string;
  heroBackdropImageId?: string;
  posterImageId?: string;
  isFeatured: boolean;
  venuesId?: string;
  eventType?: string;
  isVerifiedOrganizer: boolean;
  urgencyBadgeText?: string;
}

export interface ChangeEventStatusApiRequest {
  status: string;
}

export interface ReportSummaryApiResponse {
  revenueCents: number;
  orders: number;
  ticketsSold: number;
  averageOrderCents: number;
  visits: number;
  conversionBps: number;
  refundedCents: number;
  refundedOrders: number;
  netRevenueCents: number;
  serviceFeeCents: number;
  taxCents: number;
}

export interface TimeseriesPointDto {
  bucketStartEpochSeconds: number;
  revenueCents: number;
  orders: number;
  ticketsSold: number;
}
