#!/usr/bin/env node
// @ts-check

/**
 * Docker Setup Script
 * Removes Docker configuration from the project including Dockerfile, docker-compose, and nginx config
 */

import path from 'path';
import {
  getRootDir,
  exists,
  readText,
  writeText,
  safeUnlink,
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
 * Remove Docker section from README.md
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeDockerFromReadme(rootDir) {
  const readmePath = path.join(rootDir, 'README.md');
  if (!exists(readmePath)) return false;

  const before = readText(readmePath);
  let after = before;

  // Remove all marked Docker sections (handles multiple markers)
  after = removeMarkedSection(after, 'DOCKER');

  // Remove Docker from features list
  after = after.replace(/^\s*-\s+\*\*Docker\*\*[^\n]*\n/gm, '');

  // Remove setup:docker script reference
  after = after.replace(/^\s*yarn setup:docker\s*\n/gm, '');

  // Remove DOCKER from environment variables table
  after = after.replace(/^\s*\|\s*`DOCKER`[^\n]*\n/gm, '');

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(readmePath, after);
    return true;
  }
  return false;
}

/**
 * Remove Docker section from .env.example
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removeDockerFromEnvExample(rootDir) {
  const envExamplePath = path.join(rootDir, '.env.example');
  if (!exists(envExamplePath)) return false;

  const before = readText(envExamplePath);
  let after = before;

  // Remove Docker section (lines 17-26)
  after = after.replace(
    /# -{5,}\s*\n# 🐳 Docker \(Auto-configured\)[\s\S]*?# DOCKER=true\s*\n/gm,
    ''
  );

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(envExamplePath, after);
    return true;
  }
  return false;
}

/**
 * Delete Docker configuration files
 * @param {string} rootDir - Project root directory
 * @returns {number} Number of items deleted
 */
function removeDockerFiles(rootDir) {
  let deleted = 0;

  // Remove Docker files
  if (safeUnlink(path.join(rootDir, 'Dockerfile'))) deleted++;
  if (safeUnlink(path.join(rootDir, 'docker-compose.yml'))) deleted++;
  if (safeUnlink(path.join(rootDir, '.dockerignore'))) deleted++;
  if (safeUnlink(path.join(rootDir, 'nginx.conf'))) deleted++;

  return deleted;
}

/**
 * Remove setup:docker script and delete this file
 * @param {string} rootDir - Project root directory
 * @param {string} thisFile - Path to this script file
 */
function selfDestruct(rootDir, thisFile) {
  removePkgScript(rootDir, 'setup:docker');
  safeUnlink(thisFile);
}

/**
 * Apply Docker removal changes
 * @param {Object} options - Configuration options
 * @param {string} [options.rootDir] - Project root directory
 * @param {boolean} [options.keep=true] - Whether to keep Docker
 * @param {boolean} [options.selfDestruct=false] - Whether to self-destruct after removal
 * @returns {Promise<{changed: boolean, removed: boolean}>} Operation result
 */
export async function apply({
  rootDir = getRootDir(),
  keep = true,
  selfDestruct: doSelfDestruct = false,
} = {}) {
  if (keep) return { changed: false, removed: false };

  logStep('Removing Docker configuration');

  const results = {
    files: removeDockerFiles(rootDir),
    readme: removeDockerFromReadme(rootDir),
    envExample: removeDockerFromEnvExample(rootDir),
  };

  // Consolidated logging
  const updates = [
    ['README.md', results.readme],
    ['.env.example', results.envExample],
  ];

  for (const [name, changed] of updates) {
    logInfo(`${name}: ${changed ? '✓ updated' : '- no changes'}`);
  }
  logOk(`Deleted ${results.files} Docker file(s)`);

  if (doSelfDestruct) {
    logStep('Cleaning up Docker setup script');
    selfDestruct(rootDir, thisFile);
    logOk('Removed setup:docker and deleted scripts/setup-docker.js');
  }

  const changed = Object.values(results).some(v => v);
  return { changed, removed: true };
}

/* ---------------- Direct Run ---------------- */

const rootDirDefault = getRootDir();
const thisFile = path.join(rootDirDefault, 'scripts/setup-docker.js');

/**
 * Run interactive Docker removal prompt
 */
async function runInteractive() {
  const keep = await askYesNo('Do you want Docker support?', true);
  if (keep) {
    logOk('Docker configuration retained');
    return;
  }

  // Show warning and ask for confirmation
  const { askConfirm } = await import('./_setup-utils.js');
  const confirmed = await askConfirm(
    '⚠️  WARNING: All Docker files and configurations will be permanently removed. This cannot be undone. Continue?'
  );

  if (!confirmed) {
    logInfo('Operation cancelled');
    return;
  }

  await apply({ rootDir: rootDirDefault, keep: false, selfDestruct: true });
  console.log('\n✓ Docker configuration removed.');
}

if (isDirectRun(import.meta.url)) {
  runInteractive();
}
