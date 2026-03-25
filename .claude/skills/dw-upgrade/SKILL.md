---
name: dw-upgrade
description: "Upgrade dv-workflow-kit lên version mới. So sánh toolkit files, báo cáo thay đổi, cho phép selective update mà không overwrite customizations."
argument-hint: ""
---

# Upgrade dv-workflow-kit

## Điều Kiện tiên quyết

Toolkit được cài theo luồng chuẩn v1 trong project hiện tại (thường là `npm install -g dw-kit` + `dw init`).
Các tùy chỉnh của team được đặt tại:
- overrides: `.dw/adapters/claude-cli/overrides/`
- extensions (skills mới): `.dw/adapters/claude-cli/extensions/`

## Bước 1: Preview upgrade (khuyến nghị)

```bash
dw upgrade --check
dw upgrade --dry-run
```

## Bước 2: Backup config (tùy chọn nhưng nên làm)

```bash
cp .dw/config/dw.config.yml .dw/config/dw.config.yml.backup-$(date +%Y%m%d)
```

## Bước 3: Chạy upgrade

```bash
dw upgrade
```

`dw upgrade` sẽ update toolkit files theo version mới và **tôn trọng overrides** của team (không ghi đè override).

## Bước 4: Validate & health check

```bash
dw validate
dw doctor
```

## Bước 5: Báo cáo kết quả

```
=== Upgrade Report ===

Từ: [old version/commit]
Đến: [new version/commit]

Files mới (đã copy):
  + .claude/skills/dw-[new-skill]/SKILL.md
  + .claude/templates/en/task-context.md

Files đã thay đổi trong toolkit (KHÔNG tự động update vì bạn có thể đã customize):
  ~ .claude/skills/dw-task-init/SKILL.md   — xem diff: git diff .claude/skills/dw-task-init/SKILL.md
  ~ .claude/agents/planner.md

Files của bạn (giữ nguyên):
  = .dw/config/dw.config.yml  (backup tại .backup-[date])

Lưu ý:
  - Review các files "đã thay đổi" và merge thủ công nếu cần
  - Xem CHANGELOG của release (nếu cần) để biết breaking changes
  - Chạy /dw-config-validate sau khi upgrade để kiểm tra config
```

## Cleanup backup (tùy chọn)

Hỏi user: "Bạn có muốn xóa file backup config không? (y/n)"
Nếu y: `rm .dw/config/dw.config.yml.backup-*`
