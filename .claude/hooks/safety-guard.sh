#!/bin/bash
# .claude/hooks/safety-guard.sh
# Intercept destructive Bash commands trước khi execute.
# exit 0 = allow, exit 2 = block
#
# Được gọi bởi PreToolUse hook cho tất cả Bash commands.

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | sed 's/"command"[[:space:]]*:[[:space:]]*"//;s/"$//' | head -1)

[ -z "$COMMAND" ] && exit 0

# ── Pattern 1: rm -rf với path quá rộng ──────────────────────────────────────
# Block: rm -rf / | rm -rf * | rm -rf . (nguy hiểm)
# Allow: rm -rf ./specific/path | rm -rf /tmp/specific-file
if echo "$COMMAND" | grep -qE 'rm\s+-rf?\s+(\/\s*$|\*|\.(\s|$))'; then
  echo "🚨 BLOCKED: rm -rf với path nguy hiểm ($COMMAND)" >&2
  echo "   Chỉ định path cụ thể hơn để proceed." >&2
  exit 2
fi

# ── Pattern 2: git push --force lên main/master ───────────────────────────────
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force'; then
  BRANCH=$(echo "$COMMAND" | grep -oE '(main|master|develop|dev)' | head -1)
  if [ -n "$BRANCH" ]; then
    echo "🚨 BLOCKED: git push --force lên $BRANCH" >&2
    echo "   Force push lên protected branch không được phép." >&2
    exit 2
  fi
  # Force push lên non-protected branch: warn nhưng allow
  echo "⚠  Warning: git push --force (non-protected branch)" >&2
  echo "   Proceed nếu intentional." >&2
  exit 0
fi

# ── Pattern 3: Destructive SQL không có WHERE ─────────────────────────────────
if echo "$COMMAND" | grep -qiE '(DELETE\s+FROM|UPDATE\s+\w+\s+SET)' \
   && ! echo "$COMMAND" | grep -qi 'WHERE'; then
  echo "🚨 BLOCKED: Destructive SQL không có WHERE clause" >&2
  echo "   Thêm WHERE clause hoặc confirm intentional." >&2
  exit 2
fi

# ── Pattern 4: DROP TABLE / DROP DATABASE ────────────────────────────────────
if echo "$COMMAND" | grep -qiE 'DROP\s+(TABLE|DATABASE|SCHEMA)'; then
  echo "⚠  Warning: DROP statement detected ($COMMAND)" >&2
  echo "   Đây có phải migration script đã được review không?" >&2
  # Warn but allow — user có thể đang chạy migration
  exit 0
fi

exit 0
