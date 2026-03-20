#!/usr/bin/env node
// @ts-check

/**
 * Setup Add-Testing Script
 * Adds Vitest + Testing Library testing infrastructure to the project.
 */

import fs from 'fs';
import path from 'path';
import {
  getRootDir,
  exists,
  readJson,
  writeJson,
  writeText,
  isDirectRun,
  logStep,
  logOk,
  logInfo,
  logWarn,
} from './_setup-utils.js';

// ---------------------------------------------------------------------------
// Testing packages to add
// ---------------------------------------------------------------------------
const TESTING_DEV_DEPS = {
  vitest: '^4.0.18',
  '@vitest/coverage-v8': '^4.0.18',
  '@testing-library/react': '^16.3.2',
  '@testing-library/jest-dom': '^6.9.1',
  '@testing-library/user-event': '^14.6.1',
  '@testing-library/dom': '^10.4.1',
  jsdom: '^28.0.0',
};

// ---------------------------------------------------------------------------
// src/test/setup.ts template
// ---------------------------------------------------------------------------
const TEST_SETUP_TS = `import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// window.matchMedia mock
// jsdom does not implement matchMedia. This stub prevents crashes in any
// component or hook that calls window.matchMedia (e.g. ThemeProvider).
// ---------------------------------------------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset localStorage before each test to prevent state leaking between tests.
beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn');
  vi.spyOn(console, 'error');
});

// Cleanup React tree and clear all mock state after each test case.
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if testing infrastructure is already present.
 * @param {string} rootDir
 * @returns {boolean}
 */
function hasTesting(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) return true;
  }
  if (exists(path.join(rootDir, 'src/test'))) return true;
  return false;
}

/**
 * Add testing devDependencies to package.json.
 * @param {string} rootDir
 * @returns {boolean} True if changes were made
 */
function addTestingDepsToPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  let changed = false;

  if (!pkg.devDependencies) pkg.devDependencies = {};

  for (const [dep, version] of Object.entries(TESTING_DEV_DEPS)) {
    if (!pkg.devDependencies[dep]) {
      pkg.devDependencies[dep] = version;
      changed = true;
    }
  }

  // Add test scripts
  if (!pkg.scripts) pkg.scripts = {};
  if (!pkg.scripts.test) {
    pkg.scripts.test = 'vitest';
    changed = true;
  }
  if (!pkg.scripts['test:run']) {
    pkg.scripts['test:run'] = 'vitest run';
    changed = true;
  }
  if (!pkg.scripts['test:coverage']) {
    pkg.scripts['test:coverage'] = 'vitest run --coverage';
    changed = true;
  }

  if (changed) writeJson(pkgPath, pkg);
  return changed;
}

/**
 * Create src/test/setup.ts.
 * @param {string} rootDir
 * @returns {boolean} True if file was created
 */
function createTestSetup(rootDir) {
  const testDir = path.join(rootDir, 'src/test');
  const setupPath = path.join(testDir, 'setup.ts');

  if (exists(setupPath)) {
    logInfo('src/test/setup.ts: already exists, skipping');
    return false;
  }

  if (!exists(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  writeText(setupPath, TEST_SETUP_TS);
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Apply testing additions.
 * @param {Object} [options]
 * @param {string} [options.rootDir]
 * @returns {Promise<{changed: boolean}>}
 */
export async function apply({ rootDir = getRootDir() } = {}) {
  if (hasTesting(rootDir)) {
    logWarn('Testing infrastructure already detected — no changes made.');
    logInfo('Run yarn install to ensure packages are up to date.');
    return { changed: false };
  }

  logStep('Adding testing infrastructure');

  const results = {
    pkg: addTestingDepsToPackageJson(rootDir),
    setup: createTestSetup(rootDir),
  };

  logInfo(`package.json: ${results.pkg ? '✓ updated' : '- no changes'}`);
  logInfo(`src/test/setup.ts: ${results.setup ? '✓ created' : '- already exists'}`);

  logOk('Testing infrastructure added');
  console.log('\nNext steps:');
  console.log('  1. Run: yarn install');
  console.log('  2. Add the vitest test block to vite.config.ts:');
  console.log('       test: { globals: true, environment: "jsdom", setupFiles: "./src/test/setup.ts" }');
  console.log('  3. Run: yarn test:run');

  const changed = Object.values(results).some(v => v);
  return { changed };
}

/* ---------------- Direct Run ---------------- */

if (isDirectRun(import.meta.url)) {
  apply().catch(console.error);
}
