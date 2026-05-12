import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const LOCKFILE_NAMES = ['package-lock.json', 'npm-shrinkwrap.json'];

export function findLockfile(rootDir = process.cwd()) {
  for (const name of LOCKFILE_NAMES) {
    const p = join(rootDir, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export function parsePackageLockfile(filepath) {
  const raw = readFileSync(filepath, 'utf-8');
  const data = JSON.parse(raw);

  const out = new Map();

  if (data.packages && typeof data.packages === 'object') {
    for (const [key, info] of Object.entries(data.packages)) {
      if (!key || key === '') continue;
      if (!info || !info.version) continue;

      const name = info.name || key.replace(/^node_modules\//, '').replace(/.*\/node_modules\//, '');
      if (!name) continue;
      if (!out.has(name)) out.set(name, info.version);
    }
    return out;
  }

  if (data.dependencies && typeof data.dependencies === 'object') {
    walkDeps(data.dependencies, out);
  }

  return out;
}

function walkDeps(deps, out) {
  for (const [name, info] of Object.entries(deps)) {
    if (info && info.version && !out.has(name)) {
      out.set(name, info.version);
    }
    if (info && info.dependencies) walkDeps(info.dependencies, out);
  }
}

export function compareVersions(a, b) {
  const norm = (v) => String(v).split('-')[0].split('+')[0].split('.').map((s) => parseInt(s, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export function versionInRange(version, range) {
  if (!range || !range.events || !Array.isArray(range.events)) return false;

  let affected = false;
  let lastIntroduced = null;
  let lastFixed = null;

  const events = range.events.slice().sort((e1, e2) => {
    const v1 = e1.introduced || e1.fixed || e1.last_affected || '0.0.0';
    const v2 = e2.introduced || e2.fixed || e2.last_affected || '0.0.0';
    return compareVersions(v1, v2);
  });

  for (const evt of events) {
    if (evt.introduced !== undefined) lastIntroduced = evt.introduced;
    if (evt.fixed !== undefined) lastFixed = evt.fixed;
    if (evt.last_affected !== undefined) lastFixed = evt.last_affected;
  }

  if (lastIntroduced !== null && compareVersions(version, lastIntroduced) >= 0) {
    affected = true;
  }
  if (affected && lastFixed !== null && compareVersions(version, lastFixed) >= 0) {
    if (range.type === 'SEMVER' || range.type === 'ECOSYSTEM') affected = false;
  }

  return affected;
}

export function matchAdvisory(packageName, version, advisory) {
  if (!advisory || !advisory.affected) return null;

  for (const aff of advisory.affected) {
    const affName = aff.package?.name || aff.package_name || aff.name;
    if (affName !== packageName) continue;

    if (Array.isArray(aff.versions) && aff.versions.includes(version)) {
      return buildMatch(packageName, version, advisory, aff);
    }

    if (Array.isArray(aff.ranges)) {
      for (const range of aff.ranges) {
        if (versionInRange(version, range)) {
          return buildMatch(packageName, version, advisory, aff);
        }
      }
    }
  }
  return null;
}

function buildMatch(packageName, version, advisory, aff) {
  const fixVersions = [];
  if (Array.isArray(aff.ranges)) {
    for (const range of aff.ranges) {
      if (Array.isArray(range.events)) {
        for (const evt of range.events) {
          if (evt.fixed) fixVersions.push(evt.fixed);
        }
      }
    }
  }

  const severity = pickSeverity(advisory);

  return {
    package: packageName,
    version,
    advisory_id: advisory.id,
    summary: advisory.summary || '',
    severity,
    fix_versions: fixVersions,
    references: (advisory.references || []).map((r) => r.url || r).filter(Boolean),
  };
}

function pickSeverity(advisory) {
  if (Array.isArray(advisory.severity) && advisory.severity.length > 0) {
    const cvss = advisory.severity.find((s) => s.type && s.type.startsWith('CVSS'));
    if (cvss && cvss.score) return cvssToLabel(cvss.score);
  }
  if (advisory.database_specific?.severity) return String(advisory.database_specific.severity).toLowerCase();
  return 'unknown';
}

function cvssToLabel(score) {
  if (typeof score === 'string') {
    const m = score.match(/\d+(\.\d+)?/);
    if (m) score = parseFloat(m[0]);
  }
  if (typeof score !== 'number') return 'unknown';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score > 0) return 'low';
  return 'unknown';
}

export function scanProject(rootDir, snapshot) {
  const result = {
    lockfile: null,
    packages_scanned: 0,
    matches: [],
    snapshot_meta: snapshot ? { fetched_at: snapshot.fetched_at, source: snapshot.source } : null,
  };

  const lockPath = findLockfile(rootDir);
  if (!lockPath) {
    result.error = 'no_lockfile';
    return result;
  }
  result.lockfile = lockPath;

  if (!snapshot || !Array.isArray(snapshot.advisories)) {
    result.error = 'no_snapshot';
    return result;
  }

  const packages = parsePackageLockfile(lockPath);
  result.packages_scanned = packages.size;

  for (const [name, version] of packages) {
    for (const adv of snapshot.advisories) {
      const m = matchAdvisory(name, version, adv);
      if (m) result.matches.push(m);
    }
  }

  return result;
}

export function severityRank(label) {
  return { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 }[label] || 0;
}

export function worstSeverity(matches) {
  if (!matches || matches.length === 0) return null;
  return matches.reduce((acc, m) => (severityRank(m.severity) > severityRank(acc) ? m.severity : acc), 'unknown');
}

// ── Pre-install scan helpers (package.json without lockfile) ────────────────

export function parsePackageJson(filepath) {
  const raw = readFileSync(filepath, 'utf-8');
  const data = JSON.parse(raw);
  const out = new Map();
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (data[section] && typeof data[section] === 'object') {
      for (const [name, range] of Object.entries(data[section])) {
        if (typeof range === 'string' && !out.has(name)) out.set(name, range);
      }
    }
  }
  return out;
}

export function findPackageJson(rootDir = process.cwd()) {
  const p = join(rootDir, 'package.json');
  return existsSync(p) ? p : null;
}

export function matchPackageByName(packageName, advisories) {
  const hits = [];
  for (const adv of advisories || []) {
    if (!adv.affected) continue;
    for (const aff of adv.affected) {
      const affName = aff.package?.name || aff.package_name || aff.name;
      if (affName !== packageName) continue;

      const fixVersions = [];
      if (Array.isArray(aff.ranges)) {
        for (const range of aff.ranges) {
          if (Array.isArray(range.events)) {
            for (const evt of range.events) if (evt.fixed) fixVersions.push(evt.fixed);
          }
        }
      }
      hits.push({
        advisory_id: adv.id,
        summary: adv.summary || '',
        severity: pickSeverity(adv),
        fix_versions: fixVersions,
        references: (adv.references || []).map((r) => r.url || r).filter(Boolean),
      });
      break;
    }
  }
  return hits;
}

export function matchNamespaceFixture(packages, fixture) {
  const now = new Date();
  const hits = [];
  for (const entry of fixture?.namespaces || []) {
    if (entry.active_until && new Date(entry.active_until) < now) continue;
    if (!entry.pattern) continue;

    for (const [name] of packages) {
      if (name.startsWith(entry.pattern) || name === entry.pattern) {
        hits.push({
          package: name,
          namespace_pattern: entry.pattern,
          reason: entry.reason,
          advisory_url: entry.advisory,
          active_until: entry.active_until,
          guidance: entry.guidance,
          severity: entry.severity || 'high',
        });
      }
    }
  }
  return hits;
}
