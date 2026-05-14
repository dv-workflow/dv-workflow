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
  parsePackageLockfile,
  findLockfile,
  findPackageJson,
  matchPackageByName,
  matchNamespaceFixture,
} from '../lib/sc-scanner.mjs';
import { logEvent } from '../lib/telemetry.mjs';
import { fetchPackageMetadata, extractSignals, fetchWeeklyDownloads } from '../lib/npm-registry.mjs';
import { diffLockfilePackages, scoreSignals, loadHeuristicConfig, formatHeuristicHit } from '../lib/sc-heuristic.mjs';

const TOOLKIT_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const NAMESPACE_FIXTURE_REL = '.dw/security/ioc-namespaces.json';

export async function securityScanCommand(opts) {
  const rootDir = process.cwd();
  const mode = pickMode(opts);

  if (mode === 'pre-install') {
    return runPreInstallMode(rootDir, opts);
  }

  // Pillar 3 standalone path — hook fires with --heuristic-only for fast
  // diff-only scan on lockfile edit. No OSV/fixture noise.
  if (opts.heuristicOnly) {
    return runHeuristicOnlyMode(rootDir, opts);
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

  // UX: lazy auto-refresh — if snapshot is missing OR stale, fetch fresh
  // automatically (matches `npm audit` zero-friction UX). Skipped on --offline
  // or --quick (explicit user request to stay offline).
  let info_ = snapshotInfo(rootDir);
  const shouldAutoRefresh = !opts.offline && !opts.quick && mode !== 'update-db' && (!info_.exists || info_.stale);
  if (shouldAutoRefresh) {
    const reason = !info_.exists ? 'no snapshot yet' : `snapshot ${info_.age_days.toFixed(1)}d old (>7d)`;
    info(`Auto-syncing OSV snapshot (${reason})...`);
    try {
      const start = Date.now();
      const res = await syncSnapshotForProject(rootDir);
      const elapsed = Date.now() - start;
      const partialNote = res.partial ? ` (PARTIAL ${res.chunks.failed}/${res.chunks.total})` : '';
      ok(`Auto-sync done — ${res.advisoryCount} advisories for ${res.packageCount} packages (${elapsed}ms)${partialNote}`);
      logEvent({
        event: 'sc_guard', action: 'sync', source: 'osv',
        advisories: res.advisoryCount, packages: res.packageCount, latency_ms: elapsed,
        partial: !!res.partial, sub_mode: 'auto-refresh',
      }, rootDir);
      log('');
      info_ = snapshotInfo(rootDir);
    } catch (e) {
      // Auto-refresh failure is NOT fatal — fall back to stale snapshot if available,
      // or to pillars 2+3 only. Honest message to user.
      warn(`Auto-sync failed: ${e.message}. Proceeding with available signals.`);
      if (e.code === 'NO_LOCKFILE') {
        // Caller-level no-lockfile handler kicks in below
      }
    }
  }

  if (!info_.exists) {
    // Pillar 1 unavailable. Try to fall back to pre-install if no lockfile.
    const pkgPath = findPackageJson(rootDir);
    if (pkgPath) {
      warn('No advisory snapshot AND no lockfile — falling back to pre-install scan (pillar 2 fixture + OSV name-only).');
      log('');
      return runPreInstallMode(rootDir, opts);
    }
    err('No advisory snapshot found and no package.json in current directory.');
    log('Tip: run `dw scan --update-db` from a Node project, or use `dw scan` with --offline to skip pillar 1.');
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

  if (result.error === 'no_lockfile') {
    // UX: auto-fallback to pre-install mode if package.json exists.
    // User reported v1.3.5 blocked instead of degrading gracefully.
    const pkgPath = findPackageJson(rootDir);
    if (pkgPath) {
      log('');
      info('No lockfile yet (npm install not run) — switching to pre-install scan against package.json.');
      log('');
      return runPreInstallMode(rootDir, opts);
    }
    err('No lockfile and no package.json — this directory is not a Node project.');
    process.exit(1);
  }
  if (result.error === 'no_snapshot') {
    err('Snapshot data unavailable.');
    process.exit(1);
  }

  // Pillar 2 (ADR-0006): fixture-driven catches in default scan path.
  // Distinguishes 'source: fixture' from 'source: osv' for sunset-review integrity.
  const fixtureBundle = loadNamespaceFixture(rootDir);
  let fixtureHits = [];
  if (fixtureBundle.fixture) {
    try {
      const lockPath = findLockfile(rootDir);
      const lockPackages = lockPath ? parsePackageLockfile(lockPath) : new Map();
      fixtureHits = matchNamespaceFixture(lockPackages, fixtureBundle.fixture);
    } catch {
      // fixture failure must not break OSV scan
    }
  }
  const elapsed = Date.now() - start;

  log(`  Lockfile          : ${result.lockfile}`);
  log(`  Packages scanned  : ${result.packages_scanned}`);
  if (fixtureBundle.fixture) {
    const activeCount = (fixtureBundle.fixture.namespaces || []).filter(
      (n) => !n.active_until || new Date(n.active_until) > new Date(),
    ).length;
    log(`  Fixture           : ${activeCount} active IoC pattern(s) (${fixtureBundle.path})`);
  }
  log(`  Elapsed           : ${elapsed}ms`);
  log('');

  // OSV matches first (existing display)
  if (result.matches.length > 0) {
    log(chalk.bold(`OSV advisory matches (${result.matches.length})`));
    const sorted = result.matches.slice().sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    for (const m of sorted) {
      const tag = severityTag(m.severity);
      log(`  ${tag} ${m.package}@${m.version}`);
      if (m.summary) log(chalk.dim(`      ${m.summary}`));
      log(chalk.dim(`      advisory: ${m.advisory_id}`));
      if (m.fix_versions.length) log(chalk.dim(`      fix:      ${m.fix_versions.join(', ')}`));
    }
    log('');
  }

  // Pillar 2: fixture hits (new section, prefixed [NS-IOC])
  if (fixtureHits.length > 0) {
    log(chalk.bold.red(`⚠️  ACTIVE INCIDENT IoC matches (${fixtureHits.length}) — curated fixture`));
    const sortedHits = fixtureHits.slice().sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    for (const h of sortedHits) {
      const tag = severityTag(h.severity);
      log(`  ${tag} [NS-IOC] ${h.package}${h.version ? '@' + h.version : ''} matches "${h.namespace_pattern}"`);
      if (h.reason) log(chalk.dim(`      ${h.reason}`));
      if (h.guidance) log(chalk.yellow(`      guidance: ${h.guidance}`));
      if (h.advisory_url) log(chalk.dim(`      advisory: ${h.advisory_url}`));
      if (h.version_check && h.version_check !== 'in-range') {
        log(chalk.dim(`      version_check: ${h.version_check}`));
      }
    }
    log('');
  }

  // Pillar 3 (ADR-0006): NEW-package heuristic on diff. Auto-skip if offline
  // or --no-heuristic. Runs AFTER pillars 1+2 so blocking signals still surface
  // even if heuristic times out / network fails.
  let heuristicHits = [];
  if (!opts.offline && opts.heuristic !== false) {
    try {
      heuristicHits = await runHeuristicOnDiff(rootDir, { quiet: false });
    } catch (e) {
      warn(`Heuristic check failed: ${e.message} (non-blocking)`);
    }
  }

  // Combined severity for exit code (heuristic blocks at score ≥80)
  const osvBlockCount = result.matches.filter((m) => severityRank(m.severity) >= severityRank('high')).length;
  const fixtureBlockCount = fixtureHits.filter((h) => severityRank(h.severity) >= severityRank('high')).length;
  const heuristicBlockCount = heuristicHits.filter((h) => h.score >= 80).length;
  const blockCount = osvBlockCount + fixtureBlockCount + heuristicBlockCount;
  const exitCode = blockCount > 0 ? 2 : 1;
  const worst = worstSeverity([...result.matches, ...fixtureHits]);

  // Per-pillar telemetry — sunset metric needs to distinguish
  if (result.matches.length > 0) {
    logEvent(
      {
        event: 'sc_guard',
        action: osvBlockCount > 0 ? 'block' : 'allow',
        source: 'osv',
        matches: result.matches.length,
        block_count: osvBlockCount,
        worst_severity: worstSeverity(result.matches),
        packages: result.packages_scanned,
        latency_ms: elapsed,
        snapshot_age_days: ageDays,
        partial_snapshot: info_.partial === true,
      },
      rootDir,
    );
  }
  if (fixtureHits.length > 0) {
    logEvent(
      {
        event: 'sc_guard',
        action: fixtureBlockCount > 0 ? 'block' : 'allow',
        source: 'fixture',
        matches: fixtureHits.length,
        block_count: fixtureBlockCount,
        worst_severity: worstSeverity(fixtureHits),
        packages: result.packages_scanned,
        latency_ms: elapsed,
        fixture_path: fixtureBundle.path,
      },
      rootDir,
    );
  }

  if (heuristicHits.length > 0) {
    logEvent({
      event: 'sc_guard',
      action: heuristicBlockCount > 0 ? 'block' : 'allow',
      source: 'heuristic',
      matches: heuristicHits.length,
      block_count: heuristicBlockCount,
      packages: result.packages_scanned,
      latency_ms: elapsed,
    }, rootDir);
  }

  const totalAllMatches = result.matches.length + fixtureHits.length + heuristicHits.length;
  if (totalAllMatches === 0) {
    ok('No advisory matches — clean (all 3 pillars).');
    logEvent({
      event: 'sc_guard',
      action: 'scan_run',
      source: 'osv+fixture+heuristic',
      matches: 0,
      packages: result.packages_scanned,
      outcome: 'clean',
      latency_ms: elapsed,
      partial_snapshot: info_.partial === true,
    }, rootDir);
    log('');
    advisoryFooter();
    process.exit(0);
  }
  if (blockCount > 0) {
    err(`${blockCount} HIGH-risk signal(s) — review before merging lockfile changes. (Worst: ${worst}${heuristicBlockCount > 0 ? `, +${heuristicBlockCount} heuristic` : ''})`);
  } else {
    warn(`${totalAllMatches} signal(s) — review recommended.`);
  }
  log('');
  advisoryFooter();
  process.exit(exitCode);
}

async function runHeuristicOnDiff(rootDir, { quiet = false } = {}) {
  const config = loadHeuristicConfig(rootDir);
  const diff = diffLockfilePackages(rootDir);

  // Skip the cold-start path silently in the default scan flow — checking
  // 1000+ packages on first install would slam npm registry. Cold start is
  // only useful when explicitly invoked via --heuristic-only.
  const candidates = diff.filter((p) => p.change === 'added' || p.change === 'bumped');
  if (candidates.length === 0) {
    if (!quiet) log(chalk.dim('Heuristic (pillar 3): no NEW/bumped packages since HEAD — nothing to probe.'));
    return [];
  }

  if (!quiet) log(chalk.bold(`Heuristic (pillar 3) — probing ${candidates.length} NEW/bumped package(s)`));

  const hits = [];
  for (const pkg of candidates) {
    let metadata;
    try {
      metadata = await fetchPackageMetadata(pkg.name, rootDir);
    } catch (e) {
      if (!quiet) log(chalk.dim(`  · ${pkg.name}: metadata fetch failed (${e.message}) — skip`));
      continue;
    }
    if (!metadata) {
      if (!quiet) log(chalk.dim(`  · ${pkg.name}: not found on registry — skip`));
      continue;
    }
    const signals = extractSignals(metadata, pkg.version);
    const downloads = await fetchWeeklyDownloads(pkg.name, rootDir).catch(() => null);
    const scoring = scoreSignals(signals, downloads, config, { change: pkg.change, from: pkg.from });
    if (scoring.score >= config.risk_threshold) {
      hits.push({
        package: pkg.name,
        version: pkg.version,
        change: pkg.change,
        score: scoring.score,
        reasons: scoring.reasons,
      });
      if (!quiet) {
        const formatted = formatHeuristicHit(pkg.name, pkg.version, pkg.change, scoring);
        const color = scoring.score >= 80 ? chalk.red : chalk.yellow;
        log(color(formatted));
      }
    }
  }
  if (!quiet && hits.length === 0) {
    log(chalk.dim(`  · ${candidates.length} package(s) below risk_threshold=${config.risk_threshold} — no flags`));
  }
  return hits;
}

async function runHeuristicOnlyMode(rootDir, opts) {
  const useJson = !!opts.json;
  const hits = await runHeuristicOnDiff(rootDir, { quiet: useJson });
  const blockCount = hits.filter((h) => h.score >= 80).length;
  const exitCode = blockCount > 0 ? 2 : hits.length > 0 ? 1 : 0;
  logEvent({
    event: 'sc_guard',
    action: blockCount > 0 ? 'block' : hits.length > 0 ? 'allow' : 'scan_run',
    source: 'heuristic',
    sub_mode: 'heuristic-only',
    matches: hits.length,
    block_count: blockCount,
  }, rootDir);
  if (useJson) {
    process.stdout.write(JSON.stringify({ mode: 'heuristic-only', hits, exit_code: exitCode }) + '\n');
  }
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

  if (result.error) {
    out.ok = false;
    out.error = { code: result.error.toUpperCase(), message: result.error };
    out.scan = { ...result, elapsed_ms: Date.now() - start };
    process.stdout.write(JSON.stringify(out) + '\n');
    process.exit(1);
  }

  // Pillar 2 (ADR-0006): fixture-driven catches in JSON mode too.
  const fixtureBundle = loadNamespaceFixture(rootDir);
  let fixtureHits = [];
  if (fixtureBundle.fixture) {
    try {
      const lockPath = findLockfile(rootDir);
      const lockPackages = lockPath ? parsePackageLockfile(lockPath) : new Map();
      fixtureHits = matchNamespaceFixture(lockPackages, fixtureBundle.fixture);
    } catch {
      // ignore fixture failure in JSON mode
    }
  }
  out.scan = { ...result, fixture_hits: fixtureHits, elapsed_ms: Date.now() - start };

  const osvBlockCount = result.matches.filter((m) => severityRank(m.severity) >= severityRank('high')).length;
  const fixtureBlockCount = fixtureHits.filter((h) => severityRank(h.severity) >= severityRank('high')).length;
  const blockCount = osvBlockCount + fixtureBlockCount;
  const totalMatches = result.matches.length + fixtureHits.length;
  const worst = worstSeverity([...result.matches, ...fixtureHits]);
  out.summary = {
    matches: totalMatches,
    osv_matches: result.matches.length,
    fixture_hits: fixtureHits.length,
    block_count: blockCount,
    osv_block_count: osvBlockCount,
    fixture_block_count: fixtureBlockCount,
    worst_severity: worst,
  };

  if (result.matches.length > 0) {
    logEvent({
      event: 'sc_guard',
      action: osvBlockCount > 0 ? 'block' : 'allow',
      source: 'osv',
      matches: result.matches.length,
      block_count: osvBlockCount,
      worst_severity: worstSeverity(result.matches),
      packages: result.packages_scanned,
      snapshot_age_days: info_.age_days,
      partial_snapshot: info_.partial === true,
    }, rootDir);
  }
  if (fixtureHits.length > 0) {
    logEvent({
      event: 'sc_guard',
      action: fixtureBlockCount > 0 ? 'block' : 'allow',
      source: 'fixture',
      matches: fixtureHits.length,
      block_count: fixtureBlockCount,
      worst_severity: worstSeverity(fixtureHits),
      packages: result.packages_scanned,
      fixture_path: fixtureBundle.path,
    }, rootDir);
  }
  if (totalMatches === 0) {
    logEvent({
      event: 'sc_guard',
      action: 'scan_run',
      source: 'osv+fixture',
      matches: 0,
      packages: result.packages_scanned,
      outcome: 'clean',
      snapshot_age_days: info_.age_days,
      partial_snapshot: info_.partial === true,
    }, rootDir);
  }

  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(blockCount > 0 ? 2 : totalMatches > 0 ? 1 : 0);
}
