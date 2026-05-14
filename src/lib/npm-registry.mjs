import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const REGISTRY_BASE = 'https://registry.npmjs.org';
const FETCH_TIMEOUT_MS = 5000;
const CACHE_REL = '.dw/security/npm-registry-cache.jsonl';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour per ADR-0006

export function cachePath(rootDir = process.cwd()) {
  return join(rootDir, CACHE_REL);
}

function ensureCacheDir(rootDir) {
  const dir = dirname(cachePath(rootDir));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function loadCache(rootDir = process.cwd()) {
  const p = cachePath(rootDir);
  if (!existsSync(p)) return new Map();
  const map = new Map();
  try {
    const lines = readFileSync(p, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const e = JSON.parse(line);
        if (e && e.key) map.set(e.key, e);
      } catch {
        // skip malformed line
      }
    }
  } catch {
    // unreadable cache → ignore
  }
  return map;
}

export function cacheGet(rootDir, key, ttlMs = CACHE_TTL_MS) {
  const map = loadCache(rootDir);
  const entry = map.get(key);
  if (!entry) return null;
  if (ttlMs <= 0) return null;
  if (Date.now() - entry.cached_at > ttlMs) return null;
  return entry.value;
}

export function cachePut(rootDir, key, value) {
  ensureCacheDir(rootDir);
  const line = JSON.stringify({ key, cached_at: Date.now(), value }) + '\n';
  appendFileSync(cachePath(rootDir), line, 'utf-8');
}

export function pruneCache(rootDir, ttlMs = CACHE_TTL_MS) {
  const p = cachePath(rootDir);
  if (!existsSync(p)) return;
  const map = loadCache(rootDir);
  const now = Date.now();
  const fresh = [];
  for (const e of map.values()) {
    if (now - e.cached_at <= ttlMs) fresh.push(e);
  }
  ensureCacheDir(rootDir);
  writeFileSync(p, fresh.map((e) => JSON.stringify(e)).join('\n') + (fresh.length ? '\n' : ''), 'utf-8');
}

async function fetchJson(url, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`npm registry HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch the full registry document for a package. Cached.
 * Returns the raw npm registry response or null on hard failure.
 */
export async function fetchPackageMetadata(packageName, rootDir = process.cwd(), { useCache = true } = {}) {
  const key = `pkg:${packageName}`;
  if (useCache) {
    const cached = cacheGet(rootDir, key);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(`${REGISTRY_BASE}/${encodeURIComponent(packageName).replace('%40', '@')}`);
    cachePut(rootDir, key, data);
    return data;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/**
 * Extract the signals needed by the heuristic scorer (ADR-0006 pillar 3).
 * Pure function — call after fetchPackageMetadata returned a document.
 */
export function extractSignals(metadata, version) {
  if (!metadata) return null;
  const timeMap = metadata.time || {};
  const publishIso = timeMap[version] || null;
  const publishedAt = publishIso ? new Date(publishIso).getTime() : null;
  const ageHours = publishedAt ? (Date.now() - publishedAt) / (1000 * 60 * 60) : null;

  // Last modified time on the package as a whole — proxy for maintainer activity
  const modifiedIso = timeMap.modified || null;
  const modifiedAt = modifiedIso ? new Date(modifiedIso).getTime() : null;

  // Maintainer set
  const maintainers = Array.isArray(metadata.maintainers)
    ? metadata.maintainers.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean)
    : [];

  // Latest version on dist-tags
  const latestVersion = metadata['dist-tags']?.latest || null;

  return {
    package: metadata.name,
    version,
    publish_iso: publishIso,
    publish_age_hours: ageHours,
    latest_version: latestVersion,
    modified_iso: modifiedIso,
    package_modified_age_days: modifiedAt ? (Date.now() - modifiedAt) / (1000 * 60 * 60 * 24) : null,
    maintainer_count: maintainers.length,
    maintainers,
  };
}

/**
 * Lightweight popularity probe via downloads API. Cached separately.
 * Returns weekly downloads count or null on failure.
 */
export async function fetchWeeklyDownloads(packageName, rootDir = process.cwd(), { useCache = true } = {}) {
  const key = `dl:${packageName}`;
  if (useCache) {
    const cached = cacheGet(rootDir, key);
    if (cached) return cached;
  }
  try {
    const data = await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName).replace('%40', '@')}`);
    const count = typeof data?.downloads === 'number' ? data.downloads : null;
    cachePut(rootDir, key, count);
    return count;
  } catch {
    return null;
  }
}
