import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/**
 * MSW server instance for Vitest tests.
 *
 * Started/stopped automatically in src/test/setup.ts.
 * Override handlers per-test with `server.use(...)`.
 */
export const server = setupServer(...handlers);
