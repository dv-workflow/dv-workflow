---
name: dw-log-work
description: "Ghi nhận effort thực tế cho task hoặc subtask. So sánh với estimate. Cập nhật metrics tracking. Dùng sau khi hoàn thành subtask/task."
argument-hint: "[task-name]"
---

# Ghi Nhận Effort

Task: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml`:
- `flags.log_work` — nếu `false` → DỪNG
- `estimation.unit` → đơn vị
- `estimation.track_actual` → có so sánh estimate vs actual không
- `paths.tasks`, `paths.metrics`

## Hỏi User (Interactive)

Hỏi thông tin cần ghi:

```
1. Subtask nào? (ST-1 / ST-2 / all)
2. Thời gian thực tế: [X hours/points]
3. Loại công việc: coding / testing / review / research / documentation
4. Ghi chú (optional): [lý do lệch estimate, blockers gặp, etc.]
```

## Ghi Vào Progress File

Cập nhật `{paths.tasks}/$ARGUMENTS/$ARGUMENTS-progress.md` → mục "Effort Log":

```markdown
| [date] | ST-N | [loại] | [estimate] | [actual] | [ghi chú] |
```

## Cập Nhật Metrics File

Nếu `flags.metrics_tracking = true`:
Ghi vào `{paths.metrics}/effort-log.json`:

```json
{
  "date": "YYYY-MM-DD",
  "task": "task-name",
  "subtask": "ST-N",
  "type": "coding",
  "estimate": X,
  "actual": Y,
  "variance": Y-X,
  "accuracy_pct": (X/Y)*100,
  "notes": "..."
}
```

## Tóm Tắt

Sau khi log, hiển thị:

```
✅ Đã ghi: ST-N — Actual: Xh (Estimate: Yh)
Variance: +Zh (over) / -Zh (under)

Task tổng (đến hiện tại):
  Total estimated: Xh
  Total actual:    Yh
  Accuracy:        Z%
```

Nếu variance > 50%: "⚠️ Lệch estimate đáng kể. Cân nhắc cập nhật estimate cho subtasks còn lại."
