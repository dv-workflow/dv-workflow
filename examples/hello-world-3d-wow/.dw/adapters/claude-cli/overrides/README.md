# .dw/adapters/claude-cli/overrides/

> **TEAM CUSTOMIZATIONS — KHÔNG BAO GIỜ bị overwrite khi upgrade.**

## Mục đích

Đặt file override vào đây khi team muốn customize skill hoặc agent mà không mất khi upgrade toolkit.

## Cách dùng

Tạo file với đường dẫn tương tự `generated/`:

```
overrides/
├── skills/
│   └── plan/
│       └── SKILL.md      ← override generated/skills/plan/SKILL.md
└── agents/
    └── reviewer.md       ← override generated/agents/reviewer.md
```

Khi chạy `dw upgrade`, luồng sẽ:
1. Update `generated/` từ toolkit mới
2. Apply overrides từ thư mục này (overrides thắng generated)
3. Copy kết quả vào `.claude/`

## Khi nào nên override?

- Team có domain-specific review rules
- Team muốn thêm instruction vào planning workflow
- Team cần custom output format

## Khi nào dùng extensions/ thay vì overrides/?

Dùng `extensions/` cho skills net-new (không override gì trong generated).
