const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const ENVIRONMENT = (process.env.EXPO_PUBLIC_ENV || 'development') as 'development' | 'staging' | 'production';

if (ENVIRONMENT !== 'development' && !API_URL.startsWith('https://')) {
  throw new Error(
    `[BookSwap] EXPO_PUBLIC_API_URL must use HTTPS in ${ENVIRONMENT}. Got: ${API_URL}`,
  );
}

export const env = {
  apiUrl: API_URL,
  wsUrl: API_URL.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws'),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  environment: ENVIRONMENT,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
} as const;
