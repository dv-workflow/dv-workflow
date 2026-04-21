# Plan: retroactive-skills

## Ngày tạo: 2026-03-28
## Trạng thái: Approved
## Approved by: user (confirmed qua dw-thinking session)

---

## Tóm Tắt Giải Pháp

Tạo 2 skills mới phục vụ adoption use case: `dw-onboard` cho việc onboard toàn bộ project đang chạy (breadth-first), và `dw-retroactive` cho việc document sâu một feature/task cụ thể (depth-first). Output của `dw-onboard` vào `.dw/context/` (tách khỏi task docs), output của `dw-retroactive` vào `.dw/tasks/[name]/` với as-built plan.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | 2 skills riêng: dw-onboard + dw-retroactive | Separation of concerns rõ ràng, scope khác nhau | Nhiều skills hơn | **Chọn** |
| 2 | Extend dw-research với flag --existing | Ít thay đổi hơn | Reactive, không systematic, mix concern | Loại |

## Subtasks

### ST-1: Tạo skill dw-onboard
- **Mô tả**: SKILL.md cho breadth-first project onboarding
- **Files**: `.claude/skills/dw-onboard/SKILL.md`
- **Criteria**:
  - [x] Scan codebase structure
  - [x] Tạo project-map.md vào `.dw/context/`
  - [x] Tạo per-module context docs
  - [x] Recommend `/dw-retroactive` cho modules phức tạp
- **Dependencies**: none

### ST-2: Tạo skill dw-retroactive
- **Mô tả**: SKILL.md cho depth-first single-feature documentation
- **Files**: `.claude/skills/dw-retroactive/SKILL.md`
- **Criteria**:
  - [x] Find files by keyword
  - [x] Read + analyze code
  - [x] Analyze git history
  - [x] Tạo full task docs (context + as-built plan + progress)
  - [x] Output "as-built" label thay vì "Draft/Approved"
- **Dependencies**: none

### ST-3: Update CLAUDE.md
- **Mô tả**: Thêm 2 skills vào bảng Skills
- **Files**: `CLAUDE.md`
- **Criteria**:
  - [ ] `dw-onboard` entry
  - [ ] `dw-retroactive` entry
- **Dependencies**: ST-1, ST-2

### ST-4: Update workflow-rules.md
- **Mô tả**: Thêm level requirements cho 2 skills mới
- **Files**: `.claude/rules/workflow-rules.md`
- **Criteria**:
  - [ ] Level requirement cho dw-onboard
  - [ ] Level requirement cho dw-retroactive
- **Dependencies**: ST-1, ST-2

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | dw-onboard output vào `.dw/context/` không conflict với existing structure | Thấp | Thấp | Thư mục mới, không overlap |
| 2 | Giả định | as-built plan docs không bị confuse với forward plans | Trung bình | Thấp | Label rõ ràng "As-Built (Retroactive)" |

## Edge Cases

- [ ] Project chưa có git history → dw-retroactive skip git analysis, chỉ dùng code
- [ ] `.dw/context/project-map.md` đã tồn tại → hỏi user trước khi overwrite
- [ ] Feature name không match bất kỳ file nào → hỏi user cung cấp thêm context
