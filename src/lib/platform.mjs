import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Detect which AI development platform is available.
 * Returns: 'claude-cli' | 'cursor' | 'generic'
 */
export function detectPlatform(projectDir = process.cwd()) {
  if (isClaudeCliAvailable()) return 'claude-cli';
  if (isCursorProject(projectDir)) return 'cursor';
  return 'generic';
}

function isClaudeCliAvailable() {
  try {
    execSync('claude --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function isCursorProject(projectDir) {
  return (
    existsSync(join(projectDir, '.cursor')) ||
    existsSync(join(projectDir, '.cursorrc')) ||
    process.env.CURSOR_SESSION_ID != null
  );
}

export function platformLabel(platform) {
  const labels = {
    'claude-cli': 'Claude Code CLI',
    'cursor': 'Cursor IDE',
    'generic': 'Generic (AGENT.md)',
  };
  return labels[platform] || platform;
}
