#!/usr/bin/env node
// @ts-check

/**
 * Testing Setup Script
 * Removes testing infrastructure from the project including test files, dependencies, and configurations
 */

import fs from 'fs';
import path from 'path';
import {
  getRootDir,
  exists,
  readJson,
  writeJson,
  readText,
  writeText,
  safeUnlink,
  safeRmdirIfEmpty,
  removePkgScript,
  removeMarkedSection,
  createRl,
  askYesNo,
  isDirectRun,
  removeObjectBlockByKey,
  logStep,
  logOk,
  logInfo,
} from './_setup-utils.js';

/** Test infrastructure files to remove */
const TEST_INFRA_FILES = [
  'src/test/setup.ts',
  'src/test/setup.tsx',
  'src/test/setup.js',
  'src/test/setup.jsx',
  'src/test/vitest.setup.ts',
  'src/test/vitest.setup.tsx',
  'src/test/vitest.setup.js',
  'src/test/vitest.setup.jsx',
];

/** Directories to skip when scanning for test files */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.next']);

/**
 * Recursively find all test files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} [fileList=[]] - Accumulated list of test files
 * @returns {string[]} Array of absolute paths to test files
 */
function findTestFiles(dir, fileList = []) {
  if (!exists(dir)) return fileList;

  try {
    const items = fs.readdirSync(dir);
    for (const name of items) {
      const abs = path.join(dir, name);
      const stat = fs.statSync(abs);

      if (stat.isDirectory()) {
        if (!SKIP_DIRS.has(name)) findTestFiles(abs, fileList);
      } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(name)) {
        fileList.push(abs);
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }

  return fileList;
}

/**
 * Remove testing dependencies and scripts from package.json
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeTestingFromPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  let changed = false;

  const testDeps = [
    'vitest',
    '@vitest/ui',
    'jsdom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@testing-library/dom',
    '@testing-library/jest-dom',
  ];

  // Remove dependencies
  for (const dep of testDeps) {
    if (pkg.devDependencies?.[dep]) {
      delete pkg.devDependencies[dep];
      changed = true;
    }
    if (pkg.dependencies?.[dep]) {
      delete pkg.dependencies[dep];
      changed = true;
    }
  }

  // Remove test scripts
  const testScripts = ['test', 'test:ui', 'test:run', 'test:coverage'];
  for (const script of testScripts) {
    if (pkg.scripts?.[script]) {
      delete pkg.scripts[script];
      changed = true;
    }
  }

  if (changed) writeJson(pkgPath, pkg);
  return changed;
}

/**
 * Remove test configuration block from vite.config.ts
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeTestBlockFromViteConfig(rootDir) {
  const vitePath = path.join(rootDir, 'vite.config.ts');
  if (!exists(vitePath)) return false;

  const before = readText(vitePath);
  const after = removeObjectBlockByKey(before, 'test');

  if (after !== before) {
    writeText(vitePath, after);
    return true;
  }
  return false;
}

/**
 * Delete all test files from the project
 * @param {string} rootDir - Project root directory
 * @returns {number} Number of files deleted
 */
function removeTestingFiles(rootDir) {
  let deleted = 0;

  // Find and remove all test files in src
  const srcDir = path.join(rootDir, 'src');
  for (const abs of findTestFiles(srcDir)) {
    if (safeUnlink(abs)) deleted++;
  }

  // Remove test infrastructure files
  for (const rel of TEST_INFRA_FILES) {
    if (safeUnlink(path.join(rootDir, rel))) deleted++;
  }

  // Clean up empty test directory
  safeRmdirIfEmpty(path.join(rootDir, 'src/test'));
  return deleted;
}

/**
 * Remove testing references from README.md
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeTestingFromReadme(rootDir) {
  const readmePath = path.join(rootDir, 'README.md');
  if (!exists(readmePath)) return false;

  const before = readText(readmePath);
  let after = before;

  // Remove marked section
  after = removeMarkedSection(after, 'TESTING');

  // Remove testing references using consolidated patterns
  const testingPatterns = [
    /^\s*-\s+\*\*Testing Infrastructure\*\*[^\n]*\n/gm, // Features list
    /^\s*-\s+\*\*Testing Infrastructure\*\*\s+–[^\n]*\n/gm, // Setup instructions
    /^\s*yarn setup:testing\s*\n/gm, // Script reference
  ];

  for (const pattern of testingPatterns) {
    after = after.replace(pattern, '');
  }

  if (after !== before) {
    writeText(readmePath, after);
    return true;
  }
  return false;
}

/**
 * Remove setup:testing script and delete this file
 * @param {string} rootDir - Project root directory
 * @param {string} thisFile - Path to this script file
 */
function selfDestruct(rootDir, thisFile) {
  removePkgScript(rootDir, 'setup:testing');
  safeUnlink(thisFile);
}

/**
 * Apply testing removal changes
 * @param {Object} options - Configuration options
 * @param {string} [options.rootDir] - Project root directory
 * @param {boolean} [options.keep=true] - Whether to keep testing infrastructure
 * @param {boolean} [options.selfDestruct=false] - Whether to self-destruct after removal
 * @returns {Promise<{changed: boolean, removed: boolean}>} Operation result
 */
export async function apply({
  rootDir = getRootDir(),
  keep = true,
  selfDestruct: doSelfDestruct = false,
} = {}) {
  if (keep) return { changed: false, removed: false };

  logStep('Removing testing infrastructure');

  const results = {
    pkg: removeTestingFromPackageJson(rootDir),
    vite: removeTestBlockFromViteConfig(rootDir),
    files: removeTestingFiles(rootDir),
    readme: removeTestingFromReadme(rootDir),
  };

  // Consolidated logging
  const updates = [
    ['package.json', results.pkg],
    ['vite.config.ts', results.vite],
    ['README.md', results.readme],
  ];

  for (const [name, changed] of updates) {
    logInfo(`${name}: ${changed ? '✓ updated' : '- no changes'}`);
  }
  logOk(`Deleted ${results.files} test file(s)`);

  if (doSelfDestruct) {
    logStep('Cleaning up testing setup script');
    selfDestruct(rootDir, thisFile);
    logOk('Removed setup:testing and deleted scripts/setup-testing.js');
  }

  const changed = Object.values(results).some(v => v);
  return { changed, removed: true };
}

/* ---------------- Direct Run ---------------- */

const rootDirDefault = getRootDir();
const thisFile = path.join(rootDirDefault, 'scripts/setup-testing.js');

/**
 * Run interactive testing removal prompt
 */
async function runInteractive() {
  const keep = await askYesNo('Do you want testing infrastructure?', true);
  if (keep) {
    logOk('Testing retained');
    return;
  }

  // Show warning and ask for confirmation
  const { askConfirm } = await import('./_setup-utils.js');
  const confirmed = await askConfirm(
    '⚠️  WARNING: All testing files, dependencies, and configurations will be permanently removed. This cannot be undone. Continue?'
  );

  if (!confirmed) {
    logInfo('Operation cancelled');
    return;
  }

  await apply({ rootDir: rootDirDefault, keep: false, selfDestruct: true });
  console.log(
    '\n✓ Testing removed. Run your package manager install command to update the lockfile.'
  );
}

if (isDirectRun(import.meta.url)) {
  runInteractive();
}
