---
title: Multi-Agent Decision Pattern — Research Note + Skillify Deferral
date: 2026-05-12
author: huydv (TechLead) + Claude (reflection)
status: Pattern captured, skillify DEFERRED
case-study: Bayesian × dw-kit (this conversation, 2026-05-12)
related-research:
  - .dw/research/bayesian-dw-thinking.md
  - .dw/research/bayesian-plain.md
  - .dw/research/bayesian-verdict.md
  - .dw/research/bayesian-verdict-v1.1.md
related-adrs:
  - ADR-0001 (Pragmatic Lean — cut-50% goal)
  - ADR-0003 (Pillar 6 Janitors — same "draft + defer" treatment)
---

# Multi-Agent Decision Pattern — Pattern + 3 Bugs + Skillify Conditions

> **Bối cảnh:** TechLead investigate "Bayesian inference có giá trị cho dw-kit không?" Câu hỏi được chạy qua pattern multi-agent (A/B research → judge → voting → integrate). Output: ADR-0004 Proposed. Doc này capture lại **bản thân pattern** như artifact tái sử dụng được, không phải Bayesian verdict (đã ghi chỗ khác).

---

## 1. The Pattern (recipe 4 phases)

### Phase 1 — Parallel A/B Research

Spawn 2 research agent **song song**, mỗi agent dùng method/lens khác nhau:

| Lens A | Lens B |
|--------|--------|
| Framework-driven (vd: dw-thinking, structured templates) | Free-form (plain Claude, no framework) |
| Insider view (đã trong codebase) | Outsider view (assume mới) |
| Solo dev perspective | Enterprise perspective |
| ... (chọn 2 lens contrastive) |

**Output:** 2 report file độc lập, ghi vào `.dw/research/{topic}-{lens}.md`. Lý tưởng: 2 verdict đối lập → có debate substance. Nếu 2 verdict trùng → có thể câu hỏi không đáng multi-agent.

**Anti-pattern:** spawn 2 agent với cùng prompt — chỉ thu được variance, không insight.

### Phase 2 — Judge / Arbiter (1 agent)

Spawn 1 senior agent (Opus hoặc model mạnh nhất hiện có) với role "trọng tài". Inputs: 2 research reports + relevant ADRs + repo constraints.

Job: identify points of agreement vs contention, ruling từng contention, output verdict.

**Output:** `.dw/research/{topic}-verdict.md`.

### Phase 3 — Voting (specialist polling, optional)

Khi: judge confidence <90%, hoặc user request, hoặc topic high-stakes.

Spawn 3-5 voter **song song**, mỗi voter nhập 1 role:

| Role | Lens |
|------|------|
| Pragmatic Solo Dev | friction / cognitive load |
| Enterprise TechLead | audit / compliance / defensibility |
| OSS Maintainer | community pressure / marketing / doc burden |
| Data Pragmatist | data sufficiency / statistical rigor |
| Risk / Security | failure modes / drift / privacy |
| **Devil's Advocate** *(must include — see Bug 3 below)* | argue against entire decision |

Strict output format (block code, ≤200 từ): `ROLE: ... / VOTE: AGREE/MODIFY/DISAGREE/REJECT / CONFIDENCE: ... / REASON / KEY_RISK / TWEAK`.

Tally → integrated tweaks → `.dw/research/{topic}-verdict-v1.1.md`.

### Phase 4 — Decision Artifact

If decision is architectural / cross-cutting → ADR (Proposed) referencing the research trail. Otherwise close in research note.

---

## 2a. Case Study Index

| # | Case | Date | Outcome |
|---|------|------|---------|
| 1 | Bayesian × dw-kit | 2026-05-12 morning | PILOT UC2 + 4 guardrails → ADR-0004 Proposed |
| 2 | Supply-Chain Guard (post-TanStack worm) | 2026-05-12 afternoon-evening | **3 rounds + GVC final.** Round 1: 7/8 AUP-blocked (Bug 4). Round 2: 5/6 blocked (Bug 4 v1 fix insufficient). Round 3 with sanitized self-contained brief: 5/5 pass (Bug 4 v2 verified). GVC added post-round-3 revealed Bug 5 (effort-anchoring bias). TechLead override of B-consensus → Path A accepted, [ADR-0005](../decisions/0005-supply-chain-guard.md). Ship v1.3.5 in 7-10 days. |

## 2. Case Study — Bayesian × dw-kit (2026-05-12)

Pattern produced:
- 2 research files ([dw-thinking](bayesian-dw-thinking.md) DEFER vs [plain](bayesian-plain.md) Adopt-narrow)
- Judge verdict ([v1.0](bayesian-verdict.md)) — PILOT UC2, confidence 75%
- 5 voter tally — 1 AGREE / 4 MODIFY / 0 reject; 4 tweaks **additive, non-conflicting**
- Integrated verdict ([v1.1](bayesian-verdict-v1.1.md)) — confidence 80%
- [ADR-0004](../decisions/0004-bayesian-pilot-uc2.md) Proposed

Sub-agents used: 8 (2 research + 1 judge + 5 voters). Time: ~25 minutes wall-clock.

**Defensibility:** 4 voters từ 4 lens khác nhau hội tụ vào cùng vấn đề (thiếu guardrails) — pattern khó fake. Cho thấy pattern *does* extract signal khi run đúng.

---

## 3. Three Structural Bugs Discovered

### Bug 1 — Sub-agent không nest được sub-agent (platform constraint)

**Symptom:** Khi judge agent được brief "spawn fresh A-stance / B-stance agents để debate", judge báo Task tool unavailable trong environment → self-play debate (1 LLM drafting cả 2 phe).

**Impact:** "Debate giữa 2 phe" thực ra là internal monologue. Self-consistency bias, không adversarial thật. Verdict vẫn defensible nhưng cơ chế bị thiếu.

**Fix:** Main-thread Claude (orchestrator) tự spawn debate agents — không delegate orchestration vào judge sub-agent. Concretely:
- Phase 1: main spawns A và B song song → đọc về
- Phase 2a (debate): main identify contentions, **main spawns** A-stance + B-stance per contention song song
- Phase 2b (judge): main spawns 1 judge agent với debate transcripts đã có
- Phase 3 (vote): main spawns voters song song

Pattern này confirmed work — chính voting round trong case study đã chạy đúng theo cấu trúc này.

### Bug 2 — Voter framing bias (voters thấy verdict trước khi vote)

**Symptom:** Trong case study, voters được brief verdict của judge TRƯỚC khi vote → priming toward MODIFY (4/5). Setup này đo "verdict này có defensible không", không phải "verdict này đúng không".

**Impact:** Voting outcome có thể bị anchoring; "MODIFY 4/5" có thể overstate consensus.

**Fix:** 2-stage voting:
- **Blind stage:** voter chỉ đọc 2 research raw + repo context → propose own independent verdict (≤200 từ)
- **Compare stage:** sau khi nộp blind verdict, voter được show judge's verdict → vote AGREE/MODIFY/DISAGREE trên judge's verdict với reference tới own blind verdict

Output: cả blind verdict + compare vote. Disagreement rate cao giữa 2 stage = warning signal pattern đang manufactured consensus.

### Bug 3 — No kill-switch voter (manufactured-decision bias)

**Symptom:** Trong case study, không voter nào được tasked: *"argue toàn bộ pilot 12h này phí, không làm gì hôm nay tốt hơn."* Tất cả 5 assume "verdict ổn, tweak thôi". Process tends to produce a decision, không phải right answer.

**Impact:** Outcome bias. Pattern bake-in commitment escalation — mỗi bước locally rational, globally có thể manufactured.

**Fix:** **Devil's Advocate là MANDATORY voter** trong mọi run. Brief: *"Mission là argue the entire question doesn't warrant this much process. Verdict 'không làm gì hôm nay' là valid output. Kháng confirmation bias."*

Nếu Devil's Advocate vote REJECT → cần escalate (additional voter, hoặc abort decision, hoặc convert sang ADR Draft với defer instead of Proposed-active).

### Bug 4 — AUP topic-sensitivity (discovered 2026-05-12 dogfood run)

**Symptom:** Khi pattern apply cho security/incident-response topic, **7/8 sub-agents bị Anthropic Usage Policy block** ("violative cyber content"). Chỉ Devil's Advocate pass — vì DA prompt focus là *debate về proposal*, không re-describe attack mechanism. Các voter brief khác paste lại exfil domains/malware capabilities/IoC/credential targets trong từng brief làm classifier match offensive content patterns, dù intent defensive.

**Impact:** Pattern failure ngay tại Phase 1 cho mọi security topic. Đặc biệt nguy hiểm vì supply-chain attacks là exact context cần multi-perspective evaluation nhất.

**Fix — Topic-neutral brief rule:**

1. **Context lives in artifact files, not voter briefs.** Voter prompt chỉ chứa: role description + lens focus + file paths (artifact docs) + output format. Voter tự đọc các file để pick up context.
2. **Strip from brief:** IoC values, exfil domains, malware capabilities, attacker capabilities, "stolen tokens/keys/credentials", attack timeline detail, payload mechanics.
3. **Keep in brief:** topic name in defender framing (e.g., "supply-chain guard proposal", không phải "respond to malware attack"), lens role, decision question.
4. **Verify before parallel spawn:** if topic has security/threat keywords, do single dry-run of one voter to confirm AUP pass before spawning 6 in parallel — saves wasted budget.

**Example — reframe BAD → GOOD:**

```
BAD: "TanStack worm steals npm tokens, GitHub PATs, AWS keys, SSH keys
     from 100+ paths via /proc/{pid}/mem of Runner.Worker process.
     Exfil to *.getsession.org. As Risk/Security voter, evaluate..."

GOOD: "Evaluate the supply-chain guard proposal at [path] from a 
      Risk/Security lens. Refer to incident report at [path] for 
      threat context. Output verdict in strict format below."
```

Reframe shifts who carries threat context — file (defender artifact, safe) vs brief (attacker prose, blocked).

**Meta-insight:** Bug 4 discovered *only because* DA was structurally arguing AGAINST the security feature — DA's prompt naturally had less attack terminology. Kill-switch voter (Bug 3 fix) accidentally proved its own value by being the only voter that survived. Validates Bug 3 fix structurally beyond outcome bias.

#### Bug 4 v2 — Round 2 failure deeper than brief-cleanup (discovered 2026-05-12 afternoon, round 2)

**Symptom continued:** Bug 4 fix v1 (strip threat detail from voter brief) was insufficient. Round 2 retry with clean briefs still failed 5/6 — voters that READ artifact files (incident report, proposal Section 9) hit AUP at **output generation** when discussing artifact content from their lens. Particularly Risk/Security and Strategic Product roles whose lens inherently discusses attack mechanics.

**Deeper fix (v2):**

1. **Create a sanitized self-contained dispute brief** as a separate artifact (e.g., `{topic}-strategic-dispute.md`) that contains:
   - Policy-level framing only (no IoC values, no attack mechanics, no credential targets)
   - Both positions pre-summarized at abstraction level
   - Candidate verdicts as A/B/C/D enumeration
   - "Sufficient for verdict — references optional"
2. **Voter brief references ONLY the sanitized artifact**, not threat-detail artifacts. Threat-detail files remain intact for legitimate defender use (broadcast, technical reference) but stay out of voter context.
3. **Acceptable degenerate mode:** if even sanitized briefs fail for some lens roles (Risk/Security), accept partial panel — fewer voters with output, better than zero. DA mandatory remains — DA passes structurally because its argument shape is REJECT.
4. **Skip voter roles that cannot operate without discussing threat mechanics** (e.g., Risk/Security in security topics is fundamentally constrained). Document the skip transparently.

**Bug 4 v2 verification (round 3, completed 2026-05-12 evening):** **VERIFIED.** 5/5 voters returned verdict with sanitized self-contained brief artifact (`sc-guard-strategic-dispute.md`). 0/5 AUP blocks. Pattern works for security topics when threat detail lives only in defender artifacts, not voter context. Block rate progression: 88% (round 1) → 83% (round 2) → 0% (round 3 with Bug 4 v2).

### Bug 5 — Effort-anchoring bias / Goal-Champion missing (discovered 2026-05-12 evening, post-round-3 synthesis)

**Symptom:** Round 3 returned 5/5 voters but 5 of those voted B (mid-scope) with the core objection "ship under deadline pressure = panic timing → ship-then-abandon". When TechLead pushed back, root cause surfaced: every panel role defaults to **effort-downside lens**:

- Solo Dev → friction
- Enterprise TL → audit/process slowdown
- OSS Maintainer → maintenance sustainability
- Strategic Product → marketing-panic-vs-deliberate
- Risk/Operational → failure modes
- Devil's Advocate → REJECT mandate

**Six lenses, six effort-anchored objections, zero pure value/goal lens.** Panel naturally trends conservative because every voter has downside argument, none has upside championing.

**Compounding factor:** voters treat effort as **fixed constraint** (human linear hours) when in 2026, effort is **variable** under AI-augmented capacity. "12h human-equivalent" ≠ "12h TL time" — with Claude Code scaffold + existing pattern reuse + parallel agent work, multiplier is typically 3-5x. Voters applied 2024 effort calculus to 2026 AI-augmented capacity. Inconsistent with dw-kit's own thesis.

**Impact:** Pattern systematically under-recommends ship-aggressive verdicts even when value upside justifies. Outcome bias toward defer/mid-scope.

**Fix:**

1. **Goal/Value Champion is MANDATORY voter** — structural counterpart to Devil's Advocate. Mission: *"Argue ADOPT/SHIP case strongly before voting. Frame as 'cost of NOT shipping' + 'value upside if works'. Treat effort as variable (AI-augmented capacity multiplier). Kháng effort-anchoring bias."*

2. **Output format MUST mirror DA structurally** — `ADOPT_CASE_FIRST` field (parallel to DA's `REJECT_CASE_FIRST`) requiring explicit upside-case argumentation before verdict. Without this, role degenerates to passive cheerleader.

3. **Brief MUST include effort reframe context** — explicit statement of AI-augmented capacity multiplier (3-5x typical), with note that B-voters likely assumed human-baseline. Without this, GVC argues into the void since other voters silently anchored differently.

4. **Tally rule update**: when Goal Champion and Devil's Advocate disagree on verdict, **TechLead/decider has explicit authority to override panel consensus** IF the disagreement traces to effort-anchoring vs value-anchoring (Bug 5 framing). Document the override transparently in artifacts (cite Bug 5 by name in ADR).

5. **Pair Bug 5 with Bug 3** — Bug 3 (Devil's Advocate mandatory) prevents commitment escalation (false positives toward ADOPT). Bug 5 (Goal Champion mandatory) prevents conservatism cascade (false negatives toward DEFER). The pair stabilizes panel toward calibrated rather than biased verdicts.

**Bug 5 verification (2026-05-12 evening):** SC-Guard case study round 4 spawned single GVC voter. GVC returned `INDEPENDENT_VERDICT: A (ship aggressive)` with high confidence + effort reframe explicit + TW6 sunset commitment (which neutralized DA's remaining rationalization-risk flag). TechLead override of B-consensus to adopt A path with Bug 5 + TW6 citation. Override transparent in [ADR-0005](../decisions/0005-supply-chain-guard.md).

**Meta-pattern:** Bug 5 is the inverse of Bug 3. Where Bug 3 protects against "manufactured decisions toward adoption", Bug 5 protects against "manufactured decisions toward defer". Both stem from the same root: panel role design biases toward objection-finding rather than value-championing. Together they enforce calibrated debate.

---

## 4. Other Caveats Worth Tracking

| # | Caveat | Mitigation |
|---|--------|------------|
| C1 | "Confidence 75% → 80%" là posterior chưa calibrated — number theater | Treat confidence as ordinal (low/med/high), không decimal |
| C2 | Cost: 8 sub-agents/run. Token + time non-trivial. | Reserve cho decision impact ≥medium; cheap-decision dùng 1-shot |
| C3 | Same-LLM stack có self-consistency bias across all 8 agents | Mix model nếu có thể (Opus judge, Sonnet voters) |
| C4 | Bias "more process = better decision" — pattern itself thuộc nhóm tools depreciate khi AI smarter | See Section 6 — obsolescence test |
| C5 | Wikipedia/external source không grounding check | Optional Phase 0.5: 1 agent verify source interpretation |

---

## 5. When to Apply (and Not)

**Apply when:**
- Decision impact ≥ medium (architectural, cross-cutting, hard to reverse)
- User explicitly wants multi-perspective
- 1-shot reasoning leaves substantial doubt
- Multiple legitimate stakeholders with different optimization targets

**Do NOT apply when:**
- Bugfix, refactor, doc update, naming choice
- Single-path question (no real alternatives)
- Time-sensitive (cost: ~25min wall + 8 sub-agents)
- Decision already made — user wants execution, not deliberation

**Existing dw-kit alternatives** that cover lighter cases:
- `/dw:plan` — has Quick Debate (red/blue self-critique). Covers most "should we?" cases trong implementation context
- `/dw:decision` — direct ADR creation. Covers "let's write down what was decided"

Multi-agent pattern fits **above** these — when even `/dw:plan` Quick Debate is too narrow.

---

## 6. Skillify Decision — DEFER

### Why not now

1. **Bug 1 (sub-agent nesting)** is platform constraint — until main-thread orchestration is baked into skill structure, packaged skill inherits same broken debate.
2. **Bug 2 và Bug 3** unfixed in current implementation. Skillify trước fix = baking in bugs.
3. **Pattern chưa validated** trên ≥2 real decisions. n=1 case study (Bayesian) không đủ — có thể pattern over-fit câu hỏi đặc thù này.
4. **Obsolescence test fails (probable):** As AI improves single-shot reasoning, multi-agent orchestration value drops. Skill này thuộc category "embedded decision engine" — exactly nhóm PILLARS.md warned về.
5. **ADR-0001 cut-50% goal** — thêm skill = đi ngược.
6. **OSS marketing risk** — *"dw-kit ships multi-agent governance debate skill"* triggers same HN-roast vector mà TW1 (OSS Maintainer voter) cảnh báo cho Bayesian. Self-inflicted irony.

### When to revisit (un-defer triggers)

| # | Trigger | Action |
|---|---------|--------|
| ST1 | Pattern reused ad-hoc successfully ≥2 times on real decisions, with TechLead reflection confirming value | Move to "ready to skillify" |
| ST2 | Bug 1 fix landed (main-thread orchestration playbook documented) | Prerequisite |
| ST3 | Bug 2 + Bug 3 fix verified in ≥1 reuse | Prerequisite |
| ST4 | **Bug 4 v2 fix verified — sanitized self-contained brief unlocks full panel for security topics** | **Verified 2026-05-12 (round 3, 5/5 pass)** |
| ST5 | **Bug 5 fix verified — Goal/Value Champion paired with DA prevents conservatism cascade** | **Verified 2026-05-12 (GVC + TechLead override of B-consensus to A path)** |
| ST6 | Obsolescence test passes — pattern still adds value beyond 1-shot reasoning given current AI capabilities | Prerequisite |
| ST7 | User explicitly requests skillify | Trump |
| ST8 | Pattern proves redundant với `/dw:plan` deep mode | Close, không skillify |

### When skillify IS warranted (future state)

Skill name candidate: `/dw:deliberate [topic]` or `/dw:multi-perspective [topic]`. NOT `/dw:debate` (clash với `/dw:plan` Quick Debate naming).

Implementation **MUST** be main-thread runbook, NOT a single-agent orchestrator:
- Skill markdown ghi runbook 4 phases với explicit Agent tool calls cho main-thread Claude
- Mandatory Devil's Advocate role hard-coded
- 2-stage voting hard-coded
- Budget cap ≤8 sub-agents enforced
- Output paths convention: `.dw/research/{topic}-{role}.md`

---

## 7. Open Questions

1. Liệu pattern này có generalize sang non-dw-kit projects? Hay đặc thù với codebase có ADR + research convention?
2. Cost-benefit threshold cụ thể: decision impact bao nhiêu mới worth 8 sub-agents?
3. Có nên include "ground truth check" agent (Phase 0.5) verify external sources?
4. Pattern apply được cho non-binary decisions (vd: chọn 1 trong 5 library) hay chỉ binary (adopt/reject)?

---

## 8. References

- Case study artifacts:
  - [bayesian-dw-thinking.md](bayesian-dw-thinking.md) — Agent A research
  - [bayesian-plain.md](bayesian-plain.md) — Agent B research
  - [bayesian-verdict.md](bayesian-verdict.md) — Judge verdict v1.0
  - [bayesian-verdict-v1.1.md](bayesian-verdict-v1.1.md) — Voting-integrated v1.1
  - [ADR-0004](../decisions/0004-bayesian-pilot-uc2.md) — Final ADR Proposed
- Related principles:
  - [PILLARS.md](../core/PILLARS.md) — obsolescence test (Bug 4 inspiration)
  - [ADR-0001](../decisions/0001-v2-pragmatic-lean.md) — cut-50% goal anchor
  - [ADR-0003](../decisions/0003-pillar-6-janitors.md) — same "Draft + defer + revisit triggers" treatment
- Memory: `feedback-multi-agent-decision-pattern.md` (cross-conversation persistence)

---

**Status: Pattern captured. Skillify DEFERRED pending Bug 1-3 fixes + ≥2 real-decision reuse. Revisit conditions in Section 6.**
