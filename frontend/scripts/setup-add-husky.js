#!/usr/bin/env node
// @ts-check

/**
 * Setup Add-Husky Script
 * Adds Husky (Git hooks) + commitlint + lint-staged to the project.
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
// file templates
// ---------------------------------------------------------------------------

const COMMITLINT_CONFIG = `export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Revert a previous commit
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
  },
};
`;

const COMMIT_MSG_HOOK = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
`;

const LINT_STAGED_CONFIG = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss}': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};

const HUSKY_DEV_DEPS = {
  husky: '^9.1.7',
  'lint-staged': '^16.2.7',
  '@commitlint/cli': '^20.4.1',
  '@commitlint/config-conventional': '^20.4.1',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if Husky is already present.
 * @param {string} rootDir
 * @returns {boolean}
 */
function hasHusky(rootDir) {
  if (exists(path.join(rootDir, '.husky'))) return true;
  const pkgPath = path.join(rootDir, 'package.json');
  if (exists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg.devDependencies?.husky || pkg.dependencies?.husky) return true;
  }
  return false;
}

/**
 * Add Husky devDependencies to package.json.
 * @param {string} rootDir
 * @returns {boolean} True if changes were made
 */
function addHuskyDepsToPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  let changed = false;

  if (!pkg.devDependencies) pkg.devDependencies = {};

  for (const [dep, version] of Object.entries(HUSKY_DEV_DEPS)) {
    if (!pkg.devDependencies[dep]) {
      pkg.devDependencies[dep] = version;
      changed = true;
    }
  }

  // Add prepare script
  if (!pkg.scripts) pkg.scripts = {};
  if (!pkg.scripts.prepare) {
    pkg.scripts.prepare = 'husky';
    changed = true;
  }

  // Add lint-staged config
  if (!pkg['lint-staged']) {
    pkg['lint-staged'] = LINT_STAGED_CONFIG;
    changed = true;
  }

  if (changed) writeJson(pkgPath, pkg);
  return changed;
}

/**
 * Create Husky files.
 * @param {string} rootDir
 * @returns {number} Number of files created
 */
function createHuskyFiles(rootDir) {
  let created = 0;

  // Create commitlint.config.js
  const commitlintPath = path.join(rootDir, 'commitlint.config.js');
  if (!exists(commitlintPath)) {
    writeText(commitlintPath, COMMITLINT_CONFIG);
    logInfo('commitlint.config.js: ✓ created');
    created++;
  } else {
    logInfo('commitlint.config.js: - already exists, skipped');
  }

  // Create .husky directory and commit-msg hook
  const huskyDir = path.join(rootDir, '.husky');
  if (!exists(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
  }

  const commitMsgPath = path.join(huskyDir, 'commit-msg');
  if (!exists(commitMsgPath)) {
    writeText(commitMsgPath, COMMIT_MSG_HOOK);
    fs.chmodSync(commitMsgPath, 0o755);
    logInfo('.husky/commit-msg: ✓ created');
    created++;
  } else {
    logInfo('.husky/commit-msg: - already exists, skipped');
  }

  return created;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Apply Husky additions.
 * @param {Object} [options]
 * @param {string} [options.rootDir]
 * @returns {Promise<{changed: boolean}>}
 */
export async function apply({ rootDir = getRootDir() } = {}) {
  if (hasHusky(rootDir)) {
    logWarn('Husky configuration already detected — no changes made.');
    return { changed: false };
  }

  logStep('Adding Husky + commitlint + lint-staged');

  const results = {
    pkg: addHuskyDepsToPackageJson(rootDir),
    files: createHuskyFiles(rootDir),
  };

  logInfo(`package.json: ${results.pkg ? '✓ updated' : '- no changes'}`);
  if (results.files > 0) logOk(`Created ${results.files} Husky file(s)`);

  console.log('\nNext steps:');
  console.log('  1. Run: yarn install');
  console.log('  2. Initialise husky: yarn prepare');
  console.log('  3. Commit with conventional format: feat: add feature');

  const changed = results.pkg || results.files > 0;
  return { changed };
}

/* ---------------- Direct Run ---------------- */

if (isDirectRun(import.meta.url)) {
  apply().catch(console.error);
}
