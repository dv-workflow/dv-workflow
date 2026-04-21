import { readEvents, summarize } from '../lib/telemetry.mjs';
import { analyze, analyzeTaskDocs, THRESHOLDS, TASK_DOC_THRESHOLDS } from '../lib/cut-analysis.mjs';
import { banner, log, info, warn, ok, err } from '../lib/ui.mjs';
import chalk from 'chalk';

export async function metricsCommand(opts) {
  const sub = opts.sub || 'show';

  if (sub === 'show') {
    return showMetrics(opts);
  }
  if (sub === 'cut-analysis') {
    return cutAnalysisReport(opts);
  }
  if (sub === 'clear') {
    warn('Use `rm .dw/metrics/events.jsonl` to clear manually. Telemetry is append-only.');
    return;
  }
  warn(`Unknown subcommand: ${sub}. Available: show | cut-analysis | clear`);
}

function showMetrics(opts) {
  banner('dw-kit Telemetry — Local Events');

  if (process.env.DW_NO_TELEMETRY === '1' || process.env.DW_NO_TELEMETRY === 'true') {
    warn('Telemetry is disabled (DW_NO_TELEMETRY=1).');
    log('No events are being collected.');
    return;
  }

  const events = readEvents(process.cwd(), {
    since: opts.since,
    filterName: opts.skill,
  });

  if (events.length === 0) {
    info('No telemetry events recorded yet.');
    log('Events will be logged as you use dw-kit skills and hooks.');
    log('Storage: .dw/metrics/events.jsonl (local, append-only, zero network)');
    return;
  }

  const s = summarize(events);
  log('');
  log(chalk.bold(`Total events: ${s.totalEvents}`));
  if (s.dateRange) {
    log(`Range: ${s.dateRange.from.slice(0, 10)} → ${s.dateRange.to.slice(0, 10)}`);
  }
  log('');

  if (Object.keys(s.bySkill).length > 0) {
    log(chalk.bold('Skills invoked:'));
    const skillsSorted = Object.entries(s.bySkill).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of skillsSorted) {
      log(`  ${count.toString().padStart(4)}× /${name}`);
    }
    log('');
  }

  if (Object.keys(s.byHook).length > 0) {
    log(chalk.bold('Hooks fired:'));
    const hooksSorted = Object.entries(s.byHook).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of hooksSorted) {
      log(`  ${count.toString().padStart(4)}× ${name}`);
    }
    log('');
  }

  if (Object.keys(s.byTask).length > 0) {
    log(chalk.bold('Task actions:'));
    for (const [action, count] of Object.entries(s.byTask)) {
      log(`  ${count.toString().padStart(4)}× ${action}`);
    }
    log('');
  }

  info('Privacy: all data is local. Set DW_NO_TELEMETRY=1 to disable.');
}

function cutAnalysisReport(opts) {
  banner('dw-kit Cut-Analysis — ADR-0001 Cut Criteria Matrix');

  if (process.env.DW_NO_TELEMETRY === '1' || process.env.DW_NO_TELEMETRY === 'true') {
    warn('Telemetry disabled — no data to analyze.');
    return;
  }

  const events = readEvents(process.cwd(), { since: opts.since });
  if (events.length === 0) {
    info('No telemetry events recorded — nothing to analyze.');
    return;
  }

  const result = analyze(events);
  const { coverage, skills, hooks, candidates } = result;

  log('');
  log(chalk.bold('Coverage'));
  const covMsg = `  days=${coverage.days}  unique_sessions=${coverage.sessions}`;
  log(covMsg);
  if (!coverage.coverageOk) {
    warn(`coverage_days=${coverage.days} < ${THRESHOLDS.skill.minCoverageDays} — skill cuts NOT recommended yet`);
  } else {
    ok(`coverage_days ≥ ${THRESHOLDS.skill.minCoverageDays} — eligible for skill evaluation`);
  }
  if (!coverage.devsOk) {
    warn(`devs=${coverage.sessions} < ${THRESHOLDS.skill.minDevs} — skill cuts NOT recommended yet (session-hash is a proxy; may undercount)`);
  }

  log('');
  log(chalk.bold('Skills (sorted by uses/week/dev, ascending)'));
  if (skills.length === 0) {
    log('  (no skill events)');
  } else {
    for (const r of skills) {
      const rate = r.stats.usesPerWeekPerDev.toFixed(2);
      const tag = r.qualify
        ? chalk.red('CUT CANDIDATE')
        : r.critical
        ? chalk.cyan('protected')
        : r.perProject
        ? chalk.dim('per-project')
        : chalk.green('keep');
      log(`  ${tag.padEnd(24)} /${r.name.padEnd(24)} uses/wk/dev=${rate}  total=${r.stats.count}`);
      for (const reason of r.reasons) log(chalk.dim(`      └─ ${reason}`));
    }
  }

  log('');
  log(chalk.bold('Hooks (sorted by fires/session, descending)'));
  if (hooks.length === 0) {
    log('  (no hook events)');
  } else {
    for (const r of hooks) {
      const fires = r.stats.firesPerSession.toFixed(1);
      const lat = r.stats.avgLatency !== null ? `${r.stats.avgLatency.toFixed(0)}ms` : 'n/a';
      const tag = r.qualify ? chalk.red('CUT CANDIDATE') : chalk.green('keep');
      log(`  ${tag.padEnd(24)} ${r.name.padEnd(24)} fires/session=${fires}  avg_latency=${lat}`);
      for (const reason of r.reasons) log(chalk.dim(`      └─ ${reason}`));
    }
  }

  log('');
  log(chalk.bold('Summary'));
  const skillCount = candidates.skills.length;
  const hookCount = candidates.hooks.length;
  if (skillCount === 0 && hookCount === 0) {
    ok('No cut candidates — keep current surface.');
  } else {
    log(`  Skills flagged: ${skillCount}`);
    log(`  Hooks flagged: ${hookCount}`);
    log('');
    info('Next steps:');
    log('  1. Run team survey for qualitative check on flagged items (avoid false-positives).');
    log('  2. For each confirmed cut → write ADR (`/dw:decision "Remove <name>"`).');
    log('  3. Remove from .claude/hooks/ or .claude/skills/ + update .claude/settings.json.');
    log('  4. Document in MIGRATION-v1.4.md with rollback instructions.');
  }
  log('');
  info('Thresholds (from ADR-0001 Cut Criteria Matrix):');
  log(`  Skill: uses/wk/dev < ${THRESHOLDS.skill.minUsesPerWeekPerDev} AND devs ≥ ${THRESHOLDS.skill.minDevs} AND coverage ≥ ${THRESHOLDS.skill.minCoverageDays}d`);
  log(`  Hook:  avg_latency > ${THRESHOLDS.hook.maxAvgLatencyMs}ms OR fires/session > ${THRESHOLDS.hook.maxFiresPerSession}`);
  log('');
  info('Caveat: "devs" proxied by unique session hashes — undercounts real headcount.');

  // Task doc health — invalidation trigger for 3→2 file consolidation (ADR-0001)
  const td = analyzeTaskDocs(process.cwd());
  if (td && td.totalTasks > 0) {
    log('');
    log(chalk.bold('Task Doc Health (ADR-0001 invalidation signal for 3→2 consolidation)'));
    log(`  Tasks total: ${td.totalTasks}  (v2=${td.v2Count}, v1=${td.v1Count})`);
    log(`  tracking.md lines: avg=${td.avgTrackingLines}  max=${td.maxTrackingLines}`);
    log(`  Tasks with ≥3 md files: ${td.extraFilesCount} (${td.extraFilesPct}%)`);
    if (td.triggers.length === 0) {
      ok('No task-doc invalidation triggers fired — 3→2 consolidation holding.');
    } else {
      for (const t of td.triggers) {
        err(t);
      }
    }
    log('');
    info('Task doc thresholds:');
    log(`  avg_tracking_lines > ${TASK_DOC_THRESHOLDS.trackingLinesWarn}  OR  pct_tasks_with_3plus_files > ${TASK_DOC_THRESHOLDS.extraFilesPctWarn}%`);
  }
}
