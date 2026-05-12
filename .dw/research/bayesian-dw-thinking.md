---
title: "Bayesian Inference cho dw-kit — Đánh giá giá trị thực tế"
method: dw-thinking
date: 2026-05-12
author: research-agent (Claude Opus 4.7)
status: Research note (non-binding)
related-adrs:
  - ADR-0001 (v2 Pragmatic Lean)
  - ADR-0003 (Pillar 6 Janitors — draft)
scope: |
  Khảo sát Bayesian inference (Bayes theorem, Bayesian updating, Naive Bayes,
  Bayes factor, Bayesian networks) và đánh giá có nên áp dụng vào dw-kit hay
  không. Bám sát framework dw-thinking: critical / systems / multi-perspective /
  first-principles, kết luận có trade-off rõ.
verdict-snapshot: |
  DEFER chính thức cho v2.0; PILOT optional cho 1-2 use case sau v2.0 GA nếu
  telemetry hậu-GA đủ data (≥21 days × ≥5 devs × ≥5 events/day/user). Lý do
  chính: dw-kit là context-first governance, không phải decision engine —
  Bayesian thêm complexity mà giá trị edge vs heuristic không rõ ở scale hiện
  tại (10 devs / 1 npm package).
---

# Bayesian Inference cho dw-kit — Đánh giá giá trị thực tế

> **Áp dụng framework dw-thinking** (xem `.dw/core/THINKING.md`):
> Critical · Systems · Multiple Perspectives · First Principles. Kết luận có
> trade-off, không gold-plate, không kết luận "có giá trị" nếu phân tích
> không support.

---

## 0. Lý do nghiên cứu — Câu hỏi gốc

Có nên đưa Bayesian inference (theo nghĩa rộng — bao gồm Bayesian updating,
Naive Bayes classifier, Bayes factor, posterior-based decision) vào dw-kit
như một tooling/method để cải thiện ít nhất một trong các use case sau:

1. Depth routing (P(thorough | features))
2. Telemetry-driven cuts cho v1.4 (Bayesian A/B test thay frequentist)
3. Effort estimation (Bayesian updating của prior task history)
4. Quick Debate confidence weighting (red vs blue arguments)
5. Pillar 6 Janitors: classifier AI-waste
6. ADR superseded prediction
7. Risk scoring trong /dw:plan

Mỗi use case phải vượt qua bar: **"AI thông minh hơn thì Bayesian này có
trở nên valuable hơn không?"** (obsolescence test, theo ADR-0001).

---

## 1. Tóm lược Bayesian inference (1-paragraph version)

**Core formula:**

```
P(H | E) = [ P(E | H) × P(H) ] / P(E)

posterior  =  likelihood × prior  /  evidence
```

- **Prior** P(H): niềm tin trước khi thấy data.
- **Likelihood** P(E | H): nếu hypothesis đúng, observation này có khả năng
  bao nhiêu?
- **Posterior** P(H | E): niềm tin sau khi thấy data.
- **Evidence** P(E): chuẩn hóa, tổng xác suất quan sát data.

**Key derivatives liên quan:**

- **Bayesian updating** — chạy lặp: posterior cũ → prior mới khi data
  streaming.
- **Conjugate priors** — chọn prior cùng họ với likelihood để posterior
  có closed-form (Beta + Binomial, Gamma + Poisson, Normal + Normal).
  Đây là kỹ thuật khiến Bayes A/B test feasible cho dev tooling.
- **Bayes factor** — `P(E|H1) / P(E|H2)`, đo strength of evidence giữa 2
  hypotheses, dùng cho model comparison.
- **Bayesian networks (DAG)** — graphical model encode conditional
  dependencies, hữu ích khi feature có cấu trúc nhân quả.
- **Naive Bayes classifier** — assume feature independence; cheap, dùng
  cho spam, sentiment, text classification.

**Real-world applications phổ biến:**

| Lĩnh vực | Ứng dụng | Vì sao Bayesian phù hợp |
|----------|----------|-------------------------|
| Medical diagnostics | Disease prob given symptoms | Prior từ population rate |
| Spam filtering | P(spam \| word features) | Naive Bayes vs vocabulary lớn |
| A/B testing | Conversion rate posterior | Sequential test không inflated alpha |
| Reinforcement learning | Thompson sampling | Posterior over arm reward |
| Decision theory | Expected utility maximization | Uncertainty quantification |
| Fault diagnosis | Bayesian network of components | Conditional dependencies clear |

**Critiques / limitations:**

1. **Subjective prior** — kết quả phụ thuộc chọn prior; với data nhỏ
   prior dominate.
2. **Computational cost** — Bayesian network / hierarchical model cần
   MCMC, không closed-form → expensive cho real-time.
3. **Cromwell's rule** — gán P=0 cho hypothesis nào → posterior mãi 0
   bất kể evidence (cứng nhắc).
4. **Cold start** — không có data lịch sử → prior chỉ là intuition,
   không hơn heuristic.
5. **Implementation skill barrier** — team không quen Bayes dễ implement
   sai (uniform prior với non-uniform likelihood, etc.).
6. **Legal / explainability** — UK courts từng từ chối Bayes evidence vì
   "đẩy bồi thẩm đoàn vào complexity không phù hợp." Tương tự, devs có
   thể không tin một "P=0.73 thorough depth" nếu không hiểu công thức.

---

## 2. Critical Thinking — Giả định và phản biện

### 2.1 Giả định ngầm của câu hỏi "Bayesian có giúp dw-kit không?"

Liệt kê và đánh dấu giả định nào đáng nghi:

| # | Giả định | Có thể sai không? | Hậu quả nếu sai |
|---|----------|------------------|-----------------|
| A1 | dw-kit có vấn đề mà heuristic hiện tại không xử lý đủ tốt | **Đáng nghi** | Solution tìm problem — anti-pattern |
| A2 | dw-kit có đủ data lịch sử để fit posterior meaningful | **Sai khả năng cao** | Cold start: prior = intuition = không hơn rule cứng |
| A3 | TechLead và 2 teams (10 devs) sẽ hiểu / trust output của Bayesian | Đáng nghi | "Black box" feeling → adoption gãy |
| A4 | Complexity của Bayesian ≪ value mang lại | Cần verify per use case | Over-engineering risk (chính Pillar 6 cảnh báo) |
| A5 | Bayesian là cách *duy nhất* để xử lý uncertainty | **Sai** | Có frequentist, có rule + threshold, có simple weighted score |
| A6 | dw-kit cần optimize decisions theo expected utility | Đáng nghi | dw-kit là governance descriptive, không phải engine prescriptive (ADR-0001) |
| A7 | AI smarter → Bayesian smarter | **Trung tính** | AI smarter có thể implement Bayes đúng hơn, NHƯNG cũng có thể chọn heuristic và explain — không cần Bayes |

**Phản biện ngược (Devil's Advocate):**

> "Nếu KHÔNG có Bayesian, dw-kit có hỏng không?"

Trả lời: **Không.** Cả 7 use case đề xuất đều có baseline non-Bayesian
đang hoạt động (rule-based depth routing, frequentist cut criteria từ
ADR-0001, weighted-sum risk scoring). Không có evidence nào trong codebase
hoặc 235 events telemetry cho thấy baseline đang fail.

> "Lý do mạnh nhất để KHÔNG dùng Bayesian?"

1. **Framing inversion (ADR-0001)** nói rõ: dw-kit chuyển từ prescriptive
   sang descriptive. Bayesian decision = prescriptive. Mâu thuẫn thesis.
2. **Won't Contain list** chứa "Automated doc editing (chỉ suggest)" và
   "AI auto-write ADRs" — Bayesian decisions cũng cùng tinh thần
   "automated decisions humans không hiểu" → vi phạm thesis.
3. **Cost-of-cut > cost-of-not-add**: ADR-0001 đang chật vật cut 50%
   surface area. Add Bayesian layer ngược lại direction này.
4. **n quá nhỏ**: 10 devs × ~21 days × ~5 events/day = ~1050 events.
   Cho hierarchical model với prior per-user × per-skill, posterior
   variance vẫn rất rộng — không actionable hơn rule.

### 2.2 Top 3 Rủi ro nếu adopt Bayesian thiếu suy nghĩ

| # | Rủi ro | Xác suất | Tác động | Tổng |
|---|--------|----------|----------|------|
| R1 | Prior chọn sai → posterior bias, "Bayesian-washed" intuition | High (0.7) | Medium (mất trust hơn rule rõ ràng) | **High** |
| R2 | Bayesian layer làm token footprint phình thêm (Won't Contain conflict) | High (0.8) | High (mâu thuẫn ADR-0001 success criteria) | **High** |
| R3 | Devs không hiểu posterior interpretation → "black box" rejection | Medium (0.5) | Medium (adoption drop) | **Medium** |
| R4 | Cold-start zero data → Bayes degenerate to "smart-sounding heuristic" | High (0.8) cho 6/7 use cases | Low-Medium | **Medium** |
| R5 | Over-engineering signal — kit-audit sẽ flag ngay sau khi merge | Medium (0.5) | Low (rollback dễ) | **Low** |

### 2.3 Phương án thay thế đã xem xét và loại

| # | Phương án | Vì sao xem xét | Vì sao loại |
|---|-----------|----------------|-------------|
| Alt-1 | Frequentist statistics (current cut criteria) | Đã trong ADR-0001 | Đang đủ dùng — không cần thay |
| Alt-2 | Weighted heuristic score (rule + score) | Simple, explainable | Đã ngầm dùng trong depth routing — không cần upgrade |
| Alt-3 | LLM-as-judge (Claude tự đánh giá) | Match descriptive framing | **Đã làm**: Quick Debate là instance này |
| Alt-4 | Decision tree learned từ data | Explainable hơn Bayes | Vẫn cần data — same cold-start vấn đề |
| Alt-5 | Bandit algorithm (Thompson sampling) | Online learning, Bayesian-flavored | Quá cho 10-dev scale, complex setup |
| Alt-6 | Nothing (status quo) | Cost = 0 | **Cạnh tranh đáng nể** với mọi proposed alternative |

### 2.4 Edge cases nếu dùng Bayesian

- **Cold start (new project / fresh install)**: Zero data → posterior = prior
  = arbitrary. Worse than transparent heuristic vì user thấy "0.62" và assume
  data-backed.
- **Solo dev preset**: 1 dev × few tasks → n quá nhỏ cho hierarchical model.
- **Distribution shift**: team chuyển từ web app sang infra repo → prior từ
  history cũ sai. Bayesian không tự detect shift.
- **Adversarial prior**: dev test coverage = 0% nhưng prior P(quality)=0.9 từ
  global data → posterior optimistic dù evidence bad.
- **Anti-correlated features**: API change + DB schema thay đổi cùng lúc.
  Naive Bayes (independence) sai. Bayesian network đúng nhưng cần graph
  manual maintained — burden.
- **Privacy**: telemetry local-only (ADR-0001). Không pool data across teams
  → mỗi team train trên n=10 dev. Posterior overfitted.

---

## 3. Systems Thinking — Dependencies, failure modes, scale

### 3.1 Bayesian sẽ móc vào Pillar nào?

| Pillar | Coupling | Đánh giá |
|--------|----------|----------|
| Guards | Không (Guards là binary block, không probabilistic) | Skip |
| Surfaces | Có thể (posterior dashboard trong ACTIVE.md?) | Marginal — user thấy "0.73" không actionable hơn "thorough" |
| Records | Strong (ADR có thể track "Bayesian model v1, prior beta(2,5), n=120") | Có giá trị **nếu** model thực sự fitted |
| Bridges | Yếu (Bridges là cross-session continuity, không cần probability) | Skip |
| Tunes | Strong (Bayesian tự nó là một "Tune" mode — opt-in config flag) | Match — config flag layer |
| (Pillar 6 Janitors, deferred) | Strong (classifier AI-waste = Bayes use case kinh điển) | **Best fit** nhưng chính ADR-0003 đã defer |

**Insight:** Bayesian fit nhất với 2 pillars (Records / Tunes) cộng Pillar 6
(deferred). Không có pillar nào *cần* Bayesian — chỉ có thể *dùng* nếu
implemented. Không phải structural enabler.

### 3.2 Data dependencies — Telemetry hiện tại có đủ không?

State hiện tại: **`.dw/metrics/events.jsonl`** chứa 235 events (file đo
2026-05-12). Schema gọn:

```jsonl
{"ts":"...","session":"...","event":"hook|skill|task","name":"..."}
```

Thiếu so với cần cho Bayesian:

| Cần cho Bayesian | Có sẵn? | Gap |
|------------------|--------|-----|
| Per-task outcome label (success/fail/rolled-back) | Không | Phải instrument new |
| Per-task features (file count, API change, DB change) | Một phần | Tài liệu trong spec.md, không in jsonl |
| Per-dev identity | Hash only, không persistent | Cross-session aggregate khó |
| Effort actual vs estimate | Một phần (log-work), nhưng optional | Sparse |
| Time-to-completion | Không direct, có thể derive | Need instrument |
| ADR superseded events | Không | Phải parse markdown frontmatter |

**Hậu quả:** Adopt Bayesian cần **invest trước vào telemetry schema** (event
features + outcomes). Đây chính là **scope expansion** mà ADR-0001 đang
fighting against.

### 3.3 Failure modes per use case

#### UC1: Depth routing — P(thorough | features)

- **Failure 1**: New project / fresh install → no data → degenerate to
  default. Same as today's rule.
- **Failure 2**: Posterior P=0.55 cho thorough — user phải tự chọn anyway,
  không hơn current "AI recommend, user override."
- **Failure 3**: Distribution shift (team move stack) → posterior outdated,
  silent.
- **Net**: Marginal value over current heuristic. **Verdict: Reject.**

#### UC2: Telemetry-driven cuts — Bayesian A/B

- **Failure 1**: Cut criteria hiện tại (ADR-0001) đã là threshold-based,
  không có A/B comparison. Bayesian A/B cần 2 variants (e.g., "with vs
  without hook X"). Hiện không có infrastructure để variant.
- **Failure 2**: Effect size khả năng nhỏ (cut 1 hook khó move metrics
  đáng kể). Bayes factor inconclusive → still need qualitative survey.
- **Failure 3**: Conjugate Beta-Binomial cho conversion-style metric OK,
  nhưng "skill use frequency" là count data → Poisson-Gamma, slightly
  different math. Implementable nhưng adds skill barrier.
- **Net**: Có thể *replace* threshold matrix bằng credible interval
  framing ("95% credible interval cho uses/week/dev là [2.1, 4.8]") —
  *more rigorous*, nhưng v1.4 evaluation timeline đã set, cost-of-switch
  cao. **Verdict: Defer to v2.x experiment, not core.**

#### UC3: Effort estimation — Bayesian updating

- **Failure 1**: Estimates hiện tại là LLM-driven (đọc plan, output
  hours). Bayesian prior từ task history yêu cầu **logged actuals**.
  ADR-0001 ghi: log-work là `optional` cho standard, `required` cho
  thorough. Data sparse.
- **Failure 2**: Each task is somewhat unique (codebase context) — prior
  từ tasks khác có transfer kém. Tương tự "story points fallacy."
- **Failure 3**: Bayesian updating tốt cho serial estimation (e.g., dev
  X estimate dev X actual). Nhưng *AI* estimate task X chứ không phải
  dev → "self-calibration" loop khả thi nhưng phức tạp.
- **Net**: Concept đúng — empirical Bayes có giá trị, nhưng cần ≥30
  tasks/dev với actuals trước khi posterior stable. **Verdict: Wait
  until log-work universally adopted, then reconsider.**

#### UC4: Quick Debate confidence weighting

- **Failure 1**: Quick Debate hiện chỉ 2-pass single-agent. Không có
  multi-vote để aggregate. Bayes factor cần ≥2 model outputs.
- **Failure 2**: Mode B (parallel subagents) có 2 outputs → Bayes factor
  feasible *trên giấy*, nhưng each agent đã tự rate severity H/M/L
  rồi. Bayesian wrapper không thêm action signal.
- **Failure 3**: Confidence của LLM is poorly calibrated — feeding likely
  miscalibrated likelihood vào Bayes → posterior cũng miscalibrated.
  Worse: false sense of rigor.
- **Net**: **Reject.** Severity tag + dev judgment đủ; Bayesian thêm
  ceremony.

#### UC5: Pillar 6 Janitors classifier

- **Failure 1**: Pillar 6 đã defer (ADR-0003). Bàn implementation chi tiết
  là premature.
- **Failure 2**: Naive Bayes classifier cho "AI-waste 4 buckets" (trash/
  obvious, trash/likely, trash/debate, keep) khả thi và *match điển hình
  Bayes-friendly problem*. Features: import-count, callsite-count, age,
  comment-ratio. Independence assumption tolerable.
- **Failure 3**: False-positive cost (suggest deletion code đúng) cao →
  cần P(trash | features) > 0.95 để auto-PR, posterior 0.7 → manual
  bucket. Bayesian framing fit perfectly.
- **Net**: **Best use case trong 7 cái**. Bayes deserves consideration
  *khi* Pillar 6 un-deferred — không sớm hơn.

#### UC6: ADR superseded prediction

- **Failure 1**: Volume quá ít (3 ADRs hiện tại). Posterior cho
  P(superseded | age) sẽ wide rộng đến vô dụng.
- **Failure 2**: ADR superseded là semantic event, không emergent. Dev
  biết khi nào supersede, không cần ML.
- **Net**: **Reject as solution to non-existent problem.**

#### UC7: Risk scoring — P(risk materializes | signals)

- **Failure 1**: Risk table hiện trong /dw:plan đã có "xác suất / tác
  động" cột. Hoàn toàn có thể formalize thành Bayes — *nhưng* mỗi project
  unique → no shared prior.
- **Failure 2**: Risk realization tracking không có. Không có ground
  truth labels → không thể fit.
- **Net**: **Defer** until risk-realization tracking instrumented.
  Possibly forever — cost > benefit cho 10-dev shop.

### 3.4 Cascade impact nếu add

```
Add Bayesian layer
  → cần telemetry schema mở rộng
    → cần new lib (e.g., bayesian-stats.mjs)
      → cần unit tests
        → cần docs (.dw/core/BAYESIAN.md? — adds rules surface area)
          → cần skill /dw:bayes? — adds skill, must cut something else
            → conflicts with Won't Contain
              → reopen ADR-0001? — high cost
```

Cascade is **non-trivial**. Quan trọng hơn: dw-kit hiện đang ở v1.3.4
ship-ready, đang push v1.4 cuts trước, v2.0 8/2026. Adding Bayesian là
**unforced error** trên timeline.

### 3.5 Scale — Khi nào Bayesian breakeven?

| Scale | Bayesian value | Heuristic value | Verdict |
|-------|---------------|-----------------|---------|
| 1 dev (solo preset) | ~0 (no data) | Same as heuristic | Heuristic |
| 10 devs (current) | Marginal | Adequate | Heuristic |
| 50 devs (enterprise preset) | Real | Plateaus | Bayesian *if* data-pipe |
| 500 devs (OSS adoption hypothetical) | Strong | Insufficient | Bayesian / hybrid |

dw-kit current target: 10 devs internal + OSS solo coders. **Both ends
hostile to Bayesian** (n nhỏ / no central data). Bayesian breakeven ở
~50+ devs với shared telemetry — **không phải positioning hiện tại**.

---

## 4. Multiple Perspectives — 5 lăng kính

### 4.1 Solo dev (vibe coder, preset `solo`)

- **Cần gì**: Guards on, tốc độ, zero ceremony.
- **Bayesian value**: ~0. Không có data, không có team, không có A/B.
- **Bayesian cost**: Mọi byte rules thêm vào CLAUDE.md = token tax.
- **Verdict**: **Strongly reject.** Solo preset là escape-hatch khỏi
  governance, không phải thêm math.

### 4.2 Team lead (TechLead, audience chính)

- **Cần gì**: Audit trail, velocity, friction giảm, không phải PhD
  thống kê.
- **Bayesian value**: Marginal — credible interval thay threshold trong
  cut analysis có thể *defensible hơn* khi present cho upper
  management. "95% CI cho NPS lift là [+1.2, +3.4]" nghe pro hơn
  "Δ = +2."
- **Bayesian cost**: TL phải explain "prior" cho devs khi push back.
- **Verdict**: **Mildly positive** *cho metrics presentation*; **reject**
  cho operational decisions.

### 4.3 Maintainer dw-kit (TechLead = repo owner)

- **Cần gì**: Cut 50% surface area; clear identity; npm package gọn.
- **Bayesian value**: Inversely correlated với "cut" goal.
- **Bayesian cost**: New lib, new docs, new tests, new skill — adds
  exactly thứ ADR-0001 đang fighting.
- **Verdict**: **Strongly reject** before v2.0 GA. Reconsider only post-GA.

### 4.4 Security / Privacy

- **Cần gì**: Local-only telemetry; no PII leak; deterministic guards.
- **Bayesian value**: Zero. Guards là binary, Bayesian là continuous —
  không thay được.
- **Bayesian cost**: Bayesian models trained on telemetry → if model
  weights ever exfiltrate, có encode patterns of dev behavior. Privacy
  attack surface mở.
- **Verdict**: **Reject** for Guards pillar; **caution** if applied to
  Surfaces pillar.

### 4.5 Business / OSS adoption

- **Cần gì**: dw-kit khác biệt, dễ install, dễ explain trên README.
- **Bayesian value**: Negative — "Bayesian-powered SDLC governance"
  smells of buzzword-driven design. Devs roast trên HN.
- **Bayesian cost**: Adds barrier to entry; OSS contributors khó
  contribute nếu phải hiểu posterior.
- **Verdict**: **Reject** as marketing angle. *Possible* as quiet
  internal optimization once mature.

### Bảng tổng hợp đa góc nhìn

| Góc nhìn | Net value (-2 to +2) | Lý do 1 dòng |
|----------|----------------------|--------------|
| Solo dev | -2 | Anti-thesis của preset solo |
| Team lead | +1 (cho reporting), -1 (cho ops) | Mixed |
| Maintainer | -2 | Mâu thuẫn cut goal |
| Security | -1 | Adds attack surface, không thay binary guards |
| Business / OSS | -1 | Buzzword risk, barrier to contrib |
| **Aggregate** | **-6** (out of +10) | Net negative |

Aggregate -6/+10 cho thấy: nếu vote majority, **Bayesian không nên vào
core v2.0**.

---

## 5. First Principles — Vấn đề thực sự là gì?

Decompose câu hỏi "Bayesian có giúp dw-kit không?" về primitives:

| Primitive | Câu hỏi |
|-----------|---------|
| dw-kit để làm gì? | Cung cấp guards + memory để AI execute SDLC an toàn |
| Bayesian để làm gì? | Quantify uncertainty + update belief với evidence |
| dw-kit có vấn đề uncertainty cần quantify? | Một vài (depth, risk, estimation) — nhưng đều có heuristic adequate |
| Có dữ liệu để feed Bayes? | Hiện không đủ. Cần ~12 tháng telemetry post-v1.4 |
| Có người trên team hiểu Bayes? | TechLead có thể có; 10 devs majority không |
| Có decision quan trọng đến mức cần Bayes vs heuristic? | Cut criteria có thể là 1 ứng viên, nhưng v1.4 timeline đã chốt |

**Rebuilt solution (zero assumption):**

> Vấn đề thực sự không phải "thiếu Bayesian." Vấn đề thực sự là:
> **dw-kit cần show its cuts are data-driven, not gut-feel.**
> ADR-0001 đã thiết kế cut criteria matrix + telemetry để đáp ứng đúng
> nhu cầu đó, **không cần đặt tên "Bayesian."** Nếu sau v1.4 cuts thấy
> credible interval framing giúp explain decisions tốt hơn → swap
> threshold-based statistic bằng Bayesian credible interval *tại layer
> reporting*. Không phải core architecture change.

**Conclusion of first-principles:** Bayesian là **tooling option**, không
phải **structural enabler**. Treat như jest/eslint — adopt khi và chỉ khi
nó solves measured pain.

---

## 6. Dependencies map — Nếu adopt UC2 (Bayesian cut criteria)

Cụ thể hóa best-case scenario: Bayesian cho cut criteria trong v1.4. Nếu
chỉ làm 1 use case, đây là use case ít rủi ro nhất.

```
[telemetry events.jsonl]
       │
       ▼
[lib/bayesian-stats.mjs] ← new file ~150 LOC
       │
       ├─ Beta-Binomial posterior cho "skill use rate"
       ├─ Credible interval [2.5%, 97.5%]
       ├─ ROPE (region of practical equivalence) cho cut decision
       │
       ▼
[src/commands/metrics.mjs cut-analysis] ← modify existing
       │
       ▼
[output report] ← changes from "uses/week/dev = 3.2" 
                  to "uses/week/dev: 3.2 (95% CI [2.1, 4.8]); 
                      P(below threshold 5) = 0.91"
       │
       ▼
[ADR per cut] ← richer evidence section
```

**Implementation cost rough:**

- New code: ~150 LOC (Beta-Binomial + credible interval helpers)
- Modify cut-analysis: ~50 LOC
- New tests: ~80 LOC
- Docs: 1 section in WORKFLOW.md or v14-evaluation-protocol.md
- Skill barrier: 1 page tutorial cho TL
- **Total: ~4-8 hours effort**, low risk.

**Conditions to greenlight UC2 specifically:**

1. v1.4 cut decisions need *defensibility* (regulatory / enterprise audience)
2. TechLead willing to learn 2-page primer on Beta-Binomial
3. Cut decision is binary (cut/keep) with ROPE clearly defined
4. Documented as "advanced reporting" optional, default off

If conditions met → UC2 is a **pilot candidate**, not a core architecture
change. Match Tunes pillar.

---

## 7. Use case ranking

| UC | Description | Data ready? | Value | Cost | Risk | Verdict |
|----|-------------|-------------|-------|------|------|---------|
| UC1 | Depth routing posterior | No | Low | Med | Med | **Reject** |
| UC2 | Cut criteria credible interval | Partial | Med | Low | Low | **Pilot post v1.4** |
| UC3 | Effort estimation updating | No (sparse) | Med-High *if data* | Med | Med | **Defer (≥12mo)** |
| UC4 | Debate confidence weighting | No | Low | High | Med (false rigor) | **Reject** |
| UC5 | Pillar 6 Janitors classifier | Pillar deferred | High (if pillar active) | Med | Low (PR-gated) | **Defer with pillar** |
| UC6 | ADR superseded prediction | No (n=3) | Very Low | Low | Low | **Reject** |
| UC7 | Risk scoring posterior | No labels | Med | Med | Med | **Defer indefinitely** |

**Top 2 viable pilots (lowest risk × non-zero value):** UC2, UC5.

---

## 8. Counterfactual — "What if AI gets 10x smarter?"

Obsolescence test từ PILLARS.md: "AI smarter → feature more valuable?"

| UC | AI 10x smarter → Bayesian still needed? |
|----|----------------------------------------|
| UC1 (depth) | **Less needed**: smarter AI assesses depth từ codebase content trực tiếp |
| UC2 (cut criteria) | **Same or less**: smarter AI can directly explain rule with evidence |
| UC3 (effort) | **Less needed**: AI introspects code complexity better |
| UC4 (debate) | **Less needed**: smarter agents debate without need for weighting |
| UC5 (janitor) | **Maybe more**: classifier role stable; cost matters at scale |
| UC6 (ADR pred) | **Less needed**: AI reads ADR & suggests supersede directly |
| UC7 (risk) | **Less needed**: AI projects risk from architectural understanding |

Result: **6/7 use cases get *less* valuable with smarter AI**. Only UC5
(janitor classifier as cheap pre-filter) survives obsolescence test.
This is consistent with PILLARS thesis: structural enablers (Records,
Bridges) get *more* valuable as AI improves; Bayesian as embedded
decision engine gets *less* valuable.

This is a strong signal **against** baking Bayesian into core architecture.

---

## 9. Comparable tools — Có ai làm Bayesian governance không?

Khảo sát nhanh để gauge "novel" vs "abandoned":

| Tool | Bayesian usage | Status |
|------|----------------|--------|
| Sourcegraph Cody | None visible | Heuristic |
| Cursor / Copilot | Token probabilities (LLM internal), not exposed | Internal only |
| LinearB / Code Climate | Frequentist DORA metrics | Threshold-based |
| Codecov | Frequentist coverage trend | Threshold-based |
| Jellyfish / Pluralsight Flow | Some predictive analytics (likely ML, not pure Bayes) | Enterprise only |
| Sentry | Anomaly detection (Bayesian-ish behind scenes) | Internal, not exposed to dev |

**Pattern**: where Bayesian appears, it's **hidden in product backend**,
not surfaced as "Bayesian governance layer." This supports Section 4.5
verdict — "Bayesian-powered" is **negative marketing**, not positive.

---

## 10. Quy về dw-thinking checklist

Theo `.dw/core/THINKING.md` Section 5 — Plan checklist:

| Checklist item | Status trong analysis này |
|----------------|---------------------------|
| Đã ghi giả định và có thể sai? | Yes — Section 2.1 (7 assumptions, 3 marked đáng nghi/sai) |
| Đã ghi unknowns? | Yes — telemetry feature schema, dev calibration, distribution shift |
| Đã identify failure modes? | Yes — Section 3.3 per-UC |
| ≥2 approaches so sánh? | Yes — Section 2.3 (6 alternatives, status quo wins) |
| Rủi ro & giả định section? | Yes — Section 2.2 |
| Edge cases? | Yes — Section 2.4 |
| Tác động hệ thống? | Yes — Section 3.4 |
| ≥2 góc nhìn? | Yes — 5 perspectives, Section 4 |
| Devil's advocate? | Yes — Section 2.1 ("nếu KHÔNG có Bayesian thì sao?") |

All boxes checked, framework applied faithfully.

---

## 11. Recommended path forward

### What NOT to do

- **Do not** add Bayesian to v2.0 core architecture
- **Do not** create `/dw:bayes` skill
- **Do not** add `.dw/core/BAYESIAN.md` to rules surface
- **Do not** mention Bayesian on README or marketing material
- **Do not** reopen ADR-0001 to insert Bayesian

### What is allowed (low-risk experimentation)

1. **Post v1.4 ship (2026-06-30)**, evaluate if cut-analysis report would
   benefit from credible interval framing (UC2). If TL decides yes:
   - Create `.dw/research/bayesian-cut-analysis-prototype.md` follow-up
   - Implement as opt-in flag `dw metrics cut-analysis --bayesian`
   - Document privately first, surface in v2.1+ if devs find useful
   - **Max budget**: 8 engineering hours
2. **When ADR-0003 un-deferred** (Pillar 6 Janitors), specifically the
   classifier sub-component (6a), Naive Bayes is a legitimate baseline
   to evaluate alongside rule-based and LLM-based classifiers. **Not
   before**.

### Revisit triggers

| Trigger | Action |
|---------|--------|
| dw-kit adoption hits ≥50 devs across shared telemetry | Re-open UC2 + UC3 |
| Pillar 6 un-deferred per ADR-0003 trigger conditions | Evaluate UC5 in detail |
| Enterprise customer demands "data-driven cut justification" with credible intervals | Pilot UC2 |
| Effort log-work universally adopted ≥6 months | Re-evaluate UC3 |

### Negative indicators (signs to abandon Bayesian path)

- v1.4 cut decisions sail through with current threshold matrix — no
  defensibility gap
- Telemetry adoption <50% (signaling dev resistance to instrumentation)
- TechLead bandwidth saturated — no room for advanced analytics

---

## 12. Open questions (for future research)

1. Does Anthropic SDK expose token-level posteriors usable as
   well-calibrated likelihood? (Currently no, but may change.)
2. Empirical Bayes vs full Bayes for n~50 across teams — feasibility?
3. Can Janitor classifier (UC5) leverage shared open-source corpora as
   prior, avoiding cold-start? (Privacy implications.)
4. If LLM-as-judge replaces Bayes for most decisions, what role remains
   for explicit probabilistic reasoning in dev tooling?

---

## TL;DR cho TechLead

Bayesian inference cho dw-kit: **DEFER trước v2.0 GA, PILOT optional sau**.

- **Top 2 use case đáng cân nhắc**: (1) UC2 credible interval cho cut-criteria report sau v1.4 ship — low-cost (~8h), defensible reporting; (2) UC5 Naive Bayes classifier cho Pillar 6 Janitors *khi pillar được un-defer* theo ADR-0003.
- **5 use case khác (depth routing, effort estimation, debate weighting, ADR prediction, risk scoring)**: reject hoặc defer ≥12 tháng do thiếu data, không có ground truth, hoặc mâu thuẫn framing descriptive của ADR-0001.
- **Verdict tổng**: **DEFER**. Lý do 1 câu — dw-kit ở scale 10 devs / cold-start data hiện tại không có vấn đề uncertainty quantification nào mà heuristic + frequentist không xử lý đủ, và adding Bayesian layer chính là loại scope-creep mà ADR-0001 đang fighting để cut 50% surface area.
- **Obsolescence test**: 6/7 use cases trở nên *less* valuable khi AI smarter — strong signal against baking into core.
- **Aggregate multi-perspective vote**: -6/+10 (net negative).
- **Re-open triggers**: Pillar 6 un-deferred, OR adoption ≥50 devs, OR enterprise compliance demand for "credible interval" reports.

Nếu phải làm gì hôm nay: **không làm gì.** Tập trung ship v1.4 cuts theo ADR-0001 timeline.
