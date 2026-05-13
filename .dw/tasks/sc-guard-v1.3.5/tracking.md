---
task_id: sc-guard-v1.3.5
started: 2026-05-12
last_updated: 2026-05-13
status: Done — released 2026-05-12 (npm v1.3.5 published); ST-12 manual broadcast pending; ready to archive after ST-12 ships
current_phase: Closed — sunset review scheduled 2026-08-12
blockers: none
---

# Tracking: AI-Native Supply-Chain Guard (dw-kit v1.3.5)

## Status Snapshot

**Phase:** Released. Core STs complete; ST-12 (public broadcast) pending manual maintainer action.
**Released:** v1.3.5 on 2026-05-12 (CHANGELOG + README + CLAUDE.md backfilled 2026-05-13)
**Next milestone:** Sunset review 2026-08-12 (TW6 — retire if 0 catches OR FP rate >5%)

## Subtask Progress

| # | Subtask | Status | Date | Notes |
|---|---------|--------|------|-------|
| ST-1 | Hook on Edit-lockfile | ✅ Done | 2026-05-13 | `.claude/hooks/supply-chain-scan.sh` shipped; settings.json wiring documented for manual paste (harness-level block) |
| ST-2 | OSV auto-sync adapter | ✅ Done | 2026-05-13 | `src/lib/sc-sync.mjs` (OSV.dev only, GHSA deferred to v1.4.x) |
| ST-3 | Core scanner | ✅ Done | 2026-05-13 | `src/lib/sc-scanner.mjs` — npm lockfile v1/v2/v3 + OSV range matching |
| ST-4 | CLI `dw security-scan` | ✅ Done | 2026-05-13 | `src/commands/security-scan.mjs` + cli.mjs wired |
| ST-5 | `dw doctor` security section (TW3) | ✅ Done | 2026-05-13 | Fail loud if stale >7d or schema mismatch |
| ST-6 | Telemetry events (TW2) | ✅ Done | 2026-05-13 | sc_guard.* schema extended in telemetry.mjs `summarize()` |
| ST-7 | Solo preset opt-in OFF (TW5) | ✅ Done | 2026-05-13 | init.mjs `maybeInstallSupplyChainHook` respects `hooksProfile: safety-only` (solo); upgrade.mjs heuristic-skips solo-style configs |
| ST-8 | Pre-announce blog draft (TW1) | ✅ Done | 2026-05-12 | `.dw/research/sc-guard-launch-blog-draft.md` |
| ST-9 | ADR sunset commitment text (TW6) | ✅ Done | 2026-05-12 | In ADR-0005, cross-ref blog draft |
| ST-10 | Tests + smoke + docs | ✅ Done | 2026-05-13 | 42/42 smoke pass (25 existing + 17 sc_guard incl pre-install fixture/OSV) |
| ST-13 | Pre-install scan (post-implementation enhancement) | ✅ Done | 2026-05-13 | `--pre-install` mode: namespace fixture (offline, 4 entries for current incident) + OSV.dev name-only query (network, covers 169+ affected packages). New `.dw/security/ioc-namespaces.json` fixture. Covers no-lockfile scenario per user feedback. |
| ST-14 | Scoped .gitignore for end-user (`.dw/.gitignore` + `.claude/.gitignore`) | ✅ Done | 2026-05-13 | `src/lib/gitignore.mjs` writes managed blocks (idempotent, preserves user customization). Wired into init.mjs setupProject + upgrade.mjs upgradeScopedGitignores. End users: framework files excluded from commit; tasks/decisions/docs/reports/dw.config.yml/settings.json stay committed. |
| ST-11 | Release v1.3.5 | ✅ Done | 2026-05-12 | npm published; commit `7984380` release: v1.3.5 |
| ST-12 | Public announcement | ⬜ Pending | — | Blog draft ready (`.dw/research/sc-guard-launch-blog-draft.md`); team broadcast template ready (incident report §5) — manual maintainer ship |

Status legend: ⬜ Pending · 🟡 In Progress · ✅ Done · 🔴 Blocked · ⏸ Paused

## Changelog

### 2026-05-12 evening — Scaffolding

**Actions taken:**
- Decision finalized: Path A (Ship aggressive v1.3.5) per [ADR-0005](../../decisions/0005-supply-chain-guard.md)
- Research trail captured: 8-voter Multi-Agent Decision Pattern run across 3+1 rounds → 5 new structural bugs documented (Bug 4 v2 + Bug 5)
- Task scaffolded: spec.md + this tracking.md created with v2 format
- ADR-0005 status: Accepted (TL authority override of B-consensus per Bug 5 + TW6 framing)
- Estimated TL time: ~5h (12-14h human-baseline compressed via AI-augmented capacity)

**Decisions made:**
- Override panel B-consensus → Path A based on Bug 5 (effort-anchoring bias) + GVC TW6 (public sunset commitment converts panic-ship critique)
- Drop curated IoC bundle approach (DA's bus-factor objection); use OSV+GHSA auto-sync (read-only, multi-maintainer upstream)
- Drop dashboard / freshness heuristic from v1.3.5 scope (panel correctly flagged scope creep)
- Public sunset commitment baked into ADR + blog + release notes (3 places consistent per TW6)
- TW5: solo preset opt-in OFF default (Solo Dev voter's valid feature-fit concern)

**Pain points logged:** see Friction Journal below

### Next Session — TODO

- [ ] Day 1 (2026-05-13): Start ST-1 + ST-8 + ST-9 in parallel
- [ ] Read pattern docs to confirm OSV.dev API format before adapter implementation
- [ ] Decide hook PostToolUse matcher pattern (lockfile glob)
- [ ] Decide CLI default output format (human-readable vs JSON)

## Handoff Notes

**For next session (or next agent):**

- **Read first:**
  - [spec.md](spec.md) in this folder
  - [ADR-0005](../../decisions/0005-supply-chain-guard.md) — decision authority + sunset commitment
  - [supply-chain-guard-proposal.md §10](../../research/supply-chain-guard-proposal.md) — Final Synthesis with 6 tweaks
  - [sc-guard-voter-panel-r3.md](../../research/sc-guard-voter-panel-r3.md) — voter context if needed
- **Current state:** Day 0 complete (scaffolding). Day 1 begins implementation.
- **Don't do:**
  - Don't add curated IoC bundle — explicitly rejected, use OSV/GHSA auto-sync only
  - Don't add PyPI/Go/Cargo support — Won't Contain per ADR-0001
  - Don't drop TW6 public sunset commitment — TL specifically used this to justify Path A
- **Watch out:**
  - 5h TL time hard cap (per ADR-0005 N1) — abort if exceeded
  - Schema drift risk on OSV/GHSA upstream — TW3 fail-loud is non-negotiable
  - Marketing claim "AI-Native" must hold up — hook on Edit-lockfile is the structural differentiator

## Friction Journal

| Date | Friction | Component | Proposed fix |
|------|----------|-----------|-------------|
| 2026-05-12 | Multi-Agent Pattern Bug 4 v1 fix insufficient — clean briefs alone didn't unlock voter panel for security topic | Pattern doc | Documented Bug 4 v2 (sanitized self-contained brief artifact); verified 5/5 round 3 |
| 2026-05-12 | Multi-Agent Pattern Bug 5 — panel role design biases toward effort-downside lens, missing pure value/goal voice | Pattern doc | Documented Bug 5; Goal/Value Champion now MANDATORY paired with DA |
| 2026-05-12 | Panel applied 2024-effort calculus to 2026-AI-augmented capacity | Voter brief design | Brief MUST include effort reframe context (~3-5x multiplier) |

## Agent Debate Log

### 2026-05-12 — Multi-Agent Decision Pattern dogfood (3 rounds + GVC)

**Round 1 (original briefs):** 7/8 AUP-blocked. DA sole-completed → Defer / MODIFY narrow 3-4h.

**Round 2 (Bug 4 v1 fix):** 5/6 AUP-blocked. DA refined → Shift to MODIFY mid-scope 6-8h (3 concessions to strategic frame: bus-factor, AI-specific risk, ADR-0001 alignment).

**Round 3 (Bug 4 v2 sanitized artifact):** 5/5 PASS. Tally: A=0, B=5 (Enterprise/OSS/Strategic/Risk/DA-refined), C=0, D=1 (Solo Dev).

**Round 4 (GVC — Bug 5 fix):** GVC sole-spawned. Verdict A high-confidence + TW6 public sunset commitment. Effort reframe (~3-4h TL vs 12h human-baseline).

**Final tally (8 voters):** A=1 high / B=5 / C=0 / D=1 high.

**TL override of B-consensus to A path documented in [ADR-0005](../../decisions/0005-supply-chain-guard.md) per Bug 5 + TW6 framing.**

**Incorporated tweaks (all 6 non-conflicting):**
- TW1 (OSS+Strategic): Pre-announce blog within 7 days
- TW2 (Enterprise): Pin feed SHA + audit trail in events.jsonl
- TW3 (Risk): `dw doctor` health check fail-loud
- TW4 (Enterprise): Sunset metric includes FP rate ≤5%
- TW5 (Solo): Opt-in OFF default for solo preset
- TW6 (GVC): Public sunset commitment in ADR + blog + release notes

### 2026-05-13 — Release closeout

- v1.3.5 released to npm (commit `7984380`)
- Living docs backfilled — CHANGELOG/README/CLAUDE.md (commit `8234a1d`)
- ST-11 ✅ Done. ST-12 (broadcast) pending manual maintainer action.
- 7 auto-handoff dump blocks trimmed — work was committed; blocks no longer reflect state.
- GH issue #7 filed by maintainer dogfooding on food-fe: Bug 1 (OSV >1000 batch limit, blocking) + Gap 2 (OSV indexing lag for active SC attacks). Route via `/dw-kit-evolve 7` for v1.3.6 patch.

