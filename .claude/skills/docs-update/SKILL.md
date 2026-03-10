---
name: docs-update
description: "Cập nhật living docs khi code thay đổi. Phát hiện docs lỗi thời và cập nhật tự động. Dùng sau khi execute hoặc commit."
argument-hint: "[scope: all | architecture | api | models | task-name]"
---

# Cập Nhật Living Docs

Scope: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml` → kiểm tra:
- `flags.living_docs` — nếu `false` → thông báo "Living docs chưa bật" và DỪNG
- `paths.docs` → thư mục living docs (mặc định: `.dev-docs`)

## Living Docs Structure

```
{paths.docs}/
├── ARCHITECTURE.md      # Kiến trúc tổng quan hệ thống
├── API.md               # API endpoints & contracts
├── DATA-MODELS.md       # Database schema & data models
├── DECISIONS.md         # Architecture Decision Records (ADR)
├── GLOSSARY.md          # Thuật ngữ dự án
├── SETUP.md             # Hướng dẫn setup & chạy dự án
└── modules/
    └── [module-name].md # Docs riêng cho từng module
```

## Quy Trình

### Nếu scope = "all" hoặc không có argument

1. **Detect changes**: Chạy `git diff --name-only HEAD~5` (5 commits gần nhất)
2. **Classify changes**: Phân loại files thay đổi:
   - Schema/model files → cần update DATA-MODELS.md
   - Route/controller files → cần update API.md
   - Config/structure changes → cần update ARCHITECTURE.md
   - New patterns/decisions → cần update DECISIONS.md
3. **Check stale docs**: So sánh nội dung docs hiện tại với code thực tế
4. **Update**: Cập nhật từng doc file cần thiết

### Nếu scope = "architecture"
- Đọc cấu trúc thư mục, main config files, entry points
- Cập nhật ARCHITECTURE.md với cấu trúc hiện tại

### Nếu scope = "api"
- Grep tất cả route/endpoint definitions
- Cập nhật API.md với danh sách endpoints hiện tại

### Nếu scope = "models"
- Đọc schema definitions, migration files, model files
- Cập nhật DATA-MODELS.md

### Nếu scope = [task-name]
- Đọc progress file của task
- Cập nhật docs liên quan đến thay đổi của task

## Khi Tạo Doc Mới (lần đầu)

Nếu file doc chưa tồn tại → tạo mới với cấu trúc chuẩn:

### ARCHITECTURE.md
```markdown
# Kiến Trúc Hệ Thống

## Tổng Quan
[Mô tả high-level]

## Tech Stack
| Layer | Technology |
|-------|-----------|

## Cấu Trúc Thư Mục
[Tree structure]

## Modules
| Module | Vai trò | Entry point |
|--------|---------|-------------|

## Data Flow
[Diagram]

## Cập nhật lần cuối: [date]
```

### DECISIONS.md (ADR Format)
```markdown
# Architecture Decision Records

## ADR-001: [Tiêu đề]
- **Ngày**: [date]
- **Trạng thái**: Accepted | Superseded | Deprecated
- **Bối cảnh**: [Tại sao cần quyết định]
- **Quyết định**: [Đã chọn gì]
- **Hệ quả**: [Ảnh hưởng]
```

## Output

Sau khi cập nhật, báo cáo:
- Files đã cập nhật: [danh sách]
- Thay đổi chính: [tóm tắt]
- Docs vẫn có thể stale: [nếu có]
- Ghi timestamp "Cập nhật lần cuối" vào mỗi doc file
