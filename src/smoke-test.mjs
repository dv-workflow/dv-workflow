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

test('sc-scanner: matchNamespaceFixture detects tanstack pattern', async () => {
  const { matchNamespaceFixture } = await import('../src/lib/sc-scanner.mjs');
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
  assert(hits[0].severity === 'critical', 'Wrong severity');
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
