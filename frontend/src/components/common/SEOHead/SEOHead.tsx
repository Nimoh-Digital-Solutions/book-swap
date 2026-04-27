import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { SUPPORTED_LANGUAGES } from '../../../i18n';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://book-swaps.com').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = 'BookSwap';

export interface SEOHeadProps {
  title: string;
  description: string;
  /** Route-relative path WITHOUT the language prefix, e.g. "/browse". Defaults to current pathname minus /:lng. */
  path?: string;
  image?: string;
  /** OG type. Defaults to "website". */
  type?: string;
  /** Arbitrary JSON-LD structured data to inject. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | undefined;
  /** Set to true to prevent indexing (e.g. auth pages). */
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  path: pathOverride,
  image,
  type = 'website',
  jsonLd,
  noIndex = false,
}: SEOHeadProps) {
  const { lng } = useParams<{ lng: string }>();
  const currentLng = lng ?? 'en';

  const routePath = pathOverride ?? '';
  const canonicalUrl = `${SITE_URL}/${currentLng}${routePath}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang alternates */}
      {SUPPORTED_LANGUAGES.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${SITE_URL}/${lang}${routePath}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_URL}/en${routePath}`}
      />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={currentLng} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(jsonLd) ? jsonLd : { '@context': 'https://schema.org', ...jsonLd },
          )}
        </script>
      )}
    </Helmet>
  );
}
