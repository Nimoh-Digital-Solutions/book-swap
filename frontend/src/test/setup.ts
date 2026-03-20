import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

import { server } from './mocks/server';

import '@testing-library/jest-dom';
// ---------------------------------------------------------------------------
// i18n — use inline English translations in tests (no HTTP backend needed)
// ---------------------------------------------------------------------------
import './i18n';

// ---------------------------------------------------------------------------
// MSW — intercept network for all tests with default handlers
// ---------------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// window.matchMedia mock
// jsdom does not implement matchMedia. This stub prevents crashes in any
// component or hook that calls window.matchMedia (e.g. ThemeProvider).
// ---------------------------------------------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset localStorage before each test to prevent state leaking between tests.
// Spy on console.warn and console.error so individual tests can assert against
// unexpected output and CI logs are not contaminated by library warnings.
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn');
  vi.spyOn(console, 'error');
});

// Cleanup React tree and clear all mock state after each test case.
// Clearing mocks prevents call-count/implementation bleed between tests.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
