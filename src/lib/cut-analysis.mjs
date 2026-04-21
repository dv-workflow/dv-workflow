// Cut Criteria Matrix — implements ADR-0001 v1.4 decision gate.
// Consumes telemetry events, emits cut candidates with evidence.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Never-cut: skills that are the workflow's load-bearing verbs.
export const CRITICAL_SKILLS = new Set([
  'dw:flow', 'dw:task-init', 'dw:commit', 'dw:handoff',
  'dw:execute', 'dw:plan', 'dw:research', 'dw:thinking',
  'dw:review', 'dw:debug', 'dw:decision',
]);

// Per-project skills — evaluated separately (low cadence is expected).
export const PER_PROJECT_SKILLS = new Set([
  'dw:onboard', 'dw:retroactive', 'dw:config-init', 'dw:upgrade', 'dw:rollback',
]);

// Cut thresholds (ADR-0001 Cut Criteria Matrix)
export const THRESHOLDS = {
  skill: {
    minUsesPerWeekPerDev: 5,
    minDevs: 5,
    minCoverageDays: 21,
  },
  hook: {
    maxAvgLatencyMs: 500,
    maxFiresPerSession: 10,
  },
};

function coverageDays(events) {
  if (events.length === 0) return 0;
  const first = new Date(events[0].ts).getTime();
  const last = new Date(events[events.length - 1].ts).getTime();
  return Math.max(1, Math.round((last - first) / MS_PER_DAY));
}

function uniqueSessions(events) {
  return new Set(events.map((e) => e.session).filter(Boolean)).size;
}

// Group events by (event type, name)
function groupByNameAndType(events) {
  const groups = { skill: {}, hook: {} };
  for (const e of events) {
    if (e.event !== 'skill' && e.event !== 'hook') continue;
    const bucket = groups[e.event];
    if (!bucket[e.name]) bucket[e.name] = [];
    bucket[e.name].push(e);
  }
  return groups;
}

function skillStats(events, totalSessions, totalDays) {
  const count = events.length;
  const weeks = Math.max(1, totalDays / 7);
  const devs = Math.max(1, totalSessions); // session-hash as dev proxy (undercounts real devs)
  const usesPerWeekPerDev = count / weeks / devs;
  return { count, usesPerWeekPerDev, weeks, devs };
}

function hookStats(events, totalSessions) {
  const count = events.length;
  const sessions = Math.max(1, totalSessions);
  const firesPerSession = count / sessions;
  const latencies = events.map((e) => e.latency_ms).filter((n) => typeof n === 'number');
  const avgLatency =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
  return { count, firesPerSession, avgLatency };
}

function evaluateSkill(name, events, totalSessions, totalDays) {
  const s = skillStats(events, totalSessions, totalDays);
  const reasons = [];
  let critical = false;
  let perProject = false;

  if (CRITICAL_SKILLS.has(name)) {
    critical = true;
    reasons.push('critical path — protected');
  }
  if (PER_PROJECT_SKILLS.has(name)) {
    perProject = true;
    reasons.push('per-project cadence — evaluated separately');
  }

  const usesBelow = s.usesPerWeekPerDev < THRESHOLDS.skill.minUsesPerWeekPerDev;
  const devsOk = totalSessions >= THRESHOLDS.skill.minDevs;
  const coverageOk = totalDays >= THRESHOLDS.skill.minCoverageDays;

  let qualify = false;
  if (!critical && !perProject) {
    if (usesBelow && devsOk && coverageOk) {
      qualify = true;
      reasons.push(
        `uses/week/dev=${s.usesPerWeekPerDev.toFixed(2)} < ${THRESHOLDS.skill.minUsesPerWeekPerDev}`
      );
    } else {
      if (!usesBelow) reasons.push(`uses/week/dev=${s.usesPerWeekPerDev.toFixed(2)} (above threshold)`);
      if (!devsOk) reasons.push(`devs=${totalSessions} < ${THRESHOLDS.skill.minDevs}`);
      if (!coverageOk) reasons.push(`coverage=${totalDays}d < ${THRESHOLDS.skill.minCoverageDays}d`);
    }
  }

  return { name, type: 'skill', qualify, stats: s, reasons, critical, perProject };
}

function evaluateHook(name, events, totalSessions) {
  const s = hookStats(events, totalSessions);
  const reasons = [];
  let qualify = false;

  const latencyExceed =
    s.avgLatency !== null && s.avgLatency > THRESHOLDS.hook.maxAvgLatencyMs;
  const firesExceed = s.firesPerSession > THRESHOLDS.hook.maxFiresPerSession;

  if (latencyExceed) {
    qualify = true;
    reasons.push(`avg_latency=${s.avgLatency.toFixed(0)}ms > ${THRESHOLDS.hook.maxAvgLatencyMs}ms`);
  }
  if (firesExceed) {
    qualify = true;
    reasons.push(
      `fires/session=${s.firesPerSession.toFixed(1)} > ${THRESHOLDS.hook.maxFiresPerSession}`
    );
  }
  if (!latencyExceed && !firesExceed) {
    reasons.push(
      `fires/session=${s.firesPerSession.toFixed(1)}, avg_latency=${s.avgLatency !== null ? s.avgLatency.toFixed(0) + 'ms' : 'n/a'} (within limits)`
    );
  }

  return { name, type: 'hook', qualify, stats: s, reasons };
}

export function analyze(events) {
  const totalSessions = uniqueSessions(events);
  const totalDays = coverageDays(events);
  const coverageOk = totalDays >= THRESHOLDS.skill.minCoverageDays;
  const devsOk = totalSessions >= THRESHOLDS.skill.minDevs;

  const groups = groupByNameAndType(events);

  const skillResults = Object.entries(groups.skill)
    .map(([name, evts]) => evaluateSkill(name, evts, totalSessions, totalDays))
    .sort((a, b) => a.stats.usesPerWeekPerDev - b.stats.usesPerWeekPerDev);

  const hookResults = Object.entries(groups.hook)
    .map(([name, evts]) => evaluateHook(name, evts, totalSessions))
    .sort((a, b) => b.stats.firesPerSession - a.stats.firesPerSession);

  return {
    coverage: { days: totalDays, sessions: totalSessions, coverageOk, devsOk },
    skills: skillResults,
    hooks: hookResults,
    candidates: {
      skills: skillResults.filter((r) => r.qualify),
      hooks: hookResults.filter((r) => r.qualify),
    },
  };
}
