/**
 * Sanitize an arbitrary scope string (branch name, task name, free-form label)
 * into a filesystem-safe directory slug usable on Windows + POSIX.
 *
 * Rules:
 *   - Strip filesystem-illegal chars on Windows (NTFS): / \ : * ? " < > |
 *   - Collapse whitespace + control chars to single dash
 *   - Collapse runs of dashes/underscores/dots
 *   - Trim leading/trailing dashes, underscores, dots
 *   - Forbid reserved Windows device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 *     by prefixing with `_` if matched
 *   - Cap length at maxLength (default 80)
 *   - Lowercase optional (default keeps case; renderer config can opt-in)
 *
 * Examples:
 *   "fix/sc-guard-v1.3.6"     → "fix-sc-guard-v1.3.6"
 *   "feat: thêm tính năng"     → "feat-thêm-tính-năng" (Unicode preserved)
 *   "  multiple   spaces  "    → "multiple-spaces"
 *   "CON"                      → "_CON"
 *   "../../etc/passwd"         → "etc-passwd"
 *
 * @param {string} scope - raw scope string
 * @param {{maxLength?: number, lowercase?: boolean}} [opts]
 * @returns {string} sanitized slug
 * @throws {Error} if input is empty after sanitization
 */
export function scopeSlug(scope, opts = {}) {
  const { maxLength = 80, lowercase = false } = opts;

  if (typeof scope !== 'string') {
    throw new Error('scope must be a string');
  }

  let s = scope;

  // Strip Windows-illegal chars + control chars (0x00-0x1F, 0x7F).
  s = s.replace(/[\\/:*?"<>|\x00-\x1F\x7F]+/g, '-');

  // Strip path traversal segments.
  s = s.replace(/\.\.+/g, '-');

  // Collapse whitespace runs to single dash.
  s = s.replace(/\s+/g, '-');

  // Collapse runs of separators (dash/underscore/dot) — keep one.
  s = s.replace(/[-_.]{2,}/g, (m) => m[0]);

  // Trim leading/trailing separators.
  s = s.replace(/^[-_.]+|[-_.]+$/g, '');

  if (lowercase) s = s.toLowerCase();

  // Reserved Windows device names (case-insensitive).
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(s)) {
    s = `_${s}`;
  }

  // Cap length.
  if (s.length > maxLength) {
    s = s.slice(0, maxLength).replace(/[-_.]+$/g, '');
  }

  if (s.length === 0) {
    throw new Error('scope sanitization produced empty slug — provide a non-empty alphanumeric scope');
  }

  return s;
}
