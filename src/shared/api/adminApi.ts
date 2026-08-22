import { httpGet, httpPost, httpPut } from './httpClient';
import type {
  AckEnvelope,
  AdminDashboardApiResponse,
  ApiEnvelope,
  ChangeEventStatusApiRequest,
  CreateAdminEventApiRequest,
  CreateAdminEventApiResponse,
  ReportSummaryApiResponse,
  TimeseriesPointDto,
  UpdateAdminEventApiRequest,
} from './types';

export interface ReportSummaryParams {
  from?: number;
  to?: number;
}

export interface TimeseriesParams {
  from?: number;
  to?: number;
  bucket?: string;
}

export const adminApi = {
  getDashboard(): Promise<ApiEnvelope<AdminDashboardApiResponse>> {
    return httpGet<ApiEnvelope<AdminDashboardApiResponse>>('/api/v1/admin/dashboard');
  },

  createEvent(payload: CreateAdminEventApiRequest): Promise<ApiEnvelope<CreateAdminEventApiResponse>> {
    return httpPost<ApiEnvelope<CreateAdminEventApiResponse>, CreateAdminEventApiRequest>(
      '/api/v1/admin/events',
      payload,
    );
  },

  updateEvent(id: string, payload: UpdateAdminEventApiRequest): Promise<AckEnvelope> {
    return httpPut<AckEnvelope, UpdateAdminEventApiRequest>(`/api/v1/admin/events/${id}`, payload);
  },

  changeEventStatus(id: string, payload: ChangeEventStatusApiRequest): Promise<AckEnvelope> {
    return httpPost<AckEnvelope, ChangeEventStatusApiRequest>(`/api/v1/admin/events/${id}/status`, payload);
  },

  getReportSummary(params?: ReportSummaryParams): Promise<ApiEnvelope<ReportSummaryApiResponse>> {
    return httpGet<ApiEnvelope<ReportSummaryApiResponse>>('/api/v1/admin/reports/summary', { params });
  },

  getRevenueTimeseries(params?: TimeseriesParams): Promise<ApiEnvelope<TimeseriesPointDto[]>> {
    return httpGet<ApiEnvelope<TimeseriesPointDto[]>>('/api/v1/admin/reports/timeseries', { params });
  },
};
