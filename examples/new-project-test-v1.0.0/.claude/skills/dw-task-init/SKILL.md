---
name: dw-task-init
description: "Khởi tạo bộ documentation cho task mới. Tạo thư mục và 3 template files (context, plan, progress)."
argument-hint: "[task-name]"
---

# Khởi Tạo Task: $ARGUMENTS

## Đọc Config

Đọc `.dw/config/dw.config.yml` để lấy:
- `paths.tasks` → thư mục chứa task docs (mặc định: `.dw/tasks`)
- `workflow.default_depth` → `quick | standard | thorough`
- `tracking.estimation` → có tạo section estimation không
- `tracking.log_work` → có tạo section effort log không
- `team.roles` → hiển thị workflow phù hợp
- `project.language` → chọn template ngôn ngữ

## Tạo Thư Mục & Files

```
{paths.tasks}/$ARGUMENTS/
├── $ARGUMENTS-context.md    # Research findings & codebase analysis
├── $ARGUMENTS-plan.md       # Implementation plan & design
└── $ARGUMENTS-progress.md   # Progress tracking, effort log, changelog
```

### File context.md
Đọc `project.language` từ config để chọn template:
- `language: "vi"` → dùng `.claude/templates/task-context.md`
- `language: "en"` → dùng `.claude/templates/en/task-context.md`

Điền vào template:
- `[Task Name]` = `$ARGUMENTS`
- `[date]` = ngày hiện tại

### File plan.md
Chọn template theo `project.language` (`.claude/templates/[lang]/task-plan.md`).
- Nếu `tracking.estimation = true`: giữ nguyên section Estimation
- Nếu `tracking.estimation = false`: xóa section Estimation

### File progress.md
Chọn template theo `project.language` (`.claude/templates/[lang]/task-progress.md`).
- Điền `[Task Name]` = `$ARGUMENTS`
- Điền `[date]` = ngày hiện tại
- Nếu `tracking.log_work = true`: giữ section Effort Log
- Nếu `tracking.log_work = false`: xóa section Effort Log

## Sau Khi Tạo

Hiển thị cho user:
1. Danh sách files đã tạo
2. Workflow tiếp theo dựa trên `workflow.default_depth`:

**quick**: "Tiếp theo: Code ngay hoặc `/dw-research $ARGUMENTS` nếu cần khảo sát"
**standard**: "Tiếp theo: `/dw-research $ARGUMENTS` → `/dw-plan $ARGUMENTS` → approve → `/dw-execute $ARGUMENTS`"
**thorough**: "Tiếp theo: `/dw-requirements $ARGUMENTS` → `/dw-research $ARGUMENTS` → `/dw-estimate $ARGUMENTS` → `/dw-plan $ARGUMENTS`"

Nếu team có BA: "Gợi ý: BA có thể chạy `/dw-requirements $ARGUMENTS` trước để chuẩn bị yêu cầu"
