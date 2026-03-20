import { useRef } from 'react';

import { fireEvent } from '@testing-library/dom';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('does not fire handler when clicking inside the ref element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    renderHook(() => {
      const ref = useRef(div);
      useClickOutside(ref, handler);
    });

    fireEvent.pointerDown(div);
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('fires handler when clicking outside the ref element', () => {
    const handler = vi.fn();
    const inside = document.createElement('div');
    const outside = document.createElement('div');
    document.body.appendChild(inside);
    document.body.appendChild(outside);

    renderHook(() => {
      const ref = useRef(inside);
      useClickOutside(ref, handler);
    });

    fireEvent.pointerDown(outside);
    expect(handler).toHaveBeenCalledOnce();

    document.body.removeChild(inside);
    document.body.removeChild(outside);
  });

  it('removes listener on unmount', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    const outside = document.createElement('div');
    document.body.appendChild(div);
    document.body.appendChild(outside);

    const { unmount } = renderHook(() => {
      const ref = useRef(div);
      useClickOutside(ref, handler);
    });

    unmount();
    fireEvent.pointerDown(outside);
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
    document.body.removeChild(outside);
  });
});
