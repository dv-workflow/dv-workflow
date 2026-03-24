import { Command } from 'commander';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(join(__dirname, '..', 'package.json'));

export function run(argv) {
  const program = new Command();

  program
    .name('dw')
    .description('dw-kit — AI development workflow toolkit')
    .version(pkg.version, '-v, --version');

  program
    .command('init')
    .description('Setup dw-kit in current project (interactive wizard)')
    .option('-p, --preset <name>', 'Use preset: solo-quick | small-team | enterprise')
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
    .command('migrate')
    .description('Migrate project from dw-kit v0.3 to v1')
    .option('-n, --dry-run', 'Preview migration without applying')
    .action(async (opts) => {
      const { migrateCommand } = await import('./commands/migrate.mjs');
      await migrateCommand(opts);
    });

  program.parse(argv);
}
