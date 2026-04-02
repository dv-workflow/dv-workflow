#!/usr/bin/env bash
# Stop hook: warn nếu có uncommitted changes hoặc task in-progress chưa update
# Output ra stderr để hiện thị cho user, exit 0 để không block

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
WARNINGS=()

# Check uncommitted changes
if git -C "$PROJECT_DIR" diff --quiet && git -C "$PROJECT_DIR" diff --cached --quiet; then
  : # clean
else
  CHANGED=$(git -C "$PROJECT_DIR" diff --stat --cached && git -C "$PROJECT_DIR" diff --stat)
  WARNINGS+=("Uncommitted changes:"$'\n'"$CHANGED")
fi

# Check in-progress tasks
TASKS_DIR="$PROJECT_DIR/.dw/tasks"
if [ -d "$TASKS_DIR" ]; then
  while IFS= read -r progress_file; do
    if grep -q "Trạng thái: In Progress" "$progress_file" 2>/dev/null; then
      task_name=$(basename "$(dirname "$progress_file")")
      WARNINGS+=("Task in-progress chưa được update: $task_name")
    fi
  done < <(find "$TASKS_DIR" -name "*-progress.md" 2>/dev/null)
fi

# Print warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "--- dw stop-check ---" >&2
  for w in "${WARNINGS[@]}"; do
    printf "⚠ %b\n" "$w" >&2
  done
  echo "---------------------" >&2
fi

exit 0
