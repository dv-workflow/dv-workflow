import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { header, ok, warn, err, info, log, dry } from '../lib/ui.mjs';
import { loadConfig, writeConfig, getToolkitVersions } from '../lib/config.mjs';
import { diffDirs, copyDir, copyFile } from '../lib/copy.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

export async function upgradeCommand(opts) {
  const projectDir = process.cwd();
  const configPath = join(projectDir, '.dw', 'config', 'dw.config.yml');

  if (!existsSync(configPath)) {
    err('No .dw/config/dw.config.yml found. Run `dw init` first.');
    process.exit(1);
  }

  const projectConfig = loadConfig(configPath);
  const projectVersions = getToolkitVersions(projectConfig);

  const toolkitPkg = JSON.parse(readFileSync(join(TOOLKIT_ROOT, 'package.json'), 'utf-8'));
  const toolkitConfig = loadConfig(join(TOOLKIT_ROOT, '.dw', 'config', 'dw.config.yml'));
  const toolkitVersions = getToolkitVersions(toolkitConfig);

  header('dw-kit Upgrade');
  log(`Installed (package) : v${toolkitPkg.version}`);
  log(`Project core        : ${projectVersions.core}`);
  log(`Toolkit core        : ${toolkitVersions.core}`);
  if (opts.dryRun) log('Mode: DRY RUN (no changes)');
  console.log();

  if (opts.check) {
    if (projectVersions.core === toolkitVersions.core) {
      ok('Already up to date.');
    } else {
      log(`Update available: ${projectVersions.core} → ${toolkitVersions.core}`);
    }
    return;
  }

  const layer = opts.layer || 'all';
  let totalChanges = 0;

  if (layer === 'all' || layer === 'core') {
    totalChanges += upgradeCore(projectDir, opts);
  }

  if (layer === 'all' || layer === 'platform') {
    totalChanges += upgradePlatform(projectDir, opts);
  }

  if (layer === 'all' || layer === 'capability') {
    totalChanges += upgradeCapability(projectDir, opts);
  }

  upgradeScripts(projectDir, opts);
  upgradeConfigSchema(projectDir, opts);

  if (!opts.dryRun && totalChanges > 0) {
    updateVersionTracking(configPath, projectConfig, toolkitVersions);
  }

  console.log();
  header(opts.dryRun ? 'DRY RUN complete — no changes made' : `Upgrade complete (${totalChanges} files updated)`);
  if (opts.dryRun) log('Run without --dry-run to apply.');
  console.log();
}

function upgradeCore(projectDir, opts) {
  info('Layer 0: Methodology Core (.dw/core/)');
  const src = join(TOOLKIT_ROOT, '.dw', 'core');
  const dst = join(projectDir, '.dw', 'core');

  const diff = diffDirs(src, dst);
  reportDiff(diff);

  if (diff.added.length === 0 && diff.modified.length === 0) {
    ok('Core files are up to date');
    return 0;
  }

  const filesToUpdate = [...diff.added, ...diff.modified];
  for (const file of filesToUpdate) {
    if (opts.dryRun) {
      dry(`${diff.added.includes(file) ? 'add' : 'update'} .dw/core/${file}`);
    } else {
      copyFile(join(src, file), join(dst, file));
      ok(`.dw/core/${file}`);
    }
  }
  return filesToUpdate.length;
}

function upgradePlatform(projectDir, opts) {
  info('Layer 1: Platform Files (.claude/)');
  const src = join(TOOLKIT_ROOT, '.claude');
  const dst = join(projectDir, '.claude');

  if (!existsSync(dst)) {
    warn('.claude/ not found — skipping platform upgrade (run dw init first)');
    return 0;
  }

  const overridesDir = join(projectDir, '.dw', 'adapters', 'claude-cli', 'overrides');
  const diff = diffDirs(src, dst);
  reportDiff(diff);

  if (diff.added.length === 0 && diff.modified.length === 0) {
    ok('Platform files are up to date');
    return 0;
  }

  let count = 0;
  const filesToUpdate = [...diff.added, ...diff.modified];
  for (const file of filesToUpdate) {
    const overridePath = join(overridesDir, file);
    if (existsSync(overridePath)) {
      warn(`${file}: override exists → keeping your version`);
      continue;
    }

    if (opts.dryRun) {
      dry(`${diff.added.includes(file) ? 'add' : 'update'} .claude/${file}`);
    } else {
      copyFile(join(src, file), join(dst, file));
      ok(`.claude/${file}`);
    }
    count++;
  }

  copyExtensions(projectDir, opts);
  mergeSettingsJson(projectDir, opts);

  return count;
}

function copyExtensions(projectDir, opts) {
  const extDir = join(projectDir, '.dw', 'adapters', 'claude-cli', 'extensions');
  const skillsDir = join(projectDir, '.claude', 'skills');

  if (!existsSync(extDir)) return;

  let count = 0;
  try {
    const entries = readdirSync(extDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.gitkeep') continue;
      const src = join(extDir, entry.name);
      const dst = join(skillsDir, entry.name);
      if (opts.dryRun) {
        dry(`install extension: ${entry.name}`);
      } else {
        copyDir(src, dst, { overwrite: true });
        ok(`Extension '${entry.name}' installed`);
      }
      count++;
    }
  } catch { /* empty extensions dir */ }
  if (count === 0) log('No extensions found');
}

function mergeSettingsJson(projectDir, opts) {
  const toolkitSettings = join(TOOLKIT_ROOT, '.claude', 'settings.json');
  const projectSettings = join(projectDir, '.claude', 'settings.json');

  if (!existsSync(toolkitSettings) || !existsSync(projectSettings)) return;

  if (opts.dryRun) {
    dry('merge .claude/settings.json');
    return;
  }

  try {
    const template = JSON.parse(readFileSync(toolkitSettings, 'utf-8'));
    const current = JSON.parse(readFileSync(projectSettings, 'utf-8'));
    const merged = deepMerge(template, current);
    writeFileSync(projectSettings, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    ok('settings.json: merged');
  } catch (e) {
    warn(`settings.json merge failed: ${e.message}`);
  }
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const [key, val] of Object.entries(override)) {
    if (key in result && typeof result[key] === 'object' && !Array.isArray(result[key]) && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key], val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function upgradeCapability(projectDir, opts) {
  info('Layer 2: Capability Config');
  ok('Capability layer is config-driven — no file changes needed');
  log('Review claude: section in .dw/config/dw.config.yml for new options');
  return 0;
}

function upgradeScripts(projectDir, opts) {
  info('Scripts');
  const src = join(TOOLKIT_ROOT, 'scripts');
  const dst = join(projectDir, 'scripts');

  if (!existsSync(src)) return;

  const diff = diffDirs(src, dst);
  if (diff.added.length === 0 && diff.modified.length === 0) {
    ok('Scripts are up to date');
    return;
  }

  for (const file of [...diff.added, ...diff.modified]) {
    if (opts.dryRun) {
      dry(`update scripts/${file}`);
    } else {
      copyFile(join(src, file), join(dst, file));
      ok(`scripts/${file}`);
    }
  }
}

function upgradeConfigSchema(projectDir, opts) {
  const src = join(TOOLKIT_ROOT, '.dw', 'config', 'config.schema.json');
  const dst = join(projectDir, '.dw', 'config', 'config.schema.json');

  if (!existsSync(src)) return;
  if (existsSync(dst)) {
    const srcContent = readFileSync(src, 'utf-8');
    const dstContent = readFileSync(dst, 'utf-8');
    if (srcContent === dstContent) return;
  }

    if (opts.dryRun) {
      dry('update .dw/config/config.schema.json');
    } else {
      copyFile(src, dst);
      ok('.dw/config/config.schema.json updated');
    }
}

function updateVersionTracking(configPath, config, toolkitVersions) {
  const today = new Date().toISOString().split('T')[0];
  if (!config._toolkit) config._toolkit = {};
  config._toolkit.core_version = toolkitVersions.core;
  config._toolkit.platform_version = toolkitVersions.platform;
  config._toolkit.capability_version = toolkitVersions.capability;
  config._toolkit.last_upgrade = today;

  writeConfig(configPath, config);
  ok(`Version tracking updated: core=${toolkitVersions.core}, date=${today}`);
}

function reportDiff(diff) {
  if (diff.added.length > 0) log(`  New files: ${diff.added.length}`);
  if (diff.modified.length > 0) log(`  Modified:  ${diff.modified.length}`);
  if (diff.unchanged.length > 0) log(`  Unchanged: ${diff.unchanged.length}`);
}
