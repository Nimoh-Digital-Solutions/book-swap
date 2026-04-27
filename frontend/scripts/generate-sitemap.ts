/**
 * Sitemap Generator
 *
 * Generates a sitemap.xml covering all public routes x supported languages,
 * plus dynamic book detail pages fetched from the API.
 *
 * Run: npx tsx scripts/generate-sitemap.ts
 * Outputs: public/sitemap.xml
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = process.env.VITE_SITE_URL ?? 'https://book-swaps.com';
const API_URL = process.env.VITE_API_URL ?? 'https://api-stag.book-swaps.com';

const LANGUAGES = ['en', 'fr', 'nl'] as const;

const STATIC_PATHS = [
  '/',
  '/browse',
  '/catalogue',
  '/map',
  '/how-it-works',
  '/community',
  '/privacy-policy',
  '/terms-of-service',
  '/account-deletion',
  '/login',
  '/register',
];

function hreflangLinks(routePath: string): string {
  const links = LANGUAGES.map(
    (lang) => `      <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}/${lang}${routePath}" />`,
  );
  links.push(
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${routePath}" />`,
  );
  return links.join('\n');
}

function urlEntry(routePath: string, priority: string, changefreq: string): string {
  return LANGUAGES.map(
    (lang) => `  <url>
    <loc>${SITE_URL}/${lang}${routePath}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${hreflangLinks(routePath)}
  </url>`,
  ).join('\n');
}

async function fetchBookIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/books/?page_size=2000&fields=id`);
    if (!res.ok) {
      console.warn(`[sitemap] API responded ${res.status} — skipping dynamic book pages`);
      return [];
    }
    const data = (await res.json()) as { results?: Array<{ id: string }> };
    return (data.results ?? []).map((b) => b.id);
  } catch (err) {
    console.warn(`[sitemap] Failed to fetch books — skipping dynamic pages:`, err);
    return [];
  }
}

async function main() {
  console.log('[sitemap] Generating sitemap.xml...');

  const bookIds = await fetchBookIds();
  console.log(`[sitemap] Found ${bookIds.length} books`);

  const staticEntries = STATIC_PATHS.map((p) => {
    const priority = p === '/' ? '1.0' : p === '/browse' || p === '/catalogue' ? '0.8' : '0.6';
    const freq = p === '/' || p === '/browse' || p === '/catalogue' ? 'daily' : 'weekly';
    return urlEntry(p, priority, freq);
  });

  const bookEntries = bookIds.map((id) => urlEntry(`/books/${id}`, '0.7', 'weekly'));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${[...staticEntries, ...bookEntries].join('\n')}
</urlset>
`;

  const outPath = resolve(import.meta.dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] Written to ${outPath} (${STATIC_PATHS.length * LANGUAGES.length + bookIds.length * LANGUAGES.length} URLs)`);
}

void main();
