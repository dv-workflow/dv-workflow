import { readdirSync, readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TASKS_DIR = '.dw/tasks';
const ACTIVE_FILE = join(TASKS_DIR, 'ACTIVE.md');
const EXCLUDE = new Set(['archive', 'ACTIVE.md']);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split('\n');
  const fm = {};
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function readTaskStatus(taskDir) {
  const fullPath = join(TASKS_DIR, taskDir);
  if (!statSync(fullPath).isDirectory()) return null;

  const trackingV2 = join(fullPath, 'tracking.md');
  if (existsSync(trackingV2)) {
    const fm = parseFrontmatter(readFileSync(trackingV2, 'utf8'));
    return {
      name: taskDir,
      status: fm.status || 'unknown',
      lastUpdated: fm.last_updated || fm.started || '—',
      blockers: fm.blockers || 'none',
      format: 'v2',
    };
  }

  const progressV1 = join(fullPath, `${taskDir}-progress.md`);
  if (existsSync(progressV1)) {
    const content = readFileSync(progressV1, 'utf8');
    const statusMatch = content.match(/Trạng thái:\s*([^\n]+)/);
    return {
      name: taskDir,
      status: statusMatch ? statusMatch[1].trim() : 'unknown',
      lastUpdated: '—',
      blockers: 'none',
      format: 'v1',
    };
  }

  return { name: taskDir, status: 'no-tracking', lastUpdated: '—', blockers: '—', format: 'unknown' };
}

export function generateActiveIndex(rootDir = process.cwd()) {
  const tasksPath = join(rootDir, TASKS_DIR);
  if (!existsSync(tasksPath)) return '';

  const entries = readdirSync(tasksPath).filter((e) => !EXCLUDE.has(e));
  const tasks = entries.map(readTaskStatus).filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# ACTIVE Tasks',
    '',
    `Auto-generated ${today}. Run \`dw active\` to refresh.`,
    '',
    'Format: `{task-name} · {status} · {last-updated} · {blockers}`',
    '',
    '## Current',
    '',
    ...tasks.map(
      (t) => `- \`${t.name}\` · ${t.status} · ${t.lastUpdated} · ${t.blockers}`
    ),
    '',
    '## Archive',
    '',
    `Completed tasks: \`.dw/tasks/archive/\``,
    '',
  ];

  return lines.join('\n');
}

export function writeActiveIndex(rootDir = process.cwd()) {
  const content = generateActiveIndex(rootDir);
  const target = join(rootDir, ACTIVE_FILE);
  writeFileSync(target, content, 'utf8');
  return target;
}
