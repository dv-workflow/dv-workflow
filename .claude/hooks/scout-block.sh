#!/usr/bin/env bash
# .claude/hooks/scout-block.sh — dw-kit v1.2
# Block agent reads vào heavy/irrelevant directories để tăng performance.
# Học từ claudekit scout-block pattern.
#
# PreToolUse hook cho: Read, Glob
# exit 0 = allow, exit 2 = block

INPUT=$(cat)

# Extract tool name và file path từ JSON input
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_name', ''))
except: pass
" 2>/dev/null || true)

# Extract path tùy theo tool
if [ "$TOOL_NAME" = "Read" ]; then
  TARGET=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except: pass
" 2>/dev/null || true)
elif [ "$TOOL_NAME" = "Glob" ]; then
  TARGET=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {})
    # Dùng path nếu có, fallback sang pattern
    print(ti.get('path', ti.get('pattern', '')))
except: pass
" 2>/dev/null || true)
else
  exit 0
fi

[ -z "$TARGET" ] && exit 0

# Normalize: lowercase, forward slashes
NORM=$(echo "$TARGET" | tr '\\' '/')

# ── Danh sách heavy/irrelevant directories ─────────────────────────────────────
BLOCKED_PATTERNS=(
  "node_modules/"
  "/node_modules"
  "dist/"
  "/dist/"
  "build/"
  "/build/"
  ".git/"
  "/__pycache__/"
  "/.pytest_cache/"
  "/.next/"
  "/.nuxt/"
  "/vendor/"
  "/coverage/"
  "/.tmp/"
  "/tmp/"
  "/.cache/"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$NORM" | grep -q "$pattern"; then
    echo "⚡ scout-block: Skipped heavy directory [${TOOL_NAME}] $(basename "$TARGET")/" >&2
    echo "   Path: $TARGET" >&2
    echo "   Dùng path cụ thể hơn nếu thực sự cần đọc file này." >&2
    exit 2
  fi
done

# Block pattern: kết thúc bằng thư mục blocked (không có trailing slash)
BLOCKED_EXACT=("node_modules" ".git" "dist" "build" "__pycache__" ".next" ".nuxt" "vendor" "coverage")
BASENAME=$(basename "$NORM")
for exact in "${BLOCKED_EXACT[@]}"; do
  if [ "$BASENAME" = "$exact" ]; then
    echo "⚡ scout-block: Skipped heavy directory [${TOOL_NAME}] $BASENAME/" >&2
    exit 2
  fi
done

exit 0
