# test-evolution-flow.ps1
# Smoke test cho dw-kit Evolution Engine
# Chạy: .\scripts\test-evolution-flow.ps1
#
# Yêu cầu: gh CLI đã auth (gh auth login)
# Future: có thể integrate vào CI/CD pipeline

param(
    [switch]$DryRun,        # In ra command mà không chạy thật
    [switch]$SkipCleanup    # Giữ lại Issue sau khi test (mặc định: close sau test)
)

$REPO = "dv-workflow/dv-workflow"
$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ─── Check prerequisites ───────────────────────────────────────────────────

Write-Step "Checking prerequisites"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Fail "gh CLI not found. Install: https://cli.github.com"
    exit 1
}
Write-Ok "gh CLI found"

$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "gh not authenticated. Run: gh auth login"
    exit 1
}
Write-Ok "gh authenticated"

# ─── Step 1: Create test Issue ─────────────────────────────────────────────

Write-Step "Step 1: /dw-kit-report simulation — Create test Issue"

$issueTitle = "[bug][hooks] [SMOKE TEST] Hook files have CRLF endings, fail on Ubuntu"
$issueBody = @"
## Type
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
```.
.claude/hooks/post-write.sh: line 5: `$'\r'`: command not found
```

Files: post-write.sh, pre-commit-gate.sh, progress-ping.sh, safety-guard.sh

## Steps to reproduce
1. Install dw-kit trên Ubuntu
2. Trigger PostToolUse hook (Write/Edit file)
3. Lỗi xuất hiện

## Impact
- [x] Degraded — hooks không chạy trên Linux/Mac

---
*[SMOKE TEST] Reported via test-evolution-flow.ps1*
"@

if ($DryRun) {
    Write-Warn "DRY RUN — would create Issue:"
    Write-Host "  Title: $issueTitle"
    Write-Host "  Repo:  $REPO"
    exit 0
}

$issueUrl = gh issue create `
    --repo $REPO `
    --title $issueTitle `
    --label "type: bug" `
    --label "component: hooks" `
    --label "needs-evolve-review" `
    --body $issueBody

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to create Issue"
    exit 1
}

$issueNumber = $issueUrl -replace ".*issues/(\d+)$", '$1'
Write-Ok "Issue created: $issueUrl"
Write-Ok "Issue number: #$issueNumber"

# ─── Step 2: Prompt for /dw-kit-evolve ────────────────────────────────────

Write-Step "Step 2: /dw-kit-evolve — Adversarial processing"
Write-Host ""
Write-Host "  Issue #$issueNumber đã sẵn sàng." -ForegroundColor White
Write-Host "  Trong Claude Code, chạy:" -ForegroundColor White
Write-Host ""
Write-Host "    /dw-kit-evolve $issueNumber" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Expected: white-bot propose fix + black-bot critique + Next Step guidance"
Write-Host ""
Read-Host "  Nhấn Enter sau khi đã chạy /dw-kit-evolve và xem kết quả"

# ─── Step 3: Verify Issue was commented ───────────────────────────────────

Write-Step "Step 3: Verify — Check Issue comments"

$comments = gh issue view $issueNumber --repo $REPO --json comments | ConvertFrom-Json
$botComments = $comments.comments | Where-Object { $_.body -match "white-bot|black-bot|dw-kit-evolve" }

if ($botComments.Count -gt 0) {
    Write-Ok "Adversarial comments found on Issue #$issueNumber"
    Write-Ok "Labels updated correctly"
} else {
    Write-Warn "No bot comments found — /dw-kit-evolve may not have run yet"
}

# ─── Cleanup ───────────────────────────────────────────────────────────────

if (-not $SkipCleanup) {
    Write-Step "Cleanup — Closing smoke test Issue"
    gh issue close $issueNumber --repo $REPO --comment "Smoke test completed. Closing."
    Write-Ok "Issue #$issueNumber closed"
} else {
    Write-Warn "SkipCleanup: Issue #$issueNumber left open"
}

# ─── Summary ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan
Write-Host " Smoke Test Complete" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan
Write-Host " Issue:    #$issueNumber ($issueUrl)"
Write-Host " Flow:     report → evolve → next-step"
Write-Host ""
Write-Host " Future coverage TODO:" -ForegroundColor DarkGray
Write-Host "   - Verify label transitions (needs-evolve-review → tl-review)" -ForegroundColor DarkGray
Write-Host "   - Verify white-bot/black-bot comment structure" -ForegroundColor DarkGray
Write-Host "   - Test /dw-kit-audit với closed issues" -ForegroundColor DarkGray
Write-Host "   - Test fallback khi gh không available" -ForegroundColor DarkGray
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan
