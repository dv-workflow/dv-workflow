---
id: ADR-0004
title: Bayesian Inference Pilot — UC2 Credible Interval for Cut-Analysis (Opt-in)
status: Proposed
date: 2026-05-12
deciders: huydv
impact: minor
supersedes: null
superseded-by: null
extends: ADR-0001
related-research:
  - .dw/research/bayesian-verdict-v1.1.md
  - .dw/research/bayesian-verdict.md
  - .dw/research/bayesian-dw-thinking.md
  - .dw/research/bayesian-plain.md
---

# ADR-0004: Bayesian Inference Pilot — UC2 Credible Interval for Cut-Analysis (Opt-in)

**TL;DR:** Adopt Bayesian inference *narrowly* as an opt-in reporting layer (`dw metrics cut-analysis --bayesian`) for v1.4 retro analysis, with 4 guardrails. Threshold matrix in [v14-evaluation-protocol](../core/v14-evaluation-protocol.md) remains the authoritative cut decision rule. All other Bayesian use cases (depth routing, effort calibration, debate weighting, ADR-superseded prediction, risk scoring) are rejected or deferred.

**Status: Proposed.** Pending TechLead approval after PR review.

---

## Context

### Triggering Investigation

TechLead investigated whether Bayesian inference (per [Wikipedia: Bayesian inference](https://en.wikipedia.org/wiki/Bayesian_inference)) can add value to dw-kit. Two independent research agents produced reports with conflicting verdicts:

- [Agent A](../research/bayesian-dw-thinking.md) (applying dw-thinking framework): **DEFER** — 6/7 use cases fail "obsolescence test" (less valuable as AI improves). Cold-start data insufficient.
- [Agent B](../research/bayesian-plain.md) (plain analysis): **Adopt narrow** — 2 use cases (cut-analysis credible interval + estimate calibration) have real ROI.

A Senior Technical Arbiter (Opus 4.7) ran inline debate on 4 contention points and ruled **PILOT UC2 only**. A subsequent voting round with 5 specialist agents (Solo Dev, Enterprise TL, OSS Maintainer, Data Pragmatist, Risk/Security) returned **1 AGREE / 4 MODIFY / 0 reject** — verdict correct in direction, requires guardrails. Voters' MODIFY tweaks were independent and additive (governance, statistical, risk, audit).

### Forces

- **ADR-0001 commitment**: ship v2.0 by 2026-08-15. Anything that risks slip must be cut.
- **v1.4 cut-decision protocol** ([v14-evaluation-protocol](../core/v14-evaluation-protocol.md)) is already finalized with threshold matrix + qualitative survey gate. Mid-flight rule change = de-facto re-open ADR.
- **Telemetry data quality**: known issue — session-hash undercount inflates uses/dev ratios (biased toward keep, conservative for cut decisions).
- **Obsolescence principle** ([PILLARS](../core/PILLARS.md)): features that become *less valuable* as AI improves should not be core. Bayesian decision engines fall in that bucket; Bayesian *reporting* for human/audit consumption does not.
- **Audience asymmetry**: solo preset users see ~zero value (no team metrics); team/enterprise see moderate value (defensible cut documentation).

### Problem framing

Cut decisions for under-used skills currently use point estimates compared to thresholds. When a measurement is borderline (e.g., 4.2 uses/week vs threshold 5), the threshold protocol falls back to a qualitative survey, which absorbs uncertainty informally. Bayesian credible interval would formalize that uncertainty: *"P(rate < threshold | data) = 0.74"* — same data, more interpretable supplement.

Risk: framing this as a decision-rule replacement re-opens ADR-0001 commitments and risks scope creep. Framing as opt-in reporting supplement avoids that.

---

## Options Considered

### Option A: Reject Bayesian entirely (close issue)

- **Pros:** Zero scope risk; full focus on v1.4 ship + v2.0 prep. Aligns with A-report stance.
- **Cons:** Loses defensibility benefit for borderline cut cases. B-report's narrow UC2 argument unanswered. Team has done analysis work; closing without trial means re-litigating later if value materializes elsewhere.
- **Rejected because:** 4/5 voters did not reject; benefit-cost on UC2 narrow case is positive when guardrails included.

### Option B: Adopt broadly (multiple UCs, default-on)

- **Pros:** Captures full B-report scope (UC2 + UC3 estimate calibration). Investment amortizes across more features.
- **Cons:** Fails obsolescence test for 5/7 UCs (A-report). Data sufficiency missing for UC3 (≥30 paired observations/module, current rate <5/month). Marketing risk: "Bayesian governance" is HN-roast-prone. Scope creep into ADR-0001 cut-50% goal.
- **Rejected because:** 4/4 contention rulings in arbiter verdict favored narrow scope; voter Data Pragmatist independently flagged identifiability issues.

### Option C: PILOT UC2 narrow + 4 guardrails (chosen)

- **Pros:**
  - Captures the *one* defensibility-positive use case both agents agreed on (AG1 in [verdict v1.0](../research/bayesian-verdict.md)).
  - Opt-in flag = zero impact on solo preset; minimal doc burden.
  - 4 guardrails (governance / statistical / risk / audit) address all voter concerns.
  - Threshold matrix unchanged — ADR-0001 cut-50% goal protected.
  - 12h hard cap with clear abort path.
- **Cons:**
  - +50% cap inflation vs v1.0 (8h → 12h) — voters' added guardrails are not free.
  - Audience hit: solo preset users get no value (Solo Dev voter's KEY_RISK).
  - Semantic-drift risk over 6 months (Risk/Security voter); mitigated by abort trigger N5.
  - Sociotechnical adoption risk: if devs find banner annoying, they may bypass — needs Phase 2 evaluation.
- **Chosen because:** Voter tally (1 AGREE / 4 MODIFY) endorses direction; guardrails close known gaps; effort is bounded; reversible (silent removal path in v1.4.2 if Phase 2 finds redundant).

---

## Decision

**Adopt Option C: PILOT UC2 narrow with 4 integrated guardrails.**

### Scope (in)

- New CLI flag `dw metrics cut-analysis --bayesian` (default OFF).
- Library `src/lib/bayesian-stats.mjs` (~120 LOC): Beta-Binomial + Poisson-Gamma conjugate posteriors, 95% credible intervals, ROPE check.
- Output format: aggregate-only (per-skill, across all devs), with hard CLI banner stating "ADVISORY — NOT a decision rule."
- Sidecar JSON file emitted alongside CLI output, containing prior params, n, data caveats, ROPE, posterior result, code version hash.
- PR linter script that blocks merge of any cut ADR citing `--bayesian` output if sidecar JSON not embedded in ADR appendix.
- CHANGELOG note marking the flag as experimental, scope-locked.
- GitHub issue template auto-label `bayesian-expansion` with canned response linking this ADR + Trigger T7 (abort path).
- One section in [v14-evaluation-protocol](../core/v14-evaluation-protocol.md) describing opt-in usage.
- One ≤2-page Beta-Binomial primer linked from the protocol doc.

### Scope (out — forbidden during pilot)

- New skill `/dw:bayes` — forbidden.
- New rules file (`.dw/core/BAYESIAN.md`) — forbidden.
- Mention in README marketing — forbidden.
- Application to UC1 (depth routing), UC3 (estimate calibration), UC4 (debate weighting), UC5 (Janitor classifier), UC6 (ADR-superseded prediction), UC7 (risk scoring) — forbidden.
- Replacement of threshold-based cut decision rule — forbidden.
- Per-dev breakdown in output — forbidden (privacy + privacy guardrail TW3).

### 4 Integrated Guardrails

| # | Guardrail | Source voter | Effort | Mechanism |
|---|-----------|--------------|--------|-----------|
| TW1 | Governance scope-lock | OSS Maintainer | 0.75h | CHANGELOG note + issue template + silent-removal path |
| TW2 | Statistical pre-registration | Data Pragmatist | 1h | Prior choice doc + sensitivity check + min-n=10 + ROPE ±20% |
| TW3 | Semantic-drift containment | Risk/Security | 0.75h | Aggregate-only + hard banner + telemetry event + abort trigger N5 |
| TW4 | Audit lineage sidecar | Enterprise TL | 1.5h | JSON sidecar + PR linter gate on cut ADR appendix |

Full guardrail details in [verdict v1.1 §3](../research/bayesian-verdict-v1.1.md#3-integrated-tweaks).

### Effort Budget

**Hard cap: 12 engineering hours.** Breakdown: 5.5h core + 4h guardrails + 0.5h tests + ~2h docs/issue templates. Hard abort if exceeded.

### Timeline

| Phase | Window | Gate |
|-------|--------|------|
| 0 — This ADR moves Proposed → Accepted | 2026-05-12 to 2026-05-19 | Team PR review |
| 1 — Prototype | 2026-07-01 to 2026-07-08 (post-v1.4 ship) | P1, P2, P3 pre-conditions met |
| 2 — Retention decision | 2026-07-15 | Success criteria evaluation |
| Conditional removal | 2026-08-01 (v1.4.2) | If Phase 2 outcome = redundant |

### Owner

TechLead (huydv). No delegation; solo maintainer ownership matches solo decision authority.

---

## Consequences

### Positive

- Cut decisions in v1.4 retro can be supplemented with credible interval evidence, improving defensibility for enterprise/team audience without changing the authoritative decision rule.
- Reversible by design: silent removal path (TW1) in v1.4.2 if Phase 2 finds redundant — no v2.0 cycle wait.
- 4 guardrails (TW1-4) address voter-identified risks pre-emptively, not reactively.
- ADR-0001 timeline (v2.0 ship 2026-08-15) untouched — pilot is *after* v1.4 ship, *before* v2.0 cuts begin.
- Pillar mapping: Tunes (opt-in flag) + Records (sidecar in ADR appendix). No new pillar required.

### Negative (trade-offs accepted)

- 12h is not zero; opportunity cost is real (4 voters add 4h vs v1.0's 8h cap). Trade-off accepted because guardrails are front-loaded, not retrofittable.
- Solo preset users get no value (Solo Dev voter's KEY_RISK). Trade-off accepted because flag is opt-in — zero impact when unused.
- Sidecar schema designed pre-first-use; may need v1.4.1 → v1.4.2 schema iteration. Version field in sidecar mitigates.
- Semantic-drift risk over 6 months (Risk/Security voter). Mitigated by abort trigger N5 (≥2 cut ADRs cite CI as primary → auto-reject).
- "Bayesian" word in CLI may attract issue traffic from community wanting broader adoption. Mitigated by TW1 canned response + scope-lock note.
- Sub-agent debate ran inline (Task tool unavailable in arbiter environment per [verdict v1.0 §3 Method note](../research/bayesian-verdict.md#3-debate-transcript)). Voting round (separate spawn from main thread) partially compensated. Confidence in decision: ~80%.

### Neutral

- Bayesian library (`src/lib/bayesian-stats.mjs`) is conjugate-only, ~120 LOC; can be deleted in one commit if Phase 2 rejects.
- Existing telemetry schema unchanged; sidecar JSON is new file, not migration.
- No external dependency added (conjugate math is closed-form).

---

## Abort Triggers (consolidated)

| # | Signal | Action |
|---|--------|--------|
| N1 | v1.4 ship slips past 2026-07-15 | Abort entire pilot. Focus on shipping. |
| N2 | Prototype hits 9h with no working core output | Cut scope to CI-only (skip ROPE/Poisson), or abort. |
| N3 | Devs ask "what does P=0.74 mean?" in cut ADR review | Document fails interpretability; remove silently per TW1. |
| N4 | TL bandwidth saturated by v2.0 prep | Defer to v2.1 window. |
| N5 | ≥2 cut ADRs cite credible interval as PRIMARY justification (not supplement) | Drift to gate realized; auto-reject Bayesian per T7. |

---

## Revisit Triggers

| # | Trigger | Re-open scope |
|---|---------|--------------|
| T1 | dw-kit adoption ≥50 devs with poolable telemetry | UC2 + UC3 (data unlocks) |
| T2 | Pillar 6 Janitors un-deferred per ADR-0003 | UC5 in detail |
| T3 | Enterprise customer demands credible interval (regulatory) | UC2 from opt-in → default |
| T4 | Log-work coverage ≥60% × 6 consecutive months | UC3 |
| T5 | Anthropic SDK exposes well-calibrated token posteriors | UC4 (debate weighting) |
| T6 | v1.4 retro shows threshold matrix produced clearly wrong cuts | UC2 from opt-in → default; revisit framing |
| T7 | UC2 prototype found redundant in Phase 2, OR N5 triggered | Reject Bayesian entirely. Remove flag. Close issue. |
| T8 | Median per-skill n ≥ 30 events for 3 consecutive months | Revisit aggregate-only constraint; may unlock per-dev with privacy review |

---

## Open Questions

1. **CHANGELOG note wording** — exact text deferred to Phase 1 day 1 design doc.
2. **Sidecar schema versioning policy** — semver alongside dw-kit, or independent? Decide at Phase 2.
3. **Banner string final wording** — current draft in [verdict v1.1 §3 TW3](../research/bayesian-verdict-v1.1.md#tw3--risk-containment-from-risksecurity); finalize during Phase 1.
4. **Min-n threshold (currently 10)** — re-evaluate after first real run. May tighten to 20 if CI quality poor at n=10.

---

## References

- Parent ADR: [ADR-0001](0001-v2-pragmatic-lean.md) — v2.0 5-pillar architecture (constraint anchor)
- Related (deferred) ADR: [ADR-0003](0003-pillar-6-janitors.md) — UC5 parent
- Research trail:
  - [bayesian-verdict-v1.1.md](../research/bayesian-verdict-v1.1.md) — voting-integrated verdict (this ADR's primary input)
  - [bayesian-verdict.md](../research/bayesian-verdict.md) — arbiter ruling (debate transcript)
  - [bayesian-dw-thinking.md](../research/bayesian-dw-thinking.md) — Agent A
  - [bayesian-plain.md](../research/bayesian-plain.md) — Agent B
- Protocol host: [v14-evaluation-protocol.md](../core/v14-evaluation-protocol.md)
- External: [Wikipedia: Bayesian inference](https://en.wikipedia.org/wiki/Bayesian_inference) (research seed)

---

**Status: Proposed. Awaiting team PR review. Target acceptance: 2026-05-19.**
