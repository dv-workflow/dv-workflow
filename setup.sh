#!/bin/bash
# =============================================================================
# dv-workflow-kit — Interactive Setup Wizard
# =============================================================================
# Chạy từ root của dự án của bạn. Hỏi 4 câu, tự cấu hình mọi thứ.
# Thời gian: ~1-2 phút
#
# Usage:
#   bash .dv-workflow/setup.sh
#
# Silent mode (CI/scripted):
#   DW_NAME="my-app" DW_LEVEL=2 DW_ROLES="dev,techlead" DW_LANG="vi" \
#   bash .dv-workflow/setup.sh --silent
# =============================================================================

set -e

TOOLKIT_DIR=".dv-workflow"
SILENT="${1:-}"

# Detect python command (Windows: python, macOS/Linux: python3)
if command -v python3 &>/dev/null && python3 -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" 2>/dev/null; then
  PYTHON=python3
elif command -v python &>/dev/null && python -c "import sys; sys.exit(0 if sys.version_info[0]==3 else 1)" 2>/dev/null; then
  PYTHON=python
else
  echo "Lỗi: Cần Python 3 để chạy setup. Vui lòng cài đặt Python 3."
  exit 1
fi

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# Kiểm tra submodule
if [ ! -d "$TOOLKIT_DIR/.claude" ]; then
  echo "Toolkit chưa được add. Chạy trước:"
  echo "  git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow"
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
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/enterprise/dv-workflow.config.yml"
elif [ "$LEVEL" = "1" ]; then
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/old-maintenance/dv-workflow.config.yml"
else
  BASE_CONFIG="$TOOLKIT_DIR/project-templates/new-product/dv-workflow.config.yml"
fi

# Ghi config với giá trị user đã chọn
if [ ! -f "dv-workflow.config.yml" ]; then
  ROLES_YAML="  roles:\n    - dev"
  $HAS_TL && ROLES_YAML="$ROLES_YAML\n    - techlead"
  $HAS_BA && ROLES_YAML="$ROLES_YAML\n    - ba"
  $HAS_QC && ROLES_YAML="$ROLES_YAML\n    - qc"
  $HAS_PM && ROLES_YAML="$ROLES_YAML\n    - pm"

  sed \
    -e "s|name: \"your.*\"|name: \"$PROJECT_NAME\"|" \
    -e "s|name: \"your-enterprise-project\"|name: \"$PROJECT_NAME\"|" \
    -e "s|language: \"vi\"|language: \"$LANG\"|" \
    "$BASE_CONFIG" > "dv-workflow.config.yml"

  # Inject roles (replace toàn bộ roles section)
  $PYTHON - <<PYEOF
import re
with open('dv-workflow.config.yml') as f:
    content = f.read()

roles_block = 'team:\n  roles:\n    - dev'
if '$HAS_TL' == 'true': roles_block += '\n    - techlead'
if '$HAS_BA' == 'true': roles_block += '\n    - ba'
if '$HAS_QC' == 'true': roles_block += '\n    - qc'
if '$HAS_PM' == 'true': roles_block += '\n    - pm'

content = re.sub(r'team:\s*\n\s*roles:.*?(?=\n\w|\Z)', roles_block + '\n', content, flags=re.DOTALL)
with open('dv-workflow.config.yml', 'w') as f:
    f.write(content)
PYEOF
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

# Tạo runtime directories
mkdir -p .dev-tasks .dev-docs .dev-metrics .dev-reports

# Gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q ".dev-metrics" .gitignore; then
    printf "\n# dv-workflow-kit\n.dev-metrics/\n.dev-reports/\nCLAUDE.local.md\n" >> .gitignore
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
echo "    dv-workflow.config.yml"
echo "    CLAUDE.md"
echo "    .dev-tasks/  .dev-docs/  .dev-metrics/  .dev-reports/"
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
echo "  Docs: .dv-workflow/docs/README.md"
echo "  Cheatsheet: .dv-workflow/docs/cheatsheet.md"
echo ""
