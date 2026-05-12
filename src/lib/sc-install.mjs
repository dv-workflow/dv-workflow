import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOOK_COMMAND = 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/supply-chain-scan.sh"';
const MATCHER = 'Write|Edit';

export function settingsPath(rootDir = process.cwd()) {
  return join(rootDir, '.claude', 'settings.json');
}

export function isHookWired(settings) {
  if (!settings?.hooks?.PostToolUse) return false;
  for (const group of settings.hooks.PostToolUse) {
    if (group.matcher !== MATCHER && !(group.matcher || '').split('|').includes('Write')) continue;
    if (!Array.isArray(group.hooks)) continue;
    for (const h of group.hooks) {
      if (h.command && h.command.includes('supply-chain-scan.sh')) return true;
    }
  }
  return false;
}

export function wireHook(settings) {
  settings.hooks = settings.hooks || {};
  settings.hooks.PostToolUse = settings.hooks.PostToolUse || [];

  let group = settings.hooks.PostToolUse.find((g) => g.matcher === MATCHER);
  if (!group) {
    group = { matcher: MATCHER, hooks: [] };
    settings.hooks.PostToolUse.push(group);
  }
  group.hooks = group.hooks || [];

  for (const h of group.hooks) {
    if (h.command && h.command.includes('supply-chain-scan.sh')) {
      return { action: 'noop', reason: 'already wired' };
    }
  }

  group.hooks.push({ type: 'command', command: HOOK_COMMAND });
  return { action: 'added' };
}

export function unwireHook(settings) {
  if (!settings?.hooks?.PostToolUse) return { action: 'noop', reason: 'no PostToolUse' };

  let removed = 0;
  for (const group of settings.hooks.PostToolUse) {
    if (!Array.isArray(group.hooks)) continue;
    const before = group.hooks.length;
    group.hooks = group.hooks.filter((h) => !(h.command && h.command.includes('supply-chain-scan.sh')));
    removed += before - group.hooks.length;
  }
  return removed > 0 ? { action: 'removed', count: removed } : { action: 'noop', reason: 'not wired' };
}

export function installHookInProject(rootDir = process.cwd()) {
  const p = settingsPath(rootDir);
  if (!existsSync(p)) {
    return { ok: false, error: 'settings.json not found — run `dw init` first', path: p };
  }
  let settings;
  try {
    settings = JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e) {
    return { ok: false, error: `failed to parse settings.json: ${e.message}`, path: p };
  }

  const result = wireHook(settings);
  if (result.action === 'added') {
    writeFileSync(p, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }
  return { ok: true, ...result, path: p };
}

export function uninstallHookFromProject(rootDir = process.cwd()) {
  const p = settingsPath(rootDir);
  if (!existsSync(p)) {
    return { ok: false, error: 'settings.json not found', path: p };
  }
  let settings;
  try {
    settings = JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e) {
    return { ok: false, error: `failed to parse settings.json: ${e.message}`, path: p };
  }

  const result = unwireHook(settings);
  if (result.action === 'removed') {
    writeFileSync(p, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
  }
  return { ok: true, ...result, path: p };
}
