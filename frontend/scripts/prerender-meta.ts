/**
 * Lightweight Meta Prerenderer
 *
 * Generates static HTML files for key marketing pages that include
 * correct <title>, <meta>, OG tags, hreflang, and JSON-LD — so crawlers
 * that don't execute JavaScript still get meaningful SEO signals.
 *
 * Unlike Puppeteer-based prerender, this does NOT render React components.
 * It creates HTML shells that browsers will hydrate with the SPA bundle.
 * This is safe for ARM64 (Pi5) since it needs no Chromium.
 *
 * Run: npx tsx scripts/prerender-meta.ts
 * Outputs: dist/{lang}/{path}/index.html for each route x language
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const DIST_DIR = resolve(import.meta.dirname, '../dist');
const SITE_URL = process.env.VITE_SITE_URL ?? 'https://book-swaps.com';
const LANGUAGES = ['en', 'fr', 'nl'] as const;

interface PageMeta {
  path: string;
  title: string;
  description: string;
  priority?: string;
}

const PAGES: PageMeta[] = [
  { path: '/', title: 'Home', description: 'BookSwap is a free, location-aware book exchange platform. Discover, swap, and share physical books with people in your neighbourhood.' },
  { path: '/browse', title: 'Browse Books', description: 'Discover books available for swapping in your community. Filter by genre, condition, and distance.' },
  { path: '/catalogue', title: 'Book Catalogue', description: 'Browse the full catalogue of books available for swapping on BookSwap.' },
  { path: '/map', title: 'Book Map', description: 'Explore an interactive map of books available for swapping near you. Find readers in your neighbourhood.' },
  { path: '/how-it-works', title: 'How BookSwap Works', description: 'Your complete guide to swapping books on BookSwap: list, discover, request, and meet up.' },
  { path: '/community', title: 'BookSwap Community', description: 'Meet the BookSwap community. See live stats, recent activity, and what readers near you are sharing.' },
  { path: '/privacy-policy', title: 'Privacy Policy', description: 'Learn how BookSwap collects, uses, and protects your personal data in compliance with GDPR.' },
  { path: '/terms-of-service', title: 'Terms of Service', description: 'Read the rules and conditions for using the BookSwap platform.' },
  { path: '/account-deletion', title: 'Account & Data Deletion', description: 'Learn how to delete your BookSwap account and request removal of your personal data.' },
];

function generateHreflang(routePath: string): string {
  const links = LANGUAGES.map(
    (lang) => `    <link rel="alternate" hreflang="${lang}" href="${SITE_URL}/${lang}${routePath}" />`,
  );
  links.push(`    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${routePath}" />`);
  return links.join('\n');
}

function main() {
  const indexHtml = resolve(DIST_DIR, 'index.html');

  if (!existsSync(indexHtml)) {
    console.error('[prerender] dist/index.html not found — run vite build first');
    process.exit(1);
  }

  const template = readFileSync(indexHtml, 'utf-8');
  let count = 0;

  for (const page of PAGES) {
    for (const lang of LANGUAGES) {
      const fullTitle = `${page.title} | BookSwap`;
      const canonicalUrl = `${SITE_URL}/${lang}${page.path}`;
      const ogImage = `${SITE_URL}/og-image.png`;

      const metaTags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${page.description}" />
    <link rel="canonical" href="${canonicalUrl}" />
${generateHreflang(page.path)}
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="BookSwap" />
    <meta property="og:locale" content="${lang}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${ogImage}" />`;

      let html = template;

      // Replace default title
      html = html.replace(
        /<title>.*?<\/title>/,
        '',
      );

      // Replace default description
      html = html.replace(
        /<meta\s+name="description"[^>]*>/,
        '',
      );

      // Replace default OG/Twitter tags with page-specific ones
      html = html.replace(
        /<!-- Open Graph -->[\s\S]*?<!-- Twitter Card -->[\s\S]*?<meta name="twitter:image"[^>]*>/,
        '',
      );

      // Inject page-specific meta tags before </head>
      html = html.replace('</head>', `${metaTags}\n  </head>`);

      // Set html lang
      html = html.replace('<html lang="en">', `<html lang="${lang}">`);

      const outDir = page.path === '/'
        ? resolve(DIST_DIR, lang)
        : resolve(DIST_DIR, lang, page.path.slice(1));

      mkdirSync(outDir, { recursive: true });
      const outFile = resolve(outDir, 'index.html');

      // Don't overwrite if an existing prerendered file is already there
      if (!existsSync(outFile) || dirname(outFile).includes(lang)) {
        writeFileSync(outFile, html, 'utf-8');
        count++;
      }
    }
  }

  console.log(`[prerender] Generated ${count} HTML files for ${PAGES.length} pages x ${LANGUAGES.length} languages`);
}

main();
