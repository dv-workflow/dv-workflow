import { readEvents, summarize } from '../lib/telemetry.mjs';
import { generateActiveIndex } from '../lib/active-index.mjs';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { banner, log, info, warn, ok } from '../lib/ui.mjs';
import chalk from 'chalk';

export async function dashboardCommand(opts) {
  banner('dw-kit Dashboard');

  const rootDir = process.cwd();

  log(chalk.bold('📋 Active Tasks'));
  log('');
  const activeContent = generateActiveIndex(rootDir);
  const taskLines = activeContent.split('\n').filter((l) => l.startsWith('- `'));
  if (taskLines.length === 0) {
    log('  (none)');
  } else {
    taskLines.forEach((l) => log('  ' + l));
  }
  log('');

  log(chalk.bold('🗂️  Decisions (ADRs)'));
  log('');
  const decisionsDir = join(rootDir, '.dw/decisions');
  if (existsSync(decisionsDir)) {
    const adrs = readdirSync(decisionsDir).filter((f) => /^\d{4}-.*\.md$/.test(f));
    if (adrs.length === 0) {
      log('  (none)');
    } else {
      adrs.sort().forEach((f) => {
        try {
          const content = readFileSync(join(decisionsDir, f), 'utf8');
          const statusMatch = content.match(/^status:\s*(.+)$/m);
          const titleMatch = content.match(/^title:\s*(.+)$/m);
          const status = statusMatch ? statusMatch[1].trim() : 'unknown';
          const title = titleMatch ? titleMatch[1].trim() : f;
          const statusColor =
            status === 'Accepted'
              ? chalk.green
              : status.startsWith('Proposed')
              ? chalk.yellow
              : status === 'Deprecated'
              ? chalk.gray
              : chalk.white;
          log(`  ${chalk.cyan(f.replace(/\.md$/, ''))} · ${statusColor(status)}`);
          log(`    ${chalk.dim(title)}`);
        } catch {
          log(`  ${f} · (unreadable)`);
        }
      });
    }
  } else {
    log('  (decisions layer not initialized — run `/dw:decision` to create first ADR)');
  }
  log('');

  log(chalk.bold('📊 Telemetry Summary'));
  log('');
  if (process.env.DW_NO_TELEMETRY === '1') {
    warn('Telemetry disabled (DW_NO_TELEMETRY=1)');
  } else {
    const events = readEvents(rootDir);
    if (events.length === 0) {
      log('  No events yet. Use dw-kit normally to populate.');
    } else {
      const s = summarize(events);
      log(`  Total events: ${s.totalEvents}`);
      if (s.dateRange) {
        log(`  Range: ${s.dateRange.from.slice(0, 10)} → ${s.dateRange.to.slice(0, 10)}`);
      }

      const topSkills = Object.entries(s.bySkill)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (topSkills.length > 0) {
        log('');
        log(chalk.dim('  Top 5 skills:'));
        topSkills.forEach(([n, c]) => log(`    ${c.toString().padStart(4)}× /${n}`));
      }

      const topHooks = Object.entries(s.byHook)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (topHooks.length > 0) {
        log('');
        log(chalk.dim('  Top 5 hooks:'));
        topHooks.forEach(([n, c]) => log(`    ${c.toString().padStart(4)}× ${n}`));
      }
    }
  }
  log('');

  log(chalk.bold('🔧 Health'));
  log('');
  const checks = [
    { path: '.dw/config/dw.config.yml', label: 'Config' },
    { path: '.dw/tasks/ACTIVE.md', label: 'ACTIVE index' },
    { path: '.dw/decisions', label: 'Decisions layer' },
    { path: '.claude/hooks/privacy-block.sh', label: 'Privacy guard' },
    { path: '.claude/hooks/pre-commit-gate.sh', label: 'Commit gate' },
  ];

  for (const c of checks) {
    const full = join(rootDir, c.path);
    if (existsSync(full)) {
      ok(`${c.label}: ${c.path}`);
    } else {
      warn(`${c.label}: missing (${c.path})`);
    }
  }

  log('');
  info('Run `dw metrics show` for detailed telemetry, `dw doctor` for full health check.');
}
