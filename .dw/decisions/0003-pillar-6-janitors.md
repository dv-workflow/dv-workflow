---
id: ADR-0003
title: Pillar 6 "Janitors" — Autonomous Code Waste Management Layer
status: Draft
date: 2026-04-21
deciders: huydv
impact: major
supersedes: null
superseded-by: null
extends: ADR-0001
---

# ADR-0003: Pillar 6 "Janitors" — Autonomous Code Waste Management Layer

**TL;DR:** Add a 6th pillar to v2.0 architecture dedicated to **reactive** cleanup of AI-generated waste (rác sinh bởi agent coding). Current 5 pillars (Guards/Surfaces/Records/Bridges/Tunes) are **preventive** — they govern what goes in. Janitors pillar governs what stays. Inspired by urban waste management analogy: prevention alone cannot scale when 99% of code is AI-generated.

**Status: DRAFT — defer implementation, revisit after v2.0 ships (post 2026-08-15).**

---

## Context

### Triggering Insight (2026-04-21 conversation)

Framing: "If 99% of code in an AI-first project is agent-generated, TechLead cannot review everything. Cities solve this with multi-tier waste management: household sorting → collection → sorting centers → recycling plants → regulations → education → street cleaners. Apply same architecture to code."

### Problem (why current 5 pillars are insufficient)

AI agents inherently produce 5 classes of "code waste" that prevention cannot fully eliminate:

| Pattern | Root cause in LLM behavior |
|---------|---------------------------|
| Over-engineering | RLHF bias toward "professional-looking" patterns |
| Defensive noise (unused try/catch, over-validation) | Uncertainty → "safer to add than omit" |
| Scope creep (fix X, refactor Y) | Reward hacking — appearing more helpful |
| Comment/docstring bloat | Training signal: more docs = more professional |
| Duplicate/drift (new util instead of reuse) | Insufficient codebase context |

Current v2.0 pillars address **source-level prevention**. Missing: **lifecycle cleanup**. Over time waste accumulates → codebase decays → AI learns from decayed codebase → waste compounds (feedback loop).

### Strategic Forces

- Differentiation: existing AI coding tools (Copilot, Cursor, Sourcegraph) focus exclusively on generation + prevention. No tool owns the **janitorial lifecycle**. First-mover moat.
- Scalability: 10 devs × AI-augmented = 50-100 effective devs of output volume. Manual review breaks at ~30 PR/day/reviewer.
- Aligns with v2.0 framing inversion (descriptive governance): Janitors describes "what should be cleaned up and why" — AI drives the cleanup, humans approve.

### Analogy: Urban Waste Management → Code

| City tier | Code tier | dw-kit status |
|-----------|-----------|---------------|
| Household sorting | AI self-critique before commit | Partial (white/black-bot in /dw:kit-evolve) |
| Daily collection (trucks) | Pre-commit hooks, deterministic scans | Have |
| Sorting center (transfer station) | Weekly classifier agent → 4 buckets | **Gap** |
| Recycling plant | Monthly refactor agent (dedup, simplify) | **Gap** |
| Regulations + fines | CI gates, hard stops | Rules exist, enforcement partial |
| Public education | Quarterly kit-audit → rule updates | Have (/dw:kit-audit) |
| Street sweepers | Scheduled autonomous cleanup sprint | **Gap** |

Three explicit gaps map to three sub-components of Janitors pillar.

---

## Options Considered

### Option A: Do nothing (reject)
Rely on Guards + human review.
- **Pros:** Zero build cost; no risk of over-deletion.
- **Cons:** Does not scale past ~10 devs / ~30 PR/day; codebase decay inevitable; misses differentiator window.
- **Rejected because:** Insight frames this as structural, not tactical.

### Option B: Extend Guards pillar (reject)
Add reactive scan features inside existing Guards.
- **Pros:** No architectural change; lower documentation burden.
- **Cons:** Conflates preventive (synchronous, block) with reactive (async, propose). Different failure modes, SLAs, trust models — forcing them into one pillar muddies mental model.
- **Rejected because:** Framing inversion (v2.0 thesis) demands clean verb-based pillars.

### Option C: New pillar "Janitors" (chosen, deferred)
Standalone 6th pillar with 3 sub-components.
- **Pros:** Clean conceptual separation; differentiator-worthy; extensible.
- **Cons:** Risk of feature creep; must not dilute v2.0 ship focus; over-deletion risk requires careful design.
- **Chosen, but:** Defer implementation until v2.0 ships. Draft ADR to capture thinking; no code changes yet.

---

## Decision (Draft)

**Accept Pillar 6 "Janitors" conceptually. Defer implementation — revisit post v2.0 GA (target: 2026-Q4 or v2.1).**

### Pillar Definition

| Pillar | Verb | Role | Timing |
|--------|------|------|--------|
| 6. **Janitors** | Clean reactive | Autonomous waste lifecycle | Async, post-commit |

### Sub-components (three gaps)

**6a. Classifier Agent (weekly) — "Sorting Center"**

Scans diff of the week, classifies each change into 4 buckets:
- `trash/obvious` — no import/caller, added this week → auto-PR proposing deletion
- `trash/likely` — 1 callsite abstraction, test bloat without new branch coverage → PR with confirm gate
- `trash/debate` — stale TODO >90 days, comment ratio anomaly → backlog item (60-day expiry)
- `keep` — ignore

Design constraints:
- Deterministic rules run first (cheap); LLM invoked only on inconclusive cases (bounded cost)
- Every action goes through PR; no auto-merge
- Freeze list (`.dw/config/cleanup-freeze.yml`) exempts sensitive paths (security, migrations, domain core)

**6b. Refactor Agent (monthly) — "Recycling Plant"**

Identifies and proposes refactors:
- Duplicate logic → propose unified abstraction
- Abstraction with <2 callsites added in last N days → propose inline
- Only runs on low-churn files (proxy for "stable, safe to refactor")

**6c. Cleanup Sprint (monthly) — "Street Sweepers"**

Autonomous agent produces one PR `cleanup-sprint-YYYYMM` with:
- Constraints: tests must pass; no public API changes; no behavior changes
- Bounded scope: ≤5% LOC/month churn budget
- Rate-limited per file

### Key Design Principles

1. **Deterministic first, LLM second** — cost control
2. **Always PR, never direct commit** — human gate
3. **Freeze list is sacred** — opt-out respected
4. **Budget-bounded** — no runaway cleanup
5. **Metric-backed** — false-positive rate tracked; rollback easy

### Required New Artifacts

- `.dw/config/cleanup-freeze.yml` — freeze list schema
- `.dw/config/waste-taxonomy.yml` — canonical 5-pattern schema (classifier input)
- Report template for cleanup PRs — 2-minute review format
- Telemetry events: `janitor.classify`, `janitor.refactor`, `janitor.sweep`

---

## Consequences

**Positive:**
- Unique differentiator — no competing tool owns autonomous cleanup lifecycle
- Scales TechLead effort beyond 1:1 review model
- Closes feedback loop: cleanup results → Tunes pillar → improved prevention
- Aligns with descriptive framing (AI drives, human approves)

**Negative (trade-offs accepted):**
- Architectural surface grows — 5 → 6 pillars (documentation + onboarding cost)
- Risk of over-deletion if rules under-developed → mitigated by freeze list + PR gate + revert easy
- LLM inference cost for classifier → mitigated by deterministic-first design
- Dev trust risk ("AI is deleting my code") → mitigated by opt-out markers (`// keep: reason`) and reject-with-reason feedback loop

**Neutral:**
- Pillar stable as concept; sub-components (6a/6b/6c) can ship independently
- May subsume parts of Guards (reactive scanning) — clean up during implementation

---

## Deferral Rationale

**Do NOT implement before v2.0 GA (2026-08-15).** Reasons:
1. v2.0 scope discipline (Won't Contain list enforcement) — adding now = scope creep
2. Need v2.0 telemetry data to size the problem (how much waste actually accumulates?)
3. Need Records pillar mature first — Janitor decisions must be auditable
4. User (TechLead) has other work to ship first

**Revisit triggers:**
- v2.0 ships successfully (≥4/5 success criteria met)
- Telemetry shows measurable waste accumulation post-v2.0
- User explicitly unblocks implementation

---

## Open Questions (to resolve at un-defer)

1. **Taxonomy schema format** — YAML? JSON? Inline in ADR?
2. **Freeze list granularity** — file-level? Function-level via annotation?
3. **Classifier trigger** — cron? Git hook? GitHub Action?
4. **Inter-pillar coupling** — does Janitor write to Records (ADR) when rejecting a cleanup? Where does audit trail live?
5. **Dogfood path** — test on dw-kit itself first, then roll to 2 internal teams?
6. **Cost model** — acceptable $/month for LLM inference on classifier per team size?

---

## References

- Parent ADR: [ADR-0001](0001-v2-pragmatic-lean.md) — v2.0 5-pillar architecture
- Conversation transcript: 2026-04-21 thinking session on "AI agent code waste"
- Related concept: industry comparables (Sourcegraph Batch Changes, Codacy, SonarQube) — none owns autonomous lifecycle, all are report-only
- Memory: `project-pillar-6-janitors.md`
