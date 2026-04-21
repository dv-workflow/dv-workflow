#!/usr/bin/env bash
# .claude/hooks/scout-block.sh — dw-kit v1.2
# Block agent reads vào heavy/irrelevant directories để tăng performance.
# Học từ claudekit scout-block pattern.
#
# PreToolUse hook cho: Read, Glob
# exit 0 = allow, exit 2 = block

# Telemetry (local, fire-and-forget)
TELEMETRY_SCRIPT="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/hooks/telemetry-log.sh"
if [ -x "$TELEMETRY_SCRIPT" ] && [ "${DW_NO_TELEMETRY:-}" != "1" ]; then
  "$TELEMETRY_SCRIPT" hook scout-block >/dev/null 2>&1 || true
fi

INPUT=$(cat)

# Extract tool name và file path từ JSON input
TOOL_NAME=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{ process.stdout.write(JSON.parse(d).tool_name||''); }catch(e){}
});
" 2>/dev/null || true)

# Extract path tùy theo tool
if [ "$TOOL_NAME" = "Read" ]; then
  TARGET=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{ const p=JSON.parse(d); process.stdout.write((p.tool_input&&p.tool_input.file_path)||''); }catch(e){}
});
" 2>/dev/null || true)
elif [ "$TOOL_NAME" = "Glob" ]; then
  TARGET=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{ const p=JSON.parse(d); const ti=p.tool_input||{}; process.stdout.write(ti.path||ti.pattern||''); }catch(e){}
});
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
