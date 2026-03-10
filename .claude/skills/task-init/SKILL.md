---
name: task-init
description: "Khởi tạo bộ documentation cho task mới. Tạo thư mục và 3 template files (context, plan, progress)."
argument-hint: "[task-name]"
disable-model-invocation: true
---

# Khởi Tạo Task: $ARGUMENTS

## Đọc Config

Đọc `dv-workflow.config.yml` để lấy:
- `paths.tasks` → thư mục chứa task docs (mặc định: `.dev-tasks`)
- `level` → quyết định template nào cần tạo
- `flags.estimation` → có tạo section estimation không
- `team.roles` → hiển thị workflow phù hợp

## Tạo Thư Mục & Files

```
{paths.tasks}/$ARGUMENTS/
├── $ARGUMENTS-context.md    # Research findings & codebase analysis
├── $ARGUMENTS-plan.md       # Implementation plan & design
└── $ARGUMENTS-progress.md   # Progress tracking, effort log, changelog
```

### File context.md
Tạo từ template `templates/task-context.md` với:
- Điền `[Task Name]` = `$ARGUMENTS`
- Điền `[date]` = ngày hiện tại

### File plan.md
Tạo từ template `templates/task-plan.md` với:
- Điền `[Task Name]` = `$ARGUMENTS`
- Nếu `flags.estimation = true`: giữ nguyên section Estimation
- Nếu `flags.estimation = false`: xóa section Estimation

### File progress.md
Tạo từ template `templates/task-progress.md` với:
- Điền `[Task Name]` = `$ARGUMENTS`
- Điền `[date]` = ngày hiện tại
- Nếu `flags.log_work = true`: giữ section Effort Log
- Nếu `flags.log_work = false`: xóa section Effort Log

## Sau Khi Tạo

Hiển thị cho user:
1. Danh sách files đã tạo
2. Workflow tiếp theo dựa trên level:

**Level 1**: "Tiếp theo: Bắt đầu implement hoặc chạy `/research $ARGUMENTS`"
**Level 2**: "Tiếp theo: Chạy `/research $ARGUMENTS` → `/plan $ARGUMENTS` → approve → `/execute $ARGUMENTS`"
**Level 3**: "Tiếp theo: Chạy `/estimate $ARGUMENTS` → `/research $ARGUMENTS` → `/plan $ARGUMENTS`"

Nếu team có BA: "Gợi ý: BA có thể chạy `/requirements $ARGUMENTS` trước để chuẩn bị yêu cầu"
