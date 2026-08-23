import { httpGet, httpPost, httpDelete } from './httpClient';
import type {
  AckEnvelope,
  ApiEnvelope,
  SavedPaymentMethodDto,
  SetupIntentApiResponse,
} from './types';

export const paymentsApi = {
  getSavedMethods(): Promise<ApiEnvelope<SavedPaymentMethodDto[]>> {
    return httpGet<ApiEnvelope<SavedPaymentMethodDto[]>>('/api/v1/payments/saved-methods');
  },

  createSetupIntent(): Promise<ApiEnvelope<SetupIntentApiResponse>> {
    return httpPost<ApiEnvelope<SetupIntentApiResponse>>('/api/v1/payments/setup-intent');
  },

  deleteSavedMethod(paymentMethodId: string): Promise<AckEnvelope> {
    return httpDelete<AckEnvelope>(`/api/v1/payments/saved-methods/${paymentMethodId}`);
  },
};
