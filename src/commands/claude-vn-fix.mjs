import { existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { header, info, ok, warn, err, log } from '../lib/ui.mjs';

export const PATCH_MARKER = '/* dw-kit Vietnamese IME fix */';
export const DEL_CHAR = '\x7f';

export async function claudeVnFixCommand(opts) {
  header('dw-kit Claude Vietnamese IME Fix');

  const filePath = opts.path ? opts.path : findCliJs();
  log(`Target file: ${filePath}`);

  if (!existsSync(filePath)) {
    err(`File not found: ${filePath}`);
    process.exit(1);
  }

  if (opts.restore) {
    info('Restoring from latest backup');
    const restored = restoreLatestBackup(filePath, { dryRun: !!opts.dryRun });
    if (!restored) process.exit(1);
    ok('Restore complete. Restart Claude CLI.');
    return;
  }

  info('Patching');
  const result = patchCliJs(filePath, { dryRun: !!opts.dryRun });
  if (!result.ok) {
    err(result.message);
    process.exit(1);
  }
  ok(result.message);
  log('Restart Claude CLI for changes to take effect.');
  warn('Note: This modifies a third-party installed file; you may need to re-run after Claude updates.');
}

export function findCliJs() {
  // Strategy: check global npm root first, then common cache locations.
  // This is intentionally conservative (no deep recursive scan of entire home).
  const candidates = [];

  // npm root -g
  const npmRoot = tryNpmRootGlobal();
  if (npmRoot) {
    candidates.push(join(npmRoot, '@anthropic-ai', 'claude-code', 'cli.js'));
  }

  const home = os.homedir();
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || '';
    const localAppData = process.env.LOCALAPPDATA || '';
    if (appData) candidates.push(join(appData, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'));
    if (localAppData) {
      const npxBase = join(localAppData, 'npm-cache', '_npx');
      const latest = findLatestNpxClaudeCli(npxBase);
      if (latest) candidates.push(latest);
    }
  } else {
    const npxLatest = findLatestNpxClaudeCli(join(home, '.npm', '_npx'));
    if (npxLatest) candidates.push(npxLatest);
    candidates.push('/usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js');
    candidates.push('/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/cli.js');
  }

  for (const p of candidates) {
    if (p && existsSync(p) && statSync(p).isFile()) return p;
  }

  throw new Error(
    'Could not auto-detect @anthropic-ai/claude-code/cli.js.\n' +
    'Provide it explicitly via: dw claude-vn-fix --path "<path-to-cli.js>"',
  );
}

function tryNpmRootGlobal() {
  try {
    const out = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8', timeout: 5000 });
    return out.trim();
  } catch {
    return null;
  }
}

function safeMtime(p) {
  try { return statSync(p).mtimeMs || 0; } catch { return 0; }
}

function findLatestNpxClaudeCli(npxBase) {
  try {
    if (!npxBase || !existsSync(npxBase)) return null;
    const entries = readdirSync(npxBase, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => join(npxBase, e.name));
    const sorted = entries
      .map((d) => ({ d, t: safeMtime(d) }))
      .sort((a, b) => b.t - a.t)
      .map((x) => x.d);

    for (const dir of sorted.slice(0, 50)) {
      const p = join(dir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
      if (existsSync(p)) return p;
    }
    return null;
  } catch {
    return null;
  }
}

export function patchCliJs(filePath, { dryRun }) {
  const content = readFileSync(filePath, 'utf-8');

  // Guard: ensure this is actually a Claude CLI bundle before patching.
  if (!content.includes('@anthropic-ai') && !content.includes('claude-code')) {
    return { ok: false, message: 'File does not appear to be a Claude CLI bundle. Use --path to specify the correct file.' };
  }

  if (content.includes(PATCH_MARKER)) {
    return { ok: true, message: 'Already patched (marker found).' };
  }

  const idx = findBugPatternIndex(content);
  if (idx === -1) {
    return { ok: false, message: 'Bug pattern not found (.includes("\\x7f")). Claude may already be fixed upstream.' };
  }

  const { start, end, block } = findIfBlock(content, idx);
  const vars = extractVariables(block);
  const fixCode = generateFix(vars);
  const patched = content.slice(0, start) + fixCode + content.slice(end);

  if (dryRun) {
    log('DRY RUN: would create backup and patch file.');
    log(`Detected vars: input=${vars.input}, state=${vars.state}, cur=${vars.curState}`);
    return { ok: true, message: 'Dry run OK.' };
  }

  const backupPath = createBackup(filePath);
  ok(`Backup created: ${backupPath}`);
  try {
    writeFileSync(filePath, patched, 'utf-8');
    const verify = readFileSync(filePath, 'utf-8');
    if (!verify.includes(PATCH_MARKER)) throw new Error('verify failed (marker missing after write)');
    return { ok: true, message: `Patch applied. Backup: ${backupPath}` };
  } catch (e) {
    warn(`Patch failed: ${e.message}`);
    warn('Rolling back from backup.');
    copyFileSync(backupPath, filePath);
    return { ok: false, message: `Patch failed and rolled back: ${e.message}` };
  }
}

function findBugPatternIndex(content) {
  // Claude builds may contain either:
  // - literal escape sequence: ".includes(\"\\x7f\")"
  // - actual DEL char 0x7f inside the string: ".includes(\"\")"
  const literal = content.indexOf('.includes("\\x7f")');
  if (literal !== -1) return literal;
  return content.indexOf(`.includes("${DEL_CHAR}")`);
}

function createBackup(filePath) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${ts}`;
  copyFileSync(filePath, backupPath);
  return backupPath;
}

export function restoreLatestBackup(filePath, { dryRun }) {
  const dir = dirname(filePath);
  const base = filePath.split(/[\\/]/).pop();
  const backups = readdirSync(dir)
    .filter((f) => f.startsWith(`${base}.backup-`))
    .map((f) => join(dir, f))
    .map((p) => ({ p, t: safeMtime(p) }))
    .sort((a, b) => b.t - a.t);

  const latest = backups[0]?.p;
  if (!latest) {
    err('No backups found to restore.');
    return false;
  }

  if (dryRun) {
    log(`DRY RUN: would restore from ${latest}`);
    return true;
  }

  copyFileSync(latest, filePath);
  ok(`Restored from: ${latest}`);
  return true;
}

function findIfBlock(content, idx) {
  // Search backward from idx within a 500-char window to find the nearest if(
  const windowStart = Math.max(0, idx - 500);
  const searchSlice = content.slice(windowStart, idx);
  const localOffset = searchSlice.lastIndexOf('if(');
  if (localOffset === -1) throw new Error('Could not find containing if(...) block');
  const start = windowStart + localOffset;

  let depth = 0;
  let end = -1;
  for (let i = start; i < content.length; i++) {
    const c = content[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) throw new Error('Could not find end of if block (brace mismatch)');
  if (idx < start || idx > end) throw new Error('Bug pattern found outside expected if block');
  return { start, end, block: content.slice(start, end) };
}

function extractVariables(block) {
  // Normalize DEL char for regex matching
  const normalized = block.replaceAll(DEL_CHAR, '\\x7f');

  // Match: let COUNT=(INPUT.match(/\x7f/g)||[]).length,STATE=CURSTATE;
  const m = normalized.match(/let ([\w$]+)=\(\w+\.match\(\/\\x7f\/g\)\|\|\[\]\)\.length[,;]([\w$]+)=([\w$]+)[;,]/);
  if (!m) throw new Error('Could not extract variables (count/state/curState)');
  const state = m[2];
  const curState = m[3];

  const m2 = block.match(new RegExp(`([\\w$]+)\\(${escapeRegex(state)}\\.text\\);([\\w$]+)\\(${escapeRegex(state)}\\.offset\\)`));
  if (!m2) throw new Error('Could not extract update functions');

  const m3 = block.match(/([\w$]+)\.includes\("/);
  if (!m3) throw new Error('Could not extract input variable');

  return {
    input: m3[1],
    state,
    curState,
    updateText: m2[1],
    updateOffset: m2[2],
  };
}

function generateFix(v) {
  // This mirrors the known fix: backspace N times, then insert replacement text.
  return (
    `${PATCH_MARKER}` +
    `if(${v.input}.includes("\\x7f")){` +
    `let _n=(${v.input}.match(/\\x7f/g)||[]).length,` +
    `_vn=${v.input}.replace(/\\x7f/g,""),` +
    `${v.state}=${v.curState};` +
    `for(let _i=0;_i<_n;_i++)${v.state}=${v.state}.backspace();` +
    `for(const _c of _vn)${v.state}=${v.state}.insert(_c);` +
    `if(!${v.curState}.equals(${v.state})){` +
    `if(${v.curState}.text!==${v.state}.text)${v.updateText}(${v.state}.text);` +
    `${v.updateOffset}(${v.state}.offset)` +
    `}return;}`
  );
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
