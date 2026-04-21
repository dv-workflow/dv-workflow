---
name: dw:handoff
description: "Tạo tài liệu bàn giao session để người hoặc agent tiếp theo có thể tiếp tục không cần hỏi lại. Dùng cuối session hoặc khi chuyển task."
argument-hint: "[task-name]"
---

# Bàn Giao Session

Task: **$ARGUMENTS**

## Đọc Config

Đọc `.dw/config/dw.config.yml` → `paths.tasks`, `workflow.default_depth`.

## Thu Thập Thông Tin

### 1. Git state
```bash
git log --oneline -5         # commits gần nhất
git status                   # unstaged/staged changes
git stash list               # stashed work
```

### 2. Task progress

**Detect format**: Nếu có `tracking.md` → v2. Nếu có `-progress.md` → v1.

- **v2**: Đọc `{paths.tasks}/$ARGUMENTS/tracking.md` — Subtask Progress table, Changelog, Handoff Notes (nếu đã có).
- **v1**: Đọc `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md`.

Tìm:
- Subtask nào đã done?
- Subtask nào đang làm dở?
- Blockers nào đang tồn tại?

### 3. Code state
- Có code uncommitted không?
- Tests đang ở trạng thái pass/fail?
- Có TODO/FIXME nào mới thêm vào?

## Viết Handoff Notes

**v2**: Replace (hoặc append nếu muốn giữ lịch sử) section `## Handoff Notes` trong `{paths.tasks}/$ARGUMENTS/tracking.md`. Cũng update frontmatter `last_updated`.

**v1**: Ghi vào mục "Handoff Notes" trong `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md`.

Format (chung cho cả 2):

```markdown
## Handoff Notes

### Session [ngày giờ] → [người/agent tiếp theo]

**Trạng thái nhanh**: [1 câu mô tả]

**Đang ở**: ST-[N] — [tên subtask] — [% hoặc mô tả tiến độ]

**Đã hoàn thành**:
- ✅ ST-1: [tên] (commit: abc1234)
- ✅ ST-2: [tên] (commit: def5678)

**Đang làm dở**:
- 🔄 ST-3: [tên]
  - Done: [phần đã làm]
  - Còn lại: [phần chưa làm]
  - Files đang edit: [danh sách]

**Blockers**:
- ❌ [Blocker nếu có]

**Bước tiếp theo** (theo thứ tự):
1. [Việc cần làm đầu tiên]
2. [Tiếp theo]

**Context quan trọng**:
- [Quyết định A đã được đưa ra vì lý do X]
- [Cẩn thận: file Y có logic đặc biệt ở line Z]
- [Assumption: Z đang được coi là đúng]

**Uncommitted changes**: [Có / Không — nếu có, mô tả]
```

## Thông Báo

Sau khi ghi xong, hiển thị:
- Tóm tắt handoff notes
- Lệnh để người/agent tiếp theo bắt đầu:
  ```
  Đọc: {paths.tasks}/$ARGUMENTS/tracking.md     (v2)
    hoặc {paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md  (v1 legacy)
  Tiếp tục: /dw:execute $ARGUMENTS
  ```
