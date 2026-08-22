import { httpGet, httpPost } from './httpClient';
import type {
  AckEnvelope,
  ApiEnvelope,
  BookingDetailApiResponse,
  CreateBookingApiResponse,
  CreatePaymentIntentApiRequest,
  LockTableApiRequest,
  PaymentIntentApiResponse,
  ReserveCapacityApiRequest,
} from './types';

export const bookingsApi = {
  reserveCapacity(payload: ReserveCapacityApiRequest): Promise<ApiEnvelope<CreateBookingApiResponse>> {
    return httpPost<ApiEnvelope<CreateBookingApiResponse>, ReserveCapacityApiRequest>(
      '/api/v1/bookings/reserve',
      payload,
    );
  },

  lockTable(payload: LockTableApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, LockTableApiRequest>('/api/v1/bookings/tables/lock', payload);
  },

  releaseTable(payload: LockTableApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, LockTableApiRequest>('/api/v1/bookings/tables/release', payload);
  },

  createPaymentIntent(payload: CreatePaymentIntentApiRequest): Promise<ApiEnvelope<PaymentIntentApiResponse>> {
    return httpPost<ApiEnvelope<PaymentIntentApiResponse>, CreatePaymentIntentApiRequest>(
      '/api/v1/bookings/payment-intent',
      payload,
    );
  },

  getBooking(bookingId: string): Promise<ApiEnvelope<BookingDetailApiResponse>> {
    return httpGet<ApiEnvelope<BookingDetailApiResponse>>(`/api/v1/bookings/${bookingId}`);
  },
};
