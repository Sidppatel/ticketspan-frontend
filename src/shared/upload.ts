import axios from 'axios';
import { BACKEND_URL } from '@/shared/apiClient';
import { getAccessToken } from '@/shared/auth/store';

export interface UploadResult {
  imagesId: string;
  storageKey: string;
}

export function imageUrl(imagesId: string): string {
  return `${BACKEND_URL}/images/${imagesId}`;
}

export async function uploadImage(
  file: File,
  entityType: string,
  entityId: string,
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('entityType', entityType);
  form.append('entityId', entityId);

  const token = getAccessToken();
  const response = await axios.post<UploadResult>(`${BACKEND_URL}/uploads/images`, form, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}
