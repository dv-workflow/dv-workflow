# .dw/adapters/claude-cli/extensions/

> **NET-NEW TEAM SKILLS — Không conflict với generated, không bị overwrite.**

## Mục đích

Thêm skills hoàn toàn mới mà không có trong dw-kit core.

## Cách dùng

```
extensions/
└── dw-deploy/
    ├── SKILL.md        ← skill definition
    └── README.md       ← optional: mô tả skill
```

`dw upgrade` copy tất cả skills trong thư mục này vào `.claude/skills/` (extensions không ghi đè skills đã customize).

## Ví dụ Skills Phù Hợp

- `/dw-deploy` — deployment workflow cho team
- `/dw-migration` — database migration helper
- `/dw-release` — release checklist
- `/dw-notify` — team notification integration

## Convention

- Tên folder = tên skill (kebab-case)
- SKILL.md theo format chuẩn (xem `.claude/skills/` cho examples)
- Tên skill nên bắt đầu bằng `dw-` để nhất quán

## Đóng góp cho community

Nếu skill hữu ích cho mọi team, submit PR vào toolkit repo.
Xem `docs/custom-skills.md` để biết hướng dẫn.
