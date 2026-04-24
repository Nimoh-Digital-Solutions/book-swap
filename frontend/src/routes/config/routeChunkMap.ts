/**
 * Route chunk prefetch map.
 *
 * Maps route paths to their lazy-import factories so that `<PrefetchLink>`
 * can trigger a chunk prefetch on hover/focus — before the user actually
 * navigates.
 *
 * Each entry is the same dynamic import used by `React.lazy()` in
 * routesConfig.tsx. Calling the factory a second time is a no-op because
 * the browser's module cache de-duplicates the request.
 */
import { PATHS } from './paths';

export const routeChunkMap: Record<string, (() => Promise<unknown>) | undefined> = {
  [PATHS.HOME]: () => import('@pages/HomePage/HomePage'),
  [PATHS.LOGIN]: () => import('@features/auth'),
  [PATHS.REGISTER]: () => import('@features/auth'),
  [PATHS.CATALOGUE]: () => import('@features/discovery'),
  [PATHS.NOT_FOUND]: () => import('@pages/NotFoundPage/NotFoundPage'),
  ...(import.meta.env.DEV
    ? {
        [PATHS.COMPONENTS_DEMO]: () =>
          import('@pages/ComponentsDemoPage/ComponentsDemoPage'),
      }
    : {}),
};
