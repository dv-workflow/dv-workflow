---
name: dw:review
description: "Review code thay đổi gần đây hoặc cả task. Kiểm tra correctness, security, conventions, test coverage. Tạo báo cáo phân loại Critical/Warning/Suggestion. Pass --visual để emit manifest cho visual artifacts (ADR-0007)."
argument-hint: "[task-name | branch | file] [--visual]"
context: fork
agent: reviewer
allowed-tools:
  - Read
  - Grep
  - Glob
  - "Bash(git diff *)"
  - "Bash(git log *)"
  - "Bash(git show *)"
  - "Bash(dw review render *)"
  - "Write(.dw/reviews/**/manifest.json)"
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

### 5-alt. `--visual` flag (ADR-0007)

Nếu user pass `--visual`, KHÔNG in báo cáo inline. Thay vào đó:

1. **Tạo manifest JSON** tuân thủ `src/lib/review/manifest-schema.json` (schema_version 1):
   - `scope`: nhãn review (branch name, task slug, hoặc free-form từ argument)
   - `scope_slug`: sanitize qua `scope-slug` util — KHÔNG dùng scope thô làm tên thư mục
   - `generated_at`: ISO timestamp hiện tại
   - `task_id` (optional): nếu review thuộc một task — link tới `.dw/tasks/{id}/`
   - `review_meta`: `{reviewer: "dw-review", depth, diff_base, files_reviewed}`
   - `findings[]`: mỗi finding có `id, severity (critical|warning|suggestion), title, location {file, line_start, line_end}, rule_ref?, body, fix?, code_snippet (≤50 lines quanh finding), language?`

2. **Ghi manifest** ra `.dw/reviews/{scope_slug}/manifest.json` qua Write tool. Đây là file DUY NHẤT skill được phép viết.

3. **Gọi renderer**:
   ```bash
   dw review render .dw/reviews/{scope_slug}/manifest.json
   ```
   CLI sẽ:
   - Validate manifest qua schema
   - Phát hiện `dw-kit-render` package (optional sub-package)
   - Nếu có: render SVG + PNG per finding → `.dw/reviews/{scope_slug}/finding-{id}.svg` + `.png`
   - Nếu thiếu: ghi `summary.md` markdown + prompt user install `dw-kit-render`
   - Luôn ghi `summary.md` tổng hợp với links tới artifacts

4. **Surface kết quả**: in danh sách artifact paths cho user; gợi ý mở `summary.md` hoặc embed image vào PR comment.

KHÔNG fallback inline report — manifest + render là contract của `--visual`.

## Sau Review

- Nếu có Critical issues: "Cần fix trước khi merge"
- Nếu chỉ có Warnings: "Khuyến khích fix, nhưng có thể proceed"
- Nếu pass: "Approved — có thể chạy `/dw:commit`"

Nếu team có TL: "Gợi ý gửi báo cáo này cho TL để final approve."
