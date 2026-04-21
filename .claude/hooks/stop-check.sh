#!/usr/bin/env bash
# Stop hook: warn on uncommitted changes + auto-append handoff to active task tracking.md
# v1.4: auto-handoff (ST-2.5) — append session summary to tracking.md when uncommitted
# Output via stderr for user visibility. Always exit 0 (non-blocking).

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
WARNINGS=()

# --- Telemetry (local, fire-and-forget) ---
TELEMETRY_SCRIPT="$PROJECT_DIR/.claude/hooks/telemetry-log.sh"
if [ -x "$TELEMETRY_SCRIPT" ] && [ "${DW_NO_TELEMETRY:-}" != "1" ]; then
  "$TELEMETRY_SCRIPT" hook stop-check >/dev/null 2>&1 || true
fi

# --- Check uncommitted changes ---
HAS_UNCOMMITTED=0
if git -C "$PROJECT_DIR" diff --quiet && git -C "$PROJECT_DIR" diff --cached --quiet; then
  : # clean
else
  HAS_UNCOMMITTED=1
  CHANGED=$(git -C "$PROJECT_DIR" diff --stat --cached && git -C "$PROJECT_DIR" diff --stat)
  WARNINGS+=("Uncommitted changes:"$'\n'"$CHANGED")
fi

# --- Check in-progress tasks (both v1 3-file and v2 2-file formats) ---
TASKS_DIR="$PROJECT_DIR/.dw/tasks"
ACTIVE_TASK=""

if [ -d "$TASKS_DIR" ]; then
  # v1 format: {task}-progress.md with "Trạng thái: In Progress"
  while IFS= read -r progress_file; do
    if grep -q "Trạng thái: In Progress" "$progress_file" 2>/dev/null; then
      task_name=$(basename "$(dirname "$progress_file")")
      WARNINGS+=("Task in-progress (v1): $task_name")
      [ -z "$ACTIVE_TASK" ] && ACTIVE_TASK="$task_name"
    fi
  done < <(find "$TASKS_DIR" -maxdepth 3 -name "*-progress.md" -not -path "*/archive/*" 2>/dev/null)

  # v2 format: tracking.md with frontmatter status In Progress
  while IFS= read -r tracking_file; do
    if grep -qE "^status:.*(In Progress|Code Complete)" "$tracking_file" 2>/dev/null; then
      task_name=$(basename "$(dirname "$tracking_file")")
      WARNINGS+=("Task active (v2): $task_name")
      [ -z "$ACTIVE_TASK" ] && ACTIVE_TASK="$task_name"
    fi
  done < <(find "$TASKS_DIR" -maxdepth 3 -name "tracking.md" -not -path "*/archive/*" 2>/dev/null)
fi

# --- Auto-handoff: append snippet to active task's tracking.md if uncommitted + active task ---
if [ "$HAS_UNCOMMITTED" = "1" ] && [ -n "$ACTIVE_TASK" ]; then
  TRACKING_FILE="$TASKS_DIR/$ACTIVE_TASK/tracking.md"
  if [ -f "$TRACKING_FILE" ]; then
    TS=$(date -u +"%Y-%m-%d %H:%M UTC")
    MARKER="<!-- dw-auto-handoff -->"

    # Only append if no handoff snippet added in last 10 minutes (idempotency via marker + timestamp grep)
    if ! grep -q "$MARKER.*$TS" "$TRACKING_FILE" 2>/dev/null; then
      {
        echo ""
        echo "$MARKER"
        echo "### Auto-handoff — $TS"
        echo ""
        echo "Session ended with uncommitted changes."
        echo ""
        echo "**Files changed:**"
        echo '```'
        git -C "$PROJECT_DIR" diff --stat --cached 2>/dev/null
        git -C "$PROJECT_DIR" diff --stat 2>/dev/null
        echo '```'
        echo ""
        echo "Next session: commit or continue work. Re-read spec.md + this tracking.md first."
        echo ""
      } >> "$TRACKING_FILE" 2>/dev/null
      WARNINGS+=("Auto-handoff appended to: $TRACKING_FILE")
    fi
  fi
fi

# --- Print warnings ---
if [ ${#WARNINGS[@]} -gt 0 ]; then
  printf -- "--- dw stop-check ---\n" >&2
  for w in "${WARNINGS[@]}"; do
    printf "⚠ %b\n" "$w" >&2
  done
  printf -- "---------------------\n" >&2
fi

exit 0
