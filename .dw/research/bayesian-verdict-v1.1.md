---
role: arbiter + voter-synthesis
model: opus-4.7 (arbiter) + 5x sonnet/general (voters)
date: 2026-05-12
version: 1.1
extends: .dw/research/bayesian-verdict.md (v1.0)
title: "Bayesian Inference cho dw-kit — Verdict v1.1 (post-voting integration)"
voting-invoked: true
voters: 5 (Solo Dev, Enterprise TL, OSS Maintainer, Data Pragmatist, Risk/Security)
tally: 1 AGREE / 4 MODIFY / 0 DISAGREE / 0 REJECT
status: Decision-support for TechLead → input cho ADR-0004 (Proposed)
---

# Bayesian Verdict v1.1 — Voting-Integrated

> **Quan hệ với v1.0:** File này extends [v1.0](bayesian-verdict.md). Phần
> debate transcript, contention map, ruling per contention giữ nguyên ở v1.0.
> File v1.1 chỉ chứa: (1) voting outcome, (2) 4 tweak tích hợp, (3) updated
> action plan với guardrails, (4) updated abort triggers.

---

## 1. Why v1.1

v1.0 verdict ruling 4/4 contentions tự tin (sub-agents = 0, voting không
invoke). TechLead sau đó request **explicit voting round** trên verdict
như sanity check. 5 specialist voter triệu tập song song:

| # | Voter | Lens |
|---|-------|------|
| V1 | Pragmatic Solo Dev | Friction / cognitive load cho `solo` preset |
| V2 | Enterprise TechLead | Audit defensibility, compliance lineage |
| V3 | OSS Maintainer | Community pressure, marketing, doc burden |
| V4 | Data Pragmatist | Statistical rigor, prior selection, n sufficiency |
| V5 | Risk/Security | Failure modes, semantic drift, privacy |

---

## 2. Voting Outcome

### 2.1 Tally

| Voter | Vote | Confidence | One-liner |
|-------|------|------------|-----------|
| Solo Dev | **AGREE** | high | Opt-in flag = zero friction cho solo preset; tweak: none |
| OSS Maintainer | **MODIFY** | high | Add "no-expand" guard (CHANGELOG scope-lock + issue label + silent removal path) |
| Data Pragmatist | **MODIFY** | medium | Pre-register prior + sensitivity check; min n=10/skill; ROPE tied to threshold ±20% |
| Risk/Security | **MODIFY** | medium | Strip per-dev; hard banner "NOT a decision rule"; abort trigger N5 |
| Enterprise TL | **MODIFY** | medium | Bắt buộc machine-readable sidecar (prior, n, caveat, ROPE, hash) → ADR appendix |

**Aggregate:** 1 AGREE / 4 MODIFY / 0 DISAGREE / 0 REJECT.

### 2.2 Interpretation

- **No voter rejected** — core PILOT decision của arbiter defensible across 5 lenses.
- **4/5 modify** — verdict đúng hướng nhưng **thiếu guardrails**. Voters tweak từ 4 lens KHÁC NHAU mà KHÔNG xung đột — chúng additive, mỗi cái lấp 1 lỗ hổng độc lập.
- **Solo Dev's KEY_RISK** stands as honest opportunity cost: 8h cap có thể tốn cho audience hẹp (team/enterprise preset only). v1.1 chấp nhận trade-off này vì other guardrails giảm risk.

---

## 3. Integrated Tweaks

4 tweak được merge vào prototype scope. Mỗi tweak có owner, deliverable, effort estimate.

### TW1 — Governance Guardrails (from OSS Maintainer)

**Purpose:** Prevent feature creep / "Bayesian everywhere" community pressure.

**Deliverables:**
1. **CHANGELOG v1.4.x entry** ghi rõ: *"`--bayesian` flag is experimental, scope-locked to cut-analysis, NOT a roadmap signal for broader Bayesian adoption."*
2. **Issue template auto-label**: GitHub label `bayesian-expansion` + canned response linking [ADR-0004](.dw/decisions/0004-bayesian-pilot-uc2.md) + Trigger T7 (UC2 redundant abort path).
3. **Silent removal path**: if Phase 2 evaluation finds redundant → remove in v1.4.2 *quietly*, không đợi v2.0 cycle.

**Effort:** ~45min (CHANGELOG note + issue template YAML + canned response markdown).

**Owner:** TechLead (huydv).

---

### TW2 — Statistical Pre-Registration (from Data Pragmatist)

**Purpose:** Avoid "Bayesian theater" — math đẹp nhưng posterior vô dụng do prior arbitrary hoặc n quá nhỏ.

**Deliverables:**
1. **Prior choice pre-registered** trong design doc trước khi viết code:
   - Primary: weakly-informative (Beta(1,1) cho rate, Gamma(α,β) calibrated tới threshold).
   - Sensitivity check: chạy lại với threshold-informed prior, so sánh posterior shift. Nếu posterior shift mạnh → flag low data-information.
2. **Minimum per-skill n=10 events** để compute CI. Skill dưới ngưỡng → output literal `"insufficient data (n=X<10)"`, KHÔNG emit spurious posterior.
3. **ROPE width fixed**: threshold ±20% (vd: threshold=5 → ROPE [4, 6]). KHÔNG tự chọn ad-hoc.

**Effort:** ~1h (design doc + minimum-n guard + ROPE constant).

**Owner:** TechLead.

---

### TW3 — Risk Containment (from Risk/Security)

**Purpose:** Prevent semantic drift "reporting → soft gate → hard gate" trong 6 tháng do anchoring vào con số.

**Deliverables:**
1. **Privacy: strip per-dev breakdown** trong output. Chỉ aggregate (per-skill across all devs). Per-dev numbers stay in raw data, không expose qua CLI.
2. **Hard CLI banner** trên mỗi `--bayesian` output:
   ```
   ============================================================
   ADVISORY OUTPUT — NOT a decision rule.
   Threshold matrix in v14-evaluation-protocol.md is authoritative.
   Use credible interval as evidence-supplement only.
   ============================================================
   ```
   Plus telemetry event `bayesian.cli_used` mỗi lần invoke — drift signal monitoring.
3. **Abort trigger N5** (added to Section 5.4): nếu **≥2 cut ADRs cite credible interval as PRIMARY justification** (thay vì threshold) → auto-reject Bayesian per Trigger T7. Drift signal đã realized.

**Effort:** ~45min (banner string + per-dev strip in output + telemetry event).

**Owner:** TechLead.

---

### TW4 — Audit Lineage (from Enterprise TechLead)

**Purpose:** Prevent "ai chọn prior?" audit challenge undermining cut ADR defensibility.

**Deliverables:**
1. **Machine-readable sidecar emitted alongside `--bayesian` output**, format JSON:
   ```json
   {
     "prior": {"family": "Beta", "params": {"alpha": 1, "beta": 1}, "rationale": "weakly-informative"},
     "data": {"n": 23, "uses_total": 47, "window_days": 28},
     "caveats": ["session-hash proxy undercounts headcount; CI lower bound likely overstated"],
     "rope": {"low": 4.0, "high": 6.0},
     "result": {"point": 4.3, "ci_95": [2.1, 7.8], "p_below_threshold": 0.74},
     "code_version": "dw-kit@1.4.1+sha:abc1234"
   }
   ```
2. **Cut ADR merge gate**: if cut ADR cites `--bayesian` output anywhere in body, sidecar JSON must be embedded in ADR appendix. PR linter blocks merge if missing.
3. **Sensitivity check result** (from TW2) also included in sidecar (`"sensitivity_check": {"prior_alt": "...", "posterior_shift": "low|medium|high"}`).

**Effort:** ~1.5h (JSON emit + PR linter script + ADR appendix template update).

**Owner:** TechLead.

---

## 4. Updated Effort Cap

| Item | v1.0 | v1.1 |
|------|------|------|
| Core stats lib (Beta-Binomial / Poisson-Gamma / CI) | 4-6h | 4-6h |
| `cut-analysis --bayesian` integration | 1-2h | 1-2h |
| Tests + 1 doc section | 0.5h | 0.5h |
| **TW1 — Governance** (CHANGELOG + issue template) | — | +0.75h |
| **TW2 — Pre-register prior + min-n guard + ROPE** | — | +1h |
| **TW3 — Banner + per-dev strip + telemetry event** | — | +0.75h |
| **TW4 — Sidecar JSON + ADR PR linter** | — | +1.5h |
| **NEW TOTAL HARD CAP** | **8h** | **12h** |

**Justification cho cap up:** 4 tweaks aggregate +4h. Cap mới 12h. Trade-off accepted vì:
1. Voter tally cho thấy guardrails là deciding factor — không có guardrails, 4/5 voters MODIFY.
2. Guardrails là **front-loaded** — làm đúng lúc prototype hơn retrofit.
3. v2.0 ship deadline (2026-08-15) - vẫn còn ~13 tuần sau v1.4 ship target (2026-06-30); 4 extra hours là ~0.4% deadline budget.

**Hard abort vẫn áp dụng:** nếu exceed 12h → abort, document learning trong v1.4 retro.

---

## 5. Updated Action Plan (delta from v1.0 Section 5)

### 5.1 Pre-conditions (unchanged)

P1, P2, P3 from v1.0 Section 5 — không thay đổi.

### 5.2 Phase 0 — Document (now)

- [x] Write v1.0 verdict
- [x] Run voting (5 voters)
- [x] Write v1.1 voting-integrated verdict (this file)
- [ ] Write [ADR-0004](.dw/decisions/0004-bayesian-pilot-uc2.md) — Proposed status

### 5.3 Phase 1 — Prototype (2026-07-01 to 2026-07-08, +1 day vs v1.0)

**Order of work** (TW2 + TW4 design BEFORE code):

1. **Day 1:** Write 1-page design doc with prior choice + sensitivity setup (TW2 pre-register). Define sidecar schema (TW4). Define banner string (TW3). Write CHANGELOG entry draft (TW1).
2. **Day 2-3:** Implement `src/lib/bayesian-stats.mjs` (core math, ~120 LOC). Implement minimum-n guard (TW2).
3. **Day 4:** Wire `cut-analysis --bayesian` flag. Output formatting: aggregate-only (TW3), banner (TW3), sidecar JSON emission (TW4).
4. **Day 5:** Telemetry event `bayesian.cli_used` (TW3). PR linter script for cut ADR sidecar gate (TW4).
5. **Day 6:** Tests (smoke + sensitivity check assertion). Doc section trong v14-evaluation-protocol.md.
6. **Day 7:** Issue template YAML + canned response markdown (TW1). Dry-run on v1.4 retro data.

**Out-of-scope (unchanged from v1.0 Section 5.3):** no new skill, no new rules file, no README marketing, no expansion to UC1/UC3/UC4/UC5/UC6/UC7, no decision-rule change.

### 5.4 Abort Triggers (updated)

| # | Signal | Action | Source |
|---|--------|--------|--------|
| N1 | v1.4 ship slips past 2026-07-15 | Abort entire UC2. | v1.0 |
| N2 | Prototype hits 9h with no working core output | Cut scope to CI-only (skip ROPE/Poisson), or abort. | v1.0 (was 6h@8cap; updated 9h@12cap) |
| N3 | Devs ask "what does P=0.74 mean?" in cut ADR review | Document fails interpretability bar; remove. | v1.0 |
| N4 | TL bandwidth saturated by v2.0 prep | Defer UC2 to v2.1 window. | v1.0 |
| **N5** | **≥2 cut ADRs cite CI as PRIMARY justification (drift to gate)** | **Auto-reject Bayesian per T7.** | **TW3 (new)** |

### 5.5 Phase 2 — Retention Decision (target 2026-07-15, unchanged from v1.0)

Outcomes (a)/(b)/(c) from v1.0 Section 5.4 unchanged. Add (d):

(d) **If guardrails are violated** (e.g., devs disable banner, sidecar gate bypassed) → review whether sociotechnical fit is wrong; possible abort even if technical output valuable.

---

## 6. Updated Revisit Triggers (additive to v1.0 Section 6)

Add T8 (from voter aggregate):

| # | Trigger | Re-open scope |
|---|---------|--------------|
| T1-T7 | (unchanged from v1.0) | — |
| **T8** | **Per-skill data sufficiency unlocks: median per-skill n ≥ 30 events for 3 consecutive months** | **Revisit aggregate-only constraint (TW3); may unlock per-dev breakdown with privacy review.** |

---

## 7. What I Could Be Wrong About (v1.1 specific)

Section khiêm tốn — additional weaknesses introduced by v1.1 integration:

1. **TW4 sidecar schema designed without real cut ADR yet.** Schema may need iteration after first real use; risk of v1.4.1 vs v1.4.2 schema drift. Mitigation: version field in sidecar; treat first ADR using it as schema validation.
2. **TW3 banner anchoring assumption**: banner may *itself* anchor team toward number ("if they had to add a warning, the number must be meaningful"). Counter-anchoring requires testing in actual cut ADR review.
3. **TW2 min-n=10 chosen by judgment, not derived.** Sensible threshold but could be too lax (CI still wide at n=10 for Beta-Binomial) or too strict (excludes useful skills). Revisit after Phase 2.
4. **Cap +50% (8h → 12h) erodes the "time-boxed" defense of v1.0.** A reasonable critic could say "if it needs 12h of guardrails, maybe it's not as cheap as claimed." Counter: 4h of guardrails amortize across future Bayesian features if any; without them, the 8h is exposed.

Verdict v1.1 self-assessed confidence: **~80%** (up from v1.0's 75% — voters refined rather than overturned, which is positive signal).

---

## 8. TL;DR cho TechLead (≤10 dòng)

1. **Decision unchanged from v1.0:** PILOT UC2 (Bayesian credible interval for cut-analysis), opt-in, post-v1.4 ship.
2. **5/5 voters agree on direction**; 4/5 add guardrails.
3. **4 guardrails integrated** (TW1-4): governance scope-lock, statistical pre-registration, semantic-drift containment, audit lineage sidecar.
4. **Effort cap up 50%**: 8h → 12h. Hard abort still applies.
5. **Phase 1 order changed**: design doc (TW2+TW4) before code, không phải code first.
6. **New abort N5** for de-facto gate-drift; auto-reject if breached.
7. **Next deliverable**: [ADR-0004](.dw/decisions/0004-bayesian-pilot-uc2.md) Proposed → team review qua PR.

---

## Appendix A: Voter Raw Responses

Stored as transcripts in agent output files (not duplicated here for size).
Aggregated tweaks captured in Section 3 above.

## Appendix B: Source Trail

- [v1.0 verdict](bayesian-verdict.md) — arbiter ruling (4 contentions debated inline)
- [Agent A research](bayesian-dw-thinking.md) — dw-thinking framework
- [Agent B research](bayesian-plain.md) — plain analysis
- [ADR-0001](.dw/decisions/0001-v2-pragmatic-lean.md) — constraint anchor
- [ADR-0003](.dw/decisions/0003-pillar-6-janitors.md) — UC5 parent (deferred)
- [v14-evaluation-protocol](.dw/core/v14-evaluation-protocol.md) — UC2 host doc

---

**End of v1.1. Non-binding decision-support for TechLead. Input to ADR-0004 (Proposed). v2.0 timeline (ship 2026-08-15) protected; UC2 pilot post-v1.4 ship within 12h budget with 4 integrated guardrails.**
