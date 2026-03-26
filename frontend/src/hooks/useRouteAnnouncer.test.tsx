import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRouteAnnouncer } from './useRouteAnnouncer';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useRouteAnnouncer', () => {
  it('focuses #main-content on mount', () => {
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.appendChild(main);
    const focusSpy = vi.spyOn(main, 'focus');

    renderHook(() => useRouteAnnouncer(), { wrapper });

    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    document.body.removeChild(main);
  });

  it('does not throw when #main-content is absent', () => {
    expect(() => {
      renderHook(() => useRouteAnnouncer(), { wrapper });
    }).not.toThrow();
  });
});
