---
name: dw-upgrade
description: "Upgrade dv-workflow-kit lên version mới. So sánh toolkit files, báo cáo thay đổi, cho phép selective update mà không overwrite customizations."
argument-hint: ""
---

# Upgrade dv-workflow-kit

## Điều Kiện Tiên Quyết

Skill này yêu cầu toolkit được cài qua git submodule tại `.dw-module/`.

## Bước 1: Kiểm tra setup

Kiểm tra `.dw-module/` có tồn tại và là git repo:
```bash
ls .dw-module/.git
```

Nếu không có → thông báo: "Toolkit chưa được cài dạng git submodule. Xem `examples/integration-guide/README.md`."

## Bước 2: Pull version mới nhất

```bash
cd .dv-workflow && git fetch origin && git log origin/main --oneline -5
```

Hiển thị 5 commits mới nhất của upstream để user biết có gì thay đổi.

## Bước 3: Backup config

Trước khi update, backup config hiện tại:
```bash
cp .dw/config/dw.config.yml .dw/config/dw.config.yml.backup-$(date +%Y%m%d)
```

Thông báo: "Config đã backup tại `.dw/config/dw.config.yml.backup-[date]`"

## Bước 4: Update submodule

```bash
cd .dv-workflow && git pull origin main
```

## Bước 5: So sánh và update files

Chạy setup script với mode update (không overwrite):
```bash
bash .dw-module/examples/integration-guide/setup.sh
```

Script dùng `cp -n` (no-clobber) — chỉ copy files MỚI, không overwrite files đã customize.

## Bước 6: Báo cáo kết quả

```
=== Upgrade Report ===

Từ: [old version/commit]
Đến: [new version/commit]

Files mới (đã copy):
  + .claude/skills/dw-[new-skill]/SKILL.md
  + .claude/templates/en/task-context.md

Files đã thay đổi trong toolkit (KHÔNG tự động update vì bạn có thể đã customize):
  ~ .claude/skills/dw-task-init/SKILL.md   — xem diff: git diff .dw-module/.claude/skills/dw-task-init/SKILL.md
  ~ .claude/agents/planner.md

Files của bạn (giữ nguyên):
  = .dw/config/dw.config.yml  (backup tại .backup-[date])

Lưu ý:
  - Review các files "đã thay đổi" và merge thủ công nếu cần
  - Xem CHANGELOG tại .dw-module/CHANGELOG.md để biết breaking changes
  - Chạy /dw-config-validate sau khi upgrade để kiểm tra config
```

## Bước 7: Cleanup backup (tùy chọn)

Hỏi user: "Bạn có muốn xóa file backup config không? (y/n)"
Nếu y: `rm .dw/config/dw.config.yml.backup-*`
