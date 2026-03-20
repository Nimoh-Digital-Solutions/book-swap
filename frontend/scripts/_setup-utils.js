#!/usr/bin/env node
// @ts-check

/**
 * Shared utility functions for setup scripts
 * Provides common file operations, user interaction, and code manipulation utilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import readline from 'readline';
import prompts from 'prompts';

/**
 * Get the root directory of the project
 * @returns {string} Absolute path to project root
 */
export function getRootDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

/**
 * Check if a file or directory exists
 * @param {string} absPath - Absolute path to check
 * @returns {boolean} True if path exists
 */
export function exists(absPath) {
  return fs.existsSync(absPath);
}

/**
 * Read text file contents
 * @param {string} absPath - Absolute path to file
 * @returns {string} File contents as UTF-8 string
 */
export function readText(absPath) {
  return fs.readFileSync(absPath, 'utf-8');
}

/**
 * Write text content to file
 * @param {string} absPath - Absolute path to file
 * @param {string} content - Content to write
 */
export function writeText(absPath, content) {
  fs.writeFileSync(absPath, content);
}

/**
 * Read and parse JSON file
 * @param {string} absPath - Absolute path to JSON file
 * @returns {any} Parsed JSON object
 */
export function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf-8'));
}

/**
 * Write object to JSON file with formatting
 * @param {string} absPath - Absolute path to JSON file
 * @param {any} data - Data to serialize
 */
export function writeJson(absPath, data) {
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Safely delete a file (no error if missing)
 * @param {string} absPath - Absolute path to file
 * @returns {boolean} True if file was deleted
 */
export function safeUnlink(absPath) {
  if (!exists(absPath)) return false;
  try {
    fs.unlinkSync(absPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely delete a directory recursively (no error if missing)
 * @param {string} absDir - Absolute path to directory
 * @returns {boolean} True if directory was deleted
 */
export function safeRmDir(absDir) {
  if (!exists(absDir)) return false;
  try {
    fs.rmSync(absDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete directory only if it's empty
 * @param {string} absDir - Absolute path to directory
 * @returns {boolean} True if directory was deleted
 */
export function safeRmdirIfEmpty(absDir) {
  if (!exists(absDir)) return false;
  try {
    const items = fs.readdirSync(absDir);
    if (items.length === 0) {
      fs.rmdirSync(absDir);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Create readline interface for user input
 * @returns {readline.Interface} Readline interface
 */
export function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

/**
 * Ask user a yes/no question with arrow-key selection
 * @param {string} message - Question to ask
 * @param {boolean} [initial=true] - Default value (true for Yes, false for No)
 * @returns {Promise<boolean>} True if user selected Yes, false if No
 */
export async function askYesNo(message, initial = true) {
  const response = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices: [
      { title: 'Yes', value: true },
      { title: 'No', value: false },
    ],
    initial: initial ? 0 : 1,
  });

  // Handle Ctrl+C or ESC (user cancelled)
  if (response.value === undefined) {
    console.log('\nOperation cancelled');
    process.exit(0);
  }

  return response.value;
}

/**
 * Ask user for confirmation with a warning message
 * @param {string} message - Warning message to display
 * @param {boolean} [initial=false] - Default value (false for safety)
 * @returns {Promise<boolean>} True if user confirmed, false otherwise
 */
export async function askConfirm(message, initial = false) {
  const response = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices: [
      { title: "Yes, I'm sure", value: true },
      { title: 'No, cancel', value: false },
    ],
    initial: initial ? 0 : 1,
  });

  // Handle Ctrl+C or ESC (user cancelled)
  if (response.value === undefined) {
    console.log('\nOperation cancelled');
    process.exit(0);
  }

  return response.value;
}

/**
 * Check if script is being run directly (not imported)
 * @param {string} importMetaUrl - import.meta.url from calling script
 * @returns {boolean} True if script is being run directly
 */
export function isDirectRun(importMetaUrl) {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  return pathToFileURL(path.resolve(argv1)).href === importMetaUrl;
}

/**
 * Log a step header
 * @param {string} msg - Message to log
 */
export function logStep(msg) {
  console.log(`\n▶ ${msg}`);
}

/**
 * Log a success message
 * @param {string} msg - Message to log
 */
export function logOk(msg) {
  console.log(`  ✓ ${msg}`);
}

/**
 * Log an info message
 * @param {string} msg - Message to log
 */
export function logInfo(msg) {
  console.log(`  • ${msg}`);
}

/**
 * Log a warning message
 * @param {string} msg - Message to log
 */
export function logWarn(msg) {
  console.warn(`  ! ${msg}`);
}

/**
 * Remove a script entry from package.json
 * @param {string} rootDir - Project root directory
 * @param {string} scriptName - Name of script to remove
 * @returns {boolean} True if script was removed
 */
export function removePkgScript(rootDir, scriptName) {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!exists(pkgPath)) return false;

  const pkg = readJson(pkgPath);
  if (!pkg.scripts?.[scriptName]) return false;

  delete pkg.scripts[scriptName];
  writeJson(pkgPath, pkg);
  return true;
}

/**
 * Remove an object literal block by key using brace counting
 * Safely handles nested objects
 * @param {string} source - Source code to modify
 * @param {string} key - Object key to remove
 * @returns {string} Modified source code
 * @example
 * removeObjectBlockByKey(viteConfig, 'test')
 * // Removes: test: { ... },
 */
export function removeObjectBlockByKey(source, key) {
  const m = source.match(new RegExp(`\\n(\\s*)${key}\\s*:\\s*\\{`));
  if (!m || m.index == null) return source;

  const startIndex = m.index + 1;
  const braceStart = m.index + m[0].length - 1;

  let braceCount = 0;
  let endIndex = braceStart;

  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') braceCount++;
    else if (ch === '}') braceCount--;

    if (braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }

  let removeTo = endIndex;
  while (removeTo < source.length && /[ \t]/.test(source[removeTo])) removeTo++;
  if (source[removeTo] === ',') {
    removeTo++;
    if (source[removeTo] === '\n') removeTo++;
  }

  return source.slice(0, startIndex) + source.slice(removeTo);
}

/**
 * Remove a section from content between HTML comment markers
 * @param {string} content - Content to modify
 * @param {string} marker - Marker name (e.g., 'PWA', 'TESTING', 'SETUP')
 * @returns {string} Content with marked section removed
 * @example
 * removeMarkedSection(readme, 'PWA')
 * // Removes: <!-- OPTIONAL:PWA:START --> ... <!-- OPTIONAL:PWA:END -->
 */
export function removeMarkedSection(content, marker) {
  const startComment = `<!-- OPTIONAL:${marker}:START -->`;
  const endComment = `<!-- OPTIONAL:${marker}:END -->`;

  const regex = new RegExp(
    `\\n?${escapeRegex(startComment)}[\\s\\S]*?${escapeRegex(endComment)}\\n?`,
    'g'
  );

  return content.replace(regex, '\n');
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for use in RegExp
 * @private
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
