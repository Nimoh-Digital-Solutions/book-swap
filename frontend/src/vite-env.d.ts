/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * Typed declarations for all VITE_ environment variables.
 * Add new variables here whenever you add them to .env.example.
 */
interface ImportMetaEnv {
  /**
   * Base URL for API requests.
   * Typed as `string | undefined` because Vite returns `undefined` at runtime
   * when the variable is not set; call sites must guard with `?? ''` or similar.
   */
  readonly VITE_API_URL: string | undefined;
  /**
   * Application display name.
   * Typed as `string | undefined`; use the `APP_CONFIG.appName` helper which
   * provides a sensible fallback ('React Starter Kit') when this is absent.
   */
  readonly VITE_APP_TITLE: string | undefined;
  /**
   * Opt-in to PWA service worker in development (`'true'` | `'false'`).
   * Narrowed to the two valid string literals so accidental values are caught
   * at compile time. When absent Vite returns `undefined`.
   */
  readonly VITE_PWA: 'true' | 'false' | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
