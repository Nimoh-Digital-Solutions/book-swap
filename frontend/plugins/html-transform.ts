import type { Plugin } from 'vite';

/**
 * Conditionally inject PWA manifest link based on environment
 */
export function htmlTransformPlugin(enablePwa: boolean): Plugin {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      if (!enablePwa) {
        // Remove manifest link and PWA meta tags in development when PWA is disabled
        return html
          .replace(/<link rel="manifest"[^>]*>/g, '')
          .replace(
            /<!-- PWA capabilities -->[\s\S]*?<!-- Additional PWA meta tags -->[\s\S]*?<meta name="msapplication-TileColor"[^>]*>/g,
            ''
          );
      }
      return html;
    },
  };
}
