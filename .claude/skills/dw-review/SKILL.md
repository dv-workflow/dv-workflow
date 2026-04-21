---
name: dw:review
description: "Review code thay đổi gần đây hoặc cả task. Kiểm tra correctness, security, conventions, test coverage. Tạo báo cáo phân loại Critical/Warning/Suggestion."
argument-hint: "[task-name | branch | file]"
context: fork
agent: reviewer
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git diff *)"
  - "Bash(git log *)"
  - "Bash(git show *)"
---

# Code Review

Target: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → `paths.tasks`, `workflow.default_depth`.

## Xác Định Scope

- Nếu có argument = task-name: review tất cả commits liên quan đến task
- Nếu có argument = branch: `git diff main...$ARGUMENTS`
- Nếu không có argument: `git diff HEAD~1` (commit gần nhất)

## Quy Trình

### 1. Lấy diff
```bash
git diff [scope] --name-only   # danh sách files changed
git diff [scope]                # nội dung thay đổi
```

### 2. Đọc files liên quan
Đọc toàn bộ files đã changed để hiểu full context (không chỉ diff).

### 3. Review theo reviewer agent

Agent `reviewer` sẽ kiểm tra:
- **Correctness**: Logic, edge cases, error handling
- **Security**: Input validation, auth, data exposure
- **Performance**: N+1, unnecessary calls, complexity
- **Tests**: Coverage, test quality
- **Conventions**: Naming, structure, code style (`.claude/rules/code-style.md`)

### 4. Kiểm tra checklist cụ thể

Nếu có plan file (`{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`):
- Đối chiếu acceptance criteria từng subtask
- Kiểm tra scope có vượt plan không

### 5. Output

Tạo báo cáo đầy đủ theo format của reviewer agent.

## Sau Review

- Nếu có Critical issues: "Cần fix trước khi merge"
- Nếu chỉ có Warnings: "Khuyến khích fix, nhưng có thể proceed"
- Nếu pass: "Approved — có thể chạy `/dw:commit`"

Nếu team có TL: "Gợi ý gửi báo cáo này cho TL để final approve."
