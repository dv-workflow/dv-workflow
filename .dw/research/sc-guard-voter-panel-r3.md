---
title: Supply-Chain Guard — Voter Panel Raw Outputs (Multi-Agent Pattern, 3 rounds + GVC)
date: 2026-05-12
purpose: Compile raw voter responses across 3 rounds + Goal/Value Champion for TechLead review. Synthesis intentionally minimal.
total-agents-spawned: 17 (2 research + 6 round-1 + 6 round-2 + 5 round-3 + 1 GVC)
total-completed: 8 verdicts (1/8 round 1, 1/6 round 2, 5/5 round 3, 1/1 GVC)
bug-4-fix-verified: yes (v2 sanitized self-contained brief unlocked 5/5)
bug-5-discovered: yes (effort-anchoring bias surfaced post-round-3, GVC added as mandatory pair with DA)
final-decision: Path A (Ship aggressive v1.3.5) — TechLead override of B-consensus per Bug 5 + TW6 — see ADR-0005
---

# Voter Panel Raw Outputs — Supply-Chain Guard Decision

> All voter responses verbatim. No filtering, no editorializing.

---

## Round 1 (2026-05-12 morning, original briefs)

**Outcome:** 7/8 AUP-blocked. Only DA passed.

### DA Round 1 (sole-completed voter)

```
ROLE: Devil's Advocate
VOTE: MODIFY
CONFIDENCE: medium
REJECT_CASE_FIRST: Đây là classic incident-response panic build — TanStack worm 19:20-19:26 UTC một ngày, dw-kit chưa từng bị, team chưa từng install trong window, và "lucky" được dùng làm cớ ship 14-18h code. IoC bundle là forever maintenance debt (bus-factor = huydv solo) chạy đua với attacker novelty — zero-day vẫn slip, sophisticated attacker đọc bundle để né, false sense of safety tệ hơn không có. Phase 1 alone không deliver core value (no hook, no doctor) → MVP = vanity ship; phải tới Phase 2-3 mới hữu dụng, tức 11-14h thật, không phải 6-8h. Và 80% protection thực tế đến từ 1 command (`npm config set ignore-scripts true`) + broadcast template — đã free, đã ship. Coding 14-18h cho marginal 20% còn lại trong khi ADR-0001 cut-50% và v2.0 deadline 2026-08-15 đang treo = đi ngược lean, fits "embedded engine" category PILLARS.md cảnh báo. Marketing-positive framing trong doc (#5 Pros) là tell-tale sign rationalizing.
INDEPENDENT_VERDICT: Defer
VOTE_ON_PROPOSAL: MODIFY
CONFIDENCE: medium
REASON: Rebut được nửa REJECT case: post-install scan ở Claude Code Edit-lockfile hook là structural workflow integration không trùng `ignore-scripts`. Nhưng chỉ value khi scope cực hẹp — IoC bundle TanStack-only như reference fixture, không community-curated forever-bundle. Ship behavioral hook + 1 fixture (~3-4h), bỏ CLI command, bỏ doctor section, bỏ canonical repo, bỏ freshness heuristic.
KEY_RISK: IoC bundle bus-factor — huydv quit/busy 3 tháng → stale DB ships false confidence, tệ hơn không guard.
TWEAK: Cắt xuống 3-4h: chỉ hook supply-chain-scan.sh chạy grep IoC pattern offline khi Claude Edit lockfile; bundle là 1 JSON commit-pinned, không repo riêng, không --update-db; revisit sau 90 ngày — nếu 0 hit, retire.
```

---

## Round 2 (2026-05-12 afternoon, briefs cleaned per Bug 4 fix v1)

**Outcome:** 5/6 AUP-blocked again. Only DA refined passed. Bug 4 fix v1 insufficient.

### DA Round 2 — Refined (after seeing TechLead's strategic frame rebuttal)

```
ROLE: Devil's Advocate (refined)
PRIOR_POSITION: Defer (independent) / MODIFY narrow 3-4h (hook + 1 fixture, sunset 90d)
STRATEGIC_FRAME_REBUT_ASSESSMENT: Rebuts partially
SPECIFICALLY_VALID_POINTS:
1. Bus-factor reframe ĐÚNG về structure: auto-sync từ GHSA/OSV.dev (machine-readable, official, multi-maintainer upstream) thực sự dissolve solo-curate debt — đây không phải rhetoric, đây là design change. Nếu adapter chỉ là transform layer over OSV feed, maintenance = adapter code + schema drift, không phải IoC content curation.
2. AI-specific risk profile có chất: AI agents auto-add deps, ít diff lockfile, favor trending packages → measurably higher exposure tại Edit-lockfile boundary mà human review không catch. Đây là chỗ Snyk/Socket (assume human-author commit) không sit. Cấu trúc, không marketing.
3. ADR-0001 distinction (cut applies to duplication, không net-new pillar capability) đúng theo PILLARS.md — Guards layer được phép grow. Tôi over-rotated lập luận này lần trước.

SPECIFICALLY_RATIONALIZATION_RISK:
1. "Speed-to-ship sau incident = OSS currency / capture window" — kinh điển panic frame. Currency này real cho marketing tweet, không real cho retention. Ship-trong-tuần ép ADR-0005 không qua proper voter round (Bug 4 chưa fix) — đúng cái lỗi pattern doc vừa cảnh báo.
2. "Competitive gap — Cursor/Copilot không own supply chain" — positioning argument, không user-value argument. Vacuum tồn tại không tự động = nên fill. Có thể vacuum tồn tại vì không ai muốn maintain nó.
3. OSV.dev adapter "structurally solves bus-factor" chỉ đúng nếu adapter thực sự built minimal — risk scope creeps về curated bundle lúc OSV feed có gap, lúc đó debt tái xuất hiện qua cửa sau.

REFINED_VERDICT: Shift — MODIFY (mid-scope ~6-8h), NOT ship-aggressive-12h
CONFIDENCE: medium
REASON: Reframe moat sang OSV/GHSA auto-sync hợp lệ và đủ để rebut bus-factor core objection của tôi. AI-boundary risk profile cũng valid. Nhưng "ship 1 tuần v1.3.5 capture window" là urgency được frame in, không out — Bug 4 chưa fix, ADR-0005 chưa có voter feedback đúng nghĩa, ship dưới panic deadline tăng prob ship-rồi-bỏ. Scope hợp lý: hook + OSV adapter + sunset rule, defer CLI/doctor/dashboard/freshness sang post-dogfood.
KEY_RISK: OSV.dev/GHSA feed latency hoặc schema break biến adapter thành curated-bundle de-facto sau 2 tháng, lúc đó bus-factor objection ban đầu tái xuất hiện đúng như tôi predict.
TWEAK: Ship hook + OSV adapter (read-only sync, no manual curation, no community bundle repo) + 90-day sunset metric (≥1 real catch hoặc retire) — drop urgency tuần này, target v1.4.x patch không v1.3.5.
```

---

## Round 3 (2026-05-12 evening, Bug 4 v2 fix — sanitized self-contained brief)

**Outcome:** 5/5 PASS. Bug 4 fix v2 verified.

### V3-1: Solo Dev

```
ROLE: Pragmatic Solo Dev
VERDICT: D: Defer
STRATEGIC_FRAME: OVERSTATED
CONFIDENCE: high
REASON: Solo dev ở preset Guards-only không cần thêm pillar feature mới — `npm config set ignore-scripts true` + lockfile pin đã cover 80% risk với 0h effort. "AI-native moat" là framing của maintainer/marketing, không phải nhu cầu của user. Mỗi hook mới = thêm cognitive load + một thứ nữa có thể break workflow vibe-coding.
KEY_RISK: Ship feature dưới deadline pressure → maintenance debt rơi vào solo dev (cả TechLead lẫn end-user) khi feed adapter break hoặc false-positive spam hook.
TWEAK: Nếu buộc phải ship, chọn C (ultra-narrow 3-4h) — chỉ hook opt-in mặc định OFF cho solo preset, để vibe coder không bị ép cài. Document `ignore-scripts` recipe trong README còn giá trị hơn cả hook.
```

### V3-2: Enterprise TechLead

```
ROLE: Enterprise TechLead
VERDICT: B: Mid-scope 6-8h v1.4.x
STRATEGIC_FRAME: VALID
CONFIDENCE: high
REASON: Từ lens regulated/audit: auto-sync từ official feeds (OSV/GHSA) là requirement bắt buộc cho audit defensibility — solo-curated IoC bundle sẽ fail compliance review (provenance, reproducibility, chain-of-custody). Tuy nhiên, ship emergency v1.3.5 trong 1 tuần là red flag với change-management gates (CAB, regression window) — Enterprise không thể adopt feature ship dưới panic timing. Strategic frame (AI-native guard tại Edit-lockfile boundary) hợp lệ vì differentiator có cơ sở kỹ thuật, không phải marketing.
KEY_RISK: Adapter scope creep biến read-only transform thành de-facto curation layer → mất tính reproducible của feed snapshot, audit log không thể trace decision origin.
TWEAK: Bắt buộc pin feed snapshot SHA + log mọi block/allow event vào .dw/metrics/events.jsonl với feed-version + advisory-id để audit trail reproducible; sunset metric phải bao gồm false-positive rate, không chỉ catch count.
```

### V3-3: OSS Maintainer

```
ROLE: OSS Maintainer
VERDICT: B: Mid-scope 6-8h v1.4.x
STRATEGIC_FRAME: VALID
CONFIDENCE: medium
REASON: Positioning "AI-Native Supply-Chain Guard" lấp đúng vacuum mà Snyk/Socket/Cursor không own — đây là marketing hook hiếm có cho OSS adoption và HN-test được. Tuy nhiên ship 12h dưới áp lực 1 tuần là red flag kinh điển của OSS abandonware: feature ra mắt rầm rộ rồi không ai maintain. Auto-sync từ OSV/GHSA giải bus-factor, nhưng vẫn cần buffer test + soak time trước khi gắn lên npm registry public — v1.4.x patch cho phép đăng blog/HN post chỉn chu, không vội.
KEY_RISK: Bỏ lỡ marketing-currency window (đỉnh attention ~7-14 ngày sau incident); v1.4.x ~3-6 tuần có thể quá muộn cho narrative "we shipped this for AI agents".
TWEAK: Compress timeline 6-8h xuống 2 tuần (v1.3.5 minor, không emergency) — pre-announce positioning blog post ngay tuần này để claim narrative, ship code tuần 2. Drop dashboard/freshness UI; giữ hook + auto-sync + sunset metric là đủ cho HN-test.
```

### V3-4: Strategic Product

```
ROLE: Strategic Product
VERDICT: B: Mid-scope 6-8h v1.4.x
STRATEGIC_FRAME: VALID
CONFIDENCE: medium
REASON: The AI-Native Supply-Chain Guard positioning is a genuine moat — Cursor/Copilot/Snyk all assume human-authored lockfiles, leaving a defensible vacuum at the AI-agent-edits-deps boundary. But moats are built on narrative coherence, not panic timing; shipping v1.3.5 in 1 week under incident pressure signals reactive, not strategic, and contradicts ADR-0001 discipline that itself is part of dw-kit's credibility story. v1.4.x lets the narrative land as "deliberate pillar expansion" rather than "ambulance-chasing release."
KEY_RISK: Market-timing window for OSS marketing-currency may compress if a competitor (Socket, Aikido, or Cursor itself) ships an AI-agent-aware guard in the next 4-6 weeks, eroding first-mover claim.
TWEAK: Pre-announce the positioning publicly within 7 days (blog/X post + ADR-0002 link) to plant the flag while shipping deliberately at v1.4.x — claim narrative now, deliver code on quality timeline.
```

### V3-5: Risk/Operational

```
ROLE: Risk/Operational
VERDICT: B: Mid-scope 6-8h v1.4.x
STRATEGIC_FRAME: VALID
CONFIDENCE: medium
REASON: A's 1-week emergency ship is classic post-incident panic-build — high false-confidence risk (guard ships, gets trusted, but adapter is unhardened). C ships too narrow to claim "guard" honestly, which is itself a false-confidence trap (users think they're protected by a fixture). B's read-only auto-sync from OSV+GHSA structurally dissolves bus-factor (multi-maintainer upstreams own data quality), and v1.4.x timing escapes deadline-pressure correlation with abandon-after-ship.
KEY_RISK: Upstream schema drift (OSV/GHSA breaking changes) silently degrading adapter to no-op — failure mode is invisible "guard passes everything" rather than loud crash.
TWEAK: Add adapter health check to `dw doctor` (assert feed schema version + last-successful-sync timestamp; fail loud if stale >7d or schema mismatch) — this is the single non-negotiable countermeasure to drift-induced false confidence; keep everything else minimal per B.
```

---

## Round 4 (Goal/Value Champion, 2026-05-12 evening)

**Trigger:** TechLead identified Bug 5 (effort-anchoring bias) — 5 B-voters all defaulted to human-effort calculus, did not apply AI-augmented capacity multiplier. Goal/Value Champion spawned as mandatory structural counterpart to DA (parallel to Bug 3 fix structure).

### V4-GVC: Goal/Value Champion

```
ROLE: Goal/Value Champion

ADOPT_CASE_FIRST: Shipping an AI-Native Supply-Chain Guard now is the single highest-leverage move dw-kit can make in 2026 — it converts a fresh-in-mind industry incident into durable moat positioning that Snyk/Socket/Cursor cannot retro-fit because they don't own the AI-edit-lockfile boundary. The cost of NOT shipping is permanent: the marketing-currency window closes in ~10 days, the "AI-Native Guard" category gets defined by whoever moves first (likely a VC-funded competitor within 90 days), and dw-kit's 2 dev teams lose a concrete incident-response demonstration that builds organizational trust right when v2.0 adoption depends on it. The Guards pillar is explicitly allowed to grow per ADR-0001 (DA conceded this), auto-sync from OSV/GHSA structurally dissolves the bus-factor concern (DA also conceded), and the sunset-90-days rule caps downside. Deferring is not "safe" — it's choosing invisible opportunity cost over visible execution cost, which is exactly the bias Pragmatic Lean was designed to fight.

INDEPENDENT_VERDICT: A: Ship aggressive 12h v1.3.5

EFFORT_REFRAME: 12h human-equivalent ≈ 3-4h TL time when Claude Code scaffolds hook+CLI+doctor in parallel, telemetry/active-index/hook patterns are reused not rebuilt, and ADR+blog+code draft concurrently — 2026 capacity is multiplicative, not additive.

CONFIDENCE: high

REASON: Three of DA's strongest objections already collapsed (bus-factor, ADR-0001 alignment, AI-specific risk profile); remaining "panic timing" objection is effort-anchored from human-linear framing. With AI-augmented capacity the 1-week ship is comfortable, not panicked — and panic-correlation-with-abandonment evidence comes from human-only orgs, not AI-augmented solo maintainers with sunset rules baked in.

KEY_OPPORTUNITY_COST_IF_DEFER: Permanent loss of category-definition window — "AI-Native Supply-Chain Guard" gets claimed by a competitor in Q3 2026 and dw-kit becomes a follower in its own moat thesis, weakening v2.0 GA narrative right at launch.

TWEAK: Ship full A scope but commit publicly to the 90-day sunset metric in the ADR + release blog — converts "panic ship" critique into "disciplined experiment with kill-switch", neutralizing DA's last rationalization-risk flag.
```

---

## Aggregate (no editorializing, just tally — 8 voters final)

### Verdict count

| Verdict | Count | Voters |
|---|---|---|
| **A: Ship aggressive 12h v1.3.5** | **1 high-conf** | Goal/Value Champion (GVC) |
| B: Mid-scope 6-8h v1.4.x | **5** | Enterprise TL, OSS Maintainer, Strategic Product, Risk/Operational, DA refined (R2) |
| C: Ultra-narrow 3-4h | **0** (DA R1 self-superseded by R2 shift) | — |
| D: Defer | **1** | Solo Dev |

### Strategic frame validity

| Verdict | Count |
|---|---|
| VALID | 4 (Enterprise, OSS, Strategic, Risk) |
| OVERSTATED | 1 (Solo Dev) |
| INVALID | 0 |
| Partial valid | 1 (DA refined) |

### Confidence distribution

| Confidence | Count |
|---|---|
| High | 2 (Solo Dev D, Enterprise TL B) |
| Medium | 4 (OSS, Strategic, Risk, DA refined) |

### Convergent tweaks (5, non-conflicting)

| # | Source | Tweak |
|---|---|---|
| TW1 | OSS + Strategic Product | Pre-announce positioning blog/X post within 7 days; ship code v1.4.x |
| TW2 | Enterprise TL | Pin feed snapshot SHA + log block/allow events to events.jsonl (feed-version + advisory-id) |
| TW3 | Risk/Operational | `dw doctor` health check (schema version + last-sync timestamp, fail loud >7d stale) |
| TW4 | Enterprise TL | Sunset metric includes false-positive rate, not just catch count |
| TW5 | Solo Dev | Opt-in OFF default for `solo` preset |

### Timeline split (among VALID voters)

| Timing | Voters |
|---|---|
| v1.4.x patch ~3-6 weeks | Enterprise TL, Strategic Product, Risk/Operational, DA refined |
| 2 weeks v1.3.5 minor (compress) | OSS Maintainer |
| Pre-announce only this week, ship later | Strategic Product, OSS Maintainer (both) |
| Ship v1.3.5 1 week (TechLead original) | **No voter endorsed** |

---

## Pattern run meta-stats

| Metric | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| Voters spawned | 6 + DA + 2 research = 9 | 5 + DA refined + 2 research (impl) = 6 | 5 voters |
| Voters returning verdict | 1 (DA) | 1 (DA refined) | 5 |
| AUP block rate | 7/8 = 88% | 5/6 = 83% | 0/5 = 0% |
| Bug 4 fix version | none | v1 (clean brief) | v2 (sanitized self-contained artifact) |

Bug 4 v2 fix verified — full panel unlocked when voters reference sanitized self-contained dispute artifact instead of threat-detail files.

---

**End of raw voter panel compile.**

---

## Decision Outcome (added 2026-05-12 evening, post-GVC)

**TechLead override of B-consensus → Path A accepted.** Rationale documented in [ADR-0005](../decisions/0005-supply-chain-guard.md):

- **Bug 5 (effort-anchoring) identified** as structural panel bias — 5 B-voters defaulted to human-effort calculus.
- **GVC's effort reframe** (AI-augmented 3-5x multiplier) collapses panel's "panic timing" objection — 1-week ship is deliberate, not panic, at ~5h TL time.
- **GVC's TW6** (public sunset commitment baked into ADR + release blog) converts panic-ship critique to disciplined-experiment narrative.
- **Solo Dev D-vote** addressed by TW5 (opt-in OFF default for solo preset) — feature-fit concern independent of effort/timing.
- **6 integrated tweaks** from all voters preserved in final scope.

**Implementation:** [.dw/tasks/sc-guard-v1.3.5/](../tasks/sc-guard-v1.3.5/). Ship target 2026-05-19 to 2026-05-22. Sunset review committed 2026-08-12.

**Pattern-doc impact:** Bug 5 added to [multi-agent-decision-pattern.md](multi-agent-decision-pattern.md) §3. Goal/Value Champion now MANDATORY voter paired with Devil's Advocate. Bug 3 (DA) + Bug 5 (GVC) together enforce calibrated debate — neither false-positive-toward-adopt nor false-negative-toward-defer.
