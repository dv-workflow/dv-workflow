import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { banner, ok, warn, info, log, ask, choose } from '../lib/ui.mjs';
import { buildConfig, writeConfig } from '../lib/config.mjs';
import { copyDir, copyFile, ensureDir } from '../lib/copy.mjs';
import { detectPlatform, platformLabel } from '../lib/platform.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

const PRESETS = {
  'solo-quick': { depth: 'quick', roles: ['dev'], tracking: false },
  'small-team': { depth: 'standard', roles: ['dev', 'techlead'], tracking: true },
  'enterprise': { depth: 'thorough', roles: ['dev', 'techlead', 'ba', 'qc', 'pm'], tracking: true },
};
const VALID_DEPTHS = ['quick', 'standard', 'thorough'];
const VALID_LANGUAGES = ['vi', 'en'];

export async function initCommand(opts) {
  const projectDir = process.cwd();

  if (existsSync(join(projectDir, '.dw', 'config', 'dw.config.yml'))) {
    warn('dw-kit is already initialized in this project (.dw/config/dw.config.yml exists).');
    const answer = await ask('Reinitialize? This will overwrite config. (y/N)', 'N');
    if (answer.toLowerCase() !== 'y') {
      log('Aborted.');
      return;
    }
  }

  let projectName, depth, roles, language;

  if (opts.preset) {
    const preset = PRESETS[opts.preset];
    if (!preset) {
      warn(`Unknown preset: ${opts.preset}. Available: ${Object.keys(PRESETS).join(', ')}`);
      process.exit(1);
    }
    banner(`Setup Wizard v1.0 — preset: ${opts.preset}`);
    projectName = process.env.DW_NAME || guessProjectName(projectDir);
    depth = preset.depth;
    roles = preset.roles;
    language = process.env.DW_LANG || 'vi';
    log(`Using preset: ${opts.preset}`);
    log(`  Project: ${projectName}, Depth: ${depth}, Roles: ${roles.join(', ')}, Lang: ${language}`);
  } else if (opts.silent) {
    banner('Setup Wizard v1.0 — silent mode');
    projectName = process.env.DW_NAME || guessProjectName(projectDir);
    depth = process.env.DW_DEPTH || 'standard';
    const parsedRoles = parseRolesEnv(process.env.DW_ROLES || '');
    language = process.env.DW_LANG || 'vi';
    if (!VALID_DEPTHS.includes(depth)) {
      warn(`Invalid DW_DEPTH="${depth}". Allowed: ${VALID_DEPTHS.join(', ')}`);
      process.exit(1);
    }
    if (!VALID_LANGUAGES.includes(language)) {
      warn(`Invalid DW_LANG="${language}". Allowed: ${VALID_LANGUAGES.join(', ')}`);
      process.exit(1);
    }
    roles = normalizeRolesForDepth(parsedRoles, depth);
    log(`Silent mode — reading from environment variables`);
    log(`  Project: ${projectName}, Depth: ${depth}, Roles: ${roles.join(', ')}, Lang: ${language}`);
  } else {
    banner('Setup Wizard v1.0');
    projectName = await askProjectName(projectDir);
    depth = await askDepth();
    roles = defaultRolesForDepth(depth);
    language = await askLanguage();
    log(`  Roles auto-selected by depth: ${roles.join(', ')}`);
  }

  console.log();
  info('Detecting platform...');
  const adapter = opts.adapter || detectPlatform(projectDir);
  ok(`Platform: ${platformLabel(adapter)}`);

  info('Setting up project...');
  await setupProject(projectDir, { projectName, depth, roles, language, adapter });

  printSummary({ projectName, depth, roles, language, adapter });
}

async function askProjectName(projectDir) {
  const guess = guessProjectName(projectDir);
  return ask('[Project] Project name?', guess);
}

async function askDepth() {
  return choose('[Depth] Default workflow depth:', [
    { value: 'quick', label: 'Solo dev, hotfix, familiar code — minimal ceremony' },
    { value: 'standard', label: 'Team, feature — full 6-phase workflow' },
    { value: 'thorough', label: 'Enterprise — full workflow + arch-review + test-plan' },
  ], 'standard');
}

async function askLanguage() {
  return choose('[Lang] Documentation language:', [
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'en', label: 'English' },
  ], 'vi');
}

function guessProjectName(dir) {
  const base = dir.split(/[/\\]/).pop();
  return base || 'my-project';
}

function parseRolesEnv(rolesStr) {
  if (!rolesStr) return [];
  const valid = ['dev', 'techlead', 'ba', 'qc', 'pm'];
  const parsed = rolesStr.split(',').map(r => r.trim().toLowerCase()).filter(r => valid.includes(r));
  return [...new Set(parsed)];
}

function defaultRolesForDepth(depth) {
  if (depth === 'quick') return ['dev'];
  if (depth === 'thorough') return ['dev', 'techlead', 'ba', 'qc', 'pm'];
  return ['dev', 'techlead'];
}

function normalizeRolesForDepth(parsedRoles, depth) {
  const required = defaultRolesForDepth(depth);
  const merged = [...new Set([...parsedRoles, ...required])];
  const missing = required.filter((r) => !parsedRoles.includes(r));
  if (parsedRoles.length > 0 && missing.length > 0) {
    warn(`DW_ROLES missing required roles for depth "${depth}". Auto-added: ${missing.join(', ')}`);
  }
  return merged;
}

async function setupProject(projectDir, { projectName, depth, roles, language, adapter }) {
  copyCoreDocs(projectDir);
  copyConfig(projectDir, { projectName, depth, roles, language });
  copyAdapterStructure(projectDir);

  if (adapter === 'claude-cli') {
    copyClaudeFiles(projectDir);
    copyCLAUDEmd(projectDir);
  } else if (adapter === 'cursor') {
    copyCursorFiles(projectDir);
    copyGenericAdapter(projectDir);
  } else if (adapter === 'generic') {
    copyGenericAdapter(projectDir);
  }

  createRuntimeDirs(projectDir);
  updateGitignore(projectDir);
}

function copyCoreDocs(projectDir) {
  const src = join(TOOLKIT_ROOT, '.dw', 'core');
  const dst = join(projectDir, '.dw', 'core');
  copyDir(src, dst, { overwrite: true });
  ok('.dw/core/ (WORKFLOW.md, THINKING.md, QUALITY.md, ROLES.md, templates/)');
}

function copyConfig(projectDir, { projectName, depth, roles, language }) {
  const configDir = join(projectDir, '.dw', 'config');
  ensureDir(configDir);

  const config = buildConfig({ projectName, language, depth, roles });
  writeConfig(join(configDir, 'dw.config.yml'), config);

  copyFile(
    join(TOOLKIT_ROOT, '.dw', 'config', 'config.schema.json'),
    join(configDir, 'config.schema.json'),
  );

  const presetsDir = join(configDir, 'presets');
  ensureDir(presetsDir);
  copyDir(join(TOOLKIT_ROOT, '.dw', 'config', 'presets'), presetsDir, { overwrite: true });

  ok('.dw/config/dw.config.yml + schema + presets');
}

function copyAdapterStructure(projectDir) {
  const adaptersDir = join(projectDir, '.dw', 'adapters');
  copyDir(join(TOOLKIT_ROOT, '.dw', 'adapters'), adaptersDir);
  ok('.dw/adapters/ (claude-cli, generic)');
}

function copyClaudeFiles(projectDir) {
  const src = join(TOOLKIT_ROOT, '.claude');
  const dst = join(projectDir, '.claude');
  const results = copyDir(src, dst, { overwrite: true });

  const skipCount = results.filter(r => r.action === 'skip').length;
  const copyCount = results.filter(r => r.action === 'copy').length;

  ok(`.claude/ (${copyCount} files — skills, agents, hooks, rules, templates)`);
  if (skipCount > 0) log(`  ${skipCount} existing files preserved`);
}

function copyCLAUDEmd(projectDir) {
  const src = join(TOOLKIT_ROOT, 'CLAUDE.md');
  const dst = join(projectDir, 'CLAUDE.md');

  if (existsSync(dst)) {
    warn('CLAUDE.md already exists — skipping (review manually if needed)');
    return;
  }

  copyFile(src, dst);

  const techStackSection = `
---

## Tech Stack

<!-- Update with your project's actual stack -->
- Framework: [e.g. NestJS / Django / Laravel / Next.js]
- Database: [e.g. PostgreSQL / MySQL / MongoDB]
- Testing: [e.g. Jest / Pytest / PHPUnit]

## Project-Specific Rules

<!-- Add project-specific rules -->
- [Rule 1]
`;
  appendFileSync(dst, techStackSection, 'utf-8');
  ok('CLAUDE.md (with Tech Stack template section)');
}

function copyCursorFiles(projectDir) {
  const rulesDir = join(projectDir, '.cursor', 'rules');
  ensureDir(rulesDir);

  const ruleContent = `# dw-kit Workflow Rules
# Auto-generated by dw init --adapter cursor
# Reference: .dw/core/WORKFLOW.md for full methodology

## Workflow
Follow the 6-phase workflow: Initialize → Understand → Plan → Execute → Verify → Close.
Read @.dw/core/WORKFLOW.md for detailed phase instructions.

## Quality
- Apply TDD: write test → implement → refactor
- Read @.dw/core/QUALITY.md for the 4-layer quality strategy
- Run test/lint commands from .dw/config/dw.config.yml before committing

## Thinking
When planning or debugging, apply the thinking framework from @.dw/core/THINKING.md:
- Critical Thinking: question assumptions
- Systems Thinking: trace dependencies and side effects
- First Principles: break down to fundamentals

## Roles
Check @.dw/core/ROLES.md for role definitions and decision authority.

## Task Tracking
- Task docs go in .dw/tasks/[task-name]/
- Use templates from .dw/core/templates/ for context, plan, and progress docs
`;

  writeFileSync(join(rulesDir, 'dw-workflow.mdc'), ruleContent, 'utf-8');
  ok('.cursor/rules/dw-workflow.mdc (Cursor rules from core methodology)');
}

function copyGenericAdapter(projectDir) {
  const src = join(TOOLKIT_ROOT, '.dw', 'adapters', 'generic', 'AGENT.md');
  const dst = join(projectDir, 'AGENT.md');
  if (!existsSync(dst)) {
    copyFile(src, dst);
    ok('AGENT.md (generic adapter for Cursor/Windsurf/Copilot)');
  } else {
    warn('AGENT.md already exists — skipping');
  }
}

function createRuntimeDirs(projectDir) {
  for (const dir of ['.dw/tasks', '.dw/docs', '.dw/metrics', '.dw/reports']) {
    ensureDir(join(projectDir, dir));
  }
  ok('.dw/ (tasks, docs, metrics, reports)');
}

function updateGitignore(projectDir) {
  const gitignorePath = join(projectDir, '.gitignore');
  const entriesToAdd = ['CLAUDE.local.md', '.claude/settings.local.json', '.dw/config/dw.config.local.yml'];

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    const missing = entriesToAdd.filter(e => !content.includes(e));
    if (missing.length > 0) {
      appendFileSync(gitignorePath, `\n# dw-kit\n${missing.join('\n')}\n`, 'utf-8');
      ok('.gitignore updated');
    }
  } else {
    writeFileSync(gitignorePath, `# dw-kit\n${entriesToAdd.join('\n')}\n`, 'utf-8');
    ok('.gitignore created');
  }
}

function printSummary({ projectName, depth, roles, language, adapter }) {
  console.log();
  console.log(`  ✅  Setup complete!`);
  console.log();
  console.log(`  Project  : ${projectName}`);
  console.log(`  Depth    : ${depth}`);
  console.log(`  Roles    : ${roles.join(', ')}`);
  console.log(`  Language : ${language}`);
  console.log(`  Platform : ${platformLabel(adapter)}`);
  console.log();
  console.log(`  Files created:`);
  console.log(`    .dw/               — core/, config/, adapters/, tasks, docs`);
  if (adapter === 'claude-cli') {
    console.log(`    .claude/           — skills, agents, hooks, rules`);
    console.log(`    CLAUDE.md`);
  } else if (adapter === 'cursor') {
    console.log(`    .cursor/rules/     — workflow rules for Cursor`);
    console.log(`    AGENT.md           — methodology reference`);
  } else {
    console.log(`    AGENT.md           — methodology reference`);
  }
  console.log();
  if (adapter === 'claude-cli') {
    console.log(`  Next steps:`);
    console.log(`    Run: claude (to open Claude Code in this directory in terminal)`);
    console.log(`    Run: /dw-flow [task-name]`);
    console.log(`    Suggested: Update Tech Stack in CLAUDE.md (optional, recommended)`);
  } else if (adapter === 'cursor') {
    console.log(`  Next steps:`);
    console.log(`    1. Open Cursor in this directory`);
    console.log(`    2. Rules auto-loaded from .cursor/rules/`);
    console.log(`    3. Reference AGENT.md + .dw/core/WORKFLOW.md for guidance`);
  } else {
    console.log(`  Next steps:`);
    console.log(`    1. Open your AI coding tool in this directory`);
    console.log(`    2. Reference AGENT.md for workflow guidance`);
  }
  console.log();
}
