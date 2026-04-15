import {
  existsSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function copyFile(src, dst, { dryRun = false } = {}) {
  if (dryRun) return { action: 'copy', src, dst, applied: false };
  ensureDir(dirname(dst));
  if (src.endsWith('.sh')) {
    // Always write shell scripts with LF endings.
    // Prevents CRLF contamination when git later checks out these files on Windows
    // (core.autocrlf=true overrides .gitattributes in the *user's* repo, which dw-kit cannot control).
    const content = readFileSync(src, 'utf-8').replace(/\r\n/g, '\n');
    writeFileSync(dst, content, 'utf-8');
  } else {
    copyFileSync(src, dst);
  }
  return { action: 'copy', src, dst, applied: true };
}

export function copyDir(srcDir, dstDir, { dryRun = false, overwrite = false } = {}) {
  const results = [];
  if (!existsSync(srcDir)) return results;

  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(dstDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...copyDir(srcPath, dstPath, { dryRun, overwrite }));
    } else if (entry.isFile()) {
      if (!overwrite && existsSync(dstPath)) {
        results.push({ action: 'skip', src: srcPath, dst: dstPath, reason: 'exists' });
        continue;
      }
      results.push(copyFile(srcPath, dstPath, { dryRun }));
    }
  }
  return results;
}

/**
 * Copy files from srcDir to dstDir, respecting an overrides directory.
 * Files present in overridesDir take precedence over srcDir.
 */
export function copyWithOverrides(srcDir, dstDir, overridesDir, { dryRun = false } = {}) {
  const results = [];
  if (!existsSync(srcDir)) return results;

  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(dstDir, entry.name);
    const overridePath = overridesDir ? join(overridesDir, entry.name) : null;

    if (entry.isDirectory()) {
      const subOverride = overridePath && existsSync(overridePath) ? overridePath : null;
      results.push(...copyWithOverrides(srcPath, dstPath, subOverride, { dryRun }));
    } else if (entry.isFile()) {
      if (overridePath && existsSync(overridePath)) {
        results.push({
          action: 'override',
          src: overridePath,
          dst: dstPath,
          ...(dryRun ? { applied: false } : (() => { ensureDir(dirname(dstPath)); copyFileSync(overridePath, dstPath); return { applied: true }; })()),
        });
      } else {
        results.push(copyFile(srcPath, dstPath, { dryRun }));
      }
    }
  }
  return results;
}

/**
 * Compute file differences between two directories.
 * Returns { added, modified, unchanged } arrays of relative paths.
 */
export function diffDirs(sourceDir, targetDir) {
  const added = [];
  const modified = [];
  const unchanged = [];

  if (!existsSync(sourceDir)) return { added, modified, unchanged };

  function walk(dir, base) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(dir, entry.name);
      const relPath = base ? join(base, entry.name) : entry.name;

      if (entry.isDirectory()) {
        walk(srcPath, relPath);
      } else if (entry.isFile()) {
        const targetPath = join(targetDir, relPath);
        if (!existsSync(targetPath)) {
          added.push(relPath);
        } else {
          const srcContent = readFileSync(srcPath);
          const tgtContent = readFileSync(targetPath);
          if (srcContent.equals(tgtContent)) {
            unchanged.push(relPath);
          } else {
            modified.push(relPath);
          }
        }
      }
    }
  }

  walk(sourceDir, '');
  return { added, modified, unchanged };
}
