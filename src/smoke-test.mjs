#!/usr/bin/env node
/**
 * dw-kit Smoke Test
 * Run: node src/smoke-test.mjs
 *
 * Tests all CLI commands in an isolated temp directory.
 * Exit code 0 = all pass, 1 = failures found.
 */

import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { copyFileSync } from 'node:fs';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const DW_BIN = resolve(__dirname, '..', 'bin', 'dw.mjs');
const TEMP_BASE = join(resolve(__dirname, '..'), '.smoke-test-tmp');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗  ${name}`);
    console.log(`     ${e.message}`);
    failed++;
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
  for (const cmd of ['init', 'upgrade', 'validate', 'doctor', 'claude-vn-fix']) {
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
