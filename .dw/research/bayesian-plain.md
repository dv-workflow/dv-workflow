---
method: plain
date: 2026-05-12
source: https://en.wikipedia.org/wiki/Bayesian_inference
target: dw-kit v1.4.0-dev / v2.0 direction
---

# Bayesian inference — có giá trị gì với dw-kit?

## 1. Bayesian inference — tóm tắt khái niệm

Bayesian inference là phương pháp cập nhật niềm tin (belief) khi có bằng chứng mới, dựa trên định lý Bayes:

```
P(H | E) = P(E | H) * P(H) / P(E)
```

Các thành phần:

- **Prior `P(H)`** — niềm tin ban đầu về giả thuyết H trước khi nhìn data.
- **Likelihood `P(E | H)`** — xác suất quan sát được evidence E nếu H đúng.
- **Posterior `P(H | E)`** — niềm tin đã cập nhật sau khi thấy E.
- **Evidence `P(E)`** — xác suất thấy E nói chung (mẫu số chuẩn hoá).

Tính chất quan trọng cho ứng dụng kỹ thuật:

- **Sequential updating**: posterior của bước trước trở thành prior của bước sau → học liên tục theo thời gian.
- **Quan tâm cả uncertainty**, không chỉ point estimate (output là phân phối, không phải con số duy nhất).
- **Áp dụng phổ biến**: spam filtering, A/B testing, machine learning, risk assessment, decision-making với data tích lũy.

Hạn chế:

- Chọn prior sai → bias kết quả; với data ít, prior chi phối posterior.
- Mô hình phức tạp khó giải kín → cần approximation (MCMC, variational).
- Critics (Popper, Miller) cho rằng Bayesian không "chứng minh" được giả thuyết, chỉ cập nhật niềm tin.
- Người không quen probabilistic reasoning dễ hiểu sai output.

---

## 2. dw-kit hiện đang ở đâu, đặc biệt là các điểm "quyết định dưới bất định"?

Đọc lại [.dw/core/PILLARS.md](.dw/core/PILLARS.md), [.dw/decisions/0001-v2-pragmatic-lean.md](.dw/decisions/0001-v2-pragmatic-lean.md) và [.dw/core/v14-evaluation-protocol.md](.dw/core/v14-evaluation-protocol.md), thấy có ít nhất 5 chỗ dw-kit đang **đoán** hoặc **quyết định dưới bất định**:

1. **Depth routing** (`quick | standard | thorough`) — hiện rule-based theo file count / API change / git blame. Mỗi task là một "phán đoán" về độ phức tạp.
2. **Cut criteria cho v1.4** — quyết định bỏ skill/hook dựa trên threshold cứng: `uses/week/dev < 5`, `latency > 500ms`, etc. Threshold do gut-feel chọn, không có model bất định.
3. **Estimate effort** (`/dw:estimate`) — đoán hours/story-points từ subtasks; có log actual nhưng chưa thấy feedback loop chính thức.
4. **Living docs / 3→2 file invalidation triggers** (ADR-0001): "nếu sau 4 tuần avg tracking.md >400 dòng → reopen". Hiện là hard threshold, không phản ánh độ chắc chắn.
5. **Risk assessment trong `/dw:plan` Quick Debate** — red/blue team đưa ra concerns nhưng không lượng hoá xác suất.

Đặc điểm chung: dw-kit có **rich logging** ([.dw/metrics/events.jsonl](.dw/metrics/events.jsonl) qua [src/lib/telemetry.mjs](src/lib/telemetry.mjs)) nhưng đang dùng nó **frequentist**: đếm, so threshold, cut. Không có cơ chế **cập nhật niềm tin** khi data ít hoặc nhiễu.

---

## 3. Bayesian có thể đóng góp gì? — 5 use cases có giá trị

### Use case 1: Depth routing như một classifier Bayesian (giá trị: trung bình — cao)

**Vấn đề hiện tại**: rule-based depth (`if files > 5 → thorough`) không học từ thực tế. Một task 2 files có thể vẫn là `thorough` nếu chạm auth/crypto, ngược lại 8 files refactor đổi tên cũng có thể là `quick`.

**Cách Bayesian giúp**:
- Prior: phân phối depth dựa trên historical tasks của repo (`P(depth = thorough) = X% qua N tasks gần nhất`).
- Likelihood: features của task (file count, API change, security keywords, module familiarity) → `P(features | depth)` học từ archive `.dw/tasks/archive/`.
- Posterior: `P(depth | features)` cho task mới.

**ROI ước tính**: medium. Cụ thể giúp **giảm sai depth** (quick lúc cần thorough = miss risk; thorough lúc cần quick = ma sát). Nhưng cần ≥20-30 tasks trong archive để prior có ý nghĩa.

**Rủi ro**: over-engineering. Có thể giải quyết bằng heuristic tốt hơn mà không cần Bayes formal.

### Use case 2: Cut criteria v1.4 — Bayesian decision với uncertainty (giá trị: CAO)

**Vấn đề hiện tại**: cut criteria của ADR-0001 dùng threshold cứng (`< 5 uses/week`). Với n=10 dev × 4 tuần coverage, một skill được dùng 3 lần/tuần có thể là:
- (a) thực sự ít giá trị
- (b) đang ở vùng "burn-in" của dogfood
- (c) dùng nhiều nhưng tập trung ở 1-2 dev

Threshold cứng không phân biệt được.

**Cách Bayesian giúp**:
- Prior: "skill này có giá trị với team" với độ chắc chắn nào đó (uniform Beta(1,1) ban đầu, hoặc Beta(a,b) từ teams khác đã dùng v1.3).
- Likelihood: mỗi tuần observe `k_uses` qua `n_sessions` → update Beta posterior.
- Quyết định cut: chỉ cut khi posterior P(value < threshold | data) > 95% confidence.

**ROI**: CAO — đây chính là pain point chính của ADR-0001 ("Cut Criteria Matrix"). Bayesian cho phép:
- Tự tin cut khi data đủ.
- Hold khi data ít — không "cut sai vì coverage_days < 21".
- Trình bày kết quả dưới dạng "85% confident skill X có value < threshold" thay vì binary.

**Cụ thể với dw-kit**: thay `dw metrics cut-analysis` (đang ở [src/commands/metrics](src/commands/metrics)) bằng `dw metrics bayesian-cut` xuất ra confidence interval cho mỗi skill/hook.

### Use case 3: Estimate calibration (giá trị: CAO)

**Vấn đề hiện tại**: `/dw:estimate` đoán hours, `/dw:log-work` ghi actual. Nhưng feedback loop để cải thiện estimate sau (anchor "so với task tương tự trước đây" trong [.dw/core/WORKFLOW.md](.dw/core/WORKFLOW.md) Phase 3) đang ngầm, không formal.

**Cách Bayesian giúp**:
- Prior: ước lượng đầu tiên = belief `H = effort ~ Normal(μ, σ²)`.
- Likelihood: với mỗi task hoàn thành, observe `actual_hours` → update posterior.
- Sau N tasks, dw-kit có thể trả: "Task tương tự task X, Y, Z trước đây — estimate của bạn (4h) có 70% rơi trong [3h, 7h], median 5h. Cân nhắc nâng lên 5h."

**ROI**: CAO — calibrated estimates là vấn đề kinh điển trong team dev. Bayesian là công cụ chuẩn cho việc này (xem cách Hubbard "How to Measure Anything" hoặc PERT làm). Plus, tự nhiên fit "organizational memory compounding" — moat của v2.0.

**Implementation gọn**: lưu thêm `estimate_meta` (μ, σ) vào tracking.md, mỗi `dw:log-work` update prior cho module/task-type.

### Use case 4: Living docs staleness probability (giá trị: trung bình)

**Vấn đề hiện tại**: BRIDGES pillar đề cập "living docs detection — flag when code diverges from docs" (v2.0+). Hiện chưa có implementation; trước đây làm thế nào? Đoán dựa trên git mtime.

**Cách Bayesian giúp**:
- Prior: `P(doc stale | last_updated, n_commits_since, n_files_changed_in_module)`.
- Likelihood: học từ những lần dev chỉnh sửa doc sau một số commit nhất định.
- Output: "module X có 78% khả năng doc đã stale" → suggest update, không auto-edit (consistent với "automated doc editing won't contain" trong ADR-0001).

**ROI**: medium. Vấn đề thật, nhưng có thể giải quyết bằng heuristic đơn giản trước khi cần Bayesian. Phase 2 work, không Phase 1.

### Use case 5: ADR confidence + invalidation triggers (giá trị: thấp — trung bình, nhưng "đẹp về mặt design")

**Vấn đề hiện tại**: ADR-0001 có "Assumptions & Invalidation Triggers" table với threshold cứng (`avg tracking.md > 400 dòng → reopen`). Hai vấn đề:
- (a) Threshold cứng + sample size nhỏ → false alarm hoặc miss.
- (b) Không có cơ chế "decay confidence": ADR viết 6 tháng trước với data từ thời điểm đó, độ tin cậy hôm nay khác.

**Cách Bayesian giúp**:
- Mỗi ADR ghi prior confidence (1-5 hoặc xác suất).
- Khi data mới đến (telemetry, survey), update posterior confidence của assumption.
- Tự động flag ADR khi posterior confidence < threshold → cần revisit.

**ROI**: thấp nếu nhìn chi phí/lợi ích short-term, nhưng align rất tốt với RECORDS pillar và "v2.0 moat = organizational memory compounding". Là feature dài hạn, có thể là v2.1+.

---

## 4. Phân tích phản biện — khi nào KHÔNG nên Bayesian?

Trước khi đề xuất, cần đối lập:

| Concern | Trả lời |
|---------|---------|
| **Over-engineering**: team 10 dev có cần Bayesian không? | Đúng — Use case 1, 4, 5 có thể là over-kill. Chỉ Use case 2, 3 có ROI rõ. |
| **Prior chọn từ đâu?** | Risk thực. Với dw-kit, prior tốt nhất = data từ teams khác đã dogfood v1.3 (n=2 teams × ~10 devs). Vẫn nhỏ. Có thể phải dùng uninformative prior, chấp nhận học chậm. |
| **Telemetry session-hash undercount headcount** (đã ghi trong v14-evaluation-protocol) | Bayesian không sửa được data quality. Cần fix telemetry trước, không phải lý do để áp Bayesian lên data tồi. |
| **Người dùng có hiểu xác suất không?** | Critic kinh điển (juries struggle with probabilistic reasoning). Output cần trình bày kỹ: "85% confident X" thay vì raw posterior PDF. |
| **Phá nguyên tắc "descriptive, not prescriptive"?** | KHÔNG — Bayesian là tool để AI/TL ra quyết định **tự tin hơn**, không bắt dev follow rule mới. Vẫn là descriptive governance. |
| **Có alternative đơn giản hơn?** | Có. Bootstrap, confidence interval frequentist, "weighted moving average" cho estimate calibration. Trước khi Bayesian formal, thử cách đơn giản trước. |

---

## 5. Đề xuất cụ thể — nếu áp dụng vào roadmap

**Không** đề xuất Bayesian như một pillar mới hay framework rewrite. Đề xuất như **decision-support tool** ở 2 chỗ cụ thể:

### Đề xuất A: Bayesian cut analysis cho v1.4 (priority cao)

Bổ sung vào [.dw/core/v14-evaluation-protocol.md](.dw/core/v14-evaluation-protocol.md):

- Thêm subcommand `dw metrics cut-analysis --bayesian` xuất ra: `skill_name, posterior_mean_uses_per_week, 95%_credible_interval, P(value < threshold | data)`.
- Cut decision rule: cut khi `P(uses < 5 | data) > 0.85` (thay vì `point_estimate < 5`).
- Lợi ích: **Defendable cut decisions** khi viết ADR — "85% confident skill X dưới threshold" mạnh hơn "đo được 4.2 lần/tuần".
- Effort: ~4-8h. Conjugate prior (Poisson-Gamma cho count data) đủ, không cần MCMC.

### Đề xuất B: Calibrated estimate (priority trung bình, candidate cho v2.1)

Bổ sung vào `/dw:estimate` và `/dw:log-work`:

- Lưu mỗi (module, task_type, estimate, actual) vào local store.
- Khi estimate task mới: AI query "tasks tương tự trước đây" → posterior distribution của effort → đề xuất range.
- Output: "Bạn estimate 4h. Dựa trên 12 task tương tự, posterior median 5.5h, 80% credible interval [3h, 9h]. Khuyến nghị: 5h."
- Lợi ích: feedback loop tự nhiên, không cần dev nhớ "task X mất bao lâu".
- Effort: ~12-20h cho MVP. Cần data ≥20 tasks/team trước khi posterior có nghĩa.

### KHÔNG đề xuất (giờ)

- Use case 1 (depth Bayesian classifier) — rule hiện tại đủ tốt, ROI chưa rõ.
- Use case 4 (living docs Bayesian) — heuristic đơn giản đủ.
- Use case 5 (ADR confidence decay) — feature đẹp nhưng v2.1+ ưu tiên thấp.

### Rủi ro chính khi tích hợp

- **Telemetry data quality** — Bayesian không cứu data tồi. Phải đảm bảo session-hash counting fix trước (đã flag trong v14-evaluation-protocol).
- **UX presentation** — output xác suất cần map sang ngôn ngữ thường: "high confidence cut" / "needs more data" thay vì PDF.
- **Maintenance burden** — code Bayesian cần unit test riêng. Maintainer là solo TechLead → phải đơn giản (conjugate priors, không MCMC).

---

## TL;DR cho TechLead

1. Bayesian = công cụ cập nhật niềm tin bằng data, đặc biệt mạnh khi quyết định dưới bất định.
2. dw-kit có **≥5 chỗ ra quyết định dưới bất định** đang dùng threshold cứng: depth routing, cut criteria, estimate, living docs, ADR invalidation.
3. **Giá trị cao nhất**: Bayesian **cut analysis** cho v1.4 — biến "đo 4.2/tuần, < 5 → cut" thành "85% confident value < threshold → cut". Defensible ADR.
4. **Giá trị cao thứ hai**: **calibrated estimate** — feedback loop tự nhiên cho `/dw:estimate`, align với "organizational memory compounding" moat của v2.0.
5. **Không nên Bayesian everywhere**: depth routing, living docs, ADR decay — over-engineer cho team 10 dev.
6. Implementation gọn — dùng **conjugate priors** (Beta-Binomial, Poisson-Gamma), không cần MCMC. Ước lượng 4-8h cho Đề xuất A, 12-20h cho Đề xuất B.
7. **Tiền điều kiện**: fix telemetry session-hash undercount trước, không thì rác vào rác ra.
8. Không phá pillar nào — Bayesian là **decision-support layer dưới Tunes/Records**, không thêm pillar mới.
9. Roadmap fit: Đề xuất A vào **v1.4 cut decision** (thay/bổ sung `cut-analysis`). Đề xuất B vào **v2.1+**.
10. Phản biện kinh điển: prior tồi → kết quả tồi; UX xác suất khó cho non-stats devs. Đáp: dùng uninformative prior + trình bày dưới dạng "confidence level" ngôn ngữ.
