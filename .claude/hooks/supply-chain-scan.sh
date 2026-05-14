#!/bin/bash
# .claude/hooks/supply-chain-scan.sh
# Fires after Claude Code Write/Edit. If the file is a lockfile, runs `dw security-scan --quick`
# to detect known-vulnerable dependency pins (offline IoC + advisory snapshot check).
# Non-blocking — never aborts the parent tool call. Emits telemetry.
# Reference: ADR-0005 (AI-Native Supply-Chain Guard). Sunset review 2026-08-12.

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TELEMETRY_SCRIPT="$PROJECT_DIR/.claude/hooks/telemetry-log.sh"

if [ "${DW_NO_TELEMETRY:-}" != "1" ] && [ -x "$TELEMETRY_SCRIPT" ]; then
  "$TELEMETRY_SCRIPT" hook supply-chain-scan >/dev/null 2>&1 || true
fi

if [ "${DW_SC_GUARD_DISABLED:-}" = "1" ]; then
  exit 0
fi

INPUT=$(cat)

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

# Match: package-lock.json, npm-shrinkwrap.json (case-insensitive).
# pnpm-lock.yaml and yarn.lock are out-of-scope per ADR-0005 v1.3.5.
BASENAME=$(basename "$FILE_PATH")
case "$BASENAME" in
  package-lock.json|npm-shrinkwrap.json)
    ;;
  *)
    exit 0
    ;;
esac

# Find the project root that contains the lockfile (in case PROJECT_DIR differs)
LOCKFILE_DIR=$(dirname "$FILE_PATH")
[ -d "$LOCKFILE_DIR" ] || exit 0

# Locate dw binary — prefer local node_modules, fall back to global PATH
DW_BIN=""
if command -v dw >/dev/null 2>&1; then
  DW_BIN="dw"
elif [ -f "$PROJECT_DIR/bin/dw.mjs" ]; then
  DW_BIN="node $PROJECT_DIR/bin/dw.mjs"
else
  exit 0
fi

START_TS=$(date +%s%N 2>/dev/null || date +%s)

# Pillar 3 (ADR-0006): heuristic-only mode probes ONLY the NEW/bumped packages
# from the lockfile diff against npm registry metadata. Cached 1h per package
# so repeat edits hit cache. This is the AI-Native moat — catches zero-day-ish
# at the edit boundary, before OSV indexes and before any TL fixture bump.
set +e
SCAN_OUTPUT=$(cd "$LOCKFILE_DIR" && $DW_BIN security-scan --heuristic-only 2>&1)
SCAN_EXIT=$?
set -e

END_TS=$(date +%s%N 2>/dev/null || date +%s)
LATENCY_MS=$(( (END_TS - START_TS) / 1000000 ))

case "$SCAN_EXIT" in
  0)
    # Clean — silent unless verbose
    if [ "${DW_SC_GUARD_VERBOSE:-}" = "1" ]; then
      echo "✓ supply-chain-scan: clean (no heuristic flags on NEW/bumped packages in $BASENAME)" >&2
    fi
    ;;
  1)
    # Mid-risk heuristic flags — warn, do not block
    echo "" >&2
    echo "⚠  supply-chain-scan: heuristic flags on NEW/bumped packages in $BASENAME" >&2
    echo "$SCAN_OUTPUT" | tail -30 >&2
    echo "   (advisory — not blocking; run \`dw security-scan\` for full pillar 1+2+3 report)" >&2
    ;;
  2)
    # HIGH-risk heuristic flag (score ≥80) — loud warning, still non-blocking
    echo "" >&2
    echo "⚠  supply-chain-scan: HIGH-RISK heuristic flag on NEW/bumped package in $BASENAME" >&2
    echo "$SCAN_OUTPUT" | tail -40 >&2
    echo "   ADVISORY ONLY — review before commit. Public sunset review 2026-08-12 (ADR-0005)." >&2
    ;;
  *)
    # Setup error (no lockfile, network failure) — quiet hint
    if [ "${DW_SC_GUARD_VERBOSE:-}" = "1" ]; then
      echo "supply-chain-scan: heuristic check skipped or errored — run \`dw security-scan\` manually" >&2
    fi
    ;;
esac

exit 0
