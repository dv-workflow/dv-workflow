import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePackageLockfile, findLockfile, compareVersions } from './sc-scanner.mjs';

const DEFAULT_THRESHOLD = 50;
const DEFAULT_WEEKLY_DOWNLOADS_MIN = 10000;
const DEFAULT_RECENT_PUBLISH_HOURS = 72;

// Top-500 popular npm packages (small bundled list for typo-squat detection).
// Source: npm download counts, December 2025 snapshot. Pruned to common surface.
// Not exhaustive — typo-squat is one signal of many.
const POPULAR_PACKAGES = new Set([
  'react', 'react-dom', 'vue', 'angular', 'svelte', 'next', 'nuxt',
  'lodash', 'axios', 'express', 'fastify', 'koa', 'hapi',
  'typescript', 'eslint', 'prettier', 'webpack', 'vite', 'rollup', 'esbuild',
  'jest', 'mocha', 'vitest', 'playwright', 'cypress', 'puppeteer',
  'chalk', 'commander', 'yargs', 'inquirer', 'enquirer',
  'tailwindcss', 'postcss', 'sass', 'less',
  'tanstack', '@tanstack/react-query', '@tanstack/react-router', '@tanstack/react-table',
  'redux', '@reduxjs/toolkit', 'zustand', 'jotai', 'recoil',
  'graphql', 'apollo-client', '@apollo/client', 'urql',
  'rxjs', 'immer', 'lodash-es', 'date-fns', 'moment', 'dayjs', 'luxon',
  'cors', 'helmet', 'jsonwebtoken', 'bcrypt', 'argon2',
  'mongoose', 'prisma', '@prisma/client', 'sequelize', 'typeorm', 'knex',
  'pg', 'mysql', 'mysql2', 'sqlite3', 'better-sqlite3',
  'redis', 'ioredis',
  'dotenv', 'uuid', 'nanoid', 'pino', 'winston', 'debug',
  'zod', 'yup', 'joi', 'ajv',
  'sharp', 'jimp', 'multer',
  'socket.io', 'ws', 'engine.io',
  'pm2', 'nodemon', 'concurrently', 'cross-env',
  'firebase', 'firebase-admin', '@supabase/supabase-js',
  'stripe', '@stripe/stripe-js',
]);

export function loadHeuristicConfig(rootDir = process.cwd()) {
  // Read .dw/config/dw.config.yml security.heuristic.* if present.
  // Cheap inline YAML probe — no js-yaml dep here. Caller may pass overrides.
  try {
    const cfgPath = join(rootDir, '.dw/config/dw.config.yml');
    if (!existsSync(cfgPath)) return defaultConfig();
    const raw = readFileSync(cfgPath, 'utf-8');
    const threshold = matchYamlNumber(raw, 'risk_threshold');
    const weekly = matchYamlNumber(raw, 'weekly_downloads_min');
    const recent = matchYamlNumber(raw, 'recent_publish_hours');
    return {
      risk_threshold: threshold ?? DEFAULT_THRESHOLD,
      weekly_downloads_min: weekly ?? DEFAULT_WEEKLY_DOWNLOADS_MIN,
      recent_publish_hours: recent ?? DEFAULT_RECENT_PUBLISH_HOURS,
    };
  } catch {
    return defaultConfig();
  }
}

function defaultConfig() {
  return {
    risk_threshold: DEFAULT_THRESHOLD,
    weekly_downloads_min: DEFAULT_WEEKLY_DOWNLOADS_MIN,
    recent_publish_hours: DEFAULT_RECENT_PUBLISH_HOURS,
  };
}

function matchYamlNumber(yamlText, key) {
  // Scoped inside security.heuristic.*
  // Avoid full YAML parser dep; brittle but enough for top-level integer keys.
  const re = new RegExp(`heuristic:[\\s\\S]*?\\b${key}\\s*:\\s*(\\d+)`, 'm');
  const m = yamlText.match(re);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * List packages introduced or version-bumped since the last committed lockfile.
 *
 * Strategy:
 *   1. If git available and HEAD has a previous lockfile → diff against HEAD
 *   2. Otherwise → return ALL packages in current lockfile (cold-start path,
 *      caller can cap how many to actually probe)
 *
 * Returns Array<{ name, version, change: 'added' | 'bumped', from?: string }>.
 */
export function diffLockfilePackages(rootDir = process.cwd()) {
  const lockPath = findLockfile(rootDir);
  if (!lockPath) return [];
  const currentPkgs = parsePackageLockfile(lockPath);

  let previousPkgs = null;
  try {
    // Best-effort: read previous lockfile content from git HEAD
    const lockRelPath = lockPath.startsWith(rootDir + '\\') || lockPath.startsWith(rootDir + '/')
      ? lockPath.slice(rootDir.length + 1).replace(/\\/g, '/')
      : 'package-lock.json';
    const previousContent = execSync(`git show HEAD:${lockRelPath}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    previousPkgs = parsePackageLockfileContent(previousContent);
  } catch {
    // No git, or HEAD has no lockfile → cold start
    previousPkgs = null;
  }

  const out = [];
  if (!previousPkgs) {
    // Cold start: caller decides how to handle a full lockfile
    for (const [name, version] of currentPkgs) {
      out.push({ name, version, change: 'cold-start' });
    }
    return out;
  }

  for (const [name, version] of currentPkgs) {
    if (!previousPkgs.has(name)) {
      out.push({ name, version, change: 'added' });
    } else {
      const prev = previousPkgs.get(name);
      if (prev !== version) {
        out.push({ name, version, change: 'bumped', from: prev });
      }
    }
  }
  return out;
}

function parsePackageLockfileContent(content) {
  const lock = JSON.parse(content);
  const packages = new Map();
  if (lock.packages) {
    for (const [k, v] of Object.entries(lock.packages)) {
      if (!k || !v?.version) continue;
      const name = k.startsWith('node_modules/') ? k.slice('node_modules/'.length) : k.split('node_modules/').pop();
      if (!name || name === '') continue;
      packages.set(name, v.version);
    }
  } else if (lock.dependencies) {
    function walk(deps) {
      for (const [n, v] of Object.entries(deps)) {
        if (v?.version) packages.set(n, v.version);
        if (v?.dependencies) walk(v.dependencies);
      }
    }
    walk(lock.dependencies);
  }
  return packages;
}

/**
 * Score one package's signals into a risk number + reason breakdown.
 *
 * Returns { score, reasons: [{signal, weight, detail}], blocking: bool }
 *
 * Signals (per ADR-0006):
 *   - very_recent_publish (<24h)        +50
 *   - recent_publish (<72h)             +30
 *   - popular_package (downloads≥10k)   +20
 *   - maintainer_change_recent (<30d)   +40
 *   - major_version_jump                +15
 *   - typo_squat (Lev=1 of popular)     +60
 */
export function scoreSignals(signals, weeklyDownloads, config = defaultConfig(), context = {}) {
  if (!signals) return { score: 0, reasons: [] };
  const reasons = [];
  let score = 0;

  const age = signals.publish_age_hours;
  if (age !== null && age !== undefined) {
    if (age < 24) {
      score += 50;
      reasons.push({ signal: 'very_recent_publish', weight: 50, detail: `${age.toFixed(1)}h since publish` });
    } else if (age < config.recent_publish_hours) {
      score += 30;
      reasons.push({ signal: 'recent_publish', weight: 30, detail: `${age.toFixed(1)}h since publish (threshold ${config.recent_publish_hours}h)` });
    }
  }

  if (typeof weeklyDownloads === 'number' && weeklyDownloads >= config.weekly_downloads_min) {
    score += 20;
    reasons.push({ signal: 'popular_package', weight: 20, detail: `${weeklyDownloads.toLocaleString()} weekly downloads` });
  }

  // Maintainer-change proxy: package-level "modified" time within 30d
  if (signals.package_modified_age_days !== null && signals.package_modified_age_days !== undefined) {
    if (signals.package_modified_age_days < 30) {
      score += 40;
      reasons.push({
        signal: 'maintainer_change_recent',
        weight: 40,
        detail: `package modified ${signals.package_modified_age_days.toFixed(1)}d ago — possible maintainer/token change`,
      });
    }
  }

  // Major-version-jump (caller passes context.from from diff)
  if (context.change === 'bumped' && context.from && signals.version) {
    try {
      const fromMajor = parseInt(context.from.match(/\d+/)?.[0] || '0', 10);
      const toMajor = parseInt(signals.version.match(/\d+/)?.[0] || '0', 10);
      if (toMajor - fromMajor >= 1) {
        score += 15;
        reasons.push({
          signal: 'major_version_jump',
          weight: 15,
          detail: `bumped from ${context.from} to ${signals.version}`,
        });
      }
    } catch {
      // skip
    }
  }

  // Typo-squat detection (offline, bundled popular list)
  const ts = detectTypoSquat(signals.package);
  if (ts) {
    score += 60;
    reasons.push({ signal: 'typo_squat', weight: 60, detail: `name within Lev=1 of popular "${ts}"` });
  }

  return { score, reasons };
}

function detectTypoSquat(name) {
  if (!name) return null;
  if (POPULAR_PACKAGES.has(name)) return null;
  // Strip scope for comparison; typo-squats often target unscoped popular names
  const bare = name.includes('/') ? name.split('/').pop() : name;
  for (const pop of POPULAR_PACKAGES) {
    const popBare = pop.includes('/') ? pop.split('/').pop() : pop;
    if (Math.abs(bare.length - popBare.length) > 2) continue;
    if (levenshtein(bare, popBare) === 1) return pop;
  }
  return null;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function formatHeuristicHit(pkg, version, change, scoring) {
  const lines = [];
  const tag = scoring.score >= 80 ? '[HIGH-RISK]' : scoring.score >= 50 ? '[REVIEW]' : '[INFO]';
  const changeLabel = change === 'bumped' ? `bumped to ${version}` : change === 'added' ? `added@${version}` : `${version}`;
  lines.push(`${tag} ${pkg} ${changeLabel} — risk_score: ${scoring.score}`);
  for (const r of scoring.reasons) {
    lines.push(`  · ${r.signal} (+${r.weight}): ${r.detail}`);
  }
  return lines.join('\n');
}
