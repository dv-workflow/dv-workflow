import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';

export function loadConfig(configPath) {
  if (!existsSync(configPath)) return null;
  const content = readFileSync(configPath, 'utf-8');
  return yaml.load(content);
}

/**
 * Load config với local override (v1.2+).
 * dw.config.yml  — shared, committed
 * dw.config.local.yml — machine-specific, gitignored
 * Local values win over base values (shallow merge per top-level key).
 */
export function loadConfigWithLocal(configDir) {
  const basePath = `${configDir}/dw.config.yml`;
  const localPath = `${configDir}/dw.config.local.yml`;

  const base = loadConfig(basePath);
  if (!base) return null;

  if (!existsSync(localPath)) return base;

  const local = loadConfig(localPath);
  if (!local) return base;

  const merged = { ...base };
  for (const key of Object.keys(local)) {
    if (typeof local[key] === 'object' && !Array.isArray(local[key]) && local[key] !== null) {
      merged[key] = { ...(merged[key] || {}), ...local[key] };
    } else {
      merged[key] = local[key];
    }
  }
  return merged;
}

export function writeConfig(configPath, data) {
  const content = yaml.dump(data, {
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
  });
  writeFileSync(configPath, content, 'utf-8');
}

export function loadSchema(schemaPath) {
  if (!existsSync(schemaPath)) return null;
  return JSON.parse(readFileSync(schemaPath, 'utf-8'));
}

export function buildConfig({ projectName, language, depth, roles }) {
  const today = new Date().toISOString().split('T')[0];
  return {
    project: {
      name: projectName,
      language: language,
    },
    workflow: {
      default_depth: depth,
    },
    team: {
      roles: roles,
    },
    quality: {
      test_command: '',
      lint_command: '',
      block_on_fail: false,
    },
    tracking: {
      estimation: depth !== 'quick',
      log_work: depth === 'thorough',
      estimation_unit: 'hours',
    },
    paths: {
      tasks: '.dw/tasks',
      docs: '.dw/docs',
    },
    claude: {
      models: { plan: '', execute: '', review: '' },
      structured_output: depth !== 'quick',
      worktree_execution: false,
      mcp: [],
    },
    _toolkit: {
      core_version: '1.2',
      platform_version: '1.0',
      capability_version: '1.2',
      installed: today,
      last_upgrade: today,
    },
  };
}

export function getToolkitVersions(config) {
  return {
    core: config?._toolkit?.core_version || 'unknown',
    platform: config?._toolkit?.platform_version || 'unknown',
    capability: config?._toolkit?.capability_version || 'unknown',
  };
}
