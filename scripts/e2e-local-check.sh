#!/bin/bash
# scripts/e2e-local-check.sh
# End-to-end local publish check (pack -> install -> run CLI)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log()  { echo "  $*"; }
info() { echo ""; echo "▶ $*"; }
ok()   { echo "  ✓  $*"; }
warn() { echo "  ⚠  $*"; }

cleanup() {
  if [ -n "${TMP_DIR:-}" ] && [ -d "${TMP_DIR:-}" ]; then
    rm -rf "$TMP_DIR"
  fi
  if [ -n "${PACK_FILE:-}" ] && [ -f "${PACK_FILE:-}" ]; then
    rm -f "$PACK_FILE"
  fi
}
trap cleanup EXIT

info "Step 1: Run smoke tests"
npm test
ok "Smoke tests passed"

info "Step 2: Build npm package tarball"
PACK_OUTPUT="$(npm pack)"
PACK_FILE="$(echo "$PACK_OUTPUT" | tail -n 1 | tr -d '\r')"
if [ ! -f "$PACK_FILE" ]; then
  echo "  ✗  Failed to produce package tarball"
  exit 1
fi
ok "Tarball: $PACK_FILE"

info "Step 3: Create isolated test project"
TMP_DIR="$(mktemp -d 2>/dev/null || true)"
if [ -z "${TMP_DIR}" ]; then
  TMP_DIR=".tmp-e2e-local-check"
  rm -rf "$TMP_DIR"
  mkdir -p "$TMP_DIR"
fi
TEST_DIR="$TMP_DIR/e2e-project"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
npm init -y >/dev/null 2>&1
git init >/dev/null 2>&1 || true
ok "Created isolated project at $TEST_DIR"

info "Step 4: Install from local tarball"
npm install "$ROOT_DIR/$PACK_FILE" >/dev/null
ok "Installed package from tarball"

info "Step 5: Run CLI checks in isolated project"
VERSION_OUT="$(npx dw --version | tr -d '\r')"
log "dw --version: $VERSION_OUT"
npx dw init --preset small-team
npx dw validate
npx dw doctor
npx dw upgrade --check

info "Step 6: Verify task-depth override guidance artifacts"
grep -q "Task-Level Depth Override" ".dw/core/WORKFLOW.md"
grep -q "Depth Source: default (from config) | override (task-specific)" ".dw/core/templates/vi/task-context.md"
ok "Depth override guidance exists in generated artifacts"

ok "CLI flow passed in isolated project"

echo ""
echo "══════════════════════════════════════════"
echo "  E2E local check passed"
echo "══════════════════════════════════════════"
echo ""
