#!/bin/bash
# .claude/hooks/pre-commit-gate.sh
# Quality gate: chạy trước mỗi Bash tool call.
# Intercepts `git commit` để kiểm tra config flags.
# exit 0 = allow (có thể warn), exit 2 = block

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

# Chỉ xử lý git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  exit 0
fi

# Đọc config
CONFIG_FILE="$CLAUDE_PROJECT_DIR/dv-workflow.config.yml"
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Parse flags từ YAML (đơn giản, không cần full YAML parser)
get_flag() {
  grep -A1 "^flags:" "$CONFIG_FILE" | grep "$1:" | awk '{print $2}' | tr -d '"' | head -1
}

PRE_COMMIT_TESTS=$(grep "pre_commit_tests:" "$CONFIG_FILE" | awk '{print $2}' | tr -d '"' | head -1)
PRE_COMMIT_LINT=$(grep "pre_commit_lint:" "$CONFIG_FILE" | awk '{print $2}' | tr -d '"' | head -1)
BLOCK_ON_FAIL=$(grep "block_commit_on_fail:" "$CONFIG_FILE" | awk '{print $2}' | tr -d '"' | head -1)

# Nếu tất cả flags là false/skip → allow
if [ "$PRE_COMMIT_TESTS" = "false" ] && [ "$PRE_COMMIT_LINT" = "false" ]; then
  exit 0
fi

# Thông báo quality gate đang check
echo "⚙️  dv-workflow quality gate đang kiểm tra..." >&2

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

# Reminder về tests (nếu flag là true hoặc skip)
if [ "$PRE_COMMIT_TESTS" = "true" ]; then
  echo "📋 Reminder: Hãy đảm bảo tests đã pass trước khi commit." >&2
  echo "   Chạy: /commit sẽ tự kiểm tra, hoặc verify thủ công." >&2
fi

if [ "$ISSUES" -eq 0 ]; then
  echo "✅ Quality gate: OK" >&2
fi

exit 0
