import type { AuthUser } from '@features/auth';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------
// Factories create minimal valid objects with sensible defaults.
// Override any field by passing a partial to the factory.
// ---------------------------------------------------------------------------

let _autoId = 100;

/** Generate a unique auto-incrementing id for test data (UUID-like string). */
export function nextId(): string {
  return `id_${_autoId++}`;
}

/** Reset the auto-incrementing id counter (call in beforeEach if needed). */
export function resetIdCounter(start = 100): void {
  _autoId = start;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const defaultUser: AuthUser = {
  id: 'usr_test_001',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
};

/** Create a mock AuthUser. */
export function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { ...defaultUser, ...overrides };
}

// ---------------------------------------------------------------------------
// DRF Pagination Envelope
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Wrap an array of items in a DRF pagination envelope. */
export function buildPaginatedResponse<T>(
  results: T[],
  overrides: Partial<Omit<PaginatedResponse<T>, 'results'>> = {},
): PaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    ...overrides,
    results,
  };
}
