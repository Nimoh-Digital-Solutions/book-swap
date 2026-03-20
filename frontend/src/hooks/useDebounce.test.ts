import { act,renderHook } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update within the delay window', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');
  });

  it('updates after the delay has elapsed', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });
    expect(result.current).toBe('b');
  });

  it('resets the timer when the value changes rapidly', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    rerender({ value: 'd' });
    await act(async () => { await new Promise(r => setTimeout(r, 60)); });
    // Only the final value should be committed
    expect(result.current).toBe('d');
  });
});
