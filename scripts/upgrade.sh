#!/bin/bash
# scripts/upgrade.sh
# ⚠ DEPRECATED: Prefer `dw upgrade` from npm CLI.
# Upgrade dw-kit: update generated/ files, preserve overrides/ và extensions/
# Usage: bash scripts/upgrade.sh [--dry-run] [--layer core|platform|all]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Options ──────────────────────────────────────────────────────────────────
DRY_RUN=false
LAYER="all"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --layer) shift; LAYER="${1:-all}" ;;
    --layer=*) LAYER="${arg#*=}" ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "  $*"; }
info() { echo ""; echo "▶ $*"; }
warn() { echo "  ⚠  $*"; }
ok()   { echo "  ✓  $*"; }
dry()  { echo "  [dry-run] $*"; }

do_copy() {
  local src="$1" dst="$2"
  if [ "$DRY_RUN" = true ]; then
    dry "cp $src → $dst"
  else
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
  fi
}

do_mkdir() {
  if [ "$DRY_RUN" = true ]; then
    dry "mkdir -p $1"
  else
    mkdir -p "$1"
  fi
}

# ── Read current versions ─────────────────────────────────────────────────────
CONFIG_FILE="$PROJECT_ROOT/.dw/config/dw.config.yml"
CURRENT_CORE="unknown"
CURRENT_PLATFORM="unknown"

if [ -f "$CONFIG_FILE" ]; then
  CURRENT_CORE=$(grep -m1 "core_version:" "$CONFIG_FILE" 2>/dev/null \
    | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d "'" | tr -d '[:space:]' || echo "unknown")
  CURRENT_PLATFORM=$(grep -m1 "platform_version:" "$CONFIG_FILE" 2>/dev/null \
    | sed 's/.*:[[:space:]]*//' | tr -d '"' | tr -d "'" | tr -d '[:space:]' || echo "unknown")
fi

TOOLKIT_CORE=$(grep -m1 "core-version:" "$PROJECT_ROOT/core/WORKFLOW.md" 2>/dev/null \
  | sed 's/.*core-version:[[:space:]]*//' | tr -d ' -->' | head -1 || echo "1.0")

echo ""
echo "══════════════════════════════════════════"
echo "  dw-kit Upgrade"
echo "  Current: core=$CURRENT_CORE platform=$CURRENT_PLATFORM"
echo "  Toolkit: core=$TOOLKIT_CORE"
if [ "$DRY_RUN" = true ]; then
  echo "  Mode: DRY RUN (no changes)"
fi
echo "══════════════════════════════════════════"

# ── Phase 1: Update generated/ ───────────────────────────────────────────────
info "Phase 1: Update generated files"

GENERATED="$PROJECT_ROOT/.dw/adapters/claude-cli/generated"
CLAUDE_DIR="$PROJECT_ROOT/.claude"

if [ "$LAYER" = "all" ] || [ "$LAYER" = "platform" ]; then
  # Copy generated skills → .claude/skills (skip if override exists)
  if [ -d "$GENERATED/skills" ]; then
    for skill_dir in "$GENERATED/skills"/*/; do
      skill_name=$(basename "$skill_dir")
      override="$PROJECT_ROOT/.dw/adapters/claude-cli/overrides/skills/$skill_name"

      if [ -d "$override" ]; then
        warn "Skill '$skill_name': override exists → keeping override"
        # Copy override instead of generated
        for f in "$override"/*; do
          [ -f "$f" ] && do_copy "$f" "$CLAUDE_DIR/skills/$skill_name/$(basename "$f")"
        done
      else
        for f in "$skill_dir"*; do
          [ -f "$f" ] && do_copy "$f" "$CLAUDE_DIR/skills/$skill_name/$(basename "$f")"
        done
        ok "Skill '$skill_name': updated"
      fi
    done
  fi

  # Copy generated agents → .claude/agents (skip if override exists)
  if [ -d "$GENERATED/agents" ]; then
    for agent_file in "$GENERATED/agents"/*.md; do
      [ -f "$agent_file" ] || continue
      agent_name=$(basename "$agent_file")
      override="$PROJECT_ROOT/.dw/adapters/claude-cli/overrides/agents/$agent_name"

      if [ -f "$override" ]; then
        warn "Agent '$agent_name': override exists → keeping override"
        do_copy "$override" "$CLAUDE_DIR/agents/$agent_name"
      else
        do_copy "$agent_file" "$CLAUDE_DIR/agents/$agent_name"
        ok "Agent '$agent_name': updated"
      fi
    done
  fi
fi

# ── Phase 2: Copy extensions/ ────────────────────────────────────────────────
info "Phase 2: Copy extensions (team-specific skills)"

EXTENSIONS="$PROJECT_ROOT/.dw/adapters/claude-cli/extensions"
if [ -d "$EXTENSIONS" ]; then
  ext_count=0
  for ext_dir in "$EXTENSIONS"/*/; do
    [ -d "$ext_dir" ] || continue
    ext_name=$(basename "$ext_dir")
    [ "$ext_name" = ".gitkeep" ] && continue

    do_mkdir "$CLAUDE_DIR/skills/$ext_name"
    for f in "$ext_dir"*; do
      [ -f "$f" ] && do_copy "$f" "$CLAUDE_DIR/skills/$ext_name/$(basename "$f")"
    done
    ok "Extension '$ext_name': installed"
    ext_count=$((ext_count + 1))
  done
  [ $ext_count -eq 0 ] && log "No extensions found"
fi

# ── Phase 3: Merge settings.json ─────────────────────────────────────────────
info "Phase 3: Merge settings.json"

SETTINGS_TEMPLATE="$GENERATED/settings.json"
SETTINGS_TARGET="$CLAUDE_DIR/settings.json"

if [ -f "$SETTINGS_TEMPLATE" ] && [ -f "$SETTINGS_TARGET" ]; then
  if command -v python3 &>/dev/null; then
    if [ "$DRY_RUN" = true ]; then
      dry "Merge settings.json (python3)"
    else
      python3 - "$SETTINGS_TEMPLATE" "$SETTINGS_TARGET" <<'PYEOF'
import json, sys

template_path = sys.argv[1]
target_path   = sys.argv[2]

with open(template_path) as f:
    template = json.load(f)
with open(target_path) as f:
    target = json.load(f)

def deep_merge(base, override):
    """Override values from base with override, but preserve keys not in template."""
    result = dict(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result

merged = deep_merge(template, target)

with open(target_path, 'w') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)
    f.write('\n')
PYEOF
      ok "settings.json: merged"
    fi
  else
    warn "python3 not found — skipping settings.json merge. Manual merge may be needed."
  fi
elif [ -f "$SETTINGS_TEMPLATE" ] && [ ! -f "$SETTINGS_TARGET" ]; then
  do_copy "$SETTINGS_TEMPLATE" "$SETTINGS_TARGET"
  ok "settings.json: created from template"
fi

# ── Phase 4: Update version in config ────────────────────────────────────────
info "Phase 4: Update version tracking"

if [ "$DRY_RUN" = false ] && [ -f "$CONFIG_FILE" ]; then
  TODAY=$(date +%Y-%m-%d)
  if command -v python3 &>/dev/null; then
    python3 - "$CONFIG_FILE" "$TOOLKIT_CORE" "$TODAY" <<'PYEOF'
import sys, re

config_path = sys.argv[1]
new_core    = sys.argv[2]
today       = sys.argv[3]

with open(config_path) as f:
    content = f.read()

content = re.sub(r'(core_version:\s*)["\']?[\d.]+["\']?', f'\\g<1>"{new_core}"', content)
content = re.sub(r'(last_upgrade:\s*)["\']?[\d-]+["\']?', f'\\g<1>"{today}"', content)

with open(config_path, 'w') as f:
    f.write(content)
PYEOF
    ok "Config version updated: core=$TOOLKIT_CORE, last_upgrade=$TODAY"
  fi
fi

# ── Phase 5: Check for CI/CD references needing manual update ────────────────
info "Phase 5: Check backward compatibility"

OLD_CONFIG="$PROJECT_ROOT/.dw/config/dw.config.yml"
if [ -f "$OLD_CONFIG" ]; then
  if [ -L "$OLD_CONFIG" ]; then
    ok "config/dw.config.yml: symlink intact (backward compat)"
  else
    warn "config/dw.config.yml exists as real file. Run scripts/migrate-v03-to-v1.sh first."
  fi
fi

# Check for CI references
for ci_file in ".github/workflows/"*.yml ".gitlab-ci.yml" "Makefile" ".circleci/config.yml"; do
  full_path="$PROJECT_ROOT/$ci_file"
  if [ -f "$full_path" ] && grep -q ".dw/.dw/config/dw.config.yml" "$full_path" 2>/dev/null; then
    warn "CI file '$ci_file' references config/dw.config.yml — update manually"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
  echo "  DRY RUN complete. No changes made."
  echo "  Run without --dry-run to apply."
else
  echo "  Upgrade complete!"
  echo "  Core version: $TOOLKIT_CORE"
fi
echo "══════════════════════════════════════════"
echo ""
