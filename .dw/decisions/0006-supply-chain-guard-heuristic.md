---
id: ADR-0006
title: Supply-Chain Guard — AI-Native Heuristic Detection (v1.3.6 scope expansion)
status: Accepted
date: 2026-05-14
deciders: huydv (TechLead)
impact: minor
supersedes: null
superseded-by: null
extends: ADR-0005
related-issue: https://github.com/dv-workflow/dv-workflow/issues/7
implementation-task: .dw/tasks/sc-guard-v1.3.5/ (v1.3.6 expanded scope)
ship-target: v1.3.6 (2026-05-14 / 2026-05-15)
---

# ADR-0006: Supply-Chain Guard — AI-Native Heuristic Detection

**TL;DR:** v1.3.6 expands the supply-chain guard from "scan against curated/indexed advisories" to "detect at the moment AI introduces a dependency." Three pillars: (1) OSV snapshot (already shipped), (2) curated fixture wired into default scan with version-aware matching, (3) **npm registry metadata heuristic** firing on `PostToolUse` hook when Claude Code edits a lockfile. Pillar 3 is the structural AI-Native moat — catches zero-day-ish risk before OSV indexes and before any human curator (TL or maintainer) sees the incident.

---

## Context

### What ADR-0005 left unsolved

ADR-0005's sunset criteria expect "zero real catches" to retire the feature. The 2026-05-11 TanStack incident validated the gap: when the issue reporter ran `dw security-scan` on 2026-05-13 (Day 2 of the incident), it returned 0 matches against `@tanstack/*` packages already in their lockfile. OSV hadn't indexed; the bundled fixture wasn't wired into the default scan path; and the only human signal (TL fixture bump) requires npm publish + global reinstall — 24-72h reaction time.

### The pain point in user words

> "vul vừa xảy ra → end user kịp thời phản ứng"
>
> "vẫn cần chờ TL phát hiện vul? có cách nào để trong quá trình làm việc mà cũng có thể phát hiện thì sao? mà lại tối ưu không phải lúc nào cũng quét realtime"

Translation: detection must happen at the AI-edit boundary, without human-in-the-loop, and without scanning the world on every keystroke.

### The structural insight

dw-kit's unique position is the **AI-edit boundary**. The `PostToolUse` hook already fires on lockfile changes. At that boundary, dw-kit can:
- See exactly which packages are NEW (diff old vs new lockfile)
- Query authoritative source (npm registry — same trust root as `npm install` itself)
- Apply zero-day-ish heuristics that don't require any human curator
- Cache aggressively because the same package rarely appears twice in a 1h window

Competitors (Snyk, Socket, OSV-scanner) all assume human-authored lockfiles and scan post-commit. None embed at AI-edit boundary. This is the "first-mover claim" of ADR-0005's category-definition window.

---

## Decision

v1.3.6 ships three pillars working together:

### Pillar 1 — OSV snapshot (already in v1.3.5 + v1.3.6 chunking fix)

- `dw security-scan --update-db` → fetch from osv.dev `/v1/querybatch`
- Chunked at 1000, allSettled, retry/backoff (shipped earlier in this cycle)
- Catches: known + indexed advisories. Latency 2-7 days from incident.

### Pillar 2 — Curated fixture wired into default scan (new in v1.3.6)

- `matchNamespaceFixture` honored in default `dw security-scan` mode (currently only in `--pre-install`)
- **Version-aware matcher**: schema extended with `affected_versions` (semver range); entries without range emit `version_check: 'skipped'` field and downgrade severity to medium
- Telemetry `source: 'fixture'` + `block_source: 'fixture'` (shipped earlier in this cycle's telemetry forward-compat work)
- Catches: known incidents TL has bumped into fixture. Latency: TL response time + npm publish cycle.

### Pillar 3 — AI-Native NEW-package heuristic (new in v1.3.6 — the moat)

**Trigger**: `PostToolUse` hook fires when Claude Code Write/Edit lockfile (already in place from v1.3.5).

**Pipeline**:

1. **Diff lockfile**: read `HEAD` revision via `git show HEAD:package-lock.json`, compare with current. List NEW package@version pairs only. Optimization: ≤5 NEW packages typical, not 1000+ full scan.
2. **Fetch metadata** for each NEW package from `registry.npmjs.org/{name}` (per-package endpoint, no auth). Returns: `time.{version}` (publish ISO date), `time.modified`, `maintainers[]`, `versions[]`.
3. **Heuristic scoring** (composite, weighted):
   - `recent_publish`: version published <72h ago → +30 risk points
   - `very_recent_publish`: version published <24h ago → +50 risk points
   - `popular_package`: `weekly_downloads ≥10k` (from `registry.npmjs.org/-/package/{name}/dist-tags` or `npms.io` API) → +20 points
   - `maintainer_change`: any maintainer added/removed in last 30 days → +40 points
   - `major_version_jump`: jump from major X to X+1 within same install → +15 points
   - `typo_squat`: package name within Levenshtein-distance 1 of a popular package (top 1000 list bundled) → +60 points
4. **Cache**: per-package metadata cached at `.dw/security/npm-registry-cache.jsonl`, TTL 1h. Cache hit avoids network entirely.
5. **Report**: stderr non-blocking (matching pillar 1 + 2 convention). Compose human-readable line per NEW package above threshold (default: ≥50 risk points).
6. **Telemetry**: `sc_guard` event with `source: 'heuristic'`, `signal: { recent_publish, maintainer_change, ... }`, `risk_score`. Tracked separately from fixture/OSV in `supplyChainBySource` for sunset metric integrity.

**Tunable threshold** via `.dw/config/dw.config.yml`:

```yaml
security:
  heuristic:
    risk_threshold: 50      # default; raise to reduce FP, lower to widen catch
    weekly_downloads_min: 10000
    recent_publish_hours: 72
```

---

## Optimization (user explicit ask)

User said: "tối ưu không phải lúc nào cũng quét realtime."

- **Hook fires only on lockfile change** (already; PostToolUse matcher `Write|Edit`)
- **Diff-based** — only NEW packages, not full lockfile rescan
- **Metadata cached** 1h per package — repeated edits of same package = single network call
- **OSV snapshot lazy-refresh** — `dw security-scan` checks staleness before scan, doesn't force sync on every command
- **Top-1000 popular list bundled offline** — no network call for typo-squat detection
- **Heuristic short-circuits** — if `recent_publish` is false AND `maintainer_change` is false AND name not in typo-squat radius → skip remaining checks entirely

---

## Trust model

- **npm registry (`registry.npmjs.org`)** is the source of truth for npm package metadata. Same trust root as the `npm install` the user is already running. No additional attack surface.
- **No remote fixture fetch in v1.3.6** — defers the signed-pin trust model question to a later cycle. Bundled fixture remains TL-curated via npm publish cycle. Pillar 3 covers the latency gap.
- **No third-party vendor** (Socket/Aikido/Snyk) — ADR-0005 §Won't-Contain still holds.

---

## False-positive management

Pillar 3 will FP more than pillars 1+2. Mitigations:
- **Conservative default threshold** (50 risk points = at least 2 strong signals).
- **Tunable** per project via `dw.config.yml`.
- **Telemetry separates `source: heuristic`** so the 2026-08-12 sunset review can compute FP rate per pillar — pillar 3's higher FP doesn't pollute pillar 1+2 metrics.
- **Non-blocking by default** — reports to stderr but doesn't fail the hook. User decides whether to revert lockfile edit.

---

## Effort & ADR-0005 cap override

ADR-0005 set a 5h/cycle TL hard cap. v1.3.6 expanded scope (this ADR) consumes ~9h total:
- Pillar 1 chunking (already): 2.5h
- Pillar 2 fixture wire + version matcher: 2h
- Pillar 3 (this ADR's core): 4-5h

**Cap intentionally overridden** because the user goal "vul → end-user phản ứng kịp" is the pillar 3 sentence in the project's product positioning. Shipping without it leaves the AI-Native moat unproven and dilutes the marketing claim made in ADR-0005's release blog. Override documented here, not buried.

---

## Sunset review impact (ADR-0005 §Sunset)

Sunset criteria (retire if 0 catches OR FP rate >5% by 2026-08-12) still apply, **but evaluated per pillar**:
- Pillar 1 (OSV): existing criteria
- Pillar 2 (fixture): existing criteria  
- Pillar 3 (heuristic): separately tracked; if pillar 3 alone shows ≥1 verified catch where pillars 1+2 missed, that is the AI-Native moat evidence the marketing positioning needs

Telemetry `supplyChainBySource` (added in this v1.3.6 cycle, before pillar 3 wired) gives the clean baseline for that comparison.

---

## Deferred to v1.3.7 / v1.4

- **Remote fixture refresh** (signed-pin from pinned commit-SHA) — pillar 3 reduces the urgency since pillar 3 catches don't need a TL bump. Defer to v1.4 task ([sc-guard-v1.4-fixture-wiring](../tasks/sc-guard-v1.4-fixture-wiring/spec.md)).
- **pnpm / yarn lockfile support** — separate scope.
- **Monorepo workspace discovery** — separate scope.
- **Maintainer-change deep history** — v1.3.6 ships the field but only checks last 30 days; deeper history requires authenticated npm token (rate limit).

---

## References

- Adversarial review (white-bot + black-bot): https://github.com/dv-workflow/dv-workflow/issues/7#issuecomment-4439674988
- ADR-0005 (extended by this ADR): [.dw/decisions/0005-supply-chain-guard.md](0005-supply-chain-guard.md)
- v1.3.6 task tracking: [.dw/tasks/sc-guard-v1.3.5/tracking.md](../tasks/sc-guard-v1.3.5/tracking.md)
- Multi-Agent Decision Pattern 5 known bugs: [.dw/research/multi-agent-decision-pattern.md](../research/multi-agent-decision-pattern.md)
