import { act,renderHook } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { useToggle } from './useToggle';

describe('useToggle', () => {
  it('returns false by default', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('accepts a custom initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('toggle flips the value', () => {
    const { result } = renderHook(() => useToggle());
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('setTrue always sets to true', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);
  });

  it('setFalse always sets to false', () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => result.current[3]());
    expect(result.current[0]).toBe(false);
    act(() => result.current[3]());
    expect(result.current[0]).toBe(false);
  });

  it('returns stable callback references', () => {
    const { result, rerender } = renderHook(() => useToggle());
    const [, toggle1, setTrue1, setFalse1] = result.current;
    rerender();
    const [, toggle2, setTrue2, setFalse2] = result.current;
    expect(toggle1).toBe(toggle2);
    expect(setTrue1).toBe(setTrue2);
    expect(setFalse1).toBe(setFalse2);
  });
});
