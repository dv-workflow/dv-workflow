#!/usr/bin/env bash
# test-evolution-flow.sh
# Smoke test cho dw-kit Evolution Engine
# Chạy: bash scripts/test-evolution-flow.sh
#
# Yêu cầu: gh CLI đã auth (gh auth login)
# Options:
#   --dry-run      In ra command mà không chạy thật
#   --skip-cleanup Giữ lại Issue sau khi test

set -e

REPO="dv-workflow/dv-workflow"
DRY_RUN=false
SKIP_CLEANUP=false

for arg in "$@"; do
  case $arg in
    --dry-run)      DRY_RUN=true ;;
    --skip-cleanup) SKIP_CLEANUP=true ;;
  esac
done

# ─── Colors ────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

step() { echo -e "\n${CYAN}==> $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

# ─── Check prerequisites ───────────────────────────────────────────────────

step "Checking prerequisites"

command -v gh >/dev/null 2>&1 || fail "gh CLI not found. Install: https://cli.github.com"

# Phân biệt GitHub CLI (cli.github.com) vs npm 'gh' package (khác nhau hoàn toàn)
if ! gh --version 2>&1 | grep -q "^gh version"; then
  fail "'gh' tìm thấy nhưng là npm package, không phải GitHub CLI.
       Cài GitHub CLI từ: https://cli.github.com
       (npm 'gh' là tool khác, không tương thích)"
fi
ok "GitHub CLI found ($(gh --version | head -1))"

gh auth status >/dev/null 2>&1 || fail "gh not authenticated. Run: gh auth login"
ok "gh authenticated"

# ─── Step 1: Create test Issue ─────────────────────────────────────────────

step "Step 1: /dw-kit-report simulation — Create test Issue"

ISSUE_TITLE="[bug][hooks] [SMOKE TEST] Hook files have CRLF endings, fail on Ubuntu"
ISSUE_BODY='## Type
**bug**

## Component
**hooks**

## Environment
- OS: Ubuntu 22.04 (simulated smoke test)
- dw version: 1.0
- Shell: bash

## Description
Smoke test cho dw Evolution Engine.

Tất cả hook files trong `.claude/hooks/` có CRLF line endings.
Khi chạy trên Ubuntu/Linux:

```
.claude/hooks/post-write.sh: line 5: $'"'"'\r'"'"': command not found
```

Files: post-write.sh, pre-commit-gate.sh, progress-ping.sh, safety-guard.sh

## Steps to reproduce
1. Install dw-kit trên Ubuntu
2. Trigger PostToolUse hook (Write/Edit file)
3. Lỗi xuất hiện

## Impact
- [x] Degraded — hooks không chạy trên Linux/Mac

---
*[SMOKE TEST] Reported via test-evolution-flow.sh*'

if [ "$DRY_RUN" = true ]; then
  warn "DRY RUN — would create Issue:"
  echo "  Title: $ISSUE_TITLE"
  echo "  Repo:  $REPO"
  exit 0
fi

# Tạo labels nếu chưa có (idempotent)
step "Creating labels if missing"
gh label create "type: bug"           --color "d73a4a" --repo "$REPO" --force 2>/dev/null && ok "type: bug" || true
gh label create "component: hooks"    --color "f9d0c4" --repo "$REPO" --force 2>/dev/null && ok "component: hooks" || true
gh label create "needs-evolve-review" --color "fbca04" --repo "$REPO" --force 2>/dev/null && ok "needs-evolve-review" || true

ISSUE_URL=$(gh issue create \
  --repo "$REPO" \
  --title "$ISSUE_TITLE" \
  --label "type: bug" \
  --label "component: hooks" \
  --label "needs-evolve-review" \
  --body "$ISSUE_BODY")

ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
ok "Issue created: $ISSUE_URL"
ok "Issue number: #$ISSUE_NUMBER"

# ─── Step 2: Prompt for /dw-kit-evolve ────────────────────────────────────

step "Step 2: /dw-kit-evolve — Adversarial processing"
echo ""
echo "  Issue #$ISSUE_NUMBER đã sẵn sàng."
echo -e "  Trong Claude Code, chạy:\n"
echo -e "    ${YELLOW}/dw-kit-evolve $ISSUE_NUMBER${NC}\n"
echo "  Expected: white-bot propose + black-bot critique + Next Step guidance"
echo ""
read -r -p "  Nhấn Enter sau khi đã chạy /dw-kit-evolve và xem kết quả..."

# ─── Step 3: Verify Issue was commented ───────────────────────────────────

step "Step 3: Verify — Check Issue comments"

COMMENT_COUNT=$(gh issue view "$ISSUE_NUMBER" \
  --repo "$REPO" \
  --json comments \
  --jq '[.comments[].body | select(test("white-bot|black-bot|dw-kit-evolve"))] | length')

if [ "$COMMENT_COUNT" -gt 0 ]; then
  ok "Adversarial comments found on Issue #$ISSUE_NUMBER ($COMMENT_COUNT comment(s))"
else
  warn "No bot comments found — /dw-kit-evolve may not have run yet"
fi

# ─── Cleanup ───────────────────────────────────────────────────────────────

if [ "$SKIP_CLEANUP" = false ]; then
  step "Cleanup — Closing smoke test Issue"
  gh issue close "$ISSUE_NUMBER" --repo "$REPO" --comment "Smoke test completed. Closing."
  ok "Issue #$ISSUE_NUMBER closed"
else
  warn "skip-cleanup: Issue #$ISSUE_NUMBER left open"
fi

# ─── Summary ───────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}─────────────────────────────────────${NC}"
echo -e "${CYAN} Smoke Test Complete${NC}"
echo -e "${CYAN}─────────────────────────────────────${NC}"
echo "  Issue:  #$ISSUE_NUMBER ($ISSUE_URL)"
echo "  Flow:   report → evolve → next-step"
echo ""
echo -e "${GRAY}  Future coverage TODO:"
echo "    - Verify label transitions (needs-evolve-review → tl-review)"
echo "    - Verify white-bot/black-bot comment structure"
echo "    - Test /dw-kit-audit với closed issues"
echo -e "    - Test fallback khi gh không available${NC}"
echo -e "${CYAN}─────────────────────────────────────${NC}"
