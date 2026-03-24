#!/bin/bash
# .claude/hooks/pre-commit-gate.sh
# Quality gate: chạy trước mỗi Bash tool call.
# Intercepts `git commit` để kiểm tra quality config (v1 schema).
# exit 0 = allow (có thể warn), exit 2 = block

INPUT=$(cat)

# Extract command từ JSON input — pure grep/sed, no Python needed
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"command"[[:space:]]*:[[:space:]]*"//;s/"$//' | head -1)

# Chỉ xử lý git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  exit 0
fi

# Đọc config
CONFIG_FILE="$CLAUDE_PROJECT_DIR/.dw/config/dw.config.yml"
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Parse values từ YAML — pure grep/sed, no Python needed
get_value() {
  local key="$1"
  grep -m1 "^[[:space:]]*${key}:" "$CONFIG_FILE" 2>/dev/null \
    | sed 's/.*:[[:space:]]*//' \
    | sed 's/[[:space:]]*#.*//' \
    | tr -d '"'"'"' \
    | tr '[:upper:]' '[:lower:]' \
    | tr -d '[:space:]' \
    || echo ""
}

BLOCK_ON_FAIL=$(get_value "block_on_fail")
TEST_COMMAND=$(get_value "test_command")
LINT_COMMAND=$(get_value "lint_command")
HAS_TESTS=false
HAS_LINT=false
[ -n "$TEST_COMMAND" ] && HAS_TESTS=true
[ -n "$LINT_COMMAND" ] && HAS_LINT=true

# Nếu không cấu hình test/lint command → allow (chỉ chạy safety checks)
if [ "$HAS_TESTS" = false ] && [ "$HAS_LINT" = false ]; then
  exit 0
fi

# Thông báo quality gate đang check
echo "⚙️  dw-kit quality gate đang kiểm tra..." >&2

ISSUES=0

# Check: có debug code không?
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)
if [ -n "$STAGED_FILES" ]; then
  DEBUG_FOUND=$(git diff --cached 2>/dev/null | grep "^+" | grep -E "console\.log\(|debugger|var_dump\(|dd\(|pdb\.set_trace" | grep -v "^+++" | head -5)
  if [ -n "$DEBUG_FOUND" ]; then
    echo "⚠️  Warning: Phát hiện debug code còn sót:" >&2
    echo "$DEBUG_FOUND" >&2
    ISSUES=$((ISSUES + 1))
  fi
fi

# Check: sensitive patterns?
SENSITIVE=$(git diff --cached 2>/dev/null | grep "^+" | grep -iE "(password|secret|api_key|private_key)\s*=\s*['\"][^'\"]{8,}" | grep -v "^+++" | head -3)
if [ -n "$SENSITIVE" ]; then
  echo "🚨 CẢNH BÁO: Có thể có sensitive data trong commit!" >&2
  echo "$SENSITIVE" >&2
  if [ "$BLOCK_ON_FAIL" = "true" ]; then
    echo "Commit bị block. Kiểm tra lại staged files." >&2
    exit 2
  fi
fi

# Reminder về tests/lint theo config v1
if [ "$HAS_TESTS" = true ]; then
  echo "📋 Reminder: Hãy đảm bảo tests đã pass trước khi commit." >&2
  echo "   Test command: $TEST_COMMAND" >&2
fi

if [ "$HAS_LINT" = true ]; then
  echo "📋 Reminder: Hãy đảm bảo lint đã pass trước khi commit." >&2
  echo "   Lint command: $LINT_COMMAND" >&2
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "✅ Quality gate: OK" >&2
fi

exit 0
