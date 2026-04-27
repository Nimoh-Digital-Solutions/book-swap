import { env } from '@/configs/env';

const API_HOST = env.apiUrl.replace(/\/api\/v1\/?$/, '');

/**
 * Ensures a media URL is absolute.
 * Handles relative paths from backend REST / WebSocket that omit the host.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
}
