---
task_id: review-render-pipeline
started: 2026-05-15
last_updated: 2026-05-15
status: In Progress
current_phase: Phase 0 — main package foundation (ST-1, ST-4, ST-5 first)
blockers: none (v1.3.6 shipped)
---

# Tracking: Decoupled Review Render Pipeline

## Status Snapshot

**Phase:** Phase 0 — main package foundation
**Next milestone:** ST-1/ST-4/ST-5 complete → ST-2 SKILL.md edit

## Linked Issue

- GitHub Issue: https://github.com/dv-workflow/dv-workflow/issues/9
- Adversarial rounds:
  - Round 1 (white-bot + black-bot): comment 4449290212
  - Round 2 (TL escalation, silicon path — deprecated): comment 4449497939
  - Round 3 (TL final, shiki+satori+resvg path — accepted): comment 4449626289

## Subtask Progress

| # | Subtask | Status | Date | Notes |
|---|---------|--------|------|-------|
| ST-1 | Manifest schema + AJV validator | ⬜ Pending | — | |
| ST-2 | SKILL.md --visual branch + Write perm | ⬜ Pending | — | scope hẹp: chỉ write manifest.json |
| ST-3 | `dw review render` CLI shim | ⬜ Pending | — | fallback markdown khi `dw-kit-render` thiếu |
| ST-4 | Scope-slug sanitization util | ⬜ Pending | — | 10 test cases |
| ST-5 | dw.config.yml renderer keys | ⬜ Pending | — | strategy, theme, font, formats |
| ST-6 | `.dw/reviews/` archive + gitignore | ⬜ Pending | — | parallel với `.dw/metrics/` |
| ST-7 | `dw doctor` command | ⬜ Pending | — | kiểm tra renderer resolvable |
| ST-8 | `dw-kit-render` package skeleton | ⬜ Pending | — | monorepo vs separate — quyết khi start |
| ST-9 | `dw-kit-render` render impl | ⬜ Pending | — | shiki + satori + resvg |
| ST-10 | Telemetry events | ⬜ Pending | — | 4 events mới |
| ST-11 | Docs (review-renderer.md + README) | ⬜ Pending | — | screenshots required |
| ST-12 | Sample artifacts + smoke test | ⬜ Pending | — | TORIT-5-style fixtures |

Status legend: ⬜ Pending · 🟡 In Progress · ✅ Done · 🔴 Blocked · ⏸ Paused

## Changelog

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
  - `.dw/decisions/0007-decoupled-review-render-pipeline.md` (khi đã draft)
  - GitHub Issue #9 comments (Round 1+2+3)
  - `.claude/skills/dw-review/SKILL.md` (current state, cần edit ST-2)
- **Current state:** Spec drafted. Chờ v1.3.6 ship trước khi start ST-1.
- **Don't do:**
  - KHÔNG port annotate.ps1 vào dw-kit (Round 1 user's tool, giữ riêng)
  - KHÔNG add silicon adapter (R2 deprecated)
  - KHÔNG bundle `dw-kit-render` vào main package
  - KHÔNG dùng puppeteer/playwright (heavy)
- **Watch out:**
  - SKILL.md `allowed-tools` cần thêm `Write` — scope HẸP, chỉ manifest.json
  - Scope-as-dirname phá Windows nếu chứa `/` — phải sanitize trước
  - satori font fallback cho Vietnamese cần Noto Sans Mono bundled
  - `dw-kit-render` package size limit <20MB

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
