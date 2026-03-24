#!/bin/bash
# .claude/hooks/progress-ping.sh
# Nhắc cập nhật progress file khi notification event xảy ra.
# Non-blocking, informational only.
# Được gọi bởi Notification hook.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# ── Tìm active tasks ──────────────────────────────────────────────────────────
CONFIG_FILE="$PROJECT_DIR/config/dw.config.yml"
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="$PROJECT_DIR/config/dw.config.yml"

TASKS_DIR="$PROJECT_DIR/.dw/tasks"

# Đọc paths.tasks từ config nếu có
if [ -f "$CONFIG_FILE" ]; then
  CUSTOM_TASKS=$(grep -m1 "tasks:" "$CONFIG_FILE" 2>/dev/null \
    | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d "'" | tr -d '[:space:]' || true)
  [ -n "$CUSTOM_TASKS" ] && TASKS_DIR="$PROJECT_DIR/$CUSTOM_TASKS"
fi

[ ! -d "$TASKS_DIR" ] && exit 0

# ── Kiểm tra in-progress tasks ───────────────────────────────────────────────
in_progress_tasks=()

for task_dir in "$TASKS_DIR"/*/; do
  [ -d "$task_dir" ] || continue
  task_name=$(basename "$task_dir")
  [ "$task_name" = "archive" ] && continue

  progress_file="$task_dir/${task_name}-progress.md"
  [ -f "$progress_file" ] || continue

  # Kiểm tra status
  if grep -q "Trạng thái: In Progress" "$progress_file" 2>/dev/null; then
    in_progress_tasks+=("$task_name")
  fi
done

# ── Chỉ remind nếu có active tasks ───────────────────────────────────────────
if [ ${#in_progress_tasks[@]} -gt 0 ]; then
  echo "📋 Active task(s): ${in_progress_tasks[*]}" >&2
  echo "   Nhớ cập nhật progress file sau khi hoàn thành subtask." >&2
fi

exit 0
