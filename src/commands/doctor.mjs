import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { header, ok, warn, err, info, log } from '../lib/ui.mjs';
import { loadConfig, getToolkitVersions, getReviewRendererConfig } from '../lib/config.mjs';
import { detectPlatform, platformLabel } from '../lib/platform.mjs';
import { snapshotInfo } from '../lib/sc-sync.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const RENDER_PACKAGE = 'dw-kit-render';

function tryResolveRenderer(projectDir) {
  if (process.env.DW_REVIEW_NO_RENDERER === '1') return { ok: false, reason: 'disabled by DW_REVIEW_NO_RENDERER=1' };
  const reqProject = createRequire(join(projectDir, 'package.json'));
  for (const req of [reqProject, createRequire(import.meta.url)]) {
    try {
      const pkgPath = req.resolve(`${RENDER_PACKAGE}/package.json`);
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      return { ok: true, version: pkg.version };
    } catch {
      // try next
    }
  }
  return { ok: false };
}

const CORE_FILES = [
  '.dw/core/WORKFLOW.md',
  '.dw/core/THINKING.md',
  '.dw/core/QUALITY.md',
  '.dw/core/ROLES.md',
];

const V2_OPTIONAL = [
  '.dw/core/PILLARS.md',
  '.dw/decisions',
  '.dw/tasks/ACTIVE.md',
  '.dw/metrics',
];

const CONFIG_FILES = [
  '.dw/config/dw.config.yml',
  '.dw/config/config.schema.json',
];

const CLAUDE_ESSENTIAL = [
  '.claude/settings.json',
  '.claude/hooks/pre-commit-gate.sh',
  '.claude/hooks/safety-guard.sh',
];

export async function doctorCommand() {
  const projectDir = process.cwd();

  header('dw-kit Doctor');
  let issues = 0;
  let warnings = 0;

  info('Environment');
  log(`Node.js     : ${process.version}`);
  log(`Platform    : ${process.platform} ${process.arch}`);
  log(`Working dir : ${projectDir}`);

  const pkg = JSON.parse(readFileSync(join(TOOLKIT_ROOT, 'package.json'), 'utf-8'));
  log(`dw-kit CLI  : v${pkg.version}`);

  const platform = detectPlatform(projectDir);
  log(`AI Platform : ${platformLabel(platform)}`);

  info('Core Files (Layer 0)');
  for (const file of CORE_FILES) {
    const fullPath = join(projectDir, file);
    if (existsSync(fullPath)) {
      ok(file);
    } else {
      err(`${file} — MISSING`);
      issues++;
    }
  }

  info('Config (Layer 2)');
  for (const file of CONFIG_FILES) {
    const fullPath = join(projectDir, file);
    if (existsSync(fullPath)) {
      ok(file);
    } else {
      err(`${file} — MISSING`);
      issues++;
    }
  }

  const configPath = join(projectDir, '.dw', 'config', 'dw.config.yml');
  if (existsSync(configPath)) {
    const config = loadConfig(configPath);
    if (config) {
      const versions = getToolkitVersions(config);
      log(`  Core version     : ${versions.core}`);
      log(`  Platform version : ${versions.platform}`);

      const toolkitConfig = loadConfig(join(TOOLKIT_ROOT, '.dw', 'config', 'dw.config.yml'));
      if (toolkitConfig) {
        const toolkitVersions = getToolkitVersions(toolkitConfig);
        if (versions.core !== toolkitVersions.core) {
          warn(`Update available: ${versions.core} → ${toolkitVersions.core} (run \`dw upgrade\`)`);
          warnings++;
        }
      }
    } else {
      err('.dw/config/dw.config.yml — YAML parse error');
      issues++;
    }
  }

  info('Claude Files (Layer 1)');
  if (platform === 'claude-cli' || existsSync(join(projectDir, '.claude'))) {
    for (const file of CLAUDE_ESSENTIAL) {
      const fullPath = join(projectDir, file);
      if (existsSync(fullPath)) {
        ok(file);
      } else {
        warn(`${file} — missing (optional for non-Claude platforms)`);
        warnings++;
      }
    }

    if (existsSync(join(projectDir, 'CLAUDE.md'))) {
      ok('CLAUDE.md');
    } else {
      warn('CLAUDE.md — missing');
      warnings++;
    }
  } else {
    log('Skipped — not a Claude CLI project');
  }

  info('Adapter Structure (Layer 3)');
  const adapterDirs = [
    '.dw/adapters/claude-cli/generated',
    '.dw/adapters/claude-cli/overrides',
    '.dw/adapters/claude-cli/extensions',
  ];
  for (const dir of adapterDirs) {
    if (existsSync(join(projectDir, dir))) {
      ok(dir);
    } else {
      warn(`${dir} — missing`);
      warnings++;
    }
  }

  info('Runtime Directories');
  for (const dir of ['.dw/tasks', '.dw/docs']) {
    if (existsSync(join(projectDir, dir))) {
      ok(dir);
    } else {
      warn(`${dir} — missing (will be created on first use)`);
      warnings++;
    }
  }

  info('v2 Artifacts (optional)');
  for (const path of V2_OPTIONAL) {
    if (existsSync(join(projectDir, path))) {
      ok(path);
    } else {
      log(`  ${path} — not yet created (opt-in)`);
    }
  }

  info('Review Render Pipeline (ADR-0007, opt-in)');
  const rendererCfg = existsSync(configPath) ? getReviewRendererConfig(loadConfig(configPath) || {}) : getReviewRendererConfig({});
  log(`  Strategy    : ${rendererCfg.strategy}`);
  log(`  Formats     : ${rendererCfg.formats.join(', ')}`);
  log(`  Theme/Font  : ${rendererCfg.theme} / ${rendererCfg.font}`);

  if (rendererCfg.strategy === 'markdown-only') {
    log('  Renderer    : skipped (strategy=markdown-only)');
  } else {
    const r = tryResolveRenderer(projectDir);
    if (r.ok) {
      ok(`Renderer    : dw-kit-render v${r.version || '?'} resolvable`);
    } else if (rendererCfg.strategy === 'plugin') {
      err("Renderer    : 'dw-kit-render' NOT installed but strategy='plugin'");
      log(`  Install:  npm install -g dw-kit-render`);
      issues++;
    } else {
      warn(`Renderer    : 'dw-kit-render' not installed — /dw:review --visual will fall back to markdown`);
      log(`  Install (optional):  npm install -g dw-kit-render`);
      warnings++;
    }
  }

  info('Supply-Chain Guard (ADR-0005, opt-in)');
  const sc = snapshotInfo(projectDir);
  if (!sc.exists) {
    log('  Advisory snapshot — not yet created');
    log('  Run `dw security-scan --update-db` to fetch from OSV.dev (opt-in feature)');
  } else {
    if (!sc.schema_compatible) {
      err(`Advisory snapshot schema mismatch — expected 1.0, got ${sc.schema_version || 'unknown'}`);
      log('  Run `dw security-scan --update-db` to refresh');
      issues++;
    } else if (sc.stale) {
      warn(`Advisory snapshot stale: ${sc.age_days.toFixed(1)} days old (>7d threshold)`);
      log(`  Source: ${sc.source} (${sc.ecosystem}), advisories=${sc.advisory_count}`);
      log('  Run `dw security-scan --update-db` to refresh');
      warnings++;
    } else {
      ok(`Advisory snapshot — ${sc.age_days.toFixed(1)}d old, ${sc.advisory_count} advisories (${sc.source})`);
    }
  }

  console.log();
  header('Diagnosis');
  if (issues === 0 && warnings === 0) {
    ok('Everything looks good!');
  } else if (issues === 0) {
    warn(`${warnings} warning(s), 0 errors — mostly fine`);
  } else {
    err(`${issues} error(s), ${warnings} warning(s) — run \`dw init\` to fix`);
  }
  console.log();

  process.exit(issues > 0 ? 1 : 0);
}
