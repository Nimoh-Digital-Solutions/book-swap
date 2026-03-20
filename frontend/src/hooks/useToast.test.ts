import { act,renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('starts with an empty toast list', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('addToast', () => {
    it('adds a toast to the list', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Hello world', 'success');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        message: 'Hello world',
        variant: 'success',
      });
    });

    it('defaults to variant "info"', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Info toast');
      });

      expect(result.current.toasts[0]!.variant).toBe('info');
    });

    it('returns an id string', () => {
      const { result } = renderHook(() => useToast());

      let id!: string;
      act(() => {
        id = result.current.addToast('Test');
      });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('auto-dismisses after the given duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Bye', 'info', 3000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(3001);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not auto-dismiss when duration is 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Persistent', 'warning', 0);
      });

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('dismissToast', () => {
    it('removes the toast with the matching id', () => {
      const { result } = renderHook(() => useToast());

      let id!: string;
      act(() => {
        id = result.current.addToast('Remove me', 'error', 0);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismissToast(id);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not remove other toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('Keep', 'success', 0);
        result.current.addToast('Remove', 'error', 0);
      });

      const idToRemove = result.current.toasts[1]!.id;

      act(() => {
        result.current.dismissToast(idToRemove);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]!.message).toBe('Keep');
    });
  });
});
