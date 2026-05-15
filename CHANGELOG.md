# Changelog — dw-kit

> **Maintainer**: [huygdv](mailto:huygdv19@gmail.com) · **Repo**: [https://github.com/dv-workflow/dv-workflow](https://github.com/dv-workflow/dv-workflow)

---

## [v1.4.0] — 2026-05-15

### Headline — Optional Review Render Pipeline ([ADR-0007](.dw/decisions/0007-decoupled-review-render-pipeline.md))

`/dw:review --visual` produces image cards (SVG + PNG) per finding for PR comments, Slack, and stakeholder review. Rendering ships as a separate package, **`dw-kit-render`** — pure JS + WASM (shiki + satori + @resvg/resvg-js), universal npm install on Windows / Linux / macOS / ARM. No system deps, no native build, no postinstall download.

See [`docs/review-renderer.md`](docs/review-renderer.md). Closes [#9](https://github.com/dv-workflow/dv-workflow/issues/9) once published.

### Added

- **`dw review render <manifest>`** CLI subcommand. Validates manifest, resolves `dw-kit-render` via project + global `npm`, falls back gracefully to a markdown `summary.md` if the renderer is absent. Plugin strategy fails loudly when missing.
- **`/dw:review --visual`** branch in the dw-review skill — emits a structured `manifest.json` to `.dw/reviews/{scope-slug}/`. `Write` permission scoped narrowly to manifest path only.
- **Manifest schema v1** (`src/lib/review/manifest-schema.json`) — versioned public API surface for renderers. AJV-validated with clear `unsupported schema_version` error on mismatch.
- **`scope-slug` util** — filesystem-safe slug for `.dw/reviews/{scope}/` on Windows + POSIX. Strips illegal chars, path traversal, control chars. Preserves Unicode (Vietnamese diacritics round-trip).
- **`claude.review.renderer`** config block — `strategy` (auto / plugin / markdown-only), `theme`, `font`, `formats`, `output_dir`. Schema-validated. `getReviewRendererConfig()` loader applies defaults so existing projects work without re-init.
- **`dw doctor`** new section "Review Render Pipeline (ADR-0007, opt-in)" — surfaces strategy, formats, theme/font, plugin resolvability.
- **Telemetry event** `review_render` — captures action (success/partial/fail), strategy (plugin/fallback-markdown/markdown-only/plugin-missing), formats, duration_ms, fallback_reason.
- **`.dw/reviews/` archive integration** — gitignored (ephemeral); `/dw:archive {task}` cleans up matching artifacts.

### Renderer package — `dw-kit-render`

- Published from `packages/dw-kit-render/` as a separate npm artifact. Main `dw-kit` package stays lean.
- Output: 1200px-wide card per finding — severity-colored banner (critical=red, warning=amber, suggestion=blue), title, `file:line` subhead, shiki-highlighted code block (50-line cap), body, fix banner, footer.
- Font auto-detection: Consolas → DejaVu Sans Mono → Menlo per platform. Accepts custom path or Buffer.
- Vietnamese / Latin Extended renders correctly out of the box.
- Render time: ~200-300ms per finding; 5 findings = ~1.2s on a developer laptop.
- 6 integration tests covering minimal manifest, 5-finding fixture (TORIT-5-style), Vietnamese diacritics, empty manifest, format filters, font resolution.

### Smoke tests

- 87 cases total (from 67) — 20 new for manifest validator, scope-slug, renderer config, CLI shim fallback paths, doctor renderer section.

---

## [v1.3.6] — 2026-05-14

### The headline — 3-pillar AI-Native supply-chain guard ([ADR-0006](.dw/decisions/0006-supply-chain-guard-heuristic.md))

v1.3.5 shipped one pillar (OSV snapshot). v1.3.6 ships three. Goal: **vul vừa xảy ra → end-user phản ứng trong giờ, không phải ngày.**

| Pillar | Signal | Latency | Catches |
|--------|--------|---------|---------|
| 1. OSV snapshot | osv.dev | 2-7 days | Known + indexed |
| 2. Curated IoC fixture (NEW: wired into default scan + version-aware) | TL commit | TL response | Known + TL-bumped |
| 3. NEW-package heuristic at hook fire (NEW: AI-Native moat) | npm registry metadata | Real-time | Zero-day-ish, BEFORE anyone knows |

### Fixed (Closes [#7](https://github.com/dv-workflow/dv-workflow/issues/7))

**Bug 1 (blocking) — `dw security-scan --update-db` HTTP 400 on >1000 packages**

OSV.dev `/v1/querybatch` rejects >1000 queries; large projects crashed with `OSV batch HTTP 400`.
- Chunked at `OSV_BATCH_LIMIT=1000` with `Promise.allSettled` + `OSV_BATCH_CONCURRENCY=2` + retry-with-jittered-backoff on 429/502/503/504.
- Per-chunk fail-soft: one chunk failure no longer discards sibling successes. Snapshot persists with `partial: true` + per-chunk index. Hard fail (`SYNC_ALL_CHUNKS_FAILED`) only when every chunk fails.

**Gap 2 (degraded) — fixture only consulted in `--pre-install`, not default scan**

The wiring bug behind "0 matches for `@tanstack/*` 2 days after the incident."
- `matchNamespaceFixture` now consulted in default `dw security-scan` AND JSON mode.
- **Version-aware matcher** (schema bumped to 1.1): entries carry `affected_range` (SEMVER events). Concrete version OUT of range is *skipped* (no FP — addresses adversarial review critique #2). Range specs (`^1.169.0`) emit `range-ambiguous` hits with severity downgrade. Prefix-only entries (no range) also severity-downgraded.
- TanStack fixture entry now `1.169.5..1.169.9`; Mistral `2.2.3..2.2.5`; OpenSearch `3.6.2..3.6.3`.

### Added — Pillar 3: AI-Native NEW-package heuristic

Hook (`PostToolUse` on Claude Code Write/Edit lockfile) now calls `dw security-scan --heuristic-only`:

1. **Diff lockfile** against `git show HEAD:package-lock.json` → list ONLY NEW + bumped packages (typical: 1-5/edit, not 1000+). Optimization the user asked for: "không phải lúc nào cũng quét realtime."
2. **Fetch npm registry metadata** per package, cached 1h at `.dw/security/npm-registry-cache.jsonl`. Repeated edits hit cache, not network.
3. **Composite signal scoring**:
   - `very_recent_publish` (<24h): +50
   - `recent_publish` (<72h): +30
   - `popular_package` (≥10k weekly DL): +20
   - `maintainer_change_recent` (<30d): +40
   - `major_version_jump`: +15
   - `typo_squat` (Lev=1 of bundled popular list): +60
4. **Reports** to stderr non-blocking. Threshold default 50, tunable via `.dw/config/dw.config.yml`:
   ```yaml
   security:
     heuristic:
       risk_threshold: 50
       weekly_downloads_min: 10000
       recent_publish_hours: 72
   ```

**Reaction-time outcome**: AI adds `@tanstack/react-query@1.169.5` (published 6h ago) → hook → heuristic catches BEFORE OSV indexes, BEFORE TL bumps fixture, BEFORE any npm publish cycle. **Cycle ~1h** instead of 24-72h.

### Telemetry (sunset-review integrity)

- `sc_guard.*` events carry `source` field: `osv` | `fixture` | `heuristic` | `osv+fixture` | `pre-install-mixed`.
- Pre-install events additionally carry `block_source` (which subsystem blocked).
- Sync events carry `partial`, `chunks_total`, `chunks_failed`.
- Scan events carry `partial_snapshot` — partial-clean scans excluded from the 0-catches denominator at 2026-08-12 review.
- `summarize()` exposes per-pillar `supplyChainBySource` + `supplyChainPartial`. August review attributes catches per pillar; no single FP-prone pillar can sink the metric.

### UX simplification (post-dogfood feedback)

End-user setup now matches `npm audit` ergonomics — 1 lệnh khi cài, 1 lệnh khi scan:

```bash
npm i -g dw-kit && dw init --preset team   # prompts "Sync OSV snapshot now?" (Y/n, default Y)
dw scan                                     # all 3 pillars; auto-syncs if snapshot stale/missing
```

Changes:
- **`dw scan` alias** for `dw security-scan`
- **Lazy auto-refresh** — `dw scan` auto-syncs OSV if snapshot missing OR stale >7d. Skipped on `--offline` / `--quick`. No more weekly chore.
- **`dw init` prompts for OSV bootstrap** (TTY only; non-TTY auto-yes; skip via `DW_INIT_NO_PROMPT=1`)
- **No-lockfile graceful fallback** — `dw scan` on a project with `package.json` but no `package-lock.json` (fresh checkout, pre-`npm install`) auto-switches to pre-install mode instead of erroring out
- **No-project helpful hint** — `dw scan` outside a Node project exits with actionable message, not stack trace

### CLI flags (additions)

```
dw scan                  # alias for security-scan
dw scan --no-heuristic   # skip pillar 3 (no network)
dw scan --offline        # skip network (also skips pillar 3 + auto-refresh)
dw scan --heuristic-only # only pillar 3 (used by hook)
dw scan --update-db      # explicit OSV sync (rarely needed thanks to auto-refresh)
```

### New files

- `src/lib/npm-registry.mjs` — registry adapter + 1h TTL cache
- `src/lib/sc-heuristic.mjs` — lockfile diff + scoring engine + bundled popular-package list
- `.dw/decisions/0006-supply-chain-guard-heuristic.md` — ADR extending ADR-0005

### Test suite

+20 smoke cases (47 → 67/67 pass): chunked sync, retry/backoff, version-aware matcher boundaries, heuristic composite scoring, typo-squat detection, lockfile diff (cold-start + git-HEAD-aware), cache TTL boundary, `dw scan` alias resolution, no-lockfile fallback, `--offline` suppresses auto-refresh.

**Smoke runner bug fixed**: async tests previously silently masked rejections. After fix, caught a pre-existing `gitignore.mjs` non-idempotence bug (trailing-newline accumulation). Both fixed in this release.

### ADR-0005 5h/cycle cap intentionally overridden

Documented explicitly in [ADR-0006 §Effort](.dw/decisions/0006-supply-chain-guard-heuristic.md). Total cycle ~9h. Shipping without pillar 3 leaves the AI-Native moat unproven.

### Deferred to v1.4 (tracked in `.dw/tasks/sc-guard-v1.4-fixture-wiring/`)

Remote fixture refresh (signed-pin trust model), pnpm/yarn lockfile support, monorepo workspace discovery, deep maintainer-change history. Pillar 3 reduces the urgency of remote fixture refresh since heuristic catches don't depend on TL bump.

---

## [v1.3.5] — 2026-05-12

### Added — AI-Native Supply-Chain Guard ([ADR-0005](.dw/decisions/0005-supply-chain-guard.md))

Wired into Claude Code workflow at the Edit-lockfile boundary. Positions dw-kit as the first AI-coding toolkit owning supply-chain awareness for AI-agent-authored dependency edits.

**New CLI command — `dw security-scan`:**
- `dw security-scan --update-db` — fetch fresh advisory snapshot from [OSV.dev](https://osv.dev/) (multi-source: GHSA, npm, PyPA, Go, RustSec)
- `dw security-scan` — scan project lockfile (`package-lock.json` / `npm-shrinkwrap.json`) against snapshot; exit 0=clean, 1=low/medium, 2=HIGH+ advisory match
- `dw security-scan --pre-install` — scan `package.json` without lockfile (namespace fixture offline + OSV.dev name-only query online)
- `dw security-scan --offline` — fixture-only fast path
- `dw security-scan --json` — machine-readable output for CI integration
- `dw security-scan --install-hook` / `--uninstall-hook` — manage hook wiring in `.claude/settings.json`

**New hook — `.claude/hooks/supply-chain-scan.sh`:**
- Fires on Claude Code Write/Edit of lockfile (PostToolUse matcher)
- Runs `dw security-scan --quick` (offline path, <1s)
- Non-blocking advisory output to stderr; exit codes signal severity to wrapping tooling
- Auto-wired by `dw init --preset team|enterprise`; skipped for `--preset solo` (TW5 opt-in OFF)
- `dw upgrade` re-wires the hook on existing installations (deep-merge bypass via post-merge install)

**`dw doctor` security section:**
- New "Supply-Chain Guard" health-check section
- Fail-loud if advisory snapshot >7 days stale OR schema mismatch (TW3 mitigation against silent feed drift)

**Telemetry events (extend `events.jsonl`):**
- `sc_guard.scan_run` — every scan invocation with packages count, latency, snapshot age
- `sc_guard.block` — HIGH+ severity match found
- `sc_guard.allow` — low/medium match found
- `sc_guard.sync` — snapshot fetched, advisory count, packages queried
- Each event includes `feed-version` + `advisory-id` for audit trail (TW2 mitigation against "ai chọn prior?" audit challenge)

**Curated namespace IoC fixture (`.dw/security/ioc-namespaces.json`):**
- Ships with 4 active-incident namespace patterns (TanStack, UiPath, Mistral, OpenSearch — current 2026-05-11 supply-chain incident)
- Auto-expires per `active_until` date — TL prunes entries on regular release cycles
- Fallback layer when OSV.dev unavailable; primary detection is OSV.dev auto-sync

**Scoped `.gitignore` for end-user projects:**
- `dw init` creates `.dw/.gitignore` + `.claude/.gitignore` with managed blocks (idempotent, preserves user customization outside the block)
- Framework dirs excluded from end-user git: `.dw/adapters/`, `.dw/core/`, `.dw/security/`, `.dw/metrics/`, `.claude/agents/`, `.claude/hooks/`, `.claude/rules/`, `.claude/skills/`, `.claude/templates/`
- Committed by end-users: `.dw/tasks/`, `.dw/decisions/`, `.dw/docs/`, `.dw/reports/`, `.dw/config/dw.config.yml`, `.claude/settings.json`, `CLAUDE.md`
- `dw upgrade` refreshes managed blocks (per-version evolution without losing user lines)

### Public Sunset Commitment (TW6 — non-negotiable)

> dw-kit v1.3.5 ships an experimental AI-native supply-chain guard. We commit to a 90-day review (target **2026-08-12**): if telemetry shows zero real-world catches OR false-positive rate exceeds 5%, the feature is retired silently in v1.4.x. Review results will be published regardless of outcome.

Discipline marker (per Goal/Value Champion voter feedback in [Multi-Agent Decision Pattern run](.dw/research/sc-guard-voter-panel-r3.md)) — converts "panic ship" critique into "disciplined experiment with kill-switch". Telemetry events (TW2) produce machine-readable evidence for the August review.

### Audience Behavior by Preset

- **solo**: feature shipped but opt-in OFF default; enable via `dw security-scan --install-hook` (TW5)
- **team / enterprise**: hook auto-wired on `dw init`; `dw upgrade` re-installs on existing projects

### Tests

47/47 smoke tests pass (25 existing + 22 new sc_guard/gitignore cases).

### Files Added

- `src/lib/sc-scanner.mjs` — npm lockfile v1/v2/v3 parser + OSV range matching
- `src/lib/sc-sync.mjs` — OSV.dev fetch + snapshot management
- `src/lib/sc-install.mjs` — hook wire/unwire helpers
- `src/lib/gitignore.mjs` — scoped `.gitignore` manager (managed block + idempotent)
- `src/commands/security-scan.mjs` — `dw security-scan` CLI
- `.claude/hooks/supply-chain-scan.sh` — PostToolUse hook
- `.dw/security/ioc-namespaces.json` — namespace IoC fixture
- `.dw/decisions/0005-supply-chain-guard.md` — ADR with sunset commitment
- `.dw/research/supply-chain-*.md` — incident report + proposal + voter panel + blog draft (research trail)
- `.dw/research/multi-agent-decision-pattern.md` — 5 structural bugs documented from dogfood pattern runs

### References

- ADR: [.dw/decisions/0005-supply-chain-guard.md](.dw/decisions/0005-supply-chain-guard.md)
- Research trail: [.dw/research/supply-chain-guard-proposal.md](.dw/research/supply-chain-guard-proposal.md) (Section 10 canonical)
- Pattern run: [.dw/research/sc-guard-voter-panel-r3.md](.dw/research/sc-guard-voter-panel-r3.md)
- External: [OSV.dev API](https://osv.dev/docs/), [GitHub Security Advisories](https://github.com/advisories)

Bump: 1.3.4 → 1.3.5. Backward compatible (new feature, opt-in for solo, auto-wired for team/enterprise).

---

## [v1.3.4] — 2026-04-21

### Added — `/dw:plan` Quick Debate (red/blue team)

Self-critique debate phase added to `dw:plan` skill. Depth-driven activation prevents ceremony overhead:

- **quick**: skip (hotfix, no debate overhead)
- **standard**: skip by default; auto-trigger on high-stakes signals (API contract changes, DB migrations, auth/security, cross-module refactors ≥3 modules, new integrations, perf-critical paths)
- **thorough**: default ON (risky changes deserve structured critique)

Two modes:
- **Mode A — Lightweight (default)**: single-agent 2-pass. Pass 1 red team (top-3 dubious assumptions + failure modes), Pass 2 blue team (mitigations + strengthenings). Token cost ~1.3×, time ≤3 min.
- **Mode B — Deep (`--debate-deep`)**: spawn 2 parallel subagents via Agent tool, independent perspectives. Token cost 2-3×, time ≤10 min.

**Overrides:** `--debate` forces on for standard/quick; `--no-debate` off for thorough; `--debate-deep` escalates.

**Output:**
- v2: append to `tracking.md` section `## Agent Debate Log` (reusing existing v2 template section)
- v1: append `## Debate Log` to `$ARGUMENTS-plan.md`

**Principle:** no ceremony. If debate finds nothing new after 2 passes, log "No new concerns" and continue. Do not fabricate findings.

Rationale: positive user experience with red/blue debate in `dw-kit-v2-strategy` task caught real blind spots. Default-on for every plan would recreate the "cage" anti-pattern. Depth-driven balances value against overhead. v1.4 eval measures actual catch rate via telemetry.

Bump: 1.3.3 → 1.3.4. Pure additive, no breaking changes.

---

## [v1.3.3] — 2026-04-21

### Fixed — Writer Skills v1/v2 Compatibility

Critical bug: 4 writer skills (`dw:research`, `dw:plan`, `dw:execute`, `dw:handoff`) only read/wrote legacy v1 3-file format (`context + plan + progress`). Since v1.3.1 made `task-init` emit v2 (`spec.md + tracking.md`), the happy path was broken: `/dw:task-init` creates v2 files but `/dw:research` tries to read/write non-existent v1 files.

**Fix:** each writer skill now has a "Detect Task Format" block at top and explicit v2/v1 branches for each read/write operation.

- `dw:research`: v2 appends to `spec.md` section `## Research Findings`; v1 writes to `$ARGUMENTS-context.md` as before
- `dw:plan`: v2 updates `spec.md` sections (Scope, Subtasks, Risks, Success Criteria); v1 writes to `$ARGUMENTS-plan.md`
- `dw:execute`: v2 reads spec+tracking, updates `tracking.md` Subtask Progress table + Changelog; v1 reads all 3 files as before
- `dw:handoff`: v2 writes to `tracking.md` `## Handoff Notes` section; v1 writes to `progress.md` as before

### Cleaned — Legacy Slash-Command Refs

Sweep `/dw-*` → `/dw:*` in user-facing docs:
- `.dw/core/ROLES.md` (9 refs, ships in npm)
- `docs/get-started.md` (~50 refs, linked from README)
- `docs/cheatsheet.md` (25 refs)
- `docs/custom-skills.md` (4 refs)

**Audit summary** (v1.3 gaps confirmed fixed):
- 30/30 `SKILL.md` `name:` fields are `dw:*` — no missing prefix
- `.claude/rules/*`, `CLAUDE.md`, `README.md` — clean
- Remaining `/dw-*` refs are: (a) historical in ADRs explaining the rename, (b) filesystem paths like `.claude/skills/dw-*/` (correct — colon illegal on Windows), (c) maintainer-only `dw-kit-evolve` (not shipped)

Bump: 1.3.2 → 1.3.3. Pure fixes, no breaking changes.

---

## [v1.3.0] — 2026-04-21

### Added — 5-Pillar Governance Layer + Telemetry Foundation ([ADR-0001](.dw/decisions/0001-v2-pragmatic-lean.md))

Strategic repositioning: dw-kit as **Context-First SDLC Governance Layer** (not prescriptive workflow engine). Five verb-based pillars: **Guards · Surfaces · Records · Bridges · Tunes**.

**Core additions:**
- `.dw/core/PILLARS.md` — 5-pillar spec with obsolescence test
- `.dw/core/v14-evaluation-protocol.md` — 4-week cut-evaluation playbook for v1.4 data-driven decisions
- `.dw/core/templates/v2/` — 2-file task docs (`spec.md` + `tracking.md`) replacing 3-file v1 format
- `.dw/decisions/` — Architecture Decision Records (ADRs) layer with 4 initial entries:
  - ADR-0001 Pragmatic Lean direction
  - ADR-0002 Skill naming `/dw:*` namespace
  - ADR-0003 Pillar 6 Janitors (deferred, post-v2.0)
  - `_template.md`

**CLI additions:**
- `dw init --solo` / `--preset team` / `--preset enterprise` presets (audience-tuned defaults)
- `dw active` — regenerate `.dw/tasks/ACTIVE.md` index from v1+v2 task folders
- `dw metrics [show | cut-analysis]` — inspect telemetry + apply ADR-0001 Cut Criteria Matrix
- `dw dashboard` — active tasks + ADRs + telemetry summary + health checks
- `dw doctor` — detect v2 artifacts (PILLARS.md, decisions/, ACTIVE.md, metrics/)

**Library:**
- `src/lib/telemetry.mjs` — local-only logger; `DW_NO_TELEMETRY=1` kill-switch; session-hash anonymization
- `src/lib/active-index.mjs` — v1+v2 task frontmatter parser
- `src/lib/cut-analysis.mjs` — ADR-0001 threshold evaluator (uses/week/dev, fires/session)

**Hooks:**
- `.claude/hooks/telemetry-log.sh` — shell-side logger wired into 3 hooks (extended in v1.3.x to 8/9 hooks)
- `.claude/hooks/stop-check.sh` — auto-handoff snippet to `tracking.md` when uncommitted + active task

**Skill namespace rename:** all 30 skills `/dw-*` → `/dw:*` (per ADR-0002 Accepted). Filesystem paths kept `.claude/skills/dw-*/` (colon illegal on Windows).

**Rules consolidation:** 6 rules files (11,322 bytes) consolidated into 4 files (8,019 bytes) — 29% reduction toward ADR-0001 50% cut goal. Remaining cut deferred to v1.4 with telemetry evidence.

**Docs:**
- `MIGRATION-v1.3.md` — full migration guide (old → new skill mapping, rollback)
- `README.md` — v1.3 positioning + 5-pillar architecture section
- `CLAUDE.md` — slimmed and refocused

Bump: 1.2.1 → 1.3.0. Backward compatible (new features opt-in). Gitignore `.dw/metrics/events.jsonl` (per-dev, auto-created).

---

## [v1.2.1] — 2026-04-15

### Fixed — Cross-Platform Hook Reliability

- **CRLF hooks on Linux/Ubuntu (blocking)**: Added `.gitattributes` enforcing `eol=lf` for all `.sh`, `.mjs`, `.json`, `.md`, `.yml` files. Prevents shebang corruption (`#!/usr/bin/env bash\r`) that caused hard failures on Linux when hooks were edited on Windows. Closes [#6](https://github.com/dv-workflow/dv-workflow/issues/6).

- **`session-init.sh` re-injection on node failure**: Added 3-tier fallback for `SESSION_ID` parsing — `node` (primary) → `grep/cut` pure-bash (tier 2) → `cksum`-based project-scoped ID (tier 3). Marker file is now always created, eliminating repeated context injection on every prompt when node fails. Fallback ID is project-scoped (not machine-global) to avoid multi-project collision.

- **Hook LF normalization on `dw upgrade`**: `copy.mjs` now writes `.sh` files with LF endings regardless of the user's `core.autocrlf` setting — provides a defensive layer since dw-kit cannot control the user repo's git config.

- **`dw upgrade` auto-patches user `.gitattributes`**: Upgrade now adds `.claude/hooks/*.sh text eol=lf` and `.claude/skills/**/*.sh text eol=lf` entries to the user project's `.gitattributes` (idempotent, only adds missing entries). Prevents CRLF contamination on next git checkout in Windows repos.

- **Update notice timing**: Replaced `program.parse` + post-parse notice with `process.on('exit')` registration. Update notice now consistently appears _after_ command output, even when commands call `process.exit()` internally. Avoids Node.js 22+ "unsettled top-level await" warning.

- **Toolkit version tracking**: Corrected `_toolkit.core_version` in the dw-kit repo's own config (`1.0` → `1.2`) to match the version installed into projects by `dw init`. Fixes `dw upgrade --check` incorrectly reporting an "update available" on a fresh init.

---

## [v1.2.0] — 2026-04-09

### Added — Core Split + Runtime Guard Hooks

- `CLAUDE.md` split into `.claude/rules/dw-core.md` and `.claude/rules/dw-skills.md` for cleaner loading and maintenance
- `scout-block.sh` hook to block expensive scans in heavy/irrelevant paths (`node_modules`, `dist`, `.git`, etc.)
- `privacy-block.sh` hook to prevent accidental reads of sensitive files (`.env*`, credentials, keys)
- `session-init.sh` hook to inject active task context at session start

### Added — Agent Reports + Conventions

- `.claude/templates/agent-report.md` template for consistent agent outputs
- `.dw/core/AGENTS.md` convention doc for report structure and usage
- `dw-research` skill support to emit report artifacts in standard+ depth

### Enhanced — Config Local Override

- `loadConfigWithLocal()` support for `.dw/config/dw.config.local.yml` as environment-specific override
- `dw init` update to gitignore local override file by default
- Toolkit version tracking advanced to core `1.2` for this release line

### Changed

- CLI update notice now includes direct release notes URL for the detected latest version
- README release references now point to changelog/release notes for upgrade transparency

### Not Shipped in v1.2.0 (Documented Decisions)

- Dropped: `dw-parallel` standalone skill (duplicate with native Agent tool capability)
- Dropped: fixed Socratic kickoff script (less adaptive than native assistant behavior)
- Dropped: mandatory planner report-emission automation (added overhead with low value)
- Deferred to later release: parallel research and parallel execute subtasks (`v1.3` candidate)

---

## [v1.1.0] — 2026-03-30

### Added — Retroactive Adoption Skills

- **`/dw-onboard`**: One-time breadth-first codebase scan when adopting dw-kit into an existing running project. Generates `.dw/context/project-map.md` and per-module context docs. Recommends `/dw-retroactive` for complex modules.
- **`/dw-retroactive [name]`**: Depth-first retroactive documentation for a single existing feature/task. Reverse-engineers from code + git history, produces full as-built task docs (context + plan + progress) in `.dw/tasks/[name]/`.

### Added — `--no-dw` Override Flag

- **`--no-dw` in prompt**: Per-request escape hatch. Adding `--no-dw` to any prompt disables all dw workflow instructions (routing, config read, thinking framework) for that request only. Next prompt resumes dw normally. No CLI command or file manipulation needed.

### Changed — Commit Philosophy

- **All `.dw/` content is now committed** — tasks, context, docs, metrics, reports. Teams and open-source contributors share the same context without needing to regenerate it.
- **`dw init` gitignore** now only adds `CLAUDE.local.md` and `.claude/settings.local.json` — no `.dw/` entries.

### Fixed

- **`dw prompt`**: `readAdapter()` was reading `config.adapter` which does not exist in the config schema — always fell back to `'claude-cli'` regardless of actual platform. Now correctly uses `detectPlatform()` to detect Cursor and generic adapters.

### Refactored

- **`dw prompt`**: Removed redundant `readAdapter()` wrapper function; inlined `detectPlatform(process.cwd())` directly at call site.

---

## [v1.0.0] — 2026-03-24

### Architecture: 4-Layer System

**Breaking Changes** (v0.3 legacy migration removed; v1 uses the new config + workflow):

- `dv-workflow.config.yml` → `.dw/config/dw.config.yml` (symlink backward-compat provided)
- `level: 1/2/3` → `workflow.default_depth: quick/standard/thorough`
- 17 feature flags → depth defaults + role-based availability

### Added — npm Package Distribution

- **npm install**: `npm install -g dw-kit` for global CLI, `npx dw-kit init` for zero-install
- `**dw init`**: Node.js interactive wizard — 4 questions, presets, platform auto-detect
- `**dw upgrade**`: Smart update with override-awareness, `--dry-run`, `--check`, `--layer` flags
- `**dw validate**`: Config schema validation using `ajv` — reports unknown keys, invalid values, semantic warnings
- `**dw doctor**`: Installation health check — core files, config, platform detection, version tracking

### Added — Portable Core (`core/`)

- `core/WORKFLOW.md`: 6-phase methodology với section anchors `<!-- @phase:X -->`
- `core/THINKING.md`: thinking framework + First Principles section
- `core/QUALITY.md`: 4-layer quality strategy (Requirements→TDD→Cross-Review→QA Gates)
- `core/ROLES.md`: BA/TL/Dev/QC/PM definitions với decision authority per phase
- `.dw/core/templates/vi/`: guided questionnaire templates (context/plan/progress)

### Added — Upgrade Safety (`.dw/adapters/claude-cli/`)

- `.dw/adapters/claude-cli/generated/`: auto-generated skill shells (DO NOT edit)
- `.dw/adapters/claude-cli/overrides/`: team customizations (NEVER overwritten by upgrade)
- `.dw/adapters/claude-cli/extensions/`: net-new team skills

### Added — Generic Adapter (`adapters/generic/`)

- `adapters/generic/AGENT.md`: methodology reference cho Cursor/Windsurf/Copilot
- Honest về limitations: không replicate agent delegation hay hooks

### Enhanced — Claude Execution Layer

- `agents/researcher.md`: +`mcp__ide__getDiagnostics`, +confidence level per finding
- `agents/planner.md`: +Deep Analysis Protocol (≥3 approaches, devil's advocate)
- `agents/reviewer.md`: +JSON output block cho CI/CD parsing
- `agents/executor.md`: NEW agent với Write/Edit/Bash tools, TDD workflow, worktree support

### Enhanced — Hook System (4 hooks)

- `hooks/safety-guard.sh`: block `rm -rf` nguy hiểm, force push main, SQL không WHERE
- `hooks/post-write.sh`: auto-lint trên file vừa write (non-blocking)
- `hooks/progress-ping.sh`: remind update progress (Notification hook)
- `settings.json`: expanded 2→4 hooks (PreToolUse×2, PostToolUse, Stop, Notification)
- `settings.json`: `mcpServers: {}` slot ready

### Added — Config Layer

- `.dw/config/dw.config.yml`: config với `claude:` section (models, structured_output, worktree_execution, mcp)
- `config/config.schema.json`: JSON Schema validation, strict additionalProperties
- `config/presets/`: solo-quick, small-team, enterprise presets

### Changed

- Bash legacy scripts removed from distribution; CLI commands are the only supported workflow
- README.md updated with npm install instructions as primary setup method

### Technical

- ESM-only package (`"type": "module"`)
- Minimal dependencies: `commander`, `js-yaml`, `chalk`, `ajv`
- Node.js ≥18 required
- CLI locates bundled files via `import.meta.url` — works regardless of npm install location

### Design Decisions

- WORKFLOW.md là on-demand document, KHÔNG always-loaded — ngăn context bloat
- CLAUDE.md redesigned thành tiered loader (~150 lines)
- Agent system enhanced, không simplified — "portable core ≠ thin execution layer"
- Generic adapter honest về limitations thay vì false equivalence

---

## [v0.3.0] — 2026-03-18

### Added

- `rollback` skill — revert task docs về checkpoint (after-research | after-plan | clean)
- `archive` skill — move done tasks vào `.dev-tasks/archive/YYYY-MM/`, maintain index
- `project-templates/enterprise/dv-workflow.config.yml` — Level 3 fully enabled template
- `examples/ci-templates/ci-quality-gate.yml` — GitHub Actions: lint + test + security scan
- `examples/ci-templates/ci-docs-check.yml` — GitHub Actions: weekly living docs freshness

### Enhanced

- `docs-update` SKILL: auto-scaffold `.dev-docs/` on first run, smarter git diff classification table, stale check logic
- `dashboard` SKILL: DORA auto-calculation từ git history, HTML export (`.html` + `.md` dual output), responsive inline CSS template

### Fixed

- `project-templates/new-product`: remove deprecated `paths.templates` key
- `dv-workflow.config.yml`: comment out deprecated `paths.templates`

---

## [v0.2.0] — 2026-03-18

### Changed (Breaking — Integration Architecture)

- `templates/` và `skills/` **đã xóa khỏi root** — nội dung chuyển vào `.claude/`
- Templates: `templates/*.md` → `.claude/templates/*.md`
- THINKING.md: `skills/THINKING.md` → `.claude/skills/thinking/THINKING.md`
- legacy bootstrap no longer copies `templates/` and `skills/` to root; they live under `.claude/`
- `thinking` SKILL: `user-invocable: true` (trước là `false`); `@THINKING.md` (same dir)
- `task-init` SKILL: language-aware template selection (`project.language` trong config)

### Added

- `config-validate` skill — kiểm tra config: unknown keys, invalid values, level 3 beta warning
- `upgrade` skill — provides selective toolkit sync and config backup
- `sprint-review` skill — retrospective, lessons learned, sprint metrics
- `.claude/templates/en/` — English templates (task-context, task-plan, task-progress)
- `docs/custom-skills.md` — hướng dẫn tạo custom skills + examples
- `schemas/effort-log.schema.json` — chuẩn hóa format effort log data

### Updated

- `planner.md`, `research/SKILL.md`: reference THINKING.md path mới
- `CLAUDE.md`: reference THINKING.md path mới

---

## [v0.1.x] — 2026-03-18 (patch)

### Fixed

- **C2**: `pre-commit-gate.sh` — thay `grep+awk` bằng `python3 regex` để parse YAML robust hơn
- **W3**: Demo B — fix code inconsistencies: thêm `UserModel` class-based API, align `displayName` field, thêm BEFORE/AFTER state labels

### Added

- **C1**: Root `README.md` với quick start, level table, links đến docs
- **C3**: `config-init` SKILL — validation step: known keys, level 3 beta warning, flag value check
- **P1**: `docs/cheatsheet.md` — bảng tham chiếu 17 skills 1 trang
- **P2**: Cross-platform notes (Windows Git Bash / WSL) vào `docs/README.md`
- kế hoạch upgrade v0.1.x → v1.0 (historical internal document)

---

## [v0.1] — 2026-03-10 (beta)

Phiên bản đầu tiên. Kiến trúc cốt lõi và bộ skills hoàn chỉnh cho Level 1–2.

### Added

#### Core Workflow

- `config-init` — Bootstrap toolkit cho dự án mới
- `task-init` — Tạo bộ docs (context + plan + progress) cho task
- `research` — Khảo sát codebase (researcher agent, context: fork)
- `plan` — Lập kế hoạch, dừng để approve (planner agent, read-only)
- `execute` — Thực hiện theo plan với TDD
- `commit` — Smart commit với quality checks (debug scan, sensitive data scan)

#### Quality & Debug

- `review` — Code review (reviewer agent, checklist.md)
- `debug` — Debug Investigate → Diagnose → Fix với regression test

#### Tracking & Metrics

- `estimate` — Ước lượng effort với Complexity×Uncertainty matrix
- `log-work` — Ghi nhận effort thực tế, cập nhật progress file
- `dashboard` — Báo cáo PM với DORA metrics

#### Role-Specific Skills

- `requirements` — BA: user stories với Given/When/Then criteria
- `test-plan` — QC: test cases P1-P4, security checklist
- `arch-review` — TL: review kiến trúc, approve plan

#### Collaboration

- `handoff` — Bàn giao session, cập nhật progress file
- `docs-update` — Cập nhật living docs (ARCHITECTURE, API, DATA-MODELS)

#### Agents

- `researcher` — Read-only, Sonnet, git-safe Bash
- `planner` — Read-only, no Bash, subtask granularity rules
- `reviewer` — Sonnet, structured output với severity levels
- `quality-checker` — Haiku, fast checks, JSON output

#### Infrastructure

- `dv-workflow.config.yml` — Config trung tâm với level + flags system
- Level system (1: lite / 2: standard / 3: full)
- Project templates: `new-product` và `old-maintenance`
- Hooks: `pre-commit-gate.sh` (quality gate), Stop hook (session end reminder)
- `.claude/rules/`: commit-standards, code-style, workflow-rules

#### Examples

- `examples/demo-A-bug-fix/` — Bug fix workflow với Express+TS (Level 1)
- `examples/demo-B-new-feature/` — Full-team feature workflow (Level 2)
- `examples/integration-guide/` — v1 setup guide

### Notes

- v0.1 là beta — API có thể thay đổi trong v0.2
- Tested với Claude Code CLI
- Dự kiến open-source sau khi ổn định từ v0.2+

---

## Roadmap

### [v0.2] — Planned

- MCP integration cho external sync (Jira, GitHub, Linear)
- `thinking` skill standalone invocation improvements
- `sprint-review` skill cho team retrospective
- English language support (`language: en`)
- Improved DORA metrics calculation

### [v0.3] — Planned

- Level 3 full workflow với living docs automation
- Dashboard với HTML/markdown report export
- Multi-agent coordination patterns
- Community skill templates (submit via PR)

