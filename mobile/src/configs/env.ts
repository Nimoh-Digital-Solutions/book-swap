const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const env = {
  apiUrl: API_URL,
  wsUrl: API_URL.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws'),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  environment: (process.env.EXPO_PUBLIC_ENV || 'development') as 'development' | 'staging' | 'production',
} as const;
