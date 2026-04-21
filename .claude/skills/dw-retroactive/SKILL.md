---
name: dw:retroactive
description: "Retroactively document một feature/task đã được implement trước khi dùng dw. Reverse-engineer từ code + git history, tạo spec.md + tracking.md (v2 format, As-Built flavor)."
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - "Bash(git log *)"
  - "Bash(git diff *)"
  - "Bash(git show *)"
  - "Bash(git blame *)"
  - "Bash(git shortlog *)"
  - "Bash(ls *)"
---

# dw-retroactive — Retroactive Documentation

Feature: **$ARGUMENTS**

> Reverse-engineer feature đã tồn tại từ code + git history. Tạo task docs v2 format (`spec.md` + `tracking.md`) với flavor As-Built — để AI và team có context đầy đủ khi làm task liên quan.

---

## Đọc Config

Đọc `.dw/config/dw.config.yml`:
- `paths.tasks` → output location (mặc định `.dw/tasks`)
- `project.language` → ngôn ngữ docs (vi/en)

## Kiểm tra đã có docs chưa

Kiểm tra `{paths.tasks}/$ARGUMENTS/` đã tồn tại chưa:
- Nếu có `spec.md` hoặc `tracking.md` → hỏi user: "Đã có task docs cho `$ARGUMENTS`. Overwrite hay skip?"
- Nếu chưa → tiếp tục

---

## Bước 1: Tìm files liên quan

Dùng tên `$ARGUMENTS` như keyword để tìm:

```
Glob: **/*$ARGUMENTS*
Grep: "$ARGUMENTS" trong toàn codebase (case-insensitive)
Grep: tên function/class/route liên quan (nếu có thể suy ra từ tên)
```

Nếu không tìm được → hỏi user cung cấp thêm keyword hoặc path.

## Bước 2: Đọc và phân tích code

Với mỗi file tìm được:

1. **Đọc toàn bộ file** (hoặc phần liên quan)
2. Xác định: vai trò trong feature, logic chính, I/O, side effects, error handling
3. **Trace data flow**: input → xử lý → output
4. **Dependencies**: upstream (gọi ai) / downstream (ai gọi)
5. **Tests**: test files liên quan, coverage hiện tại

## Bước 3: Phân tích git history

```bash
git log --oneline --follow -- [files-found]
git shortlog -sn -- [files-found]
git log --oneline --diff-filter=A -- [files-found]
git show [first-commit] --stat
```

Xác định: thời điểm tạo, maintainer chính, breaking changes, tech debt (TODO/FIXME).

## Bước 4: Áp dụng tư duy phản biện

Từ framework `.dw/core/THINKING.md`:
- **Giả định** trong code về input/state/environment
- **Failure modes** + edge cases
- **Tech debt** (TODO/FIXME/antipatterns)
- **Security** (auth, validation, data exposure)

---

## Bước 5: Tạo task docs (v2 format, As-Built flavor)

Tạo thư mục `{paths.tasks}/$ARGUMENTS/` và **2 files** theo template v2 tại `.dw/core/templates/v2/`.

### 5a. spec.md (As-Built)

Đọc template `.dw/core/templates/v2/spec.md`, điền:

**Frontmatter:**
- `task_id: $ARGUMENTS`
- `created: [today]`
- `status: Done` ← đã implement
- `owner: [main author từ git shortlog]`
- `depth: retroactive`
- `related_adr: none`
- `target_ship: [first-commit-date]`

**Body sections** (lấp bằng findings retroactive):

- **Intent**: 1-2 paragraphs mô tả feature làm gì (dựa trên code)
- **Why Now**: "As-built documentation — feature pre-dw adoption" + lý do document hóa
- **Scope → In Scope**: liệt kê component đã implement dưới dạng ST-1, ST-2... với:
  - Concrete action = mô tả component đã implement
  - Acceptance = how it was verified (tests / manual check)
  - Effort = `as-built`
- **Scope → Out of Scope**: những gì rõ ràng KHÔNG nằm trong feature (suy từ code boundaries)
- **Risks & Mitigations**: tech debt, antipatterns, security concerns phát hiện
- **Success Criteria**: current behavior được kiểm chứng bằng gì (tests, prod metrics nếu biết)
- **Dependencies**: upstream modules/services + downstream consumers
- **Known Unknowns**: câu hỏi cần human review (verbal decisions không có trong code)
- **Acceptance**: đánh dấu `[x]` các items đã done (feature đang chạy prod)

**Thêm note trên đầu Intent**:
```markdown
> ⚠ As-Built Documentation — Generated retroactively from code + git history.
> Verbal context (Slack threads, meetings) có thể thiếu. Cần human review bổ sung.
```

Ghi vào `{paths.tasks}/$ARGUMENTS/spec.md`.

### 5b. tracking.md (As-Built)

Đọc template `.dw/core/templates/v2/tracking.md`, điền:

**Frontmatter:**
- `task_id: $ARGUMENTS`
- `started: [first-commit-date từ git]`
- `last_updated: [today]`
- `status: Done`
- `current_phase: Maintained`
- `blockers: none`

**Body sections:**

- **Status Snapshot**: Phase `Done (pre-dw)` · Next milestone `— (maintained as-is)`
- **Subtask Progress** table: map các component đã tìm ở Bước 2 thành ST-N với status ✅ Done, Date = commit date đầu tiên của component, Notes = commit SHA hoặc file path
- **Changelog**: parse git log ra thành entries theo ngày. Format:
  ```
  ### YYYY-MM-DD — [commit subject]
  **Actions taken:** [summary]
  ```
- **Handoff Notes**: cho next session/agent:
  - **Read first:** `spec.md` (as-built) + key files từ bước 2
  - **Current state:** Done, maintained
  - **Don't do:** [stable contracts không nên thay đổi]
  - **Watch out:** [tech debt + gotchas]
- **Friction Journal**: để trống hoặc nhập tech debt đã ghi nhận từ Bước 4
- **Agent Debate Log**: bỏ qua (không applicable cho retroactive)

Ghi vào `{paths.tasks}/$ARGUMENTS/tracking.md`.

### 5c. Cập nhật ACTIVE.md

Chạy `dw active` (hoặc `writeActiveIndex`) để regenerate team index.

---

## Bước 6: Báo cáo kết quả

```
╔══════════════════════════════════════════════════════╗
║  ✅ dw:retroactive complete: $ARGUMENTS
╠══════════════════════════════════════════════════════╣
║  Files khảo sát    : [N files]
║  Git commits       : [N, từ [date] đến [date]]
║  Maintainer chính  : [author]
╠══════════════════════════════════════════════════════╣
║  Docs đã tạo (v2 format):
║    {paths.tasks}/$ARGUMENTS/spec.md      (As-Built)
║    {paths.tasks}/$ARGUMENTS/tracking.md  (Done, maintained)
╠══════════════════════════════════════════════════════╣
║  Key findings:
║  • [Finding 1]
║  • [Finding 2]
╠══════════════════════════════════════════════════════╣
║  Tech debt / warnings:
║  • [Warning nếu có]
╠══════════════════════════════════════════════════════╣
║  Tiếp theo:
║  → Task liên quan:    /dw:research $ARGUMENTS
║    (AI đọc spec.md làm foundation)
║  → Human review:      điền Known Unknowns + Handoff Notes
╚══════════════════════════════════════════════════════╝
```

---

## Lưu ý

- **As-built ≠ forward plan**: spec.md mô tả hiện trạng, không phải kế hoạch tương lai.
- **Best-effort**: AI chỉ thấy code + git — context ẩn (verbal decisions, Slack threads) có thể thiếu. Human review là bắt buộc cho phần `Known Unknowns`.
- **v2 format**: Chỉ tạo 2 files (`spec.md` + `tracking.md`). Không dùng lại v1 3-file format (`context + plan + progress`) nữa.
- **Tools khác vẫn đọc được**: `dw active`, `session-init` hook, `/dw:dashboard` đều hỗ trợ v2 format song song với legacy v1.
