---
name: dw-docs-update
description: "Cập nhật living docs khi code thay đổi. Phát hiện docs lỗi thời và cập nhật tự động. Dùng sau khi execute hoặc commit."
argument-hint: "[scope: all | architecture | api | models | task-name]"
---

# Cập Nhật Living Docs

Scope: **$ARGUMENTS**

## Đọc Config

Đọc `dv-workflow.config.yml` → kiểm tra:
- `flags.living_docs` — nếu `false` → thông báo "Living docs chưa bật" và DỪNG
- `paths.docs` → thư mục living docs (mặc định: `.dw/docs`)

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

### Bước 0: Scaffold (lần đầu chạy)

Nếu `{paths.docs}/` không tồn tại hoặc trống → tạo cấu trúc ban đầu:
```bash
mkdir -p {paths.docs}/modules
```
Tạo các file skeleton: `ARCHITECTURE.md`, `API.md`, `DATA-MODELS.md`, `DECISIONS.md`, `GLOSSARY.md`, `SETUP.md`.
Thông báo: "Khởi tạo living docs tại `{paths.docs}/` — lần chạy đầu tiên."

### Nếu scope = "all" hoặc không có argument

1. **Detect changes**:
   ```bash
   git diff --name-only HEAD~10   # 10 commits gần nhất
   git diff --name-only --cached  # staged changes
   ```

2. **Classify changes** theo pattern:
   | Pattern file | Docs cần update |
   |-------------|-----------------|
   | `*model*`, `*schema*`, `*migration*`, `*entity*` | `DATA-MODELS.md` |
   | `*route*`, `*controller*`, `*handler*`, `*endpoint*` | `API.md` |
   | `*config*`, `*app.*`, `package.json`, `*.yml` | `ARCHITECTURE.md` |
   | `*.md` trong project (không phải `.dw/docs/`) | Kiểm tra DECISIONS.md |
   | Thư mục mới xuất hiện | `ARCHITECTURE.md` + tạo `modules/[name].md` |

3. **Stale check**: Với mỗi doc cần update, đọc nội dung hiện tại, so sánh với code thực tế. Ghi rõ: "Phần X đang mô tả Y nhưng code hiện tại là Z."

4. **Update**: Chỉ cập nhật những gì thực sự lỗi thời. Thêm timestamp cuối mỗi update.

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
