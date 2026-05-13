---
task_id: sc-guard-v1.4-fixture-wiring
created: 2026-05-13
owner: huydv (TechLead)
status: Proposed (blocked on ADR-0005 amendment)
depth: thorough
ship-target: v1.4.x (post-sunset-review 2026-08-12 or earlier with amendment)
linked-issue: https://github.com/dv-workflow/dv-workflow/issues/7
linked-pr: (none yet — adversarial review in #7-comment-4439674988)
linked-adr: ADR-0005 (amendment required), see Open Questions
---

# Spec: Supply-Chain Guard Fixture Wiring (v1.4.x)

## Intent

Surface the bundled IoC namespace fixture in dw-kit's **default `scan` mode** (currently only consulted in `pre-install` mode), and refresh that fixture from a trusted remote feed, **without** compromising the 2026-08-12 ADR-0005 sunset review.

## Why this is gated (not just shipped in v1.3.6)

Two structural blockers were caught by black-bot critique on [issue #7](https://github.com/dv-workflow/dv-workflow/issues/7#issuecomment-4439674988):

1. **Prefix-only matcher = false-positive factory.** `sc-scanner.mjs::matchNamespaceFixture` uses pure `name.startsWith(entry.pattern)` with zero version check. Wiring it into default scan flags safe `@tanstack/react-query@2.x` as critical. Fastest path to blow past the ≤5% FP rate sunset criterion → forced retirement.
2. **Trust model gap.** Reporter's suggestion to fetch fixture from `raw.githubusercontent.com/.../main/.dw/security/ioc-namespaces.json` has no signature, no pinned SHA. A compromised maintainer GitHub credential would propagate attacker-controlled "IoC patterns" to every dw-kit user's next `--update-db`. Meta-irony: supply-chain guard with a supply-chain attack surface.

Either issue alone is a release blocker.

## Scope

In:
- Version-aware namespace matcher (`matchNamespaceFixture` honors semver ranges)
- Source-distinguishing telemetry (already shipped in v1.3.6 — `source` field + `block_source` field + `supplyChainBySource` summary breakdown)
- Wire fixture into default `scan` mode of `security-scan.mjs` (after matcher hardening)
- Remote fixture refresh via `--update-db`, fetching from a **pinned git tag** (not `main` HEAD), with SHA-256 verification + schema validation + size cap (16 KB)
- Fixture staleness warning in `dw doctor` + scan output (>14d)
- Scan footer wording update (out-of-scope vendors named: Socket, Aikido)
- Operator runbook for fixture publishing (tag-cut workflow for maintainer)

Out:
- Socket.dev / Aikido / deps.dev second-source integration (rejected by ADR-0005)
- pnpm / yarn lockfile scanner support (separate task — split from this scope to keep cycle small)
- Monorepo workspace discovery (separate task)
- Curated bundle hosted in dedicated infra (rejected by ADR-0005)

## Subtasks (planning)

| # | Subtask | Estimated TL | Notes |
|---|---------|--------------|-------|
| ST-1 | ADR-0005 amendment OR ADR-0006 superseding | 30 min | Document: (a) `--update-db` is now permanent (was "out of scope"), (b) bundled fixture has operational role beyond pre-install, (c) `source` telemetry field is the integrity contract. Without this, the implementation work is ADR drift. |
| ST-2 | Version-aware matcher: extend `ioc-namespaces.json` schema with `affected_versions` (semver range), update `matchNamespaceFixture` to honor it. Backwards-compat: if entry has no range, behave as today (still pure prefix — emits explicit `version_check: 'skipped'` field in hit). | 45 min | Without this, ST-3 cannot ship safely. |
| ST-3 | Wire fixture into default `scan` mode of `security-scan.mjs`. Display hits with `[NS-IOC]` tag. Count critical hits into `blockCount`. Emit `source: 'fixture'` in telemetry. | 30 min | Reuse `loadNamespaceFixture` from pre-install path. |
| ST-4 | Remote fixture refresh: `syncNamespaceFixture(rootDir)` fetches from pinned tag URL (`https://raw.githubusercontent.com/.../{tag}/.dw/security/ioc-namespaces.json`); current tag name lives in `.dw/security/fixture-pin.json` (committed); verify SHA-256 of body against pin; size cap 16 KB; schema validate. | 60 min | Telemetry: `sc_guard.fixture_sync` with `source: 'fixture'`, `tag`, `sha256`. |
| ST-5 | `dw doctor` fixture staleness check — uses `updated` field inside fixture JSON, NOT file mtime (black-bot critique #13). Warn if >14d. | 20 min | Symmetric to existing OSV snapshot staleness. |
| ST-6 | Operator runbook (`.dw/docs/fixture-publish-runbook.md`): TL workflow to bump fixture, cut signed tag, update `fixture-pin.json`, publish patch release. | 30 min | One-page checklist. |
| ST-7 | Smoke tests: matcher version-range OK, matcher range-miss skipped, fixture-driven scan-mode hit telemetry, fixture sync hash-mismatch rejected, fixture sync size-cap rejected. | 60 min | ~5-6 new cases. |
| ST-8 | CHANGELOG v1.4.x entry + version bump + release notes including "what changed since 1.3.6 and why we waited" | 20 min | Honest narrative — gated specifically to protect sunset metric. |
| **Total** | | **~5h** | Right at the ADR-0005 5h/cycle cap. |

## Open Questions

- **OQ1 — ADR amendment vs ADR-0006?** Amend ADR-0005 in-place, or write ADR-0006 superseding the relevant clauses? Amendment is lighter but pollutes the audit trail; supersede is cleaner. **My call: write ADR-0006 — `Supply-Chain Guard v1.4 Fixture Operationalization (supersedes ADR-0005 §Scope clauses on --update-db and fixture role)`.**
- **OQ2 — Pin format.** A git tag (`fixture-v1`) is human-readable but tag-mutability exists; a commit-SHA is immutable but opaque. **My call: commit-SHA in `fixture-pin.json`, with a comment noting which tag it was cut from. Belt and suspenders.**
- **OQ3 — Where lives the fixture publishing key?** If TL signs fixture commits with a hardware-backed key, the fetch can verify signature instead of (or in addition to) SHA pin. **My call: defer to ST-1 ADR amendment — needs explicit answer there.**
- **OQ4 — Ship before 2026-08-12 sunset review or after?** Shipping before could be seen as gaming the metric (suddenly fixture catches show up). Shipping after risks the feature retiring before it gets the chance to demonstrate value. **My call: ship within the v1.4 cycle AFTER review concludes; if review says "keep", v1.4 lands the fixture work as the second beat. If review says "retire", this task closes as "no need."**
- **OQ5 — pnpm/yarn lockfile support split or bundle?** Black-bot critique #8 noted ADR drift: hook fires on yarn/pnpm lockfiles but scanner ignores them. Worth bundling? **My call: split. Keeps this task ≤5h and the lockfile question is its own can of worms (lockfile format parsing, range translation).**

## Verification

- Black-bot's 14 critique points should each be addressed or explicitly accepted as residual risk before this task moves to `In Progress`.
- v1.3.6 telemetry must show ≥30 days of data with the new `source` field before the wiring lands (so we have a clean baseline to compare fixture-on-vs-off).
- Second-pair-of-eyes review by another dev (not the proposer) per reporter-is-author conflict-of-interest finding (black-bot critique #14).

## References

- GH issue + adversarial review: https://github.com/dv-workflow/dv-workflow/issues/7
- ADR-0005 (current): [.dw/decisions/0005-supply-chain-guard.md](../../decisions/0005-supply-chain-guard.md)
- v1.3.6 release commit: TBD (on `fix/sc-guard-chunked-sync-v1.3.6` branch)
- Multi-Agent Decision Pattern (5 known bugs): [.dw/research/multi-agent-decision-pattern.md](../../research/multi-agent-decision-pattern.md)
