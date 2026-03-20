import { renderHook } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  it('returns undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious(42));
    expect(result.current).toBeUndefined();
  });

  it('returns the previous value after a rerender', () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), { initialProps: { v: 1 } });
    rerender({ v: 2 });
    expect(result.current).toBe(1);
  });

  it('lags exactly one render behind', () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), { initialProps: { v: 'a' } });
    rerender({ v: 'b' });
    expect(result.current).toBe('a');
    rerender({ v: 'c' });
    expect(result.current).toBe('b');
  });

  it('works with object values', () => {
    const obj1 = { x: 1 };
    const obj2 = { x: 2 };
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), { initialProps: { v: obj1 } });
    rerender({ v: obj2 });
    expect(result.current).toBe(obj1);
  });
});
