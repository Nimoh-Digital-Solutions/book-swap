// Common type definitions used throughout the application

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export type Theme = 'light' | 'dark';
