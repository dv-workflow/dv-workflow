---
name: dw-config-init
description: "Khởi tạo dv-workflow-kit cho dự án mới. Tạo config file, thư mục, và cấu trúc cần thiết."
argument-hint: "[project-name]"
---

# Khởi Tạo dv-workflow-kit

Thiết lập toolkit cho dự án: **$ARGUMENTS**

## Quy Trình

### 1. Hỏi thông tin cơ bản

Nếu chưa có đủ thông tin, hỏi user:
- **Project type**: `new-product` hay `old-maintenance`?
- **Level**: 1 (lite), 2 (standard), hay 3 (full)?
- **Team roles**: Những role nào tham gia? (dev, techlead, ba, qc, pm)

### 2. Tạo config file

Copy `dv-workflow.config.yml` vào root dự án.
Cập nhật các giá trị:
- `project.name` = tên dự án
- `project.type` = loại dự án
- `level` = level đã chọn

Nếu **new-product**:
```yaml
level: 2
flags:
  research: true
  plan: true
  execute: true
  commit: true
  review: true
  living_docs: false    # Bật lên level 3
  estimation: true
  log_work: true
```

Nếu **old-maintenance**:
```yaml
level: 1
flags:
  research: true
  plan: "skip"          # Optional cho bug fixes
  execute: true
  commit: true
  review: "skip"
  debug: true
  estimation: "skip"
  log_work: "skip"
```

### 3. Tạo thư mục

```bash
mkdir -p .dev-tasks .dev-docs .dev-metrics .dev-reports
```

### 4. Auto-enable role flags

Nếu team có `ba` → bật `requirements_skill: true`
Nếu team có `qc` → bật `test_plan_skill: true`
Nếu team có `techlead` → bật `arch_review_skill: true`
Nếu team có `pm` → bật `dashboard_skill: true`

### 5. Thông báo kết quả

Hiển thị:
- Config đã tạo với settings gì
- Danh sách skills có sẵn (dựa trên flags)
- Hướng dẫn bước tiếp theo
- Gợi ý: "Chạy `/dw-task-init [tên-task]` để bắt đầu task đầu tiên"
