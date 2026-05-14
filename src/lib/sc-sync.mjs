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

// OSV.dev /v1/querybatch hard cap is 1000 entries per request.
// Concurrency=2 + jittered backoff keeps us polite to a public free-tier API.
const OSV_BATCH_LIMIT = 1000;
const OSV_BATCH_CONCURRENCY = 2;
const OSV_BATCH_RETRY_MAX = 3;
const OSV_BATCH_RETRY_BASE_MS = 500;

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
    if (!res.ok) {
      const err = new Error(`OSV batch HTTP ${res.status}`);
      err.status = res.status;
      err.retryable = res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOsvBatchWithRetry(queries, chunkIndex, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < OSV_BATCH_RETRY_MAX; attempt++) {
    try {
      return await fetchOsvBatch(queries, { timeoutMs });
    } catch (e) {
      lastErr = e;
      if (!e.retryable || attempt === OSV_BATCH_RETRY_MAX - 1) break;
      const jitter = Math.floor(Math.random() * 200);
      const delay = OSV_BATCH_RETRY_BASE_MS * Math.pow(2, attempt) + jitter;
      await sleep(delay);
    }
  }
  // Wrap with chunk diagnostics for the synthesis layer
  const wrapped = new Error(`OSV batch chunk ${chunkIndex} failed: ${lastErr.message}`);
  wrapped.cause = lastErr;
  wrapped.chunkIndex = chunkIndex;
  wrapped.retryable = lastErr.retryable;
  throw wrapped;
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
    return { snapshot: empty, advisoryCount: 0, packageCount: 0, partial: false, chunks: { total: 0, succeeded: 0, failed: 0 } };
  }

  const chunks = chunkArray(queries, OSV_BATCH_LIMIT);
  const chunkOutcomes = [];
  // Process with bounded concurrency. allSettled so a single chunk failure
  // does not discard sibling successes — critical for fail-soft behavior.
  for (let i = 0; i < chunks.length; i += OSV_BATCH_CONCURRENCY) {
    const slice = chunks.slice(i, i + OSV_BATCH_CONCURRENCY);
    const settled = await Promise.allSettled(
      slice.map((chunk, j) => fetchOsvBatchWithRetry(chunk, i + j))
    );
    for (let j = 0; j < settled.length; j++) {
      chunkOutcomes.push({ index: i + j, ...settled[j] });
    }
  }

  const vulnIds = new Set();
  const failedChunks = [];
  for (const outcome of chunkOutcomes) {
    if (outcome.status === 'fulfilled') {
      const batchResults = outcome.value;
      if (batchResults && Array.isArray(batchResults.results)) {
        for (const r of batchResults.results) {
          if (r && Array.isArray(r.vulns)) {
            for (const v of r.vulns) if (v.id) vulnIds.add(v.id);
          }
        }
      }
    } else {
      failedChunks.push({ index: outcome.index, message: outcome.reason?.message || String(outcome.reason) });
    }
  }

  // Hard fail only when ALL chunks failed — otherwise emit partial snapshot.
  if (failedChunks.length === chunkOutcomes.length) {
    const err = new Error(`All ${chunkOutcomes.length} OSV batch chunk(s) failed; first: ${failedChunks[0].message}`);
    err.code = 'SYNC_ALL_CHUNKS_FAILED';
    err.failedChunks = failedChunks;
    throw err;
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

  const partial = failedChunks.length > 0;
  const snapshot = {
    schema_version: SCHEMA_VERSION,
    fetched_at: new Date().toISOString(),
    source: 'osv.dev',
    ecosystem,
    package_count: queryIndex.length,
    advisory_count: advisories.length,
    advisories,
    partial,
    chunks: {
      total: chunkOutcomes.length,
      succeeded: chunkOutcomes.length - failedChunks.length,
      failed: failedChunks.length,
      failed_indices: failedChunks.map((c) => c.index),
    },
  };

  saveSnapshot(snapshot, rootDir);
  return {
    snapshot,
    advisoryCount: advisories.length,
    packageCount: queryIndex.length,
    partial,
    chunks: snapshot.chunks,
  };
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
    partial: false,
    chunks: { total: 0, succeeded: 0, failed: 0, failed_indices: [] },
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
    partial: snap?.partial === true,
    chunks: snap?.chunks || null,
  };
}
