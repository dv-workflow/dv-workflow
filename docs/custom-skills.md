# Hướng Dẫn Tạo Custom Skills

> Dùng khi team muốn thêm skill riêng chưa có trong bộ mặc định.
> Ví dụ: `/dw:deploy`, `/dw:migration`, `/dw:seed-data`.

---

## Convention

Custom skills tuân theo cùng convention với built-in skills:

```
.claude/skills/[skill-name]/SKILL.md
```

Tên skill phải bắt đầu bằng `dw-` để nhất quán với bộ toolkit.

---

## SKILL.md Template

Tạo file `.claude/skills/[tên-skill]/SKILL.md`:

```markdown
---
name: dw-[tên-skill]
description: "[Mô tả ngắn gọn — hiện trong danh sách skills]"
argument-hint: "[gợi ý argument, ví dụ: [env] hoặc [task-name]]"
user-invocable: true
---

# [Tên Skill]

## Đọc Config (nếu cần)

Đọc `.dw/config/dw.config.yml` để lấy config liên quan.

## Bước 1: [Tên bước]

[Mô tả hành động]

## Bước 2: [Tên bước]

[Mô tả hành động]

## Kết quả

[Mô tả output, files được tạo, hoặc thông báo]
```

---

## Ví Dụ: `/dw:deploy`

Tạo `.claude/skills/deploy/SKILL.md`:

```markdown
---
name: dw-deploy
description: "Deploy lên môi trường target. Chạy checks trước deploy, tạo release notes."
argument-hint: "[env: staging | production]"
user-invocable: true
---

# Deploy: $ARGUMENTS

## Điều Kiện Tiên Quyết

- Đọc `.dw/config/dw.config.yml` → lấy deploy config
- Kiểm tra không có uncommitted changes: `git status`
- Chạy tests lần cuối

## Bước 1: Pre-deploy checklist

- [ ] Tests pass
- [ ] No debug code
- [ ] Config đúng environment
- [ ] DB migrations đã sẵn sàng (nếu có)

## Bước 2: Deploy

[Điền lệnh deploy của team ở đây]

## Bước 3: Verify

[Smoke tests sau deploy]

## Bước 4: Ghi nhận

Cập nhật progress file nếu deploy là bước cuối của task.
```

---

## Ví Dụ: `/dw:db-migrate`

```markdown
---
name: dw-db-migrate
description: "Chạy database migrations. Kiểm tra migration files, backup trước khi chạy."
argument-hint: "[direction: up | down] [version]"
user-invocable: true
---

# DB Migration: $ARGUMENTS

## Bước 1: Kiểm tra

Liệt kê pending migrations: `[lệnh của project]`

## Bước 2: Backup (production only)

Nếu `$ARGUMENTS` chứa "production" → yêu cầu confirm backup trước.

## Bước 3: Chạy migration

`[lệnh migrate của project]`

## Bước 4: Verify

Kiểm tra schema sau migration.
```

---

## Best Practices

1. **Đọc config trước** — kiểm tra flags liên quan trước khi chạy
2. **Guard clauses** — dừng sớm nếu điều kiện không đủ (uncommitted changes, missing config...)
3. **Ghi nhận** — cập nhật progress file nếu skill là bước trong workflow
4. **Idempotent** — skill nên an toàn để chạy nhiều lần
5. **Clear output** — luôn thông báo rõ đã làm gì, kết quả gì

---

## Đóng Góp Skill Cho Community

Nếu skill có giá trị chung (không project-specific), có thể contribute:

1. Fork toolkit repo
2. Thêm SKILL.md vào `.claude/skills/[tên]/`
3. Thêm ví dụ vào `examples/`
4. Mở PR với mô tả use case

*(Community skill marketplace — xem roadmap v0.4.0)*
