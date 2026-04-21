---
name: dw:rollback
description: "Revert task docs về trạng thái trước. Dùng khi plan sai, execute sai hướng, hoặc cần bắt đầu lại từ sau research."
argument-hint: "[task-name] [checkpoint: after-research | after-plan | clean]"
---

# Rollback Task Docs: $ARGUMENTS

## Parse Arguments

Từ `$ARGUMENTS`:
- `task-name`: tên task cần rollback
- `checkpoint` (optional): điểm muốn revert về
  - `after-research` — giữ context.md, xóa plan.md và reset progress.md
  - `after-plan` — giữ context.md + plan.md, reset progress.md về trạng thái ban đầu
  - `clean` — xóa toàn bộ nội dung, giữ files trống (restart từ đầu)
  - (không có) → hỏi user chọn

## Bước 1: Đọc config

`paths.tasks` → xác định thư mục task.

## Bước 2: Kiểm tra task tồn tại

```
{paths.tasks}/[task-name]/
├── [task-name]-context.md
├── [task-name]-plan.md
└── [task-name]-progress.md
```

Nếu không tìm thấy → thông báo và DỪNG.

## Bước 3: Git checkpoint (an toàn)

Kiểm tra uncommitted changes trong task docs:
```bash
git status {paths.tasks}/[task-name]/
```

Nếu có uncommitted changes → hỏi: "Có uncommitted changes trong task docs. Commit trước khi rollback? (y/n/skip)"

## Bước 4: Hiển thị preview và confirm

Hiển thị rõ sẽ làm gì:
```
Rollback [task-name] về checkpoint: [checkpoint]

Sẽ GIỮ:
  ✓ [task-name]-context.md  (research findings)

Sẽ RESET:
  ✗ [task-name]-plan.md     → xóa nội dung, giữ file trống
  ✗ [task-name]-progress.md → reset về "Not Started"

Tiếp tục? (y/n)
```

Chờ user confirm trước khi thực hiện.

## Bước 5: Thực hiện rollback

### checkpoint = "after-research"
- Giữ `context.md` nguyên vẹn
- Reset `plan.md` → file trống (chỉ giữ header)
- Reset `progress.md` → status = "Not Started", xóa subtask rows

### checkpoint = "after-plan"
- Giữ `context.md` nguyên vẹn
- Giữ `plan.md` nguyên vẹn
- Reset `progress.md` → status = "Not Started", tất cả subtasks = Pending

### checkpoint = "clean"
- Reset tất cả 3 files về template trống
- Điền lại [Task Name] và [date]

## Bước 6: Thông báo

```
Rollback hoàn tất.

Task: [task-name]
Checkpoint: [checkpoint]
Thời gian: [timestamp]

Bước tiếp theo:
- after-research → Chạy /dw:plan [task-name] để lập kế hoạch lại
- after-plan     → Chạy /dw:execute [task-name] để implement lại
- clean          → Chạy /dw:research [task-name] để bắt đầu từ đầu
```
