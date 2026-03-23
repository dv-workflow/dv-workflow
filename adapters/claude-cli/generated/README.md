# adapters/claude-cli/generated/

> **AUTO-GENERATED — Không edit tay.**
> Thư mục này được overwrite khi chạy `scripts/upgrade.sh` hoặc `setup.sh`.

## Nội dung

Chứa Claude Code-specific files được generate từ `core/` + `config/dw.config.yml`:

```
generated/
├── skills/          # Skill shell files (.claude/skills/ → populated từ đây)
├── agents/          # Agent files (.claude/agents/ → populated từ đây)
└── settings.json    # settings.json base template
```

## Cách hoạt động

`setup.sh` → copy `generated/` → `.claude/`, với overrides từ `overrides/` thắng.

## Nếu muốn customize

Đặt file override vào `adapters/claude-cli/overrides/` — không edit tay ở đây.
