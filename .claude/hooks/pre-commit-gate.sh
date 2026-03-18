#!/bin/bash
# .claude/hooks/pre-commit-gate.sh
# Quality gate: chạy trước mỗi Bash tool call.
# Intercepts `git commit` để kiểm tra config flags.
# exit 0 = allow (có thể warn), exit 2 = block

INPUT=$(cat)

# Detect python command (Windows: python, macOS/Linux: python3)
if command -v python3 &>/dev/null && python3 -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" 2>/dev/null; then
  PYTHON=python3
elif command -v python &>/dev/null && python -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" 2>/dev/null; then
  PYTHON=python
else
  PYTHON=""
fi

COMMAND=$(echo "$INPUT" | ${PYTHON:-python3} -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

# Chỉ xử lý git commit commands
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  exit 0
fi

# Đọc config
CONFIG_FILE="$CLAUDE_PROJECT_DIR/dv-workflow.config.yml"
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Parse flags từ YAML bằng python (robust hơn grep+awk)
get_flag() {
  ${PYTHON:-python3} - "$CONFIG_FILE" "$1" <<'PYEOF' 2>/dev/null
import sys, re
try:
    content = open(sys.argv[1]).read()
    key = sys.argv[2]
    m = re.search(r'^\s*' + re.escape(key) + r':\s*(["\']?)([^#\n"\']+)\1', content, re.MULTILINE)
    print(m.group(2).strip().lower() if m else 'false')
except Exception:
    print('false')
PYEOF
}

PRE_COMMIT_TESTS=$(get_flag "pre_commit_tests")
PRE_COMMIT_LINT=$(get_flag "pre_commit_lint")
BLOCK_ON_FAIL=$(get_flag "block_commit_on_fail")

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
