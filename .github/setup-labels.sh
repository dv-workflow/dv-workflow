#!/usr/bin/env bash
# Tạo labels cho dw-kit-report trên GitHub repo
# Chạy 1 lần: bash .github/setup-labels.sh
# Yêu cầu: GitHub CLI (cli.github.com) đã auth — KHÔNG phải npm 'gh' package

REPO="dv-workflow/dv-workflow"

# Kiểm tra đúng tool
if ! gh --version 2>&1 | grep -q "^gh version"; then
  echo "ERROR: 'gh' tìm thấy nhưng là npm package, không phải GitHub CLI."
  echo "Cài GitHub CLI: https://cli.github.com"
  exit 1
fi

echo "Creating labels on $REPO..."

# Type labels
gh label create "type: bug"        --color "d73a4a" --description "Lỗi, crash, unexpected behavior"          --repo $REPO --force
gh label create "type: gap"        --color "0075ca" --description "Use case không được cover"                  --repo $REPO --force
gh label create "type: friction"   --color "e4e669" --description "Tính năng có nhưng gây overhead"           --repo $REPO --force
gh label create "type: suggestion" --color "a2eeef" --description "Ý tưởng cải thiện"                         --repo $REPO --force

# Component labels
gh label create "component: hooks"    --color "f9d0c4" --description "post-write, pre-commit, stop hooks"     --repo $REPO --force
gh label create "component: skills"   --color "f9d0c4" --description "Các /dw-* skills"                       --repo $REPO --force
gh label create "component: config"   --color "f9d0c4" --description "dw.config.yml"                          --repo $REPO --force
gh label create "component: workflow" --color "f9d0c4" --description "Routing, phases, depth"                 --repo $REPO --force
gh label create "component: docs"     --color "f9d0c4" --description "CLAUDE.md, templates"                   --repo $REPO --force
gh label create "component: core"     --color "f9d0c4" --description "WORKFLOW.md, THINKING.md"               --repo $REPO --force

# Status labels (dùng bởi /dw-kit-evolve)
gh label create "needs-evolve-review"  --color "fbca04" --description "Chờ /dw-kit-evolve xử lý"              --repo $REPO --force
gh label create "white-bot-proposed"   --color "0e8a16" --description "white-bot đã propose solution"         --repo $REPO --force
gh label create "black-bot-reviewed"   --color "b60205" --description "black-bot đã critique"                 --repo $REPO --force
gh label create "tl-review"            --color "6f42c1" --description "Chờ TechLead quyết định"               --repo $REPO --force

echo "Done. Labels created on $REPO"
