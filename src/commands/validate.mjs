import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { header, ok, warn, err, info, log } from '../lib/ui.mjs';
import { loadConfig, loadSchema } from '../lib/config.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

export async function validateCommand(opts) {
  const configPath = resolve(opts.file);

  header('dw-kit Config Validation');

  if (!existsSync(configPath)) {
    err(`Config file not found: ${configPath}`);
    log('Run `dw init` to create a config file.');
    process.exit(1);
  }

  info(`Loading ${opts.file}`);
  const config = loadConfig(configPath);
  if (!config) {
    err('Failed to parse YAML config.');
    process.exit(1);
  }
  ok('YAML syntax valid');

  info('Validating against schema');
  const schemaPath = resolve('.dw', 'config', 'config.schema.json');
  const fallbackSchemaPath = join(TOOLKIT_ROOT, '.dw', 'config', 'config.schema.json');
  let schema = loadSchema(schemaPath) || loadSchema(fallbackSchemaPath);

  if (!schema) {
    warn('Schema file not found — skipping schema validation');
    warn('Expected at: .dw/config/config.schema.json');
    return;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (valid) {
    ok('Schema validation passed');
  } else {
    err('Schema validation failed:');
    for (const error of validate.errors) {
      const path = error.instancePath || '(root)';
      log(`  ${path}: ${error.message}`);
      if (error.params?.allowedValues) {
        log(`    Allowed: ${error.params.allowedValues.join(', ')}`);
      }
      if (error.params?.additionalProperty) {
        log(`    Unknown key: ${error.params.additionalProperty}`);
      }
    }
    process.exit(1);
  }

  info('Semantic checks');
  runSemanticChecks(config);

  console.log();
  ok('Config is valid.');
  console.log();
}

function runSemanticChecks(config) {
  const warnings = [];

  if (!config.project?.name || config.project.name === 'my-project') {
    warnings.push('project.name is still "my-project" — consider updating');
  }

  if (config.quality?.block_on_fail && !config.quality?.test_command && !config.quality?.lint_command) {
    warnings.push('quality.block_on_fail is true but no test_command or lint_command configured');
  }

  if (config.tracking?.estimation && config.workflow?.default_depth === 'quick') {
    warnings.push('tracking.estimation is enabled but depth is "quick" — estimation may add unnecessary overhead');
  }

  const roles = config.team?.roles || [];
  if (roles.includes('pm') && !config.tracking?.log_work) {
    warnings.push('PM role enabled but tracking.log_work is false — PM dashboard needs work logs');
  }

  if (roles.includes('qc') && !config.quality?.test_command) {
    warnings.push('QC role enabled but no quality.test_command — QC workflow benefits from tests');
  }

  if (config.claude?.worktree_execution && config.workflow?.default_depth === 'quick') {
    warnings.push('claude.worktree_execution is true with "quick" depth — worktree is typically for thorough workflows');
  }

  if (warnings.length === 0) {
    ok('No semantic issues found');
  } else {
    for (const w of warnings) warn(w);
  }
}
