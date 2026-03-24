import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { header, ok, warn, err, info, log } from '../lib/ui.mjs';
import { loadConfig, getToolkitVersions } from '../lib/config.mjs';
import { detectPlatform, platformLabel } from '../lib/platform.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

const CORE_FILES = [
  '.dw/core/WORKFLOW.md',
  '.dw/core/THINKING.md',
  '.dw/core/QUALITY.md',
  '.dw/core/ROLES.md',
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
