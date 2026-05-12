---
role: arbiter
model: opus-4.7
date: 2026-05-12
title: "Bayesian Inference cho dw-kit — Verdict cuối (Arbiter)"
related-research:
  - .dw/research/bayesian-dw-thinking.md (Agent A — dw-thinking framework)
  - .dw/research/bayesian-plain.md (Agent B — plain analysis)
related-adrs:
  - ADR-0001 (v2 Pragmatic Lean, ship 2026-08-15)
  - ADR-0003 (Pillar 6 Janitors — deferred)
status: Arbiter ruling — non-binding, decision-support for TechLead
sub-agents-used: 0
voting-invoked: false
debate-mode: inline (Task tool unavailable in environment)
---

# Bayesian Inference cho dw-kit — Verdict cuối (Arbiter Ruling)

> Trọng tài: Senior Technical Arbiter (Claude Opus 4.7).
> Input: 2 bản research độc lập (A: dw-thinking framework, verdict DEFER;
> B: plain analysis, verdict adopt narrow 2 UCs). Mục tiêu: ra một quyết
> định triển khai được, không waffle.

---

## 1. Executive Decision

**Verdict: PILOT — narrow, time-boxed, post-v1.4-ship, opt-in.**

Cụ thể:

- **Adopt 1 use case ngay sau v1.4 ship (target: 2026-07-01 — sau ngày
  v1.4 cuts hoàn tất 2026-06-30):** UC2 Bayesian credible interval cho
  cut-analysis report — như một **opt-in reporting layer**
  (`dw metrics cut-analysis --bayesian`), không thay thế threshold
  matrix hiện tại, không gating v1.4 cuts.
- **Defer (revisit conditional):** UC3 estimate calibration → revisit
  khi log-work coverage ≥60% trong 6 tháng liên tiếp.
- **Defer (bundle with parent):** UC5 Naive Bayes classifier cho Pillar
  6 Janitors → đánh giá *khi* ADR-0003 un-deferred, không sớm hơn.
- **Reject:** UC1 (depth routing), UC4 (debate weighting),
  UC6 (ADR superseded prediction), UC7 (risk scoring posterior).

**Timeline:** UC2 implementation 6-8 hours, dogfooded trong v1.4 retro
analysis, không trong v1.4 cut decisions chính.

**Owner:** TechLead (huydv) — solo maintainer, không delegate.

**Effort budget cap:** 8 engineering hours hard cap cho UC2 prototype.
Nếu vượt 8h → abort và đi tiếp ADR-0001 timeline.

**Bottom line cho TechLead:** Cả A và B đều đúng phần nào. A đúng về
framing risk (Bayesian không phải core enabler, mâu thuẫn cut goal).
B đúng về *một* use case cụ thể (UC2) có ROI thực, low-risk, defensible.
Compromise: chạy UC2 **sau** khi v1.4 cuts đã ship bằng threshold cứng
(safe path), dùng Bayesian như reporting upgrade cho retrospective —
không bật làm decision gate cho v1.4. Mọi UC khác defer hoặc reject.

---

## 2. Map of Agreement & Contention

### 2.1 Points of Agreement (A và B đều đồng ý)

| # | Agreement |
|---|-----------|
| AG1 | UC2 (cut criteria credible interval) là use case mạnh nhất, ROI cao nhất |
| AG2 | Conjugate priors (Beta-Binomial, Poisson-Gamma) đủ — không cần MCMC |
| AG3 | Reject UC1 (depth routing Bayesian) — heuristic đủ |
| AG4 | Reject UC4 (debate confidence weighting) — false rigor risk |
| AG5 | UC2 implementation ~4-8h, low complexity |
| AG6 | Bayesian không được phá nguyên tắc "descriptive, not prescriptive" của ADR-0001 |
| AG7 | UX presentation phải dịch posterior thành ngôn ngữ thường ("85% confident") |
| AG8 | Telemetry hiện tại có vấn đề data quality (session-hash undercount, schema thiếu features) |

### 2.2 Points of Contention (A vs B mâu thuẫn)

| # | Contention | A position | B position |
|---|------------|-----------|-----------|
| C1 | **Timing UC2** | DEFER đến *sau* v1.4 ship (post-2026-06-30), opt-in flag | DO IT *trong* v1.4 evaluation, có thể thay/bổ sung `cut-analysis` |
| C2 | **UC3 (estimate calibration)** | Reject hoặc defer ≥12 tháng — data sparse, transfer poor across tasks | Adopt v2.1+ — fit "organizational memory compounding" moat, ROI cao |
| C3 | **Telemetry precondition** | Không nêu là blocker; A chấp nhận data quality kém như lý do reject thêm | Hard precondition: "fix session-hash undercount trước, rác vào rác ra" |
| C4 | **Obsolescence test as decision criterion** | Trung tâm: 6/7 UCs less valuable với smarter AI → strong signal against core | Không apply test — UC2/UC3 tự thân có giá trị independent of AI capability |

### 2.3 Asymmetric Points (chỉ một bên đề cập)

| # | Point | Bên đề cập | Bên thiếu |
|---|-------|-----------|-----------|
| AS1 | UC5 Pillar 6 Janitors classifier (Naive Bayes for AI-waste 4-bucket) | A (best UC trong 7 cái) | B không đề cập |
| AS2 | UC6 ADR superseded prediction + UC7 risk scoring posterior | A (cả 2 reject) | B không đề cập |
| AS3 | "Bayesian-powered governance" là negative marketing trên HN/README | A (Section 4.5) | B không đề cập |
| AS4 | Multi-perspective vote aggregate -6/+10 | A | B không có |
| AS5 | UC5 living docs staleness probability | B (UC4 trong B) | A không tách riêng (gộp vào Bridges) |
| AS6 | Implementation gọn 12-20h cho estimate calibration MVP | B (Đề xuất B) | A nói "≥30 tasks/dev với actuals" — cost cao hơn |
| AS7 | Data sufficiency check vs ADR-0001 "n≥5 devs, ≥21 days" trigger | A (Section 2.4 edge cases) | B (mention "n=10 × 4 weeks") nhưng không link với ADR trigger |

**4 contention quan trọng nhất để debate (theo decision-relevance):**

1. **C1 — Timing UC2** (ảnh hưởng trực tiếp v1.4 ship)
2. **C3 — Telemetry precondition** (gating gì cho gì)
3. **C2 — UC3 estimate calibration** (v2.1+ roadmap signal)
4. **C4 — Obsolescence test as criterion** (meta-level: nên dùng test nào để quyết)

---

## 3. Debate Transcript

> **Method note:** Task/Agent tool không available trong environment này.
> Arbiter chạy inline debate — synthesize từng stance từ source reports +
> context (ADR-0001, ADR-0003, PILLARS, v14-evaluation-protocol, 255
> events trong events.jsonl), rồi tự ruling. Transparency: cùng 1 LLM
> drafting cả 2 stance có self-consistency risk; tuy nhiên cả 2 stance
> được anchor vào *văn bản gốc của A/B*, không bịa. Reader có thể đọc
> chéo với 2 file gốc để verify.

---

### Contention C1: Timing UC2 — DEFER (A) vs DO NOW (B)

**A-stance argument (paraphrase, anchored Section 11 + Section 6):**

> "Don't touch v1.4 cut criteria with Bayesian. v1.4 evaluation protocol
> ([.dw/core/v14-evaluation-protocol.md](.dw/core/v14-evaluation-protocol.md))
> đã chốt threshold matrix + qualitative survey gate. Switching mid-flight
> tạo 3 risks: (a) timeline slip — v1.4 ship deadline 2026-06-30, hiện
> 2026-05-12 mới ngày 1 của collect window; (b) cost-of-switch tăng debate
> trong từng cut ADR ('sao threshold mới?'); (c) re-open ADR-0001
> requirement bất ngờ. Đúng path: ship v1.4 cuts bằng threshold cứng (đang
> hoạt động), dogfood Bayesian như opt-in reporting *sau* — `dw metrics
> cut-analysis --bayesian` chạy lại trên cùng data, so sánh kết quả, ghi
> meta-ADR nếu Bayesian framing produces different conclusion. Đây là
> Tunes-layer experiment, không phải core change. Conditions để greenlight:
> (1) v1.4 đã ship, (2) TL học 2-page Beta-Binomial primer, (3) cut
> decision binary với ROPE rõ, (4) default off."

**B-stance argument (paraphrase, anchored Đề xuất A + Section 3):**

> "v1.4 cut decisions đáng để adopt ngay vì đây ĐÚNG LÀ pain point. With
> n=10 devs × 4 weeks coverage, một skill được 4.2 uses/week/dev là
> borderline với threshold `<5`. Cut hay không cut? Threshold cứng buộc
> binary decision dựa trên point estimate có wide standard error.
> Bayesian biến nó thành 'P(value < 5 | data) = 0.74' — defensible hơn
> cho ADR. v14-evaluation-protocol đã *tự thân* ghi caveat 'session-hash
> proxy undercounts real headcount. If flagged count is borderline →
> lean keep' — đây là **uncertainty quantification được thực hiện ad-hoc
> bằng tay**. Bayesian formalize điều đó. Effort 4-8h, code conjugate
> đơn giản, không cần MCMC, không thay protocol — chỉ thêm column credible
> interval vào output. v1.4 ship deadline đủ rộng: 4 tuần collect chưa
> bắt đầu, có 7 tuần đến ship — 8h là noise."

**Judge Ruling (Arbiter):**

> **A wins the gating question, B wins the implementation question.**
> Tách thành 2 sub-decision:
>
> 1. **Có dùng Bayesian như decision gate cho v1.4 cuts không?** **NO** —
>    A đúng. Lý do hard:
>    - ADR-0001 commitment signals time-box: v1.4 ship by 2026-06-30 OR
>      reopen ADR. Adding decision-rule change mid-flight = de-facto
>      re-open ADR (mỗi cut ADR phải justify Bayesian threshold; team
>      phải align). Cost-of-switch cao, value-of-switch chưa proven.
>    - v14-evaluation-protocol Step 3 đã có qualitative survey gate
>      (<30% answer ≥4 → cut). Survey *đã* hấp thụ uncertainty. Bayesian
>      duplicate signal, không thay survey.
>    - Cut Criteria Matrix là cam kết với 2 teams. Thay rule = pha loãng
>      trust. ADR-0001 Negative consequence #4 nói rõ "Scope creep risk
>      cao — Won't Contain list là defense."
>
> 2. **Có chạy Bayesian như opt-in reporting trên cùng v1.4 data
>    KHÔNG?** **YES** — B đúng. Lý do:
>    - Run cùng data qua cả 2 framing (threshold + credible interval)
>      ZERO marginal data risk — chỉ thêm presentation layer.
>    - Khi cut ADRs viết với threshold, có thể *include* credible
>      interval row làm evidence-strengthener nếu kết quả align, hoặc
>      flag bất đồng nếu diverge. Cả 2 case đều net positive với cost
>      ≤8h.
>    - Match Tunes pillar (config flag, opt-in) — đúng path.
>
> **Concrete ruling**: 
> - Decision rule cho v1.4 stays threshold-based.
> - `dw metrics cut-analysis --bayesian` shipped như opt-in v1.4.x
>   point release (≤v1.4.1), available trong week 5 (analyze phase).
> - Output appears in cut ADRs as evidence supplement, not as gate.
>
> Quote đắt từ B: *"defensible cut decisions"* — true value. Quote đắt
> từ A: *"unforced error on timeline"* — true risk. Solution dung hòa:
> reporting layer, not gate.

---

### Contention C3: Telemetry precondition — Not blocker (A) vs Hard precondition (B)

**A-stance argument (paraphrase, anchored Section 2.4 + Section 3.2):**

> "Telemetry quality không phải gate — nó là constraint khiến Bayesian
> giá trị BIẾN MẤT, không phải tạm hoãn. Section 3.2 liệt kê 6 gaps:
> không có per-task outcome labels, features sparse, identity hash-only,
> log-work optional. Fix tất cả cần expand schema → ADR-0001 cut-50%
> goal đổ. Đây không phải 'fix telemetry trước rồi adopt Bayesian' — đây
> là 'data structure không support, end of story.' Treating as
> 'precondition' implies eventual adoption; A nói rõ: cho 5/7 UCs (depth,
> debate, ADR pred, risk, effort), thậm chí *với* clean telemetry, giá
> trị marginal. Chỉ UC2 và UC5 đáng cân nhắc, và cả 2 chỉ cần subset
> data — UC2 dùng đếm uses/week (đã có), UC5 dùng features từ AST
> (orthogonal với telemetry). Vậy 'telemetry precondition' framing là
> red herring cho 5 UCs khác."

**B-stance argument (paraphrase, anchored "Rủi ro chính khi tích hợp" +
TL;DR điểm 7):**

> "Bayesian không cứu data tồi. Session-hash undercount là known issue
> được flag trong v14-evaluation-protocol. Nếu chạy Bayesian trên data
> undercount, prior phải compensate — nhưng compensate bao nhiêu là gut
> guess. Worse: posterior 'data-backed' giờ thực ra 'data + arbitrary
> compensation guess.' Output 'P=0.85' nghe rigorous, thực tế dựa trên
> assumption sai. Đây không phải red herring — đây là precondition mà
> nếu skip → Bayesian *làm xấu hơn* threshold cứng (threshold ít nhất
> transparent về limitation: 'we measured 4.2, threshold is 5, judgment
> call'). Bayesian post-undercount-fix = real value. Pre-fix = false
> rigor."

**Judge Ruling (Arbiter):**

> **B partially correct, but A's structural point dominates.** Ruling:
>
> - Đối với **UC2 specifically** (cut analysis credible interval): B's
>   precondition is **valid in spirit, but solvable cheaply.** Session-hash
>   undercount inflates *headcount uncertainty*. Cho Beta-Binomial trên
>   "uses/week/dev", denominator (n_devs) bị undercount → inflate
>   uses/dev rate → biased *toward keep* (less cut). Đối với cut decision
>   này là **conservative bias** — favors keeping skills, không over-cut.
>   Acceptable. Không phải hard blocker.
>
> - Đối với **UC3 (estimate calibration) và UC5 (janitor classifier)**:
>   data requirements khác hoàn toàn (per-task actuals / AST features).
>   Telemetry undercount irrelevant. Cả 2 phán xét đứng độc lập với C3.
>
> - Đối với **all 7 UCs aggregate** (B's framing): incorrect to treat
>   as universal precondition. Mỗi UC có data dependency riêng. A đúng
>   structurally — không nên gate everything trên một telemetry fix.
>
> **Concrete ruling**:
> - UC2 PROCEEDS even với current telemetry quality, vì bias direction
>   là conservative (under-cut, not over-cut). Document caveat trong
>   prototype: "credible interval reflects measured uses, headcount
>   denominator may be undercounted → CI lower bound likely overstated.
>   Interpret as 'lower bound of skill value', not point estimate of
>   true value."
> - Session-hash fix tracked separately (existing v14 protocol caveat) —
>   not blocker for UC2 pilot.
>
> Quote đắt từ B: *"rác vào rác ra"* — true cho generic case. Quote đắt
> từ A: *"data structure không support, end of story"* — true cho UC1/4/6/7.
> Ruling splits along UC boundary.

---

### Contention C2: UC3 (estimate calibration) — Defer ≥12mo (A) vs Adopt v2.1+ (B)

**A-stance argument (paraphrase, anchored UC3 in Section 3.3 + Section
4.4 + Section 8):**

> "UC3 fails 3 ways: (1) log-work là optional cho standard depth — data
> sparse, mostly cho thorough only. Cần ≥30 tasks/dev với actuals trước
> khi posterior stable; current rate <5 tasks/dev/month logged → 6+
> months để hit. (2) Each task somewhat unique (codebase context, dev
> identity, learning curve). Transfer learning across tasks weak —
> 'story points fallacy' is empirically documented. Bayesian không sửa
> được lack of stationarity. (3) Obsolescence test fails: smarter AI
> introspects code complexity *directly* from AST, không cần past actuals.
> Estimate becomes pure code-content analysis, Bayesian prior becomes
> stale baggage. 'Organizational memory compounding' moat đề cập trong
> ADR-0001 là về **decisions and context (ADRs, tracking.md)**, không
> phải effort estimates. B nhầm conflate hai."

**B-stance argument (paraphrase, anchored Use case 3 + Đề xuất B):**

> "Calibrated estimate là pain điểm kinh điển. Hubbard 'How to Measure
> Anything' + PERT chứng minh empirical Bayes cho effort prediction là
> well-established. Implementation gọn: lưu (module, task_type, estimate,
> actual) tuple, conjugate update prior mỗi log-work. Output:
> 'Bạn estimate 4h. 12 tasks tương tự, posterior median 5.5h, 80% CI
> [3h, 9h]. Khuyến nghị 5h.' Lý do A reject sai 2 chỗ: (a) 'sparse data'
> là chicken-and-egg — adopt cơ chế thì devs có incentive log; current
> log-work optional vì *không có feedback* để justify effort. (b)
> 'Tasks unique' overstated — at module-level (auth, api-handlers,
> migrations), patterns repeat đủ để prior informative. v2.1+ timing
> đúng — không phải pre-v2.0 GA. Đây là feature đẹp align với moat,
> không phải over-engineering."

**Judge Ruling (Arbiter):**

> **A wins on data-readiness + obsolescence test; B wins on
> chicken-and-egg insight.** Net: **defer with conditional revisit, not
> outright reject.** Detailed:
>
> - A's data-readiness argument is strongest: events.jsonl hiện 255
>   events (file count proxy, không phải estimate-actual pairs). Cho
>   posterior actionable, cần ≥30 paired observations/module — không
>   gần đạt được trong 6 tháng tới ở current adoption.
> - A's obsolescence point is valid but partial: smarter AI có thể infer
>   complexity from code, NHƯNG dev-specific velocity (learning curve,
>   context-switch overhead) is human factor that AI cannot fully infer
>   from code alone. Bayesian effort estimate có residual value as
>   *dev-velocity calibration*, không phải code-complexity prediction.
>   B captures phần này.
> - B's chicken-and-egg insight is sharp: optional log-work → low
>   logging → no Bayesian → no log-work incentive. Real feedback loop
>   problem. Counter-argument: adoption không có boostrap mechanism
>   không tự run; need separate UX/process change để justify log-work,
>   không thể bootstrap by adding Bayesian feature alone.
> - "Organizational memory compounding moat" — A đúng narrow reading
>   (ADR-0001 framing decision memory, không effort estimates).
>   B's extension is plausible but not what ADR-0001 wrote.
>
> **Concrete ruling**:
> - **Defer UC3.** Not "reject forever" (A's framing too strong), not
>   "v2.1+ adopt" (B's framing premature).
> - **Revisit trigger**: when log-work coverage ≥60% across active tasks
>   for 6 consecutive months. Track via existing metrics infra.
> - Earlier exploration permitted as research note (not code) if signal
>   emerges from v1.4/v1.5 telemetry that estimate-actual divergence is
>   real pain.
> - **No code investment until trigger met.**
>
> Quote đắt từ A: *"≥12 months sparse data"* — true for full Bayesian
> stable posterior. Quote đắt từ B: *"feedback loop tự nhiên align với
> moat"* — true vision but premature. Defer with concrete trigger.

---

### Contention C4: Obsolescence test as decision criterion

**A-stance argument (paraphrase, anchored Section 8 + PILLARS.md):**

> "ADR-0001 + PILLARS.md make obsolescence test ('AI smarter → feature
> more valuable?') a **first-class design principle** (Principle 2 trong
> PILLARS Design Principles). 6/7 Bayesian UCs FAIL test: smarter AI
> directly assesses depth (UC1), explains evidence (UC2), introspects
> complexity (UC3), debates rigorously (UC4), reads ADRs (UC6), projects
> risk (UC7). Only UC5 (janitor classifier as cheap pre-filter) survives
> — and only as cost optimization, not capability. Adoption of Bayesian
> as core architecture would lock dw-kit into pattern that depreciates
> as AI improves. PILLARS thesis specifically: 'Records/Bridges become
> more valuable; embedded decision engines become less.' Bayesian as
> embedded decision engine = depreciating asset."

**B-stance argument (paraphrase, anchored ROI framing throughout B):**

> "Obsolescence test is a heuristic, not theorem. Counter-evidence:
> spam filtering (canonical Naive Bayes use case) has only gotten more
> valuable as adversarial spammers improved — not less. Reason:
> probabilistic reasoning under genuinely incomplete observation is
> domain-general, not AI-capability-specific. UC2 specifically — credible
> interval framing for cut decisions is *defensibility* artifact, valuable
> regardless of AI smartness because human readers (TL, devs, future
> auditors) interpret confidence levels. UC3 effort calibration captures
> *dev-specific velocity priors* — encoding human factor that AI cannot
> introspect from code alone. The test should ask: 'Does this feature
> exist because AI is dumb, or because the underlying problem has
> irreducible uncertainty?' For UC2/UC3, latter."

**Judge Ruling (Arbiter):**

> **A wins. The obsolescence test is correct as design principle for
> dw-kit specifically; B's counter-examples don't apply.**
>
> - Spam filtering is *adversarial environment* — uncertainty is
>   structural, attacker-introduced. dw-kit estimate / depth / cut
>   decisions are *non-adversarial introspection* — uncertainty comes
>   from observation gaps that smarter models close. Different regimes.
> - UC2 defensibility argument is real but doesn't require Bayesian.
>   Frequentist confidence intervals serve same purpose. Bayesian
>   credible interval has slight interpretation advantage but not
>   structural. So UC2 survives obsolescence test through *reporting
>   defensibility*, not *decision-making*.
> - UC3 "dev-specific velocity prior" insight: B has a point that
>   AI cannot fully predict individual developer velocity from code
>   alone (learning curve, context-switching). But this is a
>   *human-state-tracking* problem, not a *decision-under-uncertainty*
>   problem in the Bayesian sense. Solvable with simpler approaches
>   (per-dev rolling avg) until proven insufficient.
> - PILLARS thesis (organizational memory) is structurally robust —
>   ADRs and tracking.md remain load-bearing as AI smartens. Embedded
>   Bayesian decision engine is not structural in this sense.
>
> **Concrete ruling**:
> - Obsolescence test IS used as primary criterion for dw-kit features.
> - UC2 passes via reporting-defensibility angle ONLY (not core
>   decision-engine).
> - UC3 fails — defer per C2 ruling above.
> - UC5 passes only as cost-optimization for Pillar 6 (deferred).
> - No reopening of ADR-0001 framing on this basis.
>
> Quote đắt từ A: *"depreciating asset"* — strong frame. Quote đắt từ
> B: *"underlying problem has irreducible uncertainty"* — valid
> framing but doesn't fit dw-kit's use cases as well as A's framing.

---

### Debate summary

4/4 contentions ruled cleanly. No deadlock. **Voting (Phase 3) not
invoked.**

| Contention | Winner | Confidence |
|------------|--------|------------|
| C1 (UC2 timing) | Split: A on gating, B on implementation | High |
| C2 (UC3) | A (with refinement — defer, not reject) | High |
| C3 (telemetry precondition) | Split by UC; A structurally; B for UC2 documented as caveat | Medium-High |
| C4 (obsolescence test) | A | High |

---

## 4. Voting

**Not invoked.** All 4 contentions ruled with sufficient confidence
without specialist polling. Verdict is dispositive.

---

## 5. Final Action Plan

### Pre-conditions (must hold before starting UC2 pilot)

| # | Pre-condition | Owner | Verification |
|---|--------------|-------|--------------|
| P1 | v1.4.0 đã ship per ADR-0001 timeline (target 2026-06-30) | TechLead | `npm dist-tag ls dw-kit` shows 1.4.0+ |
| P2 | v1.4 cut ADRs written with threshold-based evidence | TechLead | `.dw/decisions/` has new ADRs per cut |
| P3 | Effort budget 8h available, not borrowed from v2.0 work | TechLead | Time-tracking |

### Phase 0 — Document this verdict (Day 0, today)

- [x] Write [.dw/research/bayesian-verdict.md](.dw/research/bayesian-verdict.md) (this file)
- [ ] (Optional) Update memory file `project-bayesian-stance.md` —
  recap: "Bayesian = pilot UC2 only, post-v1.4, opt-in reporting."

### Phase 1 — UC2 prototype (target window: 2026-07-01 to 2026-07-07)

**Scope (hard-bounded):**

- Add `src/lib/bayesian-stats.mjs` (~120 LOC):
  - Beta-Binomial posterior for boolean event rates
  - Poisson-Gamma posterior for count rates (uses/week/dev)
  - 95% credible interval helpers
  - ROPE region check (P(rate < threshold))
- Modify `src/commands/metrics.mjs cut-analysis`:
  - Add `--bayesian` flag (default off)
  - Output columns: `point_estimate | 95% CI | P(< threshold | data)`
- Tests: ~60 LOC in `src/smoke-test.mjs` or new test file
- Docs: 1 section in [v14-evaluation-protocol.md](.dw/core/v14-evaluation-protocol.md)
  describing opt-in usage; 2-page primer linked from there

**Out-of-scope (do NOT do during prototype):**

- New skill `/dw:bayes` — forbidden
- New rules file (`.dw/core/BAYESIAN.md`) — forbidden
- Mention in README marketing — forbidden
- Apply to UC1/UC3/UC4/UC5/UC6/UC7 — forbidden
- Change cut decision rule from threshold to credible interval — forbidden

**Success criteria for prototype:**

1. `dw metrics cut-analysis --bayesian` runs on v1.4 evaluation data
   without error.
2. Output is interpretable in 1-page review by TechLead without external
   reference.
3. Output either: (a) agrees with threshold-based cuts (validates rigor),
   or (b) flags ≥1 borderline case as "lean keep due to wide CI"
   (validates value-add).
4. Implementation completes in ≤8h. Hard abort if exceeds.

### Phase 2 — Decide retention (target: 2026-07-15)

After prototype run on v1.4 retro data:

- **If success criteria met + provides decision-grade evidence:** Keep
  as v1.4.x feature, document as opt-in tool. Track usage via
  telemetry; revisit at v2.0 prep for promotion to default or removal.
- **If output is duplicate of threshold (no value-add):** Remove from
  v1.4.1. Write 1-line note in `MIGRATION-v1.4.md` ("Bayesian
  cut-analysis prototype evaluated, found redundant, removed").
- **If implementation exceeded 8h or surfaced unforeseen complexity:**
  Already aborted per hard cap. Document learning.

### Phase 3 — Conditional follow-ups (revisit triggers, not committed)

- **UC3 estimate calibration:** Revisit *only* when log-work coverage
  reaches ≥60% across active tasks for 6 consecutive months. Until
  then, no code, no research time.
- **UC5 Janitor classifier:** Revisit *only* when ADR-0003 un-deferred
  per its own trigger conditions (post-v2.0 GA + waste-accumulation
  signal). At that point, Naive Bayes is a legitimate baseline to
  evaluate alongside rule-based and LLM-based classifiers.
- **UC1, UC4, UC6, UC7:** Rejected. No revisit without new evidence.

### Negative signals (abort triggers)

| # | Signal | Action |
|---|--------|--------|
| N1 | v1.4 ship slips past 2026-07-15 | Abort entire UC2 prototype. Focus on shipping. |
| N2 | UC2 prototype hits 6h with no working output | Cut scope to credible interval only (skip ROPE/Poisson), or abort. |
| N3 | Devs ask "what does P=0.74 mean?" in cut ADR review | Document doesn't pass interpretability bar; remove. |
| N4 | TL bandwidth saturated by v2.0 prep | Defer UC2 to v2.1 window. |

---

## 6. Conditions to Revisit

Quay lại đánh giá toàn bộ Bayesian stance khi MỘT trong các trigger sau:

| # | Trigger | Re-open scope |
|---|---------|--------------|
| T1 | dw-kit adoption hits ≥50 devs across shared/poolable telemetry | UC2 + UC3 (data sufficiency unlocks) |
| T2 | Pillar 6 Janitors un-deferred per ADR-0003 conditions | UC5 in detail |
| T3 | Enterprise customer demands credible interval reporting (regulatory/audit) | UC2 from opt-in → default |
| T4 | Log-work coverage ≥60% × 6 consecutive months | UC3 |
| T5 | Anthropic SDK exposes well-calibrated token posteriors usable as likelihood | UC4 (revisit debate weighting) |
| T6 | v1.4 retro shows threshold matrix produced clearly wrong cuts that Bayesian would have caught | UC2 from opt-in → default; revisit framing |
| T7 | UC2 prototype found redundant in Phase 2 | Reject Bayesian for dw-kit entirely. Close issue. |

---

## 7. What I Could Be Wrong About

Section khiêm tốn — verdict này có 3 weakness điểm:

1. **UC2 prototype có thể produce ambiguous output**: nếu credible
   interval và threshold đồng nhất 100%, value-add zero và TL phí 8h.
   Nếu diverge ở nhiều skill, conversation về "Bayesian threshold đúng
   hơn không?" sẽ tốn nhiều hơn 8h. Verdict assumes middle case (1-2
   borderline catches) which is moderate-probability not certain.
2. **C4 obsolescence test ruling assumes AI capability trajectory is
   monotonic improvement on introspection**. Nếu thực tế: dev-tooling
   LLMs plateau on code-complexity introspection (e.g., context
   limits, novel codebase patterns), thì UC3 estimate calibration
   re-acquires value sooner. Defer trigger có thể quá conservative.
3. **Asymmetric coverage of UC5 (only A discussed)** means verdict's
   "defer with Pillar 6" inherits A's analysis quality. Nếu B đã
   evaluate UC5 và thấy structural objection (vd: false-positive cost
   uneven across waste classes), verdict misses. Mitigation: revisit
   triệt để khi ADR-0003 un-defers — chưa commit now.

Verdict tự tin ≈75%. Không tự tin >90% vì cả 2 source reports đều có
gaps và inline debate không có second-LLM-perspective check.

---

## Appendix: Source citations

- [.dw/research/bayesian-dw-thinking.md](.dw/research/bayesian-dw-thinking.md) — Agent A
- [.dw/research/bayesian-plain.md](.dw/research/bayesian-plain.md) — Agent B
- [.dw/decisions/0001-v2-pragmatic-lean.md](.dw/decisions/0001-v2-pragmatic-lean.md) — ADR-0001 (constraint anchor)
- [.dw/decisions/0003-pillar-6-janitors.md](.dw/decisions/0003-pillar-6-janitors.md) — ADR-0003 (UC5 parent)
- [.dw/core/PILLARS.md](.dw/core/PILLARS.md) — design principles, obsolescence test
- [.dw/core/v14-evaluation-protocol.md](.dw/core/v14-evaluation-protocol.md) — cut decision protocol (UC2 anchor)
- [.dw/metrics/events.jsonl](.dw/metrics/events.jsonl) — 255 events at evaluation time

---

**End of arbiter verdict. Non-binding decision-support for TechLead
(huydv). v2.0 timeline (ship 2026-08-15) protected; UC2 pilot post-v1.4
ship within 8h budget; all other Bayesian UCs defer or reject.**
