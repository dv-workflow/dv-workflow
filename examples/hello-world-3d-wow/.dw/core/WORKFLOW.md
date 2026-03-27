<!-- core-version: 1.0 -->
<!-- last-updated: 2026-03-23 -->

# dw-kit Workflow Methodology

> **Platform-agnostic.** File này chứa methodology thuần — không có Claude syntax, không có tool names.
> Platform-specific execution nằm trong `.dw/adapters/`.

---

## Mục Lục

- [Phase 1: Initialize](#phase-initialize)
- [Phase 2: Understand](#phase-understand)
- [Phase 3: Plan](#phase-plan)
- [Phase 4: Execute](#phase-execute)
- [Phase 5: Verify](#phase-verify)
- [Phase 6: Close](#phase-close)
- [Standalone: Debug](#standalone-debug)
- [Standalone: Reports](#standalone-reports)
- [Meta: Config & Maintenance](#meta-config)

---

## Routing: Chọn Depth Phù Hợp

Đọc `default_depth` từ config. AI sẽ recommend depth dựa trên assessment.
`default_depth` là baseline cho project, nhưng **depth có thể override theo từng task**.

| Depth | Khi nào dùng | Phases bắt buộc |
|-------|-------------|-----------------|
| `quick` | ≤2 files, hotfix, familiar module (touched < 7 ngày) | Understand → Execute → Close |
| `standard` | 3-5 files, module mới, unfamiliar code | Tất cả 6 phases |
| `thorough` | 6+ files, API contract changes, DB schema, security-sensitive | Tất cả 6 phases + arch-review + test-plan |

**Criteria AI dùng để assess (facts, không intuition):**
- File count thay đổi
- API contract changes (public endpoints, exported functions)
- Database schema changes
- Security-sensitive code (auth, crypto, permissions)
- Module familiarity (git blame xem last touched)

### Task-Level Depth Override (Khuyến nghị)

Mỗi task nên có depth riêng, không khóa cứng theo project:

- **Default**: dùng `workflow.default_depth` từ `.dw/config/dw.config.yml`
- **Override**: ghi trực tiếp trong task docs (ví dụ `context.md`)
- **Rule**: task nào có API/DB/security scope thì có thể nâng lên `thorough` dù project đang `standard`

Ưu tiên thực tế: `default_depth` giúp setup nhanh, còn execution quyết định theo rủi ro từng task.

---

<!-- @phase:initialize -->
## Phase 1: Initialize

**Mục tiêu**: Chuẩn bị workspace và hiểu rõ yêu cầu trước khi bắt đầu.

### Guided Questions

Trả lời trước khi tiếp tục:

1. **Task là gì?** Mô tả ngắn 1-2 câu.
2. **Output mong đợi là gì?** Hành vi nào cần thay đổi / tính năng nào cần thêm?
3. **Ai sẽ bị ảnh hưởng?** User cuối / developer / system?
4. **Có deadline không?** Nếu có, ảnh hưởng đến depth choice?
5. **Có dependencies không?** Task này chờ task khác, hoặc task khác chờ task này?
6. **Task depth override không?** (`quick|standard|thorough`) Nếu có, ghi rõ lý do.

### Output Phase 1

- [ ] Task docs tạo tại `{paths.tasks}/[task-name]/`
- [ ] 3 files: `[name]-context.md`, `[name]-plan.md`, `[name]-progress.md`
- [ ] Context file có: yêu cầu gốc + scope assessment + depth recommendation

### Readiness Check

Đủ điều kiện sang Phase 2 khi:
- Yêu cầu rõ ràng (không ambiguous)
- Depth đã chọn
- Task docs tạo xong

---

<!-- @phase:understand -->
## Phase 2: Understand

**Mục tiêu**: Khảo sát codebase để hiểu đầy đủ trước khi thiết kế solution. **Không code ở phase này.**

### Quy Trình Khảo Sát

1. **Breadth first**: Tìm tất cả files, modules liên quan đến task
2. **Dependency mapping**: Ai gọi gì, data đi từ đâu đến đâu
3. **Pattern recognition**: Conventions, design patterns trong project hiện tại
4. **History**: Thay đổi gần đây liên quan (git log/blame)
5. **Test coverage**: Hiện tại cover gì, thiếu gì
6. **Gaps**: Gì chưa rõ, cần làm rõ trước khi plan

### Guided Questions

Phải có câu trả lời cho tất cả trước khi kết thúc phase:

1. **Files nào sẽ thay đổi?** Liệt kê cụ thể.
2. **Ai phụ thuộc vào những files đó?** Upstream và downstream.
3. **Pattern hiện tại là gì?** Tôi nên follow pattern nào?
4. **Test coverage hiện tại?** Thiếu ở đâu?
5. **Có gotchas/tech debt nào liên quan?** Git history có gì cảnh báo?
6. **Giả định nào tôi đang dùng?** Có thể sai không?

### Context Completion Protocol

Khi context thiếu, AI không dừng và chờ. AI:
1. Phân tích codebase để pre-fill answers
2. Trình bày: "Tôi tìm được: [findings]. Xác nhận hoặc sửa?"
3. Developer confirm/correct
4. Proceed

### Output Phase 2

- [ ] `[name]-context.md` điền đầy đủ
- [ ] Files liên quan: listed với vai trò rõ ràng
- [ ] Kiến trúc hiện tại: documented (diagram nếu cần)
- [ ] Gaps: identified, resolved hoặc flagged
- [ ] Test coverage: assessed

### Readiness Check

Đủ điều kiện sang Phase 3 khi:
- Tất cả 6 guided questions có câu trả lời
- Không còn câu hỏi critical chưa giải đáp
- Files liên quan đã identified

> **Quick depth**: Nếu task đơn giản và familiar, có thể kết hợp Phase 2+3 nhanh.

---

<!-- @phase:plan -->
## Phase 3: Plan

**Mục tiêu**: Thiết kế solution trước khi viết một dòng code. **Không implement ở phase này.**

### Deep Analysis Protocol (thorough depth)

Trước khi viết plan, bắt buộc với `thorough` depth:

1. **Liệt kê ≥3 approaches** — kể cả những approach không obvious
2. **Với mỗi approach**: assumptions, failure modes, trade-offs
3. **Devil's advocate**: lý do mạnh nhất để KHÔNG chọn approach đang nghiêng về
4. **Chỉ sau khi exhausted góc nhìn**, chọn approach và viết plan

### Guided Questions

1. **Tại sao approach này?** So với alternatives, trade-offs là gì?
2. **Subtasks có đúng thứ tự không?** Schema/data → logic → API → tests → docs
3. **Mỗi subtask có acceptance criteria đo lường được không?**
4. **Risk lớn nhất là gì?** Có plan B không?
5. **Breaking changes không?** Nếu có, migration strategy là gì?
6. **Estimate có realistic không?** So với tasks tương tự trước đây?

### Subtask Granularity

Mỗi subtask phải:
- Thay đổi ≤3 files
- Hoàn thành trong ≤4 giờ
- Có acceptance criteria đo lường được
- Commit được độc lập

**Thứ tự chuẩn:**
1. Schema/data model changes
2. Service/business logic
3. API/interface layer
4. Tests (hoặc test-first nếu TDD)
5. Documentation

### Role Variants

- **Nếu có TL**: Plan DỪNG chờ TL arch-review trước khi Execute
- **Nếu có QC**: QC tạo test plan song song với dev plan
- **Nếu có BA**: BA review requirements trước khi plan

### Output Phase 3

- [ ] `[name]-plan.md` hoàn chỉnh
- [ ] ≥2 approaches so sánh
- [ ] Subtasks với dependencies, criteria, estimate
- [ ] Risk table với mitigation
- [ ] Edge cases listed
- [ ] **DỪNG**: chờ human approve trước khi Execute

### Readiness Check

Đủ điều kiện sang Phase 4 khi:
- Plan có human approval (explicit "approved" hoặc "go ahead")
- Nếu có TL: TL đã review architecture decisions
- Risk table không có unmitigated critical risks

---

<!-- @phase:execute -->
## Phase 4: Execute

**Mục tiêu**: Implement theo plan đã approve. **Một subtask = một commit.**

### TDD Workflow (mỗi subtask)

```
1. Viết test trước (failing) → RED
2. Implement tối thiểu để test pass → GREEN
3. Refactor nếu cần → REFACTOR
4. Commit subtask
```

Nếu task không có tests: viết tests sau implement, nhưng TRƯỚC khi mark subtask Done.

### Execution Rules

1. **Đọc plan trước khi bắt đầu mỗi subtask** — không làm từ memory
2. **Chỉ làm đúng scope của subtask** — không "while I'm here" fixes
3. **Gặp ambiguity → DỪNG và hỏi** — không tự suy diễn cho thay đổi lớn
4. **Phát hiện scope thay đổi → cập nhật plan, hỏi human** trước khi tiếp tục
5. **Mỗi subtask done = update progress file + commit**

### Khi Gặp Blockers

```
1. Ghi blocker vào progress file (mô tả, context)
2. Xác định: blocker có thể self-resolve không?
   - Có: document approach, proceed
   - Không: DỪNG, escalate, ghi next-steps rõ ràng
3. Không bao giờ silent-skip subtask
```

### Output Phase 4

- [ ] Mỗi subtask: code implemented + tests pass
- [ ] Progress file cập nhật sau mỗi subtask
- [ ] Mỗi subtask: 1 commit (format chuẩn)
- [ ] Không còn debug code (console.log, debugger)

---

<!-- @phase:verify -->
## Phase 5: Verify

**Mục tiêu**: Đảm bảo implementation đúng, đủ, và safe trước khi merge.

### 4-Layer Quality Check

**Layer 1: Self-review** (luôn bắt buộc)
- [ ] Logic đúng? Edge cases handled?
- [ ] Tests cover happy path + error cases + edge cases?
- [ ] Không có debug code còn sót?
- [ ] Naming rõ ràng, self-documenting?

**Layer 2: Automated gates** (nếu `test_command` + `lint_command` configured)
- [ ] Tests pass: `{quality.test_command}`
- [ ] Lint pass: `{quality.lint_command}`
- [ ] No sensitive data in diff

**Layer 3: Peer/TL review** (nếu `standard` hoặc `thorough` depth + có peer/TL)
- [ ] TL review architecture decisions
- [ ] Peer code review theo checklist
- [ ] A/B testing cho uncertain decisions (nếu applicable)
- [ ] Decisions logged trong task docs

**Layer 4: QA confirmation** (nếu `thorough` depth + có QC role)
- [ ] QC review against test plan
- [ ] QC sign-off là explicit gate (không tự approve)
- [ ] Regression checks pass

### Review Output Format

Reviewer báo cáo phải phân loại theo mức độ:
- **CRITICAL**: Phải sửa trước merge
- **WARNING**: Nên sửa
- **SUGGESTION**: Cân nhắc

### Output Phase 5

- [ ] Tất cả CRITICAL issues resolved
- [ ] Automated gates pass (nếu configured)
- [ ] Review sign-off (peer/TL/QC theo depth)
- [ ] Living docs cập nhật (nếu `thorough` và có thay đổi architecture/API)

---

<!-- @phase:close -->
## Phase 6: Close

**Mục tiêu**: Kết thúc task đúng cách — commit, track, handoff, archive.

### Commit Convention

```
<type>(<scope>): <mô tả ngắn ≤72 ký tự>

[Chi tiết nếu cần]

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`

**Pre-commit checklist:**
- [ ] Không có debug code
- [ ] Không có sensitive data (passwords, API keys, tokens)
- [ ] Tests pass
- [ ] Commit message rõ ràng

### Effort Tracking (nếu enabled)

```
Estimate (Phase 3) → Log Actual (Phase 4) → Compare (Phase 6)
  → Feed into velocity → Improve future estimates
```

### Handoff Protocol

Cuối session (không kết thúc không handoff):
1. **Auto-summarize**: done / in-progress / blocked
2. **Git state**: uncommitted changes, recent commits
3. **Next steps**: ordered action list với context
4. **Context anchors**: key decisions và tại sao

### Archive (khi task hoàn toàn done)

Move task docs từ `{paths.tasks}/` → `{paths.tasks}/archive/` sau khi:
- PR merged
- QA sign-off (nếu applicable)
- Docs updated

### Output Phase 6

- [ ] Final commit(s) với message chuẩn
- [ ] Progress file: trạng thái = Done, kết thúc date filled
- [ ] Effort log updated (nếu enabled)
- [ ] Handoff notes ghi (nếu bàn giao)
- [ ] Task archived (sau merge)

---

<!-- @standalone:debug -->
## Standalone: Debug

**Dùng khi**: Gặp bug, test fail, hoặc behavior bất thường. Không cần qua full workflow.

### Quy Trình: Investigate → Diagnose → Fix

**Bước 1: Investigate**
- Reproduce issue: exact steps, exact error message
- Scope: xảy ra ở đâu? Khi nào? Frequency?
- Recent changes: git log trong khu vực liên quan
- Gather evidence: logs, stack traces, error messages với file:line

**Bước 2: Diagnose**
- Hypothesis: "Lỗi có thể do X vì Y"
- Verify: test hypothesis với minimal evidence
- Root cause: phân biệt symptom vs cause
- Đừng fix symptom nếu chưa biết root cause

**Bước 3: Fix**
- Fix root cause (không symptom)
- Test fix: reproduce original issue → không còn reproduce
- Regression: kiểm tra fix không break thứ khác
- Commit với message rõ: "fix(scope): mô tả vấn đề và cách fix"

### Debug Guided Questions

1. **Exact error**: message chính xác là gì? Stack trace ở đâu?
2. **Reproducible**: luôn xảy ra hay intermittent? Điều kiện nào?
3. **Recent changes**: git log trong khu vực này có thay đổi gì gần đây?
4. **Expected vs actual**: behavior mong đợi là gì, thực tế là gì?
5. **Root cause hypothesis**: "Tôi nghĩ lỗi do ___ vì ___"

---

<!-- @standalone:reports -->
## Standalone: Reports

**Dùng khi**: PM cần dashboard, team cần sprint review.

### Dashboard Report

Tổng hợp cho PM:
- Tasks status: done / in-progress / blocked / planned
- Velocity: tasks completed per sprint
- Effort: estimate vs actual (nếu tracking enabled)
- Quality metrics: bug rate, review findings trend
- DORA metrics (nếu available): deployment frequency, lead time, MTTR, change failure rate

### Sprint Review Report

Tổng kết sprint:
- Completed: tasks done, features delivered
- Incomplete: tasks carried over và lý do
- Metrics: velocity, quality indicators
- Lessons learned: gì worked, gì didn't
- Next sprint: items đề xuất, dependencies

---

<!-- @meta:config -->
## Meta: Config & Maintenance

### Config Validation

Trước khi dùng toolkit, validate config:
- Tất cả required keys có mặt?
- Enum values hợp lệ? (depth, roles, estimation_unit)
- `team.roles` listed có phù hợp với team thực tế?
- `quality.test_command` và `lint_command` chạy được không?

### Upgrade Toolkit

Khi có version mới:
1. Check compatibility: core version vs platform version
2. Preview changes: `--dry-run` trước khi apply
3. Backup config trước khi upgrade
4. Apply: generated/ files update, overrides/ giữ nguyên
5. Verify: smoke tests sau upgrade

### Rollback

Nếu plan sai hoặc execute sai hướng:
1. Identify: subtask nào bắt đầu đi sai?
2. Revert: task docs về trạng thái đúng
3. Re-plan từ điểm đó
4. Không silent-continue khi biết hướng sai

---

## Appendix: Depth × Phase Matrix

| Phase | Quick | Standard | Thorough | Requires |
|-------|-------|----------|----------|---------|
| Initialize | ✓ | ✓ | ✓ | dev |
| Understand | ✓ | ✓ | ✓ | dev |
| Plan | skip | ✓ | ✓ | dev |
| Arch Review | skip | if TL | ✓ | techlead |
| Test Plan | skip | skip | ✓ | qc |
| Execute TDD | ✓ | ✓ | ✓ | dev |
| Peer Review | self | ✓ | ✓ | dev+peer |
| QA Confirm | skip | skip | ✓ | qc |
| Living Docs | skip | skip | ✓ | dev |
| Estimation | skip | optional | ✓ | dev |
| Log Work | skip | optional | ✓ | dev |
| Dashboard | skip | skip | ✓ | pm |

> Nếu role không có mặt trong `team.roles`, phase đó gracefully degrade (không block).
