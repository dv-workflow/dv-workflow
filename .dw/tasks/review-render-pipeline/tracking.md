---
task_id: review-render-pipeline
started: 2026-05-15
last_updated: 2026-05-15
status: In Progress
current_phase: Phase 0 complete; Phase 1 next (build dw-kit-render sub-package)
blockers: none
---

# Tracking: Decoupled Review Render Pipeline

## Status Snapshot

**Phase:** Phase 0 complete (8 subtasks shipped on `feat/review-render-pipeline`).
**Next milestone:** Phase 1 — bootstrap `dw-kit-render` sub-package (shiki + satori + @resvg/resvg-js).

## Linked Issue

- GitHub Issue: https://github.com/dv-workflow/dv-workflow/issues/9
- Adversarial rounds:
  - Round 1 (white-bot + black-bot): comment 4449290212
  - Round 2 (TL escalation, silicon path — deprecated): comment 4449497939
  - Round 3 (TL final, shiki+satori+resvg path — accepted): comment 4449626289

## Subtask Progress

| # | Subtask | Status | Date | Notes |
|---|---------|--------|------|-------|
| ST-1 | Manifest schema + AJV validator | ✅ Done | 2026-05-15 | 6 smoke tests; JSON Schema draft-07; version-mismatch error |
| ST-2 | SKILL.md --visual branch + Write perm | ✅ Done | 2026-05-15 | Write scoped to `.dw/reviews/**/manifest.json` |
| ST-3 | `dw review render` CLI shim | ✅ Done | 2026-05-15 | auto/plugin/markdown-only; resolves dw-kit-render via require.resolve; 5 smoke tests |
| ST-4 | Scope-slug sanitization util | ✅ Done | 2026-05-15 | 6 smoke tests; Windows-safe; Unicode preserved |
| ST-5 | dw.config.yml renderer keys | ✅ Done | 2026-05-15 | schema-validated; getReviewRendererConfig loader with defaults |
| ST-6 | `.dw/reviews/` archive + gitignore | ✅ Done | 2026-05-15 | gitignored; dw-archive skill Step 4a cleans up on archive |
| ST-7 | `dw doctor` renderer section | ✅ Done | 2026-05-15 | shows strategy/formats/theme/font + plugin resolvability |
| ST-8 | `dw-kit-render` package skeleton | ⬜ Pending | — | Phase 1 — monorepo vs separate, decide on start |
| ST-9 | `dw-kit-render` render impl | ⬜ Pending | — | Phase 1 — shiki + satori + resvg |
| ST-10 | Telemetry events | ✅ Done | 2026-05-15 | `review_render` event with strategy, formats, duration_ms, fallback_reason |
| ST-11 | Docs (review-renderer.md + README) | ⬜ Pending | — | Phase 2 — needs Phase 1 screenshots |
| ST-12 | Sample artifacts + smoke test | 🟡 Partial | 2026-05-15 | Phase 0 smoke tests added (5+ cases); PNG/SVG fixtures wait Phase 1 |

Status legend: ⬜ Pending · 🟡 In Progress · ✅ Done · 🔴 Blocked · ⏸ Paused

## Changelog

### 2026-05-15 — Phase 0 implementation complete

**Actions taken:**
- Synced `dev` ← `main` (v1.3.6 release marker) then branched `feat/review-render-pipeline`
- ST-1: `src/lib/review/manifest-schema.json` + `manifest-validator.mjs` (AJV, draft-07, version gate)
- ST-2: `.claude/skills/dw-review/SKILL.md` — `--visual` branch, scoped `Write` perm
- ST-3: `src/commands/review-render.mjs` + `dw review render` subcommand in `cli.mjs`
- ST-4: `src/lib/review/scope-slug.mjs` (Windows-safe, Unicode-safe)
- ST-5: `claude.review.renderer.*` keys in `dw.config.yml` + JSON Schema + `getReviewRendererConfig` loader
- ST-6: `.gitignore` adds `.dw/reviews/`; `dw-archive` Step 4a removes artifacts on archive
- ST-7: `dw doctor` new "Review Render Pipeline (ADR-0007, opt-in)" section
- ST-10: `review_render` telemetry event (strategy/formats/duration_ms/fallback_reason)
- Smoke tests: 67 → 87 (added 20 cases for manifest validator, scope-slug, renderer config, CLI shim fallback paths, doctor renderer section)

**Decisions made:**
- Schema version gate returns clear "unsupported" error vs generic AJV failure
- `dw review render` always writes `summary.md` even when plugin missing (graceful degrade)
- `--strategy plugin` fails fast when `dw-kit-render` missing (no silent fallback)
- Telemetry includes both `success`/`partial`/`fail` actions + `fallback_reason` for sunset analysis
- `.dw/reviews/` gitignored; archive deletes vs preserves — chose delete since regenerable

**Pain points logged:**
- `mkdir` via Bash on Windows finicky; PowerShell `New-Item -Force` is reliable path
- Smoke tests use `freshDir` with `git init` per test → ~20 tests adds ~5s; acceptable but watching

### 2026-05-14 — dw-kit-evolve adversarial review complete; spec drafted

**Actions taken:**
- Triaged Issue #9 (type: suggestion, component: skills, complex)
- Round 1: white-bot proposed markdown-only enhancement (rejected scope by R2)
- Round 1: black-bot critique caught bait-and-switch, missing Write perm, pillar mismap, lifecycle gaps
- Round 2: TL escalation reframed renderer as decoupled pluggable layer, silicon as default external — deprecated by R3
- Round 3: TL clarified goal (universal PNG output OK với extra dep request) → switched to pure-JS sub-package stack
- Created `.dw/tasks/review-render-pipeline/spec.md` + `tracking.md`
- ADR-0007 draft pending

**Decisions made:**
- Renderer = sub-package `dw-kit-render` (not bundled in main)
- Stack = shiki + satori + @resvg/resvg-js (pure-JS + WASM, universal install via npm)
- Output = SVG primary + PNG derived (both ship)
- Pillar mapping: manifest=Records, .dw/reviews/=Bridges, renderer config=Tunes, dw doctor=Surfaces
- silicon path (R2) deprecated
- annotate.ps1 / Python / .NET out of scope

**Pain points logged:**
- Round 1 cả 2 bot kẹt giả định "renderer phải trong main package" → cần phá giả định ở TL synthesis level
- Skill `allowed-tools` không có `Write` là gap không được caught ở proposal — phải đọc skill file để biết

## Handoff Notes

**For next session (or next agent):**

- **Read first:**
  - `.dw/tasks/review-render-pipeline/spec.md`
  - `.dw/decisions/0007-decoupled-review-render-pipeline.md`
  - GitHub Issue #9 comments (Round 1+2+3)
  - `src/commands/review-render.mjs` (Phase 0 CLI shim — Phase 1 plugin must match its expected interface)
- **Current state:** Phase 0 complete (8 subtasks shipped on branch `feat/review-render-pipeline`). Next: Phase 1 = build `dw-kit-render` sub-package implementing `render({manifest, outDir, formats, theme, font}) → Promise<{svgPaths, pngPaths}>`.
- **Don't do:**
  - KHÔNG port annotate.ps1 vào dw-kit (Round 1 user's tool, giữ riêng)
  - KHÔNG add silicon adapter (R2 deprecated)
  - KHÔNG bundle `dw-kit-render` vào main package
  - KHÔNG dùng puppeteer/playwright (heavy)
  - KHÔNG break manifest schema v1 — add fields, never remove; bump schema_version if shape changes
- **Watch out:**
  - Phase 1 plugin interface: `module.exports.render({manifest, outDir, formats, theme, font})` (CJS) hoặc `export async function render(opts)` — CLI shim uses `require(RENDER_PACKAGE)` so default export shape matters
  - Renderer must write SVG and/or PNG named `finding-{id}.svg` and `finding-{id}.png` — summary.md cross-links via this convention
  - satori font fallback cho Vietnamese cần Noto Sans Mono bundled
  - `dw-kit-render` package size limit <20MB
  - `Write` perm trên dw-review skill scope-HẸP: `.dw/reviews/**/manifest.json` only

## Friction Journal

| Date | Friction | Component | Proposed fix |
|------|----------|-----------|-------------|
| 2026-05-14 | `mkdir` bash command không tạo được trên Windows (cần PowerShell `New-Item -Force`) | dev-env | Document trong handoff: dùng PowerShell cho file ops Windows |

## Agent Debate Log

### 2026-05-14 — Issue #9 adversarial review

**white-bot (Round 1):** Reject silicon/annotate, ship markdown-only `--visual` flag. Reasoning: zero-dep non-negotiable.

**black-bot (Round 1):** Bait-and-switch — user wanted PNG, markdown doesn't serve PO/QC audience. Plus `SKILL.md` thiếu `Write`, `.dw/reviews/` chưa lifecycle, scope-slug phá Windows path, pillar mismap (Surfaces → Bridges).

**TL synthesis Round 2:** Decoupled renderer via silicon (external CLI). Renderer pluggable: custom_command > silicon > optional plugin > markdown fallback.

**TL synthesis Round 3 (after user goal clarification):** Renderer = npm sub-package, không system binary. Stack pure-JS shiki+satori+resvg. Output SVG+PNG.

**Incorporated:**
- Decoupled pipeline architecture (R2 → R3)
- Sub-package strategy
- Pillar mapping fix
- Write perm scope-narrow
- Scope-slug sanitization util

**Deferred:**
- Custom renderer plugin protocol (defer post-MVP)
- silicon adapter (deprecated)
- PR comment auto-post (Phase 3)
