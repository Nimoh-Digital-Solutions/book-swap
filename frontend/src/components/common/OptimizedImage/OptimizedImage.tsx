import { type ImgHTMLAttributes, type ReactElement, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageSource {
  /** Image URL or path. */
  src: string;
  /** MIME type (e.g. 'image/webp', 'image/avif'). */
  type: string;
}

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  /** Primary image `src` (fallback format, e.g. PNG/JPG). */
  src: string;
  /** Required for accessibility — empty string for decorative images. */
  alt: string;
  /** Optional modern-format `<source>` entries for `<picture>`. */
  sources?: ImageSource[];
  /** Responsive `sizes` attribute for viewport-based selection. */
  sizes?: string;
  /** Responsive `srcSet` for resolution/viewport-based selection. */
  srcSet?: string;
  /** Pixel width hint for layout shift prevention. */
  width?: number;
  /** Pixel height hint for layout shift prevention. */
  height?: number;
  /** Use IntersectionObserver-based lazy loading. Default `true`. */
  lazy?: boolean;
  /** Root margin for IntersectionObserver. Default `'200px'`. */
  rootMargin?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * OptimizedImage — progressive, accessible image component.
 *
 * Features:
 * - Native `loading="lazy"` with IntersectionObserver fallback
 * - `<picture>` element with modern format sources (WebP/AVIF)
 * - Explicit `width`/`height` to prevent Cumulative Layout Shift
 * - `decoding="async"` for non-blocking decode
 * - Accessible: requires `alt` (empty string for decorative images)
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Mountain landscape"
 *   sources={[
 *     { src: '/images/hero.avif', type: 'image/avif' },
 *     { src: '/images/hero.webp', type: 'image/webp' },
 *   ]}
 *   width={1200}
 *   height={600}
 *   sizes="(max-width: 768px) 100vw, 1200px"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  sources,
  sizes,
  srcSet,
  width,
  height,
  lazy = true,
  rootMargin = '200px',
  className,
  ...rest
}: OptimizedImageProps): ReactElement {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || isVisible) return;

    const el = imgRef.current;
    if (!el) return;

    // If the browser supports native lazy loading, rely on it
    if ('loading' in HTMLImageElement.prototype) {
      setIsVisible(true);
      return;
    }

    // IntersectionObserver fallback for older browsers
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, isVisible, rootMargin]);

  const imgProps = {
    ref: imgRef,
    src: isVisible ? src : undefined,
    srcSet: isVisible ? srcSet : undefined,
    width,
    height,
    sizes,
    loading: lazy ? ('lazy' as const) : ('eager' as const),
    decoding: 'async' as const,
    className,
    ...rest,
  };

  // Wrap with <picture> only when modern-format sources are provided
  if (sources && sources.length > 0) {
    return (
      <picture>
        {isVisible &&
          sources.map((source) => (
            <source key={source.type} srcSet={source.src} type={source.type} />
          ))}
        <img alt={alt} {...imgProps} />
      </picture>
    );
  }

  return <img alt={alt} {...imgProps} />;
}
