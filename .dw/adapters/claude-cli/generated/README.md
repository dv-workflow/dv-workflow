# .dw/adapters/claude-cli/generated/

> **AUTO-GENERATED — Không edit tay.**
> Thư mục này được overwrite khi nâng cấp toolkit trong quá trình build/generation nội bộ.

## Nội dung

Chứa Claude Code-specific files được generate từ `core/` + `.dw/config/dw.config.yml`:

```
generated/
├── skills/          # Skill shell files (.claude/skills/ → populated từ đây)
├── agents/          # Agent files (.claude/agents/ → populated từ đây)
└── settings.json    # settings.json base template
```

## Cách hoạt động

`dw init`/`dw upgrade` → populate `.claude/`, áp dụng overrides từ `overrides/` (override thắng).

## Nếu muốn customize

Đặt file override vào `.dw/adapters/claude-cli/overrides/` — không edit tay ở đây.
