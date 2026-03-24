#!/bin/bash
# =============================================================================
# dw-kit — Interactive Setup Wizard (LEGACY)
# =============================================================================
# ⚠  DEPRECATED: Use `dw init` instead (npm install -g dw-kit)
#
#    npm install -g dw-kit
#    dw init
#
# This script is kept for environments without Node.js.
# New features will only be added to the `dw` CLI.
# =============================================================================
# Chạy từ root của dự án của bạn. Hỏi 4 câu, tự cấu hình mọi thứ.
# Thời gian: ~1-2 phút
#
# Usage:
#   bash .dw-module/setup.sh
#
# Silent mode (CI/scripted):
#   DW_NAME="my-app" DW_LEVEL=2 DW_ROLES="dev,techlead" DW_LANG="vi" \
#   bash .dw-module/setup.sh --silent
# =============================================================================

set -e

TOOLKIT_DIR=".dw-module"
SILENT="${1:-}"


CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# Kiểm tra submodule
if [ ! -d "$TOOLKIT_DIR/.claude" ]; then
  echo "Toolkit chưa được add. Chạy trước:"
  echo "  git submodule add https://github.com/dv-workflow/dv-workflow.git .dw-module"
  exit 1
fi

clear
echo -e "${CYAN}${BOLD}"
echo "  ██████╗ ██╗   ██╗    ██╗    ██╗ ██████╗ ██████╗ ██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗"
echo "  ██╔══██╗██║   ██║    ██║    ██║██╔═══██╗██╔══██╗██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║"
echo "  ██║  ██║██║   ██║    ██║ █╗ ██║██║   ██║██████╔╝█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║"
echo "  ██║  ██║╚██╗ ██╔╝    ██║███╗██║██║   ██║██╔══██╗██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║"
echo "  ██████╔╝ ╚████╔╝     ╚███╔███╔╝╚██████╔╝██║  ██║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝"
echo "  ╚═════╝   ╚═══╝       ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝"
echo -e "${NC}"
echo -e "${CYAN}  Setup Wizard v0.3  —  ~1 phút${NC}"
echo ""

# =============================================================================
# BƯỚC 1: Đọc từ env (silent mode) hoặc hỏi user (interactive mode)
# =============================================================================

if [ -n "$SILENT" ] && [ "$SILENT" = "--silent" ]; then
  # Silent mode: đọc từ environment variables
  PROJECT_NAME="${DW_NAME:-my-project}"
  LEVEL="${DW_LEVEL:-2}"
  ROLES_RAW="${DW_ROLES:-dev,techlead}"
  LANG="${DW_LANG:-vi}"
else
  # ---- Câu 1: Project name ----
  echo -e "${BOLD}[1/4] Tên project?${NC}"
  read -r -p "  > " PROJECT_NAME
  PROJECT_NAME="${PROJECT_NAME:-my-project}"
  echo ""

  # ---- Câu 2: Level ----
  echo -e "${BOLD}[2/4] Chọn level workflow:${NC}"
  echo "  1 = Lite      — research → execute → commit           (solo dev, hotfix nhanh)"
  echo "  2 = Standard  — research → plan → execute → review    (team, feature mới)  [default]"
  echo "  3 = Enterprise — full workflow + living docs + metrics (team lớn, audit trail)"
  read -r -p "  Level [1/2/3, Enter = 2]: " LEVEL
  LEVEL="${LEVEL:-2}"
  echo ""

  # ---- Câu 3: Roles ----
  echo -e "${BOLD}[3/4] Team có những roles nào? (Dev luôn được bật)${NC}"
  echo "  Nhập số cách nhau bởi dấu phẩy, hoặc Enter để chọn dev+techlead:"
  echo "  1 = Dev (luôn bật)"
  echo "  2 = Tech Lead  — architecture review, approve plans"
  echo "  3 = BA         — requirements, user stories"
  echo "  4 = QC         — test plans, bug reports"
  echo "  5 = PM         — dashboard, metrics"
  read -r -p "  Roles [1,2,...]: " ROLES_INPUT
  ROLES_INPUT="${ROLES_INPUT:-1,2}"
  echo ""

  # ---- Câu 4: Language ----
  echo -e "${BOLD}[4/4] Ngôn ngữ docs output?${NC}"
  echo "  vi = Tiếng Việt  [default]"
  echo "  en = English"
  read -r -p "  Language [vi/en]: " LANG
  LANG="${LANG:-vi}"
  echo ""
fi

# =============================================================================
# BUILD roles list từ input
# =============================================================================

build_roles() {
  local input="$1"
  local roles="    - dev"
  # Nếu input dạng "dev,techlead" (silent mode)
  if echo "$input" | grep -q "[a-z]"; then
    echo "$input" | tr ',' '\n' | while read -r r; do
      r=$(echo "$r" | tr -d ' ')
      [ "$r" != "dev" ] && echo "    - $r"
    done
    return
  fi
  # Nếu input dạng "1,2,3" (interactive mode)
  echo "$input" | tr ',' '\n' | while read -r n; do
    n=$(echo "$n" | tr -d ' ')
    case "$n" in
      2) echo "    - techlead" ;;
      3) echo "    - ba" ;;
      4) echo "    - qc" ;;
      5) echo "    - pm" ;;
    esac
  done
}

HAS_TL=false; HAS_BA=false; HAS_QC=false; HAS_PM=false

check_role() {
  local input="$1"
  if echo "$input" | grep -q "techlead\|,2\b\|^2\b"; then HAS_TL=true; fi
  if echo "$input" | grep -q "ba\b\|,3\b\|^3\b"; then HAS_BA=true; fi
  if echo "$input" | grep -q "qc\b\|,4\b\|^4\b"; then HAS_QC=true; fi
  if echo "$input" | grep -q "pm\b\|,5\b\|^5\b"; then HAS_PM=true; fi
}

ROLES_RAW="${ROLES_RAW:-$ROLES_INPUT}"
check_role "$ROLES_RAW"

# =============================================================================
# APPLY: Copy files + Write config
# =============================================================================

echo -e "${CYAN}Đang setup...${NC}"

# Copy .claude/
if [ -d ".claude" ]; then
  cp -rn "$TOOLKIT_DIR/.claude/skills"    ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/agents"    ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/rules"     ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/hooks"     ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/templates" ".claude/" 2>/dev/null || true
  [ ! -f ".claude/settings.json" ] && cp "$TOOLKIT_DIR/.claude/settings.json" ".claude/"
else
  cp -r "$TOOLKIT_DIR/.claude" "./"
fi

# Chọn base config theo level
if [ "$LEVEL" = "3" ]; then
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/enterprise/.dw/config/dw.config.yml"
elif [ "$LEVEL" = "1" ]; then
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/old-maintenance/.dw/config/dw.config.yml"
else
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/new-product/.dw/config/dw.config.yml"
fi

# Ghi config với giá trị user đã chọn
if [ ! -f ".dw/.dw/config/dw.config.yml" ]; then
  ROLES_YAML="  roles:\n    - dev"
  $HAS_TL && ROLES_YAML="$ROLES_YAML\n    - techlead"
  $HAS_BA && ROLES_YAML="$ROLES_YAML\n    - ba"
  $HAS_QC && ROLES_YAML="$ROLES_YAML\n    - qc"
  $HAS_PM && ROLES_YAML="$ROLES_YAML\n    - pm"

  sed \
    -e "s|name: \"your.*\"|name: \"$PROJECT_NAME\"|" \
    -e "s|name: \"your-enterprise-project\"|name: \"$PROJECT_NAME\"|" \
    -e "s|language: \"vi\"|language: \"$LANG\"|" \
    "$BASE_CONFIG" > ".dw/.dw/config/dw.config.yml"

  # Inject roles (replace toàn bộ roles section) — pure awk, no Python needed
  ROLES_LINES="    - dev"
  $HAS_TL && ROLES_LINES="${ROLES_LINES}|    - techlead"
  $HAS_BA && ROLES_LINES="${ROLES_LINES}|    - ba"
  $HAS_QC && ROLES_LINES="${ROLES_LINES}|    - qc"
  $HAS_PM && ROLES_LINES="${ROLES_LINES}|    - pm"

  awk -v roles="$ROLES_LINES" '
    /^  roles:/ {
      print "  roles:"
      n = split(roles, a, "|")
      for (i = 1; i <= n; i++) print a[i]
      in_roles = 1; next
    }
    in_roles && /^    -/ { next }
    { in_roles = 0; print }
  ' config/dw.config.yml > config/dw.config.yml.tmp \
    && mv config/dw.config.yml.tmp config/dw.config.yml
fi

# Tạo CLAUDE.md
if [ ! -f "CLAUDE.md" ]; then
  cp "$TOOLKIT_DIR/CLAUDE.md" .
  cat >> CLAUDE.md << 'SECTION'

---

## Tech Stack

<!-- Cập nhật phần này với stack thực tế của project -->
- Framework: [e.g. NestJS / Django / Laravel / Next.js]
- Database: [e.g. PostgreSQL / MySQL / MongoDB]
- Testing: [e.g. Jest / Pytest / PHPUnit]

## Project-Specific Rules

<!-- Thêm rules đặc thù của project -->
- [Rule 1]
SECTION
fi

# Tạo runtime directories (gom vào .dw/ để không pollute root)
mkdir -p .dw/tasks .dw/docs .dw/metrics .dw/reports

# =============================================================================
# V2: Generate config/dw.config.yml và settings.json từ MCP config
# =============================================================================

# Copy config mới nếu chưa có (v1 structure)
if [ ! -f ".dw/.dw/config/dw.config.yml" ] && [ -f "$TOOLKIT_DIR/.dw/config/dw.config.yml" ]; then
  mkdir -p config/presets
  cp "$TOOLKIT_DIR/.dw/config/dw.config.yml" ".dw/.dw/config/dw.config.yml"
  cp "$TOOLKIT_DIR/config/config.schema.json" ".dw/config/config.schema.json" 2>/dev/null || true
  cp "$TOOLKIT_DIR/config/presets/"* "config/presets/" 2>/dev/null || true
fi

# Generate settings.json từ claude.mcp config (nếu có python3 + có mcp config)
generate_mcp_settings() {
  local config_file="${1:-config/dw.config.yml}"
  [ ! -f "$config_file" ] && return 0
  [ ! -f ".claude/settings.json" ] && return 0
  command -v python3 &>/dev/null || return 0

  python3 - "$config_file" ".claude/settings.json" <<'PYEOF' 2>/dev/null || true
import sys, json, re

config_path   = sys.argv[1]
settings_path = sys.argv[2]

with open(config_path) as f:
    content = f.read()

# Extract MCP servers từ YAML (simple parser — không cần PyYAML)
mcp_servers = {}
in_mcp = False
current_server = None

for line in content.split('\n'):
    stripped = line.rstrip()
    # Detect mcp: block
    if re.match(r'\s*mcp:\s*$', stripped):
        in_mcp = True
        continue
    if in_mcp:
        # New top-level key = end of mcp block
        if re.match(r'^[a-z_]', stripped) or re.match(r'^_toolkit', stripped):
            in_mcp = False
            continue
        # Server entry: - name: "..."
        m = re.match(r'\s*-\s*name:\s*["\']?([^"\']+)["\']?', stripped)
        if m:
            current_server = m.group(1).strip()
            mcp_servers[current_server] = {}
            continue
        if current_server:
            # command:
            m = re.match(r'\s+command:\s*["\']?([^"\']+)["\']?', stripped)
            if m:
                mcp_servers[current_server]['command'] = m.group(1).strip()
            # args: (array — simplified)
            m = re.match(r'\s+args:\s*\[([^\]]*)\]', stripped)
            if m:
                args = [a.strip().strip('"').strip("'") for a in m.group(1).split(',') if a.strip()]
                mcp_servers[current_server]['args'] = args

if not mcp_servers:
    sys.exit(0)

# Update settings.json
with open(settings_path) as f:
    settings = json.load(f)

settings['mcpServers'] = {}
for name, server in mcp_servers.items():
    settings['mcpServers'][name] = {
        'command': server.get('command', ''),
        'args': server.get('args', [])
    }

with open(settings_path, 'w') as f:
    json.dump(settings, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f"  MCP servers configured: {', '.join(mcp_servers.keys())}")
PYEOF
}

generate_mcp_settings ".dw/.dw/config/dw.config.yml"

# Validate config nếu có python3 và jsonschema
if command -v python3 &>/dev/null && [ -f ".dw/.dw/config/dw.config.yml" ] && [ -f ".dw/config/config.schema.json" ]; then
  python3 -c "import jsonschema" 2>/dev/null && \
  python3 - ".dw/.dw/config/dw.config.yml" ".dw/config/config.schema.json" <<'PYEOF' 2>/dev/null || true
import sys, json
try:
    import yaml
    with open(sys.argv[1]) as f:
        config = yaml.safe_load(f)
    import jsonschema
    with open(sys.argv[2]) as f:
        schema = json.load(f)
    jsonschema.validate(config, schema)
    print("  config/dw.config.yml: valid")
except jsonschema.ValidationError as e:
    print(f"  ⚠  Config validation warning: {e.message}")
except Exception:
    pass
PYEOF
fi

# Gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q ".dw/metrics" .gitignore; then
    printf "\n# dw-kit\n.dw/metrics/\n.dw/reports/\nCLAUDE.local.md\n" >> .gitignore
  fi
else
  cp "$TOOLKIT_DIR/.gitignore" .
fi

# =============================================================================
# SUMMARY
# =============================================================================

clear
echo -e "${GREEN}${BOLD}"
echo "  ✅  Setup hoàn tất!"
echo -e "${NC}"
echo "  Project : $PROJECT_NAME"
echo "  Level   : $LEVEL  $([ "$LEVEL" = "1" ] && echo "(Lite)" || ([ "$LEVEL" = "2" ] && echo "(Standard)" || echo "(Enterprise — Level 3 beta)"))"
echo "  Language: $LANG"
printf "  Roles   : dev"
$HAS_TL && printf ", techlead"
$HAS_BA && printf ", ba"
$HAS_QC && printf ", qc"
$HAS_PM && printf ", pm"
echo ""
echo ""
echo "  Files tạo:"
echo "    .claude/          — 22 skills, agents, rules, hooks, templates"
echo "    config/dw.config.yml"
echo "    CLAUDE.md"
echo "    .dw/tasks/  .dw/docs/  .dw/metrics/  .dw/reports/"
echo ""
echo -e "${CYAN}  Skills đã bật:${NC}"
echo "    /dw-task-init  /dw-research  /dw-execute  /dw-commit  /dw-debug  /dw-handoff"
[ "$LEVEL" -ge 2 ] && echo "    /dw-plan  /dw-review  /dw-estimate  /dw-log-work"
[ "$LEVEL" -ge 3 ] && echo "    /dw-docs-update  /dw-dashboard  /dw-sprint-review"
$HAS_TL && echo "    /dw-arch-review  (Tech Lead)"
$HAS_BA && echo "    /dw-requirements  (BA)"
$HAS_QC && echo "    /dw-test-plan  (QC)"
$HAS_PM && echo "    /dw-dashboard  (PM)"
echo ""
echo -e "${YELLOW}  Bước tiếp theo:${NC}"
echo "  1. Mở Claude Code trong thư mục này"
echo "  2. Cập nhật Tech Stack trong CLAUDE.md (tuỳ chọn nhưng nên làm)"
echo "  3. Chạy: /dw-task-init [tên-feature-đầu-tiên]"
echo ""
echo "  Docs: .dw-module/docs/README.md"
echo "  Cheatsheet: .dw-module/docs/cheatsheet.md"
echo ""
