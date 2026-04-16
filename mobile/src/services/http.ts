import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/lib/storage';
import { captureException, addBreadcrumb } from '@/lib/sentry';
import { showErrorToast } from '@/components/Toast';
import { useAuthStore } from '@/stores/authStore';
import { env } from '@/configs/env';
import i18next from '@/lib/i18n';

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'User-Agent': 'BookSwap-Mobile/1.0',
  },
});

// Circuit breaker
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;
let consecutiveServerErrors = 0;
let circuitOpenUntil = 0;
type CircuitListener = (degraded: boolean) => void;
const circuitListeners = new Set<CircuitListener>();

function notifyCircuitListeners(degraded: boolean) {
  circuitListeners.forEach((fn) => fn(degraded));
}

function recordServerError() {
  consecutiveServerErrors++;
  if (consecutiveServerErrors >= CIRCUIT_THRESHOLD && Date.now() >= circuitOpenUntil) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    addBreadcrumb('circuit-breaker', 'Circuit opened', { errors: consecutiveServerErrors });
    notifyCircuitListeners(true);
    setTimeout(() => notifyCircuitListeners(false), CIRCUIT_COOLDOWN_MS);
  }
}

function recordSuccess() {
  if (consecutiveServerErrors > 0) {
    consecutiveServerErrors = 0;
    if (Date.now() < circuitOpenUntil) {
      circuitOpenUntil = 0;
      notifyCircuitListeners(false);
    }
  }
}

export function isServerDegraded(): boolean {
  return Date.now() < circuitOpenUntil;
}

export function subscribeCircuit(fn: CircuitListener): () => void {
  circuitListeners.add(fn);
  return () => {
    circuitListeners.delete(fn);
  };
}

// Request interceptor
http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

function showGlobalErrorToast(key: string) {
  showErrorToast(i18next.t(key));
}

http.interceptors.response.use(
  (response) => {
    recordSuccess();
    return response;
  },
  async (error: AxiosError) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      showGlobalErrorToast('common.error');
      return Promise.reject(error);
    }
    const status = error.response?.status;
    // 429 retry
    if (status === 429) {
      const retryAfter = Number(error.response?.headers?.['retry-after']) || 2;
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
      const retryCount = originalRequest._retryCount ?? 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return http(originalRequest);
      }
      return Promise.reject(error);
    }
    // 5xx circuit breaker
    if (status && status >= 500) {
      recordServerError();
      showGlobalErrorToast('common.error');
      return Promise.reject(error);
    }
    // 401 refresh
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || originalRequest._retry) return Promise.reject(error);
    if (originalRequest.url?.includes('/auth/token/refresh/')) return Promise.reject(error);
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return http(originalRequest);
      });
    }
    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post(`${env.apiUrl}/auth/token/refresh/`, { refresh: refreshToken }, {
        headers: { 'X-Client-Type': 'mobile' },
      });
      const newAccess = data.access as string;
      const newRefresh = (data.refresh as string) || refreshToken;
      tokenStorage.setTokens(newAccess, newRefresh);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      try {
        const { wsManager } = await import('@/services/websocket');
        wsManager.reconnectWithNewToken();
      } catch {
        /* ws may not be loaded */
      }
      processQueue(null, newAccess);
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      captureException(refreshError, { context: '401_refresh_failure' });
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
