import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { banner, log, info, warn, ok, err } from '../lib/ui.mjs';
import chalk from 'chalk';
import {
  loadSnapshot,
  snapshotInfo,
  syncSnapshotForProject,
  isStale,
  isSchemaCompatible,
  fetchOsvByName,
} from '../lib/sc-sync.mjs';
import {
  scanProject,
  severityRank,
  worstSeverity,
  parsePackageJson,
  findPackageJson,
  matchPackageByName,
  matchNamespaceFixture,
} from '../lib/sc-scanner.mjs';
import { logEvent } from '../lib/telemetry.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const NAMESPACE_FIXTURE_REL = '.dw/security/ioc-namespaces.json';

export async function securityScanCommand(opts) {
  const rootDir = process.cwd();
  const mode = pickMode(opts);

  if (mode === 'pre-install') {
    return runPreInstallMode(rootDir, opts);
  }

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
      const partialNote = res.partial ? ` (PARTIAL — ${res.chunks.failed}/${res.chunks.total} chunks failed)` : '';
      ok(`Snapshot updated — ${res.advisoryCount} advisories for ${res.packageCount} packages (${elapsed}ms)${partialNote}`);
      if (res.partial) {
        warn(`Snapshot incomplete: chunks ${res.chunks.failed_indices.join(',')} failed after retries. Advisories may be missing; retry --update-db when network is healthy.`);
      }
      logEvent({
        event: 'sc_guard',
        action: 'sync',
        source: 'osv',
        advisories: res.advisoryCount,
        packages: res.packageCount,
        latency_ms: elapsed,
        partial: !!res.partial,
        chunks_total: res.chunks?.total ?? 1,
        chunks_failed: res.chunks?.failed ?? 0,
      }, rootDir);
    } catch (e) {
      err(`Sync failed: ${e.message}`);
      if (e.code === 'NO_LOCKFILE') warn('Run `npm install` first to create package-lock.json.');
      if (e.code === 'SYNC_ALL_CHUNKS_FAILED') warn('All OSV batches failed — likely a network or rate-limit issue. Re-run later.');
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
  if (info_.partial) {
    warn(`  Snapshot is PARTIAL (${info_.chunks?.failed}/${info_.chunks?.total} chunks failed last sync). Results may be incomplete — re-run --update-db.`);
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
    logEvent({
      event: 'sc_guard',
      action: 'scan_run',
      source: 'osv',
      matches: 0,
      packages: result.packages_scanned,
      outcome: 'clean',
      latency_ms: elapsed,
      partial_snapshot: info_.partial === true,
    }, rootDir);
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
      source: 'osv',
      matches: result.matches.length,
      block_count: blockCount,
      worst_severity: worst,
      packages: result.packages_scanned,
      latency_ms: elapsed,
      snapshot_age_days: ageDays,
      partial_snapshot: info_.partial === true,
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
  if (opts.preInstall) return 'pre-install';
  if (opts.updateDb) return 'update-db';
  return 'scan';
}

function loadNamespaceFixture(rootDir) {
  // Prefer project-local fixture, fall back to toolkit-bundled
  const candidates = [
    join(rootDir, NAMESPACE_FIXTURE_REL),
    join(TOOLKIT_ROOT, NAMESPACE_FIXTURE_REL),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        return { fixture: JSON.parse(readFileSync(p, 'utf-8')), path: p };
      } catch {
        // skip malformed
      }
    }
  }
  return { fixture: null, path: null };
}

async function runPreInstallMode(rootDir, opts) {
  const useJson = !!opts.json;
  const out = { mode: 'pre-install', ok: true, network_ok: false, packages: 0, osv_hits: [], namespace_hits: [] };

  const pkgPath = findPackageJson(rootDir);
  if (!pkgPath) {
    if (useJson) {
      out.ok = false;
      out.error = { code: 'NO_PACKAGE_JSON', message: 'No package.json in current directory' };
      process.stdout.write(JSON.stringify(out) + '\n');
      process.exit(1);
    }
    err('No package.json in current directory.');
    process.exit(1);
  }

  let packages;
  try {
    packages = parsePackageJson(pkgPath);
  } catch (e) {
    if (useJson) {
      out.ok = false;
      out.error = { code: 'PARSE_FAILED', message: e.message };
      process.stdout.write(JSON.stringify(out) + '\n');
      process.exit(1);
    }
    err(`Failed to parse package.json: ${e.message}`);
    process.exit(1);
  }

  out.packages = packages.size;

  if (!useJson) {
    banner('dw-kit Pre-Install Scan');
    log(chalk.bold('package.json'));
    log(`  Path     : ${pkgPath}`);
    log(`  Declared : ${packages.size} packages (across deps/devDeps/peerDeps/optionalDeps)`);
    log('');
  }

  // 1. Namespace fixture (offline, fast)
  const fixtureBundle = loadNamespaceFixture(rootDir);
  if (fixtureBundle.fixture) {
    const hits = matchNamespaceFixture(packages, fixtureBundle.fixture);
    out.namespace_hits = hits;
    out.fixture_path = fixtureBundle.path;
    if (!useJson) {
      log(chalk.bold('Namespace IoC fixture'));
      log(`  Source   : ${fixtureBundle.path}`);
      log(`  Entries  : ${(fixtureBundle.fixture.namespaces || []).length} active namespace pattern(s)`);
      if (hits.length === 0) {
        ok('  No matches against active namespace patterns');
      } else {
        log('');
        for (const h of hits) {
          log(`  ${severityTag(h.severity)} ${h.package} matches pattern "${h.namespace_pattern}"`);
          if (h.reason) log(chalk.dim(`      ${h.reason}`));
          if (h.guidance) log(chalk.yellow(`      guidance: ${h.guidance}`));
          if (h.advisory_url) log(chalk.dim(`      advisory: ${h.advisory_url}`));
        }
      }
      log('');
    }
  }

  // 2. OSV.dev name-only queries (network, optional)
  if (!opts.offline) {
    if (!useJson) log(chalk.bold('OSV.dev name-only query (per declared package)'));
    const osvErrors = [];
    let queried = 0;
    for (const [name] of packages) {
      try {
        const result = await fetchOsvByName(name, 'npm', { timeoutMs: 5000 });
        queried++;
        const vulns = (result && result.vulns) || [];
        if (vulns.length > 0) {
          const hits = matchPackageByName(name, vulns);
          for (const h of hits) {
            out.osv_hits.push({ package: name, declared_range: packages.get(name), ...h });
          }
        }
      } catch (e) {
        osvErrors.push({ package: name, error: e.message });
      }
    }
    out.network_ok = queried > 0;
    out.osv_queried = queried;
    out.osv_errors = osvErrors;

    if (!useJson) {
      log(`  Queried  : ${queried}/${packages.size} packages (${osvErrors.length} errors)`);
      if (out.osv_hits.length === 0) {
        ok('  No active advisories for declared packages');
      } else {
        const grouped = groupBy(out.osv_hits, 'package');
        log('');
        for (const [pkg, hits] of Object.entries(grouped)) {
          const worst = hits.reduce(
            (acc, h) => (severityRank(h.severity) > severityRank(acc) ? h.severity : acc),
            'unknown',
          );
          log(`  ${severityTag(worst)} ${pkg}@${packages.get(pkg)} — ${hits.length} active advisory(s)`);
          for (const h of hits.slice(0, 3)) {
            log(chalk.dim(`      ${h.advisory_id}: ${h.summary || '(no summary)'}`));
            if (h.fix_versions && h.fix_versions.length) {
              log(chalk.dim(`        fix: ${h.fix_versions.slice(0, 3).join(', ')}`));
            }
          }
          if (hits.length > 3) log(chalk.dim(`      ... and ${hits.length - 3} more`));
        }
      }
      log('');
    }
  } else if (!useJson) {
    log(chalk.dim('  OSV.dev query: skipped (--offline)'));
    log('');
  }

  // Summarize
  const namespaceCrit = out.namespace_hits.length;
  const osvHigh = out.osv_hits.filter((h) => severityRank(h.severity) >= severityRank('high')).length;
  const exitCode = namespaceCrit > 0 ? 2 : (osvHigh > 0 ? 2 : (out.osv_hits.length > 0 ? 1 : 0));

  // Distinguish what triggered the block — fixture catches must NOT be
  // counted as OSV catches for the 2026-08-12 sunset review (see ADR-0005).
  const blockSource = exitCode >= 2
    ? (namespaceCrit > 0 && osvHigh > 0 ? 'fixture+osv' : namespaceCrit > 0 ? 'fixture' : 'osv')
    : (out.osv_hits.length > 0 ? 'osv' : 'none');

  logEvent(
    {
      event: 'sc_guard',
      action: exitCode >= 2 ? 'block' : (exitCode === 1 ? 'allow' : 'scan_run'),
      source: 'pre-install-mixed',
      block_source: blockSource,
      sub_mode: 'pre-install',
      packages: packages.size,
      namespace_hits: namespaceCrit,
      osv_hits: out.osv_hits.length,
      osv_high: osvHigh,
      network_ok: out.network_ok,
    },
    rootDir,
  );

  if (useJson) {
    out.summary = { namespace_hits: namespaceCrit, osv_hits: out.osv_hits.length, osv_high: osvHigh, exit_code: exitCode };
    process.stdout.write(JSON.stringify(out) + '\n');
    process.exit(exitCode);
  }

  log(chalk.bold('Summary'));
  if (exitCode === 0) {
    ok(`Clean — ${packages.size} packages scanned, no matches`);
  } else if (exitCode === 1) {
    warn(`${out.osv_hits.length} low/medium advisor(y/ies) found — review recommended`);
  } else {
    err(`${namespaceCrit} namespace match(es) + ${osvHigh} HIGH+ advisory(s) — rotate credentials if already installed`);
  }
  log('');
  advisoryFooter();
  process.exit(exitCode);
}

function groupBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key];
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
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
      out.sync = {
        advisory_count: res.advisoryCount,
        package_count: res.packageCount,
        latency_ms: Date.now() - start,
        partial: !!res.partial,
        chunks: res.chunks,
      };
      logEvent({
        event: 'sc_guard',
        action: 'sync',
        source: 'osv',
        advisories: res.advisoryCount,
        packages: res.packageCount,
        partial: !!res.partial,
        chunks_total: res.chunks?.total ?? 1,
        chunks_failed: res.chunks?.failed ?? 0,
      }, rootDir);
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
      source: 'osv',
      matches: result.matches.length,
      block_count: blockCount,
      worst_severity: worst,
      packages: result.packages_scanned,
      snapshot_age_days: info_.age_days,
      partial_snapshot: info_.partial === true,
    },
    rootDir,
  );

  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(blockCount > 0 ? 2 : result.matches.length > 0 ? 1 : 0);
}
