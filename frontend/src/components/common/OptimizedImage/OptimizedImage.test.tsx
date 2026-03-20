import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { OptimizedImage } from './OptimizedImage';

expect.extend(toHaveNoViolations);

// jsdom does not provide IntersectionObserver — provide a minimal stub
beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('OptimizedImage', () => {
  it('renders an img element with the correct src and alt', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" lazy={false} />);
    const img = screen.getByRole('img', { name: 'Test image' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('sets loading="lazy" by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Lazy image" />);
    const img = screen.getByRole('img', { name: 'Lazy image' });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('sets loading="eager" when lazy is false', () => {
    render(<OptimizedImage src="/test.jpg" alt="Eager image" lazy={false} />);
    const img = screen.getByRole('img', { name: 'Eager image' });
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('sets decoding="async"', () => {
    render(<OptimizedImage src="/test.jpg" alt="Async decode" />);
    const img = screen.getByRole('img', { name: 'Async decode' });
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('includes width and height when provided', () => {
    render(
      <OptimizedImage src="/test.jpg" alt="Sized image" width={800} height={600} />,
    );
    const img = screen.getByRole('img', { name: 'Sized image' });
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('renders a <picture> element with sources when provided', () => {
    const { container } = render(
      <OptimizedImage
        src="/test.jpg"
        alt="Multi-format"
        lazy={false}
        sources={[
          { src: '/test.avif', type: 'image/avif' },
          { src: '/test.webp', type: 'image/webp' },
        ]}
      />,
    );
    const picture = container.querySelector('picture');
    expect(picture).toBeInTheDocument();
    const sources = container.querySelectorAll('source');
    expect(sources).toHaveLength(2);
    expect(sources[0]).toHaveAttribute('type', 'image/avif');
    expect(sources[1]).toHaveAttribute('type', 'image/webp');
  });

  it('renders without <picture> when no sources are provided', () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Simple" lazy={false} />,
    );
    expect(container.querySelector('picture')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <OptimizedImage src="/test.jpg" alt="Accessible image" width={400} height={300} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports decorative images with empty alt', async () => {
    const { container } = render(
      <OptimizedImage src="/decoration.jpg" alt="" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
