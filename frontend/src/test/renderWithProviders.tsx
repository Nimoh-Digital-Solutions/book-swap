import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

import { ThemeProvider } from '@contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import i18n from 'i18next';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route entries for MemoryRouter. Default ['/'] */
  routerProps?: MemoryRouterProps | undefined;
  /** Provide a custom QueryClient. A fresh no-retry client is created by default. */
  queryClientOverride?: QueryClient | undefined;
}

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

/**
 * Creates the full provider tree matching the real App.
 * Each call instantiates a fresh QueryClient so tests don't share cache.
 */
function createWrapper({
  routerProps,
  queryClientOverride,
}: Pick<RenderWithProvidersOptions, 'routerProps' | 'queryClientOverride'>) {
  const client =
    queryClientOverride ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter {...routerProps}>
            <ThemeProvider>{children}</ThemeProvider>
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * `renderWithProviders`
 *
 * Drop-in replacement for RTL's `render` that wraps the component under test
 * with the same provider stack the real app uses:
 *
 *   QueryClientProvider → I18nextProvider → MemoryRouter → ThemeProvider
 *
 * @example
 * ```ts
 * const { getByText } = renderWithProviders(<MyPage />, {
 *   routerProps: { initialEntries: ['/dashboard'] },
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { routerProps, queryClientOverride, ...renderOptions } = options;

  return render(ui, {
    wrapper: createWrapper({ routerProps, queryClientOverride }),
    ...renderOptions,
  });
}
