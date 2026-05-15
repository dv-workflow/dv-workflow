import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import chalk from 'chalk';
import { header, ok, info, log, warn, err } from '../lib/ui.mjs';
import { loadConfigWithLocal, getReviewRendererConfig } from '../lib/config.mjs';
import { readManifest } from '../lib/review/manifest-validator.mjs';
import { logEvent } from '../lib/telemetry.mjs';

const RENDER_PACKAGE = 'dw-kit-render';
const INSTALL_HINT = `  Install renderer with: ${chalk.cyan('npm install -g dw-kit-render')}\n  Or run: ${chalk.cyan('dw doctor')} for environment check.`;

/**
 * `dw review render <manifest>` — invoked by /dw:review --visual after writing manifest.
 * See ADR-0007 for architecture.
 *
 * @param {string} manifestPath - path to manifest.json (relative or absolute)
 * @param {{format?: string, strategy?: string, quiet?: boolean}} opts
 */
export async function reviewRenderCommand(manifestPath, opts = {}) {
  const projectDir = process.cwd();
  const absManifest = isAbsolute(manifestPath) ? manifestPath : resolve(projectDir, manifestPath);
  const startedAt = performance.now();

  if (!opts.quiet) header('dw review render');

  // 1. Load + validate manifest.
  const parseResult = readManifest(absManifest);
  if (!parseResult.ok) {
    err(`Manifest invalid: ${absManifest}`);
    for (const e of parseResult.errors.slice(0, 10)) {
      log(`  ${chalk.dim(e.path || '/')} — ${e.message}`);
    }
    logEvent({ event: 'review_render', action: 'fail', fallback_reason: 'invalid-manifest' }, projectDir);
    process.exit(1);
  }
  const manifest = parseResult.manifest;

  // 2. Resolve config + strategy.
  const config = loadConfigWithLocal(join(projectDir, '.dw', 'config')) || {};
  const rendererCfg = getReviewRendererConfig(config);
  const strategy = opts.strategy || rendererCfg.strategy;
  const formats = parseFormats(opts.format) || rendererCfg.formats;

  // 3. Resolve output directory.
  const outDir = resolveOutputDir(rendererCfg.output_dir, manifest, projectDir);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  if (!opts.quiet) {
    info('Render context');
    log(`  Manifest    : ${absManifest}`);
    log(`  Scope       : ${manifest.scope} (slug: ${manifest.scope_slug || '—'})`);
    log(`  Findings    : ${manifest.findings.length}`);
    log(`  Strategy    : ${strategy}`);
    log(`  Formats     : ${formats.join(', ')}`);
    log(`  Output dir  : ${outDir}`);
  }

  // 4. Resolve renderer (dw-kit-render package).
  const rendererResolved = strategy === 'markdown-only' ? null : await tryResolveRenderer(projectDir);
  const finalStrategy = strategy === 'markdown-only'
    ? 'markdown-only'
    : (rendererResolved ? 'plugin' : (strategy === 'plugin' ? 'plugin-missing' : 'fallback-markdown'));

  // Plugin strategy was requested but package is missing — fail loudly.
  if (strategy === 'plugin' && !rendererResolved) {
    err(`Strategy 'plugin' requested but '${RENDER_PACKAGE}' is not installed.`);
    log(INSTALL_HINT);
    logEvent({ event: 'review_render', action: 'fail', fallback_reason: 'no-renderer', strategy, formats }, projectDir);
    process.exit(1);
  }

  let artifacts = { svg: [], png: [] };
  let renderErrors = [];

  if (rendererResolved) {
    try {
      if (!opts.quiet) info('Rendering with dw-kit-render');
      const result = await rendererResolved.render({
        manifest,
        outDir,
        formats,
        theme: rendererCfg.theme,
        font: rendererCfg.font,
      });
      artifacts = {
        svg: Array.isArray(result?.svgPaths) ? result.svgPaths : [],
        png: Array.isArray(result?.pngPaths) ? result.pngPaths : [],
      };
    } catch (e) {
      renderErrors.push(e.message || String(e));
      warn(`Renderer error: ${e.message || e}`);
      warn('Falling back to markdown-only summary.');
    }
  } else if (strategy !== 'markdown-only') {
    if (!opts.quiet) {
      warn(`'${RENDER_PACKAGE}' not found — emitting markdown summary only.`);
      log(INSTALL_HINT);
    }
  }

  // 5. Write summary.md (always — works without renderer too).
  const summaryPath = join(outDir, 'summary.md');
  writeFileSync(summaryPath, buildSummaryMarkdown(manifest, artifacts, { outDir, projectDir }), 'utf-8');

  const durationMs = Math.round(performance.now() - startedAt);

  if (!opts.quiet) {
    console.log();
    info('Artifacts');
    log(`  Summary     : ${summaryPath}`);
    if (artifacts.svg.length) log(`  SVG         : ${artifacts.svg.length} file(s)`);
    if (artifacts.png.length) log(`  PNG         : ${artifacts.png.length} file(s)`);
    if (!artifacts.svg.length && !artifacts.png.length) log(`  ${chalk.dim('(markdown only — install dw-kit-render for images)')}`);
    console.log();
    if (renderErrors.length) {
      warn(`${renderErrors.length} render error(s) — see above`);
    } else {
      ok(`Done in ${durationMs}ms`);
    }
  }

  logEvent({
    event: 'review_render',
    action: renderErrors.length ? 'partial' : 'success',
    strategy: finalStrategy,
    formats,
    findings: manifest.findings.length,
    duration_ms: durationMs,
    fallback_reason: rendererResolved ? null : (strategy === 'markdown-only' ? 'config-markdown-only' : 'no-renderer'),
  }, projectDir);

  process.exit(0);
}

function parseFormats(value) {
  if (!value) return null;
  if (value === 'both') return ['svg', 'png'];
  if (value === 'svg' || value === 'png') return [value];
  return null;
}

function resolveOutputDir(configDir, manifest, projectDir) {
  const baseDir = isAbsolute(configDir) ? configDir : join(projectDir, configDir);
  const slug = manifest.scope_slug || manifest.scope || 'review';
  return join(baseDir, slug);
}

async function tryResolveRenderer(projectDir) {
  // Test-only escape hatch: tests use this to force the markdown fallback even
  // when a local renderer is dev-linked from a sibling packages/ dir.
  if (process.env.DW_REVIEW_NO_RENDERER === '1') return null;

  // Resolution order: project node_modules → CLI's own node_modules (global -g case).
  // We use createRequire to get a *resolution* path, then dynamic-import that URL
  // so the renderer can be ESM-only (Phase 1 ships ESM only).
  for (const anchor of [join(projectDir, 'package.json'), import.meta.url]) {
    try {
      const req = createRequire(anchor);
      const entry = req.resolve(RENDER_PACKAGE);
      const mod = await import(pathToFileURL(entry).href);
      const render = mod?.render || mod?.default?.render;
      if (typeof render !== 'function') {
        throw new Error("dw-kit-render module did not export a 'render' function");
      }
      return { render };
    } catch {
      // try next anchor
    }
  }
  return null;
}

function buildSummaryMarkdown(manifest, artifacts, { outDir, projectDir }) {
  const lines = [];
  const counts = countBySeverity(manifest.findings);
  const slug = manifest.scope_slug || manifest.scope;

  lines.push(`# Review summary — ${manifest.scope}`);
  lines.push('');
  lines.push(`- Generated: ${manifest.generated_at}`);
  if (manifest.review_meta?.diff_base) lines.push(`- Diff base: ${manifest.review_meta.diff_base}`);
  if (manifest.review_meta?.files_reviewed != null) lines.push(`- Files reviewed: ${manifest.review_meta.files_reviewed}`);
  if (manifest.task_id) lines.push(`- Task: \`${manifest.task_id}\``);
  lines.push('');
  lines.push(`**Severity counts:** critical=${counts.critical}, warning=${counts.warning}, suggestion=${counts.suggestion}`);
  lines.push('');

  if (!manifest.findings.length) {
    lines.push('No findings.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## Findings');
  lines.push('');
  for (const f of manifest.findings) {
    const loc = formatLocation(f.location);
    lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`);
    lines.push('');
    lines.push(`- File: \`${loc}\``);
    if (f.rule_ref) lines.push(`- Rule: ${f.rule_ref}`);

    const svg = artifacts.svg.find((p) => p.endsWith(`finding-${f.id}.svg`));
    const png = artifacts.png.find((p) => p.endsWith(`finding-${f.id}.png`));
    if (svg) lines.push(`- SVG: \`${relativeTo(svg, outDir)}\``);
    if (png) lines.push(`- PNG: \`${relativeTo(png, outDir)}\``);
    lines.push('');
    lines.push(f.body);
    lines.push('');
    if (f.code_snippet) {
      const lang = f.language || '';
      lines.push('```' + lang);
      lines.push(f.code_snippet);
      lines.push('```');
      lines.push('');
    }
    if (f.fix) {
      lines.push(`**Fix:** ${f.fix}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  lines.push(`*Manifest: \`${relativeTo(join(outDir, 'manifest.json'), projectDir)}\`*`);
  lines.push('');
  return lines.join('\n');
}

function countBySeverity(findings) {
  const out = { critical: 0, warning: 0, suggestion: 0 };
  for (const f of findings) {
    if (out[f.severity] != null) out[f.severity]++;
  }
  return out;
}

function formatLocation(loc) {
  if (!loc) return '?';
  if (loc.line_start && loc.line_end && loc.line_start !== loc.line_end) {
    return `${loc.file}:${loc.line_start}-${loc.line_end}`;
  }
  if (loc.line_start) return `${loc.file}:${loc.line_start}`;
  return loc.file;
}

function relativeTo(target, base) {
  const t = target.replace(/\\/g, '/');
  const b = base.replace(/\\/g, '/').replace(/\/$/, '');
  if (t.startsWith(b + '/')) return t.slice(b.length + 1);
  return t;
}
