import { spawnSync } from 'node:child_process';
import { platform } from 'node:process';

/**
 * Copy text to system clipboard.
 * @returns {boolean} true if succeeded
 */
export function copyToClipboard(text) {
  const candidates = platform === 'win32'
    ? [['clip']]
    : platform === 'darwin'
      ? [['pbcopy']]
      : [['wl-copy'], ['xclip', '-selection', 'clipboard'], ['xsel', '--clipboard', '--input']];

  for (const [cmd, ...args] of candidates) {
    try {
      const result = spawnSync(cmd, args, { input: text, encoding: 'utf-8' });
      if (result.status === 0) return true;
    } catch {
      // Try next candidate.
    }
  }
  return false;
}
