import { existsSync, readFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, resolveFont } from '../src/index.mjs';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const FIXTURE_DIR = join(__dirname, 'fixtures');
const OUT_DIR = join(__dirname, '.tmp');

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

let passed = 0;
let failed = 0;
const TESTS = [];

function test(name, fn) {
  TESTS.push({ name, fn });
}

async function run() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      console.log(`  ✓  ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ✗  ${name}`);
      console.log(`     ${e.message}`);
      failed++;
    }
  }
  console.log();
  console.log(`  ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

console.log('▶ dw-kit-render integration tests');

test('resolveFont auto-detects a system font', async () => {
  const { buffer, path } = resolveFont();
  assert(Buffer.isBuffer(buffer) && buffer.length > 0, 'font buffer non-empty');
  assert(typeof path === 'string' && existsSync(path), `auto-detected path exists: ${path}`);
});

test('render produces SVG for a minimal manifest', async () => {
  const manifest = JSON.parse(readFileSync(join(FIXTURE_DIR, 'minimal.json'), 'utf-8'));
  const out = join(OUT_DIR, 'minimal');
  const { svgPaths, pngPaths } = await render({ manifest, outDir: out, formats: ['svg'] });
  assert(svgPaths.length === 1, `expected 1 svg, got ${svgPaths.length}`);
  const svg = readFileSync(svgPaths[0], 'utf-8');
  assert(svg.startsWith('<svg'), 'svg starts with <svg');
  assert(svg.includes('width="1200"'), 'card width 1200');
  // satori encodes text to vector paths; severity color is the reliable signal.
  assert(svg.includes('#dc2626'), 'critical bar bg color present (#dc2626)');
  assert(svg.includes('#0d1117'), 'card bg color present (#0d1117)');
  assert(pngPaths.length === 0, 'no png when format excluded');
});

test('render produces both SVG and PNG by default', async () => {
  const manifest = JSON.parse(readFileSync(join(FIXTURE_DIR, 'minimal.json'), 'utf-8'));
  const out = join(OUT_DIR, 'both');
  const { svgPaths, pngPaths } = await render({ manifest, outDir: out });
  assert(svgPaths.length === 1, 'svg written');
  assert(pngPaths.length === 1, 'png written');
  const pngStat = statSync(pngPaths[0]);
  assert(pngStat.size > 1000, `png size sane: ${pngStat.size} bytes`);
});

test('render handles the 5-finding TORIT-5-style fixture', async () => {
  const manifest = JSON.parse(readFileSync(join(FIXTURE_DIR, 'torit-5.json'), 'utf-8'));
  const out = join(OUT_DIR, 'torit-5');
  const { svgPaths, pngPaths } = await render({ manifest, outDir: out, formats: ['svg', 'png'] });
  assert(svgPaths.length === 5, `expected 5 svg, got ${svgPaths.length}`);
  assert(pngPaths.length === 5, `expected 5 png, got ${pngPaths.length}`);
  // Verify ID-based filenames.
  for (const f of manifest.findings) {
    assert(svgPaths.some((p) => p.endsWith(`finding-${f.id}.svg`)), `svg for ${f.id}`);
    assert(pngPaths.some((p) => p.endsWith(`finding-${f.id}.png`)), `png for ${f.id}`);
  }
});

test('Vietnamese diacritics render without crash + sized SVG', async () => {
  // satori converts text to vector paths so literal diacritic chars do not appear
  // in the SVG output. Test instead verifies the rendering pipeline survives
  // diacritic input (no throw, sane SVG dimensions, non-trivial path data).
  const manifest = JSON.parse(readFileSync(join(FIXTURE_DIR, 'vietnamese.json'), 'utf-8'));
  const out = join(OUT_DIR, 'vietnamese');
  const { svgPaths, pngPaths } = await render({ manifest, outDir: out });
  const svg = readFileSync(svgPaths[0], 'utf-8');
  assert(svg.startsWith('<svg') && svg.includes('</svg>'), 'well-formed SVG');
  assert(svg.includes('width="1200"'), 'card width preserved');
  // Many path elements = text rendered (diacritics included).
  const pathCount = (svg.match(/<path/g) || []).length;
  assert(pathCount > 30, `expected >30 paths (each glyph ≈ 1 path), got ${pathCount}`);
  // PNG size sanity.
  assert(statSync(pngPaths[0]).size > 5000, 'PNG > 5KB');
});

test('render with no findings returns empty arrays', async () => {
  const out = join(OUT_DIR, 'empty');
  const r = await render({
    manifest: { schema_version: 1, scope: 'x', generated_at: '2026-05-15T10:00:00Z', findings: [] },
    outDir: out,
  });
  assert(r.svgPaths.length === 0 && r.pngPaths.length === 0, 'empty arrays');
});

await run();
