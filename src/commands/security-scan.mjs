import { banner, log, info, warn, ok, err } from '../lib/ui.mjs';
import chalk from 'chalk';
import {
  loadSnapshot,
  snapshotInfo,
  syncSnapshotForProject,
  isStale,
  isSchemaCompatible,
} from '../lib/sc-sync.mjs';
import { scanProject, severityRank, worstSeverity } from '../lib/sc-scanner.mjs';
import { logEvent } from '../lib/telemetry.mjs';

export async function securityScanCommand(opts) {
  const rootDir = process.cwd();
  const mode = pickMode(opts);

  if (opts.json) {
    return runJsonMode(rootDir, mode, opts);
  }

  banner('dw-kit Supply-Chain Scan');

  if (mode === 'update-db' || opts.updateDb) {
    info('Fetching fresh advisory snapshot from OSV.dev...');
    try {
      const start = Date.now();
      const res = await syncSnapshotForProject(rootDir);
      const elapsed = Date.now() - start;
      ok(`Snapshot updated — ${res.advisoryCount} advisories for ${res.packageCount} packages (${elapsed}ms)`);
      logEvent({ event: 'sc_guard', action: 'sync', advisories: res.advisoryCount, packages: res.packageCount, latency_ms: elapsed }, rootDir);
    } catch (e) {
      err(`Sync failed: ${e.message}`);
      if (e.code === 'NO_LOCKFILE') warn('Run `npm install` first to create package-lock.json.');
      process.exit(2);
    }
    if (mode === 'update-db') {
      log('');
      info('Snapshot ready. Run `dw security-scan` to scan project.');
      return;
    }
    log('');
  }

  const info_ = snapshotInfo(rootDir);
  if (!info_.exists) {
    warn('No advisory snapshot found.');
    log('Run `dw security-scan --update-db` to fetch from OSV.dev.');
    log('Quick mode requires an existing snapshot.');
    process.exit(1);
  }

  const ageDays = info_.age_days;
  const ageLabel = ageDays === Infinity ? 'unknown' : `${ageDays.toFixed(1)} days old`;
  log(chalk.bold('Snapshot'));
  log(`  Source     : ${info_.source} (${info_.ecosystem})`);
  log(`  Fetched    : ${info_.fetched_at || '?'} (${ageLabel})`);
  log(`  Advisories : ${info_.advisory_count}  Packages scanned previously: ${info_.package_count}`);
  if (!info_.schema_compatible) {
    err(`  Schema mismatch — expected 1.0, got ${info_.schema_version || 'unknown'}`);
    log('  Run `dw security-scan --update-db` to refresh.');
    process.exit(2);
  }
  if (info_.stale) {
    warn(`  Snapshot is stale (>7 days). Run \`dw security-scan --update-db\` to refresh.`);
  }

  log('');
  log(chalk.bold('Scanning project lockfile...'));
  const snap = loadSnapshot(rootDir);
  const start = Date.now();
  const result = scanProject(rootDir, snap);
  const elapsed = Date.now() - start;

  if (result.error === 'no_lockfile') {
    err('No lockfile found (expected package-lock.json).');
    process.exit(1);
  }
  if (result.error === 'no_snapshot') {
    err('Snapshot data unavailable.');
    process.exit(1);
  }

  log(`  Lockfile          : ${result.lockfile}`);
  log(`  Packages scanned  : ${result.packages_scanned}`);
  log(`  Elapsed           : ${elapsed}ms`);
  log('');

  if (result.matches.length === 0) {
    ok('No advisory matches — clean.');
    logEvent({ event: 'sc_guard', action: 'scan_run', matches: 0, packages: result.packages_scanned, outcome: 'clean', latency_ms: elapsed }, rootDir);
    log('');
    advisoryFooter();
    return;
  }

  log(chalk.bold(`Matches (${result.matches.length})`));
  const sorted = result.matches.slice().sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  for (const m of sorted) {
    const tag = severityTag(m.severity);
    log(`  ${tag} ${m.package}@${m.version}`);
    if (m.summary) log(chalk.dim(`      ${m.summary}`));
    log(chalk.dim(`      advisory: ${m.advisory_id}`));
    if (m.fix_versions.length) log(chalk.dim(`      fix:      ${m.fix_versions.join(', ')}`));
  }
  log('');

  const worst = worstSeverity(result.matches);
  const blockCount = result.matches.filter((m) => severityRank(m.severity) >= severityRank('high')).length;
  const exitCode = blockCount > 0 ? 2 : 1;

  logEvent(
    {
      event: 'sc_guard',
      action: blockCount > 0 ? 'block' : 'allow',
      matches: result.matches.length,
      block_count: blockCount,
      worst_severity: worst,
      packages: result.packages_scanned,
      latency_ms: elapsed,
      snapshot_age_days: ageDays,
    },
    rootDir,
  );

  if (blockCount > 0) {
    err(`${blockCount} HIGH+ severity match(es) — review before merging lockfile changes.`);
  } else {
    warn(`${result.matches.length} low/medium match(es) — review recommended.`);
  }
  log('');
  advisoryFooter();
  process.exit(exitCode);
}

function pickMode(opts) {
  if (opts.updateDb) return 'update-db';
  return 'scan';
}

function severityTag(label) {
  switch (label) {
    case 'critical':
      return chalk.red.bold('[CRITICAL]'.padEnd(12));
    case 'high':
      return chalk.red('[HIGH]    '.padEnd(12));
    case 'medium':
      return chalk.yellow('[MEDIUM]  '.padEnd(12));
    case 'low':
      return chalk.blue('[LOW]     '.padEnd(12));
    default:
      return chalk.dim('[?]       '.padEnd(12));
  }
}

function advisoryFooter() {
  info('ADVISORY OUTPUT — NOT a decision rule.');
  log('  Threshold matrix in v14-evaluation-protocol.md is authoritative.');
  log('  Use this scan as evidence-supplement only.');
  log('  Public sunset commitment: 2026-08-12 (see ADR-0005).');
}

async function runJsonMode(rootDir, mode, opts) {
  let out = { mode, ok: true };

  if (mode === 'update-db' || opts.updateDb) {
    try {
      const start = Date.now();
      const res = await syncSnapshotForProject(rootDir);
      out.sync = { advisory_count: res.advisoryCount, package_count: res.packageCount, latency_ms: Date.now() - start };
      logEvent({ event: 'sc_guard', action: 'sync', advisories: res.advisoryCount, packages: res.packageCount }, rootDir);
    } catch (e) {
      out.ok = false;
      out.error = { code: e.code || 'SYNC_FAILED', message: e.message };
      process.stdout.write(JSON.stringify(out) + '\n');
      process.exit(2);
    }
    if (mode === 'update-db') {
      process.stdout.write(JSON.stringify(out) + '\n');
      return;
    }
  }

  const info_ = snapshotInfo(rootDir);
  out.snapshot = info_;
  if (!info_.exists) {
    out.ok = false;
    out.error = { code: 'NO_SNAPSHOT', message: 'Run `dw security-scan --update-db`' };
    process.stdout.write(JSON.stringify(out) + '\n');
    process.exit(1);
  }

  const snap = loadSnapshot(rootDir);
  const start = Date.now();
  const result = scanProject(rootDir, snap);
  out.scan = { ...result, elapsed_ms: Date.now() - start };

  if (result.error) {
    out.ok = false;
    out.error = { code: result.error.toUpperCase(), message: result.error };
    process.stdout.write(JSON.stringify(out) + '\n');
    process.exit(1);
  }

  const worst = worstSeverity(result.matches);
  const blockCount = result.matches.filter((m) => severityRank(m.severity) >= severityRank('high')).length;
  out.summary = { matches: result.matches.length, block_count: blockCount, worst_severity: worst };

  logEvent(
    {
      event: 'sc_guard',
      action: blockCount > 0 ? 'block' : (result.matches.length > 0 ? 'allow' : 'scan_run'),
      matches: result.matches.length,
      block_count: blockCount,
      worst_severity: worst,
      packages: result.packages_scanned,
      snapshot_age_days: info_.age_days,
    },
    rootDir,
  );

  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(blockCount > 0 ? 2 : result.matches.length > 0 ? 1 : 0);
}
