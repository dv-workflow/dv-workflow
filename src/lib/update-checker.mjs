import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REGISTRY_URL = 'https://registry.npmjs.org/dw-kit/latest';
const CACHE_DIR = join(homedir(), '.dw-kit');
const CACHE_FILE = join(CACHE_DIR, 'update-cache.json');

function parseSemver(v) {
  const parts = String(v).replace(/^v/, '').split('.').map(Number);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function isNewer(latest, current) {
  const l = parseSemver(latest);
  const c = parseSemver(current);
  if (l.major !== c.major) return l.major > c.major;
  if (l.minor !== c.minor) return l.minor > c.minor;
  return l.patch > c.patch;
}

function readCache() {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch {
    // ignore write errors (permission, disk full, etc.)
  }
}

async function fetchLatestVersion() {
  const res = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.version;
}

/**
 * Returns latest version string if an update is available (from cache), null otherwise.
 * Never throws, never makes network calls.
 */
export function getUpdateNotice(currentVersion) {
  if (process.env.DW_NO_UPDATE_CHECK) return null;
  const cache = readCache();
  if (!cache?.latest) return null;
  return isNewer(cache.latest, currentVersion) ? cache.latest : null;
}

/**
 * Fires off an async check against npm registry and updates the cache.
 * Non-blocking — caller should NOT await this.
 * Skips the check if cache is still fresh (< 24h).
 */
export function scheduleUpdateCheck(currentVersion) {
  if (process.env.DW_NO_UPDATE_CHECK) return;

  const cache = readCache();
  const now = Date.now();
  if (cache?.checkedAt && now - cache.checkedAt < CACHE_TTL_MS) return;

  fetchLatestVersion()
    .then((latest) => writeCache({ latest, checkedAt: now, current: currentVersion }))
    .catch(() => {});
}
