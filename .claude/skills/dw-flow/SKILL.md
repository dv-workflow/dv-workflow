---
name: dw-flow
description: "Orchestrator: chạy toàn bộ workflow từ đầu đến cuối cho một task, tự động kết nối các phases, dừng tại các human checkpoints để confirm/feedback. Mạnh nhất khi bạn muốn AI tự drive cả task."
argument-hint: "[task-name] hoặc DW_DEPTH=[depth] [task-name]"
---

# dw-flow — Full Task Workflow Orchestrator

Task: **$ARGUMENTS**

> AI sẽ tự động chạy qua tất cả phases phù hợp với depth của project.
> Bạn chỉ cần xem kết quả và phản hồi tại các **[CHECKPOINT]**.

---

## Bước 0: Khởi động

### Parse arguments

Kiểm tra `$ARGUMENTS` có dạng `DW_DEPTH=[depth] [task-name]` không:
- Nếu có (ví dụ: `DW_DEPTH=quick fix-bug-123`) → dùng `quick` làm depth, `fix-bug-123` làm task-name
- Nếu không → task-name = `$ARGUMENTS` toàn bộ

### Đọc config

Đọc `.dw/config/dw.config.yml`:
- `workflow.default_depth` → depth mặc định (dùng nếu không có DW_DEPTH override)
- `paths.tasks` → location task docs (dùng làm base path — thay thế `{paths.tasks}` trong toàn bộ file này)
- `tracking.estimation`, `tracking.log_work`
- `team.roles` → ai cần approve gì

**Depth cuối cùng** = DW_DEPTH override (nếu có) → `workflow.default_depth` từ config.

### Kiểm tra task docs

Kiểm tra task đã có docs chưa (`{paths.tasks}/[task-name]/`):
- Nếu chưa → tạo mới (follow instructions trong `.claude/skills/dw-task-init/SKILL.md`)
- Nếu rồi → đọc progress, hỏi: "Task đã có docs. Tiếp tục từ phase nào?"
  - Options: `research | plan | gate-c | execute | review | fresh-start`
  - Nếu chọn `execute` → kiểm tra plan status trước (xem mục "Resume Handling")
  - Nếu chọn `gate-c` → đọc plan và hiển thị GATE C như thể vừa xong phase Plan

Hiển thị kế hoạch trước khi bắt đầu:

```
╔══════════════════════════════════════════════════════╗
║  dw-flow: [task-name]
║  Depth: [quick|standard|thorough]
║  Pipeline:
║  [danh sách phases sẽ chạy dựa trên depth]
╚══════════════════════════════════════════════════════╝
```

---

## Pipeline theo Depth

### quick
```
[1] Task Init  →  [2] Research (optional)  →  [GATE Q1: Confirm Scope]
→  [3] Execute  →  [GATE Q2: Approve Changes]  →  [4] Commit
```

### standard *(mặc định)*
```
[1] Task Init  →  [2] Research  →  [GATE A: Confirm Scope]
→  [3] Plan  →  [GATE C: Approve Plan ← HARD GATE]
→  [4] Execute  →  [5] Review  →  [GATE D: Approve Changes]  →  [6] Commit
```

### thorough
```
[1] Task Init  →  [2] Requirements  →  [GATE A: Confirm Scope]
→  [3] Estimate  →  [4] Research  →  [5] Arch Review  →  [GATE B: TL Approve Architecture]
→  [6] Plan  →  [GATE C: Approve Plan ← HARD GATE]  →  [7] Test Plan
→  [8] Execute  →  [9] Review  →  [GATE D: Approve Changes]
→  [10] Docs Update  →  [11] Log Work  →  [12] Commit
```

> ⚠ **Thorough depth** chạy 12 phases — chỉ dùng cho critical tasks. Nếu bị gián đoạn giữa chừng, dùng `stop` + resume thay vì restart.

---

## Thực Hiện Từng Phase

Với **mỗi phase**, làm như sau:
1. Thông báo bắt đầu phase: `▶ Phase N: [tên phase]`
2. Follow **toàn bộ instructions** trong SKILL.md tương ứng (đường dẫn bên dưới)
3. Hiển thị output đầy đủ
4. Sau phase, nếu có GATE → hiển thị checkpoint (xem mục CHECKPOINTS)
5. Nếu không có GATE → thông báo "✓ Phase N complete" và chuyển ngay phase tiếp theo

### Quy tắc khi follow sub-skill trong flow context

Khi đọc và follow bất kỳ SKILL.md nào bên dưới, áp dụng các quy tắc sau:
- **BỎ QUA** phần "Tiếp theo: /dw-xxx" ở cuối mỗi skill — dw-flow tự handle next step
- **BỎ QUA** lệnh "DỪNG chờ approve" trong dw-plan và các skills tương tự — dw-flow sẽ hiển thị GATE thay thế
- **CHỈ** lấy output, ghi files, hiển thị kết quả — không tự dừng workflow

### SKILL.md references (đọc và follow từng file này):
- Task Init → `.claude/skills/dw-task-init/SKILL.md`
- Requirements → `.claude/skills/dw-requirements/SKILL.md`
- Estimate → `.claude/skills/dw-estimate/SKILL.md`
- Research → `.claude/skills/dw-research/SKILL.md`
- Arch Review → `.claude/skills/dw-arch-review/SKILL.md`
- Plan → `.claude/skills/dw-plan/SKILL.md`
- Test Plan → `.claude/skills/dw-test-plan/SKILL.md`
- Execute → `.claude/skills/dw-execute/SKILL.md`
- Review → `.claude/skills/dw-review/SKILL.md`
- Docs Update → `.claude/skills/dw-docs-update/SKILL.md`
- Log Work → `.claude/skills/dw-log-work/SKILL.md`
- Commit → `.claude/skills/dw-commit/SKILL.md`

---

## CHECKPOINTS (Human Gates)

Tại mỗi GATE, **dừng lại** và hiển thị:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [GATE X] — [Tên gate]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Tóm tắt output phase vừa xong — 3-5 bullets]

  Options:
  → ok / continue          Tiếp tục phase tiếp theo
  → revise: [feedback]     AI chỉnh sửa phase này rồi hỏi lại
  → skip [phase-name]      Bỏ qua phase tiếp theo
  → stop                   Dừng workflow tại đây
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Xử lý response:

**`ok` / `continue` / `approved` / _(bất kỳ affirmative)_**
→ Chuyển ngay phase tiếp theo, không hỏi thêm.

**`revise: [nội dung]`**
→ Đọc feedback, chỉnh sửa output của phase vừa xong.
→ Hiển thị lại output đã chỉnh.
→ Hỏi lại checkpoint (cùng options).
→ Có thể revise nhiều lần.

**`skip [phase-name]`**
→ Bỏ qua phase được chỉ định.
→ Thông báo: "Skipped [phase-name]. Continuing with [next-phase]..."

**`stop`**
→ Dừng workflow.
→ Tóm tắt những gì đã hoàn thành.
→ Hướng dẫn resume: "Để tiếp tục: `/dw-flow [task-name]` → chọn phase"

**Feedback tự do** (không dùng keyword trên)
→ Interpret là `revise: [feedback]`
→ AI tự hiểu và điều chỉnh.

---

## GATE Descriptions

### GATE Q1 — Confirm Scope (quick only)
Sau Research (nếu có) hoặc Task Init.
Tóm tắt: phạm vi task, approach dự kiến, files sẽ thay đổi.
→ User confirm để tiếp tục Execute trực tiếp.

### GATE Q2 — Approve Changes (quick only)
Sau Review (nếu có) hoặc Execute.
Tóm tắt: thay đổi đã thực hiện, issues phát hiện (nếu review được chạy).
→ User confirm để commit.

### GATE A — Confirm Scope / Approve Research (standard + thorough)
Sau Research (hoặc Requirements với thorough).
Tóm tắt: phạm vi task, risks chính, approach gợi ý.
→ User confirm để tiếp tục Plan.

### GATE B — Approve Architecture (thorough only)
Sau Arch Review.
Tóm tắt: TL decisions, must-fix concerns.
→ Cần TL approve rõ ràng trước khi plan.

### GATE C — Approve Plan (standard + thorough) ← HARD GATE
Sau Plan. **Bắt buộc approve** — không tự ý skip.
Hiển thị:
- Số subtasks
- Estimated effort (nếu có)
- Top risks
- Files sẽ thay đổi

**Sau khi user approve GATE C:**
→ Cập nhật `{paths.tasks}/[task-name]/[task-name]-plan.md`: đổi `Trạng thái: Draft → cần approve` thành `Trạng thái: Approved`
→ Sau đó mới proceed sang Execute

→ Chỉ execute khi có explicit "approved" / "ok"

### GATE D — Approve Changes (standard + thorough)
Sau Review.
Tóm tắt: issues tìm được (Critical/Warning/Suggestion).
→ Nếu có Critical → **phải fix trước** khi commit.
→ Nếu chỉ Warning → user chọn.

---

## Resume Handling

Khi user chọn resume từ `execute` mà plan chưa có `Trạng thái: Approved`:
1. Đọc plan file
2. Nếu status là `Draft` hoặc `cần approve` → **hiển thị GATE C** với nội dung plan hiện tại
3. Chỉ tiến vào Execute sau khi user approve GATE C và plan status đã được cập nhật

Khi user chọn `gate-c` trực tiếp:
→ Đọc plan file, hiển thị GATE C, xử lý như bình thường.

---

## Progress Tracking

Cập nhật `{paths.tasks}/[task-name]/[task-name]-progress.md` sau **mỗi phase** hoàn thành.
*(Lưu ý: `{paths.tasks}` là template — thay bằng giá trị `paths.tasks` đã đọc từ config)*

```markdown
## Flow Progress
| Phase | Status | Timestamp | Notes |
|-------|--------|-----------|-------|
| task-init | ✓ Done | [time] | |
| research | ✓ Done | [time] | [key finding] |
| plan | ✓ Done | [time] | [N subtasks] |
| execute | 🔄 In Progress | [time] | ST-2/4 done |
```

---

## Khi Gặp Vấn Đề Trong Execute

Nếu trong phase Execute, phát hiện:
- **Scope vượt plan** → DỪNG, hiển thị mini-GATE:
  ```
  ⚠ Scope Issue Detected
  → extend-plan: [mô tả]   Cập nhật plan rồi tiếp tục
  → skip-subtask           Bỏ qua subtask này
  → stop                   Dừng để review lại
  ```
- **Test fail không rõ** → Tự động chạy debug routine (`.claude/skills/dw-debug/SKILL.md`), báo kết quả
- **Blocker** → Dừng, mô tả blocker rõ ràng, đề xuất options

---

## Summary khi Hoàn Thành

```
╔══════════════════════════════════════════════════════╗
║  ✅ dw-flow complete: [task-name]
╠══════════════════════════════════════════════════════╣
║  Phases completed  : [list]
║  Subtasks done     : N/N
║  Commits           : [N commits, hashes]
║  Effort            : [Xh actual vs Yh estimated] (nếu tracking)
║  Issues found      : [N Critical fixed, N Warnings]
╠══════════════════════════════════════════════════════╣
║  Còn lại (nếu có) :
║  - [ ] Chờ TL review PR
║  - [ ] Update DECISIONS.md (nếu có arch decision)
╚══════════════════════════════════════════════════════╝
```

---

## Tips

- Muốn chạy nhanh nhất? Override depth: `/dw-flow DW_DEPTH=quick fix-bug-123`
- Muốn dừng và tiếp tục sau? Gõ `stop` tại bất kỳ GATE nào
- Muốn bỏ một phase? `skip docs-update` hoặc `skip log-work`
- Muốn xem lại plan trước khi approve? File ở `.dw/tasks/[task-name]/[task-name]-plan.md`
- Dừng giữa plan và execute? Resume bằng `gate-c` để re-confirm plan trước khi execute
