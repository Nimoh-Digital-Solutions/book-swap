import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import mkcert from 'vite-plugin-mkcert';
import { visualizer } from 'rollup-plugin-visualizer';
import autoprefixer from 'autoprefixer';
import pxtorem from 'postcss-pxtorem';
import postcssJitProps from 'postcss-jit-props';
import OpenProps from 'open-props';

import { compression } from 'vite-plugin-compression2';
import { pwaPlugin, htmlTransformPlugin } from './plugins';

import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
  // Loads .env, .env.local, .env.[mode], .env.[mode].local and returns VITE_* vars.
  // Using 'VITE_' prefix (not '') to avoid loading unrelated process env vars
  // (e.g. CI secrets, SSH keys) into the build config object.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const isProd = mode === 'production';
  const isTest = mode === 'test' || process.env['VITEST'] === 'true';
  // DOCKER is not a VITE_ var — read it directly from process.env
  const isDocker = process.env['DOCKER'] === 'true'; // Automatically set in docker-compose.

  // HTTPS in dev via mkcert — opt-in with VITE_HTTPS=true or always on when DOCKER is false.
  // Needed for secure cookie testing, WebAuthn, and media APIs that require a secure context.
  const enableHttps = !isTest && !isProd && env.VITE_HTTPS === 'true';

  /**
   * PWA strategy:
   * - Production: always enabled (when PWA feature is installed)
   * - Development: opt-in to avoid service worker stale-cache issues
   *
   * Enable dev PWA with:
   *   VITE_PWA=true yarn dev
   */
  const enableDevPwa = env.VITE_PWA === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Local HTTPS via mkcert — auto-generates trusted certs on first run.
      // Enable with: VITE_HTTPS=true yarn dev
      ...(enableHttps ? [mkcert()] : []),
      // PWA always enabled in prod, opt-in in dev
      pwaPlugin({ isProd, enableDev: enableDevPwa }),
      // Remove PWA manifest link when disabled in dev
      htmlTransformPlugin(isProd || enableDevPwa),
      svgr(),
      checker({
        enableBuild: false,
        overlay: { initialIsOpen: false },
        // Stylelint checker disabled during tests — no vite dev server needed for vitest
        stylelint: isTest ? false : {
          lintCommand: 'stylelint "./src/**/*.scss"',
        },
        typescript: true,
      }),
      // Pre-compress assets (gzip + brotli) at build time so nginx can serve
      // them via gzip_static without CPU-intensive on-the-fly compression.
      ...(isProd
        ? [
            compression({ algorithm: 'gzip', exclude: [/\.(br|gz)$/] }),
            compression({ algorithm: 'brotliCompress', exclude: [/\.(br|gz)$/] }),
          ]
        : []),
      // Bundle visualiser — only active in 'analyze' mode (yarn build:analyze)
      // Generates dist/stats.html — open it to inspect chunk sizes.
      ...(mode === 'analyze'
        ? [visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
        : []),
    ],

    resolve: {
      alias: {
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@configs': path.resolve(__dirname, 'src/configs'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@data': path.resolve(__dirname, 'src/data'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@layouts': path.resolve(__dirname, 'src/layouts'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@routes': path.resolve(__dirname, 'src/routes'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@test': path.resolve(__dirname, 'src/test'),
        '@shared': path.resolve(__dirname, '../packages/shared/src'),
      },
    },

    css: {
      postcss: {
        plugins: [          // Injects only the Open Props custom properties that are actually
          // referenced via var(--...) in CSS/SCSS — keeps bundle lean.
          postcssJitProps(OpenProps),          autoprefixer(),
          pxtorem({
            rootValue: 16,
            mediaQuery: true,
            // Exclude properties where sub-pixel precision is meaningful
            // (borders, shadows, outlines). '!border*' etc. uses postcss-pxtorem's
            // negation prefix to keep those values in px.
            propList: ['*', '!border*', '!box-shadow', '!outline*', '!column-rule*'],
          }),
        ],
      },
      preprocessorOptions: {
        scss: {
          additionalData: '', // Global SCSS if needed
        },
      },
    },

    server: {
      // Docker-friendly: bind to all interfaces so the host can reach Vite
      host: true,
      port: 3070,

      // Don't try to open a browser when running in Docker
      open: !isDocker,

      // Proxy API and WebSocket requests to the backend so the browser never
      // makes a cross-origin call during local development. CORS headers on the
      // backend are therefore not required in the dev environment.
      // Only active when VITE_API_URL is set — safe to omit for frontends with
      // no backend.
      ...(env.VITE_API_URL
        ? {
            proxy: {
              '/api': {
                target: env.VITE_API_URL,
                changeOrigin: true,
                secure: false,
              },
              '/ws': {
                target: env.VITE_API_URL,
                ws: true,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },

    build: {
      outDir: 'dist',
      minify: true,
      // 'hidden' keeps source maps out of the CDN-served bundle but available
      // for error symbolication in Sentry / Datadog.  Upload dist/*.map files
      // to your error tracker after each production deploy.
      sourcemap: 'hidden',
      // Split vendor libs into a separate chunk so they can be cached
      // independently of app code — a new deploy only invalidates app chunks.
      rollupOptions: {
        output: {
          // Use a function so every react-icons sub-package (e.g. react-icons/lu)
          // is grouped into the same chunk, independently cached from app code.
          manualChunks(id) {
            if (id.includes('react-icons')) return 'icons';
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor';
            if (id.includes('react-router')) return 'router';
          },
        },
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          'public/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          'dist/',
          // Configs are thin wrappers around env vars — not unit-testable in isolation
          'src/configs/',
          // Route config and page fallback are declarative, not logic
          'src/routes/config/',
          // Service-worker runtime — requires browser SW APIs, integration-tested via PWA
          'src/sw/',
          // SCSS module proxies have no testable JS logic
          '**/*.module.scss',
          // Barrel / re-export stubs: V8 cannot instrument `export { x } from 'pkg'`
          // statements — they pass all tests but always show 0 % in coverage.
          'src/hooks/index.ts',
          'src/hooks/useTheme.ts',
          'src/hooks/useToast.ts',
          'src/hooks/useToggle.ts',
          'src/hooks/useWindowSize.ts',
          'src/hooks/useClickOutside.ts',
          'src/hooks/useDebounce.ts',
          'src/hooks/useLocalStorage.ts',
          'src/hooks/useMediaQuery.ts',
          'src/hooks/usePrevious.ts',
          'src/services/index.ts',
          'src/contexts/ThemeContext.tsx',
          'src/contexts/index.ts',
          // UI component re-export stubs + barrel index files
          'src/components/**/**/index.ts',
          'src/components/ui/Spinner/Spinner.tsx',
          'src/components/ui/Textarea/Textarea.tsx',
          'src/components/ui/Toast/Toast.tsx',
          'src/components/ui/Badge/Badge.tsx',
          'src/components/ui/Button/Button.tsx',
          'src/components/ui/Button/Button.interface.ts',
          'src/components/ui/Card/Card.tsx',
          'src/components/ui/EmptyState/EmptyState.tsx',
          'src/components/ui/Input/Input.tsx',
          'src/components/ui/Modal/Modal.tsx',
          'src/components/ui/Pagination/Pagination.tsx',
          'src/components/ui/Skeleton/Skeleton.tsx',
          'src/components/common/ErrorBoundary/ErrorBoundary.tsx',
          // Monorepo packages — each package has its own vitest config and
          // coverage thresholds; they must not pollute the app-level report.
          'packages/**',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 65,
          statements: 80,
        },
      },
      include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', 'e2e'],
    },
  };
});
