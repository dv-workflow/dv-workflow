---
name: dw:archive
description: "Move task docs đã hoàn thành vào archive. Giữ .dw/tasks/ gọn gàng. Dùng sau khi task Done và đã merge PR."
argument-hint: "[task-name | --all-done | --older-than-days N]"
---

# Archive Tasks: $ARGUMENTS

## Parse Arguments

- `[task-name]` — archive 1 task cụ thể
- `--all-done` — archive tất cả tasks có status Done
- `--older-than-days N` — archive tasks Done đã N ngày

## Bước 1: Đọc config

`paths.tasks` → thư mục tasks.
Archive destination: `{paths.tasks}/archive/`

## Bước 2: Tìm tasks cần archive

### Nếu `[task-name]`:
Đọc `{paths.tasks}/[task-name]/[task-name]-progress.md` → kiểm tra status.
Nếu status không phải Done → warn: "Task chưa Done. Archive anyway? (y/n)"

### Nếu `--all-done`:
```bash
grep -r "^## Trạng thái: Done" {paths.tasks}/*/  # hoặc "Status: Done" (en)
```
Liệt kê tất cả tasks Done.

### Nếu `--older-than-days N`:
Kết hợp: tasks Done VÀ completion date > N ngày trước.

## Bước 3: Preview và confirm

```
Tasks sẽ được archive:

  [task-name-1]  — Done — [completion date]
  [task-name-2]  — Done — [completion date]

Destination: {paths.tasks}/archive/

Tiếp tục? (y/n)
```

## Bước 4: Archive

```bash
mkdir -p {paths.tasks}/archive/[YYYY-MM]/
mv {paths.tasks}/[task-name] {paths.tasks}/archive/[YYYY-MM]/
```

Tổ chức theo tháng hoàn thành để dễ tìm kiếm sau.

## Bước 5: Cập nhật archive index

Ghi/cập nhật `{paths.tasks}/archive/README.md`:

```markdown
# Task Archive

| Task | Completion Date | Month | Summary |
|------|----------------|-------|---------|
| [task-name] | [date] | [YYYY-MM] | [1-line summary từ progress.md] |
```

## Bước 6: Thông báo

```
Archive hoàn tất.

Đã archive X task(s):
  ✓ [task-name-1] → archive/[YYYY-MM]/
  ✓ [task-name-2] → archive/[YYYY-MM]/

Index cập nhật: {paths.tasks}/archive/README.md

.dw/tasks/ hiện còn: [N] active tasks
```
