#!/usr/bin/env node
// @ts-check

/**
 * Husky Setup Script
 * Removes Git hooks (Husky) from the project including hooks, dependencies, and configurations
 */

import path from 'path';
import {
  getRootDir,
  exists,
  readJson,
  writeJson,
  readText,
  writeText,
  safeUnlink,
  safeRmDir,
  removePkgScript,
  removeMarkedSection,
  createRl,
  askYesNo,
  isDirectRun,
  logStep,
  logOk,
  logInfo,
} from './_setup-utils.js';

/**
 * Remove Husky and commitlint dependencies from package.json
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeHuskyFromPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  let changed = false;

  const huskyDeps = ['husky', 'lint-staged', '@commitlint/cli', '@commitlint/config-conventional'];

  // Remove dependencies
  for (const dep of huskyDeps) {
    if (pkg.devDependencies?.[dep]) {
      delete pkg.devDependencies[dep];
      changed = true;
    }
    if (pkg.dependencies?.[dep]) {
      delete pkg.dependencies[dep];
      changed = true;
    }
  }

  // Remove lint-staged configuration
  if (pkg['lint-staged']) {
    delete pkg['lint-staged'];
    changed = true;
  }

  // Remove prepare script (used by Husky)
  if (pkg.scripts?.prepare === 'husky') {
    delete pkg.scripts.prepare;
    changed = true;
  }

  if (changed) writeJson(pkgPath, pkg);
  return changed;
}

/**
 * Remove Husky section from README.md
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeHuskyFromReadme(rootDir) {
  const readmePath = path.join(rootDir, 'README.md');
  if (!exists(readmePath)) return false;

  const before = readText(readmePath);
  let after = before;

  // Remove marked section
  after = removeMarkedSection(after, 'HUSKY');

  // Remove Git Hooks from features list
  after = after.replace(/^\s*-\s+\*\*Git Hooks\*\*[^\n]*\n/gm, '');
  after = after.replace(/^\s*-\s+\*\*Conventional Commits\*\*[^\n]*\n/gm, '');

  // Remove Husky from setup instructions (e.g., "- **Git Hooks (Husky)** – Pre-commit...")
  after = after.replace(/^\s*-\s+\*\*Git Hooks \(Husky\)\*\*[^\n]*\n/gm, '');

  // Remove setup:husky script reference
  after = after.replace(/^\s*yarn setup:husky\s*\n/gm, '');

  if (after !== before) {
    writeText(readmePath, after);
    return true;
  }
  return false;
}

/**
 * Delete Husky configuration files and directories
 * @param {string} rootDir - Project root directory
 * @returns {number} Number of items deleted
 */
function removeHuskyFiles(rootDir) {
  let deleted = 0;

  // Remove .husky directory
  if (safeRmDir(path.join(rootDir, '.husky'))) deleted++;

  // Remove commitlint config
  if (safeUnlink(path.join(rootDir, 'commitlint.config.js'))) deleted++;
  if (safeUnlink(path.join(rootDir, 'commitlint.config.cjs'))) deleted++;
  if (safeUnlink(path.join(rootDir, 'commitlint.config.mjs'))) deleted++;

  return deleted;
}

/**
 * Remove setup:husky script and delete this file
 * @param {string} rootDir - Project root directory
 * @param {string} thisFile - Path to this script file
 */
function selfDestruct(rootDir, thisFile) {
  removePkgScript(rootDir, 'setup:husky');
  safeUnlink(thisFile);
}

/**
 * Apply Husky removal changes
 * @param {Object} options - Configuration options
 * @param {string} [options.rootDir] - Project root directory
 * @param {boolean} [options.keep=true] - Whether to keep Husky
 * @param {boolean} [options.selfDestruct=false] - Whether to self-destruct after removal
 * @returns {Promise<{changed: boolean, removed: boolean}>} Operation result
 */
export async function apply({
  rootDir = getRootDir(),
  keep = true,
  selfDestruct: doSelfDestruct = false,
} = {}) {
  if (keep) return { changed: false, removed: false };

  logStep('Removing Git hooks (Husky)');

  const results = {
    pkg: removeHuskyFromPackageJson(rootDir),
    files: removeHuskyFiles(rootDir),
    readme: removeHuskyFromReadme(rootDir),
  };

  // Consolidated logging
  const updates = [
    ['package.json', results.pkg],
    ['README.md', results.readme],
  ];

  for (const [name, changed] of updates) {
    logInfo(`${name}: ${changed ? '✓ updated' : '- no changes'}`);
  }
  logOk(`Deleted ${results.files} Husky file(s)/directory`);

  if (doSelfDestruct) {
    logStep('Cleaning up Husky setup script');
    selfDestruct(rootDir, thisFile);
    logOk('Removed setup:husky and deleted scripts/setup-husky.js');
  }

  const changed = Object.values(results).some(v => v);
  return { changed, removed: true };
}

/* ---------------- Direct Run ---------------- */

const rootDirDefault = getRootDir();
const thisFile = path.join(rootDirDefault, 'scripts/setup-husky.js');

/**
 * Run interactive Husky removal prompt
 */
async function runInteractive() {
  const keep = await askYesNo('Do you want Git hooks (Husky)?', true);
  if (keep) {
    logOk('Git hooks retained');
    return;
  }

  // Show warning and ask for confirmation
  const { askConfirm } = await import('./_setup-utils.js');
  const confirmed = await askConfirm(
    '⚠️  WARNING: All Git hooks, dependencies, and configurations will be permanently removed. This cannot be undone. Continue?'
  );

  if (!confirmed) {
    logInfo('Operation cancelled');
    return;
  }

  await apply({ rootDir: rootDirDefault, keep: false, selfDestruct: true });
  console.log(
    '\n✓ Git hooks removed. Run your package manager install command to update the lockfile.'
  );
}

if (isDirectRun(import.meta.url)) {
  runInteractive();
}
