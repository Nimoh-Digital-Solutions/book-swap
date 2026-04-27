import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BREAKPOINTS, useBreakpoint, useIsBelow } from './useBreakpoint';

function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

const originalWidth = window.innerWidth;

beforeEach(() => {
  setViewportWidth(1280);
});

afterEach(() => {
  setViewportWidth(originalWidth);
});

describe('useBreakpoint', () => {
  it('returns the matching breakpoint at common widths', () => {
    setViewportWidth(320);
    const { result, rerender } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xs');

    act(() => { setViewportWidth(640); });
    rerender();
    expect(result.current).toBe('sm');

    act(() => { setViewportWidth(768); });
    rerender();
    expect(result.current).toBe('md');

    act(() => { setViewportWidth(1024); });
    rerender();
    expect(result.current).toBe('lg');

    act(() => { setViewportWidth(1280); });
    rerender();
    expect(result.current).toBe('xl');

    act(() => { setViewportWidth(1536); });
    rerender();
    expect(result.current).toBe('2xl');
  });

  it('does not rerender when width changes within the same breakpoint', () => {
    setViewportWidth(800);
    let renders = 0;
    renderHook(() => {
      renders++;
      return useBreakpoint();
    });
    const initial = renders;

    act(() => { setViewportWidth(900); });
    act(() => { setViewportWidth(1000); });

    // 800, 900, 1000 are all `md` — no extra render after mount.
    expect(renders).toBe(initial);
  });

  it('rerenders exactly once when crossing a breakpoint boundary', () => {
    setViewportWidth(900);
    let renders = 0;
    renderHook(() => {
      renders++;
      return useBreakpoint();
    });
    const initial = renders;

    act(() => { setViewportWidth(1100); });
    expect(renders).toBe(initial + 1);
  });
});

describe('useIsBelow', () => {
  it('is true when the viewport is below the breakpoint', () => {
    setViewportWidth(500);
    const { result } = renderHook(() => useIsBelow('md'));
    expect(result.current).toBe(true);
  });

  it('is false when the viewport is at or above the breakpoint', () => {
    setViewportWidth(800);
    const { result } = renderHook(() => useIsBelow('md'));
    expect(result.current).toBe(false);
  });
});

describe('BREAKPOINTS', () => {
  it('matches the Tailwind v4 default scale', () => {
    expect(BREAKPOINTS).toEqual({
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    });
  });
});
