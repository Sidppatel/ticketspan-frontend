import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/shared/auth/store';
import { currentTenantSlug } from '@/shared/subdomain';
import { getActingTenant } from '@/shared/actingTenant';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5262';

function createAxiosClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Version': '1.0',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const slug = currentTenantSlug();
    if (slug) {
      config.headers['x-tenant-slug'] = slug;
    }

    const { tenantsId, notifyTenant } = getActingTenant();
    if (tenantsId) {
      config.headers['x-acting-tenant'] = tenantsId;
      config.headers['x-notify-tenant'] = notifyTenant ? '1' : '0';
    }

    return config;
  });

  return instance;
}

export const httpClient = createAxiosClient();

export async function httpGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.get<T>(url, config);
  return response.data;
}

export async function httpPost<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.post<T>(url, body, config);
  return response.data;
}

export async function httpPut<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.put<T>(url, body, config);
  return response.data;
}

export async function httpDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.delete<T>(url, config);
  return response.data;
}
