import { execSync } from 'node:child_process';

const TEMPLATE_SUGGESTIONS = [
  'fix: ',
  'fix authentication redirect after login',
  'fix null pointer / undefined error in ',
  'fix performance issue in ',
  'feat: add ',
  'feat: implement ',
  'feat: support ',
  'refactor: simplify ',
  'refactor: extract ',
  'refactor: rename ',
  'perf: optimize ',
  'perf: reduce load time of ',
  'chore: update dependencies',
  'docs: update README',
  'test: add tests for ',
];

// Common verbs to detect whether a description has intent
const INTENT_VERBS = [
  'fix', 'add', 'update', 'remove', 'delete', 'create', 'implement', 'refactor',
  'rename', 'move', 'improve', 'optimize', 'support', 'extract', 'migrate',
  'replace', 'upgrade', 'enable', 'disable', 'integrate', 'patch',
];

function getTemplateSuggestions() {
  return [...TEMPLATE_SUGGESTIONS];
}

export function getGitSuggestions(cwd) {
  try {
    const out = execSync('git log --oneline -50 --no-merges', {
      cwd,
      encoding: 'utf-8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => line.replace(/^[a-f0-9]+ /, '').trim())  // strip hash
      .filter((msg) => msg.length > 5)
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function getSuggestions(cwd = process.cwd()) {
  const git = getGitSuggestions(cwd);
  const templates = getTemplateSuggestions();
  // git log first (most relevant to this repo), then templates
  const merged = [...git, ...templates];
  // dedupe
  return [...new Set(merged)].slice(0, 20);
}

/**
 * Returns true if the description is likely too vague to give Claude good context.
 */
export function isVague(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < 50) return true;
  const lower = trimmed.toLowerCase();
  const hasVerb = INTENT_VERBS.some((v) => lower.startsWith(v) || lower.includes(` ${v} `));
  return !hasVerb;
}

/**
 * Expand a short description into a structured prompt.
 * @param {string} text - core task description
 * @param {{ area?: string, outcome?: string }} extras
 * @returns {string}
 */
export function expandTemplate(text, { area = '', outcome = '' } = {}) {
  const base = text.trim();
  const parts = [base];
  if (area) parts.push(`Scope: ${area.trim()}.`);
  if (outcome) parts.push(`Expected: ${outcome.trim()}.`);
  return parts.join('\n');
}
