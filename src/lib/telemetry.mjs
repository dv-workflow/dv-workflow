import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const METRICS_DIR = '.dw/metrics';
const EVENTS_FILE = 'events.jsonl';

function isDisabled() {
  return process.env.DW_NO_TELEMETRY === '1' || process.env.DW_NO_TELEMETRY === 'true';
}

function sessionHash() {
  const pid = process.pid;
  const start = process.env.DW_SESSION_START || Date.now();
  return createHash('sha256').update(`${pid}:${start}`).digest('hex').slice(0, 8);
}

function ensureMetricsDir(rootDir) {
  const dir = join(rootDir, METRICS_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, EVENTS_FILE);
}

export function logEvent(event, rootDir = process.cwd()) {
  if (isDisabled()) return false;

  try {
    const enriched = {
      ts: new Date().toISOString(),
      session: sessionHash(),
      ...event,
    };
    const target = ensureMetricsDir(rootDir);
    appendFileSync(target, JSON.stringify(enriched) + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function readEvents(rootDir = process.cwd(), { since, filterName, eventType } = {}) {
  const target = join(rootDir, METRICS_DIR, EVENTS_FILE);
  if (!existsSync(target)) return [];

  const lines = readFileSync(target, 'utf8').split('\n').filter(Boolean);
  const events = [];
  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      if (since && evt.ts < since) continue;
      if (filterName && evt.name !== filterName) continue;
      if (eventType && evt.event !== eventType) continue;
      events.push(evt);
    } catch {
      // skip malformed
    }
  }
  return events;
}

export function summarize(events) {
  const bySkill = {};
  const byHook = {};
  const byTask = {};
  const bySupplyChain = { scan_run: 0, block: 0, allow: 0, sync: 0 };
  // ADR-0005 sunset review: separate OSV catches from fixture catches.
  // A catch from a curated namespace fixture is NOT evidence the OSV-based
  // guard worked; conflating them would compromise the 2026-08-12 retire/keep decision.
  const supplyChainBySource = { osv: 0, fixture: 0, mixed: 0, unknown: 0 };
  const supplyChainPartial = { partial_syncs: 0, partial_scans: 0 };

  for (const e of events) {
    if (e.event === 'skill') bySkill[e.name] = (bySkill[e.name] || 0) + 1;
    else if (e.event === 'hook') byHook[e.name] = (byHook[e.name] || 0) + 1;
    else if (e.event === 'task') byTask[e.action || 'unknown'] = (byTask[e.action || 'unknown'] || 0) + 1;
    else if (e.event === 'sc_guard') {
      const action = e.action || e.name || 'scan_run';
      if (bySupplyChain[action] === undefined) bySupplyChain[action] = 0;
      bySupplyChain[action]++;

      // Track block/allow source for sunset-review integrity.
      // Pre-install mode reports block_source explicitly (fixture vs osv vs mixed).
      // Scan/JSON/update-db modes report source=osv directly.
      if (action === 'block' || action === 'allow') {
        const src = e.block_source || e.source || 'unknown';
        const key = src === 'pre-install-mixed' ? 'mixed' : src.startsWith('fixture+') ? 'mixed' : src;
        if (supplyChainBySource[key] === undefined) supplyChainBySource[key] = 0;
        supplyChainBySource[key]++;
      }

      if (action === 'sync' && e.partial === true) supplyChainPartial.partial_syncs++;
      if (action === 'scan_run' && e.partial_snapshot === true) supplyChainPartial.partial_scans++;
    }
  }

  return {
    totalEvents: events.length,
    bySkill,
    byHook,
    byTask,
    bySupplyChain,
    supplyChainBySource,
    supplyChainPartial,
    dateRange:
      events.length > 0 ? { from: events[0].ts, to: events[events.length - 1].ts } : null,
  };
}
