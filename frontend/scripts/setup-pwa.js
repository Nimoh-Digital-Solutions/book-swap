#!/usr/bin/env node
// @ts-check

/**
 * PWA Setup Script
 * Removes PWA support from the project including files, dependencies, and configurations
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
  safeRmDir,
  safeRmdirIfEmpty,
  removePkgScript,
  removeMarkedSection,
  createRl,
  askYesNo,
  isDirectRun,
  logStep,
  logOk,
  logInfo,
} from './_setup-utils.js';

/** PWA-specific files to remove */
const PWA_FILES = [
  'plugins/pwa.ts',
  'plugins/html-transform.ts',
  'src/sw/pwa.ts',
  'src/types/pwa.ts',
  'src/utils/pwa.ts',
  'public/manifest.webmanifest',
];

/**
 * Remove vite-plugin-pwa from package.json dependencies
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromPackageJson(rootDir) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  let changed = false;

  if (pkg.devDependencies?.['vite-plugin-pwa']) {
    delete pkg.devDependencies['vite-plugin-pwa'];
    changed = true;
  }
  if (pkg.dependencies?.['vite-plugin-pwa']) {
    delete pkg.dependencies['vite-plugin-pwa'];
    changed = true;
  }

  if (changed) writeJson(pkgPath, pkg);
  return changed;
}

/**
 * Remove PWA plugin import and usage from vite.config.ts
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromViteConfig(rootDir) {
  const vitePath = path.join(rootDir, 'vite.config.ts');
  if (!exists(vitePath)) return false;

  const before = readText(vitePath);
  let after = before;

  // Remove pwaPlugin and htmlTransformPlugin from import statement
  after = after.replace(
    /import\s+\{\s*pwaPlugin\s*,\s*htmlTransformPlugin\s*\}\s+from\s+['"]\.\/plugins['"];?\s*\n?/g,
    ''
  );
  after = after.replace(/import\s+\{\s*pwaPlugin\s*\}\s+from\s+['"]\.\/plugins['"];?\s*\n?/g, '');
  after = after.replace(
    /import\s+\{\s*htmlTransformPlugin\s*\}\s+from\s+['"]\.\/plugins['"];?\s*\n?/g,
    ''
  );

  // Remove PWA strategy comment block
  after = after.replace(/\/\*\*[\s\S]*?PWA strategy:[\s\S]*?\*\/\s*/g, '');

  // Remove enableDevPwa variable and unused isProd (only used for PWA)
  after = after.replace(/^\s*const enableDevPwa = env\.VITE_PWA === 'true';\s*\n/gm, '');
  after = after.replace(/^\s*const isProd = mode === 'production';\s*\n/gm, '');

  // Remove pwaPlugin usage
  after = after.replace(/^\s*\/\/ PWA always enabled in prod, opt-in in dev\s*\n/gm, '');
  after = after.replace(/^\s*pwaPlugin\([^)]*\)\s*,?\s*\n/gm, '');

  // Remove htmlTransformPlugin usage
  after = after.replace(/^\s*\/\/ Remove PWA manifest link when disabled in dev\s*\n/gm, '');
  after = after.replace(/^\s*htmlTransformPlugin\([^)]*\)\s*,?\s*\n/gm, '');

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(vitePath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA references from docker-compose.yml
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromDockerCompose(rootDir) {
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  if (!exists(dockerComposePath)) return false;

  const before = readText(dockerComposePath);
  let after = before;

  // Remove PWA comment lines
  after = after.replace(/^\s*#\s*Optional:\s*enable PWA[^\n]*\n/gm, '');
  after = after.replace(/^\s*#\s*-\s*VITE_PWA=true\s*\n/gm, '');

  if (after !== before) {
    writeText(dockerComposePath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA-specific sections from nginx.conf
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromNginxConf(rootDir) {
  const nginxPath = path.join(rootDir, 'nginx.conf');
  if (!exists(nginxPath)) return false;

  const before = readText(nginxPath);
  let after = before;

  // Remove PWA update reliability section
  after = after.replace(
    /\s*# -{5,}\s*\n\s*# PWA update reliability\s*\n\s*# -{5,}\s*\n[\s\S]*?(?=\s*# -{5,}|\s*location|\s*})/gm,
    ''
  );

  // Remove service worker location block
  after = after.replace(/^\s*# Ensure the service worker updates reliably\s*\n/gm, '');
  after = after.replace(/^\s*location = \/sw\.js \{[\s\S]*?\n\s*\}\s*\n/gm, '');

  // Remove manifest location block
  after = after.replace(/^\s*# Ensure the manifest updates reliably\s*\n/gm, '');
  after = after.replace(/^\s*location = \/manifest\.webmanifest \{[\s\S]*?\n\s*\}\s*\n/gm, '');

  // Update CSP to remove PWA-specific directives
  after = after.replace(/worker-src 'self';\s*\n\s*/g, '');
  after = after.replace(/manifest-src 'self';\s*\n\s*/g, '');

  // Remove PWA comment from CSP
  after = after.replace(/^\s*#\s*-\s*Allows service worker and manifest\s*\n/gm, '');

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(nginxPath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA section from .env.example
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromEnvExample(rootDir) {
  const envExamplePath = path.join(rootDir, '.env.example');
  if (!exists(envExamplePath)) return false;

  const before = readText(envExamplePath);
  let after = before;

  // Remove PWA section (lines 28-50)
  after = after.replace(
    /# -{5,}\s*\n# 📱 PWA \(Development Mode\)[\s\S]*?VITE_PWA=false\s*\n/gm,
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
 * Remove PWA initialization from src/main.tsx
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromMainTsx(rootDir) {
  const mainPath = path.join(rootDir, 'src/main.tsx');
  if (!exists(mainPath)) return false;

  const before = readText(mainPath);
  let after = before;

  // Remove import
  after = after.replace(/import\s+\{\s*initPWA\s*\}\s+from\s+['"]\.\/sw\/pwa['"]\s*;?\s*\n?/g, '');
  // Remove function call
  after = after.replace(/^\s*initPWA\(\)\s*;?\s*$/gm, '');

  if (after !== before) {
    writeText(mainPath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA type reference from vite-env.d.ts
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromViteEnv(rootDir) {
  const envPath = path.join(rootDir, 'src/vite-env.d.ts');
  if (!exists(envPath)) return false;

  const before = readText(envPath);
  const after = before.replace(
    /\/\/\/\s*<reference\s+types=["']vite-plugin-pwa\/client["']\s*\/>\s*\n?/g,
    ''
  );

  if (after !== before) {
    writeText(envPath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA-related meta tags and links from index.html
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromIndexHtml(rootDir) {
  const indexPath = path.join(rootDir, 'index.html');
  if (!exists(indexPath)) return false;

  const before = readText(indexPath);
  let after = before;

  // Remove PWA-specific tags
  const pwaPatterns = [
    /^\s*<link[^>]*rel=["']manifest["'][^>]*>\s*$/gm,
    /^\s*<link[^>]*rel=["']apple-touch-icon["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']mobile-web-app-capable["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']apple-mobile-web-app-capable["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']apple-mobile-web-app-status-bar-style["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']apple-mobile-web-app-title["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']application-name["'][^>]*>\s*$/gm,
    /^\s*<meta[^>]*name=["']msapplication-TileColor["'][^>]*>\s*$/gm,
    /^\s*<!--\s*PWA[^>]*-->\s*$/gm,
    /^\s*<!--\s*Additional PWA[^>]*-->\s*$/gm,
  ];

  for (const pattern of pwaPatterns) {
    after = after.replace(pattern, '');
  }

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(indexPath, after);
    return true;
  }
  return false;
}

/**
 * Remove PWA exports from index files and clean up empty directories
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaExports(rootDir) {
  let changed = false;

  // Remove from plugins/index.ts
  const pluginsIndex = path.join(rootDir, 'plugins/index.ts');
  if (exists(pluginsIndex)) {
    const before = readText(pluginsIndex);
    let after = before;

    // Remove pwaPlugin export
    after = after.replace(/export\s+\{\s*pwaPlugin\s*\}\s+from\s+['"]\.\/pwa['"];?\s*\n?/g, '');

    // Remove htmlTransformPlugin export
    after = after.replace(
      /export\s+\{\s*htmlTransformPlugin\s*\}\s+from\s+['"]\.\/html-transform['"];?\s*\n?/g,
      ''
    );

    if (after !== before) {
      // If file is now empty, remove it and the directory
      if (after.trim() === '') {
        safeUnlink(pluginsIndex);
        safeRmdirIfEmpty(path.join(rootDir, 'plugins'));
      } else {
        writeText(pluginsIndex, after);
      }
      changed = true;
    }
  }

  // Remove from src/utils/index.ts
  const utilsIndex = path.join(rootDir, 'src/utils/index.ts');
  if (exists(utilsIndex)) {
    const before = readText(utilsIndex);
    const after = before.replace(/export\s+\*\s+from\s+['"]\.\/pwa['"];?\s*\n?/g, '');
    if (after !== before) {
      writeText(utilsIndex, after);
      changed = true;
    }
  }

  // Remove from src/types/index.ts
  const typesIndex = path.join(rootDir, 'src/types/index.ts');
  if (exists(typesIndex)) {
    const before = readText(typesIndex);
    const after = before.replace(/export\s+\*\s+from\s+['"]\.\/pwa['"];?\s*\n?/g, '');
    if (after !== before) {
      writeText(typesIndex, after);
      changed = true;
    }
  }

  // Remove src/pwa directory
  if (safeRmDir(path.join(rootDir, 'src/pwa'))) changed = true;

  return changed;
}

/**
 * Remove PWA references from README.md
 * @param {string} rootDir - Project root directory
 * @returns {boolean} True if changes were made
 */
function removePwaFromReadme(rootDir) {
  const readmePath = path.join(rootDir, 'README.md');
  if (!exists(readmePath)) return false;

  const before = readText(readmePath);
  let after = before;

  // Remove all marked PWA sections (handles multiple markers)
  after = removeMarkedSection(after, 'PWA');

  // Remove PWA references using consolidated patterns
  const pwaPatterns = [
    /^\s*-\s+\*\*PWA Support\*\*[^\n]*\n/gm, // Features list
    /^\s*-\s+\*\*PWA Support\*\*\s+–[^\n]*\n/gm, // Setup instructions
    /^\s*yarn setup:pwa\s*\n/gm, // Script reference
    /^\s*├──\s+pwa\/[^\n]*\n/gm, // Project structure
    /^\s*├──\s+sw\/[^\n]*\n/gm, // Project structure
  ];

  for (const pattern of pwaPatterns) {
    after = after.replace(pattern, '');
  }

  // Remove VITE_PWA from environment variables table
  after = after.replace(/^\s*\|\s*`VITE_PWA`[^\n]*\n/gm, '');

  // Remove PWA support bullets from Docker features section
  after = after.replace(/^\s*-\s+\*\*PWA support\*\*:[\s\S]*?(?=^\s*-\s+\*\*|###|##)/gm, '');
  after = after.replace(/^\s*-\s+Service worker and manifest caching headers\s*\n/gm, '');
  after = after.replace(/^\s*-\s+CSP configured for PWA features\s*\n/gm, '');

  // Clean up excessive blank lines
  after = after.replace(/\n{3,}/g, '\n\n');

  if (after !== before) {
    writeText(readmePath, after);
    return true;
  }
  return false;
}

/**
 * Delete PWA-specific files
 * @param {string} rootDir - Project root directory
 * @returns {number} Number of files deleted
 */
function removePwaFiles(rootDir) {
  let deleted = 0;
  for (const rel of PWA_FILES) {
    if (safeUnlink(path.join(rootDir, rel))) deleted++;
  }
  return deleted;
}

/**
 * Remove setup:pwa script and delete this file
 * @param {string} rootDir - Project root directory
 * @param {string} thisFile - Path to this script file
 */
function selfDestruct(rootDir, thisFile) {
  removePkgScript(rootDir, 'setup:pwa');
  safeUnlink(thisFile);
}

/**
 * Apply PWA removal changes
 * @param {Object} options - Configuration options
 * @param {string} [options.rootDir] - Project root directory
 * @param {boolean} [options.keep=true] - Whether to keep PWA support
 * @param {boolean} [options.selfDestruct=false] - Whether to self-destruct after removal
 * @returns {Promise<{changed: boolean, removed: boolean}>} Operation result
 */
export async function apply({
  rootDir = getRootDir(),
  keep = true,
  selfDestruct: doSelfDestruct = false,
} = {}) {
  if (keep) return { changed: false, removed: false };

  logStep('Removing PWA support');

  const results = {
    pkg: removePwaFromPackageJson(rootDir),
    vite: removePwaFromViteConfig(rootDir),
    dockerCompose: removePwaFromDockerCompose(rootDir),
    nginx: removePwaFromNginxConf(rootDir),
    main: removePwaFromMainTsx(rootDir),
    env: removePwaFromViteEnv(rootDir),
    envExample: removePwaFromEnvExample(rootDir),
    html: removePwaFromIndexHtml(rootDir),
    exports: removePwaExports(rootDir),
    files: removePwaFiles(rootDir),
    readme: removePwaFromReadme(rootDir),
  };

  // Consolidated logging
  const updates = [
    ['package.json', results.pkg],
    ['vite.config.ts', results.vite],
    ['docker-compose.yml', results.dockerCompose],
    ['nginx.conf', results.nginx],
    ['src/main.tsx', results.main],
    ['vite-env.d.ts', results.env],
    ['.env.example', results.envExample],
    ['index.html', results.html],
    ['exports', results.exports],
    ['README.md', results.readme],
  ];

  for (const [name, changed] of updates) {
    logInfo(`${name}: ${changed ? '✓ updated' : '- no changes'}`);
  }
  logOk(`Deleted ${results.files} PWA file(s)`);

  if (doSelfDestruct) {
    logStep('Cleaning up PWA setup script');
    selfDestruct(rootDir, thisFile);
    logOk('Removed setup:pwa and deleted scripts/setup-pwa.js');
  }

  const changed = Object.values(results).some(v => v);
  return { changed, removed: true };
}

/* ---------------- Direct Run ---------------- */

const rootDirDefault = getRootDir();
const thisFile = path.join(rootDirDefault, 'scripts/setup-pwa.js');

/**
 * Run interactive PWA removal prompt
 */
async function runInteractive() {
  const keep = await askYesNo('Do you want PWA support?', true);
  if (keep) {
    logOk('PWA retained');
    return;
  }

  // Show warning and ask for confirmation
  const { askConfirm } = await import('./_setup-utils.js');
  const confirmed = await askConfirm(
    '⚠️  WARNING: All PWA files, dependencies, and configurations will be permanently removed. This cannot be undone. Continue?'
  );

  if (!confirmed) {
    logInfo('Operation cancelled');
    return;
  }

  await apply({ rootDir: rootDirDefault, keep: false, selfDestruct: true });
  console.log('\n✓ PWA removed. Run your package manager install command to update the lockfile.');
}

if (isDirectRun(import.meta.url)) {
  runInteractive();
}
