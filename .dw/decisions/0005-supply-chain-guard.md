---
id: ADR-0005
title: AI-Native Supply-Chain Guard (Guards Pillar Extension)
status: Accepted
date: 2026-05-12
deciders: huydv (TechLead)
impact: minor
supersedes: null
superseded-by: null
extends: ADR-0001
voter-panel: 8 voters across 3 rounds (see research trail)
related-research:
  - .dw/research/supply-chain-guard-proposal.md
  - .dw/research/sc-guard-strategic-dispute.md
  - .dw/research/sc-guard-voter-panel-r3.md
  - .dw/research/supply-chain-incident-2026-05-12.md
  - .dw/research/multi-agent-decision-pattern.md
implementation-task: .dw/tasks/sc-guard-v1.3.5/
ship-target: v1.3.5 (2026-05-19 to 2026-05-22)
sunset-review: 2026-08-12 (90 days post-ship)
---

# ADR-0005: AI-Native Supply-Chain Guard (Guards Pillar Extension)

**TL;DR:** dw-kit v1.3.5 ships a supply-chain guard wired into AI coding workflow. Hook on Claude Code Edit/Write of lockfile files + auto-sync from OSV.dev + GitHub Security Advisories + CLI `dw security-scan` + `dw doctor` health check. Positions as **AI-Native Supply-Chain Guard** — first tool to assume AI agents (not humans) author lockfile edits. **Public 90-day sunset commitment**: if zero real catches OR >5% false-positive rate by 2026-08-12, feature retires silently.

---

## Context

### Triggering event

A supply-chain incident affecting popular npm namespaces occurred 2026-05-11. dw-kit itself and TechLead workstation verified unaffected (see [supply-chain-incident-2026-05-12.md](../research/supply-chain-incident-2026-05-12.md)).

### Strategic forces

- **Category-definition window**: marketing currency for "AI-Native Supply-Chain Guard" positioning closes ~10 days post-incident. Snyk/Socket/OSV-scanner all assume human-authored lockfiles. Cursor/Copilot/Sourcegraph do not own this space. First-mover claim available.
- **AI-specific risk profile**: AI agents add deps without scrutiny, favor trending packages (which are attacker targets), auto-approve installs. Measurably different exposure surface than human-author commits.
- **Existing pillar fit**: Guards pillar ("block unsafe actions") per PILLARS.md is explicitly allowed to grow. ADR-0001 cut-50% goal applies to skill/hook/rule duplication, not net-new pillar capability.
- **AI-augmented capacity**: 12-14h human-baseline effort compresses to ~4-5h TL time with Claude Code scaffold + existing dw-kit patterns reuse (telemetry, active-index, hook framework).

### Multi-Agent Decision Pattern run

Decision was stress-tested via 3 rounds of Multi-Agent Decision Pattern (8 voters total). See [sc-guard-voter-panel-r3.md](../research/sc-guard-voter-panel-r3.md) for raw outputs.

- Round 1: 7/8 voters AUP-blocked (Bug 4 discovered — security topic + threat detail in brief)
- Round 2: 5/6 voters AUP-blocked (Bug 4 v1 fix insufficient)
- Round 3 + GVC: 6/6 voters returned verdict (Bug 4 v2 sanitized self-contained brief + Bug 5 Goal/Value Champion added)

**Final tally**: A=1 (GVC high) / B=5 (mid-scope) / C=0 / D=1 (Solo Dev).

TechLead authority override of B-consensus based on:
- **Bug 5 — Effort-anchoring bias**: B-voters defaulted to human-effort calculus, did not apply AI-augmented capacity multiplier (~3-5x). GVC reframed.
- **TW6 — Public sunset commitment**: GVC's tweak converts "panic ship" critique into "disciplined experiment with kill-switch", neutralizing remaining objections.

---

## Options Considered

### Option A: Ship aggressive — v1.3.5 in 7-10 days, full scope (chosen)

- **Pros:**
  - Captures category-definition window before competitor claims AI-Native moat
  - AI-augmented capacity (~4-5h TL) makes timeline deliberate, not panic
  - Public 90-day sunset commitment baked into ADR + release blog provides explicit kill-switch
  - All 6 voter tweaks integrated (audit trail, doctor health, false-positive metric, solo opt-in, narrative pre-announce, sunset commitment)
  - Aligns with Guards pillar growth allowance per ADR-0001
- **Cons:**
  - Override of 5-voter B-consensus (mitigated by Bug 5 finding)
  - "Panic ship" perception risk (mitigated by public sunset + Bug 5 effort reframe)
  - Solo audience gets no value (mitigated by TW5 opt-in OFF default)

### Option B: Mid-scope v1.4.x patch (~3-6 weeks)

- **Pros:** Panel consensus (5 voters). Audit-friendly pacing. Lower urgency anxiety.
- **Cons:** Misses category-definition window (~10 days). Slower demonstration of incident-response capability. Bug 5 (effort-anchoring) showed this was conservatism, not calibration.

### Option C: Ultra-narrow 3-4h (DA Round 1, superseded)

- **Pros:** Minimum effort.
- **Cons:** DA's own refined position (Round 2) rejected this — too narrow to claim "guard" honestly = false-confidence trap.

### Option D: Defer

- **Pros:** Zero risk.
- **Cons:** Permanent loss of category-definition window. Solo Dev's "feature not for solo" concern addressed by opt-in OFF, doesn't justify wholesale defer.

---

## Decision

**Adopt Option A — Ship full scope as dw-kit v1.3.5 within 7-10 days, with 6 integrated tweaks.**

### Scope (in)

1. **Hook**: `.claude/hooks/supply-chain-scan.sh` — fires on Claude Code Edit/Write of `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`. Runs offline IoC + advisory check.
2. **OSV.dev + GHSA auto-sync adapter** (`src/lib/sc-sync.mjs`) — read-only fetch from official multi-maintainer feeds. **No solo IoC curation.** Pin feed snapshot SHA per fetch.
3. **Core scanner** (`src/lib/sc-scanner.mjs`) — parse npm/pnpm/yarn lockfiles, cross-reference deps with advisory snapshot.
4. **CLI** (`src/commands/security-scan.mjs`) — `dw security-scan [--quick] [--json]`. Manual trigger + doctor integration.
5. **Telemetry events** with feed-version + advisory-id + block/allow outcome (per TW2).
6. **`dw doctor` security section** with health check: fail loud if feed snapshot >7 days stale OR schema mismatch (per TW3).
7. **Public sunset commitment** baked into ADR + release blog: 90-day review at 2026-08-12 with explicit retire criteria (per TW6).

### Scope (out — forbidden during v1.3.5)

- Dashboard tile / freshness heuristic — defer to v2.0
- PyPI / Go / Cargo lockfile support — defer indefinitely (per ADR-0001 Won't Contain)
- Curated IoC bundle / canonical `dw-kit-ioc-bundle` repo — REPLACED by auto-sync (eliminates bus-factor)
- Manual `--update-db` flag — auto-sync is the only mechanism

### 6 Integrated Tweaks

| # | Source | Tweak | TL time |
|---|---|---|---|
| TW1 | OSS + Strategic Product | Pre-announce blog/X post within 7 days (claim narrative) | ~30 min |
| TW2 | Enterprise TL | Pin feed snapshot SHA + audit trail in events.jsonl (feed-version + advisory-id) | ~20 min |
| TW3 | Risk/Operational | `dw doctor` health check fail-loud if stale >7d or schema mismatch | ~15 min |
| TW4 | Enterprise TL | Sunset metric includes false-positive rate (≤5%), not just catch count | ~10 min |
| TW5 | Solo Dev | Opt-in OFF default for `solo` preset (feature exists but disabled) | ~10 min |
| TW6 | Goal/Value Champion | **Public sunset commitment in ADR + release blog** | ~15 min |

### Effort Budget

**Hard cap: 5 hours TL time** (12-14h human-baseline equivalent compressed via AI-augmented capacity).

Breakdown: hook ~45min + adapter ~30min + scanner ~30min + CLI ~20min + telemetry ~15min + doctor ~15min + tests ~30min + docs ~15min + 6 tweaks ~100min = ~5h.

Hard abort if exceeded.

### Timeline

| Day | Action | Owner |
|---|---|---|
| Day 1 (2026-05-13) | ADR-0005 finalize + pre-announce blog draft + scaffold task | TechLead |
| Day 2-3 | Implement core (hook + adapter + scanner) | TechLead + Claude Code |
| Day 4 | Implement CLI + `dw doctor` integration | TechLead + Claude Code |
| Day 5 | Implement 6 tweaks (audit trail, doctor health, FP metric, solo opt-in, sunset wording) | TechLead |
| Day 6 | Tests + smoke + docs + dry-run on dw-kit lockfile | TechLead |
| Day 7-8 | TL review + blog finalize + npm publish v1.3.5 + GitHub release | TechLead |
| Day 9-10 | Public announcement (blog/X) + team broadcast | TechLead |
| **2026-08-12** | **Sunset review per TW6** | TechLead |

### Owner

TechLead (huydv) — solo maintainer ownership matches solo decision authority.

### Public Sunset Commitment Text (TW6 — non-negotiable)

> "dw-kit v1.3.5 ships an experimental AI-native supply-chain guard. We commit to a 90-day review (target 2026-08-12): if telemetry shows zero real-world catches OR false-positive rate exceeds 5%, the feature is retired silently in v1.4.x. We will publish the review results regardless of outcome."

This is non-rhetorical: telemetry events from TW2 (feed-version, advisory-id, block/allow) produce machine-readable evidence for the review.

---

## Consequences

### Positive

- **Captures category-definition window** for AI-Native Supply-Chain Guard before commercial competitors retro-fit
- **Demonstrates incident-response capability** to 2 dev teams — builds organizational trust for v2.0 adoption
- **Workflow-integrated moat** at Claude Code Edit-lockfile boundary that Snyk/Socket cannot replicate without owning AI workflow
- **Auto-sync from OSV/GHSA** structurally dissolves the IoC bundle bus-factor concern (DA conceded this)
- **AI-augmented capacity** delivers full feature in ~5h TL time vs 12-14h human-baseline — Pragmatic Lean in action
- **Public sunset commitment** converts urgency to discipline, evidence-driven retain/retire decision
- **All 6 voter tweaks integrated** — audit trail, doctor health, FP metric, solo opt-in, narrative pre-announce, sunset transparency
- **Aligns with Guards pillar** per PILLARS.md without scope creep into duplication territory

### Negative (trade-offs accepted)

- **Override of 5-voter B-consensus** — TechLead authority used. Mitigated by Bug 5 (effort-anchoring) being a structural panel bias, not a calibration failure. Documented transparently.
- **TL time prediction (~5h) is bullish** — if AI-augmented capacity underperforms, hard cap forces abort. Risk: prototype incomplete at cap.
- **Auto-sync OSV/GHSA schema drift** — silent degradation possible. Mitigated by TW3 health check fail-loud.
- **First-mover positioning is forfeitable** — if delay even 2 weeks, competitor (Socket/Aikido/Cursor) may ship similar
- **Solo audience receives feature they don't need** — mitigated by TW5 opt-in OFF default; solo preset users see zero impact unless explicit enable
- **"AI-Native" marketing claim must hold up** — if community sees as repackaged Snyk, narrative backfires. Mitigated by hook-on-Edit-lockfile being genuinely novel integration point
- **90-day sunset risk** — if 0 real catches, retire silently. Reputation cost: dw-kit shipped feature that didn't earn keep. Mitigation: public commitment frames as deliberate experiment, not failure

### Neutral

- Guards pillar grows by 1 hook + 1 CLI command + 1 doctor section — modest surface increase
- Telemetry events extend existing schema (no migration required)
- npm package size impact <5% (no new dependencies; OSV/GHSA fetched at runtime)

---

## Abort Triggers

| # | Signal | Action |
|---|---|---|
| N1 | TL time exceeds 5h hard cap | Abort. Document overrun in tracking. Retire from v1.3.5 plan, revisit at v1.4.x. |
| N2 | OSV/GHSA API unavailable during impl | Abort. Cannot ship without auto-sync (would re-introduce bus-factor). |
| N3 | Team beta feedback flags critical UX break | Abort v1.3.5 publish. Triage in v1.3.6 patch. |
| N4 | Pre-announce blog discovered duplicate-of-competitor positioning | Abort, re-position narrative before publish |
| N5 | Sunset review (2026-08-12) shows 0 catches + FP rate >5% | Retire silently in v1.4.x per TW6 commitment |

---

## Sunset Review Protocol (TW6 binding)

**Date: 2026-08-12** (90 days post-ship)

**Data sources:**
- `.dw/metrics/events.jsonl` — block/allow events with feed-version + advisory-id
- `dw doctor` historical output snapshots
- Community feedback (GitHub issues, npm download trends)

**Retain criteria (any one sufficient):**
- ≥1 verified real catch (true-positive supply-chain advisory match)
- False-positive rate ≤5% across all scans
- ≥3 external community adoption signals (issues, PRs, downloads, blog mentions)

**Retire criteria (all required):**
- Zero verified real catches
- OR false-positive rate >5%

**Publication:**
- Review results published in v1.4.x release notes regardless of outcome
- If retire: silent removal of code + retain ADR-0005 with status `Superseded — feature retired per TW6`

---

## Open Questions (resolve during implementation)

1. **Pre-announce blog title/body** — finalize in [.dw/research/sc-guard-launch-blog-draft.md](../research/sc-guard-launch-blog-draft.md)
2. **OSV.dev API rate limits** — fallback strategy if hit during sync
3. **GHSA feed format stability** — pin schema version, verify on each sync
4. **CLI output formatting** — JSON vs human-readable; default and `--json` flag
5. **Settings.json hook registration** — wire `supply-chain-scan.sh` to PostToolUse for lockfile patterns

---

## References

- Parent ADR: [ADR-0001](0001-v2-pragmatic-lean.md) — v2.0 5-pillar architecture, cut-50% goal, Won't Contain list
- Related deferred: [ADR-0003](0003-pillar-6-janitors.md) — Pillar 6 Janitors (preventive ≠ reactive)
- Pattern doc: [multi-agent-decision-pattern.md](../research/multi-agent-decision-pattern.md) — 5 bugs documented during this decision
- Strategic dispute: [sc-guard-strategic-dispute.md](../research/sc-guard-strategic-dispute.md) — voter brief artifact
- Voter raw outputs: [sc-guard-voter-panel-r3.md](../research/sc-guard-voter-panel-r3.md)
- Original proposal: [supply-chain-guard-proposal.md](../research/supply-chain-guard-proposal.md) (Section 10 supersedes earlier scope)
- Incident report: [supply-chain-incident-2026-05-12.md](../research/supply-chain-incident-2026-05-12.md)
- Architecture: [PILLARS.md](../core/PILLARS.md) — Guards pillar
- External: [OSV.dev API](https://osv.dev/docs/), [GitHub Security Advisories](https://github.com/advisories)
- Inspirations (acknowledged but not duplicated): [Socket.dev](https://socket.dev), [Snyk](https://snyk.io), [StepSecurity Harden-Runner](https://www.stepsecurity.io)

---

**Status: Accepted. Implementation begins 2026-05-13. Sunset review committed for 2026-08-12.**
