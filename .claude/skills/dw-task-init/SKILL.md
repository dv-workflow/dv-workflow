---
name: dw:task-init
description: "Khởi tạo bộ documentation cho task mới. Tạo thư mục và 2 files v2 (spec.md + tracking.md)."
argument-hint: "[task-name]"
---

# Khởi Tạo Task: $ARGUMENTS

## Đọc Config

Đọc `.dw/config/dw.config.yml`:
- `paths.tasks` → thư mục chứa task docs (mặc định: `.dw/tasks`)
- `workflow.default_depth` → `quick | standard | thorough`
- `project.language` → ngôn ngữ note thêm (templates hiện tại là vi/en-agnostic)

## Tạo Thư Mục & Files (v2 format)

```
{paths.tasks}/$ARGUMENTS/
├── spec.md      # Intent + subtasks + success criteria (stable after approve)
└── tracking.md  # Progress + changelog + handoff (mutable)
```

### 1. Tạo spec.md

Đọc template từ `.dw/core/templates/v2/spec.md`, điền vào:
- `{task-name}` → `$ARGUMENTS`
- `{YYYY-MM-DD}` (created) → ngày hiện tại
- `status` → `Draft`
- `depth` → giá trị `workflow.default_depth` từ config
- `owner` → để trống (user tự điền)
- `related_adr` → `none`
- `target_ship` → `none`

Ghi vào `{paths.tasks}/$ARGUMENTS/spec.md`.

### 2. Tạo tracking.md

Đọc template từ `.dw/core/templates/v2/tracking.md`, điền vào:
- `{task-name}` → `$ARGUMENTS`
- `{YYYY-MM-DD}` (started & last_updated) → ngày hiện tại
- `status` → `Not Started`
- `current_phase` → `Init`
- `blockers` → `none`

Ghi vào `{paths.tasks}/$ARGUMENTS/tracking.md`.

### 3. Cập nhật ACTIVE.md

Sau khi tạo xong 2 files, chạy `dw active` (hoặc invoke `writeActiveIndex`) để regenerate `{paths.tasks}/ACTIVE.md` — team index sẽ thấy task mới.

## Sau Khi Tạo

Hiển thị cho user:

1. Danh sách files đã tạo:
   - `{paths.tasks}/$ARGUMENTS/spec.md`
   - `{paths.tasks}/$ARGUMENTS/tracking.md`

2. Workflow tiếp theo theo `workflow.default_depth`:
   - **quick**: "Code ngay hoặc `/dw:research $ARGUMENTS` nếu cần khảo sát."
   - **standard**: "`/dw:research $ARGUMENTS` → `/dw:plan $ARGUMENTS` → approve → `/dw:execute $ARGUMENTS`"
   - **thorough**: "`/dw:requirements $ARGUMENTS` → `/dw:research $ARGUMENTS` → `/dw:estimate $ARGUMENTS` → `/dw:plan $ARGUMENTS`"

3. Nếu team có BA role: "BA có thể chạy `/dw:requirements $ARGUMENTS` trước để chuẩn bị yêu cầu."

## Lưu ý v2 format

- `spec.md` ổn định sau khi approve — subtasks + success criteria không thay đổi mà không có lý do.
- `tracking.md` mutable — cập nhật mỗi session (Subtask Progress table, Changelog, Friction Journal).
- Legacy 3-file format (`context + plan + progress`) vẫn được đọc bởi các skill khác để backward compat, nhưng **không tạo mới** cho task mới.
