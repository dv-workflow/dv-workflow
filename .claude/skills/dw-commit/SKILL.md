---
name: dw:commit
description: "Tạo commit thông minh với quality checks tùy theo config. Chạy tests/lint trước commit nếu flags bật."
argument-hint: "[commit message]"
---

# Smart Commit

Message: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → lấy:
- `quality.test_command` → lệnh chạy tests (bỏ qua nếu rỗng)
- `quality.lint_command` → lệnh chạy linter (bỏ qua nếu rỗng)
- `quality.block_on_fail` → block commit nếu fail
- `workflow.default_depth` → `thorough` = gợi ý `/dw:docs-update` sau commit
- `tracking.log_work` → ghi metrics effort

## Quy Trình

### 1. Kiểm tra trạng thái
```bash
git status
git diff --staged --stat
```
Nếu không có changes → thông báo "Không có gì để commit."

### 2. Quality Checks

**Nếu `quality.test_command` không rỗng:**
- Chạy: `quality.test_command` (hoặc tests liên quan đến files changed)
- Nếu FAIL:
  - `quality.block_on_fail = true` → **DỪNG**, báo lỗi, yêu cầu fix
  - `quality.block_on_fail = false` → cảnh báo, hỏi user có muốn tiếp tục

**Nếu `quality.lint_command` không rỗng:**
- Chạy: `quality.lint_command`
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

### 7. Post-commit

**Nếu `workflow.default_depth = thorough`:**
- Thông báo: "Living docs cần cập nhật. Chạy `/dw:docs-update`?"

**Nếu `tracking.log_work = true`:**
- Ghi commit vào `.dw/metrics/`: timestamp, type, scope, files changed

### 8. Hiển thị kết quả
- Commit hash
- Files committed
- Quality check results (nếu có)
- Next steps
