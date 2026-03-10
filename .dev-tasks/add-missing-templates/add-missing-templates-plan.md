# Plan: add-missing-templates

## Ngày tạo: 2026-03-10
## Trạng thái: Approved
## Approved by: dev

---

## Tóm Tắt Giải Pháp

Tạo 3 supporting files còn thiếu trong skills `research`, `plan`, và `review`. Mỗi file là một template/checklist ngắn gọn, nhất quán với template gốc trong `templates/` nhưng được tối ưu để dùng làm context reference cho agent khi chạy skill.

## Phương Án Đã Xem Xét

| # | Phương án | Ưu điểm | Nhược điểm | Chọn? |
|---|-----------|---------|------------|-------|
| 1 | Tạo file template riêng trong từng skill dir | Encapsulated, dễ maintain theo skill | Thêm files | **Chọn** |
| 2 | Dùng `@templates/task-*.md` trong SKILL.md | Ít file hơn | Coupling giữa skills và templates root, format không khớp | Loại |

## Subtasks

### ST-1: Tạo `research/template-research.md`
- **Mô tả**: Template output format cho researcher agent — ngắn gọn hơn `task-context.md` vì là working template
- **Files**: `.claude/skills/research/template-research.md`
- **Acceptance Criteria**:
  - [ ] File tồn tại trong đúng thư mục
  - [ ] Có đầy đủ sections: Files Liên Quan, Kiến Trúc, Dependencies, Giả Định, Chưa rõ
  - [ ] Nhất quán với format `task-context.md`
- **Dependencies**: none
- **Estimate**: 30 phút

### ST-2: Tạo `plan/template-plan.md`
- **Mô tả**: Template format cho plan output của skill `/plan`
- **Files**: `.claude/skills/plan/template-plan.md`
- **Acceptance Criteria**:
  - [ ] Có sections: Tóm tắt, Phương án, Subtasks, Rủi ro, Edge cases, Tác động
  - [ ] Nhất quán với `templates/task-plan.md` gốc
- **Dependencies**: none
- **Estimate**: 30 phút

### ST-3: Tạo `review/checklist.md`
- **Mô tả**: Checklist review chi tiết cho reviewer agent — phân loại theo loại issue
- **Files**: `.claude/skills/review/checklist.md`
- **Acceptance Criteria**:
  - [ ] Có sections: Correctness, Security, Performance, Tests, Conventions
  - [ ] Phân loại Critical / Warning / Suggestion
  - [ ] Actionable — mỗi item có thể check được
- **Dependencies**: none
- **Estimate**: 30 phút

## Rủi Ro & Giả Định

| # | Loại | Mô tả | Xác suất | Tác động | Giảm thiểu |
|---|------|--------|----------|----------|------------|
| 1 | Giả định | Templates sẽ được Claude Code load khi skill reference đến | Thấp | Thấp | Test thủ công sau khi tạo |

## Edge Cases

- [ ] Nếu skill không load được template → agent vẫn hoạt động, chỉ thiếu format guide

## Tác Động Hệ Thống

- **Modules bị ảnh hưởng**: research, plan, review skills
- **API changes**: Không
- **Breaking changes**: Không

## Estimation Tổng

| Phase | Estimate |
|-------|----------|
| Research | done |
| Planning | done |
| Coding | 1.5h |
| **Total** | **~2h** |
