import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parsePackageLockfile, findLockfile } from './sc-scanner.mjs';

const SECURITY_DIR = '.dw/security';
const SNAPSHOT_FILE = 'advisory-snapshot.json';
const SCHEMA_VERSION = '1.0';
const OSV_BATCH_ENDPOINT = 'https://api.osv.dev/v1/querybatch';
const STALE_DAYS_DEFAULT = 7;
const FETCH_TIMEOUT_MS = 15000;

export function snapshotPath(rootDir = process.cwd()) {
  return join(rootDir, SECURITY_DIR, SNAPSHOT_FILE);
}

export function loadSnapshot(rootDir = process.cwd()) {
  const p = snapshotPath(rootDir);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function snapshotAgeDays(snapshot) {
  if (!snapshot || !snapshot.fetched_at) return Infinity;
  const fetched = new Date(snapshot.fetched_at).getTime();
  if (!fetched) return Infinity;
  return (Date.now() - fetched) / (1000 * 60 * 60 * 24);
}

export function isStale(snapshot, maxDays = STALE_DAYS_DEFAULT) {
  return snapshotAgeDays(snapshot) > maxDays;
}

export function isSchemaCompatible(snapshot) {
  if (!snapshot || !snapshot.schema_version) return false;
  return snapshot.schema_version === SCHEMA_VERSION;
}

function ensureSecurityDir(rootDir) {
  const dir = join(rootDir, SECURITY_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveSnapshot(snapshot, rootDir = process.cwd()) {
  ensureSecurityDir(rootDir);
  const target = snapshotPath(rootDir);

  const body = JSON.stringify(snapshot, null, 2) + '\n';
  const sha = createHash('sha256').update(body).digest('hex');
  snapshot.snapshot_sha = `sha256:${sha.slice(0, 16)}`;

  const finalBody = JSON.stringify(snapshot, null, 2) + '\n';
  writeFileSync(target, finalBody, 'utf-8');
  return target;
}

export async function fetchOsvBatch(queries, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OSV_BATCH_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ queries }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OSV batch HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOsvByName(packageName, ecosystem = 'npm', { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ package: { name: packageName, ecosystem } }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OSV name-query HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOsvDetail(vulnId, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.osv.dev/v1/vulns/${vulnId}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSV detail HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function syncSnapshotForProject(rootDir = process.cwd(), { ecosystem = 'npm' } = {}) {
  const lockPath = findLockfile(rootDir);
  if (!lockPath) {
    const err = new Error('No lockfile found (expected package-lock.json)');
    err.code = 'NO_LOCKFILE';
    throw err;
  }

  const packages = parsePackageLockfile(lockPath);
  const queries = [];
  const queryIndex = [];
  for (const [name, version] of packages) {
    queries.push({ package: { name, ecosystem }, version });
    queryIndex.push({ name, version });
  }

  if (queries.length === 0) {
    const empty = buildEmptySnapshot(ecosystem);
    saveSnapshot(empty, rootDir);
    return { snapshot: empty, advisoryCount: 0, packageCount: 0 };
  }

  const batchResults = await fetchOsvBatch(queries);
  const vulnIds = new Set();
  if (batchResults && Array.isArray(batchResults.results)) {
    for (const r of batchResults.results) {
      if (r && Array.isArray(r.vulns)) {
        for (const v of r.vulns) if (v.id) vulnIds.add(v.id);
      }
    }
  }

  const advisories = [];
  for (const id of vulnIds) {
    try {
      const detail = await fetchOsvDetail(id);
      if (detail) advisories.push(detail);
    } catch {
      // skip — do not fail entire sync on single detail failure
    }
  }

  const snapshot = {
    schema_version: SCHEMA_VERSION,
    fetched_at: new Date().toISOString(),
    source: 'osv.dev',
    ecosystem,
    package_count: queryIndex.length,
    advisory_count: advisories.length,
    advisories,
  };

  saveSnapshot(snapshot, rootDir);
  return { snapshot, advisoryCount: advisories.length, packageCount: queryIndex.length };
}

function buildEmptySnapshot(ecosystem) {
  return {
    schema_version: SCHEMA_VERSION,
    fetched_at: new Date().toISOString(),
    source: 'osv.dev',
    ecosystem,
    package_count: 0,
    advisory_count: 0,
    advisories: [],
  };
}

export function snapshotInfo(rootDir = process.cwd()) {
  const p = snapshotPath(rootDir);
  if (!existsSync(p)) {
    return { exists: false };
  }
  const stat = statSync(p);
  const snap = loadSnapshot(rootDir);
  return {
    exists: true,
    path: p,
    mtimeMs: stat.mtimeMs,
    fetched_at: snap?.fetched_at || null,
    source: snap?.source || null,
    ecosystem: snap?.ecosystem || null,
    schema_version: snap?.schema_version || null,
    advisory_count: snap?.advisory_count ?? (Array.isArray(snap?.advisories) ? snap.advisories.length : 0),
    package_count: snap?.package_count ?? 0,
    age_days: snap ? snapshotAgeDays(snap) : Infinity,
    stale: snap ? isStale(snap) : true,
    schema_compatible: isSchemaCompatible(snap),
  };
}
