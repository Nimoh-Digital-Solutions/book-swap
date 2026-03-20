import type { ReactNode } from 'react';
import { createElement } from 'react';

import { ThemeProvider } from '@contexts/ThemeContext';
import { act,renderHook } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { useTheme } from './useTheme';

function makeWrapper(defaultTheme?: 'light' | 'dark' | 'dim') {
  function Wrapper({ children }: { children: ReactNode }) {
    return defaultTheme
      ? createElement(ThemeProvider, { defaultTheme }, children)
      : createElement(ThemeProvider, null, children);
  }
  return Wrapper;
}

describe('useTheme', () => {
  it('returns the current theme from ThemeContext', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper('light') });

    expect(result.current.theme).toBe('light');
  });

  it('isDark is true when theme is dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper('dark') });

    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
  });

  it('isLight is true when theme is light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper('light') });

    expect(result.current.isLight).toBe(true);
    expect(result.current.isDark).toBe(false);
  });

  it('toggleTheme cycles light → dim → dark → light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper('light') });

    expect(result.current.theme).toBe('light');

    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dim');
    expect(result.current.isDark).toBe(false);

    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);

    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('light');
    expect(result.current.isLight).toBe(true);
  });

  it('setTheme sets the theme to the given value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: makeWrapper('light') });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isLight).toBe(true);
  });
});
