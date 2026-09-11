import { BASE_URL } from '../WebService';

export interface UploadResponse {
  id: string;
  access: string;
}

export function getCdnUrl(url: string | null): string | null {
  if (!url) return null;

  if (url.startsWith(':cdn:')) {
    const data = url.split(':');
    if (data.length != 5) return null;

    const id = data[2];
    const extension = data[3];
    const access = data[4];
    const interval = Math.floor(Date.now() / 604800000);
    return `${BASE_URL}/api/v1/cdn/${id}.${extension}?access=${access}&week=${interval}`;
  }
  return url;
}
