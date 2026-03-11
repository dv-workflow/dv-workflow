---
name: dw-commit
description: "Tạo commit thông minh với quality checks tùy theo config. Chạy tests/lint trước commit nếu flags bật."
argument-hint: "[commit message]"
---

# Smart Commit

Message: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml` → lấy:
- `flags.pre_commit_tests` → chạy tests?
- `flags.pre_commit_lint` → chạy lint?
- `flags.block_commit_on_fail` → block nếu fail?
- `flags.docs_update_on_commit` → trigger docs-update?
- `flags.metrics_tracking` → ghi metrics?

## Quy Trình

### 1. Kiểm tra trạng thái
```bash
git status
git diff --staged --stat
```
Nếu không có changes → thông báo "Không có gì để commit."

### 2. Quality Checks (theo flags)

**Nếu `pre_commit_tests = true`:**
- Chạy test suite (hoặc tests liên quan đến files changed)
- Nếu FAIL:
  - `block_commit_on_fail = true` → **DỪNG**, báo lỗi, yêu cầu fix
  - `block_commit_on_fail = false` → cảnh báo, hỏi user có muốn tiếp tục
- Nếu `pre_commit_tests = "skip"` → thông báo "Tests skipped (flag=skip)"

**Nếu `pre_commit_lint = true`:**
- Chạy linter
- Xử lý tương tự tests

### 3. Kiểm tra sensitive files
- Scan staged files cho: `.env`, passwords, tokens, API keys
- Nếu phát hiện → **CẢNH BÁO** và hỏi user

### 4. Kiểm tra leftover debug code
- Grep staged files cho: `console.log`, `debugger`, `TODO:`, `FIXME:`
- Nếu có → cảnh báo (không block)

### 5. Tạo commit message

Nếu có `$ARGUMENTS` → dùng làm mô tả:
```
<auto-detect-type>(<auto-detect-scope>): $ARGUMENTS

Co-Authored-By: Claude <noreply@anthropic.com>
```

Nếu KHÔNG có `$ARGUMENTS` → phân tích diff và tạo message tự động:
- Detect type từ loại thay đổi (feat/fix/refactor/test/docs/chore)
- Detect scope từ files/directories changed
- Viết mô tả ngắn gọn

### 6. Thực hiện commit
```bash
git add [relevant files]
git commit -m "<message>"
```

### 7. Post-commit (theo flags)

**Nếu `docs_update_on_commit = true`:**
- Thông báo: "Living docs cần cập nhật. Chạy `/dw-docs-update`?"

**Nếu `metrics_tracking = true`:**
- Ghi commit vào metrics: timestamp, type, scope, files changed

### 8. Hiển thị kết quả
- Commit hash
- Files committed
- Quality check results (nếu có)
- Next steps
