#!/bin/bash
# .claude/hooks/post-write.sh
# Chạy lint trên file vừa được Write/Edit — non-blocking.
# Được gọi bởi PostToolUse hook sau Write và Edit.

# Telemetry (local, fire-and-forget)
TELEMETRY_SCRIPT="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/hooks/telemetry-log.sh"
if [ -x "$TELEMETRY_SCRIPT" ] && [ "${DW_NO_TELEMETRY:-}" != "1" ]; then
  "$TELEMETRY_SCRIPT" hook post-write >/dev/null 2>&1 || true
fi

INPUT=$(cat)

# Extract file path từ tool result
FILE_PATH=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{
    const data=JSON.parse(d);
    const p=data.file_path||data.path||data.filePath||(data.tool_input&&(data.tool_input.file_path||data.tool_input.path))||'';
    process.stdout.write(p);
  }catch(e){}
});
" 2>/dev/null || true)

[ -z "$FILE_PATH" ] && exit 0

# ── Đọc lint command từ config ────────────────────────────────────────────────
CONFIG_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.dw/config/dw.config.yml"
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
