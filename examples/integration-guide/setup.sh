#!/bin/bash
# =============================================================================
# dv-workflow-kit — Setup Script (Git Submodule approach)
# =============================================================================
# Chạy script này từ root của dự án THỰC của bạn (không phải từ toolkit).
#
# Usage:
#   bash .dv-workflow/integration-guide/setup.sh [project-type]
#
# project-type: new-product | old-maintenance (mặc định: new-product)
# =============================================================================

set -e

TOOLKIT_DIR=".dv-workflow"
PROJECT_TYPE="${1:-new-product}"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}=== dv-workflow-kit Setup ===${NC}"
echo "Project type: $PROJECT_TYPE"
echo ""

# 1. Kiểm tra submodule tồn tại
if [ ! -d "$TOOLKIT_DIR/.claude" ]; then
  echo -e "${YELLOW}⚠️  Toolkit chưa được add làm submodule.${NC}"
  echo "Chạy: git submodule add https://github.com/dv-workflow/dv-workflow.git .dv-workflow"
  exit 1
fi

# 2. Copy .claude/ vào project (không symlink để dễ customize)
echo "📁 Copying .claude/ ..."
if [ -d ".claude" ]; then
  echo -e "${YELLOW}   .claude/ đã tồn tại — merge (không overwrite files đã có)${NC}"
  cp -rn "$TOOLKIT_DIR/.claude/skills" ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/agents" ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/rules" ".claude/" 2>/dev/null || true
  cp -rn "$TOOLKIT_DIR/.claude/hooks" ".claude/" 2>/dev/null || true
  # settings.json merge thủ công để tránh overwrite
  if [ ! -f ".claude/settings.json" ]; then
    cp "$TOOLKIT_DIR/.claude/settings.json" ".claude/"
  else
    echo -e "${YELLOW}   .claude/settings.json đã tồn tại — skip. Merge thủ công nếu cần.${NC}"
  fi
else
  cp -r "$TOOLKIT_DIR/.claude" "./"
fi

# 3. Copy skills/THINKING.md
echo "🧠 Copying skills/THINKING.md ..."
mkdir -p skills
cp -n "$TOOLKIT_DIR/skills/THINKING.md" "skills/" 2>/dev/null || \
  echo -e "${YELLOW}   skills/THINKING.md đã tồn tại — skip${NC}"

# 4. Copy templates/
echo "📄 Copying templates/ ..."
mkdir -p templates
cp -rn "$TOOLKIT_DIR/templates/"* "templates/" 2>/dev/null || true

# 5. Tạo dv-workflow.config.yml từ template
if [ ! -f "dv-workflow.config.yml" ]; then
  echo "⚙️  Tạo dv-workflow.config.yml ($PROJECT_TYPE template) ..."
  cp "$TOOLKIT_DIR/project-templates/$PROJECT_TYPE/dv-workflow.config.yml" .
  echo -e "${YELLOW}   → Mở dv-workflow.config.yml và cập nhật project.name, team.roles${NC}"
else
  echo -e "${YELLOW}   dv-workflow.config.yml đã tồn tại — skip${NC}"
fi

# 6. Tạo CLAUDE.md nếu chưa có
if [ ! -f "CLAUDE.md" ]; then
  echo "📋 Tạo CLAUDE.md ..."
  cp "$TOOLKIT_DIR/CLAUDE.md" .
  echo -e "${YELLOW}   → Cập nhật CLAUDE.md với project-specific rules${NC}"
else
  echo -e "${YELLOW}   CLAUDE.md đã tồn tại — skip. Xem $TOOLKIT_DIR/CLAUDE.md để tham khảo${NC}"
fi

# 7. Tạo thư mục runtime
echo "📂 Tạo runtime directories ..."
mkdir -p .dev-tasks .dev-docs .dev-metrics .dev-reports

# 8. Thêm vào .gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q ".dev-metrics" .gitignore; then
    echo "" >> .gitignore
    echo "# dv-workflow-kit runtime" >> .gitignore
    echo ".dev-metrics/" >> .gitignore
    echo ".dev-reports/" >> .gitignore
    echo "CLAUDE.local.md" >> .gitignore
    echo "Added .gitignore entries"
  fi
else
  cp "$TOOLKIT_DIR/.gitignore" .
fi

echo ""
echo -e "${GREEN}✅ Setup hoàn tất!${NC}"
echo ""
echo "Bước tiếp theo:"
echo "  1. Cập nhật project.name trong dv-workflow.config.yml"
echo "  2. Bật/tắt flags và roles theo team thực tế"
echo "  3. Chạy Claude Code trong project của bạn"
echo "  4. Bắt đầu với: /config-init [tên-project]"
echo ""
echo "Docs: $TOOLKIT_DIR/docs/README.md"
