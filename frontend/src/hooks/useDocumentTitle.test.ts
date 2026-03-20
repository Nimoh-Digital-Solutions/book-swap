import { renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it } from 'vitest';

import { useDocumentTitle } from './useDocumentTitle';

// APP_CONFIG.appName falls back to 'React Starter Kit' when VITE_APP_TITLE is not set.
const APP_NAME = 'React Starter Kit';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = originalTitle;
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document.title with the page title and app name on mount', () => {
    renderHook(() => useDocumentTitle('Home'));

    expect(document.title).toBe(`Home | ${APP_NAME}`);
  });

  it('updates document.title when the title argument changes', () => {
    const { rerender } = renderHook(({ title }: { title: string }) => useDocumentTitle(title), {
      initialProps: { title: 'Home' },
    });

    expect(document.title).toBe(`Home | ${APP_NAME}`);

    rerender({ title: 'About' });

    expect(document.title).toBe(`About | ${APP_NAME}`);
  });

  it('restores the previous document.title on unmount', () => {
    const prev = 'Previous Page Title';
    document.title = prev;

    const { unmount } = renderHook(() => useDocumentTitle('Contact'));

    expect(document.title).toBe(`Contact | ${APP_NAME}`);

    unmount();

    expect(document.title).toBe(prev);
  });
});
