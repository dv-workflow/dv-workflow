import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { header, ok, warn, err, info, log, dry, ask } from '../lib/ui.mjs';
import { loadConfig, buildConfig, writeConfig } from '../lib/config.mjs';

const DEPTH_MAP = { '1': 'quick', '2': 'standard', '3': 'thorough' };
const VALID_ROLES = ['dev', 'techlead', 'ba', 'qc', 'pm'];

export async function migrateCommand(opts) {
  const projectDir = process.cwd();
  const dryRun = opts.dryRun || false;

  header('dw-kit v0.3 → v1 Migration');
  if (dryRun) log('Mode: DRY RUN');

  const oldConfigPath = findOldConfig(projectDir);
  if (!oldConfigPath) {
    ok('No v0.3 config found (dv-workflow.config.yml). Already on v1 or fresh install.');
    log('If migrating manually, run `dw init` instead.');
    return;
  }

  info(`Step 1: Parse old config (${oldConfigPath})`);
  const oldConfig = loadConfig(oldConfigPath);
  if (!oldConfig) {
    err('Failed to parse old config. Manual migration needed.');
    process.exit(1);
  }
  ok('Old config parsed');

  const extracted = extractOldValues(oldConfig);
  log(`  Project: ${extracted.name}`);
  log(`  Level: ${extracted.level} → depth: ${extracted.depth}`);
  log(`  Roles: ${extracted.roles.join(', ')}`);
  log(`  Language: ${extracted.language}`);

  info('Step 2: Detect customized skills');
  const customized = detectCustomizedSkills(projectDir);
  if (customized.length > 0) {
    for (const skill of customized) {
      if (dryRun) {
        dry(`preserve ${skill} → .dw/adapters/claude-cli/overrides/skills/${skill}/`);
      } else {
        preserveSkillOverride(projectDir, skill);
        ok(`Preserved: ${skill} → overrides/`);
      }
    }
  } else {
    ok('No customized skills detected');
  }

  info('Step 3: Create v1 config');
  const newConfigDir = join(projectDir, '.dw', 'config');
  const newConfigPath = join(newConfigDir, 'dw.config.yml');

  if (existsSync(newConfigPath)) {
    warn('.dw/config/dw.config.yml already exists — skipping config generation');
    warn('Review and update manually if needed.');
  } else {
    const newConfig = buildConfig({
      projectName: extracted.name,
      language: extracted.language,
      depth: extracted.depth,
      roles: extracted.roles,
    });

    if (extracted.testCommand) newConfig.quality.test_command = extracted.testCommand;
    if (extracted.lintCommand) newConfig.quality.lint_command = extracted.lintCommand;
    newConfig._toolkit.migrated_from = 'v0.3';

    if (dryRun) {
      dry('Would create .dw/config/dw.config.yml');
    } else {
      mkdirSync(newConfigDir, { recursive: true });
      writeConfig(newConfigPath, newConfig);
      ok(`.dw/config/dw.config.yml created (depth: ${extracted.depth})`);
    }
  }

  info('Step 4: Backup old config');
  if (dryRun) {
    dry(`Would backup ${oldConfigPath} → ${oldConfigPath}.bak`);
  } else {
    const bakPath = `${oldConfigPath}.bak`;
    if (!existsSync(bakPath)) {
      copyFileSync(oldConfigPath, bakPath);
      ok(`Backed up: ${oldConfigPath} → ${bakPath}`);
    } else {
      warn('Backup already exists — skipping');
    }
  }

  info('Step 5: Check CI/CD references');
  const ciFiles = checkCIReferences(projectDir);
  if (ciFiles.length > 0) {
    for (const file of ciFiles) {
      warn(`Found reference in: ${file} — update to .dw/config/dw.config.yml`);
    }
  } else {
    ok('No CI/CD references found');
  }

  console.log();
  header(dryRun ? 'DRY RUN complete — no changes made' : 'Migration complete!');

  if (!dryRun) {
    console.log();
    log('Next steps:');
    log('  1. Review .dw/config/dw.config.yml');
    log('  2. Run: dw init --adapter claude-cli  (to regenerate .claude/)');
    log('  3. Check .dw/adapters/claude-cli/overrides/ for preserved customizations');
    if (ciFiles.length > 0) {
      log('  4. Update CI/CD files (see warnings above)');
    }
  } else {
    log('Run without --dry-run to apply migration.');
  }
  console.log();
}

function findOldConfig(projectDir) {
  const candidates = [
    join(projectDir, 'dv-workflow.config.yml'),
    join(projectDir, 'dw.config.yml'),
  ];
  return candidates.find(p => existsSync(p)) || null;
}

function extractOldValues(config) {
  const name = config.project?.name || config.name || 'my-project';
  const language = config.project?.language || config.language || 'vi';
  const level = String(config.level || config.workflow?.level || '2');
  const depth = DEPTH_MAP[level] || 'standard';

  let roles = config.team?.roles || [];
  if (!Array.isArray(roles)) roles = ['dev'];
  roles = roles.filter(r => VALID_ROLES.includes(r));
  if (!roles.includes('dev')) roles.unshift('dev');

  const testCommand = config.quality?.test_command || config.test_command || '';
  const lintCommand = config.quality?.lint_command || config.lint_command || '';

  return { name, language, level, depth, roles, testCommand, lintCommand };
}

function detectCustomizedSkills(projectDir) {
  const skillsDir = join(projectDir, '.claude', 'skills');
  if (!existsSync(skillsDir)) return [];

  const customized = [];
  try {
    const isGitRepo = existsSync(join(projectDir, '.git'));
    if (!isGitRepo) return [];

    const skills = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const skill of skills) {
      const skillFile = join('.claude', 'skills', skill, 'SKILL.md');
      try {
        execSync(`git diff --quiet HEAD -- "${skillFile}"`, {
          cwd: projectDir,
          stdio: 'pipe',
        });
      } catch {
        customized.push(skill);
      }
    }
  } catch { /* not a git repo or other issue */ }

  return customized;
}

function preserveSkillOverride(projectDir, skillName) {
  const srcFile = join(projectDir, '.claude', 'skills', skillName, 'SKILL.md');
  const dstDir = join(projectDir, '.dw', 'adapters', 'claude-cli', 'overrides', 'skills', skillName);
  const dstFile = join(dstDir, 'SKILL.md');

  if (!existsSync(srcFile)) return;
  mkdirSync(dstDir, { recursive: true });
  copyFileSync(srcFile, dstFile);
}

function checkCIReferences(projectDir) {
  const found = [];

  const directChecks = ['.gitlab-ci.yml', 'Makefile', '.circleci/config.yml'];
  for (const file of directChecks) {
    const fullPath = join(projectDir, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      if (/dv-workflow\.config\.yml|dv-workflow-kit/.test(content)) {
        found.push(file);
      }
    }
  }

  const workflowsDir = join(projectDir, '.github', 'workflows');
  if (existsSync(workflowsDir)) {
    try {
      const files = readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      for (const file of files) {
        const fullPath = join(workflowsDir, file);
        const content = readFileSync(fullPath, 'utf-8');
        if (/dv-workflow\.config\.yml|dv-workflow-kit/.test(content)) {
          found.push(join('.github', 'workflows', file));
        }
      }
    } catch { /* dir read failed */ }
  }

  return found;
}
