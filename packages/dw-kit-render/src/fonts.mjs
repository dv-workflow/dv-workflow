import { existsSync, readFileSync } from 'node:fs';
import { platform } from 'node:os';

/**
 * Common system mono fonts that ship by default on each platform.
 * Order = preference (first match wins).
 */
const SYSTEM_FONTS = {
  win32: [
    'C:/Windows/Fonts/consola.ttf',     // Consolas
    'C:/Windows/Fonts/lucon.ttf',       // Lucida Console
    'C:/Windows/Fonts/cour.ttf',        // Courier New
  ],
  linux: [
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    '/usr/share/fonts/TTF/DejaVuSansMono.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
  ],
  darwin: [
    '/System/Library/Fonts/Menlo.ttc',
    '/System/Library/Fonts/Monaco.ttf',
    '/Library/Fonts/Courier New.ttf',
  ],
};

/**
 * @returns {string|null} absolute path to a usable mono font, or null if none found
 */
export function findSystemFont() {
  const candidates = SYSTEM_FONTS[platform()] || [];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Detect whether a string argument looks like a filesystem path
 * (vs a font family name like "JetBrains Mono"). Allows us to accept either
 * form without forcing callers to disambiguate.
 */
function looksLikePath(s) {
  if (typeof s !== 'string') return false;
  if (s.includes('/') || s.includes('\\')) return true;
  return /\.(ttf|otf|ttc|woff2?)$/i.test(s);
}

/**
 * Resolve a font argument into { buffer, path } for satori + resvg respectively.
 * satori needs the buffer; resvg-js's font option wants a path on disk.
 *
 * Accepts:
 *   - Buffer        → used as-is for satori; resvg falls back to system fonts.
 *   - "/abs/path"   → loaded as TTF file.
 *   - "Family Name" → treated as metadata only; auto-detects a system font.
 *   - undefined     → auto-detects a system font.
 *
 * @param {string|Buffer|undefined} font
 * @returns {{buffer: Buffer, path: string|null}}
 */
export function resolveFont(font) {
  if (Buffer.isBuffer(font)) {
    return { buffer: font, path: null };
  }
  if (typeof font === 'string' && looksLikePath(font)) {
    if (!existsSync(font)) {
      throw new Error(`dw-kit-render: font file not found: ${font}`);
    }
    return { buffer: readFileSync(font), path: font };
  }
  // string-but-not-a-path (e.g. "JetBrains Mono") OR undefined → auto-detect.
  const detected = findSystemFont();
  if (!detected) {
    throw new Error(
      'dw-kit-render: no font available. Pass opts.font (path string or Buffer), ' +
      'or install a monospace font (Consolas on Windows, DejaVu Sans Mono on Linux, Menlo on macOS).'
    );
  }
  return { buffer: readFileSync(detected), path: detected };
}
