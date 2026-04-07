#!/usr/bin/env bash
# .claude/hooks/privacy-block.sh — dw-kit v1.2
# Block agent reads vào sensitive files (credentials, secrets, private keys).
# Học từ claudekit privacy-block pattern.
#
# PreToolUse hook cho: Read
# exit 0 = allow, exit 2 = block

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{ process.stdout.write(JSON.parse(d).tool_name||''); }catch(e){}
});
" 2>/dev/null || true)

[ "$TOOL_NAME" != "Read" ] && exit 0

FILE_PATH=$(echo "$INPUT" | node -e "
let d='';
process.stdin.on('data',c=>d+=c).on('end',()=>{
  try{ const p=JSON.parse(d); process.stdout.write((p.tool_input&&p.tool_input.file_path)||''); }catch(e){}
});
" 2>/dev/null || true)

[ -z "$FILE_PATH" ] && exit 0

BASENAME=$(basename "$FILE_PATH")
NORM=$(echo "$FILE_PATH" | tr '\\' '/')

# ── Allow-list: safe files dù tên giống sensitive ─────────────────────────────
ALLOWED_PATTERNS=(
  ".env.example"
  ".env.sample"
  ".env.template"
  ".env.test"
  ".env.local.example"
  "*.example"
  "*.sample"
)

for allow in "${ALLOWED_PATTERNS[@]}"; do
  if [[ "$BASENAME" == $allow ]]; then
    exit 0
  fi
done

# ── Block patterns ──────────────────────────────────────────────────────────────
BLOCKED=false
REASON=""

# .env files (nhưng không phải .env.example đã allow ở trên)
if [[ "$BASENAME" == ".env" ]] || [[ "$BASENAME" == .env.* ]]; then
  BLOCKED=true
  REASON="Environment file (có thể chứa secrets/API keys)"
fi

# Private key files
if [[ "$BASENAME" == *.pem ]] || [[ "$BASENAME" == *.key ]] || \
   [[ "$BASENAME" == *.p12 ]] || [[ "$BASENAME" == *.pfx ]] || \
   [[ "$BASENAME" == *.jks ]]; then
  BLOCKED=true
  REASON="Private key / certificate file"
fi

# Credentials & secrets files
if echo "$BASENAME" | grep -qiE '^(credentials|secrets?|secret[-_]key|api[-_]key|auth[-_]token|access[-_]token)(\.[a-z]+)?$'; then
  BLOCKED=true
  REASON="Credentials / secrets file"
fi

# Known credential file patterns
if [[ "$BASENAME" == "*.credentials.json" ]] || \
   echo "$NORM" | grep -qiE '/(credentials|secrets)/'; then
  BLOCKED=true
  REASON="Credentials directory hoặc file"
fi

# Service account / GCP keys
if echo "$BASENAME" | grep -qiE 'service[-_]account.*\.json$|gcp.*key.*\.json$|firebase.*key.*\.json$'; then
  BLOCKED=true
  REASON="Service account / cloud credentials"
fi

if [ "$BLOCKED" = true ]; then
  echo "🔒 privacy-block: Blocked sensitive file read" >&2
  echo "   File: $FILE_PATH" >&2
  echo "   Lý do: $REASON" >&2
  echo "   Nếu thực sự cần đọc file này, hãy confirm rõ ràng trong prompt." >&2
  exit 2
fi

exit 0
