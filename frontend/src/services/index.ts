export { withDeduplication } from './deduplication';
export type {
  ErrorInterceptor,
  HttpClient,
  HttpClientConfig,
  HttpRequestContext,
  PaginatedResponse,
  ProblemDetail,
  RequestInterceptor,
  ResponseInterceptor,
} from './http';
export { http, HttpError } from './http';
export { queryClient } from './queryClient';

// Error parsing & handling
export type { FieldError } from './apiErrors';
export {
  getDrfDetailMessage,
  getErrorMessage,
  getHttpErrorMessage,
  mapProblemToFieldErrors,
  parseDrfFieldErrors,
  parseProblemDetail,
} from './apiErrors';
export type { ErrorHandlerResult } from './errorHandlers';
export {
  handleHttpError,
  notificationErrorInterceptor,
  SUPPRESS_TOAST_HEADER,
} from './errorHandlers';

// WebSocket
export type { UseWebSocketOptions, UseWebSocketReturn } from './useWebSocket';
export { useWebSocket } from './useWebSocket';
export { createWebSocket, WS_CLOSE_CODES } from './websocket';
export type {
  WebSocketHandle,
  WebSocketOptions,
  WsChunkMessage,
  WsCloseCode,
  WsCompleteMessage,
  WsErrorMessage,
  WsMessage,
} from './websocket.types';
