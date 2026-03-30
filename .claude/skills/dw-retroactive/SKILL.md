---
name: dw-retroactive
description: "Retroactively document một feature/task đã được implement trước khi dùng dw. Reverse-engineer từ code + git history, tạo đầy đủ context + as-built plan + progress docs. Dùng khi cần AI hiểu sâu một module cũ."
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

> Reverse-engineer feature đã tồn tại từ code và git history. Tạo đầy đủ task docs như thể đã đi qua workflow dw — để AI (và team) có context đầy đủ khi làm việc liên quan feature này.

---

## Đọc Config

Đọc `.dw/config/dw.config.yml`:
- `paths.tasks` → output location (mặc định `.dw/tasks`)
- `project.language` → ngôn ngữ docs

## Kiểm tra đã có docs chưa

Kiểm tra `{paths.tasks}/$ARGUMENTS/` đã tồn tại chưa:
- Nếu rồi → hỏi user: "Đã có task docs cho `$ARGUMENTS`. Overwrite hay skip?"
- Nếu chưa → tiếp tục

---

## Bước 1: Tìm files liên quan

Dùng tên `$ARGUMENTS` như keyword để tìm:

```
Glob: **/*$ARGUMENTS*
Grep: "$ARGUMENTS" trong toàn codebase (case-insensitive)
Grep: tên function/class/route liên quan (nếu có thể suy ra từ tên)
```

Nếu không tìm được → hỏi user: "Không tìm thấy files liên quan `$ARGUMENTS`. Bạn có thể cung cấp thêm keyword hoặc path không?"

## Bước 2: Đọc và phân tích code

Với mỗi file tìm được:

1. **Đọc toàn bộ file** (hoặc phần liên quan)
2. Xác định:
   - Vai trò của file trong feature này
   - Logic chính / business rules
   - Input/Output/Side effects
   - Error handling patterns
3. **Trace data flow**: đầu vào từ đâu → xử lý gì → kết quả đi đâu
4. **Tìm dependencies**: module này gọi gì? Ai gọi module này?
5. **Tìm tests**: test files liên quan, coverage hiện tại

## Bước 3: Phân tích git history

```bash
# Commits liên quan feature
git log --oneline --follow -- [files-found]

# Ai đã implement
git shortlog -sn -- [files-found]

# Thay đổi đáng kể
git log --oneline --diff-filter=A -- [files-found]   # khi files được tạo

# Context của lần commit đầu tiên
git show [first-commit] --stat
```

Xác định:
- Feature được tạo khi nào
- Ai implement (để biết ai có thể được hỏi)
- Có breaking changes nào đã được fix sau đó không
- Tech debt nào đang tồn tại (TODO, FIXME trong code)

## Bước 4: Áp dụng tư duy phản biện

Từ framework `core/THINKING.md` (hoặc `.claude/skills/dw-thinking/THINKING.md`):

- **Giả định**: Code đang giả định gì về input, state, environment?
- **Failure modes**: Điều gì có thể làm feature này fail? Edge cases nào?
- **Tech debt**: Có TODO/FIXME? Có antipatterns? Code mùi?
- **Security**: Có điểm nào đáng lo ngại về auth, validation, data exposure?

## Bước 5: Tạo task docs

Tạo thư mục `{paths.tasks}/$ARGUMENTS/` và 3 files:

### 5a. Context doc

Tạo `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md`:

```markdown
# Context: $ARGUMENTS

## Ngày khảo sát: [date]
## Loại: Retroactive Documentation
## Người thực hiện: agent (dw-retroactive)

---

## Mô Tả Feature

[2-3 câu mô tả feature làm gì, phục vụ ai]

## Codebase Analysis

### Files Liên Quan

| # | File | Vai trò | Ghi chú |
|---|------|---------|---------|
| 1 | [file] | [vai trò] | |

### Kiến Trúc

```
[ASCII diagram hoặc mô tả luồng]
Input → [Module] → Output
           ↓
      [Dependencies]
```

### Data Flow

- **Input**: [từ đâu, format gì]
- **Processing**: [logic chính]
- **Output**: [đi đâu, format gì]
- **Side effects**: [DB writes, events, external calls]

## Dependencies

### Upstream (feature phụ thuộc vào)
- [ ] [Module/Service] — [vai trò]

### Downstream (ai phụ thuộc vào feature này)
- [ ] [Module/Service] — [ảnh hưởng thế nào]

## Git History

- **Tạo lần đầu**: [date] bởi [author]
- **Commits**: [N commits]
- **Maintainer chính**: [author]
- **Thay đổi đáng kể**: [mô tả nếu có]

## Test Coverage

- [ ] Có tests: [Có/Không]
- Test files: [danh sách]
- Coverage: [mô tả]
- Gaps: [thiếu test ở đâu]

## Giả Định & Hạn Chế

| # | Giả định/Hạn chế | Mức độ rủi ro |
|---|-----------------|--------------|
| 1 | [giả định trong code] | Cao/TB/Thấp |

## Tech Debt & Warnings

- [ ] [TODO/FIXME đang có]
- [ ] [Antipatterns phát hiện]
- [ ] [Security concerns]

## Ghi Chú Cho AI

> Context quan trọng khi làm task liên quan feature này:
- [Gotcha 1]
- [Gotcha 2]
```

### 5b. As-Built Plan doc

Tạo `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md`:

```markdown
# As-Built Plan: $ARGUMENTS

## Ngày tạo: [date]
## Loại: As-Built (Retroactive) — không phải forward plan
## Trạng thái: Done (implemented trước khi adopt dw)
## Implemented by: [author từ git history]

---

> ⚠ Đây là tài liệu retroactive — mô tả những gì ĐÃ được implement,
> không phải plan cho việc sẽ làm. Dùng để AI và team hiểu context.

## Tóm Tắt Giải Pháp Đã Implement

[Mô tả approach được dùng, dựa trên code analysis]

## Những Gì Đã Implement

### Component 1: [Tên]
- **Mô tả**: [làm gì]
- **Files**: [danh sách]
- **Cách hoạt động**: [tóm tắt logic]

### Component 2: [Tên]
...

## Quyết Định Kỹ Thuật Đáng Chú Ý

| Quyết định | Approach đã dùng | Lý do suy đoán |
|-----------|-----------------|----------------|
| [decision] | [approach] | [inferred from code/commits] |

## Rủi Ro & Hạn Chế Đã Biết

| # | Mô tả | Mức độ | Trạng thái |
|---|-------|--------|-----------|
| 1 | [risk] | Cao/TB/Thấp | Open/Resolved |

## Edge Cases

- [ ] [Edge case được xử lý hay chưa?]

## Tác Động Hệ Thống

- **Modules ảnh hưởng**: [danh sách]
- **API**: [endpoints liên quan]
- **Database**: [schema/tables liên quan]
```

### 5c. Progress doc

Tạo `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md`:

```markdown
# Progress: $ARGUMENTS

## Trạng thái: Done (Pre-dw Implementation)
## Loại: Retroactive Documentation
## Documented on: [date]

---

> Feature này đã được implement trước khi adopt dw-kit.
> File này được tạo retroactively để AI có context khi làm task liên quan.

## Implementation History (từ git)

| Thời điểm | Sự kiện | Author |
|-----------|---------|--------|
| [date] | Feature được tạo | [author] |
| [date] | [notable change] | [author] |

## Known Issues / Open Items

- [ ] [Issue đang mở nếu có]
- [ ] [Tech debt cần xử lý]

## Handoff Notes cho AI

Khi làm task liên quan feature này:
- **Đọc trước**: `$ARGUMENTS-context.md` để hiểu architecture
- **Cẩn thận**: [warning 1]
- **Không thay đổi**: [phần nào là stable contract]
- **Có thể refactor**: [phần nào an toàn để thay đổi]
```

---

## Bước 6: Báo cáo kết quả

```
╔══════════════════════════════════════════════════════╗
║  ✅ dw-retroactive complete: $ARGUMENTS
╠══════════════════════════════════════════════════════╣
║  Files khảo sát    : [N files]
║  Git commits       : [N commits, từ [date] đến [date]]
║  Maintainer chính  : [author]
╠══════════════════════════════════════════════════════╣
║  Docs đã tạo:
║    {paths.tasks}/$ARGUMENTS/$ARGUMENTS-context.md
║    {paths.tasks}/$ARGUMENTS/$ARGUMENTS-plan.md  (as-built)
║    {paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md
╠══════════════════════════════════════════════════════╣
║  Key findings:
║  • [Finding 1]
║  • [Finding 2]
║  • [Finding 3]
╠══════════════════════════════════════════════════════╣
║  Tech debt / warnings:
║  • [Warning nếu có]
╠══════════════════════════════════════════════════════╣
║  Tiếp theo:
║  → Khi cần task liên quan: /dw-research $ARGUMENTS
║     (AI sẽ đọc context docs vừa tạo làm foundation)
╚══════════════════════════════════════════════════════╝
```

---

## Lưu ý

- **As-built ≠ forward plan**: Docs này mô tả hiện trạng, không phải kế hoạch
- **Best-effort**: AI chỉ thấy được những gì có trong code và git — context ẩn (verbal decisions, Slack threads) có thể thiếu. Cần human review và bổ sung.
- **Sau khi tạo**: Khuyến khích dev liên quan review và bổ sung `## Ghi Chú Cho AI` section
