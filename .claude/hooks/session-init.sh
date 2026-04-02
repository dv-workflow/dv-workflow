#!/usr/bin/env bash
# .claude/hooks/session-init.sh — dw-kit v1.2
# Inject active task context vào đầu session, giải quyết "session amnesia".
# Chỉ chạy một lần mỗi session (track bằng session_id).
#
# UserPromptSubmit hook
# Stdout output → được inject vào context của user prompt
# exit 0 = allow

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('session_id', ''))
except: pass
" 2>/dev/null || true)

[ -z "$SESSION_ID" ] && exit 0

# ── Track session: chỉ chạy một lần mỗi session ───────────────────────────────
SESSION_MARKER="/tmp/dw-session-${SESSION_ID}"
if [ -f "$SESSION_MARKER" ]; then
  exit 0
fi
touch "$SESSION_MARKER" 2>/dev/null || true

# ── Scan .dw/tasks/ tìm tasks In Progress ─────────────────────────────────────
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASKS_DIR="$PROJECT_DIR/.dw/tasks"

[ ! -d "$TASKS_DIR" ] && exit 0

ACTIVE_TASKS=()
ACTIVE_SUMMARIES=()

while IFS= read -r progress_file; do
  if grep -q "Trạng thái: In Progress" "$progress_file" 2>/dev/null; then
    task_name=$(basename "$(dirname "$progress_file")")

    # Extract current subtask (dòng "In Progress" trong table)
    current_st=$(grep -m1 "In Progress" "$progress_file" 2>/dev/null \
      | grep -oP '\| ST-\d+ \| [^|]+' | sed 's/|//g' | xargs 2>/dev/null || echo "")

    # Extract last handoff note nếu có
    last_handoff=$(awk '/## Handoff Notes/{found=1} found{print}' "$progress_file" 2>/dev/null \
      | grep -m1 "Bước tiếp theo:" | sed 's/.*Bước tiếp theo://' | xargs 2>/dev/null || echo "")

    ACTIVE_TASKS+=("$task_name")
    summary="$task_name"
    [ -n "$current_st" ] && summary="$summary — $current_st"
    [ -n "$last_handoff" ] && summary="$summary | Next: $last_handoff"
    ACTIVE_SUMMARIES+=("$summary")
  fi
done < <(find "$TASKS_DIR" -name "*-progress.md" 2>/dev/null)

[ ${#ACTIVE_TASKS[@]} -eq 0 ] && exit 0

# ── Output context vào stdout (injected vào conversation) ─────────────────────
echo ""
echo "---"
echo "[dw-kit session-init] Task đang in-progress:"
for summary in "${ACTIVE_SUMMARIES[@]}"; do
  echo "  • $summary"
done
if [ ${#ACTIVE_TASKS[@]} -eq 1 ]; then
  echo "Context: .dw/tasks/${ACTIVE_TASKS[0]}/"
else
  echo "Nhiều tasks đang active — hỏi user task nào cần tiếp tục."
fi
echo "---"
echo ""

exit 0
