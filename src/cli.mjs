import { Command } from 'commander';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import chalk from 'chalk';
import { getUpdateNotice, scheduleUpdateCheck } from './lib/update-checker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(join(__dirname, '..', 'package.json'));
const RELEASES_URL = 'https://github.com/dv-workflow/dv-workflow/releases';

export function run(argv) {
  // Schedule fresh check in background (non-blocking).
  // Notice is shown via process.on('exit') so it always appears AFTER command output,
  // even when commands call process.exit() internally.
  scheduleUpdateCheck(pkg.version);
  const latestVersion = getUpdateNotice(pkg.version);

  const program = new Command();

  program
    .name('dw')
    .description('dw-kit — AI development workflow toolkit')
    .version(pkg.version, '-v, --version');

  program
    .command('init')
    .description('Setup dw-kit in current project (interactive wizard)')
    .option('-p, --preset <name>', 'Use preset: solo | solo-quick | small-team | team | enterprise')
    .option('--solo', 'Shortcut for --preset solo (zero-config setup)')
    .option('-a, --adapter <platform>', 'Target platform: claude-cli | cursor | generic', 'claude-cli')
    .option('-s, --silent', 'Non-interactive mode (reads DW_NAME, DW_DEPTH, DW_ROLES, DW_LANG env vars)')
    .action(async (opts) => {
      const { initCommand } = await import('./commands/init.mjs');
      await initCommand(opts);
    });

  program
    .command('upgrade')
    .description('Update dw-kit files in current project')
    .option('-n, --dry-run', 'Preview changes without applying')
    .option('-c, --check', 'Only check if update is available')
    .option('-l, --layer <name>', 'Update specific layer: core | platform | capability | all', 'all')
    .action(async (opts) => {
      const { upgradeCommand } = await import('./commands/upgrade.mjs');
      await upgradeCommand(opts);
    });

  program
    .command('validate')
    .description('Validate .dw/config/dw.config.yml against schema')
    .option('-f, --file <path>', 'Config file path', '.dw/config/dw.config.yml')
    .action(async (opts) => {
      const { validateCommand } = await import('./commands/validate.mjs');
      await validateCommand(opts);
    });

  program
    .command('doctor')
    .description('Check dw-kit installation health')
    .action(async () => {
      const { doctorCommand } = await import('./commands/doctor.mjs');
      await doctorCommand();
    });

  program
    .command('prompt')
    .description('Build a well-structured task prompt with autocomplete + guided wizard')
    .option('-t, --text <text>', 'Non-interactive: provide description directly')
    .action(async (opts) => {
      const { promptCommand } = await import('./commands/prompt.mjs');
      await promptCommand(opts);
    });

  program
    .command('metrics [sub]')
    .description('Inspect local telemetry (show | cut-analysis | clear). Default: show')
    .option('--since <date>', 'Filter events since ISO date (YYYY-MM-DD)')
    .option('--skill <name>', 'Filter by skill name')
    .action(async (sub, opts) => {
      const { metricsCommand } = await import('./commands/metrics.mjs');
      await metricsCommand({ sub, ...opts });
    });

  program
    .command('active')
    .description('Regenerate .dw/tasks/ACTIVE.md index')
    .action(async () => {
      const { writeActiveIndex } = await import('./lib/active-index.mjs');
      const target = writeActiveIndex();
      console.log(chalk.green('✓') + ` Wrote ${target}`);
    });

  program
    .command('dashboard')
    .description('Show team dashboard — active tasks, ADRs, telemetry summary, health')
    .action(async (opts) => {
      const { dashboardCommand } = await import('./commands/dashboard.mjs');
      await dashboardCommand(opts);
    });

  program
    .command('claude-vn-fix')
    .description('Patch Claude CLI to fix Vietnamese IME (local, with backup/restore)')
    .option('--path <file>', 'Path to @anthropic-ai/claude-code/cli.js (optional; auto-detect if omitted)')
    .option('--restore', 'Restore from latest backup')
    .option('--dry-run', 'Show what would change without writing')
    .action(async (opts) => {
      const { claudeVnFixCommand } = await import('./commands/claude-vn-fix.mjs');
      await claudeVnFixCommand(opts);
    });

  if (latestVersion) {
    // Register notice to print AFTER the command completes (on clean exit only)
    process.on('exit', (code) => {
      if (code !== 0) return;
      console.log();
      console.log(chalk.yellow(`  ↑ Update available`) + `  v${pkg.version} → ` + chalk.green.bold(`v${latestVersion}`));
      console.log(`    Run ` + chalk.cyan(`npm install -g dw-kit`) + ` to update`);
      console.log(`    Changelog: ` + chalk.cyan(`${RELEASES_URL}/tag/v${latestVersion}`));
      console.log();
    });
  }

  program.parse(argv);
}
