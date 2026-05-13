---
task_id: sc-guard-v1.4-fixture-wiring
started: 2026-05-13
last_updated: 2026-05-13
status: Proposed (blocked on ADR-0005 amendment / ADR-0006)
current_phase: Planning — awaiting sunset-review baseline
blockers: ADR amendment not written; v1.3.6 telemetry baseline needs ≥30 days
---

# Tracking: Supply-Chain Guard Fixture Wiring (v1.4.x)

## Status Snapshot

**Phase:** Planning. Spec drafted; no implementation until blockers clear.
**Linked issue:** [#7](https://github.com/dv-workflow/dv-workflow/issues/7) (Gap 2)
**Adversarial review:** [#7 comment 4439674988](https://github.com/dv-workflow/dv-workflow/issues/7#issuecomment-4439674988)

## Pre-Implementation Blockers (must clear in order)

1. **v1.3.6 ships and accumulates ≥30 days of telemetry with the new `source` field.** Without this baseline, fixture-wiring impact cannot be measured cleanly against ADR-0005 sunset criteria.
2. **ADR amendment / ADR-0006 written and Accepted.** Documents the operational role of the bundled fixture beyond pre-install + the trust model for remote fixture refresh. Without this, the implementation work is unsanctioned ADR drift.
3. **2026-08-12 sunset review concludes.** If "retire" → close this task with reason. If "keep" → proceed to ST-1.

## Subtasks

See [spec.md §Subtasks](spec.md#subtasks-planning).

All ST-1..ST-8 = ⬜ Blocked.

## Handoff Notes

**For next session:**

- **Read first:**
  - [spec.md](spec.md) in this folder
  - [GH #7 adversarial review comment](https://github.com/dv-workflow/dv-workflow/issues/7#issuecomment-4439674988) — synthesis verdict + 14 black-bot critique points
  - [ADR-0005](../../decisions/0005-supply-chain-guard.md) — current scope + sunset criteria
- **Don't do:**
  - Don't wire fixture into scan mode before ST-2 ships (version-aware matcher) — guaranteed sunset-criteria violation
  - Don't fetch fixture from `main` HEAD raw URL — only from pinned commit-SHA
  - Don't expand to Socket.dev/Aikido/deps.dev — explicitly rejected
- **Watch out:**
  - Don't ship before sunset review concludes — could be perceived as gaming the metric
  - 5h TL/cycle cap per ADR-0005 N1
  - Reporter-is-author conflict on Gap 2 — need second-pair-of-eyes verification before this task moves to In Progress

## Friction Journal

| Date | Friction | Component | Proposed fix |
|------|----------|-----------|-------------|
| 2026-05-13 | Issue #7 Gap 2 surfaced wiring bug + matcher flaw + trust model gap in single report | sc-scanner.mjs, security-scan.mjs, sc-sync.mjs | Split into v1.3.6 (Bug 1 + telemetry prep) and v1.4 (this task, after ADR amendment) per adversarial synthesis |
