---
name: dw-execute
description: "Thực hiện implementation theo plan đã được approve. Tuân thủ TDD, commit sau mỗi subtask. Chỉ dùng khi plan đã được duyệt."
argument-hint: "[task-name]"
---

# Thực Hiện Implementation

Task: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml` → lấy:
- `paths.tasks` → location task docs
- `flags.pre_commit_tests` → chạy tests trước commit?
- `flags.log_work` → ghi effort?
- `flags.living_docs` → cập nhật docs?
- `flags.docs_update_on_commit` → auto docs-update?

## Trước Khi Bắt Đầu

1. Đọc `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`
2. Đọc `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md`
3. Đọc `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md`
4. Xác nhận plan có `Trạng thái: Approved`

Nếu plan chưa approved → **DỪNG**, yêu cầu approve trước.
Nếu chưa có plan → **DỪNG**, yêu cầu chạy `/dw-plan $ARGUMENTS`.
Nếu có progress → tiếp tục từ subtask cuối cùng chưa done.

## Quy Trình Cho MỖI Subtask

### Step 1: Chuẩn bị
- Đọc subtask từ plan (mô tả, files, criteria)
- Cập nhật progress: subtask → `in_progress`

### Step 2: Test First (TDD)
- Viết test cho subtask (nếu applicable)
- Chạy test → confirm FAIL (red)
- Nếu test đã pass → kiểm tra lại, có thể test sai

### Step 3: Implement
- Code theo spec trong plan
- Tuân thủ conventions trong `.claude/rules/code-style.md`
- KHÔNG thay đổi scope ngoài plan

### Step 4: Verify
- Chạy test → confirm PASS (green)
- Chạy linter nếu `flags.pre_commit_lint = true`
- Nếu fail → sửa và chạy lại

### Step 5: Cập nhật Progress
Cập nhật `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md`:
```markdown
| ST-N | [Subtask name] | Done | abc1234 | [ghi chú] |
```

Nếu `flags.log_work = true`, ghi thêm:
```markdown
### Effort Log
| Subtask | Estimate | Actual | Ghi chú |
```

### Step 6: Commit
```
<type>(<scope>): <mô tả subtask>

Subtask ST-N of $ARGUMENTS
```

## Khi Phát Hiện Vấn Đề

### Giả định sai / Scope thay đổi
1. **DỪNG** implementation ngay
2. Ghi vào progress → mục "Phát Hiện Mới"
3. Thông báo user: vấn đề gì, ảnh hưởng gì
4. Đề xuất: tiếp tục / cập nhật plan / thay đổi hướng
5. **CHỜ** quyết định từ user

### Test fail không rõ nguyên nhân
1. KHÔNG sửa test để pass (trừ khi test sai)
2. Chạy `/dw-debug` nếu cần
3. Ghi vào progress nếu mất thời gian

### Conflict với code khác
1. Ghi vào progress
2. Thông báo user
3. Đề xuất giải quyết

## Khi Hoàn Thành Tất Cả Subtasks

1. Cập nhật progress: Trạng thái → `Done`
2. Tóm tắt: subtasks completed, commits, issues encountered
3. Nếu `flags.review = true`: "Tiếp theo: chạy `/dw-review`"
4. Nếu `flags.living_docs = true`: "Cần chạy `/dw-docs-update`"
5. Nếu `flags.log_work = true`: Hiển thị estimate vs actual
