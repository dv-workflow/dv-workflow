---
name: dw-flow
description: "Orchestrator: chạy toàn bộ workflow từ đầu đến cuối cho một task, tự động kết nối các phases, dừng tại các human checkpoints để confirm/feedback. Mạnh nhất khi bạn muốn AI tự drive cả task."
argument-hint: "[task-name]"
---

# dw-flow — Full Task Workflow Orchestrator

Task: **$ARGUMENTS**

> AI sẽ tự động chạy qua tất cả phases phù hợp với depth của project.
> Bạn chỉ cần xem kết quả và phản hồi tại các **[CHECKPOINT]**.

---

## Bước 0: Khởi động

Đọc `.dw/config/dw.config.yml`:
- `workflow.default_depth` → xác định pipeline
- `paths.tasks` → location task docs
- `tracking.estimation`, `tracking.log_work`
- `team.roles` → ai cần approve gì

Kiểm tra task đã có docs chưa (`{paths.tasks}/$ARGUMENTS/`):
- Nếu chưa → tạo mới (follow instructions trong `.claude/skills/dw-task-init/SKILL.md`)
- Nếu rồi → đọc progress, hỏi: "Task đã có docs. Tiếp tục từ phase nào?"
  - Options: `research | plan | execute | review | fresh-start`

Hiển thị kế hoạch trước khi bắt đầu:

```
╔══════════════════════════════════════════════════════╗
║  dw-flow: $ARGUMENTS
║  Depth: [quick|standard|thorough]
║  Pipeline:
║  [danh sách phases sẽ chạy dựa trên depth]
╚══════════════════════════════════════════════════════╝
```

---

## Pipeline theo Depth

### quick
```
[1] Task Init  →  [2] Research (optional)  →  [GATE A]  →  [3] Execute  →  [GATE B]  →  [4] Commit
```

### standard *(mặc định)*
```
[1] Task Init  →  [2] Research  →  [3] Plan  →  [GATE A: Approve Plan]
→  [4] Execute  →  [5] Review  →  [GATE B: Approve Changes]  →  [6] Commit
```

### thorough
```
[1] Task Init  →  [2] Requirements  →  [GATE A: Confirm Scope]
→  [3] Estimate  →  [4] Research  →  [5] Arch Review  →  [GATE B: TL Approve Architecture]
→  [6] Plan  →  [GATE C: Approve Plan]  →  [7] Test Plan
→  [8] Execute  →  [9] Review  →  [GATE D: Approve Changes]
→  [10] Docs Update  →  [11] Log Work  →  [12] Commit
```

---

## Thực Hiện Từng Phase

Với **mỗi phase**, làm như sau:
1. Thông báo bắt đầu phase: `▶ Phase N: [tên phase]`
2. Follow **toàn bộ instructions** trong SKILL.md tương ứng (đường dẫn bên dưới)
3. Hiển thị output đầy đủ
4. Sau phase, nếu có GATE → hiển thị checkpoint (xem mục CHECKPOINTS)
5. Nếu không có GATE → thông báo "✓ Phase N complete" và chuyển ngay phase tiếp theo

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
→ Hướng dẫn resume: "Để tiếp tục: `/dw-flow $ARGUMENTS` → chọn phase"

**Feedback tự do** (không dùng keyword trên)
→ Interpret là `revise: [feedback]`
→ AI tự hiểu và điều chỉnh.

---

## GATE Descriptions

### GATE A — Confirm Scope / Approve Research (standard+)
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
→ Chỉ execute khi có explicit "approved" / "ok"

### GATE D — Approve Changes (standard + thorough)
Sau Review.
Tóm tắt: issues tìm được (Critical/Warning/Suggestion).
→ Nếu có Critical → **phải fix trước** khi commit.
→ Nếu chỉ Warning → user chọn.

---

## Progress Tracking

Cập nhật `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md` sau **mỗi phase** hoàn thành:

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
║  ✅ dw-flow complete: $ARGUMENTS
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

- Muốn chạy nhanh nhất? Dùng với `quick` depth: `DW_DEPTH=quick /dw-flow fix-bug-123`
- Muốn dừng và tiếp tục sau? Gõ `stop` tại bất kỳ GATE nào
- Muốn bỏ một phase? `skip docs-update` hoặc `skip log-work`
- Muốn xem lại plan trước khi approve? File ở `.dw/tasks/$ARGUMENTS/$ARGUMENTS-plan.md`
