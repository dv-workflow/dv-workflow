# dw-kit — Get Started Guide

> Dành cho dev mới lần đầu dùng dw-kit. Đọc hết file này (~10 phút) để hiểu toàn bộ toolkit.

---

## 1. dw-kit là gì?

**dw-kit** là AI workflow toolkit — bộ công cụ giúp AI (Claude Code, Cursor) làm việc có cấu trúc, đảm bảo chất lượng, và không bị "lạc" khi thực hiện task phức tạp.

Thay vì chat trực tiếp với AI, bạn dùng `/dw:skill-name` để AI thực hiện từng phase theo quy trình chuẩn.

---

## 2. Cài đặt

```bash
npm install -g dw-kit       # cài CLI
dw init                     # setup trong project
```

Sau khi init, project của bạn có cấu trúc:
```
my-project/
  .dw/                      ← tất cả toolkit files (hidden)
    core/                   — methodology (WORKFLOW.md, THINKING.md, ...)
    config/dw.config.yml    — cấu hình project
    adapters/               — platform adapters
    tasks/                  — task docs (tạo khi làm việc)
  .claude/                  — skills, agents, hooks (cho Claude Code)
  CLAUDE.md                 — project context cho AI
```

---

## 3. Cấu hình project (`.dw/config/dw.config.yml`)

File quan trọng nhất. Kiểm tra ngay sau khi `dw init`:

```yaml
project:
  name: "my-project"
  language: "vi"            # vi | en

workflow:
  default_depth: "standard" # quick | standard | thorough ← quan trọng

team:
  roles: ["dev", "techlead"]

quality:
  test_command: "npm test"  # lệnh chạy test
  lint_command: "npm run lint"
  block_on_fail: false      # true = block commit nếu test fail

tracking:
  estimation: true          # bật/tắt estimation
  log_work: false           # bật/tắt effort logging
  estimation_unit: "hours"  # hours | story-points | t-shirt
```

### Chọn `default_depth`:

| Depth | Dùng khi | Skills được dùng |
|-------|----------|-----------------|
| `quick` | Solo dev, hotfix, task nhỏ quen thuộc | task-init, research (tùy), commit |
| `standard` | Team, feature mới, sprint task | research → plan → execute → review → commit |
| `thorough` | Enterprise, API/DB/security thay đổi, high-risk | requirements → estimate → research → arch-review → plan → test-plan → execute → docs-update → log-work → commit |

> **Lưu ý**: `default_depth` là baseline cho toàn project. Với task cụ thể rủi ro cao (DB migration, API contract change), bạn có thể ghi `Depth: thorough` trong task context để override.

---

## 4. Cách dùng Skills

Skills là các `/command` bạn gọi trong Claude Code (hoặc Cursor):

```
/dw:skill-name [argument]
```

**Ví dụ:**
```
/dw:task-init user-auth
/dw:research user-auth
/dw:plan user-auth
/dw:execute user-auth
```

---

## 5. Danh sách đầy đủ Skills

### 🚀 Orchestrator (bắt đầu ở đây)

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:flow` | `[task-name]` | **Chạy toàn bộ workflow một mạch** — AI tự drive từ research → plan → execute → review → commit, dừng tại human checkpoints để bạn approve/feedback |

### 🔵 Core Workflow (dùng từng bước)

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:task-init` | `[task-name]` | Tạo thư mục và 3 doc files (context, plan, progress) |
| `/dw:research` | `[task-name]` | Khảo sát codebase, tìm patterns và dependencies |
| `/dw:plan` | `[task-name]` | Lập kế hoạch implementation, phân chia subtasks. **DỪNG để approve** |
| `/dw:execute` | `[task-name]` | Implement theo plan đã approve (TDD, commit từng subtask) |
| `/dw:review` | `[task-name\|branch\|file]` | Review code: correctness, security, test coverage |
| `/dw:commit` | `[message]` | Smart commit với quality checks (test/lint tự động) |

### 🟡 Quality & Planning

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:requirements` | `[feature-name]` | BA skill: viết requirements + user stories |
| `/dw:estimate` | `[task-name]` | Ước lượng effort từ plan (cần `tracking.estimation: true`) |
| `/dw:arch-review` | `[task-name]` | TL skill: review architecture + feasibility |
| `/dw:test-plan` | `[task-name]` | QC skill: tạo test cases + regression checklist |
| `/dw:debug` | `[mô tả vấn đề]` | Debug có hệ thống: Investigate → Diagnose → Fix |
| `/dw:thinking` | `[vấn đề]` | Áp dụng critical/systems/first-principles thinking |

### 🟢 Tracking & Reporting

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:log-work` | `[task-name]` | Ghi effort thực tế, so sánh với estimate (cần `tracking.log_work: true`) |
| `/dw:docs-update` | `[all\|api\|architecture\|task-name]` | Cập nhật living docs theo code changes |
| `/dw:dashboard` | `[sprint\|last-week\|all]` | PM report: tasks, metrics, velocity |
| `/dw:sprint-review` | `[sprint-name]` | Tổng kết sprint cho team retrospective |
| `/dw:handoff` | `[task-name]` | Tạo handoff doc để bàn giao session |

### 🟣 Adoption (dùng khi adopt dw vào project đang chạy)

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:onboard` | _(không có)_ | Scan toàn bộ codebase hiện có, tạo project map + module context docs — chạy **một lần** khi adopt |
| `/dw:retroactive` | `[feature-name]` | Retroactive document một feature đã implement trước khi dùng dw — reverse-engineer từ code + git history |

### ⚙️ Toolkit Management

| Skill | Argument | Mô tả |
|-------|----------|-------|
| `/dw:config-init` | `[project-name]` | Tạo config mới (khi không dùng `dw init`) |
| `/dw:config-validate` | _(không có)_ | Kiểm tra config file có hợp lệ |
| `/dw:upgrade` | _(không có)_ | Cập nhật toolkit files lên version mới |
| `/dw:archive` | `[task-name\|--all-done]` | Move task docs đã xong vào archive |
| `/dw:rollback` | `[task-name] [checkpoint]` | Revert task docs về checkpoint trước |

---

## 6. dw-flow — Workflow Một Mạch (Khuyến Nghị)

Thay vì gọi từng skill một, dùng `/dw:flow` để AI tự drive toàn bộ:

```
/dw:flow user-auth
```

AI sẽ tự động:
1. Tạo task docs
2. Khảo sát codebase
3. Lập kế hoạch → **[GATE: bạn approve hoặc revise]**
4. Implement từng subtask
5. Review code → **[GATE: bạn confirm hoặc yêu cầu fix]**
6. Commit

**Các options tại mỗi checkpoint:**
```
→ ok / continue          Tiếp tục
→ revise: [feedback]     AI chỉnh sửa rồi hỏi lại
→ skip [phase]           Bỏ qua phase
→ stop                   Dừng, tiếp tục sau
```

**Ví dụ interaction:**
```
/dw:flow payment-refund

▶ Phase 1: Task Init... ✓
▶ Phase 2: Research... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [GATE A] — Confirm Research
  • Found: RefundService.ts, payment-gateway adapter
  • Risk: Stripe webhook idempotency cần xử lý
  • Suggest: thorough depth vì payment-critical
  Options: ok / revise: ... / stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ok

▶ Phase 3: Plan... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [GATE C] — Approve Plan ← HARD GATE
  • 4 subtasks, ~8h estimate
  • Risk: idempotency key (medium)
  • Files: RefundService.ts, refund.test.ts, webhook.ts
  Options: approved / revise: ... / stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> revise: thêm subtask validate refund amount không vượt original charge

[AI cập nhật plan với subtask mới]

━━ [GATE C lại] ━━
> approved

▶ Phase 4: Execute... (4/4 subtasks) ✓
▶ Phase 5: Review... ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [GATE D] — Approve Changes
  • 0 Critical, 1 Warning (missing error log), 2 Suggestions
  Options: ok / revise: fix warning / stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> revise: fix the warning

[AI fix error log, re-run review]
> ok

▶ Commit... ✓

╔════════════════════════════════════╗
║  ✅ Complete: payment-refund
║  4/4 subtasks, 3 commits, ~7.5h
╚════════════════════════════════════╝
```

---

## 7. Workflow từng bước (Manual)

### Quick — Solo dev / Hotfix

```
/dw:task-init fix-null-crash
# → Code trực tiếp
/dw:commit "fix: handle null user in session"
```

### Standard — Team / Feature (khuyến nghị mặc định)

```
/dw:task-init user-auth
/dw:research user-auth          # AI khảo sát codebase
/dw:plan user-auth              # AI lập kế hoạch → BẠN APPROVE
/dw:execute user-auth           # AI implement từng subtask
/dw:review user-auth            # AI review code
/dw:commit "feat(auth): add JWT login flow"
```

### Thorough — Enterprise / High-Risk

```
/dw:task-init payment-gateway
/dw:requirements payment-gateway    # BA viết requirements
/dw:estimate payment-gateway        # Estimate effort
/dw:research payment-gateway        # Khảo sát codebase
/dw:arch-review payment-gateway     # TL review architecture
/dw:plan payment-gateway            # Lập kế hoạch → BẠN APPROVE
/dw:test-plan payment-gateway       # QC tạo test plan
/dw:execute payment-gateway         # Implement
/dw:review payment-gateway          # Code review
/dw:docs-update payment-gateway     # Cập nhật docs
/dw:log-work payment-gateway        # Ghi effort thực tế
/dw:commit "feat(payment): integrate Stripe checkout"
```

---

## 7. Files được tạo cho mỗi Task

Khi chạy `/dw:task-init feature-name`, AI tạo:

```
.dw/tasks/feature-name/
  feature-name-context.md     # Research findings + codebase analysis
  feature-name-plan.md        # Implementation plan (cần approve)
  feature-name-progress.md    # Progress tracking, commit log
```

Với `thorough`, còn có thêm:
```
  feature-name-requirements.md   # (từ /dw:requirements)
  feature-name-test-plan.md      # (từ /dw:test-plan)
```

---

## 8. Quy trình Approve Plan

**QUAN TRỌNG**: `/dw:plan` sẽ DỪNG và chờ bạn approve trước khi execute.

Khi xem plan, kiểm tra:
- [ ] Approach có đúng hướng không?
- [ ] Subtasks có đủ nhỏ, actionable không?
- [ ] Rủi ro đã được xác định?
- [ ] Scope có nằm trong yêu cầu không?

Để approve:
```
# Gõ "approved" hoặc "ok proceed" trong chat
approved

# Sau đó:
/dw:execute feature-name
```

Nếu cần chỉnh sửa plan trước khi approve → chỉnh trực tiếp trong file `.dw/tasks/feature-name/feature-name-plan.md`.

---

## 9. Task-Level Depth Override

Project có `default_depth: standard` nhưng một task cụ thể rủi ro cao → override:

Trong file `feature-name-context.md`, ghi:
```markdown
## Depth: thorough
## Depth Source: override (task-specific)
## Override Reason: DB schema migration + API contract change
```

AI sẽ đọc và áp dụng thorough workflow cho task này, dù project config là standard.

---

## 10. CLI Commands (dw)

Ngoài skills (dùng trong Claude Code), còn có CLI:

```bash
dw init                     # Setup dw-kit trong project (interactive)
dw init --preset solo-quick # Setup nhanh với preset
dw init --silent            # CI mode (đọc env vars: DW_NAME, DW_DEPTH, DW_ROLES, DW_LANG)
dw validate                 # Kiểm tra .dw/config/dw.config.yml
dw doctor                   # Health check toàn bộ installation
dw upgrade                  # Cập nhật toolkit files
dw upgrade --check          # Kiểm tra có update không
dw upgrade --dry-run        # Preview changes
dw prompt                   # Build structured task prompt (autocomplete + wizard)
dw prompt --text "mô tả"    # Non-interactive mode
dw claude-vn-fix            # Patch Vietnamese IME bug trong Claude CLI
```

---

## 11. Thứ tự học cho Dev Mới

1. **Ngày 1**: Đọc guide này. Chạy `dw init` trong một project test.
2. **Ngày 1**: Thử workflow standard với một task nhỏ (`task-init` → `research` → `plan` → `execute`)
3. **Ngày 2-3**: Dùng `review` và `commit` sau mỗi task
4. **Tuần 2**: Thử `estimate` và `log-work` để track effort
5. **Tuần 2+**: Với task phức tạp, dùng `arch-review` hoặc `test-plan`

---

## 12. Troubleshooting

**`dw doctor` báo lỗi Missing files:**
```bash
dw init   # Re-init để recreate files
```

**Skill không nhận đúng config:**
```bash
dw validate   # Kiểm tra config syntax và schema
```

**AI không biết dùng skill nào:**
- Hỏi thẳng: "Tôi muốn bắt đầu task mới, dùng skill nào?"
- Hoặc dùng `/dw:thinking [mô tả task]` để phân tích

**Plan approve rồi nhưng execute bị báo lỗi:**
- Kiểm tra file plan có dòng `Trạng thái: Approved` chưa
- Nếu chưa → thêm vào plan file thủ công hoặc nói AI "plan đã approved"

---

## 13. Tham khảo thêm

- **Methodology**: `.dw/core/WORKFLOW.md` — 6-phase workflow chi tiết
- **Quality standards**: `.dw/core/QUALITY.md` — 4-layer quality strategy
- **Thinking frameworks**: `.dw/core/THINKING.md` — Critical/Systems/First-principles thinking
- **Role definitions**: `.dw/core/ROLES.md` — Dev, TL, BA, QC, PM roles
- **CLI docs**: `docs/README.md`
- **Cheatsheet**: `docs/cheatsheet.md`

---

*Bộ toolkit này được thiết kế để **AI làm việc theo quy trình của bạn** — không phải bạn phải học theo AI. Nếu có gì không rõ, cứ hỏi AI trực tiếp.*
