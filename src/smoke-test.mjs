#!/usr/bin/env node
/**
 * dw-kit Smoke Test
 * Run: node src/smoke-test.mjs
 *
 * Tests all CLI commands in an isolated temp directory.
 * Exit code 0 = all pass, 1 = failures found.
 */

import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { copyFileSync } from 'node:fs';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const DW_BIN = resolve(__dirname, '..', 'bin', 'dw.mjs');
const TEMP_BASE = join(resolve(__dirname, '..'), '.smoke-test-tmp');

let passed = 0;
let failed = 0;

const PENDING = [];

function test(name, fn) {
  PENDING.push({ name, fn });
}

async function runPending() {
  for (const { name, fn } of PENDING) {
    try {
      const ret = fn();
      if (ret && typeof ret.then === 'function') await ret;
      console.log(`  ✓  ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗  ${name}`);
      console.log(`     ${e.message}`);
      failed++;
    }
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function dw(args, cwd) {
  return execSync(`node "${DW_BIN}" ${args}`, {
    cwd,
    encoding: 'utf-8',
    timeout: 30000,
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function freshDir(name) {
  const dir = join(TEMP_BASE, name);
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  return dir;
}

// ── Setup ────────────────────────────────────────────────────────────────────
console.log();
console.log('══════════════════════════════════════════');
console.log('  dw-kit Smoke Tests');
console.log('══════════════════════════════════════════');
console.log();

if (existsSync(TEMP_BASE)) rmSync(TEMP_BASE, { recursive: true });
mkdirSync(TEMP_BASE, { recursive: true });

// ── Test: CLI basics ─────────────────────────────────────────────────────────
console.log('▶ CLI basics');

test('--version returns semver', () => {
  const out = dw('--version', TEMP_BASE).trim();
  assert(/^\d+\.\d+\.\d+$/.test(out), `Got: ${out}`);
});

test('--help lists all commands', () => {
  const out = dw('--help', TEMP_BASE);
  for (const cmd of ['init', 'upgrade', 'validate', 'doctor', 'prompt', 'claude-vn-fix']) {
    assert(out.includes(cmd), `Missing command: ${cmd}`);
  }
});

test('init --help shows options', () => {
  const out = dw('init --help', TEMP_BASE);
  assert(out.includes('--preset'), 'Missing --preset');
  assert(out.includes('--adapter'), 'Missing --adapter');
  assert(out.includes('--silent'), 'Missing --silent');
});

// ── Test: dw init ────────────────────────────────────────────────────────────
console.log();
console.log('▶ dw init');

test('init --preset solo-quick creates all files', () => {
  const dir = freshDir('init-solo');
  dw('init --preset solo-quick', dir);

  assert(existsSync(join(dir, '.dw', 'config', 'dw.config.yml')), 'Missing config');
  assert(existsSync(join(dir, '.dw', 'config', 'config.schema.json')), 'Missing schema');
  assert(existsSync(join(dir, '.dw', 'core', 'WORKFLOW.md')), 'Missing WORKFLOW.md');
  assert(existsSync(join(dir, '.dw', 'core', 'THINKING.md')), 'Missing THINKING.md');
  assert(existsSync(join(dir, '.dw', 'core', 'QUALITY.md')), 'Missing QUALITY.md');
  assert(existsSync(join(dir, '.dw', 'core', 'ROLES.md')), 'Missing ROLES.md');
  assert(existsSync(join(dir, '.claude', 'settings.json')), 'Missing settings.json');
  assert(existsSync(join(dir, 'CLAUDE.md')), 'Missing CLAUDE.md');
  assert(existsSync(join(dir, '.dw', 'tasks')), 'Missing .dw/tasks');
  const contextTemplate = readFileSync(join(dir, '.dw', 'core', 'templates', 'vi', 'task-context.md'), 'utf-8');
  assert(contextTemplate.includes('Depth Source: default (from config) | override (task-specific)'), 'Missing task depth override guidance in context template');
});

test('init --preset solo-quick sets correct depth', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const config = readFileSync(join(dir, '.dw', 'config', 'dw.config.yml'), 'utf-8');
  assert(config.includes('quick'), 'Depth not set to quick');
});

test('init --preset small-team creates correct roles', () => {
  const dir = freshDir('init-team');
  dw('init --preset small-team', dir);
  const config = readFileSync(join(dir, '.dw', 'config', 'dw.config.yml'), 'utf-8');
  assert(config.includes('techlead'), 'Missing techlead role');
});

test('init --preset enterprise creates all roles', () => {
  const dir = freshDir('init-enterprise');
  dw('init --preset enterprise', dir);
  const config = readFileSync(join(dir, '.dw', 'config', 'dw.config.yml'), 'utf-8');
  for (const role of ['dev', 'techlead', 'ba', 'qc', 'pm']) {
    assert(config.includes(role), `Missing role: ${role}`);
  }
});

test('init --silent with env vars works', () => {
  const dir = freshDir('init-silent');
  execSync(
    `node "${DW_BIN}" init --silent`,
    {
      cwd: dir,
      encoding: 'utf-8',
      timeout: 30000,
      env: {
        ...process.env,
        NO_COLOR: '1',
        DW_NAME: 'test-project',
        DW_DEPTH: 'thorough',
        DW_ROLES: 'dev,ba,qc',
        DW_LANG: 'en',
      },
    },
  );
  const config = readFileSync(join(dir, '.dw', 'config', 'dw.config.yml'), 'utf-8');
  assert(config.includes('test-project'), 'Project name not set');
  assert(config.includes('thorough'), 'Depth not thorough');
  assert(config.includes('en'), 'Language not en');
});

test('init --silent auto-adds required roles for depth', () => {
  const dir = freshDir('init-silent-role-normalize');
  execSync(
    `node "${DW_BIN}" init --silent`,
    {
      cwd: dir,
      encoding: 'utf-8',
      timeout: 30000,
      env: {
        ...process.env,
        NO_COLOR: '1',
        DW_NAME: 'role-normalize',
        DW_DEPTH: 'thorough',
        DW_ROLES: 'dev',
        DW_LANG: 'vi',
      },
    },
  );
  const config = readFileSync(join(dir, '.dw', 'config', 'dw.config.yml'), 'utf-8');
  for (const role of ['dev', 'techlead', 'ba', 'qc', 'pm']) {
    assert(config.includes(role), `Missing role after normalization: ${role}`);
  }
});

test('init --silent fails on invalid DW_DEPTH', () => {
  const dir = freshDir('init-silent-invalid-depth');
  try {
    execSync(
      `node "${DW_BIN}" init --silent`,
      {
        cwd: dir,
        encoding: 'utf-8',
        timeout: 30000,
        env: {
          ...process.env,
          NO_COLOR: '1',
          DW_NAME: 'bad-depth',
          DW_DEPTH: 'standrad',
          DW_ROLES: 'dev,techlead',
          DW_LANG: 'vi',
        },
      },
    );
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status === 1, 'Should exit with code 1');
    assert((e.stdout || '').includes('Invalid DW_DEPTH'), 'Should report invalid DW_DEPTH');
  }
});

test('init --adapter generic creates AGENT.md', () => {
  const dir = freshDir('init-generic');
  dw('init --preset solo-quick --adapter generic', dir);
  assert(existsSync(join(dir, 'AGENT.md')), 'Missing AGENT.md');
  assert(!existsSync(join(dir, '.claude')), '.claude/ should not exist for generic');
});

test('init --adapter cursor creates .cursor/rules/', () => {
  const dir = freshDir('init-cursor');
  dw('init --preset solo-quick --adapter cursor', dir);
  assert(existsSync(join(dir, '.cursor', 'rules', 'dw-workflow.mdc')), 'Missing Cursor rules');
  assert(existsSync(join(dir, 'AGENT.md')), 'Missing AGENT.md');
});

test('init warns on reinitialize', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const out = dw('init --preset solo-quick', dir);
  assert(out.includes('already initialized'), 'Missing reinitialize warning');
});

test('init creates .dw/.gitignore with framework dirs excluded', () => {
  const dir = freshDir('init-gitignore-dw');
  dw('init --preset team', dir);
  const content = readFileSync(join(dir, '.dw', '.gitignore'), 'utf-8');
  for (const expected of ['adapters/', 'core/', 'security/', 'config/*', '!config/dw.config.yml', 'metrics/']) {
    assert(content.includes(expected), `Missing entry: ${expected}`);
  }
  assert(content.includes('dw-kit managed'), 'Missing managed marker');
});

test('init creates .claude/.gitignore with framework dirs excluded', () => {
  const dir = freshDir('init-gitignore-claude');
  dw('init --preset team', dir);
  const content = readFileSync(join(dir, '.claude', '.gitignore'), 'utf-8');
  for (const expected of ['agents/', 'hooks/', 'rules/', 'skills/', 'templates/', 'settings.local.json']) {
    assert(content.includes(expected), `Missing entry: ${expected}`);
  }
});

test('gitignore: user customization preserved outside managed block', async () => {
  const { ensureDwGitignore } = await import('../src/lib/gitignore.mjs');
  const dir = freshDir('gitignore-preserve');
  mkdirSync(join(dir, '.dw'), { recursive: true });
  writeFileSync(join(dir, '.dw', '.gitignore'), '# user custom\nmy-secret.txt\n', 'utf-8');
  ensureDwGitignore(dir);
  const content = readFileSync(join(dir, '.dw', '.gitignore'), 'utf-8');
  assert(content.includes('my-secret.txt'), 'User custom entry should be preserved');
  assert(content.includes('adapters/'), 'Managed block should be added');
});

test('gitignore: idempotent (re-running does not duplicate block)', async () => {
  const { ensureDwGitignore } = await import('../src/lib/gitignore.mjs');
  const dir = freshDir('gitignore-idempotent');
  mkdirSync(join(dir, '.dw'), { recursive: true });
  ensureDwGitignore(dir);
  const first = readFileSync(join(dir, '.dw', '.gitignore'), 'utf-8');
  ensureDwGitignore(dir);
  const second = readFileSync(join(dir, '.dw', '.gitignore'), 'utf-8');
  assert(first === second, 'Second run should not change content');
  const markerCount = (second.match(/dw-kit managed/g) || []).length;
  assert(markerCount === 2, `Expected 2 marker lines (start+end), got ${markerCount}`);
});

test('upgrade refreshes scoped gitignores', () => {
  const dir = freshDir('upgrade-gitignore');
  dw('init --preset team', dir);
  // delete .dw/.gitignore to verify upgrade re-creates it
  const dwIgnore = join(dir, '.dw', '.gitignore');
  rmSync(dwIgnore);
  dw('upgrade', dir);
  assert(existsSync(dwIgnore), '.dw/.gitignore should be re-created by upgrade');
  const content = readFileSync(dwIgnore, 'utf-8');
  assert(content.includes('adapters/'), 'Managed entries should be present');
});

// ── Test: dw validate ────────────────────────────────────────────────────────
console.log();
console.log('▶ dw validate');

test('validate passes on valid config', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const out = dw('validate', dir);
  assert(out.includes('valid'), 'Should report valid');
});

test('validate fails on missing config', () => {
  const dir = freshDir('validate-missing');
  try {
    dw('validate', dir);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status === 1, 'Should exit with code 1');
  }
});

// ── Test: dw doctor ──────────────────────────────────────────────────────────
console.log();
console.log('▶ dw doctor');

test('doctor passes on fully initialized project', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const out = dw('doctor', dir);
  assert(out.includes('WORKFLOW.md'), 'Should check core files');
  assert(out.includes('dw.config.yml'), 'Should check config');
});

test('doctor reports issues on empty project', () => {
  const dir = freshDir('doctor-empty');
  try {
    dw('doctor', dir);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status === 1, 'Should exit with code 1');
  }
});

// ── Test: dw prompt ──────────────────────────────────────────────────────────
console.log();
console.log('▶ dw prompt');

test('prompt --text outputs structured result', () => {
  const out = dw('prompt --text "fix login redirect after OAuth in auth middleware"', TEMP_BASE);
  assert(out.includes('fix login redirect'), 'Should include description in output');
  assert(!out.includes('Description seems short'), 'Long description should skip wizard');
});

test('prompt --text with short input expands without error', () => {
  const out = dw('prompt --text "fix login"', TEMP_BASE);
  assert(out.includes('fix login'), 'Should include description in output');
});

test('prompt --text empty string exits with error', () => {
  try {
    dw('prompt --text ""', TEMP_BASE);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status === 1, 'Should exit with code 1');
  }
});

test('prompt --help shows options', () => {
  const out = dw('prompt --help', TEMP_BASE);
  assert(out.includes('--text'), 'Missing --text option');
});

// ── Test: dw claude-vn-fix (fixture patch) ───────────────────────────────────
console.log();
console.log('▶ dw claude-vn-fix');

test('claude-vn-fix patches known bug fixture', () => {
  const dir = freshDir('claude-vn-fix-fixture');
  const fixtureSrc = resolve(__dirname, '__fixtures__', 'claude-cli-bug-snippet.js');
  const target = join(dir, 'cli.js');
  copyFileSync(fixtureSrc, target);

  const out = dw(`claude-vn-fix --path "${target}"`, dir);
  assert(out.includes('Patch applied') || out.includes('Already patched'), 'Should apply patch');
  const patched = readFileSync(target, 'utf-8');
  assert(patched.includes('dw-kit Vietnamese IME fix'), 'Patch marker missing in output file');
});

// ── Test: dw security-scan (ADR-0005) ────────────────────────────────────────
console.log();
console.log('▶ dw security-scan');

test('security-scan --help shows options', () => {
  const out = dw('security-scan --help', TEMP_BASE);
  assert(out.includes('--quick'), 'Missing --quick');
  assert(out.includes('--update-db'), 'Missing --update-db');
  assert(out.includes('--json'), 'Missing --json');
});

test('security-scan without snapshot exits non-zero', () => {
  const dir = freshDir('sc-scan-no-snapshot');
  try {
    dw('security-scan', dir);
    assert(false, 'Should have exited');
  } catch (e) {
    assert(e.status === 1 || e.status === 2, `Expected exit 1 or 2, got ${e.status}`);
  }
});

test('security-scan JSON output is parseable', () => {
  const dir = freshDir('sc-scan-json');
  try {
    dw('security-scan --json', dir);
  } catch (e) {
    const parsed = JSON.parse((e.stdout || '').trim());
    assert(parsed.ok === false, 'Should have ok:false without snapshot');
    assert(parsed.error?.code === 'NO_SNAPSHOT', 'Expected NO_SNAPSHOT error code');
  }
});

test('sc-scanner: parses package-lock.json correctly', async () => {
  const { parsePackageLockfile } = await import('../src/lib/sc-scanner.mjs');
  const lockPath = resolve(__dirname, '..', 'package-lock.json');
  if (!existsSync(lockPath)) {
    // skip — dw-kit may not have lockfile in some CI states
    return;
  }
  const pkgs = parsePackageLockfile(lockPath);
  assert(pkgs.size > 0, 'Expected at least 1 package parsed');
  assert(pkgs.has('ajv') || pkgs.has('chalk'), 'Expected to find at least one known dep');
});

test('sc-scanner: matchAdvisory detects in-range version', async () => {
  const { matchAdvisory } = await import('../src/lib/sc-scanner.mjs');
  const advisory = {
    id: 'TEST-0001',
    summary: 'test advisory',
    severity: [{ type: 'CVSS_V3', score: '7.5' }],
    affected: [
      {
        package: { name: 'fast-uri', ecosystem: 'npm' },
        ranges: [{ type: 'SEMVER', events: [{ introduced: '0.0.0' }, { fixed: '3.1.1' }] }],
      },
    ],
  };
  const hit = matchAdvisory('fast-uri', '3.1.0', advisory);
  assert(hit !== null, 'Should match in-range version');
  assert(hit.severity === 'high', `Expected high severity, got ${hit.severity}`);
  const miss = matchAdvisory('fast-uri', '3.1.1', advisory);
  assert(miss === null, 'Should NOT match fixed version');
});

test('sc-scanner: compareVersions handles dotted semver', async () => {
  const { compareVersions } = await import('../src/lib/sc-scanner.mjs');
  assert(compareVersions('1.2.3', '1.2.4') < 0, '1.2.3 < 1.2.4');
  assert(compareVersions('1.2.3', '1.2.3') === 0, '1.2.3 === 1.2.3');
  assert(compareVersions('2.0.0', '1.99.99') > 0, '2.0.0 > 1.99.99');
});

test('sc-sync: snapshotInfo on missing snapshot returns exists:false', async () => {
  const { snapshotInfo } = await import('../src/lib/sc-sync.mjs');
  const dir = freshDir('sc-sync-empty');
  const info = snapshotInfo(dir);
  assert(info.exists === false, 'Should report exists:false');
});

// ── #7 Bug 1 regression: chunked OSV batch ─────────────────────────────────
//
// fetch is stubbed via globalThis.fetch to count calls and assert chunking
// without hitting the network. Restore in finally.

function makeLockfile(dir, packageCount) {
  const packages = { '': { name: 'synthetic-large', version: '1.0.0' } };
  for (let i = 0; i < packageCount; i++) {
    packages[`node_modules/synthetic-pkg-${i}`] = { version: '1.0.0', resolved: '', integrity: '' };
  }
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({
    name: 'synthetic-large',
    version: '1.0.0',
    lockfileVersion: 3,
    requires: true,
    packages,
  }));
}

test('sc-sync: 2500-package lockfile chunks into 3 OSV calls (Closes #7 Bug 1)', async () => {
  const { syncSnapshotForProject } = await import('../src/lib/sc-sync.mjs');
  const dir = freshDir('sc-sync-chunked');
  makeLockfile(dir, 2500);

  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return {
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    };
  };
  try {
    const res = await syncSnapshotForProject(dir);
    const batchCalls = calls.filter((c) => c.url === 'https://api.osv.dev/v1/querybatch');
    assert(batchCalls.length === 3, `Expected 3 batch calls (1000+1000+500), got ${batchCalls.length}`);
    assert(batchCalls[0].body.queries.length === 1000, `Chunk 1 size: ${batchCalls[0].body.queries.length}`);
    assert(batchCalls[1].body.queries.length === 1000, `Chunk 2 size: ${batchCalls[1].body.queries.length}`);
    assert(batchCalls[2].body.queries.length === 500, `Chunk 3 size: ${batchCalls[2].body.queries.length}`);
    assert(res.partial === false, 'All chunks ok → partial should be false');
    assert(res.chunks.total === 3, `chunks.total: ${res.chunks.total}`);
    assert(res.chunks.succeeded === 3, `chunks.succeeded: ${res.chunks.succeeded}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sc-sync: <1000-pkg lockfile sends exactly 1 batch (regression guard)', async () => {
  const { syncSnapshotForProject } = await import('../src/lib/sc-sync.mjs');
  const dir = freshDir('sc-sync-single');
  makeLockfile(dir, 50);

  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return { ok: true, status: 200, json: async () => ({ results: [] }) };
  };
  try {
    await syncSnapshotForProject(dir);
    const batchCalls = calls.filter((c) => c.url === 'https://api.osv.dev/v1/querybatch');
    assert(batchCalls.length === 1, `Expected 1 batch call, got ${batchCalls.length}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sc-sync: partial flag set when 1 of 3 chunks fails permanently', async () => {
  const { syncSnapshotForProject, loadSnapshot } = await import('../src/lib/sc-sync.mjs');
  const dir = freshDir('sc-sync-partial');
  makeLockfile(dir, 2500);

  let callCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    callCount++;
    // Fail chunk 2 (calls 2 onwards return 400 — non-retryable)
    // Chunks 1 and 3 succeed. After concurrency=2, call order is
    // [chunk0, chunk1] then [chunk2]. Fail anything for chunk index 1.
    if (callCount === 2) {
      return { ok: false, status: 400, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => ({ results: [] }) };
  };
  try {
    const res = await syncSnapshotForProject(dir);
    assert(res.partial === true, `Expected partial=true, got ${res.partial}`);
    assert(res.chunks.failed === 1, `chunks.failed: ${res.chunks.failed}`);
    assert(res.chunks.succeeded === 2, `chunks.succeeded: ${res.chunks.succeeded}`);
    const snap = loadSnapshot(dir);
    assert(snap.partial === true, 'Persisted snapshot should carry partial=true');
    assert(Array.isArray(snap.chunks.failed_indices), 'chunks.failed_indices should be array');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sc-sync: hard fail (SYNC_ALL_CHUNKS_FAILED) when every chunk errors', async () => {
  const { syncSnapshotForProject } = await import('../src/lib/sc-sync.mjs');
  const dir = freshDir('sc-sync-all-fail');
  makeLockfile(dir, 1200);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({}) });
  try {
    let thrown = null;
    try {
      await syncSnapshotForProject(dir);
    } catch (e) {
      thrown = e;
    }
    assert(thrown !== null, 'Should throw when all chunks fail');
    assert(thrown.code === 'SYNC_ALL_CHUNKS_FAILED', `code: ${thrown.code}`);
    assert(Array.isArray(thrown.failedChunks), 'Error should carry failedChunks');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sc-sync: 503 triggers retry+backoff before giving up', async () => {
  const { fetchOsvBatch } = await import('../src/lib/sc-sync.mjs');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  try {
    let thrown = null;
    try {
      await fetchOsvBatch([{ package: { name: 'a', ecosystem: 'npm' } }]);
    } catch (e) {
      thrown = e;
    }
    assert(thrown !== null, 'Should throw on 503');
    assert(thrown.retryable === true, `503 should be retryable, got: ${thrown.retryable}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('telemetry: supplyChainBySource separates osv vs fixture vs mixed (sunset integrity)', async () => {
  const { summarize } = await import('../src/lib/telemetry.mjs');
  const events = [
    { event: 'sc_guard', action: 'block', source: 'osv' },
    { event: 'sc_guard', action: 'allow', source: 'osv' },
    { event: 'sc_guard', action: 'block', source: 'pre-install-mixed', block_source: 'fixture' },
    { event: 'sc_guard', action: 'block', source: 'pre-install-mixed', block_source: 'fixture+osv' },
    { event: 'sc_guard', action: 'sync', source: 'osv', partial: true },
    { event: 'sc_guard', action: 'scan_run', source: 'osv', partial_snapshot: true },
  ];
  const sum = summarize(events);
  assert(sum.supplyChainBySource.osv === 2, `osv: ${sum.supplyChainBySource.osv}`);
  assert(sum.supplyChainBySource.fixture === 1, `fixture: ${sum.supplyChainBySource.fixture}`);
  assert(sum.supplyChainBySource.mixed === 1, `mixed: ${sum.supplyChainBySource.mixed}`);
  assert(sum.supplyChainPartial.partial_syncs === 1, `partial_syncs: ${sum.supplyChainPartial.partial_syncs}`);
  assert(sum.supplyChainPartial.partial_scans === 1, `partial_scans: ${sum.supplyChainPartial.partial_scans}`);
});

test('init --preset team auto-wires supply-chain hook', () => {
  const dir = freshDir('init-team-sc-hook');
  dw('init --preset team', dir);
  const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
  const wired = (settings.hooks?.PostToolUse || []).some((g) =>
    (g.hooks || []).some((h) => h.command && h.command.includes('supply-chain-scan.sh')),
  );
  assert(wired, 'Hook should be auto-wired for team preset');
});

test('init --preset solo skips supply-chain hook (opt-in OFF per TW5)', () => {
  const dir = freshDir('init-solo-sc-hook');
  dw('init --preset solo', dir);
  const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
  const wired = (settings.hooks?.PostToolUse || []).some((g) =>
    (g.hooks || []).some((h) => h.command && h.command.includes('supply-chain-scan.sh')),
  );
  assert(!wired, 'Solo preset should NOT auto-wire hook');
});

test('security-scan --install-hook adds entry idempotently', () => {
  const dir = freshDir('sc-install-hook');
  dw('init --preset solo', dir);

  // After init solo: TW5 uninstalls hook even if template had it. So state = clean.
  const out1 = dw('security-scan --install-hook', dir);
  assert(out1.includes('Hook wired') || out1.includes('added'), `First install should add. Got: ${out1.slice(0, 200)}`);

  const out2 = dw('security-scan --install-hook', dir);
  assert(out2.includes('already wired') || out2.includes('no-op'), 'Second install should be no-op');

  const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
  const count = (settings.hooks?.PostToolUse || []).reduce(
    (sum, g) => sum + (g.hooks || []).filter((h) => h.command && h.command.includes('supply-chain-scan.sh')).length,
    0,
  );
  assert(count === 1, `Expected exactly 1 entry, got ${count}`);
});

test('sc-scanner: parsePackageJson reads all dep sections', async () => {
  const { parsePackageJson } = await import('../src/lib/sc-scanner.mjs');
  const dir = freshDir('sc-pkgjson');
  const pkg = {
    name: 'test',
    version: '1.0.0',
    dependencies: { 'lodash': '^4.17.0', '@tanstack/react-router': '^1.169.0' },
    devDependencies: { 'jest': '^29.0.0' },
    peerDependencies: { 'react': '>=18' },
    optionalDependencies: { 'fsevents': '^2.0.0' },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
  const result = parsePackageJson(join(dir, 'package.json'));
  assert(result.size === 5, `Expected 5 packages, got ${result.size}`);
  assert(result.has('@tanstack/react-router'), 'Missing tanstack');
  assert(result.has('react'), 'Missing peerDep react');
});

test('sc-scanner: matchNamespaceFixture prefix-only match downgrades severity (ADR-0006)', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
  // Entry without affected_range → prefix-only path → critical downgrades to high
  const fixture = {
    namespaces: [
      { pattern: '@tanstack/', severity: 'critical', reason: 'test', active_until: '2099-12-31' },
    ],
  };
  const packages = new Map([
    ['@tanstack/react-router', '^1.169.0'],
    ['lodash', '^4.17.0'],
  ]);
  const hits = matchNamespaceFixture(packages, fixture);
  assert(hits.length === 1, `Expected 1 hit, got ${hits.length}`);
  assert(hits[0].package === '@tanstack/react-router', 'Wrong match');
  assert(hits[0].severity === 'high', `Expected severity downgrade critical→high, got ${hits[0].severity}`);
  assert(hits[0].version_check === 'prefix-only', `Expected version_check=prefix-only, got ${hits[0].version_check}`);
});

test('sc-scanner: matchNamespaceFixture concrete version IN affected_range hits with full severity', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
  const fixture = {
    namespaces: [{
      pattern: '@tanstack/',
      severity: 'critical',
      active_until: '2099-12-31',
      affected_range: { type: 'SEMVER', events: [{ introduced: '1.169.5' }, { fixed: '1.169.9' }] },
    }],
  };
  const packages = new Map([['@tanstack/react-router', '1.169.7']]);
  const hits = matchNamespaceFixture(packages, fixture);
  assert(hits.length === 1, `Expected 1 hit, got ${hits.length}`);
  assert(hits[0].severity === 'critical', `Concrete in-range should keep critical, got ${hits[0].severity}`);
  assert(hits[0].version_check === 'in-range', `Expected in-range, got ${hits[0].version_check}`);
});

test('sc-scanner: matchNamespaceFixture concrete version OUT of range is skipped (no FP)', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
  const fixture = {
    namespaces: [{
      pattern: '@tanstack/',
      severity: 'critical',
      active_until: '2099-12-31',
      affected_range: { type: 'SEMVER', events: [{ introduced: '1.169.5' }, { fixed: '1.169.9' }] },
    }],
  };
  const packages = new Map([['@tanstack/react-router', '1.169.9']]);
  const hits = matchNamespaceFixture(packages, fixture);
  assert(hits.length === 0, `Out-of-range concrete should NOT match (FP guard), got ${hits.length}`);
});

test('sc-scanner: matchNamespaceFixture range spec (^1.169.0) emits range-ambiguous hit', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
  const fixture = {
    namespaces: [{
      pattern: '@tanstack/',
      severity: 'critical',
      active_until: '2099-12-31',
      affected_range: { type: 'SEMVER', events: [{ introduced: '1.169.5' }, { fixed: '1.169.9' }] },
    }],
  };
  // ^1.169.0 may resolve to 1.169.5+ on install — warn but downgrade
  const packages = new Map([['@tanstack/react-router', '^1.169.0']]);
  const hits = matchNamespaceFixture(packages, fixture);
  assert(hits.length === 1, `Range-spec below fixed should warn, got ${hits.length}`);
  assert(hits[0].version_check === 'range-ambiguous', `Expected range-ambiguous, got ${hits[0].version_check}`);
  assert(hits[0].severity === 'high', `Expected severity downgrade, got ${hits[0].severity}`);
});

test('sc-heuristic: scoreSignals fires very_recent_publish + popular_package (combo block)', async () => {
  const { scoreSignals } = await import('../src/lib/sc-heuristic.mjs');
  const signals = {
    package: '@tanstack/react-query',
    version: '1.169.5',
    publish_age_hours: 6, // very recent
    package_modified_age_days: 5, // recent maintainer activity
  };
  const result = scoreSignals(signals, 50000, undefined, { change: 'added' });
  assert(result.score >= 80, `Expected block-tier score (≥80), got ${result.score}`);
  assert(result.reasons.some((r) => r.signal === 'very_recent_publish'), 'Missing very_recent_publish');
  assert(result.reasons.some((r) => r.signal === 'popular_package'), 'Missing popular_package');
  assert(result.reasons.some((r) => r.signal === 'maintainer_change_recent'), 'Missing maintainer_change_recent');
});

test('sc-heuristic: scoreSignals returns 0 for old + unpopular package (no FP cascade)', async () => {
  const { scoreSignals } = await import('../src/lib/sc-heuristic.mjs');
  const signals = {
    package: 'some-random-pkg',
    version: '1.2.3',
    publish_age_hours: 24 * 365, // 1 year old
    package_modified_age_days: 200,
  };
  const result = scoreSignals(signals, 100, undefined);
  assert(result.score === 0, `Expected 0, got ${result.score}`);
  assert(result.reasons.length === 0, `Expected no reasons, got ${result.reasons.length}`);
});

test('sc-heuristic: scoreSignals detects typo-squat (Levenshtein=1 of popular)', async () => {
  const { scoreSignals } = await import('../src/lib/sc-heuristic.mjs');
  // "reactt" is Lev=1 from "react"
  const signals = { package: 'reactt', version: '1.0.0', publish_age_hours: 240 };
  const result = scoreSignals(signals, 0, undefined);
  assert(result.reasons.some((r) => r.signal === 'typo_squat'), 'Should flag typo-squat');
  assert(result.score >= 60, `Typo-squat alone should block-tier, got ${result.score}`);
});

test('npm-registry: cache TTL respects 1h boundary', async () => {
  const { cachePut, cacheGet, pruneCache } = await import('../src/lib/npm-registry.mjs');
  const dir = freshDir('npm-cache-ttl');
  mkdirSync(join(dir, '.dw', 'security'), { recursive: true });
  cachePut(dir, 'pkg:test-a', { foo: 'bar' });
  const fresh = cacheGet(dir, 'pkg:test-a', 60 * 60 * 1000);
  assert(fresh && fresh.foo === 'bar', `Cache should return fresh entry, got ${JSON.stringify(fresh)}`);
  // Force-expire by passing TTL of 0
  const expired = cacheGet(dir, 'pkg:test-a', 0);
  assert(expired === null, `Cache should expire when TTL=0, got ${JSON.stringify(expired)}`);
  // Prune does not throw on the cache file
  pruneCache(dir, 0);
});

test('sc-heuristic: diffLockfilePackages cold-start (no git history) reports all as cold-start', async () => {
  const { diffLockfilePackages } = await import('../src/lib/sc-heuristic.mjs');
  const dir = freshDir('sc-heur-coldstart');
  // freshDir already calls git init; no commits, no HEAD → diff falls through to cold-start
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({
    name: 'cold', version: '1.0.0', lockfileVersion: 3, requires: true,
    packages: {
      '': { name: 'cold', version: '1.0.0' },
      'node_modules/lodash': { version: '4.17.21' },
      'node_modules/express': { version: '4.18.2' },
    },
  }));
  const diff = diffLockfilePackages(dir);
  assert(diff.length === 2, `Expected 2 entries (cold-start), got ${diff.length}`);
  assert(diff.every((d) => d.change === 'cold-start'), 'All entries should be marked cold-start');
});

test('sc-heuristic: diffLockfilePackages detects added + bumped against git HEAD', async () => {
  const { diffLockfilePackages } = await import('../src/lib/sc-heuristic.mjs');
  const dir = freshDir('sc-heur-diff');
  // Commit a baseline lockfile
  const baseline = {
    name: 'app', version: '1.0.0', lockfileVersion: 3, requires: true,
    packages: {
      '': { name: 'app', version: '1.0.0' },
      'node_modules/lodash': { version: '4.17.20' },
    },
  };
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(baseline));
  execSync('git add package-lock.json', { cwd: dir, stdio: 'pipe' });
  execSync('git -c user.email=t@t -c user.name=t commit -m baseline', { cwd: dir, stdio: 'pipe' });

  // Now bump lodash AND add @tanstack/react-query
  const updated = {
    ...baseline,
    packages: {
      '': baseline.packages[''],
      'node_modules/lodash': { version: '4.17.21' },
      'node_modules/@tanstack/react-query': { version: '1.169.5' },
    },
  };
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify(updated));

  const diff = diffLockfilePackages(dir);
  const lodash = diff.find((d) => d.name === 'lodash');
  const tanstack = diff.find((d) => d.name === '@tanstack/react-query');
  assert(lodash && lodash.change === 'bumped', `lodash should be bumped, got ${JSON.stringify(lodash)}`);
  assert(lodash.from === '4.17.20' && lodash.version === '4.17.21', `wrong from/to: ${JSON.stringify(lodash)}`);
  assert(tanstack && tanstack.change === 'added', `tanstack should be added, got ${JSON.stringify(tanstack)}`);
});

test('security-scan --heuristic-only exits 0 when no diff to probe', () => {
  const dir = freshDir('sc-heur-only-nothing');
  // Empty/non-existent lockfile → diff returns 0 entries → exit 0
  try {
    dw('security-scan --heuristic-only', dir);
  } catch (e) {
    assert(e.status === 0, `Expected exit 0 (no candidates), got ${e.status}`);
  }
});

// ── UX fixes for v1.3.6 PR ────────────────────────────────────────────────

test('cli: `dw scan` alias resolves to security-scan command', () => {
  const out = dw('scan --help', TEMP_BASE);
  assert(out.includes('Scan project') || out.includes('supply-chain') || out.includes('--update-db'),
    `Expected scan help to show security-scan options, got: ${out.slice(0, 200)}`);
});

test('scan: no lockfile but package.json exists → falls back to pre-install (not error)', () => {
  const dir = freshDir('sc-no-lockfile-fallback');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: 'fresh-app', version: '1.0.0',
    dependencies: { 'lodash': '^4.17.21' },
  }));
  // Pre-create a tiny stale snapshot so the auto-refresh path doesn't hit network
  mkdirSync(join(dir, '.dw', 'security'), { recursive: true });
  writeFileSync(join(dir, '.dw', 'security', 'advisory-snapshot.json'), JSON.stringify({
    schema_version: '1.0',
    fetched_at: new Date().toISOString(),
    source: 'osv.dev', ecosystem: 'npm',
    package_count: 0, advisory_count: 0, advisories: [],
  }));
  let combined;
  try {
    combined = dw('scan --offline', dir);
  } catch (e) {
    // offline + lodash safe → pillar 2 no fixture → pillar 3 skipped (offline) → clean exit 0
    combined = (e.stdout || '') + (e.stderr || '');
    // If fallback to pre-install happens with lodash safe → exit code 0 expected, but
    // execSync throws only on non-zero. So this branch fires if pre-install hit something.
    assert(e.status === 0 || e.status === 1, `Unexpected exit ${e.status}`);
  }
  // The key behavior: did NOT die with "no lockfile" hard error
  assert(!/^.*No lockfile.*not a Node project.*$/m.test(combined || ''),
    'Should NOT report "not a Node project" when package.json exists');
});

test('scan: no lockfile AND no package.json → exits gracefully with hint', () => {
  const dir = freshDir('sc-no-project');
  // Pre-create a tiny snapshot so we don't trigger auto-refresh network call
  mkdirSync(join(dir, '.dw', 'security'), { recursive: true });
  writeFileSync(join(dir, '.dw', 'security', 'advisory-snapshot.json'), JSON.stringify({
    schema_version: '1.0',
    fetched_at: new Date().toISOString(),
    source: 'osv.dev', ecosystem: 'npm',
    package_count: 0, advisory_count: 0, advisories: [],
  }));
  try {
    dw('scan --offline', dir);
    assert(false, 'Expected non-zero exit when no Node project');
  } catch (e) {
    assert(e.status === 1, `Expected exit 1, got ${e.status}`);
    const combined = (e.stdout || '') + (e.stderr || '');
    assert(/no package\.json|not a Node project|No lockfile/i.test(combined),
      `Expected helpful hint, got: ${combined.slice(0, 200)}`);
  }
});

test('scan: --offline flag suppresses auto-refresh on missing snapshot', () => {
  const dir = freshDir('sc-offline-no-snap');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'a', version: '1.0.0' }));
  // No snapshot, no lockfile, --offline → must NOT attempt network
  // Should fall to pre-install --offline path (which works on package.json)
  try {
    dw('scan --offline', dir);
  } catch (e) {
    // pre-install with clean package.json → exit 0 typical
    const combined = (e.stdout || '') + (e.stderr || '');
    assert(!/Auto-sync/i.test(combined), 'Should NOT attempt auto-sync when --offline');
  }
});

test('sc-scanner: namespace fixture skips expired entries', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
  const fixture = {
    namespaces: [
      { pattern: '@expired/', active_until: '2020-01-01', reason: 'old' },
    ],
  };
  const packages = new Map([['@expired/lib', '^1.0.0']]);
  const hits = matchNamespaceFixture(packages, fixture);
  assert(hits.length === 0, 'Should skip expired entry');
});

test('security-scan --pre-install --offline detects tanstack via fixture', () => {
  const dir = freshDir('sc-pre-install-offline');
  const pkg = {
    name: 'vulnerable-app',
    version: '1.0.0',
    dependencies: { '@tanstack/react-router': '^1.169.0' },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  try {
    dw('security-scan --pre-install --offline', dir);
    assert(false, 'Should have exited non-zero');
  } catch (e) {
    assert(e.status === 2, `Expected exit 2 (critical namespace match), got ${e.status}`);
    const combined = (e.stdout || '') + (e.stderr || '');
    assert(combined.includes('@tanstack/'), 'Should mention tanstack in output');
  }
});

test('security-scan --pre-install --offline --json emits structured output', () => {
  const dir = freshDir('sc-pre-install-json');
  const pkg = {
    name: 'clean-app',
    version: '1.0.0',
    dependencies: { 'lodash': '^4.17.0' },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  const out = dw('security-scan --pre-install --offline --json', dir);
  const parsed = JSON.parse(out.trim());
  assert(parsed.mode === 'pre-install', 'Wrong mode');
  assert(parsed.packages === 1, `Expected 1 package, got ${parsed.packages}`);
  assert(parsed.namespace_hits.length === 0, 'Should have no namespace hits for clean app');
});

test('security-scan --pre-install fails gracefully without package.json', () => {
  const dir = freshDir('sc-pre-install-empty');
  try {
    dw('security-scan --pre-install --offline', dir);
    assert(false, 'Should have failed');
  } catch (e) {
    assert(e.status === 1, `Expected exit 1, got ${e.status}`);
  }
});

test('security-scan --uninstall-hook removes entry', () => {
  const dir = join(TEMP_BASE, 'sc-install-hook');
  const out = dw('security-scan --uninstall-hook', dir);
  assert(out.includes('Removed') || out.includes('not wired'), 'Should remove or report not wired');
  const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf-8'));
  const wired = (settings.hooks?.PostToolUse || []).some((g) =>
    (g.hooks || []).some((h) => h.command && h.command.includes('supply-chain-scan.sh')),
  );
  assert(!wired, 'Hook should be removed');
});

// ── Test: dw upgrade ─────────────────────────────────────────────────────────
console.log();
console.log('▶ dw upgrade');

test('upgrade --check on fresh init reports up to date', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const out = dw('upgrade --check', dir);
  assert(out.includes('up to date'), 'Should be up to date');
});

test('upgrade --dry-run shows no changes on fresh init', () => {
  const dir = join(TEMP_BASE, 'init-solo');
  const out = dw('upgrade --dry-run', dir);
  assert(out.includes('DRY RUN'), 'Should say dry run');
});

test('upgrade fails on project without config', () => {
  const dir = freshDir('upgrade-empty');
  try {
    dw('upgrade', dir);
    assert(false, 'Should have thrown');
  } catch (e) {
    assert(e.status === 1, 'Should exit with code 1');
  }
});

// ── Test: review render pipeline (ADR-0007) ──────────────────────────────────
console.log();
console.log('▶ dw review (manifest schema)');

test('manifest validator accepts a minimal valid manifest', async () => {
  const { validateManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = validateManifest({
    schema_version: 1,
    scope: 'demo',
    generated_at: '2026-05-15T10:00:00Z',
    findings: [],
  });
  assert(r.ok === true, `expected ok, got ${JSON.stringify(r.errors)}`);
});

test('manifest validator accepts a full finding with code snippet', async () => {
  const { validateManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = validateManifest({
    schema_version: 1,
    scope: 'feat/x',
    scope_slug: 'feat-x',
    generated_at: '2026-05-15T10:00:00Z',
    task_id: 'review-render-pipeline',
    review_meta: { reviewer: 'dw-review', depth: 'standard', diff_base: 'origin/dev', files_reviewed: 3 },
    findings: [{
      id: 'f1',
      severity: 'critical',
      title: 'Unvalidated input',
      location: { file: 'src/api.mjs', line_start: 38, line_end: 55 },
      rule_ref: 'Security §2',
      body: 'No sanitization before query.',
      fix: 'Call sanitize(input).',
      code_snippet: 'const q = `SELECT ${id}`;',
      language: 'javascript',
    }],
  });
  assert(r.ok === true, `expected ok, got ${JSON.stringify(r.errors)}`);
});

test('manifest validator rejects unknown severity', async () => {
  const { validateManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = validateManifest({
    schema_version: 1,
    scope: 'x',
    generated_at: '2026-05-15T10:00:00Z',
    findings: [{ id: 'f1', severity: 'meh', title: 'x', location: { file: 'a' }, body: 'b' }],
  });
  assert(r.ok === false, 'expected invalid');
  assert(r.errors.some((e) => e.path.includes('severity')), `expected severity error, got ${JSON.stringify(r.errors)}`);
});

test('manifest validator rejects missing required fields', async () => {
  const { validateManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = validateManifest({ schema_version: 1, scope: 'x', generated_at: '2026-05-15T10:00:00Z' });
  assert(r.ok === false, 'expected invalid');
  assert(r.errors.some((e) => e.message.includes("'findings'")), `expected findings required error, got ${JSON.stringify(r.errors)}`);
});

test('manifest validator rejects schema_version mismatch with clear error', async () => {
  const { validateManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = validateManifest({ schema_version: 99, scope: 'x', generated_at: '2026-05-15T10:00:00Z', findings: [] });
  assert(r.ok === false, 'expected invalid');
  assert(r.errors[0].message.includes('unsupported schema_version'), 'expected version error');
});

test('manifest parser surfaces JSON parse errors', async () => {
  const { parseManifest } = await import('./lib/review/manifest-validator.mjs');
  const r = parseManifest('{ not valid json');
  assert(r.ok === false, 'expected invalid');
  assert(r.errors[0].message.includes('invalid JSON'), 'expected JSON error');
});

test('scope-slug: branch with slash becomes dash', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  assert(scopeSlug('fix/sc-guard-v1.3.6') === 'fix-sc-guard-v1.3.6', 'slash → dash');
});

test('scope-slug: preserves Unicode (Vietnamese diacritics)', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  assert(scopeSlug('feat: thêm tính năng') === 'feat-thêm-tính-năng', 'unicode preserved');
});

test('scope-slug: Windows reserved names get underscore prefix', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  assert(scopeSlug('CON') === '_CON', 'reserved name prefixed');
  assert(scopeSlug('com1') === '_com1', 'com1 reserved');
});

test('scope-slug: strips path traversal + illegal chars', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  assert(scopeSlug('../../etc/passwd') === 'etc-passwd', 'traversal stripped');
  assert(scopeSlug('has<>?:|chars*') === 'has-chars', 'illegal chars stripped');
});

test('scope-slug: caps length at maxLength', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  assert(scopeSlug('x'.repeat(100)).length === 80, 'default cap 80');
  assert(scopeSlug('x'.repeat(100), { maxLength: 20 }).length === 20, 'custom cap 20');
});

test('scope-slug: throws on empty-after-sanitization', async () => {
  const { scopeSlug } = await import('./lib/review/scope-slug.mjs');
  let threw = false;
  try { scopeSlug('***'); } catch (e) { threw = true; assert(e.message.includes('empty slug')); }
  assert(threw, 'should throw on empty result');
});

test('renderer config: defaults applied when keys missing', async () => {
  const { getReviewRendererConfig } = await import('./lib/config.mjs');
  const d = getReviewRendererConfig({});
  assert(d.strategy === 'auto', `strategy default: ${d.strategy}`);
  assert(d.formats.length === 2 && d.formats.includes('svg') && d.formats.includes('png'), 'formats default');
  assert(d.output_dir === '.dw/reviews', 'output_dir default');
});

test('renderer config: user override wins over defaults', async () => {
  const { getReviewRendererConfig } = await import('./lib/config.mjs');
  const d = getReviewRendererConfig({
    claude: { review: { renderer: { strategy: 'markdown-only', theme: 'dracula', formats: ['png'] } } },
  });
  assert(d.strategy === 'markdown-only', 'strategy override');
  assert(d.theme === 'dracula', 'theme override');
  assert(d.formats.length === 1 && d.formats[0] === 'png', 'formats override');
  assert(d.font === 'JetBrains Mono', 'font keeps default');
});

// `dw review render` CLI shim
function makeManifestFixture(dir, slug = 'demo') {
  const cfgDir = join(dir, '.dw', 'config');
  const rDir = join(dir, '.dw', 'reviews', slug);
  mkdirSync(cfgDir, { recursive: true });
  mkdirSync(rDir, { recursive: true });
  writeFileSync(join(cfgDir, 'dw.config.yml'), 'project:\n  name: t\nclaude:\n  review:\n    renderer:\n      strategy: auto\n', 'utf-8');
  const manifest = {
    schema_version: 1,
    scope: slug,
    scope_slug: slug,
    generated_at: '2026-05-15T10:00:00Z',
    findings: [
      { id: 'f1', severity: 'critical', title: 'X', location: { file: 'a.mjs', line_start: 1, line_end: 2 }, body: 'body', code_snippet: 'x', language: 'javascript' },
    ],
  };
  const manifestPath = join(rDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest), 'utf-8');
  return manifestPath;
}

test('review render: missing renderer falls back to markdown summary, exit 0', () => {
  const dir = freshDir('review-render-fallback');
  const manifestPath = makeManifestFixture(dir);
  const out = dw(`review render "${manifestPath}" --quiet`, dir);
  assert(existsSync(join(dir, '.dw', 'reviews', 'demo', 'summary.md')), 'summary.md created');
  const md = readFileSync(join(dir, '.dw', 'reviews', 'demo', 'summary.md'), 'utf-8');
  assert(md.includes('CRITICAL'), 'severity rendered in markdown');
  assert(md.includes('a.mjs'), 'file path rendered');
});

test('review render: invalid manifest exits non-zero with clear error', () => {
  const dir = freshDir('review-render-invalid');
  const cfgDir = join(dir, '.dw', 'config');
  mkdirSync(cfgDir, { recursive: true });
  writeFileSync(join(cfgDir, 'dw.config.yml'), 'project:\n  name: t\n', 'utf-8');
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, '{ bad json', 'utf-8');
  try {
    dw(`review render "${bad}" --quiet`, dir);
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.status === 1, `expected exit 1, got ${e.status}`);
    const combined = (e.stdout || '') + (e.stderr || '');
    assert(combined.includes('Manifest invalid'), 'should mention manifest invalid');
  }
});

test('review render: --strategy plugin without dw-kit-render fails fast', () => {
  const dir = freshDir('review-render-plugin-missing');
  const manifestPath = makeManifestFixture(dir);
  try {
    dw(`review render "${manifestPath}" --strategy plugin --quiet`, dir);
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.status === 1, `expected exit 1, got ${e.status}`);
  }
});

test('review render: --strategy markdown-only skips renderer entirely', () => {
  const dir = freshDir('review-render-md-only');
  const manifestPath = makeManifestFixture(dir);
  dw(`review render "${manifestPath}" --strategy markdown-only --quiet`, dir);
  assert(existsSync(join(dir, '.dw', 'reviews', 'demo', 'summary.md')), 'summary.md created');
});

test('review render: logs telemetry event review_render', () => {
  const dir = freshDir('review-render-telemetry');
  const manifestPath = makeManifestFixture(dir);
  dw(`review render "${manifestPath}" --quiet`, dir);
  const events = readFileSync(join(dir, '.dw', 'metrics', 'events.jsonl'), 'utf-8');
  assert(events.includes('"event":"review_render"'), 'review_render event logged');
});

await runPending();

// ── Cleanup ──────────────────────────────────────────────────────────────────
rmSync(TEMP_BASE, { recursive: true });

// ── Results ──────────────────────────────────────────────────────────────────
console.log();
console.log('══════════════════════════════════════════');
if (failed === 0) {
  console.log(`  All ${passed} tests passed`);
} else {
  console.log(`  ${passed} passed, ${failed} failed`);
}
console.log('══════════════════════════════════════════');
console.log();

process.exit(failed > 0 ? 1 : 0);
