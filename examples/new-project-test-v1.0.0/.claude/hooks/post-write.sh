#!/bin/bash
# .claude/hooks/post-write.sh
# Chạy lint trên file vừa được Write/Edit — non-blocking.
# Được gọi bởi PostToolUse hook sau Write và Edit.

INPUT=$(cat)

# Extract file path từ tool result
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # PostToolUse result có thể chứa file path theo nhiều cách
    for key in ['file_path', 'path', 'filePath']:
        if key in data:
            print(data[key])
            break
except:
    pass
" 2>/dev/null || true)

[ -z "$FILE_PATH" ] && exit 0

# ── Đọc lint command từ config ────────────────────────────────────────────────
CONFIG_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/config/dw.config.yml"
# Fallback sang old config nếu chưa migrate
[ ! -f "$CONFIG_FILE" ] && CONFIG_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/config/dw.config.yml"
[ ! -f "$CONFIG_FILE" ] && exit 0

LINT_CMD=$(grep -m1 "lint_command:" "$CONFIG_FILE" 2>/dev/null \
  | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d "'" | tr -d '[:space:]' || true)

[ -z "$LINT_CMD" ] || [ "$LINT_CMD" = "" ] && exit 0

# ── Kiểm tra file có phải source code không ──────────────────────────────────
is_source_file() {
  local f="$1"
  echo "$f" | grep -qE '\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|vue|svelte|css|scss)$'
}

is_source_file "$FILE_PATH" || exit 0

# ── Chạy lint trên file (non-blocking) ───────────────────────────────────────
# Thử chạy lint chỉ trên file vừa thay đổi nếu tool hỗ trợ
if echo "$LINT_CMD" | grep -q "eslint"; then
  RESULT=$(eval "$LINT_CMD '$FILE_PATH'" 2>&1 || true)
elif echo "$LINT_CMD" | grep -q "ruff"; then
  RESULT=$(eval "ruff check '$FILE_PATH'" 2>&1 || true)
elif echo "$LINT_CMD" | grep -q "pylint"; then
  RESULT=$(eval "pylint '$FILE_PATH'" 2>&1 || true)
else
  # Generic: chạy toàn bộ lint command
  RESULT=$(eval "$LINT_CMD" 2>&1 || true)
fi

if [ -n "$RESULT" ]; then
  echo "⚠  Lint warnings sau khi write $FILE_PATH:" >&2
  echo "$RESULT" | head -20 >&2
  echo "   (non-blocking — kiểm tra và fix nếu cần)" >&2
fi

exit 0
